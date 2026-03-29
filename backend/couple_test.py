import sys
import io

# Fix Windows encoding issues with Unicode characters
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from models.couples_models import PartnerProfile, CouplesInput
from calculators.couples_optimizer import run_couples_optimization
from ai.prompts.couples_prompt import build_couples_advice_prompt
from ai.groq_client import groq_manager

dummy_data = {
    "partner_a": {
        "name": "Rahul",
        "annual_income": 1500000,
        "tax_bracket": 0.30,
        "basic_salary": 750000,
        "hra_received": 300000,
        "annual_rent_paid": 240000,
        "is_metro": True,
        "section_80c_invested": 50000,
        "nps_invested": 0,
        "existing_life_cover": 10000000,
        "existing_health_cover": 500000,
        "assets": 3000000,
        "liabilities": 1000000
    },
    "partner_b": {
        "name": "Priya",
        "annual_income": 900000,
        "tax_bracket": 0.20,
        "basic_salary": 450000,
        "hra_received": 180000,
        "annual_rent_paid": 0,
        "is_metro": True,
        "section_80c_invested": 100000,
        "nps_invested": 25000,
        "existing_life_cover": 5000000,
        "existing_health_cover": 300000,
        "assets": 1500000,
        "liabilities": 200000
    }
}

print("Testing Couples Money Planner...")
print("=" * 50)

# Call optimization directly
couples_input = CouplesInput(**dummy_data)
result = run_couples_optimization(couples_input)

# Generate AI advice using Groq
print("Generating AI advice (calling Groq API)...")
prompt = build_couples_advice_prompt(
    data=couples_input,
    hra=result["hra_optimization"],
    investments=result["investment_routing"],
    insurance=result["insurance_analysis"],
    net_worth=result["net_worth"],
    combined_annual_income=result["combined_annual_income"],
    combined_monthly_income=result["combined_monthly_income"],
)
ai_advice = groq_manager.chat(prompt)

# Convert Pydantic models to dicts for consistent access
data = {
    "hra_optimization": result["hra_optimization"].model_dump(),
    "investment_routing": result["investment_routing"].model_dump(),
    "insurance_analysis": result["insurance_analysis"].model_dump(),
    "net_worth": result["net_worth"].model_dump(),
    "combined_annual_income": result["combined_annual_income"],
    "combined_monthly_income": result["combined_monthly_income"],
    "ai_advice": ai_advice
}

if data:
    print(f"[OK] Status: Success")

    hra = data["hra_optimization"]
    print(f"\n[HRA] OPTIMIZATION:")
    print(f"   Recommended Claimant : {hra['recommended_claimant']}")
    print(f"   Rahul's Exemption    : {hra['partner_a_exemption']:,.0f}")
    print(f"   Priya's Exemption    : {hra['partner_b_exemption']:,.0f}")
    print(f"   Annual Tax Saving    : {hra['annual_tax_saving']:,.0f}")

    inv = data["investment_routing"]
    print(f"\n[INVEST] ROUTING:")
    print(f"   Higher Bracket       : {inv['higher_bracket_partner']}")
    print(f"   80C Remaining Rahul  : {inv['recommended_80c_split']['partner_a']:,.0f}")
    print(f"   80C Remaining Priya  : {inv['recommended_80c_split']['partner_b']:,.0f}")
    print(f"   Annual Tax Saving    : {inv['annual_tax_saving']:,.0f}")

    ins = data["insurance_analysis"]
    print(f"\n[INSURANCE] ANALYSIS:")
    print(f"   Rahul Adequate       : {ins['partner_a_adequate']}")
    print(f"   Priya Adequate       : {ins['partner_b_adequate']}")
    print(f"   Rahul Gap            : {ins['partner_a_gap']:,.0f}")
    print(f"   Priya Gap            : {ins['partner_b_gap']:,.0f}")
    print(f"   Health Adequate      : {ins['combined_health_adequate']}")

    nw = data["net_worth"]
    print(f"\n[NET WORTH]:")
    print(f"   Rahul                : {nw['partner_a_net_worth']:,.0f}")
    print(f"   Priya                : {nw['partner_b_net_worth']:,.0f}")
    print(f"   Combined             : {nw['combined_net_worth']:,.0f}")

    print(f"\n[AI] Advice Preview:")
    print(data['ai_advice'])

else:
    print(f"[ERROR] Failed to compute couples optimization")
