"""
FastAPI wrapper for Expungement Eligibility RAG Service
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .rag_service import check_eligibility
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Expungement Eligibility API",
    description="AI-powered California expungement eligibility checker using RAG",
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
# API Endpoints
# ============================================================================

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "Expungement Eligibility API",
        "version": "1.0.0",
        "endpoints": {
            "check_eligibility": "/api/check-eligibility",
            "health": "/health"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "expungement-eligibility-api"
    }


@app.post("/api/check-eligibility")
async def check_eligibility_endpoint(user_data: dict):
    """
    Check if a user is eligible for expungement based on their case information.
    
    Returns eligibility determination with:
    - If ELIGIBLE: next_steps will be filing instructions
    - If INELIGIBLE: next_steps will be pathway to become eligible
    
    **Expected input:** JSON object with user's case information
    
    **Returns:** 
    {
        "eligible": true/false,
        "confidence": 0-100,
        "key_findings": [...],
        "next_steps": [...]
    }
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
# Run with: uvicorn rag.api:app --reload --port 8000
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

