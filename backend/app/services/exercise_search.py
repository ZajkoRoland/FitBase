# Gyakorlatok szűrése, keresése és formázása az API végpontok számára

from dataclasses import dataclass

from sqlalchemy import and_, case, func, or_, select
from sqlalchemy.orm import Session, aliased, joinedload, selectinload

from app.models_catalog import (
    BodyPart,
    Category,
    Difficulty,
    Equipment,
    Exercise,
    ExerciseGoal,
    ExerciseMuscle,
    ExerciseTranslation,
    Goal,
    ImageKind,
    Mechanic,
    Muscle,
    MuscleRole,
)
from app.schemas import (
    EquipmentOut,
    ExerciseDetail,
    ExerciseFilterOptions,
    ExerciseSummary,
    MuscleOut,
)
from app.services.media import MediaUrls

FALLBACK_LANG = "en"
NO_EQUIPMENT = "none"  # eszköz nélküli, saját testsúlyos gyakorlatok azonosítója


@dataclass(frozen=True)
class ExerciseFilters:
    # Opcionális szűrőmezők a gyakorlatok kereséséhez

    query: str | None = None
    body_part: BodyPart | None = None
    body_parts: tuple[BodyPart, ...] = ()
    difficulty: Difficulty | None = None
    difficulties: tuple[Difficulty, ...] = ()
    category: Category | None = None
    equipment: str | None = None  # eszköz slug vagy NO_EQUIPMENT
    equipment_slugs: tuple[str, ...] = ()
    muscle: str | None = None  # elsődleges izomcsoport slug
    goal: Goal | None = None
    lang: str = FALLBACK_LANG


def _escape_like(text: str) -> str:
    # Keresési kulcsszavak tisztítása (LIKE helyettesítők kizárása)
    return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


class ExerciseSearch:
    ICONIC_SLUGS: tuple[str, ...] = (
        "bench-press",
        "squat",
        "deadlift",
        "pull-up",
        "push-up",
        "dumbbell-shoulder-press",
        "barbell-row",
        "dips",
        "bicep-curl",
        "lat-pulldown",
        "leg-press",
        "plank",
        "incline-bench-press",
        "romanian-deadlift",
        "bulgarian-split-squat",
        "tricep-pushdown",
        "lateral-raise",
        "leg-curl",
        "leg-extension",
        "seated-barbell-overhead-press",
    )

    def __init__(self, db: Session) -> None:
        self.db = db

    def search(self, filters: ExerciseFilters, limit: int, offset: int) -> tuple[list[Exercise], int]:
        conditions = self._conditions(filters)
        english = aliased(ExerciseTranslation)
        english_name = and_(english.exercise_id == Exercise.id, english.lang == FALLBACK_LANG)

        total = self.db.scalar(select(func.count(Exercise.id)).where(*conditions)) or 0

        stmt = (
            select(Exercise)
            .outerjoin(english, english_name)
            .where(*conditions)
            .options(*self._list_loading())
            .order_by(*self._order_clauses(english.name))
            .limit(limit)
            .offset(offset)
        )
        return list(self.db.scalars(stmt)), total

    def get_by_slug(self, slug: str) -> Exercise | None:
        stmt = (
            select(Exercise)
            .where(Exercise.slug == slug)
            .options(*self._list_loading(), selectinload(Exercise.goals), selectinload(Exercise.tags))
        )
        return self.db.scalar(stmt)

    def filter_options(self) -> tuple[list[Equipment], list[Muscle]]:
        used_equipment = select(Exercise.equipment_id).where(Exercise.equipment_id.is_not(None))
        equipment = self.db.scalars(
            select(Equipment).where(Equipment.id.in_(used_equipment)).order_by(Equipment.name)
        )
        muscles = self.db.scalars(select(Muscle).order_by(Muscle.name))
        return list(equipment), list(muscles)

    # ---------- internals -------

    @classmethod
    def _order_clauses(cls, english_name_col):
        # Relevancia szerinti rangsorolás a keresési találatokhoz
        tier_case = case(
            (Exercise.slug.in_(cls.ICONIC_SLUGS), 0),
            (and_(Exercise.category == Category.STRENGTH, Exercise.mechanic == Mechanic.COMPOUND), 1),
            (and_(Exercise.category == Category.STRENGTH, Exercise.mechanic == Mechanic.ISOLATION), 2),
            (Exercise.category.in_([Category.OLYMPIC, Category.PLYOMETRICS]), 3),
            (Exercise.category == Category.CARDIO, 4),
            (Exercise.category == Category.STRETCHING, 5),
            else_=6,
        )
        iconic_order = case(
            *[(Exercise.slug == slug, idx) for idx, slug in enumerate(cls.ICONIC_SLUGS)],
            else_=99,
        )
        return (
            tier_case,
            iconic_order,
            func.lower(english_name_col),
            Exercise.id,
        )

    @staticmethod
    def _list_loading():
        return (
            selectinload(Exercise.translations),
            selectinload(Exercise.images),
            selectinload(Exercise.muscle_links).joinedload(ExerciseMuscle.muscle),
            joinedload(Exercise.equipment),
        )

    @staticmethod
    def _conditions(f: ExerciseFilters) -> list:
        conditions = []

        if f.query and f.query.strip():
            pattern = f"%{_escape_like(f.query.strip())}%"
            conditions.append(
                Exercise.translations.any(
                    and_(
                        ExerciseTranslation.lang.in_({f.lang, FALLBACK_LANG}),
                        ExerciseTranslation.name.ilike(pattern, escape="\\"),
                    )
                )
            )
        # Testrészek szűrése (egyedi és többszörös kijelölés támogatása)
        b_parts = set()
        if f.body_part:
            b_parts.add(f.body_part)
        if f.body_parts:
            b_parts.update(f.body_parts)
        if len(b_parts) == 1:
            conditions.append(Exercise.body_part == next(iter(b_parts)))
        elif len(b_parts) > 1:
            conditions.append(Exercise.body_part.in_(b_parts))

        # Nehézségi szintek szűrése (egyedi és többszörös kijelölés támogatása)
        diffs = set()
        if f.difficulty:
            diffs.add(f.difficulty)
        if f.difficulties:
            diffs.update(f.difficulties)
        if len(diffs) == 1:
            conditions.append(Exercise.difficulty == next(iter(diffs)))
        elif len(diffs) > 1:
            conditions.append(Exercise.difficulty.in_(diffs))

        if f.category:
            conditions.append(Exercise.category == f.category)

        # Eszközök szűrése (egyedi és többszörös kijelölés támogatása)
        eq_slugs = set()
        if f.equipment:
            eq_slugs.add(f.equipment)
        if f.equipment_slugs:
            eq_slugs.update(f.equipment_slugs)

        if eq_slugs:
            has_none = NO_EQUIPMENT in eq_slugs
            named_slugs = [s for s in eq_slugs if s != NO_EQUIPMENT]
            if has_none and named_slugs:
                conditions.append(
                    or_(
                        Exercise.equipment_id.is_(None),
                        Exercise.equipment.has(Equipment.slug.in_(named_slugs)),
                    )
                )
            elif has_none:
                conditions.append(Exercise.equipment_id.is_(None))
            elif named_slugs:
                if len(named_slugs) == 1:
                    conditions.append(Exercise.equipment.has(Equipment.slug == named_slugs[0]))
                else:
                    conditions.append(Exercise.equipment.has(Equipment.slug.in_(named_slugs)))
        if f.muscle:
            conditions.append(
                Exercise.muscle_links.any(
                    and_(
                        ExerciseMuscle.role == MuscleRole.PRIMARY,
                        ExerciseMuscle.muscle.has(Muscle.slug == f.muscle),
                    )
                )
            )
        if f.goal:
            conditions.append(Exercise.goals.any(ExerciseGoal.goal == f.goal))

        return conditions


