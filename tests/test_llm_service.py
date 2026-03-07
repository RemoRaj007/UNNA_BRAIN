import asyncio
import json

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


# ---------------------------------------------------------------------------
# Helpers for mocking httpx.AsyncClient
# ---------------------------------------------------------------------------

class FakeHTTPResponse:
    def __init__(self, status_code: int, body: dict):
        self.status_code = status_code
        self._body = body
        self.text = json.dumps(body)

    def json(self):
        return self._body


class FakeHTTPClient:
    """Async context manager that returns a fake HTTP client."""

    def __init__(self, status_code: int, body: dict):
        self._response = FakeHTTPResponse(status_code, body)

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_):
        return False

    async def post(self, *_args, **_kwargs):
        return self._response


# ---------------------------------------------------------------------------
# Provider-specific tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_generate_openai_compatible_success(monkeypatch):
    monkeypatch.setenv('GROQ_API_KEY', 'fake-key')
    import httpx
    body = {'choices': [{'message': {'content': 'great insight'}}]}
    monkeypatch.setattr(httpx, 'AsyncClient', lambda **_kwargs: FakeHTTPClient(200, body))

    service = LLMService()
    payload = LLMGenerateRequest(provider='groq', prompt='analyze this')
    result = await service.generate(payload)

    assert result.output == 'great insight'
    assert result.provider == 'groq'


@pytest.mark.asyncio
async def test_generate_anthropic_success(monkeypatch):
    monkeypatch.setenv('ANTHROPIC_API_KEY', 'fake-key')
    import httpx
    body = {'content': [{'type': 'text', 'text': 'anthropic result'}]}
    monkeypatch.setattr(httpx, 'AsyncClient', lambda **_kwargs: FakeHTTPClient(200, body))

    service = LLMService()
    payload = LLMGenerateRequest(provider='anthropic', prompt='analyze this')
    result = await service.generate(payload)

    assert result.output == 'anthropic result'
    assert result.provider == 'anthropic'


@pytest.mark.asyncio
async def test_generate_gemini_success(monkeypatch):
    monkeypatch.setenv('GEMINI_API_KEY', 'fake-key')
    import httpx
    body = {'candidates': [{'content': {'parts': [{'text': 'gemini result'}]}}]}
    monkeypatch.setattr(httpx, 'AsyncClient', lambda **_kwargs: FakeHTTPClient(200, body))

    service = LLMService()
    payload = LLMGenerateRequest(provider='gemini', prompt='analyze this')
    result = await service.generate(payload)

    assert result.output == 'gemini result'
    assert result.provider == 'gemini'


@pytest.mark.asyncio
async def test_generate_missing_api_key_raises():
    import os
    # Ensure no env var is set for openai
    os.environ.pop('OPENAI_API_KEY', None)

    service = LLMService()
    payload = LLMGenerateRequest(provider='openai', prompt='hello')

    with pytest.raises(LLMServiceError, match='Missing API key'):
        await service.generate(payload)


@pytest.mark.asyncio
async def test_generate_api_error_status_raises(monkeypatch):
    monkeypatch.setenv('OPENAI_API_KEY', 'fake-key')
    import httpx
    body = {'error': {'message': 'bad request'}}
    monkeypatch.setattr(httpx, 'AsyncClient', lambda **_kwargs: FakeHTTPClient(400, body))

    service = LLMService()
    payload = LLMGenerateRequest(provider='openai', prompt='hello')

    with pytest.raises(LLMServiceError, match='API error'):
        await service.generate(payload)
