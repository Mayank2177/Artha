"""
Artha FIRE Path Planner — Python Backend
FastAPI server: market data fetch + Claude AI roadmap generation
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import httpx
import xml.etree.ElementTree as ET
from groq import Groq
import json
import re
import asyncio
import uvicorn

app = FastAPI(title="Artha FIRE Planner API", version="1.0.0")


# Allow requests from React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── MODELS ──────────────────────────────────────────────────────────────────

class Goal(BaseModel):
    id: int
    type: str
    amount: float
    year: int

class ProfileInput(BaseModel):
    age: int
    retire_age: int
    income: float
    expenses: float
    savings: float
    insurance: float
    goals: list[Goal]

# ── MARKET DATA ──────────────────────────────────────────────────────────────

async def fetch_et_market_data() -> dict:
    """
    Fetch ET Markets RSS feed and extract RBI repo rate, CPI inflation, Nifty 50.
    Falls back to sensible India-2025 defaults if the feed is unavailable.
    """
    defaults = {"repo": 6.25, "cpi": 4.6, "nifty": "23,800", "headlines": []}

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            rss_url = "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms"
            resp = await client.get(rss_url)
            resp.raise_for_status()

            root = ET.fromstring(resp.text)
            headlines = [
                item.findtext("title", "")
                for item in root.iter("item")
            ][:10]

        full_text = " ".join(headlines)

        repo_match = re.search(r"repo\s+rate[^\d]*(\d+\.?\d*)\s*%", full_text, re.I)
        cpi_match  = re.search(r"(?:CPI|inflation)[^\d]*(\d+\.?\d*)\s*%", full_text, re.I)
        nifty_match = re.search(r"Nifty[^\d]*([\d,]+\.?\d*)", full_text, re.I)

        return {
            "repo":      float(repo_match.group(1))  if repo_match  else defaults["repo"],
            "cpi":       float(cpi_match.group(1))   if cpi_match   else defaults["cpi"],
            "nifty":     nifty_match.group(1)         if nifty_match else defaults["nifty"],
            "headlines": headlines[:5],
        }

    except Exception as exc:
        print(f"[market-data] RSS fetch failed ({exc}), using defaults")
        return defaults


# ── FINANCIAL MATH ───────────────────────────────────────────────────────────

def future_value(pv: float, inflation: float, years: int) -> float:
    return pv * (1 + inflation) ** years

def monthly_sip(fv: float, annual_cagr: float, years: int) -> float:
    if years <= 0:
        return 0.0
    r = annual_cagr / 12
    n = years * 12
    return fv * r / ((1 + r) ** n - 1)

def compute_profile(data: ProfileInput, inflation: float) -> dict:
    """Run all FIRE calculations and return enriched numbers."""
    from datetime import date
    current_year = date.today().year
    cagr = 0.12

    surplus        = data.income - data.expenses
    emergency      = data.expenses * 6
    insurance_gap  = max(0, data.income * 12 * 10 - data.insurance)
    equity_pct     = max(0, min(100, 100 - data.age))
    fire_corpus    = data.expenses * 12 * 25
    years_to_fire  = data.retire_age - data.age

    processed_goals = []
    for g in data.goals:
        years_left = g.year - current_year
        corpus     = future_value(g.amount, inflation, years_left) if years_left > 0 else g.amount
        sip        = monthly_sip(corpus, cagr, years_left)
        fv_savings = data.savings * (1 + cagr) ** years_left
        gap        = corpus - fv_savings

        processed_goals.append({
            "id":         g.id,
            "type":       g.type,
            "amount":     g.amount,
            "year":       g.year,
            "years_left": years_left,
            "corpus":     round(corpus),
            "sip":        round(sip),
            "gap":        round(gap),
            "funded":     gap <= 0,
        })

    total_sip = sum(g["sip"] for g in processed_goals)

    return {
        "surplus":         round(surplus),
        "emergency":       round(emergency),
        "insurance_gap":   round(insurance_gap),
        "equity_pct":      equity_pct,
        "fire_corpus":     round(fire_corpus),
        "years_to_fire":   years_to_fire,
        "total_sip":       round(total_sip),
        "processed_goals": processed_goals,
    }


# ── ROUTES ───────────────────────────────────────────────────────────────────

@app.get("/api/market-data")
async def get_market_data():
    """Return live RBI repo, CPI, Nifty from ET Markets RSS."""
    data = await fetch_et_market_data()
    return data


@app.post("/api/calculate")
async def calculate(data: ProfileInput):
    """
    Run FIRE math and return all derived numbers.
    Frontend uses this for the live preview panel.
    """
    market = await fetch_et_market_data()
    inflation = market["cpi"] / 100
    profile   = compute_profile(data, inflation)
    return {**profile, "market": market}


@app.post("/api/roadmap")
async def generate_roadmap(data: ProfileInput):
    """
    Build the Claude AI roadmap prompt, call Anthropic API, stream back the
    structured JSON roadmap response.
    """
    # 1. Get live market data
    market    = await fetch_et_market_data()
    inflation = market["cpi"] / 100
    profile   = compute_profile(data, inflation)

    def fmt_inr(n: float) -> str:
        if n >= 1e7:  return f"₹{n/1e7:.2f} Cr"
        if n >= 1e5:  return f"₹{n/1e5:.1f} L"
        return f"₹{round(n):,}"

    goals_text = "\n".join(
        f"- {g['type']}: target ₹{g['amount']:,.0f} in {g['years_left']} yrs | "
        f"Inflation-adjusted corpus: {fmt_inr(g['corpus'])} | "
        f"Monthly SIP: {fmt_inr(g['sip'])} | "
        f"{'Funded ✓' if g['funded'] else 'Gap: ' + fmt_inr(g['gap'])}"
        for g in profile["processed_goals"]
    ) or "(No specific goals added)"

    system_prompt = """You are Artha, a senior Indian FIRE (Financial Independence, Retire Early) advisor.
