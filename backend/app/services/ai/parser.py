# Az AI edző válaszait feldolgozó segédfüggvények.
# Javítja a levágott JSON válaszokat, kiszűri a szivárgó kódrészleteket, és kinyeri a gyorsválasz gombokat.

import json
import logging
import re
from typing import Any

logger = logging.getLogger(__name__)


def auto_close_json(s: str) -> str:
    # Visszafelé lezárja a nyitva maradt idézőjeleket és zárójeleket a verem segítségével
    stack: list[str] = []
    in_string = False
    escape = False
    for ch in s:
        if escape:
            escape = False
            continue
        if ch == '\\':
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if not in_string:
            if ch == '{':
                stack.append('}')
            elif ch == '[':
                stack.append(']')
            elif ch in ('}', ']'):
                if stack and stack[-1] == ch:
                    stack.pop()
    if in_string:
        s += '"'
    return s + "".join(reversed(stack))


def is_json_leak(text: str) -> bool:
    # Felismeri, ha a válasz nyers JSON-t tartalmaz
    if not text:
        return False
    patterns = [
        r'["\']?slug["\']?\s*:',
        r'["\']?day_of_week["\']?\s*:',
        r'["\']?exercises["\']?\s*:',
        r'["\']?plan_modification["\']?\s*:',
        r'["\']?workout_title["\']?\s*:',
        r'["\']?details["\']?\s*:',
        r'\}\s*,\s*\{',
        r'["\']?action["\']?\s*:\s*["\']',
        r'["\']?full_plan["\']?\s*:\s*\[',
    ]
    matches = sum(1 for p in patterns if re.search(p, text, re.IGNORECASE))
    stripped = text.strip()
    return matches >= 1 or (stripped.startswith("{") and stripped.endswith("}"))


def extract_quick_replies_from_text(text: str) -> tuple[str, list[str]]:
    # Kinyeri a szövegbe ágyazott gyorsválaszokat
    if not text:
        return text or "", []

    qr_pattern = re.compile(
        r"(?i)\n*(?:[\"']?quick[\s_-]*repl(?:ies|y)[\"']?|[\"']?gyors[\s_-]*v[aá]lasz(?:ok)?[\"']?)\s*:?\s*(\[[\s\S]*?\]|.*)",
        re.DOTALL,
    )
    match = qr_pattern.search(text)
    if not match:
        return text.strip(), []

    raw_qr_block = match.group(1).strip()
    extracted: list[str] = []

    # 1. Try parsing JSON array
    if "[" in raw_qr_block:
        bracket_start = raw_qr_block.find("[")
        bracket_end = raw_qr_block.rfind("]")
        candidate_json = (
            raw_qr_block[bracket_start : bracket_end + 1]
            if bracket_end > bracket_start
            else raw_qr_block[bracket_start:]
        )
        try:
            items = json.loads(auto_close_json(candidate_json), strict=False)
            if isinstance(items, list):
                extracted = [str(it).strip() for it in items if isinstance(it, str) and it.strip()]
        except Exception:
            pass

    # 2. Regex fallback for quotes if JSON array was malformed
    if not extracted:
        quotes = re.findall(r'["\']([^"\'\n\r]{2,80})["\']', raw_qr_block)
        if quotes:
            extracted = [q.strip() for q in quotes if q.strip()]

    # 3. Bullet points fallback (e.g. • Item 1)
    if not extracted:
        bullets = re.findall(r'(?m)^\s*[\*•-]\s*([^\n\r]{2,80})', raw_qr_block)
        if bullets:
            extracted = [b.strip() for b in bullets if b.strip()]

    cleaned_text = text[: match.start()].strip()
    return cleaned_text, extracted


