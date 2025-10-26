"""
California Expungement API - Unified Backend
Combines PDF extraction and RAG eligibility checking in one FastAPI application
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional
import os
import tempfile
import shutil
import logging

from services.pdf_service import extract_text_from_pdf, parse_with_gemini
from services.rag_service import check_eligibility

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="California Expungement API",
    description="Unified API for PDF document extraction and expungement eligibility checking",
    version="1.0.0"
)

# CORS configuration - allow frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Helper Functions
# ============================================================================

def _parse_upload(file: UploadFile) -> dict:
    """
    Parse a single uploaded PDF file
    
    Args:
        file: Uploaded PDF file
        
    Returns:
        Dictionary with parsed case information or error details
    """
    suffix = os.path.splitext(file.filename)[1]
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        raw_text = extract_text_from_pdf(tmp_path)
        if len(raw_text) > 100_000:
            raw_text = raw_text[:100_000] + "\n\n[TRUNCATED]"

        result = parse_with_gemini(raw_text)

        # === If Gemini failed or returned error ===
        if "error" in result or "raw_response" in result:
            return {
                "city_or_county": None,
                "case_number": None,
                "name": None,
                "date_to_appear": None,
                "violations_charged_with": [],
                "sentencing": None,
                "fine": None,
                "further_instruction": None,
                "report_number": None,
                "date_of_incident": None,
                "officer": None,
                "location_of_occurrence": None,
                "error": f"Failed to parse {file.filename}: {result.get('error', 'Invalid JSON')}"
            }

        return result

    except Exception as e:
        return {
            "city_or_county": None,
            "case_number": None,
            "name": None,
            "date_to_appear": None,
            "violations_charged_with": [],
            "sentencing": None,
            "fine": None,
            "further_instruction": None,
            "report_number": None,
            "date_of_incident": None,
            "officer": None,
            "location_of_occurrence": None,
            "error": f"Crash in {file.filename}: {str(e)}"
        }
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except:
                pass  # ignore cleanup errors


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "California Expungement API",
        "version": "1.0.0",
        "endpoints": {
            "pdf_parser": "POST /pdf-parser",
            "check_eligibility": "POST /check-eligibility",
            "health": "GET /health"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "california-expungement-api"
    }


@app.post("/pdf-parser", response_class=JSONResponse)
async def pdf_parser_endpoint(
    summons: Optional[UploadFile] = File(None),
    sentencing: Optional[UploadFile] = File(None),
    police: Optional[UploadFile] = File(None),
):
    """
    Extract and merge case information from up to 3 court document PDFs.
    
    **Accepts:**
    - summons: Optional PDF file (California Summons to Appear)
    - sentencing: Optional PDF file (California Sentencing Order)
    - police: Optional PDF file (Police Report)
    
    **Returns:**
    - Merged case document with all extracted fields
    - parsing_errors: List of errors if any parsing failed
    """
    logger.info("PDF parser endpoint called")
    
    raw = {}
    if summons:     
        logger.info(f"Processing summons: {summons.filename}")
        raw["summons"] = _parse_upload(summons)
    if sentencing:  
        logger.info(f"Processing sentencing: {sentencing.filename}")
        raw["sentencing"] = _parse_upload(sentencing)
    if police:      
        logger.info(f"Processing police report: {police.filename}")
        raw["police"] = _parse_upload(police)

    if not raw:
        raise HTTPException(status_code=400, detail="At least one PDF is required.")

    # === MERGE LOGIC ===
    final = {}
    sources = ["summons", "sentencing", "police"]
    fields = [
        "city_or_county", "case_number", "name", "date_to_appear",
        "violations_charged_with", "sentencing", "fine", "further_instruction",
        "report_number", "date_of_incident", "officer", "location_of_occurrence"
    ]

    for field in fields:
        for src in sources:
            val = raw.get(src, {}).get(field)
            if val not in (None, "", [], {}) and val is not None:
                final[field] = val
                break
        else:
            final[field] = None

    # Prefer sentencing's further_instruction
    if raw.get("sentencing", {}).get("further_instruction"):
        final["further_instruction"] = raw["sentencing"]["further_instruction"]

    # === COLLECT ERRORS ===
    errors = [v.get("error") for v in raw.values() if v.get("error")]
    if errors:
        final["parsing_errors"] = errors

    logger.info(f"PDF parsing complete. Case number: {final.get('case_number', 'Unknown')}")
    
    return final


@app.post("/check-eligibility")
async def check_eligibility_endpoint(user_data: dict):
    """
    Check if a user is eligible for expungement based on their case information.
    
    Uses RAG (Retrieval Augmented Generation) with California expungement law 
    knowledge base to determine eligibility.
    
    **Expected input:** JSON object with user's case information (can be merged 
    output from /pdf-parser endpoint plus questionnaire answers)
    
    **Returns:** 
    {
        "eligible": true/false,
        "confidence": 0-100,
        "key_findings": [
            {
                "title": "Finding title",
                "description": "Finding description"
            }
        ],
        "next_steps": [
            "Step 1 description",
            "Step 2 description"
        ],
        "retrieved_chunks": [...]
    }
    
    - If ELIGIBLE: next_steps will be filing instructions
    - If INELIGIBLE: next_steps will be pathway to become eligible
    """
    try:
        logger.info("Checking eligibility for user")
        
        # Call RAG service (handles both eligible and ineligible cases)
        result = check_eligibility(user_data)
        
        logger.info(f"Eligibility check complete: eligible={result['eligible']}")
        
        return result
        
    except Exception as e:
        logger.error(f"Error checking eligibility: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing eligibility check: {str(e)}"
        )


# ============================================================================
# Run with: uvicorn backend.main:app --reload --port 8000
# Or from backend/: uvicorn main:app --reload --port 8000
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

