import logging
import re
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Request
from sqlalchemy import select

from app.deps import CurrentUser, DbSession
from app.models import WeeklyPlanDay
from app.schemas import AIUserContextOut, CoachChatRequest, CoachChatResponse, PlanModification
from app.services.account_state_service import AccountStateService
from app.services.ai.exercise_catalog import (
    COMMON_SLUG_ALIASES,
    ExerciseNotFoundError,
    resolve_and_enrich_exercise,
)
from app.services.ai import BaseAIEngine, HybridAIEngine
from app.services.ai.base import (
    extract_coach_json_data,
    extract_quick_replies_from_text,
    is_json_leak,
    resolve_contextual_quick_replies,
    strip_orphan_bullets,
)
from app.services.media import MediaUrls


logger = logging.getLogger(__name__)


def _clean_str_field(val: Any, fallback: str | None = None) -> str | None:
    # Biztonságos szöveggé alakítás adatbázisba mentés előtt
    if val is None:
        return fallback
    if isinstance(val, str):
        s = val.strip()
        return s if s else fallback
    if isinstance(val, dict):
        if val.get("title"):
            return str(val["title"]).strip()
        if val.get("name"):
            return str(val["name"]).strip()
        if val.get("hu"):
            return str(val["hu"]).strip()
        if val.get("en"):
            return str(val["en"]).strip()
        if val.get("text"):
            return str(val["text"]).strip()
        parts = [f"{k}: {v}" for k, v in val.items() if v is not None and not isinstance(v, (dict, list))]
        return " · ".join(parts) if parts else fallback
    if isinstance(val, (list, tuple)):
        parts = [str(x).strip() for x in val if x and not isinstance(x, (dict, list))]
        return " · ".join(parts) if parts else fallback
    return str(val).strip()


def _format_updated_details(
    old_details: str,
    sets: int | None = None,
    reps: str | int | None = None,
    rest_seconds: int | None = None,
) -> str:
    # Gyakorlatok részletes frissítése sorozatokkal és pihenőidővel
    match = re.match(r"^(\d+)\s*x\s*([^·]+?)(?:\s*·\s*(\d+)s?\s*rest)?$", (old_details or "").strip(), re.IGNORECASE)
    if match:
        cur_sets, cur_reps, cur_rest = match.groups()
        new_sets = str(sets) if sets is not None else cur_sets
        new_reps = str(reps).strip() if reps is not None else cur_reps.strip()
        new_rest = str(rest_seconds) if rest_seconds is not None else (cur_rest if cur_rest else "60")
        return f"{new_sets} x {new_reps} · {new_rest}s rest"

    s = sets if sets is not None else 3
    r = reps if reps is not None else "10-12"
    rst = f" · {rest_seconds}s rest" if rest_seconds is not None else " · 60s rest"
    return f"{s} x {r}{rst}"


