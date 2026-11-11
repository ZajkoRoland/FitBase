"""Transactional email service supporting HTTPS APIs (Brevo / Resend) and SMTP."""

import json
import logging
import os
import smtplib
import urllib.error
import urllib.request
from email.message import EmailMessage

from fastapi import status

from app.config import get_settings
from app.errors import AppError

logger = logging.getLogger(__name__)


class EmailService:
    """Dispatches transactional emails (6-digit password reset verification codes).

    Transport priority:
      1. Brevo HTTPS API (`BREVO_API_KEY` + `EMAIL_FROM`) — works on Render Free Tier (port 443)
         and delivers to any recipient address after verifying a single sender email.
      2. Resend HTTPS API (`RESEND_API_KEY` + `EMAIL_FROM`) — works on Render Free Tier (port 443).
      3. SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`) — for local dev or VPS.
      4. Console mock logger — strictly for local development when unconfigured.
    """

    @staticmethod
    def _build_reset_content(code: str) -> tuple[str, str, str]:
        subject = "FitBase - Jelszó-visszaállító ellenőrző kód"
        text_body = (
            "Kedves Felhasználónk!\n\n"
            "Kérés érkezett a FitBase fiókodhoz tartozó jelszó visszaállítására.\n\n"
            f"A 6 számjegyű ellenőrző kódod:\n\n    {code}\n\n"
            "A biztonsági kód 15 percig érvényes, és kizárólag ehhez a fiókhoz használható fel.\n"
            "Amennyiben nem te kezdeményezted a jelszó visszaállítását, hagyd figyelmen kívül ezt az üzenetet.\n\n"
            "Üdvözlettel,\n"
            "A FitBase csapata\n"
        )
        html_body = f"""
        <div style="font-family: Inter, Arial, sans-serif; background-color: #0B1222; color: #FFFFFF; padding: 32px 24px; border-radius: 16px; max-width: 480px; margin: 0 auto;">
          <h2 style="margin: 0 0 12px 0; color: #38BDF8; font-size: 22px;">FitBase – Jelszó visszaállítása</h2>
          <p style="color: #9FB3CE; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
            Kérés érkezett a FitBase fiókod jelszavának visszaállítására. Írd be az alábbi 6 számjegyű ellenőrző kódot az alkalmazásban:
          </p>
          <div style="background-color: #131F36; border: 1px solid #243B61; border-radius: 14px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #00E676;">{code}</span>
          </div>
          <p style="color: #6E829F; font-size: 12px; line-height: 1.5; margin: 0;">
            A kód 15 percig érvényes. Ha nem te kérted a jelszó módosítását, nyugodtan hagyd figyelmen kívül ezt az üzenetet.
          </p>
        </div>
        """
        return subject, text_body, html_body

    @classmethod
    def _send_via_brevo(
        cls,
        api_key: str,
        sender_email: str,
        sender_name: str,
        to_email: str,
        subject: str,
        text_body: str,
        html_body: str,
    ) -> None:
        payload = json.dumps(
            {
                "sender": {"name": sender_name, "email": sender_email},
                "to": [{"email": to_email}],
                "subject": subject,
                "textContent": text_body,
                "htmlContent": html_body,
            }
        ).encode("utf-8")

        req = urllib.request.Request(
            "https://api.brevo.com/v3/smtp/email",
            data=payload,
            headers={
                "accept": "application/json",
                "content-type": "application/json",
                "api-key": api_key,
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=12) as resp:
            logger.info("[EmailService] Brevo email sent to %s (HTTP %s)", to_email, resp.status)

    @classmethod
    def _send_via_resend(
        cls,
        api_key: str,
        sender_email: str,
        sender_name: str,
        to_email: str,
        subject: str,
        text_body: str,
        html_body: str,
    ) -> None:
        from_header = f"{sender_name} <{sender_email}>" if "<" not in sender_email else sender_email
        payload = json.dumps(
            {
                "from": from_header,
                "to": [to_email],
                "subject": subject,
                "text": text_body,
                "html": html_body,
            }
        ).encode("utf-8")

        req = urllib.request.Request(
            "https://api.resend.com/emails",
            data=payload,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=12) as resp:
            logger.info("[EmailService] Resend email sent to %s (HTTP %s)", to_email, resp.status)

    @classmethod
    def _send_via_smtp(
        cls,
        to_email: str,
        subject: str,
        text_body: str,
        html_body: str,
    ) -> None:
        settings = get_settings()
        sender = settings.smtp_from or settings.email_from or f"{settings.email_from_name} <{settings.smtp_user}>"

        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = sender
        msg["To"] = to_email
        msg.set_content(text_body)
        msg.add_alternative(html_body, subtype="html")

        if settings.smtp_port == 465:
            with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=12) as server:
                server.login(settings.smtp_user, settings.smtp_password)
                server.send_message(msg)
        elif settings.smtp_tls:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=12) as server:
                server.starttls()
                server.login(settings.smtp_user, settings.smtp_password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=12) as server:
                server.login(settings.smtp_user, settings.smtp_password)
                server.send_message(msg)
        logger.info("[EmailService] SMTP email sent to %s", to_email)

    @classmethod
    def send_password_reset_code(cls, to_email: str, code: str) -> None:
        """Dispatches a 6-digit numeric reset code to the user's registered email address."""
        settings = get_settings()
        subject, text_body, html_body = cls._build_reset_content(code)

        try:
            # 1. Brevo HTTPS API (Recommended for Render Free Tier)
            if settings.brevo_api_key and settings.email_from:
                cls._send_via_brevo(
                    api_key=settings.brevo_api_key.strip(),
                    sender_email=settings.email_from.strip(),
                    sender_name=settings.email_from_name.strip() or "FitBase",
                    to_email=to_email,
                    subject=subject,
                    text_body=text_body,
                    html_body=html_body,
                )
                return

            # 2. Resend HTTPS API
            if settings.resend_api_key:
                sender = settings.email_from.strip() or "onboarding@resend.dev"
                cls._send_via_resend(
                    api_key=settings.resend_api_key.strip(),
                    sender_email=sender,
                    sender_name=settings.email_from_name.strip() or "FitBase",
                    to_email=to_email,
                    subject=subject,
                    text_body=text_body,
                    html_body=html_body,
                )
                return

            # 3. Classic SMTP (Local dev / VPS where ports 465/587 are open)
            if settings.smtp_host and settings.smtp_user:
                cls._send_via_smtp(to_email, subject, text_body, html_body)
                return

            # 4. Unconfigured: fail explicitly in cloud production, log code in local dev
            if os.getenv("RENDER"):
                logger.error(
                    "[EmailService] Email provider is not configured on Render! "
                    "Set BREVO_API_KEY and EMAIL_FROM in Render Environment Variables."
                )
                raise AppError(
                    status.HTTP_503_SERVICE_UNAVAILABLE,
                    "email_service_unavailable",
                    "Email delivery is not configured on the server yet.",
                )

            logger.info("==================================================")
            logger.info("[FITBASE EMAIL MOCK - LOCAL DEV]")
            logger.info("Címzett: %s", to_email)
            logger.info("6 JEGYŰ ELLENŐRZŐ KÓD: %s", code)
            logger.info("==================================================")

        except AppError:
            raise
        except urllib.error.HTTPError as exc:
            err_body = exc.read().decode("utf-8", errors="ignore")
            logger.error("[EmailService] HTTPS email API error (%s): %s", exc.code, err_body)
            raise AppError(
                status.HTTP_502_BAD_GATEWAY,
                "email_delivery_failed",
                "Failed to send verification email. Please try again later.",
            ) from exc
        except Exception as exc:
            logger.error("[EmailService] Failed to send email to %s: %s", to_email, exc)
            raise AppError(
                status.HTTP_502_BAD_GATEWAY,
                "email_delivery_failed",
                "Failed to send verification email. Please try again later.",
            ) from exc
