# This prompt runs FIRST — before any math.
# It sends raw PDF text to LLaMA 3.1 8B (faster, cheaper model)
# and gets back structured JSON with all transactions.
# LLaMA 3.3 70B is overkill for extraction — 8B handles structured output well.


def build_extraction_prompt(raw_pdf_text: str) -> str:
    """
    Builds the extraction prompt for LLaMA 3.1 8B.
    
    Goal: Turn messy CAMS/KFintech PDF text into clean transaction JSON.
    The model is instructed to return ONLY JSON — no preamble, no explanation.
    The backend then parses this JSON directly.
    """
    return f"""You are a financial data extraction engine. Your only job is to extract mutual fund transaction data from the text below and return it as valid JSON.

RULES — follow exactly:
1. Return ONLY a valid JSON object. No explanation, no preamble, no markdown, no code fences.
2. If a field is missing or unclear, use null.
3. All dates must be in YYYY-MM-DD format.
4. All amounts must be positive floats (purchases and redemptions both positive).
5. Transaction type must be either "purchase" or "redemption".
6. Fund names must be copied exactly as they appear in the text.
7. If you cannot find any transactions, return: {{"transactions": [], "current_values": {{}}}}

OUTPUT FORMAT — return exactly this structure:
{{
  "transactions": [
    {{
      "fund_name": "Full fund name as in the document",
      "date": "YYYY-MM-DD",
      "amount": 5000.00,
      "units": 123.456,
      "nav": 40.55,
      "type": "purchase"
    }}
  ],
  "current_values": {{
    "Full fund name exactly as above": 125000.00
  }}
}}

WHAT TO LOOK FOR IN CAMS/KFINTECH STATEMENTS:
- Transaction tables with columns: Date, Description, Amount, Units, NAV, Balance
- "Purchase", "SIP", "Switch In" = purchase transactions
- "Redemption", "Switch Out", "Dividend Payout" = redemption transactions
- "Market Value" or "Current Value" column or section = current_values
- Fund name usually appears as a header above each transaction table
- Folio number appears near fund name — ignore it, only extract fund name

PDF TEXT TO EXTRACT FROM:
---
{raw_pdf_text}
---

Return only the JSON object now:"""


def build_fallback_prompt(raw_pdf_text: str) -> str:
    """
    Simpler fallback prompt used if the main extraction returns unparseable JSON.
    Asks only for fund names and current values — skips full transaction history.
    XIRR will not be calculated in fallback mode, but overlap and expense analysis still work.
    """
    return f"""Extract mutual fund holdings from this statement text. Return ONLY valid JSON, nothing else.

FORMAT:
{{
  "funds": [
    {{
      "fund_name": "Fund name exactly as written",
      "current_value": 50000.00,
      "total_invested": 40000.00
    }}
  ]
}}

TEXT:
---
{raw_pdf_text}
---

JSON only:"""