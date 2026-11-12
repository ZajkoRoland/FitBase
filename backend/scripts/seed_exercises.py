"""Betölti a RepDB gyakorlatkészletet az adatbázis katalógus tábláiba.

    cd backend
    python -m scripts.seed_exercises
    python -m scripts.seed_exercises --lang en,de,es

Biztonságosan többször is futtatható: az azonosító (slug) alapján szinkronizál, nem duplikál.
Gyakorlatok forrása: RepDB (repdb.co) - lásd Gyakorlatok/LICENSE-DATA.md.
"""

import argparse
import json
import logging
from decimal import Decimal
from pathlib import Path
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload
from app.config import BACKEND_DIR
from app.db import SessionLocal
from app.models_catalog import (
    BodyPart,
    Category,
    Difficulty,
    Equipment,
    Exercise,
    ExerciseGoal,
    ExerciseImage,
    ExerciseMuscle,
    ExerciseTranslation,
    ForceType,
    Goal,
    ImageKind,
    Mechanic,
    Muscle,
    MuscleRole,
    Tag,
)

log = logging.getLogger("seed_exercises")

DEFAULT_DATASET_DIR = BACKEND_DIR.parent / "Gyakorlatok"

# Egyedi név változások, ha a címkezdő nagybetűsítés nem megfelelő
NAME_OVERRIDES = {"ez_bar": "EZ Bar"}


def humanize(slug: str) -> str:
    return NAME_OVERRIDES.get(slug) or slug.replace("_", " ").title()


