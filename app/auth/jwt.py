from functools import lru_cache

import httpx
from jose import JWTError, jwt

from app.core.config import get_settings


class AuthError(Exception):
    pass


@lru_cache
def _jwks_client():
    settings = get_settings()
    if not settings.jwt_jwks_url:
        raise AuthError('JWT JWKS URL is not configured')
    return settings.jwt_jwks_url


async def decode_and_validate_token(token: str) -> dict:
    settings = get_settings()
    jwks_url = _jwks_client()

    async with httpx.AsyncClient(timeout=5.0) as client:
        jwks = (await client.get(jwks_url)).json()

    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get('kid')
        key = next((k for k in jwks.get('keys', []) if k.get('kid') == kid), None)
        if not key:
            raise AuthError('Signing key not found')

        payload = jwt.decode(
            token,
            key,
            algorithms=[settings.jwt_algorithm],
            audience=settings.oidc_audience,
            issuer=settings.oidc_issuer,
            options={'verify_at_hash': False},
        )
        return payload
    except JWTError as exc:
        raise AuthError('Invalid token') from exc
