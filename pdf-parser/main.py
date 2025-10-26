#btw this is the fastapi end point

# main.py
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional
import os
import tempfile
import shutil

from pdf_parser import extract_text_from_pdf, parse_with_gemini

app = FastAPI(
    title="California Court Document Extractor",
    description="Upload up to 3 PDFs → get one merged CASE_DOCUMENT",
    version="1.0.0"
)

def _parse_upload(file: UploadFile) -> dict:
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


@app.post("/extract", response_class=JSONResponse)
async def extract_case(
    summons: Optional[UploadFile] = File(None),
    sentencing: Optional[UploadFile] = File(None),
    police: Optional[UploadFile] = File(None),
):
    raw = {}
    if summons:     raw["summons"]    = _parse_upload(summons)
    if sentencing:  raw["sentencing"] = _parse_upload(sentencing)
    if police:      raw["police"]     = _parse_upload(police)

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

    return final