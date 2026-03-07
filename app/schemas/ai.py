from pydantic import BaseModel, Field


class LLMProviderInfo(BaseModel):
    provider: str
    configured: bool
    model: str


class LLMGenerateRequest(BaseModel):
    provider: str = Field(description='Provider key: openai, groq, openrouter, anthropic, gemini')
    prompt: str = Field(min_length=1, max_length=8000)
    system_prompt: str = Field(default='You are a helpful analyst for social media insights.')
    max_tokens: int = Field(default=500, ge=50, le=4000)
    temperature: float = Field(default=0.2, ge=0, le=2)


class LLMGenerateResponse(BaseModel):
    provider: str
    model: str
    output: str
