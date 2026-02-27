from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.core.database import get_db_session
from app.schemas.auth import CurrentUser
from app.services.audit_service import create_audit_log

router = APIRouter(prefix='/auth', tags=['auth'])


@router.get('/session', response_model=CurrentUser)
async def session_info(
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    await create_audit_log(db, action='LOGIN', user_id=user.sub)
    return user