def strip_orphan_bullets(text: str) -> str:
    # Eltávolítja a félbehagyott felsorolásjeleket a szöveg végéről
    if not text:
        return ""
    # Strip empty bullet lines
    cleaned = re.sub(r"(?m)^\s*[\*•-]\s*$", "", text).strip()
    # Strip trailing bullet symbol if text ends with one
    cleaned = re.sub(r"[\*•-]\s*$", "", cleaned).strip()
    # Normalize excessive blank lines
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def resolve_contextual_quick_replies(
    text: str,
    user_message: str | None = None,
    language: str | None = None,
    plan_structure: str | None = None,
) -> list[str]:
    # Kontextushoz illő gyorsválasz gombokat generál
    combined = f"{user_message or ''} {text or ''}".lower()
    is_hu = language != "en"

    # Determine plan structure (1_week, 2_week, or 4_week)
    struct = (plan_structure or "").lower()
    if not struct:
        if re.search(r"\b4\s*h[eé]t|\b4\s*hetes|\b4_week\b|négy\s*h[eé]t", combined):
            struct = "4_week"
        elif re.search(r"\b2\s*h[eé]t|\b2\s*hetes|\b2_week\b|két\s*h[eé]t", combined):
            struct = "2_week"
        else:
            struct = "1_week"

    if struct == "4_week":
        breakdown_btn = (
            "Mutasd a 4 hetes bontást, hetek szerinti programmal!"
            if is_hu
            else "Show 4-week breakdown and weekly schedule!"
        )
    elif struct == "2_week":
        breakdown_btn = (
            "Mutasd a 2 hetes bontást, hetek szerinti programmal!"
            if is_hu
            else "Show 2-week breakdown and weekly schedule!"
        )
    else:
        breakdown_btn = (
            "Mutasd a heti bontást: melyik nap milyen izomcsoport van!"
            if is_hu
            else "Show weekly breakdown: which muscle groups on which days!"
        )

    # 1. Diagnostic workout plan consultation (Coach asking calibration questions)
    if (
        re.search(r"hol edzel|milyen eszköz|hány napot|kérdésekre válaszolj|mielőtt összeállítanám|eszközök állnak|konditerem.*otthon", combined)
        or re.search(r"where do you train|what equipment|how many days|before building your plan", combined)
        or (user_message and re.search(r"\b(új\s+edzésterv|készíts.*terv|új\s+terv|tervezz|build.*plan|new.*plan|edzéstervet)\b", user_message.lower()) and ("?" in text or "válaszolj" in text or "mielőtt" in text))
    ):
        return (
            [
                "Változó / vegyes (terem és otthon, 4 nap)",
                "Konditerem (heti 5 nap)",
                "Otthon, kézisúlyzóval (3 nap)",
                "Csak saját testsúly (3 nap)",
            ]
            if is_hu
            else [
                "Mixed / flexible (gym & home, 4 days)",
                "Gym (5 days/week)",
                "Home with dumbbells (3 days)",
                "Bodyweight only (3 days)",
            ]
        )

    # 2. Plan presented or pending confirmation
    if (
        re.search(r"generate_full_plan|hétfő:.*kedd:|push.*pull|itt a beosztás|íme a heti|készítettem egy.*tervet", combined)
        or re.search(r"here is your weekly schedule|monday:.*tuesday:|push.*pull", combined)
    ):
        return (
            [
                "Rögzítsd ezt a tervet!",
                "Cseréljünk le egy gyakorlatot!",
                breakdown_btn,
            ]
            if is_hu
            else [
                "Save this workout plan!",
                "Modify an exercise",
                breakdown_btn,
            ]
        )

    # 3. Plan confirmed / saved
    if (
        re.search(r"rögzítettem|elmentettem|mentve|beállítottam a tervet|sikeresen frissítettem", combined)
        or re.search(r"saved your plan|plan has been recorded|updated your schedule", combined)
    ):
        return (
            [
                "Készen állok a mai edzésre!",
                "Mutasd a mai gyakorlatokat!",
                "Mennyi pihenőt tartsak a sorozatok között?",
            ]
            if is_hu
            else [
                "Ready for today's workout!",
                "Show today's exercises!",
                "Rest periods between sets?",
            ]
        )

    # 4. Off-topic declined (staying on fitness persona)
    if (
        re.search(r"kizárólag a sportban|személyes fitbase edződ|maradjunk a (céljaidnál|formába)", combined)
        or re.search(r"strictly on your training|as your fitbase personal coach", combined)
    ):
        return (
            [
                "Ma milyen edzésem van?",
                "Készíts nekem új edzéstervet!",
                "Mutasd a heti beosztást!",
            ]
            if is_hu
            else [
                "What is my workout today?",
                "Create a new workout plan!",
                "Show my weekly schedule!",
            ]
        )

    # 5. Exercise technique / form execution
    if (
        re.search(r"technika|végrehajtás|szabályos|lapocká|fogás|tartás|form|technique|execution", combined)
    ):
        return (
            [
                "Milyen súlyt válasszak ehhez?",
                "Hány sorozatot végezzek?",
                "Cseréljük le ezt a gyakorlatot!",
            ]
            if is_hu
            else [
                "What weight should I use?",
                "How many sets?",
                "Swap this exercise!",
            ]
        )

    # 6. Rest day / recovery / fatigue
    if (
        re.search(r"pihenőnap|regeneráció|alvás|fáradtság|izomláz|rest day|recovery|soreness", combined)
    ):
        return (
            [
                "Milyen nyújtást javasolsz?",
                "Hogyan gyorsítsam a regenerációt?",
                "Mikor lesz a következő edzésem?",
            ]
            if is_hu
            else [
                "Recommended stretching?",
                "How to speed up recovery?",
                "When is my next workout?",
            ]
        )

    # 7. Nutrition / Diet / Calories
    if (
        re.search(r"táplálkoz|kalória|fehérje|makró|étrend|nutrition|protein|calories|diet", combined)
    ):
        return (
            [
                "Mennyi fehérjére van szükségem?",
                "Mit egyek edzés előtt?",
                "Mit egyek edzés után?",
            ]
            if is_hu
            else [
                "How much protein do I need?",
                "What to eat pre-workout?",
                "What to eat post-workout?",
            ]
        )

    # 8. General fallback
    return (
        [
            "Készíts nekem új edzéstervet!",
            "Módosítsd a mai edzésem!",
            "Mutasd be a helyes technikát!",
        ]
        if is_hu
        else [
            "Create a new workout plan!",
            "Modify today's workout!",
            "Show proper exercise form!",
        ]
    )


