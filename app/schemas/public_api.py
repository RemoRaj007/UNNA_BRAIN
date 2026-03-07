from pydantic import BaseModel


class PublicApiEntry(BaseModel):
    api: str
    description: str
    auth: str
    https: bool
    cors: str
    link: str
    category: str


class PublicApiSearchResponse(BaseModel):
    count: int
    entries: list[PublicApiEntry]
