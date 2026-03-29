# feedparser — fetches top 3 ET articles per feature key
"""
Economic Times RSS Feed utility
Fetches live ET articles to ground AI advice in current market context.
Used by: FIRE Planner, Tax Wizard
"""
import feedparser
from config import config


def get_et_context(feature: str, max_articles: int = 3) -> str:
    """
    Fetches top articles from ET RSS feed for a given feature.
    Returns formatted string ready to inject into Groq prompt.
    Falls back to empty string if fetch fails — app still works.

    Args:
        feature: One of the keys in config.FEATURE_ET_FEED_MAP
                 e.g. "tax_wizard", "fire_planner", "mf_xray"
        max_articles: How many articles to pull (default 3)

    Returns:
        Formatted string of headlines + summaries, or "" on failure
    """
    try:
        feed_key = config.FEATURE_ET_FEED_MAP.get(feature)

        if not feed_key:
            print(f"⚠ No ET feed mapped for feature: {feature}")
            return ""

        feed_url = config.ET_RSS_FEEDS.get(feed_key)

        if not feed_url:
            print(f"⚠ No RSS URL found for feed key: {feed_key}")
            return ""

        feed = feedparser.parse(feed_url)

        if not feed.entries:
            print(f"⚠ ET RSS returned no entries for: {feed_url}")
            return ""

        context = ""
        for entry in feed.entries[:max_articles]:
            title   = entry.get("title", "").strip()
            summary = entry.get("summary", "").strip()
            if title:
                context += f"- {title}: {summary}\n"

        return context.strip()

    except Exception as e:
        print(f"⚠ ET RSS fetch failed for '{feature}': {e}")
        return ""  # graceful fallback — Groq prompt still works without ET context


def get_et_context_block(feature: str) -> str:
    """
    Returns a fully formatted block ready to drop into any Groq prompt.
    If no context available, returns an empty string — prompt handles it gracefully.
    """
    context = get_et_context(feature)

    if not context:
        return ""

    return f"""
TODAY'S ECONOMIC TIMES CONTEXT (live feed):
{context}
Use this current market context to make your advice more relevant and timely.
""".strip()