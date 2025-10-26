# pdf_service.py
"""
PDF Extraction Service
Extracts text from court documents and parses with Gemini AI
"""

import json
import os
import google.generativeai as genai
from google.generativeai import GenerativeModel
from PyPDF2 import PdfReader
from dotenv import load_dotenv
from pathlib import Path

# ----------------------------------------------------------------------
# 1. Load API key from backend/.env
# ----------------------------------------------------------------------
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    raise ValueError("No API key found. Ensure backend/.env has GOOGLE_API_KEY=<your key>")

genai.configure(api_key=API_KEY)

# ----------------------------------------------------------------------
# 2. Extract text from PDF
# ----------------------------------------------------------------------
def extract_text_from_pdf(pdf_path):
    """
    Extract all text from a PDF file
    
    Args:
        pdf_path: Path to PDF file
        
    Returns:
        Extracted text string with page separators
    """
    reader = PdfReader(pdf_path)
    text = ""
    for page_num, page in enumerate(reader.pages, start=1):
        page_text = page.extract_text() or ""
        text += f"\n--- Page {page_num} ---\n{page_text}"
    return text

# ----------------------------------------------------------------------
# 3. Parse with Gemini – STRIP CODE BLOCKS + SAFE JSON
# ----------------------------------------------------------------------
def parse_with_gemini(text):
    """
    Parse extracted text using Gemini AI to extract structured case data
    
    Args:
        text: Raw text extracted from PDF
        
    Returns:
        Dictionary with parsed case information or error details
    """
    prompt = f"""
You are a legal document extraction expert.

Extract **only** these fields from the document below.
Return **only** valid JSON — no explanations, no markdown.

Use `null` for missing values. Dates must be in `YYYY-MM-DD` format.

Required fields:
- city_or_county (string)
- case_number (string)
- name (string)
- date_to_appear (string, YYYY-MM-DD)

Optional fields:
- violations_charged_with (array of strings)
- sentencing (string or null)
- fine (number or null)
- further_instruction (string or null)
- report_number (string or null)
- date_of_incident (string, YYYY-MM-DD or null)
- officer (string or null)
- location_of_occurrence (string or null)

Text:
{text}

Return ONLY the JSON object.
"""

    model = GenerativeModel("gemini-2.5-flash")

    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json"
            ),
        )

        raw = response.text.strip()

        # === STRIP CODE BLOCKS ===
        if raw.startswith("```"):
            lines = raw.splitlines()
            if len(lines) > 1 and lines[0].strip().lower().startswith("```json"):
                raw = "\n".join(lines[1:])
            else:
                raw = raw.split("```", 2)[1] if "```" in raw else raw
            raw = raw.strip()

        # === PARSE JSON SAFELY ===
        data = json.loads(raw)

        # Clean empty values
        for k, v in data.items():
            if v in ("", [], {}):
                data[k] = None

        return data

    except json.JSONDecodeError as e:
        return {
            "raw_response": response.text if 'response' in locals() else "No response",
            "error": f"JSON decode failed: {str(e)}"
        }
    except Exception as e:
        return {
            "raw_response": "Unknown",
            "error": f"Gemini error: {str(e)}"
        }

