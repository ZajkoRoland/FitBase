import json
import logging
import re
import time
from typing import Any
import groq
from groq import Groq

from app.config import get_settings
from app.schemas import CoachChatMessage, CoachChatResponse, PlanModification
from app.services.ai.base import BaseAIEngine, extract_coach_json_data, is_json_leak

logger = logging.getLogger(__name__)


class GroqAIEngine(BaseAIEngine):
    """Groq-powered implementation of the FitBase AI Engine.

    Utilizes open-weights models running on Groq LPUs for sub-second responses.
    """

    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        settings = get_settings()
        self.api_key = api_key or settings.groq_api_key
        self.model = model or settings.groq_model
        if not self.api_key:
            raise ValueError("GROQ_API_KEY is not configured in backend settings.")

        self.client = Groq(api_key=self.api_key)

    def generate_coach_reply(
        self,
        user_context: dict[str, Any],
        message: str,
        history: list[CoachChatMessage],
        language: str | None = None,
    ) -> CoachChatResponse:
        try:
            system_prompt = self.build_system_prompt(user_context, language)

            messages: list[dict[str, str]] = [
                {"role": "system", "content": system_prompt}
            ]

            # The mobile client sends the history *including* the message being sent now.
            # Drop that trailing duplicate so the model doesn't see the same request twice
            # and the history window holds real prior turns.
            prior = list(history)
            if prior and prior[-1].role == "user" and (prior[-1].content or "").strip() == message.strip():
                prior = prior[:-1]

            # Last 6 prior turns
            for item in prior[-6:]:
                content = (item.content or "").strip()
                if not content:
                    continue
                # If assistant message had raw leaked JSON, clean it up so the model doesn't continue generating JSON
                if item.role == "assistant" and is_json_leak(content):
                    parsed_prev = extract_coach_json_data(content, language)
                    content = parsed_prev.get("reply_text") or "Összeállítottam a heti edzéstervedet."
                if len(content) > 2500:
                    content = content[:2500] + "..."
                messages.append({"role": item.role, "content": content})

            messages.append({"role": "user", "content": message})

            # Models to try with automatic rate-limit backoff and failover.
            # qwen/qwen3.8-27b is given primary preference for high speed, generous limits and multilingual stability.
            candidate_models = [self.model, "qwen/qwen3.8-27b", "openai/gpt-oss-20b", "openai/gpt-oss-120b"]
            models_to_try: list[str] = []
            for m in candidate_models:
                if m and m not in models_to_try:
                    models_to_try.append(m)

            # Ensure qwen is first candidate for immediate reliability and zero-token-exhaustion risk
            if "qwen/qwen3.8-27b" in models_to_try:
                models_to_try.remove("qwen/qwen3.8-27b")
                models_to_try.insert(0, "qwen/qwen3.8-27b")

            data: dict[str, Any] = {}
            last_err = None

            for attempt, chosen_model in enumerate(models_to_try):
                try:
                    completion = self.client.chat.completions.create(
                        model=chosen_model,
                        messages=messages,
                        temperature=0.2,
                        max_tokens=3500,
                    )
                    if completion and completion.choices:
                        raw_content = completion.choices[0].message.content or ""
                        if raw_content.strip():
                            data = extract_coach_json_data(raw_content, language, message)
                            if data.get("reply_text"):
                                break
                except groq.BadRequestError as bad_req:
                    # Groq 400 error carrying failed_generation (e.g. if json validation tripped)
                    last_err = bad_req
                    body = getattr(bad_req, "body", None) or {}
                    err_obj = body.get("error", {}) if isinstance(body, dict) else {}
                    failed_gen = err_obj.get("failed_generation")
                    if failed_gen and str(failed_gen).strip():
                        logger.warning(
                            "Recovered text generation from Groq 400 error on attempt %d: %s...",
                            attempt + 1,
                            str(failed_gen)[:60],
                        )
                        data = extract_coach_json_data(str(failed_gen), language, message)
                        if data.get("reply_text"):
                            break
                    logger.warning("Groq BadRequestError on attempt %d with model %s: %s", attempt + 1, chosen_model, bad_req)
                except (groq.RateLimitError, groq.APIConnectionError, groq.APITimeoutError, groq.APIStatusError) as transient_err:
                    last_err = transient_err
                    logger.warning(
                        "Groq transient error on attempt %d with model %s: %s. Failing over...",
                        attempt + 1,
                        chosen_model,
                        transient_err,
                    )
                    time.sleep(0.3)

            if not data and last_err is not None:
                raise last_err

            reply_text = data.get("reply_text") or (
                "Nem sikerült a választ feldolgozni. Próbáld újra!"
                if language != "en"
                else "Unable to process the response. Please try again!"
            )
            quick_replies = data.get("quick_replies")
            if not isinstance(quick_replies, list):
                quick_replies = []

            plan_mod_raw = data.get("plan_modification")
            plan_modification = None
            if isinstance(plan_mod_raw, dict) and "action" in plan_mod_raw:
                try:
                    plan_modification = PlanModification(**plan_mod_raw)
                except Exception as val_err:
                    logger.warning("Invalid plan_modification format: %s", val_err)

            return CoachChatResponse(
                reply_text=str(reply_text).strip(),
                quick_replies=[str(r).strip() for r in quick_replies if r][:4],
                plan_modification=plan_modification,
            )

        except Exception as e:
            logger.exception("Error while querying Groq API: %s", e)
            fallback_text = (
                "Sajnálom, átmeneti kapcsolódási hiba történt. Kérlek próbáld újra egy pillanat múlva!"
                if language != "en"
                else "Sorry, a temporary connection error occurred. Please try again in a moment!"
            )
            return CoachChatResponse(
                reply_text=fallback_text,
                quick_replies=(
                    ["Újrapróbálkozom", "Ma milyen edzésem van?"]
                    if language != "en"
                    else ["Try again", "What is my workout today?"]
                ),
            )
