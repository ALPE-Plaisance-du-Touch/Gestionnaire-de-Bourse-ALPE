"""API v1 package."""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, billetweb, config, deposit_slots, editions, invitations

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
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
api_router.include_router(invitations.router, prefix="/invitations", tags=["Invitations"])
