"""
ChromaDB Initialization Script
Populates the vector database with expungement knowledge base documents

Run this script ONCE before starting the backend server for the first time.
"""

import chromadb
from chromadb.config import Settings
import re
from pathlib import Path
import os
from dotenv import load_dotenv

# Load environment variables from backend/.env
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Initialize ChromaDB client with persistent storage
chroma_db_path = Path(__file__).parent.parent / "chroma_db"
chroma_client = chromadb.PersistentClient(path=str(chroma_db_path))

# Create embedding function - MUST match what rag_service.py uses
embedding_function = chromadb.utils.embedding_functions.OpenAIEmbeddingFunction(
    api_key=os.getenv("OPENAI_API_KEY"),
    model_name="text-embedding-3-small"
)

# Create or get the expungement collection
collection = chroma_client.get_or_create_collection(
    name="expungement_knowledge_base",
    metadata={"description": "California expungement eligibility and process information"},
    embedding_function=embedding_function
)

def extract_penal_codes(text):
    """Extract penal code references from text (e.g., PC 1203.4, BPC 1203.4a)"""
    # Matches patterns like "PC 1203.4", "BPC 1203.4a", etc.
    patterns = [
        r'[A-Z]*\s*PC\s+\d+\.?\d*[a-z]*',
        r'Penal Code(?:\s+section|\s+§)?\s+\d+\.?\d*[a-z]*'
    ]
    codes = []
    for pattern in patterns:
        codes.extend(re.findall(pattern, text, re.IGNORECASE))
    # ChromaDB metadata only accepts scalar values, so convert list to comma-separated string
    unique_codes = list(set(codes))
    return ', '.join(unique_codes) if unique_codes else None

def chunk_eligibility_document(file_path):
    """
    Semantically chunk the eligibility.txt file into:
    - Positive eligibility criteria
    - Negative eligibility criteria (ineligibility conditions)
    """
    with open(file_path, 'r') as f:
        content = f.read()
    
    chunks = []
    
    # Split into positive and negative criteria
    parts = content.split('You are NOT eligible if:')
    
    # Process positive eligibility criteria
    if len(parts) > 0:
        positive_section = parts[0].strip()
        lines = positive_section.split('\n')
        
        # Group the positive criteria
        criteria_lines = [line for line in lines if line.strip().startswith('+') or line.strip().startswith('«')]
        intro = '\n'.join([line for line in lines if not line.strip().startswith('+') and not line.strip().startswith('«')])
        
        # Add intro as its own chunk
        if intro.strip():
            chunks.append({
                'text': intro.strip(),
                'metadata': {
                    'doc_type': 'eligibility_overview',
                    'penal_codes': extract_penal_codes(intro),
                    'category': 'introduction'
                },
                'id': 'eligibility_intro'
            })
        
        # Add each criterion separately
        for idx, criterion in enumerate(criteria_lines):
            if criterion.strip():
                chunks.append({
                    'text': criterion.strip(),
                    'metadata': {
                        'doc_type': 'eligibility_positive',
                        'penal_codes': extract_penal_codes(criterion),
                        'criterion_number': idx + 1
                    },
                    'id': f'eligibility_positive_{idx + 1}'
                })
    
    # Process negative eligibility criteria (ineligibility conditions)
    if len(parts) > 1:
        negative_section = parts[1].strip()
        # Split by bullet points
        ineligibility_conditions = [line.strip() for line in negative_section.split('\n') if line.strip().startswith('*') or line.strip().startswith('+')]
        
        for idx, condition in enumerate(ineligibility_conditions):
            if condition.strip():
                chunks.append({
                    'text': f"You are NOT eligible if: {condition.strip()}",
                    'metadata': {
                        'doc_type': 'eligibility_negative',
                        'penal_codes': extract_penal_codes(condition),
                        'condition_number': idx + 1
                    },
                    'id': f'eligibility_negative_{idx + 1}'
                })
    
    return chunks

def chunk_form_document(file_path, form_type):
    """
    Chunk form documents by semantic sections.
    form_type: 'petition' or 'order'
    """
    with open(file_path, 'r') as f:
        content = f.read()
    
    chunks = []
    
    # Split by numbered sections (e.g., "1.", "2.", etc.)
    # Forms have clear section numbers
    sections = re.split(r'\n(\d{1,2})\.\s+(?=[A-Z])', content)
    
    # First part is the header
    if sections[0].strip():
        chunks.append({
            'text': sections[0].strip(),
            'metadata': {
                'doc_type': f'form_{form_type}',
                'section': 'header',
                'form_name': 'CR-180' if form_type == 'petition' else 'CR-181'
            },
            'id': f'form_{form_type}_header'
        })
    
    # Process numbered sections
    for i in range(1, len(sections), 2):
        if i + 1 < len(sections):
            section_num = sections[i]
            section_text = sections[i + 1].strip()
            
            if section_text:
                chunks.append({
                    'text': f"Section {section_num}: {section_text}",
                    'metadata': {
                        'doc_type': f'form_{form_type}',
                        'section': f'section_{section_num}',
                        'section_number': int(section_num),
                        'penal_codes': extract_penal_codes(section_text),
                        'form_name': 'CR-180' if form_type == 'petition' else 'CR-181'
                    },
                    'id': f'form_{form_type}_section_{section_num}'
                })
    
    return chunks

