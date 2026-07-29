"""Guards to reject operations on feature modules disabled for an edition (#66).

Each optional module maps to a boolean flag on :class:`Edition`. When the flag
is off, endpoints belonging to that module must refuse the operation with a
403, so a disabled module cannot be reached through the API even if the UI is
bypassed.
"""

from fastapi import HTTPException, status

from app.models.edition import Edition

# Human-readable module names for error messages, keyed by the Edition flag.
_MODULE_LABELS = {
    "labels_enabled": "la génération d'étiquettes",
    "deposit_review_enabled": "la revue des dépôts",
    "sales_enabled": "la vente",
    "payouts_enabled": "les reversements",
    "deposit_slots_enabled": "les créneaux de dépôt",
    "tickets_enabled": "la messagerie",
    "special_lists_enabled": "les listes spéciales 1000/2000",
    "offline_sales_enabled": "la vente hors-ligne",
    "private_school_sale_enabled": "la vente privée écoles",
}


def require_module_enabled(edition: Edition, flag: str) -> None:
    """Raise 403 if the given feature module is disabled for the edition.

    Args:
        edition: The edition the operation targets.
        flag: The boolean attribute name on Edition (e.g. "sales_enabled").
    """
    if not getattr(edition, flag, True):
        label = _MODULE_LABELS.get(flag, flag)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Le module « {label} » est désactivé pour cette édition.",
        )


def require_billetweb_import(edition: Edition) -> None:
    """Raise 403 if Billetweb import is not enabled for the edition.

    Billetweb import (CSV or API) is gated by registration_mode rather than a
    boolean flag: it is only allowed when the edition sources its depositors
    from Billetweb.
    """
    if edition.registration_mode not in ("billetweb_csv", "billetweb_api"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "L'import Billetweb est désactivé pour cette édition "
                "(mode d'inscription « manuel »)."
            ),
        )
