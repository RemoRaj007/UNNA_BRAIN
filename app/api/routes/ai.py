from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import get_current_user
from app.schemas.ai import LLMGenerateRequest, LLMGenerateResponse, LLMProviderInfo
from app.schemas.auth import CurrentUser
from app.services.llm_service import LLMService, LLMServiceError

router = APIRouter(prefix='/ai', tags=['ai'])


@router.get('/providers', response_model=list[LLMProviderInfo])
async def list_ai_providers(
    _: CurrentUser = Depends(get_current_user),
) -> list[LLMProviderInfo]:
    return LLMService().list_providers()


@router.post('/generate', response_model=LLMGenerateResponse)
async def generate_ai_output(
    payload: LLMGenerateRequest,
    _: CurrentUser = Depends(get_current_user),
) -> LLMGenerateResponse:
    service = LLMService()
    try:
        return await service.generate(payload)
    except LLMServiceError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
