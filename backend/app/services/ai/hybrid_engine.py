import logging
from typing import Any

from app.config import get_settings
from app.schemas import CoachChatMessage, CoachChatResponse
from app.services.ai.base import BaseAIEngine
from app.services.ai.gemini_engine import GeminiAIEngine
from app.services.ai.groq_engine import GroqAIEngine

logger = logging.getLogger(__name__)


class HybridAIEngine(BaseAIEngine):
    """Multi-Provider High-Availability AI Coach Engine (Adapter & Composite Pattern).

    Uses Google Gemini Flash as primary intelligence engine (1,000,000 token context,
    1,500 daily requests, native structured JSON), and automatically fails over to
    Groq LPU (Qwen 27B / GPT-OSS) if the primary engine encounters network or rate limits.
    """

    def __init__(self) -> None:
        settings = get_settings()
        self.gemini_engine: GeminiAIEngine | None = None
        if settings.gemini_api_key and settings.gemini_api_key.strip():
            try:
                self.gemini_engine = GeminiAIEngine(
                    api_key=settings.gemini_api_key,
                    model=settings.gemini_model,
                )
                logger.info("HybridAIEngine: Google Gemini engine initialized as primary.")
            except Exception as e:
                logger.warning("HybridAIEngine: Could not initialize Gemini engine: %s", e)

        self.groq_engine: GroqAIEngine = GroqAIEngine()
        logger.info("HybridAIEngine: Groq LPU engine initialized.")

    def generate_coach_reply(
        self,
        user_context: dict[str, Any],
        message: str,
        history: list[CoachChatMessage],
        language: str | None = None,
    ) -> CoachChatResponse:
        # 1. Try Google Gemini Flash if configured
        if self.gemini_engine and self.gemini_engine.is_configured:
            try:
                logger.info("HybridAIEngine: querying Google Gemini Flash...")
                return self.gemini_engine.generate_coach_reply(
                    user_context=user_context,
                    message=message,
                    history=history,
                    language=language,
                )
            except Exception as gemini_err:
                logger.warning(
                    "HybridAIEngine: Gemini transient error (%s). Seamlessly failing over to Groq LPU engine...",
                    gemini_err,
                )

        # 2. Seamless failover / Default: Groq LPU engine
        logger.info("HybridAIEngine: querying Groq LPU engine...")
        return self.groq_engine.generate_coach_reply(
            user_context=user_context,
            message=message,
            history=history,
            language=language,
        )

