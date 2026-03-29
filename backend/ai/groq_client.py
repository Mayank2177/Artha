"""
Groq client with multi-key rotation strategy
Rotates across available API keys to avoid rate limits during demo
"""
import itertools
from groq import Groq
from config import config


class GroqClientManager:
    """
    Manages multiple Groq API keys with round-robin rotation.
    Each call to get_client() returns the next key in the cycle.
    """

    def __init__(self):
        self.keys = config.get_groq_api_keys()

        if not self.keys:
            raise ValueError("No Groq API keys found. Check your .env file.")

        self._cycle = itertools.cycle(self.keys)
        print(f"[OK] GroqClientManager initialized with {len(self.keys)} key(s)")

    def get_client(self) -> Groq:
        """Returns a Groq client initialized with the next key in rotation"""
        key = next(self._cycle)
        return Groq(api_key=key)

    def chat(
        self,
        prompt: str,
        model: str = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        system_prompt: str = "You are Artha, India's AI financial advisor. Be specific, actionable, and empathetic."
    ) -> str:
        """
        Single method to call Groq chat completion.
        Automatically picks the next client in rotation.

        Args:
            prompt: The user prompt with all financial data embedded
            model: Override model — defaults to GROQ_MODEL_LARGE from config
            max_tokens: Max response length
            temperature: 0.7 is a good balance for financial advice (not too creative)
            system_prompt: Artha's persona

        Returns:
            The AI response as a plain string
        """
        client = self.get_client()
        model = model or config.GROQ_MODEL_LARGE

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": prompt},
            ],
            max_tokens=max_tokens,
            temperature=temperature,
        )

        return response.choices[0].message.content.strip()

    def extract(self, prompt: str, max_tokens: int = 1024) -> str:
        """
        Dedicated method for PDF extraction tasks.
        Uses the smaller, faster LLaMA 8B model.
        Lower temperature (0.1) for deterministic JSON output.
        """
        return self.chat(
            prompt=prompt,
            model=config.GROQ_MODEL_SMALL,
            max_tokens=max_tokens,
            temperature=0.1,
            system_prompt="You are a data extraction assistant. Always respond with valid JSON only. No explanation, no markdown, no preamble."
        )


# Singleton — import this everywhere, don't instantiate again
groq_manager = GroqClientManager()


def get_groq_client() -> Groq:
    """
    Utility function to get a Groq client.
    Uses the groq_manager singleton for API key rotation.

    Returns:
        Groq client initialized with next key in rotation
    """
    return groq_manager.get_client()