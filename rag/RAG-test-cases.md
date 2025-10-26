# Test Cases for RAG

## Test Case 1 -- Should return True
```json
{
  "city_or_county": "Los Angeles County",
  "case_number": "20CR12345",
  "name": "Jane Smith",
  "violations_charged_with": ["Penal Code §496 - Receiving Stolen Property"],
  "sentencing": "3 years probation, 40 hours community service",
  "fine": 500.00,
  "conviction_type": "Misdemeanor",
  "conviction_date": "2020-09-01",
  "charges": "PC 496 - Receiving Stolen Property",
  "serving_sentence": false,
  "on_probation": false,
  "pending_charges": false,
  "probation_granted": true,
  "probation_completed": true,
  "probation_conditions_met": true,
  "fines_paid": true,
  "restitution_paid": true
}
```

## Test Case 2 -- Should return False
```json
{
  "city_or_county": "San Francisco County",
  "case_number": "24CR67890",
  "name": "Robert Johnson",
  "violations_charged_with": ["Penal Code §484 - Petty Theft"],
  "sentencing": "2 years probation, $800 fine, 60 hours community service",
  "fine": 800.00,
  "conviction_type": "Misdemeanor",
  "conviction_date": "2024-04-10",
  "charges": "PC 484 - Petty Theft",
  "serving_sentence": false,
  "on_probation": true,
  "pending_charges": false,
  "probation_granted": true,
  "probation_completed": false,
  "probation_conditions_met": false,
  "fines_paid": false,
  "restitution_paid": false
}
```

## Test Case 3 -- Edge Case
```json
{
  "city_or_county": "San Diego County",
  "case_number": "19CR98765",
  "name": "Michael Torres",
  "violations_charged_with": ["Penal Code §415 - Disturbing the Peace"],
  "sentencing": "1 year probation, $250 fine",
  "fine": 250.00,
  "conviction_type": "Misdemeanor",
  "conviction_date": "2019-03-20",
  "charges": "PC 415 - Disturbing the Peace",
  "serving_sentence": false,
  "on_probation": false,
  "pending_charges": true,
  "probation_granted": true,
  "probation_completed": true,
  "probation_conditions_met": true,
  "fines_paid": true,
  "restitution_paid": true
}
```