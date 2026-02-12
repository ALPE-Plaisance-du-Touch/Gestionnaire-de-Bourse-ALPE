"""API v1 package."""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    audit,
    auth,
    billetweb,
    billetweb_api,
    config,
    deposit_slots,
    depositor_articles,
    depositor_lists,
    editions,
    invitations,
    labels,
    payouts,
    sales,
    users,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(config.router, tags=["Config"])
api_router.include_router(editions.router, prefix="/editions", tags=["Editions"])
api_router.include_router(
    deposit_slots.router,
    prefix="/editions/{edition_id}/deposit-slots",
    tags=["Deposit Slots"],
)
api_router.include_router(
    billetweb.router,
    prefix="/editions/{edition_id}/billetweb",
    tags=["Billetweb Import"],
)
api_router.include_router(
    billetweb_api.router,
    prefix="/settings/billetweb",
    tags=["Billetweb API"],
)
api_router.include_router(
    billetweb_api.edition_router,
    prefix="/editions/{edition_id}/billetweb-api",
    tags=["Billetweb API Sync"],
)
api_router.include_router(invitations.router, prefix="/invitations", tags=["Invitations"])
api_router.include_router(labels.router, tags=["Labels"])
api_router.include_router(sales.router, tags=["Sales"])
api_router.include_router(payouts.router, tags=["Payouts"])
api_router.include_router(audit.router, prefix="/audit-logs", tags=["Audit Logs"])

# Depositor endpoints (article declaration)
api_router.include_router(
    depositor_lists.router,
    prefix="/depositor",
    tags=["Depositor Lists"],
)
api_router.include_router(
    depositor_articles.router,
    prefix="/depositor",
    tags=["Depositor Articles"],
)
