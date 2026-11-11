import re
from datetime import UTC, datetime

from fastapi import APIRouter, Query, Response, status
from sqlalchemy import delete, func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from app.config import get_settings
from app.deps import CurrentUser, DbSession
from app.errors import AppError
from app.models import (
    PasswordResetCode,
    Profile,
    RefreshToken,
    User,
    UserAchievement,
    UserSettings,
    UserStats,
    WeeklyPlanDay,
    WorkoutSession,
)
from app.schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    GoogleAuthRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserOut,
    UsernameAvailability,
)
from app.security import (
    burn_password_check,
    create_access_token,
    generate_refresh_token,
    generate_reset_code,
    hash_password,
    hash_refresh_token,
    hash_reset_code,
    password_needs_rehash,
    refresh_token_expiry,
    reset_code_expiry,
    verify_password,
)
from app.services.achievement_service import AchievementDomainService
from app.services.email_service import EmailService

router = APIRouter(prefix="/auth", tags=["auth"])

_INVALID_REFRESH = AppError(
    status.HTTP_401_UNAUTHORIZED, "invalid_refresh_token", "Session expired. Please sign in again."
)


def _as_utc(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=UTC)


def _username_taken(db: Session, username: str) -> bool:
    stmt = select(Profile.id).where(func.lower(Profile.username) == username.lower())
    return db.scalar(stmt) is not None


def _issue_tokens(db: Session, user: User) -> TokenResponse:
    access_token, expires_in = create_access_token(user.id)
    refresh_token = generate_refresh_token()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hash_refresh_token(refresh_token),
            expires_at=refresh_token_expiry(),
        )
    )
    db.commit()
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
        user=UserOut.model_validate(user),
    )


@router.get("/username-available", response_model=UsernameAvailability)
def username_available(
    db: DbSession, username: str = Query(min_length=2, max_length=30)
) -> UsernameAvailability:
    return UsernameAvailability(available=not _username_taken(db, username.strip()))


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: DbSession) -> TokenResponse:
    email = body.email.lower()

    if db.scalar(select(User.id).where(func.lower(User.email) == email)) is not None:
        raise AppError(
            status.HTTP_409_CONFLICT, "user_already_exists", "An account with this email already exists."
        )
    if _username_taken(db, body.username):
        raise AppError(status.HTTP_409_CONFLICT, "username_taken", "This username is already taken.")

    user = User(email=email, password_hash=hash_password(body.password))
    db.add(user)
    db.flush()
    db.add(Profile(id=user.id, username=body.username, display_name=body.username))
    db.flush()
    stats = UserStats(user_id=user.id)
    db.add(stats)
    db.add(UserSettings(user_id=user.id))
    try:
        db.flush()
        AchievementDomainService.sync_user_achievements(db, user.id, stats)
    except IntegrityError:
        # Lost a race against a concurrent registration with the same email/username.
        db.rollback()
        raise AppError(
            status.HTTP_409_CONFLICT, "user_already_exists", "This email or username is already taken."
        )
    db.refresh(user)
    return _issue_tokens(db, user)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: DbSession) -> TokenResponse:
    user = db.scalar(select(User).where(func.lower(User.email) == body.email.lower()))

    if user is None:
        burn_password_check(body.password)
        raise AppError(status.HTTP_401_UNAUTHORIZED, "invalid_credentials", "Incorrect email or password.")
    if not verify_password(body.password, user.password_hash):
        raise AppError(status.HTTP_401_UNAUTHORIZED, "invalid_credentials", "Incorrect email or password.")
    if not user.is_active:
        raise AppError(status.HTTP_403_FORBIDDEN, "user_banned", "This account has been suspended.")

    # Upgrade legacy Supabase bcrypt hashes to argon2 now that we know the plaintext.
    if password_needs_rehash(user.password_hash):
        user.password_hash = hash_password(body.password)

    return _issue_tokens(db, user)


@router.post("/google", response_model=TokenResponse)
def login_with_google(body: GoogleAuthRequest, db: DbSession) -> TokenResponse:
    settings = get_settings()
    if not settings.google_client_id:
        raise AppError(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "google_not_configured",
            "Google Sign-In is not configured on the server.",
        )

    try:
        id_info = google_id_token.verify_oauth2_token(
            body.id_token,
            google_requests.Request(),
            settings.google_client_id,
        )
    except ValueError:
        raise AppError(status.HTTP_401_UNAUTHORIZED, "invalid_google_token", "Invalid Google ID token.")

    email = id_info.get("email")
    if not email:
        raise AppError(status.HTTP_400_BAD_REQUEST, "email_missing", "Google account did not provide an email.")

    user = db.scalar(select(User).where(func.lower(User.email) == email.lower()))
    if not user:
        raw_name = id_info.get("name") or email.split("@")[0]
        cleaned_name = re.sub(r"[^a-zA-Z0-9_-]", "", raw_name) or "user"
        base_username = cleaned_name[:20]
        username = base_username
        suffix = 1
        while _username_taken(db, username):
            username = f"{base_username[:15]}_{suffix}"
            suffix += 1

        user = User(
            email=email.lower(),
            password_hash=None,
            auth_provider="google",
        )
        db.add(user)
        db.flush()

        profile = Profile(
            id=user.id,
            username=username,
            display_name=id_info.get("name") or username,
        )
        stats = UserStats(user_id=user.id)
        user_settings = UserSettings(user_id=user.id)
        db.add(profile)
        db.add(stats)
        db.add(user_settings)
        db.flush()
        AchievementDomainService.sync_user_achievements(db, user.id, stats)
        db.commit()
        db.refresh(user)
    elif not user.is_active:
        raise AppError(status.HTTP_403_FORBIDDEN, "inactive_user", "This account has been deactivated.")

    return _issue_tokens(db, user)


