from uuid import UUID

from pydantic import BaseModel


class FileIdResponse(BaseModel):
    file_id: UUID


class ReportIdResponse(BaseModel):
    report_id: UUID


class SignedUrlResponse(BaseModel):
    report_id: UUID
    signed_url: str


class HealthResponse(BaseModel):
    status: str
