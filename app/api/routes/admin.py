from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_roles
from app.core.database import get_db_session
from app.schemas.auth import CurrentUser
from app.services.audit_service import create_audit_log

router = APIRouter(prefix='/admin', tags=['admin'])


@router.post('/audit-ping')
async def admin_audit_ping(
    user: CurrentUser = Depends(require_roles('Admin')),
    db: AsyncSession = Depends(get_db_session),
):
    await create_audit_log(db, action='ADMIN_ACTION', user_id=user.sub, payload={'action': 'audit_ping'})
    return {'status': 'ok'}
