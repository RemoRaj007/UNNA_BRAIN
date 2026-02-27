import asyncio
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_roles
from app.core.database import get_db_session
from app.schemas.auth import CurrentUser
from app.schemas.common import ReportIdResponse, SignedUrlResponse
from app.schemas.report import GenerateReportRequest
from app.services.audit_service import create_audit_log
from app.services.r2_service import R2Service
from app.services.report_service import create_report_request, generate_report_background, get_report

router = APIRouter(prefix='/reports', tags=['reports'])


@router.post('/generate', response_model=ReportIdResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_report(
    payload: GenerateReportRequest,
    user: CurrentUser = Depends(require_roles('Analyst', 'Admin')),
    db: AsyncSession = Depends(get_db_session),
):
    report = await create_report_request(db, file_id=payload.file_id, user_id=user.sub)
    r2 = R2Service()
    asyncio.create_task(
        generate_report_background(
            db,
            r2,
            report_id=report.id,
            file_id=payload.file_id,
            user_id=user.sub,
            start_date=payload.start_date,
            end_date=payload.end_date,
        )
    )
    return ReportIdResponse(report_id=report.id)


@router.get('/{report_id}', response_model=SignedUrlResponse)
async def get_report_url(
    report_id: UUID,
    user: CurrentUser = Depends(require_roles('Viewer', 'Analyst', 'Admin')),
    db: AsyncSession = Depends(get_db_session),
):
    report = await get_report(db, report_id)
    if not report or not report.output_r2_key:
        raise HTTPException(status_code=404, detail='Report not available')

    signed_url = await R2Service().get_signed_url(report.output_r2_key)
    await create_audit_log(db, action='DOWNLOAD', user_id=user.sub, resource_id=str(report.id))
    return SignedUrlResponse(report_id=report.id, signed_url=signed_url)
