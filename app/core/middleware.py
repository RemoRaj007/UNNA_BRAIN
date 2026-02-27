import logging
import time
import uuid

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger('unna.middleware')


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        start = time.perf_counter()
        request.state.request_id = request_id
        response = await call_next(request)
        latency_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.info(
            'request_completed',
            extra={
                'request_id': request_id,
                'user_id': getattr(request.state, 'user_id', None),
                'method': request.method,
                'path': request.url.path,
                'status_code': response.status_code,
                'latency_ms': latency_ms,
            },
        )
        response.headers['X-Request-ID'] = request_id
        return response