@router.post("/refresh", response_model=TokenResponse)
def refresh(body: RefreshRequest, db: DbSession) -> TokenResponse:
    token = db.scalar(
        select(RefreshToken)
        .where(RefreshToken.token_hash == hash_refresh_token(body.refresh_token))
        .with_for_update()
    )
    if token is None:
        raise _INVALID_REFRESH

    now = datetime.now(UTC)
    if token.revoked_at is not None:
        # A rotated-out token was used again: likely stolen. Kill every session of this user.
        db.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == token.user_id, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=now)
        )
        db.commit()
        raise _INVALID_REFRESH
    if _as_utc(token.expires_at) <= now:
        raise _INVALID_REFRESH

    user = db.get(User, token.user_id)
    if user is None or not user.is_active:
        raise _INVALID_REFRESH

    token.revoked_at = now
    return _issue_tokens(db, user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(body: RefreshRequest, db: DbSession) -> Response:
    db.execute(
        update(RefreshToken)
        .where(
            RefreshToken.token_hash == hash_refresh_token(body.refresh_token),
            RefreshToken.revoked_at.is_(None),
        )
        .values(revoked_at=datetime.now(UTC))
    )
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser) -> User:
    return user


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(body: ForgotPasswordRequest, db: DbSession) -> ForgotPasswordResponse:
    email = body.email.lower().strip()
    user = db.scalar(select(User).where(func.lower(User.email) == email))

    generic_msg = "If an account exists with this email, a 6-digit verification code has been sent."

    if user is None or not user.is_active:
        return ForgotPasswordResponse(message=generic_msg)

    # Invalidate previous unexpired reset codes for this account
    db.execute(
        update(PasswordResetCode)
        .where(PasswordResetCode.user_id == user.id, PasswordResetCode.used_at.is_(None))
        .values(used_at=datetime.now(UTC))
    )

    code = generate_reset_code()
    reset_entry = PasswordResetCode(
        user_id=user.id,
        email=email,
        code_hash=hash_reset_code(code),
        expires_at=reset_code_expiry(),
    )
    db.add(reset_entry)
    db.commit()

    # Dispatch email (or print to server logs if SMTP is unconfigured)
    EmailService.send_password_reset_code(email, code)

    return ForgotPasswordResponse(message=generic_msg)


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
def reset_password(body: ResetPasswordRequest, db: DbSession) -> Response:
    email = body.email.lower().strip()
    user = db.scalar(select(User).where(func.lower(User.email) == email))

    if user is None or not user.is_active:
        raise AppError(status.HTTP_400_BAD_REQUEST, "invalid_reset_code", "Invalid or expired verification code.")

    now = datetime.now(UTC)
    reset_code = db.scalar(
        select(PasswordResetCode)
        .where(
            PasswordResetCode.user_id == user.id,
            PasswordResetCode.code_hash == hash_reset_code(body.code),
            PasswordResetCode.used_at.is_(None),
            PasswordResetCode.expires_at > now,
        )
        .order_by(PasswordResetCode.created_at.desc())
    )

    if reset_code is None:
        raise AppError(status.HTTP_400_BAD_REQUEST, "invalid_reset_code", "Invalid or expired verification code.")

    # Mark code as consumed
    reset_code.used_at = now

    # Update user password
    user.password_hash = hash_password(body.new_password)

    # Invalidate existing refresh tokens for security so all old sessions require re-authentication
    db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=now)
    )

    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(body: ChangePasswordRequest, user: CurrentUser, db: DbSession) -> Response:
    if not user.password_hash or not verify_password(body.current_password, user.password_hash):
        burn_password_check(body.current_password)
        raise AppError(status.HTTP_400_BAD_REQUEST, "invalid_current_password", "Incorrect current password.")
    user.password_hash = hash_password(body.new_password)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(user: CurrentUser, db: DbSession) -> Response:
    user_id = user.id
    # Explicitly purge all account-scoped child entities in strict dependency order
    db.execute(delete(RefreshToken).where(RefreshToken.user_id == user_id))
    db.execute(delete(WorkoutSession).where(WorkoutSession.user_id == user_id))
    db.execute(delete(UserAchievement).where(UserAchievement.user_id == user_id))
    db.execute(delete(UserSettings).where(UserSettings.user_id == user_id))
    db.execute(delete(WeeklyPlanDay).where(WeeklyPlanDay.user_id == user_id))
    db.execute(delete(UserStats).where(UserStats.user_id == user_id))
    db.execute(delete(Profile).where(Profile.id == user_id))
    db.execute(delete(User).where(User.id == user_id))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
