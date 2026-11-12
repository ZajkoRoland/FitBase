# Gyakorlatkatalógus az AI edző promptjához és a gyakorlatok validálása az adatbázis alapján

from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models_catalog import Exercise, ExerciseTranslation
from app.services.media import MediaUrls


class ExerciseNotFoundError(ValueError):
    # Kivétel, ha a gyakorlat nem található a katalógusban

    def __init__(self, identifier: str):
        super().__init__(f"Exercise '{identifier}' not found in the FitBase catalog.")
        self.identifier = identifier

BODY_PART_COLOR_MAP: dict[str, str] = {
    "chest": "#4AB8F8",
    "back": "#A855F7",
    "shoulders": "#EAB308",
    "upper_legs": "#22C55E",
    "lower_legs": "#10B981",
    "upper_arms": "#EC4899",
    "lower_arms": "#F43F5E",
    "core": "#F97316",
    "full_body": "#14B8A6",
}

BODY_PART_BADGE_MAP: dict[str, str] = {
    "chest": "Chest",
    "back": "Back",
    "shoulders": "Shoulders",
    "upper_legs": "Legs",
    "lower_legs": "Calves",
    "upper_arms": "Arms",
    "lower_arms": "Forearms",
    "core": "Core",
    "full_body": "Full Body",
}

