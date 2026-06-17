# UNNA Brain API Makefile
# Common development and deployment tasks

.PHONY: help install dev test lint type-check clean docker-build docker-run db-migrate db-upgrade coverage run

# Default target
help:
@echo "UNNA Brain API - Available commands:"
@echo ""
@echo "  Installation:"
@echo "    make install       - Install production dependencies"
@echo "    make dev           - Install development dependencies"
@echo ""
@echo "  Testing:"
@echo "    make test          - Run all tests"
@echo "    make test-verbose  - Run tests with verbose output"
@echo "    make coverage      - Run tests with coverage report"
@echo "    make test-fast     - Run tests without coverage (faster)"
@echo ""
@echo "  Code Quality:"
@echo "    make lint          - Run ruff linter"
@echo "    make lint-fix      - Auto-fix linting issues"
@echo "    make type-check    - Run mypy type checker"
@echo "    make check         - Run all code quality checks"
@echo ""
@echo "  Database:"
@echo "    make db-migrate    - Generate new migration (usage: make db-migrate MSG=\"description\")"
@echo "    make db-upgrade    - Apply database migrations"
@echo "    make db-downgrade  - Rollback last migration"
@echo ""
@echo "  Docker:"
@echo "    make docker-build  - Build Docker image"
@echo "    make docker-run    - Run Docker container locally"
@echo "    make docker-clean  - Remove local Docker images"
@echo ""
@echo "  Development:"
@echo "    make run           - Start development server"
@echo "    make run-prod      - Start production server"
@echo "    make clean         - Clean build artifacts"
@echo ""

# Installation
install:
pip install -r requirements.txt

dev: install
pip install -e ".[dev]"

# Testing
test:
pytest -v

test-verbose:
pytest -v -s --tb=long

coverage:
pytest -v --cov=app --cov-report=term-missing --cov-report=html

test-fast:
pytest -v --no-cov

# Code Quality
lint:
ruff check app tests

lint-fix:
ruff check --fix app tests

type-check:
mypy app --ignore-missing-imports

check: lint type-check

# Database
db-migrate:
ifndef MSG
$(error MSG is required. Usage: make db-migrate MSG="migration description")
endif
alembic revision --autogenerate -m "$(MSG)"

db-upgrade:
alembic upgrade head

db-downgrade:
alembic downgrade -1

# Docker
docker-build:
docker build -t unna-brain-api:latest .

docker-run:
docker run -d -p 8000:8000 \
--env-file .env.local \
--name unna-brain-api \
unna-brain-api:latest

docker-clean:
docker stop unna-brain-api || true
docker rm unna-brain-api || true
docker rmi unna-brain-api:latest || true

# Development Server
run:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

run-prod:
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Cleanup
clean:
find . -type d -name "__pycache__" -exec rm -rf {} +
find . -type d -name "*.egg-info" -exec rm -rf {} +
find . -type d -name ".pytest_cache" -exec rm -rf {} +
find . -type d -name ".mypy_cache" -exec rm -rf {} +
find . -type f -name "*.pyc" -delete
rm -rf build/ dist/ htmlcov/ .coverage coverage.xml
@echo "Cleanup complete!"