def _sanitize_quick_replies(quick_replies: list[str] | None) -> list[str]:
    # Gyorsválasz gombok ellenőrzése
    if not quick_replies:
        return []

    sanitized: list[str] = []
    replacements = [
        # A gyors buborék szövegek fixálása
        # Egyes szám első személyű megfogalmazások cseréje felszólító módra
        (re.compile(r"^módosítsam\s+", re.IGNORECASE), "Módosítsd "),
        (re.compile(r"^módosítanám\s+", re.IGNORECASE), "Módosítsd "),
        (re.compile(r"^módosítom\s+", re.IGNORECASE), "Módosítsd "),
        (re.compile(r"^részletezem\s+", re.IGNORECASE), "Részletezd "),
        (re.compile(r"^részletezném\s+", re.IGNORECASE), "Részletezd "),
        (re.compile(r"^megmutatom\s+", re.IGNORECASE), "Mutasd meg "),
        (re.compile(r"^mutatom\s+", re.IGNORECASE), "Mutasd meg "),
        (re.compile(r"^kiszámolom\s+", re.IGNORECASE), "Számold ki "),
        (re.compile(r"^elmondom\s+", re.IGNORECASE), "Mondd el "),
        (re.compile(r"^összeállítom\s+", re.IGNORECASE), "Állítsd össze "),
        (re.compile(r"^készítek\s+", re.IGNORECASE), "Készíts "),
        (re.compile(r"^elemezem\s+", re.IGNORECASE), "Elemezd "),
        (re.compile(r"^átnézem\s+", re.IGNORECASE), "Nézd át "),
        # Edzői utasítások átalakítása felhasználói kérésekké
        (re.compile(r"^kérj\s+(egy\s+)?új\s+gyakorlatot.*", re.IGNORECASE), "Adj egy új gyakorlatot mára!"),
        (re.compile(r"^kérj\s+gyakorlatot.*", re.IGNORECASE), "Adj egy új gyakorlatot mára!"),
        (re.compile(r"^kérj\s+", re.IGNORECASE), "Adj "),
        (re.compile(r"^kérdezz\s+a\s+technikáról.*", re.IGNORECASE), "Mutasd a helyes technikát!"),
        (re.compile(r"^kérdezz\s+(a\s+)?", re.IGNORECASE), "Mutasd a "),
        # Edzői kérdések átalakítása felhasználói válaszokká
        (re.compile(r"^még\s+valami\s+módosítandó\??", re.IGNORECASE), "Cseréljünk még egy gyakorlatot!"),
        (re.compile(r"^segíthetek.*\??", re.IGNORECASE), "Van még kérdésem!"),
        (re.compile(r"^van\s+még\s+kérdésed\??", re.IGNORECASE), "Mutass még tippeket!"),
        (re.compile(r"^készen\s+állsz.*\??", re.IGNORECASE), "Készen állok a mai edzésre!"),
        # Angol nyelvű magyarról
        (re.compile(r"^shall\s+i\s+modify\s+", re.IGNORECASE), "Modify "),
        (re.compile(r"^i\s+modify\s+", re.IGNORECASE), "Modify "),
        (re.compile(r"^ask\s+for\s+a\s+new\s+exercise.*", re.IGNORECASE), "Add a new exercise for today!"),
        (re.compile(r"^ask\s+about\s+technique.*", re.IGNORECASE), "Show correct exercise technique!"),
        (re.compile(r"^anything\s+else\s+to\s+modify\??", re.IGNORECASE), "Let's modify another exercise!"),
        (re.compile(r"^can\s+i\s+help.*\??", re.IGNORECASE), "I have another question!"),
        (re.compile(r"^i\s+detail\s+", re.IGNORECASE), "Detail "),
        (re.compile(r"^i\s+will\s+detail\s+", re.IGNORECASE), "Detail "),
        (re.compile(r"^i\s+show\s+", re.IGNORECASE), "Show "),
        (re.compile(r"^i\s+calculate\s+", re.IGNORECASE), "Calculate "),
    ]

    imperative_starts = (
        "módosítsd", "részletezd", "mutasd", "számold", "mondd",
        "állítsd", "készíts", "adj", "elemezd", "nézd át",
        "modify", "detail", "show", "calculate"
    )

    for item in quick_replies:
        if not isinstance(item, str):
            continue
        cleaned = item.strip()
        for pattern, repl in replacements:
            if pattern.search(cleaned):
                cleaned = pattern.sub(repl, cleaned)
                break
        if any(cleaned.lower().startswith(start) for start in imperative_starts) and cleaned.endswith("?"):
            cleaned = cleaned[:-1] + "!"
        if cleaned:
            sanitized.append(cleaned)

    return sanitized


