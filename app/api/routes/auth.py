from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.core.database import get_db_session
from app.schemas.auth import AuthTokenResponse, CurrentUser, SessionLoginRequest, SessionLoginResponse
from app.services.audit_service import create_audit_log

router = APIRouter(prefix='/auth', tags=['auth'])


@router.get('/session', response_model=CurrentUser)
async def session_info(
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    await create_audit_log(db, action='LOGIN', user_id=user.sub)
    return user


@router.post('/session', response_model=SessionLoginResponse)
async def session_login(
    payload: SessionLoginRequest,
    db: AsyncSession = Depends(get_db_session),
):
    # Demo-mode login endpoint for frontend compatibility.
    user = SessionLoginResponse(
        sub=payload.username,
        email=payload.username,
        roles=['Analyst', 'Admin'],
        token='mock-token',
    )
    await create_audit_log(db, action='LOGIN', user_id=user.sub, payload={'method': 'session'})
    return user


@router.post('/token', response_model=AuthTokenResponse)
async def issue_token(
    _: SessionLoginRequest,
) -> AuthTokenResponse:
    # Compatibility endpoint for API clients when AUTH_ENABLED=false.
    return AuthTokenResponse(access_token='mock-token')
