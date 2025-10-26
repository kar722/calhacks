# Test Cases for RAG API

## Test Case 1: Eligible User (Should return `eligible: true`)

User completed probation over 4 years ago with no pending charges.

```json
{
  "city_or_county": "Los Angeles County",
  "case_number": "20CR12345",
  "name": "Jane Smith",
  "date_to_appear": "2021-03-15",
  "violations_charged_with": ["Penal Code §496 - Receiving Stolen Property"],
  "sentencing": "3 years probation, 40 hours community service",
  "fine": 500.00,
  "further_instruction": "Complete 40 hours of community service within 6 months",
  "report_number": "LAPD-2020-089234",
  "officer": "Officer J. Martinez #3421",
  "location_of_occurrence": "456 Main St, Los Angeles, CA 90012",
  "conviction_type": "Misdemeanor",
  "date": "2020-09-01",
  "terms_of_service_completed": true,
  "other_convictions": false,
  "pending_charges_or_cases": false
}
```
---

## Test Case 2: Ineligible User (Should return `eligible: false`)

User has recent conviction (2024) and has NOT completed terms of service.

```json
{
  "city_or_county": "San Francisco County",
  "case_number": "24CR67890",
  "name": "Robert Johnson",
  "date_to_appear": "2024-06-20",
  "violations_charged_with": ["Penal Code §484 - Petty Theft"],
  "sentencing": "2 years probation, $800 fine, 60 hours community service",
  "fine": 800.00,
  "further_instruction": "Complete theft prevention course and 60 hours community service",
  "report_number": "SFPD-2024-045623",
  "officer": "Officer S. Chen #5789",
  "location_of_occurrence": "789 Market St, San Francisco, CA 94103",
  "conviction_type": "Misdemeanor",
  "date": "2024-04-10",
  "terms_of_service_completed": false,
  "other_convictions": false,
  "pending_charges_or_cases": false
}
```
---


## Test Case 3: Edge Case - Pending Charges (Should return `eligible: false`)

```json
{
  "city_or_county": "San Diego County",
  "case_number": "19CR98765",
  "name": "Michael Torres",
  "date_to_appear": "2019-05-10",
  "violations_charged_with": ["Penal Code §415 - Disturbing the Peace"],
  "sentencing": "1 year probation, $250 fine",
  "fine": 250.00,
  "further_instruction": "Attend anger management course",
  "report_number": "SDPD-2019-012456",
  "officer": "Officer R. Williams #2341",
  "location_of_occurrence": "321 Broadway, San Diego, CA 92101",
  "conviction_type": "Misdemeanor",
  "date": "2019-03-20",
  "terms_of_service_completed": true,
  "other_convictions": false,
  "pending_charges_or_cases": true
}
```

**Expected Result:**
- `eligible: false`
- `confidence: 95`
- Key findings: Has pending charges (disqualifying factor)
- Next steps: Resolve pending charges, complete probation, then file CR-180 form

---

## How to Test

### Using Postman:
1. Start the API: `uvicorn rag.api:app --reload --port 8000`
2. POST to: `http://localhost:8000/api/check-eligibility`
3. Set Header: `Content-Type: application/json`
4. Paste one of the JSON examples above in the body
5. Check the response matches expected results