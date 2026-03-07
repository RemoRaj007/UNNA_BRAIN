"""Tests for the Wikipedia context enrichment service."""
from __future__ import annotations

import pytest

from app.services.context_service import fetch_multiple_topics, fetch_topic_summary


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

class FakeWikiResponse:
    def __init__(self, status_code: int, body: dict):
        self.status_code = status_code
        self._body = body

    def raise_for_status(self):
        if self.status_code >= 400:
            raise Exception(f'HTTP {self.status_code}')

    def json(self):
        return self._body


class FakeHTTPClient:
    def __init__(self, status_code: int, body: dict):
        self._response = FakeWikiResponse(status_code, body)
        self.requested_urls: list[str] = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_):
        return False

    async def get(self, url, **_kwargs):
        self.requested_urls.append(url)
        return self._response


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_fetch_topic_summary_success(monkeypatch):
    import httpx

    wiki_body = {
        'title': 'Instagram Reels',
        'extract': 'Instagram Reels is a short-form video feature.',
        'content_urls': {'desktop': {'page': 'https://en.wikipedia.org/wiki/Instagram_Reels'}},
    }
    client = FakeHTTPClient(200, wiki_body)
    monkeypatch.setattr(httpx, 'AsyncClient', lambda **_kwargs: client)

    result = await fetch_topic_summary('Instagram Reels')

    assert result['found'] is True
    assert result['title'] == 'Instagram Reels'
    assert 'short-form video' in result['summary']
    assert result['url'] == 'https://en.wikipedia.org/wiki/Instagram_Reels'
    assert result['topic'] == 'Instagram Reels'


@pytest.mark.asyncio
async def test_fetch_topic_summary_not_found(monkeypatch):
    import httpx

    client = FakeHTTPClient(404, {})
    monkeypatch.setattr(httpx, 'AsyncClient', lambda **_kwargs: client)

    result = await fetch_topic_summary('NonExistentTopicXYZ')

    assert result['found'] is False
    assert result['summary'] is None
    assert result['topic'] == 'NonExistentTopicXYZ'


@pytest.mark.asyncio
async def test_fetch_multiple_topics_concurrent(monkeypatch):
    import httpx

    wiki_body = {
        'title': 'Social media',
        'extract': 'Social media are interactive technologies.',
        'content_urls': {'desktop': {'page': 'https://en.wikipedia.org/wiki/Social_media'}},
    }

    call_count = 0

    class CountingClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *_):
            return False

        async def get(self, url, **_kwargs):
            nonlocal call_count
            call_count += 1
            return FakeWikiResponse(200, wiki_body)

    monkeypatch.setattr(httpx, 'AsyncClient', lambda **_kwargs: CountingClient())

    results = await fetch_multiple_topics(['Social media', 'Content marketing'])

    assert len(results) == 2
    assert call_count == 2
    assert all(r['found'] for r in results)
