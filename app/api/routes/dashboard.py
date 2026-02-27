from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_roles
from app.core.database import get_db_session
from app.schemas.auth import CurrentUser
from app.schemas.report import DashboardSummary
from app.services.report_service import summary_stats

router = APIRouter(prefix='/dashboard', tags=['dashboard'])


@router.get('/summary', response_model=DashboardSummary)
async def dashboard_summary(
    user: CurrentUser = Depends(require_roles('Analyst', 'Admin')),
    db: AsyncSession = Depends(get_db_session),
):
    _ = user
    return DashboardSummary(**(await summary_stats(db)))
