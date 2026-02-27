from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file_asset import FileAsset
from app.services.audit_service import create_audit_log
from app.services.r2_service import R2Service
from app.services.validation_service import read_tabular_file, validate_schema


async def handle_upload(
    db: AsyncSession,
    r2_service: R2Service,
    *,
    filename: str,
    content_type: str,
    file_bytes: bytes,
    user_id: str,
) -> FileAsset:
    df = read_tabular_file(filename, file_bytes)
    metadata = validate_schema(df)

    key = f'uploads/{uuid4()}-{filename}'
    await r2_service.put_object(key, file_bytes, content_type)

    file_asset = FileAsset(
        original_filename=filename,
        content_type=content_type,
        size_bytes=len(file_bytes),
        r2_key=key,
        schema_metadata=metadata,
        uploaded_by=user_id,
    )
    db.add(file_asset)
    await db.commit()
    await db.refresh(file_asset)

    await create_audit_log(db, action='UPLOAD', user_id=user_id, resource_id=str(file_asset.id), payload=metadata)
    return file_asset
