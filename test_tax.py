import requests
import json

BASE_URL = "http://localhost:8000/api"

dummy_data = {
    "annual_ctc": 1200000,
    "basic_salary": 600000,
    "hra_received": 240000,
    "is_metro": True,
    "annual_rent_paid": 180000,
    "section_80c": 100000,
    "section_80d": 10000,
    "section_80ccd_1b": 0,
    "home_loan_interest": 0,
    "section_80d_parents": 0,
    "other_deductions": 0,
    "da": 0,
    "special_allowance": 0,
    "age": 28,
    "financial_year": "2024-25"
}

print("Testing Tax Wizard — Manual Input...")
print("=" * 50)

response = requests.post(
    f"{BASE_URL}/tax-wizard/manual",
    json=dummy_data
)

if response.status_code == 200:
    data = response.json()
    print(f"✓ Status: {response.status_code}")
    print(f"\n📊 OLD REGIME:")
    print(f"   Total Tax     : ₹{data['old_regime']['total_tax']:,.0f}")
    print(f"   Monthly Salary: ₹{data['old_regime']['in_hand_monthly']:,.0f}")
    print(f"   Effective Rate: {data['old_regime']['effective_tax_rate']}%")
    print(f"\n📊 NEW REGIME:")
    print(f"   Total Tax     : ₹{data['new_regime']['total_tax']:,.0f}")
    print(f"   Monthly Salary: ₹{data['new_regime']['in_hand_monthly']:,.0f}")
    print(f"   Effective Rate: {data['new_regime']['effective_tax_rate']}%")
    print(f"\n✅ Recommended  : {data['recommended_regime'].upper()} REGIME")
    print(f"💰 You Save     : ₹{data['tax_saving_with_recommendation']:,.0f}/year")
    print(f"\n📋 Missed Deductions: {len(data['missed_deductions'])}")
    for d in data['missed_deductions']:
        if d['max_limit'] > 0:
            print(f"   - {d['section']}: ₹{d['remaining']:,.0f} remaining → saves ₹{d['potential_tax_saving']:,.0f}")
    print(f"\n🤖 AI Advice Preview:")
    print(f"{data['ai_advice'][:300]}...")
    print(f"\n📰 ET Context Used: {data['et_context_used']}")
else:
    print(f"✗ Error {response.status_code}: {response.json()}")