FROM python:3.11-slim AS builder
WORKDIR /build
COPY pyproject.toml ./
RUN pip install --upgrade pip && pip wheel --no-cache-dir --wheel-dir /wheels .[dev]

FROM python:3.11-slim AS runtime
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir /wheels/*
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
