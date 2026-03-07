from pydantic import BaseModel


class CurrentUser(BaseModel):
    sub: str
    roles: list[str]
    email: str | None = None


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    expires_in: int = 3600


class SessionLoginRequest(BaseModel):
    username: str
    password: str


class SessionLoginResponse(CurrentUser):
    token: str