def chunk_pathway_document(file_path):
    """
    Chunk the pathway.txt file - each step as a separate chunk
    """
    with open(file_path, 'r') as f:
        content = f.read()
    
    chunks = []
    lines = [line.strip() for line in content.split('\n') if line.strip()]
    
    # First line is the header
    header = lines[0] if lines else ""
    
    # Rest are steps
    steps = lines[1:] if len(lines) > 1 else []
    
    # Add header
    if header:
        chunks.append({
            'text': header,
            'metadata': {
                'doc_type': 'pathway',
                'section': 'header'
            },
            'id': 'pathway_header'
        })
    
    # Add each step
    for idx, step in enumerate(steps):
        chunks.append({
            'text': step,
            'metadata': {
                'doc_type': 'pathway',
                'section': 'step',
                'step_number': idx + 1
            },
            'id': f'pathway_step_{idx + 1}'
        })
    
    return chunks

def populate_knowledge_base():
    """
    Load and chunk all documents, then add to ChromaDB
    """
    all_chunks = []
    
    # Get base path - data files are in backend/data/
    base_path = Path(__file__).parent.parent / 'data'
    
    print("📚 Chunking eligibility document...")
    eligibility_chunks = chunk_eligibility_document(base_path / 'eligibility.txt')
    all_chunks.extend(eligibility_chunks)
    print(f"   ✓ Created {len(eligibility_chunks)} chunks")
    
    print("📚 Chunking expungement petition form...")
    petition_chunks = chunk_form_document(base_path / 'expungement_form.txt', 'petition')
    all_chunks.extend(petition_chunks)
    print(f"   ✓ Created {len(petition_chunks)} chunks")
    
    print("📚 Chunking judge order form...")
    order_chunks = chunk_form_document(base_path / 'judge_form.txt', 'order')
    all_chunks.extend(order_chunks)
    print(f"   ✓ Created {len(order_chunks)} chunks")
    
    print("📚 Chunking pathway document...")
    pathway_chunks = chunk_pathway_document(base_path / 'pathway.txt')
    all_chunks.extend(pathway_chunks)
    print(f"   ✓ Created {len(pathway_chunks)} chunks")
    
    print(f"\n📊 Total chunks created: {len(all_chunks)}")
    
    # Prepare data for ChromaDB
    documents = [chunk['text'] for chunk in all_chunks]
    metadatas = [chunk['metadata'] for chunk in all_chunks]
    ids = [chunk['id'] for chunk in all_chunks]
    
    # Upsert to collection
    print("\n💾 Adding chunks to ChromaDB...")
    collection.upsert(
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )
    print("   ✓ Successfully added all chunks to the knowledge base!")
    
    return len(all_chunks)

def get_collection_stats():
    """Get statistics about the collection"""
    count = collection.count()
    print(f"\n📊 Collection Statistics:")
    print(f"   Total chunks in database: {count}")
    
    # Get sample to show metadata structure
    sample = collection.get(limit=1, include=['metadatas'])
    if sample['metadatas']:
        print(f"   Example metadata structure: {sample['metadatas'][0]}")

# Main execution
if __name__ == "__main__":
    print("🚀 Expungement RAG System - ChromaDB Initialization")
    print("="*70)
    
    # Check if collection is already populated
    current_count = collection.count()
    
    if current_count == 0:
        print("📚 Collection is empty. Populating knowledge base...")
        total_chunks = populate_knowledge_base()
    else:
        print(f"✅ Collection already contains {current_count} chunks.")
        user_input = input("   Do you want to repopulate? (y/n): ").lower()
        if user_input == 'y':
            print("   Clearing existing data and repopulating...")
            # Delete all documents
            existing_ids = collection.get()['ids']
            if existing_ids:
                collection.delete(ids=existing_ids)
            total_chunks = populate_knowledge_base()
        else:
            print("   Keeping existing data.")
    
    # Show collection stats
    get_collection_stats()
    
    print("\n" + "="*70)
    print("✅ ChromaDB Initialization Complete!")
    print("\n💡 Next Steps:")
    print("   • Start the backend server: uvicorn backend.main:app --reload --port 8000")
    print("   • Test the endpoints with sample data")
    print("="*70)

