from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_roles
from app.core.config import get_settings
from app.core.database import get_db_session
from app.schemas.auth import CurrentUser
from app.schemas.common import FileIdResponse
from app.services.r2_service import R2Service
from app.services.upload_service import handle_upload

router = APIRouter(prefix='/upload', tags=['upload'])


@router.post('', response_model=FileIdResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    uploaded_file: UploadFile = File(...),
    user: CurrentUser = Depends(require_roles('Analyst', 'Admin')),
    db: AsyncSession = Depends(get_db_session),
):
    settings = get_settings()
    content = await uploaded_file.read()
    if len(content) > settings.upload_max_size_mb * 1024 * 1024:
        raise HTTPException(status_code=413, detail='File too large')

    r2 = R2Service()
    try:
        saved = await handle_upload(
            db,
            r2,
            filename=uploaded_file.filename or 'unknown.csv',
            content_type=uploaded_file.content_type or 'application/octet-stream',
            file_bytes=content,
            user_id=user.sub,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return FileIdResponse(file_id=saved.id)
