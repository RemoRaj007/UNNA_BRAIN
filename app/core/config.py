from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    app_name: str = 'UNNA Brain API'
    app_env: str = Field(default='development')
    app_debug: bool = Field(default=False)
    api_prefix: str = '/api/v1'

    cors_allowed_origins: list[str] = Field(default_factory=lambda: ['http://localhost:3000'])

    # Authentication
    auth_enabled: bool = Field(default=False, description='Enable JWT authentication enforcement')

    database_url: str = Field(default='postgresql+asyncpg://postgres:postgres@db:5432/unna_brain')

    oidc_issuer: str = Field(default='https://login.microsoftonline.com/common/v2.0')
    oidc_audience: str = Field(default='unna-brain-api')
    jwt_algorithm: str = Field(default='RS256')
    jwt_jwks_url: str = Field(default='')

    r2_endpoint_url: str = Field(default='https://example.r2.cloudflarestorage.com')
    r2_access_key_id: str = Field(default='')
    r2_secret_access_key: str = Field(default='')
    r2_bucket_name: str = Field(default='unna-brain')
    r2_region: str = Field(default='auto')
    r2_signed_url_expiry_seconds: int = Field(default=900)

    upload_max_size_mb: int = Field(default=20)


@lru_cache
def get_settings() -> Settings:
    return Settings()
