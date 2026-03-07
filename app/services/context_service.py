"""
Context enrichment service using Wikipedia REST API.

Implements a lightweight RAG (Retrieval-Augmented Generation) pattern:
fetch factual context from Wikipedia → inject into LLM prompts → grounded insights.

Wikipedia REST API: https://en.wikipedia.org/api/rest_v1/page/summary/{title}
- Free, no API key required
- Returns page summary, extract, and canonical URL
"""
from __future__ import annotations

import asyncio

import httpx

WIKIPEDIA_SUMMARY_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary/{title}'


async def fetch_topic_summary(topic: str) -> dict:
    """Fetch a Wikipedia summary for a single topic.

    Args:
        topic: The topic to look up (spaces are converted to underscores).

    Returns:
        A dict with keys: topic, title, summary, url, found.
    """
    safe_title = topic.strip().replace(' ', '_')
    url = WIKIPEDIA_SUMMARY_URL.format(title=safe_title)

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url, headers={'Accept': 'application/json'})

    if response.status_code == 404:
        return {'topic': topic, 'title': topic, 'summary': None, 'url': '', 'found': False}

    response.raise_for_status()
    data = response.json()

    return {
        'topic': topic,
        'title': data.get('title', topic),
        'summary': data.get('extract', ''),
        'url': data.get('content_urls', {}).get('desktop', {}).get('page', ''),
        'found': True,
    }


async def fetch_multiple_topics(topics: list[str]) -> list[dict]:
    """Fetch Wikipedia summaries for multiple topics concurrently.

    Args:
        topics: List of topic strings to look up.

    Returns:
        List of dicts (same shape as fetch_topic_summary), one per topic,
        in the same order as the input list.
    """
    results = await asyncio.gather(
        *[fetch_topic_summary(topic) for topic in topics],
        return_exceptions=False,
    )
    return list(results)