class ExercisePresenter:
    # Eredmények formázása a kért nyelven

    def __init__(self, media: MediaUrls, lang: str = FALLBACK_LANG) -> None:
        self.media = media
        self.lang = lang

    def summary(self, exercise: Exercise) -> ExerciseSummary:
        _, translation = self._translation(exercise)
        return ExerciseSummary(
            slug=exercise.slug,
            name=translation.name,
            category=exercise.category,
            difficulty=exercise.difficulty,
            body_part=exercise.body_part,
            equipment=self._equipment(exercise),
            met=float(exercise.met),
            primary_muscles=self._muscles(exercise, MuscleRole.PRIMARY),
            image_url=self.media.url(self._thumbnail(exercise)),
        )

    def detail(self, exercise: Exercise) -> ExerciseDetail:
        lang, translation = self._translation(exercise)
        return ExerciseDetail(
            **self.summary(exercise).model_dump(),
            language=lang,
            description=translation.description,
            instructions=list(translation.instructions),
            tips=list(translation.tips),
            secondary_muscles=self._muscles(exercise, MuscleRole.SECONDARY),
            images={image.kind: self.media.url(image.path) for image in exercise.images},
            goals=sorted(g.goal for g in exercise.goals),
            tags=sorted(t.slug for t in exercise.tags),
            is_unilateral=exercise.is_unilateral,
            is_bodyweight=exercise.is_bodyweight,
            variation_group=exercise.variation_group,
        )

    def filter_options(
        self, equipment: list[Equipment], muscles: list[Muscle]
    ) -> ExerciseFilterOptions:
        return ExerciseFilterOptions(
            body_parts=list(BodyPart),
            difficulties=list(Difficulty),
            categories=list(Category),
            equipment=[self._equipment_out(e) for e in equipment],
            muscles=[self._muscle_out(m) for m in muscles],
        )

    # --------- Belső segédmetódusok ----------

    def _translation(self, exercise: Exercise) -> tuple[str, ExerciseTranslation]:
        for lang in (self.lang, FALLBACK_LANG):
            if lang in exercise.translations:
                return lang, exercise.translations[lang]
        lang, translation = next(iter(exercise.translations.items()))  # ha hiányzik a kért nyelv, az első elérhető fordítást adjuk vissza
        return lang, translation

    def _equipment(self, exercise: Exercise) -> EquipmentOut | None:
        return self._equipment_out(exercise.equipment) if exercise.equipment else None

    def _equipment_out(self, equipment: Equipment) -> EquipmentOut:
        return EquipmentOut(
            slug=equipment.slug,
            name=equipment.name,
            image_url=self.media.url(equipment.image_path),
        )

    def _muscle_out(self, muscle: Muscle) -> MuscleOut:
        return MuscleOut(
            slug=muscle.slug, name=muscle.name, image_url=self.media.url(muscle.image_path)
        )

    def _muscles(self, exercise: Exercise, role: MuscleRole) -> list[MuscleOut]:
        muscles = [link.muscle for link in exercise.muscle_links if link.role == role]
        return [self._muscle_out(m) for m in sorted(muscles, key=lambda m: m.name)]

    @staticmethod
    def _thumbnail(exercise: Exercise) -> str | None:
        by_kind = {image.kind: image.path for image in exercise.images}
        for kind in (ImageKind.MAIN, ImageKind.START, ImageKind.PEAK):
            if kind in by_kind:
                return by_kind[kind]
        return None