# Verified RepDB exercises (100% matched to PostgreSQL Exercise table rows)
LIBRARY_EXERCISES: list[dict[str, Any]] = [
    # --- Chest ---
    {
        "slug": "push-up",
        "title": "Push-Up",
        "muscleGroup": "Chest",
        "equipment": "bodyweight",
        "difficulty": "Beginner",
        "details": "3 x 12-15 · 60s rest",
        "badgeText": "Chest",
        "color": "#4AB8F8",
    },
    {
        "slug": "bench-press",
        "title": "Barbell Bench Press",
        "muscleGroup": "Chest",
        "equipment": "barbell",
        "difficulty": "Advanced",
        "details": "4 x 8-10 · 90s rest",
        "badgeText": "Chest",
        "color": "#4AB8F8",
    },
    {
        "slug": "db-bench-press",
        "title": "Dumbbell Bench Press",
        "muscleGroup": "Chest",
        "equipment": "dumbbell",
        "difficulty": "Inter.",
        "details": "4 x 8-10 · 90s rest",
        "badgeText": "Chest",
        "color": "#4AB8F8",
    },
    {
        "slug": "incline-bench-press",
        "title": "Incline Barbell Bench Press",
        "muscleGroup": "Chest",
        "equipment": "barbell",
        "difficulty": "Inter.",
        "details": "3 x 10-12 · 90s rest",
        "badgeText": "Chest",
        "color": "#4AB8F8",
    },
    {
        "slug": "incline-dumbbell-bench-press",
        "title": "Incline Dumbbell Bench Press",
        "muscleGroup": "Chest",
        "equipment": "dumbbell",
        "difficulty": "Inter.",
        "details": "3 x 10-12 · 90s rest",
        "badgeText": "Chest",
        "color": "#4AB8F8",
    },
    {
        "slug": "dips",
        "title": "Dips",
        "muscleGroup": "Chest",
        "equipment": "bodyweight",
        "difficulty": "Inter.",
        "details": "3 x 10-12 · 60s rest",
        "badgeText": "Chest",
        "color": "#4AB8F8",
    },
    {
        "slug": "diamond-push-ups",
        "title": "Diamond Push-Up",
        "muscleGroup": "Chest",
        "equipment": "bodyweight",
        "difficulty": "Inter.",
        "details": "3 x 10-12 · 60s rest",
        "badgeText": "Chest",
        "color": "#4AB8F8",
    },
    {
        "slug": "close-grip-bench-press",
        "title": "Close-Grip Bench Press",
        "muscleGroup": "Chest",
        "equipment": "barbell",
        "difficulty": "Inter.",
        "details": "3 x 10-12 · 90s rest",
        "badgeText": "Chest",
        "color": "#4AB8F8",
    },
    # --- Back ---
    {
        "slug": "pull-up",
        "title": "Pull-Up",
        "muscleGroup": "Back",
        "equipment": "bodyweight",
        "difficulty": "Inter.",
        "details": "3 x 8-10 · 90s rest",
        "badgeText": "Back",
        "color": "#A855F7",
    },
    {
        "slug": "barbell-row",
        "title": "Barbell Row",
        "muscleGroup": "Back",
        "equipment": "barbell",
        "difficulty": "Inter.",
        "details": "4 x 8-10 · 90s rest",
        "badgeText": "Back",
        "color": "#A855F7",
    },
    {
        "slug": "deadlift",
        "title": "Deadlift",
        "muscleGroup": "Back",
        "equipment": "barbell",
        "difficulty": "Advanced",
        "details": "4 x 5 · 120s rest",
        "badgeText": "Back",
        "color": "#A855F7",
    },
    {
        "slug": "romanian-deadlift",
        "title": "Romanian Deadlift",
        "muscleGroup": "Back",
        "equipment": "barbell",
        "difficulty": "Inter.",
        "details": "3 x 10-12 · 90s rest",
        "badgeText": "Back",
        "color": "#A855F7",
    },
    {
        "slug": "bent-over-db-row",
        "title": "Bent-Over Dumbbell Row",
        "muscleGroup": "Back",
        "equipment": "dumbbell",
        "difficulty": "Beginner",
        "details": "3 x 12/side · 60s rest",
        "badgeText": "Back",
        "color": "#A855F7",
    },
    {
        "slug": "seated-cable-row",
        "title": "Seated Cable Row",
        "muscleGroup": "Back",
        "equipment": "cable",
        "difficulty": "Beginner",
        "details": "3 x 12 · 60s rest",
        "badgeText": "Back",
        "color": "#A855F7",
    },
    {
        "slug": "inverted-row",
        "title": "Inverted Row",
        "muscleGroup": "Back",
        "equipment": "bodyweight",
        "difficulty": "Beginner",
        "details": "3 x 10-12 · 60s rest",
        "badgeText": "Back",
        "color": "#A855F7",
    },
    # --- Shoulders ---
    {
        "slug": "dumbbell-shoulder-press",
        "title": "Dumbbell Shoulder Press",
        "muscleGroup": "Shoulders",
        "equipment": "dumbbell",
        "difficulty": "Inter.",
        "details": "4 x 8-10 · 90s rest",
        "badgeText": "Shoulders",
        "color": "#EAB308",
    },
    {
        "slug": "lateral-raise",
        "title": "Lateral Raise",
        "muscleGroup": "Shoulders",
        "equipment": "dumbbell",
        "difficulty": "Beginner",
        "details": "3 x 12-15 · 60s rest",
        "badgeText": "Shoulders",
        "color": "#EAB308",
    },
    {
        "slug": "barbell-front-raise",
        "title": "Barbell Front Raise",
        "muscleGroup": "Shoulders",
        "equipment": "barbell",
        "difficulty": "Beginner",
        "details": "3 x 12 · 60s rest",
        "badgeText": "Shoulders",
        "color": "#EAB308",
    },
    {
        "slug": "pike-push-ups",
        "title": "Pike Push-Up",
        "muscleGroup": "Shoulders",
        "equipment": "bodyweight",
        "difficulty": "Inter.",
        "details": "3 x 8-10 · 60s rest",
        "badgeText": "Shoulders",
        "color": "#EAB308",
    },
    {
        "slug": "upright-row",
        "title": "Upright Row",
        "muscleGroup": "Shoulders",
        "equipment": "barbell",
        "difficulty": "Inter.",
        "details": "3 x 10-12 · 60s rest",
        "badgeText": "Shoulders",
        "color": "#EAB308",
    },
    # --- Legs ---
    {
        "slug": "bodyweight-squat",
        "title": "Bodyweight Squat",
        "muscleGroup": "Legs",
        "equipment": "bodyweight",
        "difficulty": "Beginner",
        "details": "4 x 15 · 60s rest",
        "badgeText": "Legs",
        "color": "#22C55E",
    },
    {
        "slug": "squat",
        "title": "Barbell Squat",
        "muscleGroup": "Legs",
        "equipment": "barbell",
        "difficulty": "Inter.",
        "details": "4 x 8-10 · 90s rest",
        "badgeText": "Legs",
        "color": "#22C55E",
    },
    {
        "slug": "lunge",
        "title": "Lunge",
        "muscleGroup": "Legs",
        "equipment": "bodyweight",
        "difficulty": "Beginner",
        "details": "3 x 12/leg · 60s rest",
        "badgeText": "Legs",
        "color": "#22C55E",
    },
    {
        "slug": "barbell-lunge",
        "title": "Barbell Lunge",
        "muscleGroup": "Legs",
        "equipment": "barbell",
        "difficulty": "Inter.",
        "details": "3 x 10/leg · 90s rest",
        "badgeText": "Legs",
        "color": "#22C55E",
    },
    {
        "slug": "bulgarian-split-squat",
        "title": "Bulgarian Split Squat",
        "muscleGroup": "Legs",
        "equipment": "dumbbell",
        "difficulty": "Inter.",
        "details": "3 x 10/leg · 90s rest",
        "badgeText": "Legs",
        "color": "#22C55E",
    },
    {
        "slug": "goblet-squat",
        "title": "Goblet Squat",
        "muscleGroup": "Legs",
        "equipment": "dumbbell",
        "difficulty": "Beginner",
        "details": "3 x 12 · 60s rest",
        "badgeText": "Legs",
        "color": "#22C55E",
    },
    {
        "slug": "jump-squat",
        "title": "Jump Squat",
        "muscleGroup": "Legs",
        "equipment": "bodyweight",
        "difficulty": "Inter.",
        "details": "3 x 12 · 60s rest",
        "badgeText": "Legs",
        "color": "#22C55E",
    },
    {
        "slug": "leg-curl",
        "title": "Leg Curl",
        "muscleGroup": "Legs",
        "equipment": "machine",
        "difficulty": "Beginner",
        "details": "3 x 12-15 · 60s rest",
        "badgeText": "Legs",
        "color": "#22C55E",
    },
    {
        "slug": "standing-calf-raise",
        "title": "Standing Calf Raise",
        "muscleGroup": "Legs",
        "equipment": "bodyweight",
        "difficulty": "Beginner",
        "details": "4 x 15-20 · 45s rest",
        "badgeText": "Calves",
        "color": "#10B981",
    },
    {
        "slug": "barbell-calf-raise",
        "title": "Barbell Calf Raise",
        "muscleGroup": "Legs",
        "equipment": "barbell",
        "difficulty": "Beginner",
        "details": "4 x 15 · 60s rest",
        "badgeText": "Calves",
        "color": "#10B981",
    },
    # --- Arms ---
    {
        "slug": "bicep-curl",
        "title": "Bicep Curl",
        "muscleGroup": "Arms",
        "equipment": "dumbbell",
        "difficulty": "Beginner",
        "details": "3 x 12-15 · 60s rest",
        "badgeText": "Arms",
        "color": "#EC4899",
    },
    {
        "slug": "hammer-curl",
        "title": "Hammer Curl",
        "muscleGroup": "Arms",
        "equipment": "dumbbell",
        "difficulty": "Beginner",
        "details": "3 x 12 · 60s rest",
        "badgeText": "Arms",
        "color": "#EC4899",
    },
    {
        "slug": "barbell-curl",
        "title": "Barbell Curl",
        "muscleGroup": "Arms",
        "equipment": "barbell",
        "difficulty": "Beginner",
        "details": "3 x 10-12 · 60s rest",
        "badgeText": "Arms",
        "color": "#EC4899",
    },
    {
        "slug": "preacher-curl",
        "title": "Preacher Curl",
        "muscleGroup": "Arms",
        "equipment": "barbell",
        "difficulty": "Inter.",
        "details": "3 x 10-12 · 60s rest",
        "badgeText": "Arms",
        "color": "#EC4899",
    },
    {
        "slug": "bench-dips",
        "title": "Bench Dips",
        "muscleGroup": "Arms",
        "equipment": "bodyweight",
        "difficulty": "Beginner",
        "details": "3 x 12-15 · 60s rest",
        "badgeText": "Arms",
        "color": "#EC4899",
    },
    {
        "slug": "close-grip-push-ups",
        "title": "Close-Grip Push-Up",
        "muscleGroup": "Arms",
        "equipment": "bodyweight",
        "difficulty": "Inter.",
        "details": "3 x 10-12 · 60s rest",
        "badgeText": "Arms",
        "color": "#EC4899",
    },
    # --- Core ---
    {
        "slug": "plank",
        "title": "Plank",
        "muscleGroup": "Core",
        "equipment": "bodyweight",
        "difficulty": "Beginner",
        "details": "3 x 45-60s · 60s rest",
        "badgeText": "Core",
        "color": "#F97316",
    },
    {
        "slug": "side-plank",
        "title": "Side Plank",
        "muscleGroup": "Core",
        "equipment": "bodyweight",
        "difficulty": "Beginner",
        "details": "3 x 30s/side · 45s rest",
        "badgeText": "Core",
        "color": "#F97316",
    },
    {
        "slug": "hanging-leg-raise",
        "title": "Hanging Leg Raise",
        "muscleGroup": "Core",
        "equipment": "bodyweight",
        "difficulty": "Advanced",
        "details": "3 x 10-12 · 60s rest",
        "badgeText": "Core",
        "color": "#F97316",
    },
    {
        "slug": "hanging-knee-raise",
        "title": "Hanging Knee Raise",
        "muscleGroup": "Core",
        "equipment": "bodyweight",
        "difficulty": "Inter.",
        "details": "3 x 12-15 · 60s rest",
        "badgeText": "Core",
        "color": "#F97316",
    },
    {
        "slug": "kettlebell-russian-twist",
        "title": "Russian Twist",
        "muscleGroup": "Core",
        "equipment": "kettlebell",
        "difficulty": "Inter.",
        "details": "3 x 20 · 45s rest",
        "badgeText": "Core",
        "color": "#F97316",
    },
    # --- Full Body & Cardio ---
    {
        "slug": "burpees",
        "title": "Burpees",
        "muscleGroup": "Full Body",
        "equipment": "bodyweight",
        "difficulty": "Inter.",
        "details": "4 x 8-10 · 90s rest",
        "badgeText": "Full Body",
        "color": "#14B8A6",
    },
    {
        "slug": "mountain-climbers",
        "title": "Mountain Climbers",
        "muscleGroup": "Full Body",
        "equipment": "bodyweight",
        "difficulty": "Beginner",
        "details": "3 x 30s · 45s rest",
        "badgeText": "Full Body",
        "color": "#14B8A6",
    },
    {
        "slug": "high-knees",
        "title": "High Knees",
        "muscleGroup": "Full Body",
        "equipment": "bodyweight",
        "difficulty": "Beginner",
        "details": "3 x 40s · 45s rest",
        "badgeText": "Full Body",
        "color": "#14B8A6",
    },
    {
        "slug": "bear-plank-hold",
        "title": "Bear Plank Hold",
        "muscleGroup": "Full Body",
        "equipment": "bodyweight",
        "difficulty": "Inter.",
        "details": "3 x 45s · 60s rest",
        "badgeText": "Full Body",
        "color": "#14B8A6",
    },
]


