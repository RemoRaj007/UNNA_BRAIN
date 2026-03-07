from datetime import date
from uuid import UUID

from pydantic import BaseModel


class GenerateReportRequest(BaseModel):
    file_id: UUID
    start_date: date
    end_date: date


class DashboardSummary(BaseModel):
    total_uploads: int
    total_reports: int
    completed_reports: int
    failed_reports: int


class ReportItem(BaseModel):
    id: UUID
    file_id: UUID
    status: str
    output_r2_key: str | None = None
    requested_by: str


class ReportListResponse(BaseModel):
    items: list[ReportItem]
    total: int


class CreateReportRequest(BaseModel):
    file_id: UUID
    start_date: date | None = None
    end_date: date | None = None


class UpdateReportRequest(BaseModel):
    status: str | None = None
