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
