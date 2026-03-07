import asyncio
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_roles
from app.core.database import get_db_session
from app.schemas.auth import CurrentUser
from app.schemas.common import ReportIdResponse, SignedUrlResponse
from app.schemas.report import (
    CreateReportRequest,
    GenerateReportRequest,
    ReportItem,
    ReportListResponse,
    UpdateReportRequest,
)
from app.services.audit_service import create_audit_log
from app.services.r2_service import R2Service
from app.services.report_service import (
    create_report_request,
    delete_report,
    generate_report_background,
    get_report,
    list_reports,
    update_report_status,
)

router = APIRouter(prefix='/reports', tags=['reports'])


def _normalize_dates(start_date: date | None, end_date: date | None) -> tuple[date, date]:
    today = date.today()
    return start_date or today, end_date or today


@router.get('', response_model=ReportListResponse)
async def get_reports(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    status_filter: str | None = Query(default=None, alias='status'),
    _: CurrentUser = Depends(require_roles('Viewer', 'Analyst', 'Admin')),
    db: AsyncSession = Depends(get_db_session),
):
    reports, total = await list_reports(db, skip=skip, limit=limit, status=status_filter)
    return ReportListResponse(
        items=[
            ReportItem(
                id=item.id,
                file_id=item.file_id,
                status=item.status,
                output_r2_key=item.output_r2_key,
                requested_by=item.requested_by,
            )
            for item in reports
        ],
        total=total,
    )


@router.post('', response_model=ReportIdResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_report(
    payload: CreateReportRequest,
    user: CurrentUser = Depends(require_roles('Analyst', 'Admin')),
    db: AsyncSession = Depends(get_db_session),
):
    start_date, end_date = _normalize_dates(payload.start_date, payload.end_date)
    report = await create_report_request(db, file_id=payload.file_id, user_id=user.sub)
    r2 = R2Service()
    asyncio.create_task(
        generate_report_background(
            db,
            r2,
            report_id=report.id,
            file_id=payload.file_id,
            user_id=user.sub,
            start_date=start_date,
            end_date=end_date,
        )
    )
    return ReportIdResponse(report_id=report.id)


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


@router.patch('/{report_id}', response_model=ReportItem)
async def patch_report(
    report_id: UUID,
    payload: UpdateReportRequest,
    _: CurrentUser = Depends(require_roles('Analyst', 'Admin')),
    db: AsyncSession = Depends(get_db_session),
):
    report = await get_report(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail='Report not found')

    if payload.status is not None:
        report = await update_report_status(db, report, status=payload.status)

    return ReportItem(
        id=report.id,
        file_id=report.file_id,
        status=report.status,
        output_r2_key=report.output_r2_key,
        requested_by=report.requested_by,
    )


@router.delete('/{report_id}', status_code=status.HTTP_204_NO_CONTENT)
async def remove_report(
    report_id: UUID,
    _: CurrentUser = Depends(require_roles('Analyst', 'Admin')),
    db: AsyncSession = Depends(get_db_session),
):
    report = await get_report(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail='Report not found')
    await delete_report(db, report)
    return None
