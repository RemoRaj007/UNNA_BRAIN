from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


async def create_audit_log(
    db: AsyncSession,
    *,
    action: str,
    user_id: str,
    resource_id: str | None = None,
    payload: dict | None = None,
) -> None:
    db.add(AuditLog(action=action, user_id=user_id, resource_id=resource_id, payload=payload or {}))
    await db.commit()