def _clean_reply_text(text: str | None) -> str:
    # Formázási hibák és felesleges jelölők eltávolítása a válaszból
    if not text:
        return ""
    # Kiszivárgott gyorsválasz szövegblokk eltávolítása
    cleaned, _ = extract_quick_replies_from_text(text)
    # A szöveg végén maradt szivárgó JSON blokk levágása
    if "{" in cleaned:
        brace_idx = cleaned.find("{")
        if is_json_leak(cleaned[brace_idx:]):
            cleaned = cleaned[:brace_idx].strip()
    cleaned = re.sub(r"\*\*(.+?)\*\*", r"\1", cleaned)
    cleaned = re.sub(r"__(.+?)__", r"\1", cleaned)
    cleaned = re.sub(r"(?m)^\s{0,3}#{1,6}\s*", "", cleaned)
    cleaned = re.sub(r"(?m)^\s*[\*•]\s+", "• ", cleaned)
    cleaned = re.sub(r"(?m)^\s*-\s+", "• ", cleaned)
    cleaned = strip_orphan_bullets(cleaned)
    return cleaned.strip()

router = APIRouter(prefix="/coach", tags=["coach"])

_engine: BaseAIEngine | None = None


def get_ai_engine() -> BaseAIEngine:
    global _engine
    if _engine is None:
        _engine = HybridAIEngine()
    return _engine


@router.get("/context", response_model=AIUserContextOut)
def get_ai_user_context(
    current_user: CurrentUser,
    db: DbSession,
) -> AIUserContextOut:
    """Felhasználói állapot összefoglalása az AI számára."""
    context_out = AccountStateService.build_ai_user_context(db, current_user)
    db.commit()
    return context_out


