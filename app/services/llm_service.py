import os

import httpx

from app.schemas.ai import LLMGenerateRequest, LLMGenerateResponse, LLMProviderInfo


class LLMServiceError(Exception):
    pass


class LLMService:
    PROVIDER_CONFIG = {
        'openai': {
            'api_key_env': 'OPENAI_API_KEY',
            'default_model': 'gpt-4o-mini',
            'url': 'https://api.openai.com/v1/chat/completions',
            'type': 'openai-compatible',
        },
        'groq': {
            'api_key_env': 'GROQ_API_KEY',
            'default_model': 'llama-3.1-8b-instant',
            'url': 'https://api.groq.com/openai/v1/chat/completions',
            'type': 'openai-compatible',
        },
        'openrouter': {
            'api_key_env': 'OPENROUTER_API_KEY',
            'default_model': 'openai/gpt-4o-mini',
            'url': 'https://openrouter.ai/api/v1/chat/completions',
            'type': 'openai-compatible',
        },
        'anthropic': {
            'api_key_env': 'ANTHROPIC_API_KEY',
            'default_model': 'claude-3-5-haiku-latest',
            'url': 'https://api.anthropic.com/v1/messages',
            'type': 'anthropic',
        },
        'gemini': {
            'api_key_env': 'GEMINI_API_KEY',
            'default_model': 'gemini-1.5-flash',
            'url': 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
            'type': 'gemini',
        },
    }

    def list_providers(self) -> list[LLMProviderInfo]:
        providers: list[LLMProviderInfo] = []
        for provider, config in self.PROVIDER_CONFIG.items():
            providers.append(
                LLMProviderInfo(
                    provider=provider,
                    configured=bool(os.getenv(config['api_key_env'])),
                    model=config['default_model'],
                )
            )
        return providers

    async def generate(self, payload: LLMGenerateRequest) -> LLMGenerateResponse:
        provider = payload.provider.lower().strip()
        config = self.PROVIDER_CONFIG.get(provider)
        if not config:
            raise LLMServiceError(f'Unsupported provider: {payload.provider}')

        api_key = os.getenv(config['api_key_env'])
        if not api_key:
            raise LLMServiceError(f"Missing API key: set {config['api_key_env']} in environment")

        if config['type'] == 'openai-compatible':
            return await self._generate_openai_compatible(provider, config, api_key, payload)

        if config['type'] == 'anthropic':
            return await self._generate_anthropic(provider, config, api_key, payload)

        if config['type'] == 'gemini':
            return await self._generate_gemini(provider, config, api_key, payload)

        raise LLMServiceError(f'Unsupported provider type for {provider}')

    async def _generate_openai_compatible(
        self,
        provider: str,
        config: dict[str, str],
        api_key: str,
        payload: LLMGenerateRequest,
    ) -> LLMGenerateResponse:
        body = {
            'model': config['default_model'],
            'messages': [
                {'role': 'system', 'content': payload.system_prompt},
                {'role': 'user', 'content': payload.prompt},
            ],
            'max_tokens': payload.max_tokens,
            'temperature': payload.temperature,
        }

        headers = {'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'}

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(config['url'], headers=headers, json=body)
            if response.status_code >= 400:
                raise LLMServiceError(f'{provider} API error ({response.status_code}): {response.text}')

            data = response.json()
            output = data.get('choices', [{}])[0].get('message', {}).get('content', '').strip()
            if not output:
                raise LLMServiceError(f'{provider} returned empty response')

            return LLMGenerateResponse(provider=provider, model=config['default_model'], output=output)

    async def _generate_anthropic(
        self,
        provider: str,
        config: dict[str, str],
        api_key: str,
        payload: LLMGenerateRequest,
    ) -> LLMGenerateResponse:
        headers = {
            'x-api-key': api_key,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
        }
        body = {
            'model': config['default_model'],
            'system': payload.system_prompt,
            'max_tokens': payload.max_tokens,
            'temperature': payload.temperature,
            'messages': [{'role': 'user', 'content': payload.prompt}],
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(config['url'], headers=headers, json=body)
            if response.status_code >= 400:
                raise LLMServiceError(f'{provider} API error ({response.status_code}): {response.text}')

            data = response.json()
            chunks = data.get('content', [])
            output = '\n'.join(chunk.get('text', '') for chunk in chunks if chunk.get('type') == 'text').strip()
            if not output:
                raise LLMServiceError(f'{provider} returned empty response')

            return LLMGenerateResponse(provider=provider, model=config['default_model'], output=output)

    async def _generate_gemini(
        self,
        provider: str,
        config: dict[str, str],
        api_key: str,
        payload: LLMGenerateRequest,
    ) -> LLMGenerateResponse:
        url = config['url'].format(model=config['default_model'])
        body = {
            'contents': [
                {
                    'parts': [
                        {'text': f'{payload.system_prompt}\n\n{payload.prompt}'},
                    ]
                }
            ],
            'generationConfig': {
                'temperature': payload.temperature,
                'maxOutputTokens': payload.max_tokens,
            },
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                params={'key': api_key},
                headers={'Content-Type': 'application/json'},
                json=body,
            )
            if response.status_code >= 400:
                raise LLMServiceError(f'{provider} API error ({response.status_code}): {response.text}')

            data = response.json()
            candidates = data.get('candidates', [])
            parts = candidates[0].get('content', {}).get('parts', []) if candidates else []
            output = '\n'.join(part.get('text', '') for part in parts if part.get('text')).strip()
            if not output:
                raise LLMServiceError(f'{provider} returned empty response')

            return LLMGenerateResponse(provider=provider, model=config['default_model'], output=output)
