# UNNA Brain

A modern, full-stack AI-powered analysis platform built with FastAPI and Cloudflare Pages.

## Overview

UNNA Brain is a comprehensive platform for document analysis, report generation, and dashboard analytics. It combines:

- **Backend:** FastAPI microservices for API, authentication, and data processing
- **Frontend:** Static site hosted on Cloudflare Pages with API routing
- **Storage:** Cloudflare R2 for file management
- **Database:** PostgreSQL with SQLAlchemy ORM
- **Authentication:** Microsoft Entra ID (OIDC) with optional development mode

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm/bun
- **Python** 3.11+
- **Docker** (for backend and database)
- **Git** for version control

### Installation

1. **Clone and install dependencies:**

```bash
# Install frontend dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt
```

2. **Configure environment:**

```bash
# Copy environment template
cp .env.local.example .env.local

# Edit with your settings (optional for development)
# Default development settings work out of the box
```

3. **Start backend and database:**

```bash
# Start Docker services
docker-compose up -d

# Verify database is ready (wait ~10 seconds)
docker-compose logs db
```

4. **Verify environment:**

```bash
# Run verification script
npm run verify

# Or use bash script
bash verify-environment.sh
```

5. **Run development server:**

```bash
# Terminal 1: Start frontend dev server
npm run dev                # Frontend only (no backend required)

# Optional Terminal 2: full backend stack
npm run fullstack-dev      # Runs verify + starts Docker db/api
```

6. **Access the application:**

- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:8000/api/v1/docs
- **API ReDoc:** http://localhost:8000/api/v1/redoc

## Project Structure

```
UNNA_BRAIN/
├── frontend/
│   ├── index.html           # Entry point
│   ├── _redirects           # API routing rules for Cloudflare
│   ├── assets/              # Static assets
│   └── api-client.js        # JavaScript API client
├── app/
│   ├── main.py              # FastAPI application entry
│   ├── core/
│   │   └── config.py        # Configuration management
│   ├── auth/                # Authentication & JWT
│   ├── schemas/             # Request/response models
│   ├── routes/              # API endpoints
│   ├── models/              # Database models
│   └── services/            # Business logic
├── tests/
│   └── test_api_endpoints.py # Comprehensive API tests
├── scripts/
│   ├── verify-environment.js # Node.js verification
│   └── check-issues.sh      # Local lint/type/test + issue summary
├── docker-compose.yml       # Local development stack
├── wrangler.toml           # Cloudflare deployment config
├── package.json            # Frontend & scripts
├── requirements.txt        # Python dependencies
├── API.md                  # Complete API documentation
├── BUILD_ENVIRONMENT.md    # Setup & troubleshooting guide
├── postman-collection.json # Postman API collection
└── README.md              # This file
```

## API Overview

The UNNA Brain API provides endpoints for:

- **Health Check:** API status verification
- **Authentication:** JWT token management
- **File Upload:** Upload and process documents
- **Reports:** Create, read, update, delete analytical reports
- **Dashboard:** Aggregated analytics and metrics
- **Admin:** System administration and user management

### Key Endpoints

```
GET    /api/v1/health              # Health check
POST   /api/v1/auth/token          # Get auth token
POST   /api/v1/upload              # Upload file
GET    /api/v1/reports             # List reports
POST   /api/v1/reports             # Create report
GET    /api/v1/reports/{id}        # Get report
PATCH  /api/v1/reports/{id}        # Update report
DELETE /api/v1/reports/{id}        # Delete report
GET    /api/v1/dashboard           # Get dashboard data
GET    /api/v1/admin/status        # Admin status
GET    /api/v1/admin/users         # List users
```

### Testing the API

**Option 1: Using Postman**

1. Import `postman-collection.json` into Postman
2. Set variables: `base_url`, `token` (if needed)
3. Use example requests for each endpoint

**Option 2: Using cURL**

```bash
# Health check
curl http://localhost:8000/api/v1/health

# Get reports
curl http://localhost:8000/api/v1/reports

# Upload file
curl -X POST http://localhost:8000/api/v1/upload \
  -F "file=@data.xlsx"

# Create report
curl -X POST http://localhost:8000/api/v1/reports \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Report",
    "file_ids": ["file-123"],
    "analysis_type": "financial"
  }'
```

**Option 3: Using Python**

```python
import httpx

client = httpx.Client(base_url="http://localhost:8000/api/v1")

# Get reports
response = client.get("/reports")
print(response.json())

# Upload file
with open("data.xlsx", "rb") as f:
    files = {"file": f}
    response = client.post("/upload", files=files)
    print(response.json())
```

**Option 4: Using JavaScript**

```javascript
import { apiClient } from './frontend/api-client.js';

// List reports
const reports = await apiClient.get('/reports');

// Create report
const newReport = await apiClient.post('/reports', {
  title: 'My Report',
  file_ids: ['file-123']
});
```

### Running Tests

```bash
# Run all API tests
npm run backend-test

# Run specific test
pytest tests/test_api_endpoints.py::test_health_check -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html
```

## Development

### Environment Variables

**Development Mode (default):**
```env
AUTH_ENABLED=false          # Authentication disabled
API_PREFIX=/api/v1
APP_ENV=development
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/unna_brain
```

