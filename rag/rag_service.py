"""
Expungement Eligibility RAG Service
Uses LangChain + ChromaDB + OpenAI to determine eligibility for expungement
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
import json

# Load environment variables - look for .env in the same directory as this file
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# Initialize OpenAI
llm = ChatOpenAI(
    model="gpt-4o-mini",  # Faster and cheaper than gpt-4, great for POC
    temperature=0.1,  # Low temperature for consistent legal analysis
    api_key=os.getenv("OPENAI_API_KEY")
)

# Initialize ChromaDB vector store
# Use same embedding model as main.py to avoid dimension mismatch
vectorstore = Chroma(
    collection_name="expungement_knowledge_base",
    persist_directory="./rag/chroma_db",
    embedding_function=OpenAIEmbeddings(model="text-embedding-3-small")
)


def format_user_context(user_data: dict) -> str:
    """
    Convert user data dictionary into structured text for the LLM
    Handles merged JSON from court documents + questionnaire
    """
    context_parts = []
    
    # Case Information
    context_parts.append("CASE INFORMATION:")
    context_parts.append(f"- Case Number: {user_data.get('case_number', 'Unknown')}")
    context_parts.append(f"- Court: {user_data.get('city_or_county', 'Unknown')}")
    context_parts.append(f"- Defendant Name: {user_data.get('name', 'Unknown')}")
    
    # Conviction Details
    context_parts.append("\nCONVICTION DETAILS:")
    context_parts.append(f"- Conviction Type: {user_data.get('conviction_type', 'Unknown')}")
    context_parts.append(f"- Conviction Date: {user_data.get('date', 'Unknown')}")
    
    # Format violations/charges
    violations = user_data.get('violations_charged_with', [])
    if violations:
        violations_str = ', '.join(violations) if isinstance(violations, list) else violations
        context_parts.append(f"- Charges: {violations_str}")
    
    # Sentencing Information
    if 'sentencing' in user_data:
        context_parts.append(f"- Sentencing: {user_data.get('sentencing')}")
    
    if 'fine' in user_data:
        context_parts.append(f"- Fine Amount: ${user_data.get('fine', 0)}")
    
    if 'further_instruction' in user_data:
        context_parts.append(f"- Special Conditions: {user_data.get('further_instruction')}")
    
    # Current Status (from questionnaire) - BE EXPLICIT
    context_parts.append("\nCURRENT STATUS:")
    context_parts.append(f"- Currently serving sentence: No" if not user_data.get('pending_charges_or_cases') else f"- Currently serving sentence: Unknown")
    context_parts.append(f"- Currently on probation: No" if user_data.get('terms_of_service_completed') else f"- Currently on probation: Yes or Unknown")
    context_parts.append(f"- Pending charges or cases: {'Yes - DISQUALIFIED' if user_data.get('pending_charges_or_cases') else 'No'}")
    context_parts.append(f"- All probation terms completed: {'Yes' if user_data.get('terms_of_service_completed') else 'No - DISQUALIFIED'}")
    context_parts.append(f"- Other convictions on record: {'Yes' if user_data.get('other_convictions') else 'No'}")
    
    return "\n".join(context_parts)


def check_eligibility(user_data: dict) -> dict:
    """
    Main RAG function to check expungement eligibility
    
    Args:
        user_data: Dictionary containing user's case information and answers
        
    Returns:
        Dictionary with eligibility determination, reasoning, and next steps
    """
    
    # Format user context
    user_context = format_user_context(user_data)
    
    # Retrieve relevant documents from ChromaDB
    query = f"eligibility requirements for expungement probation status {user_data.get('conviction_type', 'misdemeanor')}"
    retrieved_docs = vectorstore.similarity_search(query, k=5)
    
    # Format retrieved documents
    context_text = "\n\n".join([
        f"[Source: {doc.metadata.get('doc_type', 'unknown')}]\n{doc.page_content}"
        for doc in retrieved_docs
    ])
    
    # Create the prompt
    prompt = f"""You are an expert on California expungement law under PC 1203.4. Analyze the user's eligibility for expungement.

ELIGIBILITY CRITERIA FROM CALIFORNIA LAW:
{context_text}

USER'S CASE INFORMATION:
{user_context}

CRITICAL ELIGIBILITY RULES:
1. Under PC 1203.4: ANY misdemeanor where ALL probation conditions are completed IS ELIGIBLE (unless specifically excluded)
2. Only these specific crimes are excluded: PC 286(c), PC 288, PC 288a(c), PC 288.5, PC 289(j), VC 2800, VC 2801, VC 2803
3. Disqualifying factors: currently serving sentence, currently on probation, pending charges, probation revoked

