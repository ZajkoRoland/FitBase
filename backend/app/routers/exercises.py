from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query, Request, status

from app.deps import CurrentUser, DbSession
from app.errors import AppError
from app.models_catalog import BodyPart, Category, Difficulty, Goal
from app.schemas import ExerciseDetail, ExerciseFilterOptions, ExercisePage
from app.services.exercise_search import ExerciseFilters, ExercisePresenter, ExerciseSearch
from app.services.media import MediaUrls

router = APIRouter(prefix="/exercises", tags=["exercises"])

Lang = Literal["en", "de", "es"]


def get_search(db: DbSession) -> ExerciseSearch:
    return ExerciseSearch(db)


def get_media_urls(request: Request) -> MediaUrls:
    return MediaUrls.from_request(request)


Search = Annotated[ExerciseSearch, Depends(get_search)]
Media = Annotated[MediaUrls, Depends(get_media_urls)]


def _parse_multi(val: list[str] | str | None) -> list[str]:
    if not val:
        return []
    items: list[str] = []
    raw = val if isinstance(val, list) else [val]
    for part in raw:
        for piece in part.split(","):
            cleaned = piece.strip()
            if cleaned:
                items.append(cleaned)
    return items


@router.get("", response_model=ExercisePage)
def list_exercises(
    _: CurrentUser,
    search: Search,
    media: Media,
    q: Annotated[str | None, Query(max_length=60, description="Name search")] = None,
    body_part: Annotated[list[str] | None, Query(description="Body part slug(s) or comma-separated list")] = None,
    difficulty: Annotated[list[str] | None, Query(description="Difficulty(ies) or comma-separated list")] = None,
    category: Category | None = None,
    equipment: Annotated[list[str] | None, Query(description="Equipment slug(s) or comma-separated list, or 'none'")] = None,
    muscle: Annotated[str | None, Query(max_length=40, description="Primary muscle slug")] = None,
    goal: Goal | None = None,
    lang: Lang = "en",
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> ExercisePage:
    parsed_body_parts: list[BodyPart] = []
    for bp in _parse_multi(body_part):
        try:
            parsed_body_parts.append(BodyPart(bp))
        except ValueError:
            raise AppError(status.HTTP_422_UNPROCESSABLE_CONTENT, "validation_failed", f"Invalid body part: {bp}")

    parsed_difficulties: list[Difficulty] = []
    for d in _parse_multi(difficulty):
        try:
            parsed_difficulties.append(Difficulty(d))
        except ValueError:
            raise AppError(status.HTTP_422_UNPROCESSABLE_CONTENT, "validation_failed", f"Invalid difficulty: {d}")

    equipment_slugs = tuple(_parse_multi(equipment))

    filters = ExerciseFilters(
        query=q,
        body_parts=tuple(parsed_body_parts),
        difficulties=tuple(parsed_difficulties),
        category=category,
        equipment_slugs=equipment_slugs,
        muscle=muscle,
        goal=goal,
        lang=lang,
    )
    rows, total = search.search(filters, limit, offset)
    presenter = ExercisePresenter(media, lang)
    return ExercisePage(
        items=[presenter.summary(row) for row in rows], total=total, limit=limit, offset=offset
    )


# Declared before "/{slug}" so that "filters" is not taken for an exercise slug.
@router.get("/filters", response_model=ExerciseFilterOptions)
def get_filter_options(_: CurrentUser, search: Search, media: Media) -> ExerciseFilterOptions:
    equipment, muscles = search.filter_options()
    return ExercisePresenter(media).filter_options(equipment, muscles)


@router.get("/{slug}", response_model=ExerciseDetail)
def get_exercise(
    slug: str, _: CurrentUser, search: Search, media: Media, lang: Lang = "en"
) -> ExerciseDetail:
    exercise = search.get_by_slug(slug)
    if exercise is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "exercise_not_found", "This exercise does not exist.")
    return ExercisePresenter(media, lang).detail(exercise)
