"""Email service for sending transactional emails."""

import logging
from datetime import datetime
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
            "support_email": settings.support_email,
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
            "support_email": settings.support_email,
        }

        html_content = html_template.render(**context)
        text_content = text_template.render(**context)

        return await self._send_email(
            to_email=to_email,
            subject="Bourse ALPE - Réinitialisation de mot de passe",
            html_content=html_content,
            text_content=text_content,
        )

    async def send_billetweb_invitation_email(
        self,
        to_email: str,
        token: str,
        first_name: str | None = None,
        edition_name: str | None = None,
        slot_datetime: datetime | None = None,
    ) -> bool:
        """Send an invitation email for a Billetweb import.

        Args:
            to_email: Recipient email address
            token: Activation token
            first_name: Optional first name for personalization
            edition_name: Name of the edition
            slot_datetime: Optional deposit slot datetime

        Returns:
            True if email was sent successfully
        """
        activation_url = f"{settings.frontend_url}/activate?token={token}"

        # Render templates
        html_template = self.jinja_env.get_template("billetweb_invitation.html")
        text_template = self.jinja_env.get_template("billetweb_invitation.txt")

        context = {
            "first_name": first_name or "Déposant",
            "activation_url": activation_url,
            "edition_name": edition_name or "Bourse ALPE",
            "slot_datetime": slot_datetime,
            "expiry_days": settings.invitation_token_expire_days,
            "support_email": settings.support_email,
        }

        html_content = html_template.render(**context)
        text_content = text_template.render(**context)

        return await self._send_email(
            to_email=to_email,
            subject=f"Inscription Bourse ALPE - {edition_name or 'Activez votre compte'}",
            html_content=html_content,
            text_content=text_content,
        )

    async def send_edition_registration_notification(
        self,
        to_email: str,
        first_name: str | None = None,
        edition_name: str | None = None,
        slot_datetime: datetime | None = None,
    ) -> bool:
        """Send a notification email to existing depositors about their edition registration.

        Args:
            to_email: Recipient email address
            first_name: Optional first name for personalization
            edition_name: Name of the edition
            slot_datetime: Optional deposit slot datetime

        Returns:
            True if email was sent successfully
        """
        login_url = f"{settings.frontend_url}/login"

        # Render templates
        html_template = self.jinja_env.get_template("edition_registration.html")
        text_template = self.jinja_env.get_template("edition_registration.txt")

        context = {
            "first_name": first_name or "Déposant",
            "login_url": login_url,
            "edition_name": edition_name or "Bourse ALPE",
            "slot_datetime": slot_datetime,
            "support_email": settings.support_email,
        }

        html_content = html_template.render(**context)
        text_content = text_template.render(**context)

        return await self._send_email(
            to_email=to_email,
            subject=f"Vous êtes inscrit(e) à {edition_name or 'la Bourse ALPE'}",
            html_content=html_content,
            text_content=text_content,
        )


    async def send_edition_closed_email(
        self,
        to_email: str,
        edition_name: str,
        closed_by_name: str,
        closed_at: str,
        total_sales: str = "0.00",
        total_depositors: int = 0,
    ) -> bool:
        """Send a notification email when an edition is closed."""
        html_template = self.jinja_env.get_template("edition_closed.html")
        text_template = self.jinja_env.get_template("edition_closed.txt")

        context = {
            "edition_name": edition_name,
            "closed_by_name": closed_by_name,
            "closed_at": closed_at,
            "total_sales": total_sales,
            "total_depositors": total_depositors,
            "support_email": settings.support_email,
        }

        html_content = html_template.render(**context)
        text_content = text_template.render(**context)

        return await self._send_email(
            to_email=to_email,
            subject=f"Edition cloturee : {edition_name}",
            html_content=html_content,
            text_content=text_content,
        )

    async def send_payout_reminder_email(
        self,
        to_email: str,
        first_name: str | None = None,
        net_amount: str = "0.00",
        edition_name: str | None = None,
        location: str | None = None,
    ) -> bool:
        """Send a reminder email to an absent depositor about their payout."""
        html_template = self.jinja_env.get_template("payout_reminder.html")
        text_template = self.jinja_env.get_template("payout_reminder.txt")

        context = {
            "first_name": first_name or "Deposant",
            "net_amount": net_amount,
            "edition_name": edition_name or "Bourse ALPE",
            "location": location,
            "support_email": settings.support_email,
        }

        html_content = html_template.render(**context)
        text_content = text_template.render(**context)

        return await self._send_email(
            to_email=to_email,
            subject=f"Rappel : votre reversement de {net_amount} EUR est disponible",
            html_content=html_content,
            text_content=text_content,
        )


    async def send_deadline_reminder(
        self,
        to_email: str,
        first_name: str,
        edition_name: str,
        deadline: str,
    ) -> bool:
        """Send a deadline reminder email to a depositor."""
        lists_url = f"{settings.frontend_url}/my-lists"

        html_template = self.jinja_env.get_template("deadline_reminder.html")
        text_template = self.jinja_env.get_template("deadline_reminder.txt")

        context = {
            "first_name": first_name or "Deposant",
            "edition_name": edition_name,
            "deadline": deadline,
            "lists_url": lists_url,
            "support_email": settings.support_email,
        }

        html_content = html_template.render(**context)
        text_content = text_template.render(**context)

        return await self._send_email(
            to_email=to_email,
            subject=f"Rappel : date limite de declaration - {edition_name}",
            html_content=html_content,
            text_content=text_content,
        )

    async def send_sale_conflict_email(
        self,
        to_email: str,
        edition_name: str,
        seller_name: str,
        synced_count: int,
        conflict_count: int,
        error_count: int,
        conflicts: list[str],
    ) -> bool:
        html_template = self.jinja_env.get_template("sale_conflict.html")
        text_template = self.jinja_env.get_template("sale_conflict.txt")

        context = {
            "edition_name": edition_name,
            "seller_name": seller_name,
            "synced_count": synced_count,
            "conflict_count": conflict_count,
            "error_count": error_count,
            "conflicts": conflicts,
        }

        html_content = html_template.render(**context)
        text_content = text_template.render(**context)

        return await self._send_email(
            to_email=to_email,
            subject=f"Conflits de synchronisation - {edition_name}",
            html_content=html_content,
            text_content=text_content,
        )


    async def send_registrations_open_email(
        self,
        to_email: str,
        first_name: str,
        edition_name: str,
        declaration_deadline: str | None = None,
    ) -> bool:
        """Send an email notifying depositors that registrations are open."""
        lists_url = f"{settings.frontend_url}/my-lists"

        html_template = self.jinja_env.get_template("registrations_open.html")
        text_template = self.jinja_env.get_template("registrations_open.txt")

        context = {
            "first_name": first_name or "Deposant",
            "edition_name": edition_name,
            "declaration_deadline": declaration_deadline,
            "lists_url": lists_url,
            "support_email": settings.support_email,
        }

        html_content = html_template.render(**context)
        text_content = text_template.render(**context)

        return await self._send_email(
            to_email=to_email,
            subject=f"Inscriptions ouvertes - {edition_name}",
            html_content=html_content,
            text_content=text_content,
        )


# Singleton instance
email_service = EmailService()
