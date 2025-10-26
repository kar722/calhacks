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
    """
    context_parts = []
    
    # Current Status
    context_parts.append("CURRENT STATUS:")
    context_parts.append(f"- Currently serving a sentence: {user_data.get('serving_sentence', 'Unknown')}")
    context_parts.append(f"- Currently on probation: {user_data.get('on_probation', 'Unknown')}")
    context_parts.append(f"- Currently charged with a crime: {user_data.get('pending_charges', 'Unknown')}")
    
    # Probation Details
    context_parts.append("\nPROBATION DETAILS:")
    context_parts.append(f"- Probation was granted: {user_data.get('probation_granted', 'Unknown')}")
    context_parts.append(f"- Probation completed: {user_data.get('probation_completed', 'Unknown')}")
    context_parts.append(f"- All probation conditions fulfilled: {user_data.get('probation_conditions_met', 'Unknown')}")
    
    # Financial
    context_parts.append("\nFINANCIAL OBLIGATIONS:")
    context_parts.append(f"- All fines paid: {user_data.get('fines_paid', 'Unknown')}")
    context_parts.append(f"- All restitution paid: {user_data.get('restitution_paid', 'Unknown')}")
    
    # Case Details (if available)
    if 'conviction_type' in user_data:
        context_parts.append("\nCASE DETAILS:")
        context_parts.append(f"- Conviction type: {user_data.get('conviction_type', 'Unknown')}")
        context_parts.append(f"- Conviction date: {user_data.get('conviction_date', 'Unknown')}")
        context_parts.append(f"- Charges: {user_data.get('charges', 'Unknown')}")
    
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
    prompt = f"""You are an expert on California expungement law. Analyze the user's eligibility for expungement.

ELIGIBILITY CRITERIA FROM CALIFORNIA LAW:
{context_text}

USER'S CASE INFORMATION:
{user_context}

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
- If ELIGIBLE: next_steps should be filing steps (Download report, Complete forms, File with court)
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


# ============================================================================
# TEST CASES - Mock data for testing
# ============================================================================

MOCK_ELIGIBLE_USER = {
    "serving_sentence": False,
    "on_probation": False,
    "pending_charges": False,
    "probation_granted": True,
    "probation_completed": True,
    "probation_conditions_met": True,
    "fines_paid": True,
    "restitution_paid": True,
    "conviction_type": "misdemeanor",
    "conviction_date": "2020-05-15",
    "charges": "PC 496 - Receiving Stolen Property"
}

MOCK_INELIGIBLE_USER = {
    "serving_sentence": False,
    "on_probation": True,  # Still on probation = not eligible
    "pending_charges": False,
    "probation_granted": True,
    "probation_completed": False,  # Not completed
    "probation_conditions_met": False,
    "fines_paid": False,  # Hasn't paid fines
    "restitution_paid": False,
    "conviction_type": "misdemeanor",
    "conviction_date": "2023-01-15",
    "charges": "PC 484 - Petty Theft"
}

MOCK_EDGE_CASE_USER = {
    "serving_sentence": False,
    "on_probation": False,
    "pending_charges": True,  # Has pending charges = not eligible
    "probation_granted": True,
    "probation_completed": True,
    "probation_conditions_met": True,
    "fines_paid": True,
    "restitution_paid": True,
    "conviction_type": "misdemeanor",
    "conviction_date": "2019-03-20",
    "charges": "PC 415 - Disturbing the Peace"
}


def run_tests():
    """Run test cases to demonstrate the RAG system"""
    
    # Test Case 1: Eligible User
    result1 = check_eligibility(MOCK_ELIGIBLE_USER)
    # Remove retrieved_chunks for cleaner output
    result1_clean = {k: v for k, v in result1.items() if k != 'retrieved_chunks'}
    print("\n=== TEST CASE 1: ELIGIBLE USER ===")
    print(json.dumps(result1_clean, indent=2))
    
    # Test Case 2: Ineligible User
    result2 = check_eligibility(MOCK_INELIGIBLE_USER)
    result2_clean = {k: v for k, v in result2.items() if k != 'retrieved_chunks'}
    print("\n=== TEST CASE 2: INELIGIBLE USER ===")
    print(json.dumps(result2_clean, indent=2))
    
    # Test Case 3: Edge Case
    result3 = check_eligibility(MOCK_EDGE_CASE_USER)
    result3_clean = {k: v for k, v in result3.items() if k != 'retrieved_chunks'}
    print("\n=== TEST CASE 3: EDGE CASE - PENDING CHARGES ===")
    print(json.dumps(result3_clean, indent=2))


if __name__ == "__main__":
    # Check if OpenAI API key is set
    if not os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY") == "your-openai-api-key-here":
        print("❌ ERROR: Please set your OPENAI_API_KEY in the .env file")
        print("\n1. Open .env file")
        print("2. Replace 'your-openai-api-key-here' with your actual OpenAI API key")
        print("3. Run this script again")
    else:
        run_tests()