def extract_coach_json_data(
    raw_content: str,
    language: str | None = None,
    user_message: str | None = None,
    plan_structure: str | None = None,
) -> dict[str, Any]:
    # Kinyeri a szöveget, a gyorsválaszokat és az esetleges edzésterv-módosítást a modell válaszából
    raw_content = (raw_content or "").strip()
    if not raw_content:
        return {}

    parsed: dict[str, Any] | None = None

    # 1. Direct JSON parse with strict=False (allows unescaped literal newlines in strings)
    try:
        cand = json.loads(raw_content, strict=False)
        if isinstance(cand, dict):
            parsed = cand
    except Exception:
        pass

    # 2. Markdown code fences: ```json ... ``` or ``` ... ```
    if not parsed:
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw_content, re.IGNORECASE)
        if match:
            try:
                cand = json.loads(match.group(1).strip(), strict=False)
                if isinstance(cand, dict):
                    parsed = cand
            except Exception:
                pass

    # 3. Outer bracket search { ... } with direct parse or direct action extraction
    if not parsed:
        first_brace = raw_content.find("{")
        last_brace = raw_content.rfind("}")
        if first_brace != -1 and last_brace > first_brace:
            text_before = raw_content[:first_brace].strip()
            snippet = raw_content[first_brace : last_brace + 1]
            try:
                cand = json.loads(snippet, strict=False)
                if isinstance(cand, dict):
                    if "action" in cand:
                        parsed = {
                            "reply_text": text_before or "Elkészítettem a heti edzéstervedet!",
                            "plan_modification": cand,
                            "quick_replies": None,
                        }
                    else:
                        parsed = cand
            except Exception:
                pass

    # 4. Truncated JSON repair with stack-based auto-closing
    if not parsed and "{" in raw_content:
        first_brace = raw_content.find("{")
        text_before = raw_content[:first_brace].strip()
        snippet = raw_content[first_brace:]

        # Direct auto-close
        try:
            cand = json.loads(auto_close_json(snippet), strict=False)
            if isinstance(cand, dict):
                if "action" in cand:
                    parsed = {
                        "reply_text": text_before or "Elkészítettem a heti edzéstervedet!",
                        "plan_modification": cand,
                        "quick_replies": None,
                    }
                elif "reply_text" in cand or "plan_modification" in cand:
                    parsed = cand
        except Exception:
            pass

        # Peel back incomplete trailing elements if needed
        if not parsed:
            cleaned = snippet
            for _ in range(40):
                last_break = max(cleaned.rfind(","), cleaned.rfind("}"), cleaned.rfind("]"))
                if last_break == -1:
                    break
                cleaned = cleaned[:last_break]
                if cleaned.endswith(","):
                    cleaned = cleaned[:-1]
                try:
                    cand = json.loads(auto_close_json(cleaned), strict=False)
                    if isinstance(cand, dict):
                        if "action" in cand:
                            parsed = {
                                "reply_text": text_before or "Elkészítettem a heti edzéstervedet!",
                                "plan_modification": cand,
                                "quick_replies": None,
                            }
                            break
                        elif "reply_text" in cand or "plan_modification" in cand:
                            parsed = cand
                            break
                except Exception:
                    continue

    # 5. Regex recovery if still unparsed
    if not parsed:
        reply_match = re.search(r'"reply_text"\s*:\s*"((?:[^"\\]|\\.)*)"', raw_content, re.DOTALL)
        clean_reply = None
        if reply_match:
            try:
                clean_reply = json.loads(f'"{reply_match.group(1)}"', strict=False)
            except Exception:
                clean_reply = reply_match.group(1)

        # Look for plan_modification block
        plan_mod = None
        plan_match = re.search(r'"plan_modification"\s*:\s*(\{[\s\S]*\})', raw_content)
        if plan_match:
            try:
                plan_mod = json.loads(auto_close_json(plan_match.group(1)), strict=False)
            except Exception:
                pass

        if clean_reply or plan_mod:
            parsed = {
                "reply_text": clean_reply,
                "quick_replies": None,
                "plan_modification": plan_mod,
            }

    # 6. Fallback if natural conversational prose
    if not parsed:
        cleaned_content, leaked_qr = extract_quick_replies_from_text(raw_content)
        cleaned_content = strip_orphan_bullets(cleaned_content)
        if "{" in cleaned_content:
            trailing_brace = cleaned_content.find("{")
            if is_json_leak(cleaned_content[trailing_brace:]):
                cleaned_content = cleaned_content[:trailing_brace].strip()
                cleaned_content = strip_orphan_bullets(cleaned_content)

        # Check if the model dumped raw unparsed JSON code or parameter fragments
        is_param_fragment = bool(
            re.search(r"\d+\s*x\s*[\d/]+|\brest\b|[\"']?\w+[\"']?\s*:", cleaned_content, re.IGNORECASE)
        )
        contextual_defaults = resolve_contextual_quick_replies(
            cleaned_content or raw_content, user_message, language, plan_structure
        )
        if (
            is_json_leak(cleaned_content)
            or cleaned_content.endswith(("}", "]", ",", "{", "["))
            or not cleaned_content
            or (is_json_leak(raw_content) and is_param_fragment)
        ):
            default_reply = (
                "Rögzítettem a kért edzéstervedet! A részletes heti beosztást a naptáradban és az Edzésterv menüpontban tekintheted meg."
                if language != "en"
                else "I have created and recorded your workout plan! You can view the full schedule in the calendar."
            )
            return {
                "reply_text": default_reply,
                "quick_replies": (
                    leaked_qr if leaked_qr else contextual_defaults
                ),
                "plan_modification": None,
            }

        effective_qr = leaked_qr if leaked_qr else contextual_defaults
        return {
            "reply_text": cleaned_content,
            "quick_replies": effective_qr,
            "plan_modification": None,
        }

    # Post-process parsed object: NEVER leak JSON into reply_text and rescue leaked quick_replies
    reply_text = str(parsed.get("reply_text") or "")
    cleaned_reply, leaked_qr = extract_quick_replies_from_text(reply_text)
    reply_text = strip_orphan_bullets(cleaned_reply)

    if leaked_qr:
        parsed["quick_replies"] = leaked_qr

    if "{" in reply_text:
        trailing_brace = reply_text.find("{")
        if is_json_leak(reply_text[trailing_brace:]):
            reply_text = reply_text[:trailing_brace].strip()
            reply_text = strip_orphan_bullets(reply_text)

    if not reply_text or is_json_leak(str(reply_text)):
        reply_text = (
            "Rögzítettem a kért edzéstervedet! A részletes heti beosztást a naptáradban és az Edzésterv menüpontban tekintheted meg."
            if language != "en"
            else "I have created and recorded your workout plan! You can view the full schedule in the calendar."
        )

    # Clean up full_plan if plan_modification action is generate_full_plan
    plan_mod = parsed.get("plan_modification")
    if isinstance(plan_mod, dict) and plan_mod.get("action") == "generate_full_plan":
        full_plan = plan_mod.get("full_plan")
        if isinstance(full_plan, list) and full_plan:
            for day in full_plan:
                if isinstance(day, dict):
                    wt = day.get("workout_title")
                    if isinstance(wt, dict):
                        day["workout_title"] = (
                            wt.get("title") or wt.get("name") or wt.get("hu") or wt.get("en") or "Workout"
                        )
                    elif wt is not None and not isinstance(wt, str):
                        day["workout_title"] = str(wt).strip()

                    wm = day.get("workout_meta")
                    if isinstance(wm, dict):
                        parts = [f"{k}: {v}" for k, v in wm.items() if v is not None and not isinstance(v, (dict, list))]
                        day["workout_meta"] = " · ".join(parts) if parts else None
                    elif wm is not None and not isinstance(wm, str):
                        day["workout_meta"] = str(wm).strip()

            existing_days = {int(d.get("day_of_week", 0)) % 7 for d in full_plan if isinstance(d, dict)}
            for d in range(7):
                if d not in existing_days:
                    full_plan.append({
                        "day_of_week": d,
                        "type": "rest",
                        "workout_title": None,
                        "workout_meta": None,
                        "exercises": [],
                    })
            full_plan.sort(key=lambda d: int(d.get("day_of_week", 0)))
            plan_mod["full_plan"] = full_plan

    quick_replies = parsed.get("quick_replies")
    if not isinstance(quick_replies, list) or not quick_replies:
        quick_replies = resolve_contextual_quick_replies(
            reply_text, user_message, language, plan_structure
        )

    return {
        "reply_text": str(reply_text).strip(),
        "quick_replies": quick_replies,
        "plan_modification": plan_mod,
    }
