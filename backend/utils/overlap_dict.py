"""
Static dictionary of top 20 equity holdings per major Indian mutual fund.
Used by MF Portfolio X-Ray for overlap detection between funds.

Data is approximate and based on typical large-cap/flexi-cap portfolios.
For hackathon purposes this is sufficient — production would use live AMC data.
"""

# Fund name → list of top holdings (stock symbols/names)
FUND_HOLDINGS: dict[str, list[str]] = {

    # Large Cap Funds
    "Mirae Asset Large Cap Fund": [
        "HDFC Bank", "ICICI Bank", "Reliance Industries", "Infosys", "TCS",
        "Axis Bank", "Larsen & Toubro", "Kotak Mahindra Bank", "SBI", "Bharti Airtel",
        "HUL", "Wipro", "Sun Pharma", "Maruti Suzuki", "Bajaj Finance",
        "Titan", "Asian Paints", "Nestle India", "Tech Mahindra", "UltraTech Cement"
    ],
    "HDFC Top 100 Fund": [
        "HDFC Bank", "ICICI Bank", "Reliance Industries", "Infosys", "TCS",
        "Axis Bank", "SBI", "Larsen & Toubro", "Bharti Airtel", "Kotak Mahindra Bank",
        "HUL", "ITC", "Sun Pharma", "Bajaj Finance", "Maruti Suzuki",
        "Wipro", "NTPC", "Power Grid", "Coal India", "Tech Mahindra"
    ],
    "ICICI Prudential Bluechip Fund": [
        "HDFC Bank", "ICICI Bank", "Reliance Industries", "Infosys", "TCS",
        "Larsen & Toubro", "Axis Bank", "SBI", "Bharti Airtel", "Kotak Mahindra Bank",
        "Sun Pharma", "HUL", "Bajaj Finance", "Maruti Suzuki", "ITC",
        "Wipro", "Titan", "Asian Paints", "NTPC", "Tech Mahindra"
    ],

    # Flexi Cap Funds
    "Parag Parikh Flexi Cap Fund": [
        "HDFC Bank", "ICICI Bank", "Bajaj Holdings", "ITC", "Coal India",
        "Power Grid", "NMDC", "Alphabet (Google)", "Meta Platforms", "Microsoft",
        "Amazon", "Maruti Suzuki", "Axis Bank", "HCL Technologies", "Infosys",
        "Ipca Laboratories", "Balkrishna Industries", "Mahindra & Mahindra", "CDSL", "Motilal Oswal"
    ],
    "HDFC Flexi Cap Fund": [
        "HDFC Bank", "ICICI Bank", "Reliance Industries", "Infosys", "Axis Bank",
        "SBI", "Larsen & Toubro", "TCS", "Kotak Mahindra Bank", "Bharti Airtel",
        "Sun Pharma", "HUL", "Maruti Suzuki", "ITC", "Bajaj Finance",
        "Tech Mahindra", "Wipro", "Asian Paints", "NTPC", "Titan"
    ],

    # Mid Cap Funds
    "Nippon India Growth Fund": [
        "Tube Investments", "Carborundum Universal", "Sundaram Finance", "Schaeffler India", "Cummins India",
        "Persistent Systems", "Coforge", "Mphasis", "Voltas", "Blue Star",
        "Kajaria Ceramics", "Astral", "Supreme Industries", "Whirlpool", "Crompton Greaves",
        "Aarti Industries", "PI Industries", "SRF", "Deepak Nitrite", "Navin Fluorine"
    ],
    "HDFC Mid-Cap Opportunities Fund": [
        "Cholamandalam Investment", "Tube Investments", "Sundaram Finance", "Max Financial", "Mphasis",
        "Persistent Systems", "Coforge", "Voltas", "Blue Star", "Cummins India",
        "Schaeffler India", "Carborundum Universal", "PI Industries", "SRF", "Aarti Industries",
        "Supreme Industries", "Astral", "Kajaria Ceramics", "Crompton Greaves", "Whirlpool"
    ],

    # ELSS Funds
    "Mirae Asset Tax Saver Fund": [
        "HDFC Bank", "ICICI Bank", "Reliance Industries", "Infosys", "TCS",
        "Axis Bank", "Larsen & Toubro", "Kotak Mahindra Bank", "SBI", "Bharti Airtel",
        "HUL", "Wipro", "Sun Pharma", "Maruti Suzuki", "Bajaj Finance",
        "Titan", "Asian Paints", "Tech Mahindra", "UltraTech Cement", "Nestle India"
    ],
    "Quant Tax Plan": [
        "Reliance Industries", "ITC", "HDFC Bank", "ICICI Bank", "SBI",
        "Adani Enterprises", "Adani Ports", "LIC", "Jio Financial", "Vedanta",
        "ONGC", "Coal India", "NTPC", "Power Grid", "Tata Steel",
        "Hindalco", "JSW Steel", "Bajaj Auto", "Eicher Motors", "Hero MotoCorp"
    ],

    # Index Funds
    "UTI Nifty 50 Index Fund": [
        "HDFC Bank", "ICICI Bank", "Reliance Industries", "Infosys", "TCS",
        "Larsen & Toubro", "Axis Bank", "Kotak Mahindra Bank", "SBI", "Bharti Airtel",
        "HUL", "ITC", "Sun Pharma", "Bajaj Finance", "Maruti Suzuki",
        "Wipro", "NTPC", "Power Grid", "Titan", "Asian Paints"
    ],
    "HDFC Nifty 50 Index Fund": [
        "HDFC Bank", "ICICI Bank", "Reliance Industries", "Infosys", "TCS",
        "Larsen & Toubro", "Axis Bank", "Kotak Mahindra Bank", "SBI", "Bharti Airtel",
        "HUL", "ITC", "Sun Pharma", "Bajaj Finance", "Maruti Suzuki",
        "Wipro", "NTPC", "Power Grid", "Titan", "Asian Paints"
    ],
}