class CatalogueSeeder:
    """Beolvassa az exercises.json fájlt és egyetlen adatbázis-tranzakcióban szinkronizálja."""

    def __init__(self, session: Session, dataset_dir: Path, languages: tuple[str, ...]) -> None:
        self.session = session
        self.dataset_dir = dataset_dir
        self.languages = languages
        self.muscles: dict[str, Muscle] = {}
        self.equipment: dict[str, Equipment] = {}
        self.tags: dict[str, Tag] = {}

    # ---------- publikus ----------

    def run(self) -> None:
        records = self._read_records()
        self._load_lookups()
        self._sync_lookups(records)

        existing = self._load_existing_exercises()
        for raw in records:
            exercise = existing.get(raw["id"]) or self._new_exercise(raw["id"])
            self._apply_scalars(exercise, raw)
            self._sync_translations(exercise, raw)
            self._sync_muscles(exercise, raw)
            self._sync_images(exercise, raw)
            self._sync_goals(exercise, raw)
            exercise.tags = [self.tags[slug] for slug in raw.get("tags", [])]

        self.session.commit()
        log.info("committed %d exercises", len(records))

    def summary(self) -> dict[str, int]:
        count = lambda model: self.session.scalar(select(func.count()).select_from(model))  # noqa: E731
        return {
            "exercises": count(Exercise),
            "translations": count(ExerciseTranslation),
            "muscles": count(Muscle),
            "equipment": count(Equipment),
            "tags": count(Tag),
            "muscle links": count(ExerciseMuscle),
            "images": count(ExerciseImage),
            "goals": count(ExerciseGoal),
        }

    # ---------- reading ----------

    def _read_records(self) -> list[dict]:
        path = self.dataset_dir / "exercises.json"
        with path.open(encoding="utf-8") as fh:
            document = json.load(fh)
        records = document["exercises"]
        if document.get("count") != len(records):
            raise ValueError(f"dataset says {document.get('count')} exercises but holds {len(records)}")
        return records

    # ---------- Törzsadattáblák ----------

    def _load_lookups(self) -> None:
        self.muscles = {m.slug: m for m in self.session.scalars(select(Muscle))}
        self.equipment = {e.slug: e for e in self.session.scalars(select(Equipment))}
        self.tags = {t.slug: t for t in self.session.scalars(select(Tag))}

    def _sync_lookups(self, records: list[dict]) -> None:
        muscle_slugs = {s for r in records for s in r.get("primary_muscles", []) + r.get("secondary_muscles", [])}
        equipment_slugs = {r["equipment"] for r in records if r.get("equipment")}
        tag_slugs = {s for r in records for s in r.get("tags", [])}

        for slug in sorted(muscle_slugs):
            muscle = self.muscles.get(slug) or self.muscles.setdefault(slug, self._add(Muscle(slug=slug, name="")))
            muscle.name = humanize(slug)
            muscle.image_path = self._image_if_exists("muscles", slug)

        for slug in sorted(equipment_slugs):
            item = self.equipment.get(slug) or self.equipment.setdefault(slug, self._add(Equipment(slug=slug, name="")))
            item.name = humanize(slug)
            item.image_path = self._image_if_exists("equipment", slug)

        for slug in sorted(tag_slugs):
            if slug not in self.tags:
                self.tags[slug] = self._add(Tag(slug=slug))

        self.session.flush()  # hozzárendeli az azonosítókat, amelyekre a gyakorlatok hivatkoznak

    def _image_if_exists(self, folder: str, slug: str) -> str | None:
        # A képfájlok kötőjelesek ('gluteus-maximus.webp'), a forrásadatok aláhúzásosak.
        relative = f"images/{folder}/{slug.replace('_', '-')}.webp"
        return relative if (self.dataset_dir / relative).is_file() else None

    def _add(self, row):
        self.session.add(row)
        return row

    # ---------- Gyakorlatok szinkronizálása ----------

    def _load_existing_exercises(self) -> dict[str, Exercise]:
        stmt = select(Exercise).options(
            selectinload(Exercise.translations),
            selectinload(Exercise.muscle_links),
            selectinload(Exercise.images),
            selectinload(Exercise.goals),
            selectinload(Exercise.tags),
        )
        return {e.slug: e for e in self.session.scalars(stmt)}

    def _new_exercise(self, slug: str) -> Exercise:
        exercise = Exercise(slug=slug)
        self.session.add(exercise)
        return exercise

    def _apply_scalars(self, exercise: Exercise, raw: dict) -> None:
        exercise.category = Category(raw["category"])
        exercise.force_type = ForceType(raw["force_type"])
        exercise.mechanic = Mechanic(raw["mechanic"])
        exercise.difficulty = Difficulty(raw["difficulty"])
        exercise.body_part = BodyPart(raw["body_part"])
        exercise.equipment_id = self.equipment[raw["equipment"]].id if raw.get("equipment") else None
        exercise.is_unilateral = bool(raw.get("is_unilateral", False))
        exercise.is_bodyweight = bool(raw.get("is_bodyweight", False))
        exercise.met = Decimal(str(raw["met"]))
        exercise.variation_group = raw.get("variation_group")

    def _sync_translations(self, exercise: Exercise, raw: dict) -> None:
        for lang in self.languages:
            row = exercise.translations.get(lang)
            if row is None:
                row = ExerciseTranslation(lang=lang)
                exercise.translations[lang] = row
            row.name = raw[f"name_{lang}"]
            row.description = raw.get(f"description_{lang}")
            row.instructions = list(raw.get(f"instructions_{lang}", []))
            row.tips = list(raw.get(f"tips_{lang}", []))

    def _sync_muscles(self, exercise: Exercise, raw: dict) -> None:
        wanted: dict[int, MuscleRole] = {}
        for slug in raw.get("secondary_muscles", []):
            wanted[self.muscles[slug].id] = MuscleRole.SECONDARY
        for slug in raw.get("primary_muscles", []):
            wanted[self.muscles[slug].id] = MuscleRole.PRIMARY

        current = {link.muscle_id: link for link in exercise.muscle_links}
        for link in [l for mid, l in current.items() if mid not in wanted]:
            exercise.muscle_links.remove(link)
        for muscle_id, role in wanted.items():
            if muscle_id in current:
                current[muscle_id].role = role
            else:
                exercise.muscle_links.append(ExerciseMuscle(muscle_id=muscle_id, role=role))

    def _sync_images(self, exercise: Exercise, raw: dict) -> None:
        wanted = {ImageKind(kind): path for kind, path in raw["images"]["flat"].items()}
        current = {img.kind: img for img in exercise.images}
        for img in [i for kind, i in current.items() if kind not in wanted]:
            exercise.images.remove(img)
        for kind, path in wanted.items():
            if kind in current:
                current[kind].path = path
            else:
                exercise.images.append(ExerciseImage(kind=kind, path=path))

    def _sync_goals(self, exercise: Exercise, raw: dict) -> None:
        wanted = {Goal(g) for g in raw.get("goals", [])}
        current = {g.goal: g for g in exercise.goals}
        for goal_row in [g for goal, g in current.items() if goal not in wanted]:
            exercise.goals.remove(goal_row)
        for goal in wanted - current.keys():
            exercise.goals.append(ExerciseGoal(goal=goal))


def main() -> None:
    parser = argparse.ArgumentParser(description="Load the RepDB exercise dataset into the database.")
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET_DIR, help="folder holding exercises.json")
    parser.add_argument("--lang", default="en", help="comma separated languages to load (en,de,es)")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(message)s")
    languages = tuple(code.strip() for code in args.lang.split(",") if code.strip())

    with SessionLocal() as session:
        seeder = CatalogueSeeder(session, args.dataset, languages)
        seeder.run()
        for label, total in seeder.summary().items():
            log.info("  %-14s %d", label, total)


if __name__ == "__main__":
    main()
