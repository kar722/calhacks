# pdf_parser.py
import json
import os
import google.generativeai as genai
from google.generativeai import GenerativeModel
from PyPDF2 import PdfReader
from dotenv import load_dotenv

# ----------------------------------------------------------------------
# 1. Load API key
# ----------------------------------------------------------------------
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    raise ValueError("No API key found. Ensure .env has GOOGLE_API_KEY=<your key>")

genai.configure(api_key=API_KEY)

# ----------------------------------------------------------------------
# 3. Extract text from PDF
# ----------------------------------------------------------------------
def extract_text_from_pdf(pdf_path):
    reader = PdfReader(pdf_path)
    text = ""
    for page_num, page in enumerate(reader.pages, start=1):
        page_text = page.extract_text() or ""
        text += f"\n--- Page {page_num} ---\n{page_text}"
    return text

# ----------------------------------------------------------------------
# 4. Parse with Gemini – STRIP CODE BLOCKS + SAFE JSON
# ----------------------------------------------------------------------
def parse_with_gemini(text):
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

# ----------------------------------------------------------------------
# 5. Convert PDF to JSON (internal)
# ----------------------------------------------------------------------
def pdf_to_json(pdf_path):
    print(f"Extracting: {os.path.basename(pdf_path)}")
    text = extract_text_from_pdf(pdf_path)
    if len(text) > 100_000:
        text = text[:100_000] + "\n\n[TRUNCATED]"
    return parse_with_gemini(text)

# ----------------------------------------------------------------------
# 6. Main – Merge 3 Docs into ONE CASE_DOCUMENT
# ----------------------------------------------------------------------
def main():
    pdf_files = {
        "summons": "California_Summons_to_Appear.pdf", 
        "sentencing": "California_Sentencing_Order.pdf",
        "police": "California_Police_Report.pdf",
    }

    raw_data = {}

    print("Starting extraction of 3 court documents...\n")
    for doc_type, pdf_file in pdf_files.items():
        if not os.path.exists(pdf_file):
            print(f"File not found: {pdf_file}")
            raw_data[doc_type] = {}
            continue
        raw_data[doc_type] = pdf_to_json(pdf_file)

    # === MERGE INTO FINAL CASE_DOCUMENT ===
    final = {}
    sources = ["summons", "sentencing", "police"]
    fields = [
        "city_or_county", "case_number", "name", "date_to_appear",
        "violations_charged_with", "sentencing", "fine", "further_instruction",
        "report_number", "date_of_incident", "officer", "location_of_occurrence"
    ]

    for field in fields:
        for src in sources:
            value = raw_data.get(src, {}).get(field)
            if value not in (None, "", [], {}):
                final[field] = value
                break
        else:
            final[field] = None

    if raw_data["sentencing"].get("further_instruction"):
        final["further_instruction"] = raw_data["sentencing"]["further_instruction"]

    output_file = "final_case.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(final, f, indent=2, ensure_ascii=False, default=str)

    print(f"\nFINAL CASE_DOCUMENT saved → {output_file}")
    print(f"Case: {final.get('case_number', 'Unknown')} | {final.get('name', 'Unknown')}")

if __name__ == "__main__":
    main()