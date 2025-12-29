"""Email service for sending transactional emails."""

import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib
from jinja2 import Environment, PackageLoader, select_autoescape

from app.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending transactional emails."""

    def __init__(self):
        """Initialize email service with Jinja2 templates."""
        self.jinja_env = Environment(
            loader=PackageLoader("app", "templates/email"),
            autoescape=select_autoescape(["html", "xml"]),
        )

    async def _send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: str,
    ) -> bool:
        """Send an email via SMTP.

        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML version of the email
            text_content: Plain text version of the email

        Returns:
            True if email was sent successfully, False otherwise
        """
        message = MIMEMultipart("alternative")
        message["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
        message["To"] = to_email
        message["Subject"] = subject

        # Attach plain text and HTML versions
        message.attach(MIMEText(text_content, "plain", "utf-8"))
        message.attach(MIMEText(html_content, "html", "utf-8"))

        try:
            await aiosmtplib.send(
                message,
                hostname=settings.smtp_host,
                port=settings.smtp_port,
                username=settings.smtp_user or None,
                password=settings.smtp_password or None,
                use_tls=settings.smtp_use_tls,
                start_tls=False,  # MailHog doesn't support STARTTLS
            )
            logger.info(f"Email sent successfully to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False

    async def send_invitation_email(
        self,
        to_email: str,
        token: str,
        first_name: str | None = None,
    ) -> bool:
        """Send an invitation email with activation link.

        Args:
            to_email: Recipient email address
            token: Activation token
            first_name: Optional first name for personalization

        Returns:
            True if email was sent successfully
        """
        activation_url = f"{settings.frontend_url}/activate?token={token}"

        # Render templates
        html_template = self.jinja_env.get_template("invitation.html")
        text_template = self.jinja_env.get_template("invitation.txt")

        context = {
            "first_name": first_name or "Déposant",
            "activation_url": activation_url,
            "expiry_days": settings.invitation_token_expire_days,
        }

        html_content = html_template.render(**context)
        text_content = text_template.render(**context)

        return await self._send_email(
            to_email=to_email,
            subject="Invitation Bourse ALPE - Activez votre compte",
            html_content=html_content,
            text_content=text_content,
        )

    async def send_password_reset_email(
        self,
        to_email: str,
        token: str,
        first_name: str | None = None,
    ) -> bool:
        """Send a password reset email.

        Args:
            to_email: Recipient email address
            token: Password reset token
            first_name: Optional first name for personalization

        Returns:
            True if email was sent successfully
        """
        reset_url = f"{settings.frontend_url}/reset-password?token={token}"

        # Render templates
        html_template = self.jinja_env.get_template("password_reset.html")
        text_template = self.jinja_env.get_template("password_reset.txt")

        context = {
            "first_name": first_name or "Utilisateur",
            "reset_url": reset_url,
            "expiry_hours": 24,  # Password reset tokens expire in 24h
        }

        html_content = html_template.render(**context)
        text_content = text_template.render(**context)

        return await self._send_email(
            to_email=to_email,
            subject="Bourse ALPE - Réinitialisation de mot de passe",
            html_content=html_content,
            text_content=text_content,
        )


# Singleton instance
email_service = EmailService()
