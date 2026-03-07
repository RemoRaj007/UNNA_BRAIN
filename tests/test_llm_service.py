import asyncio

import pytest

from app.schemas.ai import LLMGenerateRequest
from app.services.llm_service import LLMService, LLMServiceError


def test_list_providers_reflects_config(monkeypatch):
    monkeypatch.setenv('GROQ_API_KEY', 'test-key')
    service = LLMService()

    providers = {item.provider: item for item in service.list_providers()}

    assert 'groq' in providers
    assert providers['groq'].configured is True
    assert providers['openai'].configured is False


def test_generate_rejects_unknown_provider():
    service = LLMService()
    payload = LLMGenerateRequest(provider='unknown', prompt='hello')

    with pytest.raises(LLMServiceError):
        asyncio.run(service.generate(payload))