COMMON_SLUG_ALIASES: dict[str, str] = {
    "dumbbell-bench-press": "db-bench-press",
    "dumbbell-press": "db-bench-press",
    "dumbbell-chest-press": "db-bench-press",
    "incline-dumbbell-press": "incline-dumbbell-bench-press",
    "barbell-bench-press": "bench-press",
    "bw-squats": "bodyweight-squat",
    "squats": "bodyweight-squat",
    "barbell-squats": "squat",
    "barbell-squat": "squat",
    "push-ups": "push-up",
    "pushups": "push-up",
    "pull-ups": "pull-up",
    "pullups": "pull-up",
    "bicep-curls": "bicep-curl",
    "biceps-curls": "bicep-curl",
    "plank-hold": "plank",
    "plank-tartas": "plank",
}


def get_catalog_prompt_summary() -> str:
    # Katalógus formázása az AI prompt számára
    by_category: dict[str, list[str]] = {}
    for ex in LIBRARY_EXERCISES:
        group = ex["muscleGroup"]
        eq = ex.get("equipment", "bodyweight")
        by_category.setdefault(group, []).append(
            f"{ex['title']} (slug: \"{ex['slug']}\", equipment: {eq})"
        )

    lines = []
    for group, exercises in by_category.items():
        lines.append(f"- {group}: " + "; ".join(exercises))

    return "\n".join(lines)


