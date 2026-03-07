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


class TopicContextResult(BaseModel):
    """Wikipedia context result for a single topic."""

    topic: str
    title: str
    summary: str | None
    url: str
    found: bool


class EnrichWithContextRequest(BaseModel):
    """RAG-style enrichment request: fetch Wikipedia context then generate LLM insights."""

    topics: list[str] = Field(
        min_length=1,
        max_length=10,
        description='List of topics to look up in Wikipedia (1-10 items)',
    )
    provider: str = Field(description='LLM provider key: openai, groq, openrouter, anthropic, gemini')
    system_prompt: str = Field(
        default='You are a social media analyst. Use the provided context to generate actionable insights.',
    )
    max_tokens: int = Field(default=800, ge=50, le=4000)
    temperature: float = Field(default=0.3, ge=0, le=2)


class EnrichWithContextResponse(BaseModel):
    """RAG enrichment response: LLM insights grounded in Wikipedia context."""

    output: str
    provider: str
    model: str
    context_sources: list[TopicContextResult]