@router.post("/chat", response_model=CoachChatResponse)
def coach_chat(
    req: CoachChatRequest,
    current_user: CurrentUser,
    db: DbSession,
    request: Request,
) -> CoachChatResponse:
    #  Strukturált profil és fiókkontextus felépítése a felhasználókhoz
    day_names_hu = AccountStateService.DAY_NAMES_HU
    day_codes = AccountStateService.DAY_CODES
    today_weekday = datetime.now().weekday()  # 0 = hétfő, 6 = vasárnap

    ai_ctx = AccountStateService.build_ai_user_context(db, current_user)
    db.commit()

    weekly_schedule = ai_ctx.weekly_schedule
    today_item = (
        weekly_schedule[today_weekday]
        if len(weekly_schedule) > today_weekday
        else {"workout_title": "Workout"}
    )
    today_workout_desc = today_item.get("workout_title", "Workout")

    bio = ai_ctx.biometrics_and_bmi
    cons = ai_ctx.consistency_and_streaks

    user_context = {
        "name": ai_ctx.identity.get("name", "Athlete"),
        "fitness_goal": bio.get("fitness_goal"),
        "fitness_level": bio.get("fitness_level"),
        "gender": bio.get("gender"),
        "age": bio.get("age"),
        "weight": bio.get("weight_kg"),
        "height": bio.get("height_cm"),
        "target_weight": bio.get("target_weight_kg"),
        "bmi": bio.get("bmi"),
        "bmi_category": bio.get("bmi_category"),
        "weight_trajectory": bio.get("weight_trajectory"),
        "streak": cons.get("streak_days", 0),
        "best_streak": cons.get("best_streak_days", 0),
        "sessions_this_week": cons.get("sessions_this_week", 0),
        "weekly_target": cons.get("weekly_target", 4),
        "total_workouts": cons.get("total_workouts", 0),
        "total_minutes": cons.get("total_minutes", 0),
        "total_calories_burned": cons.get("total_calories_burned", 0),
        "today_weekday": today_weekday,
        "today_day_name": day_names_hu[today_weekday],
        "today_workout": today_workout_desc,
        "weekly_schedule": weekly_schedule,
        "recent_workout_sessions": ai_ctx.recent_workout_sessions,
        "achievements_summary": ai_ctx.achievements_summary,
        "preferences_and_notifications": ai_ctx.preferences_and_notifications,
        "recognized_patterns": ai_ctx.recognized_patterns,
    }

    engine = get_ai_engine()
    reply = engine.generate_coach_reply(
        user_context=user_context,
        message=req.message,
        history=req.history,
        language=req.language,
    )

    #  Ha a modell kihagyta a plan_modification objektumot, de a felhasználó rögzítést/mentést kért,
    # vagy a modell szövegesen azt állította, hogy elmentette, helyreállítjuk a tervet az előzményekből
    if not reply.plan_modification:
        is_save_request = bool(
            re.search(
                r"\b(r[oöő]gz[ií]t|ments?d|ment[eé]s|alkalmaz|v[aá]gjunk\s+bele|legyen\s+ez|k[eé]sz[ií]ts?d)\b",
                req.message,
                re.IGNORECASE,
            )
            or re.search(
                r"\b(r[oöő]gz[ií]tettem|elmentettem|mentettem)\b",
                reply.reply_text,
                re.IGNORECASE,
            )
        )
        if is_save_request:
            for prev_msg in reversed(req.history):
                prev_text = (prev_msg.content or "").strip()
                if '"full_plan"' in prev_text or "generate_full_plan" in prev_text or '"slug"' in prev_text:
                    prev_parsed = extract_coach_json_data(prev_text, req.language)
                    if prev_parsed.get("plan_modification"):
                        try:
                            reply.plan_modification = PlanModification(**prev_parsed["plan_modification"])
                            break
                        except Exception:
                            pass

    #  Ha az AI edzésterv-módosítást generált, alkalmazzuk a felhasználó edzéstervére
    if reply.plan_modification:
        try:
            media = MediaUrls.from_request(request)
            plan_days_by_idx: dict[int, WeeklyPlanDay] = {
                row.day_of_week: row
                for row in AccountStateService.ensure_weekly_plan_days(db, current_user.id)
            }
            mod = reply.plan_modification

            if mod.action == "swap_days" and mod.source_day is not None and mod.target_day is not None:
                src_idx = int(mod.source_day) % 7
                tgt_idx = int(mod.target_day) % 7

                src_day = plan_days_by_idx[src_idx]
                tgt_day = plan_days_by_idx[tgt_idx]

                src_type = src_day.type
                src_title = src_day.workout_title
                src_meta = src_day.workout_meta
                src_ex = src_day.exercises

                src_day.type = tgt_day.type
                src_day.workout_title = tgt_day.workout_title
                src_day.workout_meta = tgt_day.workout_meta
                src_day.exercises = tgt_day.exercises

                tgt_day.type = src_type
                tgt_day.workout_title = src_title
                tgt_day.workout_meta = src_meta
                tgt_day.exercises = src_ex

                AccountStateService.sync_weekly_target_from_plan(db, current_user.id)
                db.commit()

            elif mod.action == "set_rest_day":
                target_idx = mod.day_of_week if mod.day_of_week is not None else today_weekday
                target_idx = int(target_idx) % 7
                pday = plan_days_by_idx[target_idx]
                pday.type = "rest"
                pday.workout_title = None
                pday.workout_meta = None
                pday.exercises = []
                AccountStateService.sync_weekly_target_from_plan(db, current_user.id)
                db.commit()

            elif mod.action == "replace_exercise":
                target_idx = mod.day_of_week if mod.day_of_week is not None else today_weekday
                target_idx = int(target_idx) % 7
                pday = plan_days_by_idx[target_idx]
                if pday.type != "workout" or not pday.exercises:
                    raise ValueError(f"Day {target_idx} does not contain an active workout with exercises.")
                if not mod.new_exercise:
                    raise ValueError("replace_exercise requires 'new_exercise' payload.")

                # Az új gyakorlat feloldása szigorú adatbázis ellenőrzéssel
                enriched_new = resolve_and_enrich_exercise(
                    db, media, mod.new_exercise, fallback_index=1, strict=True
                )

                target_slug = (mod.target_slug or "").lower().strip()
                target_slug = COMMON_SLUG_ALIASES.get(target_slug, target_slug)
                target_id = str(mod.target_exercise_id or "").strip()

                found_idx = -1
                for i, ex in enumerate(pday.exercises):
                    if not isinstance(ex, dict):
                        continue
                    ex_slug = str(ex.get("slug") or "").lower().strip()
                    ex_slug = COMMON_SLUG_ALIASES.get(ex_slug, ex_slug)
                    ex_id = str(ex.get("id") or "").strip()
                    ex_title = str(ex.get("title") or "").lower().strip()
                    if target_slug and (ex_slug == target_slug or ex_title == target_slug):
                        found_idx = i
                        break
                    if target_id and ex_id == target_id:
                        found_idx = i
                        break

                if found_idx == -1:
                    raise ValueError(f"Target exercise '{target_slug or target_id}' not found in day {target_idx} workout.")

                existing_exercises = list(pday.exercises)
                enriched_new["number"] = existing_exercises[found_idx].get("number", f"{found_idx + 1:02d}")
                existing_exercises[found_idx] = enriched_new
                pday.exercises = existing_exercises

                AccountStateService.sync_weekly_target_from_plan(db, current_user.id)
                db.commit()

            elif mod.action == "add_exercise":
                target_idx = mod.day_of_week if mod.day_of_week is not None else today_weekday
                target_idx = int(target_idx) % 7
                pday = plan_days_by_idx[target_idx]
                pday.type = "workout"
                if not pday.workout_title:
                    pday.workout_title = "Workout"
                if not mod.exercise:
                    raise ValueError("add_exercise requires 'exercise' payload.")

                existing_exercises = list(pday.exercises or [])
                new_idx = len(existing_exercises) + 1
                enriched_ex = resolve_and_enrich_exercise(
                    db, media, mod.exercise, fallback_index=new_idx, strict=True
                )
                existing_exercises.append(enriched_ex)
                pday.exercises = existing_exercises
                pday.workout_meta = f"{len(existing_exercises)} exercises"

                AccountStateService.sync_weekly_target_from_plan(db, current_user.id)
                db.commit()

            elif mod.action == "remove_exercise":
                target_idx = mod.day_of_week if mod.day_of_week is not None else today_weekday
                target_idx = int(target_idx) % 7
                pday = plan_days_by_idx[target_idx]
                if pday.type != "workout" or not pday.exercises:
                    raise ValueError(f"Day {target_idx} does not contain an active workout to remove exercises from.")

                target_slug = (mod.target_slug or "").lower().strip()
                target_slug = COMMON_SLUG_ALIASES.get(target_slug, target_slug)
                target_id = str(mod.target_exercise_id or "").strip()

                found_idx = -1
                for i, ex in enumerate(pday.exercises):
                    if not isinstance(ex, dict):
                        continue
                    ex_slug = str(ex.get("slug") or "").lower().strip()
                    ex_slug = COMMON_SLUG_ALIASES.get(ex_slug, ex_slug)
                    ex_id = str(ex.get("id") or "").strip()
                    ex_title = str(ex.get("title") or "").lower().strip()
                    if target_slug and (ex_slug == target_slug or ex_title == target_slug):
                        found_idx = i
                        break
                    if target_id and ex_id == target_id:
                        found_idx = i
                        break

                if found_idx == -1:
                    raise ValueError(f"Target exercise '{target_slug or target_id}' not found in day {target_idx} workout.")

                existing_exercises = [ex for i, ex in enumerate(pday.exercises) if i != found_idx]
                for i, ex in enumerate(existing_exercises):
                    if isinstance(ex, dict):
                        ex["number"] = f"{i + 1:02d}"

                pday.exercises = existing_exercises
                pday.workout_meta = f"{len(existing_exercises)} exercises"

                AccountStateService.sync_weekly_target_from_plan(db, current_user.id)
                db.commit()

            elif mod.action == "update_exercise_parameters":
                target_idx = mod.day_of_week if mod.day_of_week is not None else today_weekday
                target_idx = int(target_idx) % 7
                pday = plan_days_by_idx[target_idx]
                if pday.type != "workout" or not pday.exercises:
                    raise ValueError(f"Day {target_idx} does not contain an active workout to update.")

                target_slug = (mod.target_slug or "").lower().strip()
                target_slug = COMMON_SLUG_ALIASES.get(target_slug, target_slug)
                target_id = str(mod.target_exercise_id or "").strip()

                existing_exercises = [dict(ex) for ex in pday.exercises if isinstance(ex, dict)]
                updated_count = 0

                for ex in existing_exercises:
                    ex_slug = str(ex.get("slug") or "").lower().strip()
                    ex_slug = COMMON_SLUG_ALIASES.get(ex_slug, ex_slug)
                    ex_id = str(ex.get("id") or "").strip()
                    ex_title = str(ex.get("title") or "").lower().strip()

                    should_update = False
                    if not target_slug and not target_id:
                        should_update = True
                    elif target_slug and (ex_slug == target_slug or ex_title == target_slug):
                        should_update = True
                    elif target_id and ex_id == target_id:
                        should_update = True

                    if should_update:
                        old_details = str(ex.get("details") or "")
                        ex["details"] = _format_updated_details(
                            old_details,
                            sets=mod.sets,
                            reps=mod.reps,
                            rest_seconds=mod.rest_seconds,
                        )
                        updated_count += 1

                if updated_count == 0:
                    raise ValueError(f"No exercises matching '{target_slug or target_id}' found to update on day {target_idx}.")

                pday.exercises = existing_exercises
                AccountStateService.sync_weekly_target_from_plan(db, current_user.id)
                db.commit()

            elif mod.action == "update_workout":
                target_idx = mod.day_of_week if mod.day_of_week is not None else today_weekday
                target_idx = int(target_idx) % 7
                pday = plan_days_by_idx[target_idx]
                pday.type = "workout"
                if mod.workout_title:
                    pday.workout_title = _clean_str_field(mod.workout_title, "Workout")
                elif not pday.workout_title:
                    pday.workout_title = "Workout"
                if mod.workout_meta:
                    pday.workout_meta = _clean_str_field(mod.workout_meta, f"{len(pday.exercises or [])} exercises")
                if mod.exercises is not None:
                    enriched_exercises = [
                        resolve_and_enrich_exercise(db, media, ex, i + 1, strict=True)
                        for i, ex in enumerate(mod.exercises)
                        if isinstance(ex, dict)
                    ]
                    pday.exercises = enriched_exercises
                    mod.exercises = enriched_exercises
                AccountStateService.sync_weekly_target_from_plan(db, current_user.id)
                db.commit()

            elif mod.action == "generate_full_plan" and mod.full_plan:
                updated_day_indices = set()
                enriched_plan = []
                skipped_exercises: list[str] = []
                for day_data in mod.full_plan:
                    if not isinstance(day_data, dict):
                        continue
                    d_idx = int(day_data.get("day_of_week", 0)) % 7
                    updated_day_indices.add(d_idx)
                    pday = plan_days_by_idx[d_idx]

                    day_type = str(day_data.get("type") or "workout").strip().lower()
                    if day_type not in ("workout", "rest"):
                        day_type = "workout"

                    formatted_exercises = []
                    if day_type == "workout":
                        # Az adatbázis gyakoraltibol kell létrehozni a edzéstervet, másból nem lehet.
                        for raw_ex in day_data.get("exercises") or []:
                            if not isinstance(raw_ex, dict):
                                continue
                            try:
                                formatted_exercises.append(
                                    resolve_and_enrich_exercise(
                                        db, media, raw_ex, len(formatted_exercises) + 1, strict=True
                                    )
                                )
                            except ExerciseNotFoundError:
                                skipped_exercises.append(
                                    str(raw_ex.get("title") or raw_ex.get("slug") or "?")
                                )
                        if not formatted_exercises:
                            raise ValueError(
                                f"Day {d_idx} has no valid exercises from the FitBase library."
                            )

                    raw_day_name = day_data.get("day_name")
                    pday.day_name = _clean_str_field(raw_day_name, day_codes[d_idx]) or day_codes[d_idx]
                    pday.type = day_type
                    pday.exercises = formatted_exercises
                    pday.workout_title = (
                        _clean_str_field(day_data.get("workout_title"), "Workout")
                        if day_type == "workout"
                        else None
                    )
                    pday.workout_meta = (
                        _clean_str_field(
                            day_data.get("workout_meta"),
                            f"{len(formatted_exercises)} exercises",
                        )
                        if day_type == "workout"
                        else None
                    )

                    day_dict = dict(day_data)
                    day_dict["type"] = day_type
                    day_dict["exercises"] = formatted_exercises
                    day_dict["workout_title"] = pday.workout_title
                    day_dict["workout_meta"] = pday.workout_meta
                    enriched_plan.append(day_dict)

        # Azok a napok, amelyeket a modell nem említett, automatikusan pihenőnapok lesznek.
                for d_idx in range(7):
                    if d_idx not in updated_day_indices:
                        pday = plan_days_by_idx[d_idx]
                        pday.type = "rest"
                        pday.workout_title = None
                        pday.workout_meta = None
                        pday.exercises = []

                mod.full_plan = enriched_plan
                AccountStateService.sync_weekly_target_from_plan(db, current_user.id)
                db.commit()

                if skipped_exercises:
                    is_hu_note = req.language == "hu" or (
                        req.language is None and any(ord(c) > 127 for c in req.message)
                    )
                    skipped_str = ", ".join(sorted(set(skipped_exercises)))
                    reply.reply_text = reply.reply_text.rstrip() + (
                        f"\n\n(Megjegyzés: ezek a gyakorlatok nincsenek a FitBase adatbázisban, ezért kimaradtak a tervből: {skipped_str}.)"
                        if is_hu_note
                        else f"\n\n(Note: these exercises are not in the FitBase library, so they were left out: {skipped_str}.)"
                    )

        except Exception as exc:
            db.rollback()
            logger.exception("Failed to apply plan modification: %s", exc)
            reply.plan_modification = None
            is_hu = req.language == "hu" or (req.language is None and any(ord(c) > 127 for c in req.message))
            if is_hu:
                reply.reply_text = (
                    "A kért edzésterv-módosítást nem sikerült elmenteni technikai ok miatt. "
                    "Az edzésterved változatlan maradt. Kérlek, próbáld újra, vagy pontosítsd a kérést!"
                )
            else:
                reply.reply_text = (
                    "Unable to apply the requested plan modification due to a technical issue. "
                    "Your workout plan remains unchanged. Please try again!"
                )

    cleaned_reply, extracted_qr = extract_quick_replies_from_text(reply.reply_text)
    reply.reply_text = _clean_reply_text(cleaned_reply)
    if extracted_qr:
        reply.quick_replies = extracted_qr

    generic_old_replies = {
        "mutasd a részleteket!",
        "módosítsd a mai edzésem!",
        "mikor lesz a következő edzésem?",
        "show details",
        "modify today's workout",
        "when is my next workout?",
        "tetszik, vágjunk bele!",
        "cseréljünk le egy gyakorlatot!",
        "hogyan étkezzek ehhez?",
        "sounds good!",
        "modify an exercise",
        "nutrition tips?",
    }
    is_generic = (
        not reply.quick_replies
        or all(r.lower().strip() in generic_old_replies for r in reply.quick_replies)
    )
    is_specific_topic = bool(
        re.search(
            r"hol edzel|milyen eszköz|hány napot|kérdésekre válaszolj|mielőtt összeállítanám|fittségi szint|konditerem|kézisúlyzó|technika|lapocká|nyújtás|regeneráció|fehérje|táplálkoz|étrend|személyes fitbase edződ|kizárólag a sportban",
            reply.reply_text,
            re.IGNORECASE,
        )
        or re.search(
            r"új edzésterv|készíts.*terv|csinálj.*terv|új terv|technika|hogyan végezzem|fáradt|étkez|gta",
            req.message,
            re.IGNORECASE,
        )
    )
    if is_generic and is_specific_topic:
        reply.quick_replies = resolve_contextual_quick_replies(
            reply.reply_text,
            req.message,
            req.language,
            user_context.get("preferences_and_notifications", {}).get("plan_structure"),
        )

    reply.quick_replies = _sanitize_quick_replies(reply.quick_replies)
    return reply