def resolve_and_enrich_exercise(
    db: Session,
    media: MediaUrls,
    raw_ex: dict[str, Any],
    fallback_index: int = 1,
    strict: bool = False,
) -> dict[str, Any]:
    # Validálja és kiegészíti az AI által javasolt gyakorlatot a katalógus alapján
    raw_slug = str(raw_ex.get("slug") or "").strip().lower()
    raw_title = str(raw_ex.get("title") or "").strip()

    # Normalize via aliases
    raw_slug = COMMON_SLUG_ALIASES.get(raw_slug, raw_slug)

    exercise: Exercise | None = None

    # 1. Direct slug match in DB
    if raw_slug:
        stmt = (
            select(Exercise)
            .where(Exercise.slug == raw_slug)
            .options(selectinload(Exercise.translations), selectinload(Exercise.images))
        )
        try:
            exercise = db.scalar(stmt)
        except Exception:
            exercise = None

    # 2. Try slugifying raw_title if no match yet
    if exercise is None and raw_title:
        title_slug = raw_title.lower().replace(" ", "-").replace("'", "")
        title_slug = COMMON_SLUG_ALIASES.get(title_slug, title_slug)

        stmt = (
            select(Exercise)
            .where(Exercise.slug == title_slug)
            .options(selectinload(Exercise.translations), selectinload(Exercise.images))
        )
        try:
            exercise = db.scalar(stmt)
        except Exception:
            exercise = None

    # 3. Match against English translation name
    if exercise is None and raw_title:
        clean_name = raw_title.rstrip("s") if len(raw_title) > 4 else raw_title
        stmt = (
            select(Exercise)
            .join(ExerciseTranslation)
            .where(
                ExerciseTranslation.lang == "en",
                or_(
                    func.lower(ExerciseTranslation.name) == raw_title.lower(),
                    ExerciseTranslation.name.ilike(f"%{clean_name}%"),
                ),
            )
            .options(selectinload(Exercise.translations), selectinload(Exercise.images))
            .limit(1)
        )
        try:
            exercise = db.scalar(stmt)
        except Exception:
            exercise = None

    # 4. In-memory verified catalog fallback (for test envs or before RepDB seeding)
    library_map = {ex["slug"]: ex for ex in LIBRARY_EXERCISES}
    matched_lib = None
    target_slug_for_lib = raw_slug or (raw_title.lower().replace(" ", "-").replace("'", "") if raw_title else "")
    target_slug_for_lib = COMMON_SLUG_ALIASES.get(target_slug_for_lib, target_slug_for_lib)
    if exercise is None and target_slug_for_lib:
        matched_lib = library_map.get(target_slug_for_lib)
        if matched_lib is None:
            # Check by title in library
            for lib_ex in LIBRARY_EXERCISES:
                if lib_ex["title"].lower() == raw_title.lower():
                    matched_lib = lib_ex
                    break

    # 5. Handle strict non-existent check
    if exercise is None and matched_lib is None:
        if strict:
            identifier = raw_slug or raw_title or "unknown"
            raise ExerciseNotFoundError(identifier)

        # Non-strict fallback canonical exercise by muscle group/badge
        badge = str(raw_ex.get("badgeText") or "").lower()
        fallback_slug = "push-up"
        if "leg" in badge or "quad" in badge or "calf" in badge:
            fallback_slug = "bodyweight-squat"
        elif "back" in badge:
            fallback_slug = "pull-up"
        elif "shoulder" in badge:
            fallback_slug = "dumbbell-shoulder-press"
        elif "arm" in badge or "bicep" in badge or "tricep" in badge:
            fallback_slug = "bicep-curl"
        elif "core" in badge or "ab" in badge:
            fallback_slug = "plank"
        elif "cardio" in badge or "full" in badge:
            fallback_slug = "burpees"

        try:
            stmt = (
                select(Exercise)
                .where(Exercise.slug == fallback_slug)
                .options(selectinload(Exercise.translations), selectinload(Exercise.images))
            )
            exercise = db.scalar(stmt)
        except Exception:
            exercise = None

        if exercise is None and fallback_slug in library_map:
            matched_lib = library_map[fallback_slug]

    # Resolve canonical attributes
    if exercise is not None:
        canonical_slug = exercise.slug
        en_trans = exercise.translations.get("en") if exercise.translations else None
        canonical_title = (
            en_trans.name
            if en_trans
            else (next(iter(exercise.translations.values())).name if exercise.translations else raw_title or "Exercise")
        )
        bp_val = (
            exercise.body_part.value
            if hasattr(exercise.body_part, "value")
            else str(exercise.body_part)
        )
        badgeText = raw_ex.get("badgeText") or BODY_PART_BADGE_MAP.get(bp_val, bp_val.replace("_", " ").title())
        color = raw_ex.get("color") or BODY_PART_COLOR_MAP.get(bp_val, "#4AB8F8")
        met = float(exercise.met) if exercise.met else 4.5
        start_img_url = None
        peak_img_url = None
        if exercise.images:
            by_kind = {
                (img.kind.value if hasattr(img.kind, "value") else str(img.kind)): img.path
                for img in exercise.images
            }
            start_path = by_kind.get("start") or by_kind.get("main")
            peak_path = by_kind.get("peak") or by_kind.get("main") or start_path
            start_img_url = media.url(start_path) if start_path else None
            peak_img_url = media.url(peak_path) if peak_path else None
    elif matched_lib is not None:
        canonical_slug = matched_lib["slug"]
        canonical_title = matched_lib["title"]
        badgeText = raw_ex.get("badgeText") or matched_lib["badgeText"]
        color = raw_ex.get("color") or matched_lib["color"]
        met = 5.0
        start_img_url = None
        peak_img_url = None
    else:
        canonical_slug = raw_slug or "push-up"
        canonical_title = raw_title or "Push-Up"
        badgeText = raw_ex.get("badgeText") or "Chest"
        color = raw_ex.get("color") or "#4AB8F8"
        met = 4.5
        start_img_url = None
        peak_img_url = None

    return {
        "id": str(raw_ex.get("id") or f"ex_{canonical_slug}_{fallback_index}"),
        "number": str(raw_ex.get("number") or f"{fallback_index:02d}"),
        "slug": canonical_slug,
        "title": canonical_title,
        "details": str(raw_ex.get("details") or (matched_lib["details"] if matched_lib else "3 x 12 · 60s rest")),
        "badgeText": badgeText,
        "color": color,
        "met": met,
        "startImageUrl": start_img_url,
        "peakImageUrl": peak_img_url,
    }
