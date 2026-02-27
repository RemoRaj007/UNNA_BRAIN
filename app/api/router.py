from fastapi import APIRouter

from app.api.routes.admin import router as admin_router
from app.api.routes.auth import router as auth_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.health import router as health_router
from app.api.routes.reports import router as reports_router
from app.api.routes.upload import router as upload_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(admin_router)
api_router.include_router(upload_router)
api_router.include_router(reports_router)
api_router.include_router(dashboard_router)
