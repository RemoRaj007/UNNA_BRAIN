from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth.dependencies import get_current_user
from app.schemas.auth import CurrentUser
from app.schemas.public_api import PublicApiSearchResponse
from app.services.public_apis_service import PublicApisService, PublicApisServiceError

router = APIRouter(prefix='/public-apis', tags=['public-apis'])


@router.get('/search', response_model=PublicApiSearchResponse)
async def search_public_apis(
    query: str | None = Query(default=None, description='API title search keyword'),
    category: str | None = Query(default=None, description='Filter by category (e.g. Animals, Weather)'),
    https_only: bool | None = Query(default=True, description='Filter to HTTPS APIs only'),
    _: CurrentUser = Depends(get_current_user),
) -> PublicApiSearchResponse:
    service = PublicApisService()
    try:
        return await service.search(title=query, category=category, https_only=https_only)
    except PublicApisServiceError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