You have deep expertise in Indian financial instruments: ELSS, PPF, NPS, SGBs, Nifty/Sensex index funds, term insurance, direct equity, REITs, etc.
You speak directly with specific rupee amounts, timelines, and product recommendations.

Respond ONLY with a valid JSON object (no markdown fences, no extra text) with these exact keys:
{
  "summary": "2-3 sentence overall assessment",
  "first6Months": ["action with ₹ amounts", ...],
  "year1Changes": ["change with ₹ amounts", ...],
  "priorityOrder": ["goal name in order of priority", ...],
  "riskFlags": ["specific risk description", ...],
  "insuranceRecommendation": "specific product + sum assured recommendation",
  "taxMoves": ["specific 80C/80D/etc move with amounts", ...],
  "sipBreakdown": [{"goal": "name", "amount": 5000, "instrument": "e.g. Nifty 50 Index Fund (direct)"}],
  "assetShiftPlan": "how equity/debt/gold should shift every 5 years",
  "monthlyBudgetAdvice": "specific monthly cashflow advice"
}"""

    user_prompt = f"""My Financial Profile:
- Age: {data.age} | Target FIRE Age: {data.retire_age} ({profile['years_to_fire']} years to go)
- Monthly Income: {fmt_inr(data.income)} | Expenses: {fmt_inr(data.expenses)} | Surplus: {fmt_inr(profile['surplus'])}
- Existing Savings/Investments: {fmt_inr(data.savings)}
- Insurance Cover: {fmt_inr(data.insurance)} | Gap: {fmt_inr(profile['insurance_gap'])}
- Emergency Fund Target: {fmt_inr(profile['emergency'])} ({'adequate' if data.savings >= profile['emergency'] else 'INSUFFICIENT'})
- Recommended Equity Allocation: {profile['equity_pct']}% (100−age rule)
- FIRE Corpus Target (25× annual expenses): {fmt_inr(profile['fire_corpus'])}
- Total Monthly SIP needed across all goals: {fmt_inr(profile['total_sip'])}

Life Goals:
{goals_text}

Live Market Context (ET Markets RSS):
- RBI Repo Rate: {market['repo']}%
- CPI Inflation: {market['cpi']}%
- Nifty 50: {market['nifty']}
- Market Headlines: {' | '.join(market['headlines'][:3])}

Generate a complete, specific, actionable FIRE roadmap. Use current repo rate and inflation in your advice."""



    # 2. Call Groq
      # uses Groq_API_KEY env var
    client = Groq()
    async def stream_roadmap():
        try:
            message = client.chat.completions.create(
                        model="llama-3.1-8b-instant",
                        system=system_prompt,
                        messages=[{"role": "user", "content": user_prompt}]
                    )
            raw = message.choices[0].message.content
            # Clean any accidental markdown fences
            raw = re.sub(r"```json|```", "", raw).strip()
            roadmap = json.loads(raw)
            # Return computed numbers alongside AI roadmap
            yield json.dumps({"ok": True, "roadmap": roadmap, "profile": profile, "market": market})
        except json.JSONDecodeError as e:
            yield json.dumps({"ok": False, "error": f"AI returned invalid JSON: {e}"})
        except Exception as e:
            yield json.dumps({"ok": False, "error": str(e)})

    return StreamingResponse(stream_roadmap(), media_type="application/json")


@app.get("/")
def root():
    return {"status": "Artha API running", "docs": "/docs"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
