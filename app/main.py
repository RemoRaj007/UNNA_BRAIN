from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from app.api.router import api_router
from app.core.config import get_settings
from app.core.middleware import RequestContextMiddleware
from app.logging.json_logger import configure_logging

settings = get_settings()
configure_logging()

app = FastAPI(title=settings.app_name, debug=settings.app_debug, openapi_url=f"{settings.api_prefix}/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=True,
    allow_methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allow_headers=['Authorization', 'Content-Type', 'X-Request-ID'],
)
app.add_middleware(RequestContextMiddleware)

app.include_router(api_router, prefix=settings.api_prefix)
Instrumentator().instrument(app).expose(app, include_in_schema=False, endpoint='/metrics')
