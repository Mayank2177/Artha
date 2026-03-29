"""
Configuration module for Artha Backend
Loads environment variables and shared settings
"""
import os
from typing import List
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """Configuration class with all app settings"""

    # Groq API Keys for rotation
    GROQ_API_KEY_1: str = os.getenv("GROQ_API_KEY_1", "")
    GROQ_API_KEY_2: str = os.getenv("GROQ_API_KEY_2", "")
    GROQ_API_KEY_3: str = os.getenv("GROQ_API_KEY_3", "")

    @classmethod
    def get_groq_api_keys(cls) -> List[str]:
        """
        Returns list of all configured Groq API keys
        Filters out empty keys
        """
        keys = [cls.GROQ_API_KEY_1, cls.GROQ_API_KEY_2, cls.GROQ_API_KEY_3]
        return [key for key in keys if key and key != ""]

    # Model configurations
    GROQ_MODEL_LARGE: str = "llama-3.3-70b-versatile"  # For main advice generation
    GROQ_MODEL_SMALL: str = "llama-3.1-8b-instant"     # For PDF extraction

    # API settings
    API_TITLE: str = "Artha AI Money Mentor API"
    API_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # CORS settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080"
    ]

    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"

    # Economic Times RSS Feed URLs
    ET_RSS_FEEDS = {
        "markets": "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
        "personal_finance": "https://economictimes.indiatimes.com/wealth/rssfeeds/837555174.cms",
        "mutual_funds": "https://economictimes.indiatimes.com/mf/rssfeeds/48250594.cms",
        "tax": "https://economictimes.indiatimes.com/wealth/tax/rssfeeds/837555174.cms"
    }

    # Feature-specific ET feed mapping
    FEATURE_ET_FEED_MAP = {
        "fire_planner": "personal_finance",
        "tax_wizard": "tax",
        "mf_xray": "mutual_funds",
        "money_health": "personal_finance",
        "couples_planner": "personal_finance"
    }

    # File upload settings
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: List[str] = [".pdf"]

    # Demo data paths
    DEMO_CAMS_PDF: str = "demo_data/sample_cams.pdf"
    DEMO_FORM16_PDF: str = "demo_data/sample_form16.pdf"
    DEMO_MOCK_INPUTS: str = "demo_data/mock_inputs.json"


# Create a singleton instance
config = Config()


def validate_config() -> bool:
    """
    Validates that all required configuration is present
    Returns True if valid, raises ValueError otherwise
    """
    groq_keys = config.get_groq_api_keys()

    if not groq_keys:
        raise ValueError(
            "No Groq API keys configured. "
            "Please set at least one of: GROQ_API_KEY_1, GROQ_API_KEY_2, GROQ_API_KEY_3"
        )

    print(f"[OK] Configuration loaded successfully")
    print(f"[OK] Found {len(groq_keys)} Groq API key(s)")
    print(f"[OK] Using models: {config.GROQ_MODEL_LARGE} (large), {config.GROQ_MODEL_SMALL} (small)")

    return True
