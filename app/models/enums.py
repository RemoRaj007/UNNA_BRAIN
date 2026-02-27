from enum import StrEnum


class UserRole(StrEnum):
    VIEWER = 'Viewer'
    ANALYST = 'Analyst'
    ADMIN = 'Admin'


class ReportStatus(StrEnum):
    PENDING = 'PENDING'
    COMPLETED = 'COMPLETED'
    FAILED = 'FAILED'