Return ONLY a JSON object (no other text) with the following structure:

{{
    "eligible": true or false,
    "confidence": numeric score from 0-100,
    "key_findings": [
        {{
            "title": "Conviction Type Eligible" OR "Conviction Type Not Eligible",
            "description": "Explain if their conviction type qualifies for expungement"
        }},
        {{
            "title": "Waiting Period Met" OR "Waiting Period Not Met",
            "description": "Explain if sufficient time has passed since conviction/sentence completion"
        }},
        {{
            "title": "No Disqualifying Factors" OR "Disqualifying Factors",
            "description": "Explain if there are any factors preventing expungement (pending charges, on probation, etc.)"
        }}
    ],
    "next_steps": [
        "step 1 description",
        "step 2 description",
        "step 3 description"
    ]
}}

IMPORTANT RULES:
- If ELIGIBLE: next_steps should be filing steps (Download CR-180 form, Complete form, File with court)
- If NOT ELIGIBLE: next_steps should be pathway steps to become eligible
- Return ONLY the JSON object, no other text before or after
- confidence should be numeric (90-100 for high confidence, 60-89 for medium, 0-59 for low)

JSON Response:"""
    
    # Call the LLM
    response = llm.invoke(prompt)
    llm_response = response.content
    
    # Parse the LLM response
    try:
        # Try to extract JSON from the response
        start_idx = llm_response.find('{')
        end_idx = llm_response.rfind('}') + 1
        
        if start_idx != -1 and end_idx > start_idx:
            json_str = llm_response[start_idx:end_idx]
            parsed_response = json.loads(json_str)
        else:
            # Fallback if JSON parsing fails
            parsed_response = {
                "eligible": "not eligible" not in llm_response.lower(),
                "confidence": 50,
                "key_findings": [
                    {"title": "Analysis Error", "description": "Unable to parse eligibility response"}
                ],
                "next_steps": ["Contact support for manual review"]
            }
    except json.JSONDecodeError as e:
        # If JSON parsing fails, return error response
        parsed_response = {
            "eligible": False,
            "confidence": 0,
            "key_findings": [
                {"title": "Processing Error", "description": f"Error parsing response: {str(e)}"}
            ],
            "next_steps": ["Contact support for manual review"]
        }
    
    # Add retrieved source documents
    parsed_response['retrieved_chunks'] = [
        {
            "content": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
            "metadata": doc.metadata
        }
        for doc in retrieved_docs
    ]
    
    return parsed_response


def get_pathway_to_eligibility(user_data: dict) -> dict:
    """
    If user is not eligible, determine pathway to become eligible
    """
    
    # Query specifically for pathway information
    retrieved_docs = vectorstore.similarity_search(
        "steps to become eligible pathway requirements",
        k=5,
        filter={"doc_type": "pathway"}
    )
    
    user_context = format_user_context(user_data)
    
    # Format retrieved documents
    context_text = "\n\n".join([
        f"[Pathway Step]\n{doc.page_content}"
        for doc in retrieved_docs
    ])
    
    # Create prompt
    prompt = f"""You are an expert on California expungement law helping someone become eligible for expungement.

PATHWAY INFORMATION:
{context_text}

USER'S CURRENT STATUS:
{user_context}

Based on the pathway information and the user's current status, provide a clear action plan for them to become eligible.

Provide your answer in JSON format:
{{
    "pathway_available": true or false,
    "required_steps": ["step 1", "step 2", ...],
    "estimated_timeline": "X months/years",
    "additional_notes": "Any important information"
}}

Answer:"""
    
    # Call the LLM
    response = llm.invoke(prompt)
    llm_response = response.content
    
    # Parse response
    try:
        start_idx = llm_response.find('{')
        end_idx = llm_response.rfind('}') + 1
        
        if start_idx != -1 and end_idx > start_idx:
            json_str = llm_response[start_idx:end_idx]
            parsed_response = json.loads(json_str)
        else:
            parsed_response = {
                "pathway_available": True,
                "required_steps": ["Complete all conditions listed in pathway.txt"],
                "estimated_timeline": "Unknown",
                "additional_notes": llm_response
            }
    except:
        parsed_response = {
            "pathway_available": True,
            "required_steps": ["See pathway information"],
            "estimated_timeline": "Unknown",
            "additional_notes": llm_response
        }
    
    return parsed_response
