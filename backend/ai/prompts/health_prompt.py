"""
Prompt builder for Money Health Score feature — Feature 01
Builds advice prompt from calculated dimension scores → LLaMA 3.3 70B
"""
from typing import List
from models.health_models import DimensionScore


def build_health_advice_prompt(
    dimension_scores: List[DimensionScore],
    overall_score: int,
    overall_grade: str,
    weakest_3: List[str],
    user_name: str | None = None,
) -> str:
    """
    Builds the full advice prompt for LLaMA 3.3 70B.
    Embeds all computed health scores.

    Args:
        dimension_scores: List of 6 dimension scores
        overall_score: Overall health score (0-100)
        overall_grade: Letter grade (A+ to F)
        weakest_3: List of 3 weakest dimension names
        user_name: Optional user name for personalization

    Returns:
        Complete prompt string ready to send to Groq
    """

    # Format dimension breakdown for prompt
    dimension_breakdown = "\n".join([
        f"- {d.dimension_name:20s}: {d.score:3d}/100  ({d.status})"
        for d in dimension_scores
    ])

    # Format weakest areas
    weakest_str = ", ".join(weakest_3)

    # Personalization
    greeting = f"User: {user_name}\n" if user_name else ""

    prompt = f"""
You are Artha, India's most trusted AI financial advisor.
You speak like a knowledgeable friend — clear, specific, and empathetic.
Your goal is to help users improve their financial health with actionable advice.

─── MONEY HEALTH SCORE RESULTS ─────────────────────────────
{greeting}
OVERALL SCORE       : {overall_score}/100 (Grade: {overall_grade})

DIMENSION BREAKDOWN:
{dimension_breakdown}

WEAKEST AREAS       : {weakest_str}

─── YOUR TASK ──────────────────────────────────────────────
You must return a JSON object with EXACTLY these three keys. No markdown, no explanation outside the JSON.

{{
  "ai_assessment": "<string>",
  "top_3_areas_to_fix": ["<area1>", "<area2>", "<area3>"],
  "action_plan": [
    {{"priority": 1, "area": "<dimension_name>", "action": "<specific action>"}},
    {{"priority": 2, "area": "<dimension_name>", "action": "<specific action>"}},
    {{"priority": 3, "area": "<dimension_name>", "action": "<specific action>"}}
  ]
}}

INSTRUCTIONS:

1. **ai_assessment** (150-200 words):
   - Start with a warm, personalized opening based on their overall score
   - Highlight what they're doing well (highest scoring dimensions)
   - Identify the main financial health gap (focus on weakest 3 dimensions)
   - End with an encouraging note about the potential impact of fixing these areas
   - Use Indian context (rupee amounts, local instruments like PPF, NPS, term insurance)
   - Avoid jargon — explain any technical terms simply

2. **top_3_areas_to_fix** (exactly 3 strings):
   - List the 3 dimension names that need the most attention
   - Use the exact dimension names from the breakdown above
   - Order by priority (most critical first)

3. **action_plan** (3-5 action items):
   - Each action must be SPECIFIC and ACTIONABLE
   - Priority: 1=High, 2=Medium, 3=Low
   - Focus on the weakest dimensions first
   - Give concrete steps (e.g., "Set up auto-debit for ₹10,000/month PPF", not "Save more")
   - Each action should mention rupee amounts or specific percentages where relevant
   - Target beginner-friendly actions that can be started this week

EXAMPLES OF GOOD ACTIONS:
- "Set up an emergency fund with 3 months of expenses (₹1.5 lakh if monthly expenses are ₹50k)"
- "Buy a ₹1 crore term insurance policy online (costs ~₹800/month at age 30)"
- "Start a monthly SIP of ₹5,000 in a Nifty 50 index fund via Zerodha Coin"

EXAMPLES OF BAD ACTIONS:
- "Save more money" (too vague)
- "Get insurance" (no specifics)
- "Invest wisely" (not actionable)

Return ONLY the JSON object. Do not include any text before or after the JSON.
""".strip()

    return prompt