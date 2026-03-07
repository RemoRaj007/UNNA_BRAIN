from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import get_current_user
from app.schemas.ai import (
    EnrichWithContextRequest,
    EnrichWithContextResponse,
    LLMGenerateRequest,
    LLMGenerateResponse,
    LLMProviderInfo,
    TopicContextResult,
)
from app.schemas.auth import CurrentUser
from app.services import context_service
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


@router.post('/enrich-with-context', response_model=EnrichWithContextResponse)
async def enrich_with_context(
    payload: EnrichWithContextRequest,
    _: CurrentUser = Depends(get_current_user),
) -> EnrichWithContextResponse:
    """RAG-style endpoint: fetch Wikipedia context for topics, then generate grounded LLM insights.

    Steps:
    1. Fetch Wikipedia summaries concurrently for all requested topics
    2. Build an enriched prompt by injecting the context before the user's analysis request
    3. Call the specified LLM provider with the enriched prompt
    4. Return insights + full context sources for transparency
    """
    # Step 1: Retrieve context concurrently from Wikipedia
    raw_contexts = await context_service.fetch_multiple_topics(payload.topics)
    context_results = [TopicContextResult(**ctx) for ctx in raw_contexts]

    # Step 2: Build enriched prompt injecting Wikipedia context (RAG pattern)
    found_contexts = [ctx for ctx in context_results if ctx.found]
    if found_contexts:
        context_block = '\n\n'.join(
            f'## {ctx.title}\n{ctx.summary}' for ctx in found_contexts
        )
        enriched_prompt = (
            f'Use the following background context to inform your analysis:\n\n'
            f'{context_block}\n\n'
            f'---\n\n'
            f'Based on the context above, provide actionable social media insights.'
        )
    else:
        enriched_prompt = 'Provide actionable social media insights for the requested topics.'

    # Step 3: Generate with LLM
    llm_request = LLMGenerateRequest(
        provider=payload.provider,
        prompt=enriched_prompt,
        system_prompt=payload.system_prompt,
        max_tokens=payload.max_tokens,
        temperature=payload.temperature,
    )
    service = LLMService()
    try:
        llm_response = await service.generate(llm_request)
    except LLMServiceError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return EnrichWithContextResponse(
        output=llm_response.output,
        provider=llm_response.provider,
        model=llm_response.model,
        context_sources=context_results,
    )
