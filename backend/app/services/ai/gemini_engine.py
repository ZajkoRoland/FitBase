import json
import logging
from typing import Any

import httpx

from app.config import get_settings
from app.schemas import CoachChatMessage, CoachChatResponse, PlanModification
from app.services.ai.base import BaseAIEngine, extract_coach_json_data, is_json_leak

logger = logging.getLogger(__name__)


class GeminiAIEngine(BaseAIEngine):
    """Google Gemini Flash implementation of the FitBase AI Engine.

    Features 1,000,000 token context window, native JSON schema support,
    and a massive 1,500 daily requests free quota with 1M TPM.
    """

    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        settings = get_settings()
        self.api_key = api_key or settings.gemini_api_key
        self.model = model or settings.gemini_model or "gemini-2.0-flash"
        self.is_configured = bool(self.api_key and self.api_key.strip())

    def generate_coach_reply(
        self,
        user_context: dict[str, Any],
        message: str,
        history: list[CoachChatMessage],
        language: str | None = None,
    ) -> CoachChatResponse:
        if not self.is_configured:
            raise ValueError("GEMINI_API_KEY is not configured in backend settings.")

        system_prompt = self.build_system_prompt(user_context, language)

        # Build clean alternating history for Gemini contents
        contents: list[dict[str, Any]] = []
        prior = list(history)
        if prior and prior[-1].role == "user" and (prior[-1].content or "").strip() == message.strip():
            prior = prior[:-1]

        last_role: str | None = None
        for item in prior[-6:]:
            text = (item.content or "").strip()
            if not text:
                continue
            if item.role == "assistant" and is_json_leak(text):
                parsed_prev = extract_coach_json_data(text, language)
                text = parsed_prev.get("reply_text") or "Összeállítottam a heti edzéstervedet."
            if len(text) > 4000:
                text = text[:4000] + "..."
            gemini_role = "model" if item.role == "assistant" else "user"
            if gemini_role == last_role and contents:
                contents[-1]["parts"][0]["text"] += f"\n{text}"
            else:
                contents.append({"role": gemini_role, "parts": [{"text": text}]})
                last_role = gemini_role

        # Ensure first element is user if contents is non-empty
        if contents and contents[0]["role"] != "user":
            contents = contents[1:]

        # Append the new user message
        if contents and contents[-1]["role"] == "user":
            contents[-1]["parts"][0]["text"] += f"\n{message}"
        else:
            contents.append({"role": "user", "parts": [{"text": message}]})

        candidate_models = [self.model, "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"]
        models_to_try: list[str] = []
        for m in candidate_models:
            if m and m not in models_to_try:
                models_to_try.append(m)

        last_err = None
        data: dict[str, Any] = {}

        for chosen_model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{chosen_model}:generateContent?key={self.api_key}"
            payload = {
                "systemInstruction": {"parts": [{"text": system_prompt}]},
                "contents": contents,
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "temperature": 0.2,
                    "maxOutputTokens": 4000,
                },
            }

            try:
                with httpx.Client(timeout=25.0) as client:
                    resp = client.post(url, json=payload, headers={"Content-Type": "application/json"})

                if resp.status_code == 200:
                    resp_json = resp.json()
                    candidates = resp_json.get("candidates") or []
                    if candidates:
                        content_obj = candidates[0].get("content") or {}
                        parts = content_obj.get("parts") or []
                        if parts:
                            raw_text = parts[0].get("text", "")
                            data = extract_coach_json_data(raw_text, language, message)
                            if data.get("reply_text"):
                                break
                else:
                    logger.warning(
                        "Gemini API returned status %d on model %s: %s",
                        resp.status_code,
                        chosen_model,
                        resp.text[:200],
                    )
                    last_err = RuntimeError(f"Gemini API status {resp.status_code}: {resp.text[:100]}")
            except Exception as req_err:
                logger.warning("Gemini API request failed on model %s: %s", chosen_model, req_err)
                last_err = req_err

        if not data:
            if last_err:
                raise last_err
            raise RuntimeError("Gemini failed to return valid candidate content.")

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

