# UNNA Brain API

Enterprise-grade FastAPI backend for social media analytics and report generation.

## Features

- 🚀 **FastAPI** - Modern, high-performance Python web framework
- 📊 **Social Media Analytics** - Upload and analyze social media data
- 📈 **Automated Reports** - Generate comprehensive analytics reports
- 🔒 **Role-Based Access Control** - Admin, Analyst, and Viewer roles
- ☁️ **Cloud Storage** - Cloudflare R2 integration for file storage
- 🐳 **Docker Ready** - Multi-stage optimized Dockerfile
- 🧪 **Testing** - Comprehensive test suite with pytest
- 📝 **Documentation** - Auto-generated OpenAPI/Swagger docs
- 🔍 **Observability** - Prometheus metrics and structured logging

## Quick Start

### Prerequisites

- Python 3.11+
- pip or uv
- Docker (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/RemoRaj007/UNNA_BRAIN.git
cd UNNA_BRAIN

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# For development
pip install -e ".[dev]"
```

### Configuration

```bash
# Copy example environment file
cp .env.local.example .env.local

# Edit with your settings
nano .env.local
```

### Run Development Server

```bash
# Using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or using Make
make run
```

Visit http://localhost:8000/docs for interactive API documentation.

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_integration_flow.py -v

# Using Make
make test
make coverage
```

## Docker

```bash
# Build image
docker build -t unna-brain-api:latest .

# Run container
docker run -d -p 8000:8000 --env-file .env.local unna-brain-api:latest

# Using Make
make docker-build
make docker-run
```

## API Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/v1/health` | Health check | Public |
| POST | `/api/v1/upload` | Upload file | Analyst, Admin |
| POST | `/api/v1/reports/generate` | Generate report | Analyst, Admin |
| GET | `/api/v1/reports/{id}` | Get report | All |
| GET | `/api/v1/dashboard/stats` | Dashboard stats | All |
| POST | `/api/v1/ai/generate` | AI content generation | Analyst, Admin |
| GET | `/api/v1/admin/users` | List users | Admin |

## Project Structure

```
UNNA_BRAIN/
├── app/
│   ├── api/            # API routes and router
│   ├── auth/           # Authentication & authorization
│   ├── core/           # Core configuration & middleware
│   ├── models/         # SQLAlchemy database models
│   ├── schemas/        # Pydantic schemas
│   ├── services/       # Business logic services
│   ├── logging/        # Logging configuration
│   └── main.py         # Application entry point
├── tests/              # Test suite
├── alembic/            # Database migrations
├── frontend/           # React frontend
├── scripts/            # Utility scripts
├── Dockerfile          # Production Docker image
├── docker-compose.yml  # Local development stack
├── requirements.txt    # Python dependencies
├── pyproject.toml      # Project configuration
└── Makefile            # Common commands
```

## Development

```bash
# Install dev dependencies
make dev

# Run linter
make lint

# Auto-fix linting issues
make lint-fix

# Type checking
make type-check

# Run all checks
make check
```

## Database Migrations

```bash
# Create new migration
make db-migrate MSG="Add new column"

# Apply migrations
make db-upgrade

# Rollback last migration
make db-downgrade
```

## CI/CD

The project uses GitHub Actions for continuous integration:

- ✅ Linting with ruff
- ✅ Type checking with mypy
- ✅ Testing with pytest
- ✅ Code coverage reporting
- ✅ Dependency vulnerability scanning
- ✅ Docker build verification

## Security

- JWT authentication with OIDC support
- Role-based access control (RBAC)
- CORS configuration
- Input validation with Pydantic
- SQL injection prevention with SQLAlchemy
- Dependency vulnerability scanning

## Observability

- Prometheus metrics at `/metrics`
- Structured JSON logging
- Request ID tracking
- Latency monitoring

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please open an issue on GitHub.