# Expense Ratios (in percentage, e.g., 0.75 = 0.75%)
FUND_EXPENSE_RATIOS: dict[str, float] = {
    # Large Cap Funds
    "Mirae Asset Large Cap Fund": 0.65,
    "HDFC Top 100 Fund": 0.75,
    "ICICI Prudential Bluechip Fund": 0.70,

    # Flexi Cap Funds
    "Parag Parikh Flexi Cap Fund": 0.85,
    "HDFC Flexi Cap Fund": 0.80,

    # Mid Cap Funds
    "Nippon India Growth Fund": 1.00,
    "HDFC Mid-Cap Opportunities Fund": 1.05,

    # ELSS Funds
    "Mirae Asset Tax Saver Fund": 0.95,
    "Quant Tax Plan": 0.80,

    # Index Funds
    "UTI Nifty 50 Index Fund": 0.15,
    "HDFC Nifty 50 Index Fund": 0.20,
}

# Default expense ratio for unknown funds (0.90% per annum)
DEFAULT_EXPENSE_RATIO = 0.90

# Expense ratio for index funds (0.10% per annum)
INDEX_EXPENSE_RATIO = 0.10


def get_overlapping_stocks(fund_a: str, fund_b: str) -> list[str]:
    """
    Returns list of stocks common between two funds.

    Args:
        fund_a: Name of first fund
        fund_b: Name of second fund

    Returns:
        List of overlapping stock names, empty list if no overlap or fund not found
    """
    holdings_a = set(FUND_HOLDINGS.get(fund_a, []))
    holdings_b = set(FUND_HOLDINGS.get(fund_b, []))

    return list(holdings_a & holdings_b)


def get_overlap_percentage(fund_a: str, fund_b: str) -> float:
    """
    Returns overlap as a percentage of the smaller fund's holdings.

    Args:
        fund_a: Name of first fund
        fund_b: Name of second fund

    Returns:
        Float between 0 and 100 representing overlap percentage
    """
    holdings_a = set(FUND_HOLDINGS.get(fund_a, []))
    holdings_b = set(FUND_HOLDINGS.get(fund_b, []))

    if not holdings_a or not holdings_b:
        return 0.0

    overlap_count = len(holdings_a & holdings_b)
    smaller_fund_size = min(len(holdings_a), len(holdings_b))

    return round((overlap_count / smaller_fund_size) * 100, 2)


def analyze_portfolio_overlaps(fund_names: list[str]) -> list[dict]:
    """
    Analyzes all fund pairs in a portfolio for overlap.
    Returns only pairs with meaningful overlap (> 30%).

    Args:
        fund_names: List of fund names from the user's portfolio

    Returns:
        List of dicts with overlap details, sorted by overlap % descending
    """
    overlaps = []

    for i in range(len(fund_names)):
        for j in range(i + 1, len(fund_names)):
            fund_a = fund_names[i]
            fund_b = fund_names[j]

            overlap_pct = get_overlap_percentage(fund_a, fund_b)
            common_stocks = get_overlapping_stocks(fund_a, fund_b)

            if overlap_pct > 30:  # Only flag meaningful overlaps
                overlaps.append({
                    "fund_a": fund_a,
                    "fund_b": fund_b,
                    "overlap_percentage": overlap_pct,
                    "common_stocks": common_stocks,
                    "common_count": len(common_stocks),
                    "severity": "high" if overlap_pct > 60 else "medium"
                })

    return sorted(overlaps, key=lambda x: x["overlap_percentage"], reverse=True)


def get_known_funds() -> list[str]:
    """Returns list of all funds in the dictionary — useful for fuzzy matching later."""
    return list(FUND_HOLDINGS.keys())