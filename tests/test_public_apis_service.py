import pytest

from app.services.public_apis_service import PublicApisService, PublicApisServiceError


class DummyResponse:
    def __init__(self, status_code: int, payload: dict, text: str = ''):
        self.status_code = status_code
        self._payload = payload
        self.text = text

    def json(self):
        return self._payload


class DummyClient:
    def __init__(self, response: DummyResponse):
        self._response = response

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def get(self, url, params=None):
        return self._response


def test_search_parses_entries(monkeypatch):
    response = DummyResponse(
        200,
        {
            'count': 1,
            'entries': [
                {
                    'API': 'Cat Facts',
                    'Description': 'Daily cat facts',
                    'Auth': '',
                    'HTTPS': True,
                    'Cors': 'yes',
                    'Link': 'https://catfact.ninja',
                    'Category': 'Animals',
                }
            ],
        },
    )

    monkeypatch.setattr(
        'app.services.public_apis_service.httpx.AsyncClient',
        lambda timeout: DummyClient(response),
    )

    import asyncio
    data = asyncio.run(PublicApisService().search(title='cat', category='Animals', https_only=True))

    assert data.count == 1
    assert data.entries[0].api == 'Cat Facts'
    assert data.entries[0].https is True


def test_search_raises_on_upstream_error(monkeypatch):
    response = DummyResponse(503, {}, text='service unavailable')

    monkeypatch.setattr(
        'app.services.public_apis_service.httpx.AsyncClient',
        lambda timeout: DummyClient(response),
    )

    with pytest.raises(PublicApisServiceError):
        import asyncio
        asyncio.run(PublicApisService().search())
