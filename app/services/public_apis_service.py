import httpx

from app.schemas.public_api import PublicApiEntry, PublicApiSearchResponse


class PublicApisServiceError(Exception):
    pass


class PublicApisService:
    BASE_URL = 'https://api.publicapis.org'

    async def search(
        self,
        *,
        title: str | None = None,
        category: str | None = None,
        https_only: bool | None = None,
    ) -> PublicApiSearchResponse:
        params: dict[str, str] = {}
        if title:
            params['title'] = title
        if category:
            params['category'] = category
        if https_only is not None:
            params['https'] = str(https_only).lower()

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(f'{self.BASE_URL}/entries', params=params)

        if response.status_code >= 400:
            raise PublicApisServiceError(
                f'Public APIs service error ({response.status_code}): {response.text}'
            )

        payload = response.json()
        entries = [
            PublicApiEntry(
                api=item.get('API', ''),
                description=item.get('Description', ''),
                auth=item.get('Auth', ''),
                https=bool(item.get('HTTPS', False)),
                cors=item.get('Cors', ''),
                link=item.get('Link', ''),
                category=item.get('Category', ''),
            )
            for item in payload.get('entries', [])
        ]

        return PublicApiSearchResponse(count=int(payload.get('count', len(entries))), entries=entries)
