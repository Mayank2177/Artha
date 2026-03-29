import requests

BASE_URL = "http://localhost:8000/api"

dummy_data = {
    "age": 28,
    "retirement_age": 50,
    "annual_income": 1200000,
    "annual_expenses": 600000,
    "existing_savings": 500000,
    "existing_sip": 10000,
    "existing_insurance_cover": 5000000,
    "goals": [
        {
            "name": "Retirement",
            "target_amount": 50000000,
            "years_to_goal": 22,
            "priority": 1
        },
        {
            "name": "Home Purchase",
            "target_amount": 8000000,
            "years_to_goal": 7,
            "priority": 2
        },
        {
            "name": "Child Education",
            "target_amount": 3000000,
            "years_to_goal": 15,
            "priority": 3
        }
    ]
}

print("Testing FIRE Path Planner...")
print("=" * 50)

response = requests.post(
    f"{BASE_URL}/fire-planner",
    json=dummy_data
)

if response.status_code == 200:
    data = response.json()
    print(f"✓ Status: {response.status_code}")

    print(f"\n📊 KEY NUMBERS:")
    print(f"   Monthly Income         : ₹{data['monthly_income']:,.0f}")
    print(f"   Monthly Expenses       : ₹{data['monthly_expenses']:,.0f}")
    print(f"   Monthly Surplus        : ₹{data['monthly_surplus']:,.0f}")
    print(f"   Savings Rate           : {data['savings_rate_percent']}%")
    print(f"   Total SIP Required     : ₹{data['total_monthly_sip_required']:,.0f}")
    print(f"   Additional SIP Needed  : ₹{data['additional_sip_needed']:,.0f}")
    print(f"   Emergency Fund Target  : ₹{data['emergency_fund_target']:,.0f}")
    print(f"   Emergency Fund Gap     : ₹{data['emergency_fund_gap']:,.0f}")
    print(f"   Insurance Gap          : ₹{data['insurance_gap']:,.0f}")
    print(f"   Retirement Corpus      : ₹{data['retirement_corpus_needed']:,.0f}")
    print(f"   Years to Retirement    : {data['years_to_retirement']}")

    print(f"\n🎯 GOAL PLANS:")
    for goal in data["goal_plans"]:
        status = "✓" if goal["is_achievable"] else "⚠"
        print(f"   {status} {goal['name']}")
        print(f"     Inflation Adjusted : ₹{goal['inflation_adjusted_corpus']:,.0f}")
        print(f"     SIP Required       : ₹{goal['sip_required']:,.0f}/month")
        print(f"     Current Gap        : ₹{goal['current_gap']:,.0f}")

    alloc = data["asset_allocation"]
    print(f"\n📈 ASSET ALLOCATION:")
    print(f"   Equity : {alloc['equity_percent']}% → ₹{alloc['equity_amount_monthly']:,.0f}/month")
    print(f"   Debt   : {alloc['debt_percent']}% → ₹{alloc['debt_amount_monthly']:,.0f}/month")

    print(f"\n🤖 AI Advice Preview:")
    print(f"{data['ai_advice'][:400]}...")
    print(f"\n📰 ET Context Used: {data['et_context_used']}")

else:
    print(f"✗ Error {response.status_code}: {response.json()}")