from pydantic import BaseModel, Field


class UploadMetadata(BaseModel):
    rows: int = Field(ge=0)
    columns: list[str]