**Production Mode:**
```env
AUTH_ENABLED=true                    # Require authentication
OIDC_ISSUER=https://login.microsoftonline.com/common/v2.0
OIDC_AUDIENCE=unna-brain-api
JWT_JWKS_URL=<your-jwks-url>
```

See `.env.local.example` for all available options.

### Available Scripts

```bash
# Frontend development
npm run dev              # Start frontend-only dev server

# Deployment
npm run deploy           # Deploy frontend to Cloudflare Pages

# Backend services
npm run fullstack-dev    # Start backend stack (verify + Docker)
npm run backend-dev      # Start Docker services
npm run backend-down     # Stop Docker services
npm run backend-logs     # View Docker logs

# Testing & verification
npm run verify           # Run environment verification
npm run check-issues     # Run best-effort lint/type/test + issue summary
npm run backend-test     # Run API tests
npm run backend-lint     # Lint Python code
npm run backend-type     # Type checking

# Utilities
npm run clean            # Clean build artifacts
```

### Database Setup

The database is automatically initialized by Docker Compose:

```bash
# View database logs
docker-compose logs -f db

# Connect to database (if needed)
docker-compose exec db psql -U postgres -d unna_brain

# Run migrations
docker-compose exec api alembic upgrade head
```

## Authentication

### Development Mode (Default)

With `AUTH_ENABLED=false`, all requests automatically get a test user:

```json
{
  "sub": "test-user",
  "roles": ["Analyst", "Admin"],
  "email": "test@example.com"
}
```

No auth headers needed for testing.

### Production Mode

With `AUTH_ENABLED=true`, requests require:

```bash
Authorization: Bearer <jwt-token>
```

Tokens are obtained via:

```bash
curl -X POST /api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user@example.com",
    "password": "password"
  }'
```

## Deployment

### Frontend (Cloudflare Pages)

```bash
# Deploy frontend
npm run deploy

# This runs scripts/deploy-pages.sh (build + output validation + deploy)
# Before deploying, set frontend/_redirects to your backend API domain
# For a local no-upload check: CLOUDFLARE_DRY_RUN=1 npm run deploy
# See CLOUDFLARE_PAGES.md for full setup and MIME error troubleshooting
```

### Backend (Docker)

```bash
# Build image
docker build -t unna-brain-api .

# Run container
docker run -p 8000:8000 unna-brain-api

# Or use docker-compose
docker-compose up -d api
```

### Configuration

Update `wrangler.toml` with:

```toml
[env.production]
routes = [
  { pattern = "api.your-domain.com/api/*", zone_id = "..." }
]
```

## Troubleshooting

See `BUILD_ENVIRONMENT.md` for detailed troubleshooting guide covering:

- Dependency installation issues
- Docker setup problems
- Database connection errors
- API authentication issues
- Deployment failures
- Common error messages and solutions

## API Documentation

Complete API documentation is available in `API.md`, including:

- All endpoints with request/response examples
- Authentication details
- Error handling
- Rate limiting
- Pagination
- Security considerations
- Complete workflow examples

Interactive documentation available at:

- **Swagger UI:** http://localhost:8000/api/v1/docs
- **ReDoc:** http://localhost:8000/api/v1/redoc
- **OpenAPI Spec:** http://localhost:8000/api/v1/openapi.json

## Project Architecture

### Backend Stack

- **Framework:** FastAPI 0.115+
- **Server:** Uvicorn with async support
- **Database:** PostgreSQL 14+ with asyncpg
- **ORM:** SQLAlchemy 2.0+ with async
- **Auth:** JWT with OIDC (Microsoft Entra ID)
- **Storage:** Cloudflare R2 via aioboto3
- **Validation:** Pydantic v2
- **Observability:** Prometheus metrics

### Frontend Stack

- **Hosting:** Cloudflare Pages
- **Routing:** _redirects for API proxying
- **Client:** Custom JavaScript API client
- **Build Tool:** Wrangler CLI

## Security

- ✅ Environment variables for credentials
- ✅ JWT token validation with JWKS
- ✅ Role-based access control (RBAC)
- ✅ CORS configuration
- ✅ File size limits (20 MB default)
- ✅ Signed URLs for file downloads
- ✅ SQL injection prevention (SQLAlchemy ORM)
- ✅ XSS protection (JSON responses only)

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test: `npm run verify && npm run backend-test`
3. Commit with clear message: `git commit -m "Add feature description"`
4. Push to branch: `git push origin feature/your-feature`
5. Create Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

- **Documentation:** See `BUILD_ENVIRONMENT.md` and `API.md`
- **Issues:** Check troubleshooting section
- **Questions:** Review API documentation and examples

## Status

- ✅ FastAPI backend with full API
- ✅ Frontend static hosting setup
- ✅ Authentication disabled by default (configurable)
- ✅ Database initialized
- ✅ Docker Compose setup
- ✅ API documentation
- ✅ Testing infrastructure
- 🔄 Deployment pipeline
- 🔄 CI/CD integration

## Version

**Current:** 1.0.0
**Last Updated:** 2024-02-28

---

For detailed setup instructions, see `BUILD_ENVIRONMENT.md`.
For API reference, see `API.md`.
