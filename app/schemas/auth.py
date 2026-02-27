from pydantic import BaseModel


class CurrentUser(BaseModel):
    sub: str
    roles: list[str]
    email: str | None = None
