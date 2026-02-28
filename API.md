# UNNA Brain API Documentation

## Overview

The UNNA Brain API is a FastAPI-based backend service that provides endpoints for authentication, file uploads, report generation, dashboard data, and admin operations. The API follows RESTful principles and uses JSON for request and response payloads.

**Base URL:** `http://localhost:8000/api/v1` (development)
**API Version:** v1
**Response Format:** JSON
**Authentication:** JWT Bearer tokens (optional in development)

---

## Getting Started

### Running the Backend

```bash
# Start backend with Docker Compose
docker-compose up -d

# Or run locally with Python
python -m uvicorn app.main:app --reload --port 8000
```

### Accessing API Documentation

FastAPI automatically generates interactive API documentation:

- **Swagger UI:** http://localhost:8000/api/v1/docs
- **ReDoc:** http://localhost:8000/api/v1/redoc
- **OpenAPI Spec:** http://localhost:8000/api/v1/openapi.json

### Environment Configuration

See `.env.local.example` for all configuration options. Key settings:

```env
# Authentication (disabled by default for development)
AUTH_ENABLED=false

# When enabling authentication (requires Microsoft Entra ID)
OIDC_ISSUER=https://login.microsoftonline.com/common/v2.0
OIDC_AUDIENCE=unna-brain-api
JWT_JWKS_URL=<your-jwks-url>

# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/unna_brain

# Cloud Storage (Cloudflare R2)
R2_ENDPOINT_URL=https://your-account.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<your-access-key>
R2_SECRET_ACCESS_KEY=<your-secret-key>
R2_BUCKET_NAME=unna-brain
```

---

## Authentication

### Overview

Authentication is **disabled by default** in development mode. When enabled, the API uses JWT tokens with Microsoft Entra ID (OIDC).

### Development Mode (Default)

When `AUTH_ENABLED=false`, all requests automatically receive a mock user context:

```json
{
  "sub": "test-user",
  "roles": ["Analyst", "Admin"],
  "email": "test@example.com"
}
```

No authentication header is required for testing.

### Production Mode (AUTH_ENABLED=true)

All requests except `/health` must include a valid JWT token:

```bash
curl -H "Authorization: Bearer <your-jwt-token>" http://localhost:8000/api/v1/reports
```

### Role-Based Access Control

The API enforces role-based access control:

| Role | Permissions |
|------|------------|
| **Admin** | All operations including admin endpoints |
| **Analyst** | Upload files, create/view reports, view dashboard |
| **Viewer** | Read-only access to reports and dashboard (if implemented) |

---

## API Endpoints

### 1. Health Check

Check if the API is running.

**Endpoint:**
```
GET /api/v1/health
```

**Authentication:** Not required

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

**Example:**
```bash
curl http://localhost:8000/api/v1/health
```

---

### 2. Authentication

#### Get Auth Token

Obtain a JWT token for API requests (only needed when AUTH_ENABLED=true).

**Endpoint:**
```
POST /api/v1/auth/token
```

**Authentication:** Not required (exchange credentials for token)

**Request Body:**
```json
{
  "username": "user@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user@example.com",
    "password": "your-password"
  }'
```

---

### 3. File Upload

Upload files for processing and report generation.

**Endpoint:**
```
POST /api/v1/upload
```

**Authentication:** Required (Analyst+ role)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request:**
- `file` (required): File to upload (max 20 MB)
- `description` (optional): File description

**Response:**
```json
{
  "file_id": "abc123def456",
  "filename": "data.xlsx",
  "size_bytes": 102400,
  "uploaded_at": "2024-02-28T10:30:00Z",
  "status": "processing"
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/v1/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@data.xlsx" \
  -F "description=Q4 Financial Data"
```

**Error Response (413 - File Too Large):**
```json
{
  "detail": "File exceeds maximum size of 20 MB"
}
```

---

### 4. Reports

#### List Reports

Retrieve all reports for the authenticated user.

**Endpoint:**
```
GET /api/v1/reports
```

**Authentication:** Required (Analyst+ role)

**Query Parameters:**
- `skip` (optional, default: 0): Number of reports to skip
- `limit` (optional, default: 10): Number of reports to return
- `status` (optional): Filter by status (draft, processing, completed, failed)

**Response:**
```json
{
  "items": [
    {
      "id": "report-123",
      "title": "Q4 Financial Analysis",
      "status": "completed",
      "created_at": "2024-02-28T10:30:00Z",
      "updated_at": "2024-02-28T10:45:00Z",
      "file_count": 3,
      "summary": "Analysis of Q4 financial data"
    },
    {
      "id": "report-124",
      "title": "Budget Forecast",
      "status": "processing",
      "created_at": "2024-02-28T11:00:00Z",
      "updated_at": "2024-02-28T11:05:00Z",
      "file_count": 2,
      "summary": null
    }
  ],
  "total": 42
}
```

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/v1/reports?limit=10&status=completed"
```

#### Create Report

Create a new report from uploaded files.

**Endpoint:**
```
POST /api/v1/reports
```

**Authentication:** Required (Analyst+ role)

**Request Body:**
```json
{
  "title": "Q4 Financial Analysis",
  "description": "Comprehensive analysis of Q4 financial data",
  "file_ids": ["abc123def456", "xyz789uvi012"],
  "analysis_type": "financial"
}
```

**Response:**
```json
{
  "id": "report-123",
  "title": "Q4 Financial Analysis",
  "status": "processing",
  "created_at": "2024-02-28T10:30:00Z",
  "updated_at": "2024-02-28T10:30:00Z",
  "file_count": 2,
  "summary": null
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/v1/reports \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Q4 Financial Analysis",
    "description": "Comprehensive analysis",
    "file_ids": ["abc123def456"],
    "analysis_type": "financial"
  }'
```

#### Get Report Details

Retrieve details of a specific report.

**Endpoint:**
```
GET /api/v1/reports/{report_id}
```

**Authentication:** Required (Analyst+ role)

**Response:**
```json
{
  "id": "report-123",
  "title": "Q4 Financial Analysis",
  "description": "Comprehensive analysis of Q4 financial data",
  "status": "completed",
  "created_at": "2024-02-28T10:30:00Z",
  "updated_at": "2024-02-28T10:45:00Z",
  "file_count": 2,
  "summary": "Key findings: Revenue increased 15% YoY, expenses down 8%",
  "files": [
    {
      "file_id": "abc123def456",
      "filename": "q4_financials.xlsx"
    }
  ]
}
```

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/v1/reports/report-123
```

---

### 5. Dashboard

#### Get Dashboard Data

Retrieve aggregated dashboard data and analytics.

**Endpoint:**
```
GET /api/v1/dashboard
```

**Authentication:** Required (Analyst+ role)

**Query Parameters:**
- `period` (optional, default: "month"): Time period (day, week, month, year, all)
- `report_id` (optional): Filter metrics for specific report

**Response:**
```json
{
  "summary": {
    "total_reports": 42,
    "completed_reports": 38,
    "processing_reports": 2,
    "failed_reports": 2,
    "total_files_processed": 156
  },
  "recent_activity": [
    {
      "id": "activity-001",
      "type": "report_completed",
      "report_id": "report-123",
      "title": "Q4 Financial Analysis",
      "timestamp": "2024-02-28T10:45:00Z"
    }
  ],
  "metrics": {
    "avg_processing_time_seconds": 320,
    "success_rate_percent": 95.2,
    "storage_used_mb": 2048,
    "storage_limit_mb": 5120
  }
}
```

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/v1/dashboard?period=month"
```

---

### 6. Admin Operations

#### Admin Status

Get system health and statistics (Admin only).

**Endpoint:**
```
GET /api/v1/admin/status
```

**Authentication:** Required (Admin role)

**Response:**
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "version": "14.5"
  },
  "storage": {
    "connected": true,
    "total_buckets": 3,
    "storage_used_mb": 2048
  },
  "users": {
    "total": 125,
    "active_today": 48
  }
}
```

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/v1/admin/status
```

#### List Users

Get list of system users (Admin only).

**Endpoint:**
```
GET /api/v1/admin/users
```

**Authentication:** Required (Admin role)

**Query Parameters:**
- `skip` (optional, default: 0): Number of users to skip
- `limit` (optional, default: 20): Number of users to return

**Response:**
```json
{
  "items": [
    {
      "id": "user-001",
      "email": "analyst@example.com",
      "roles": ["Analyst"],
      "created_at": "2024-01-15T08:00:00Z",
      "last_login": "2024-02-28T09:30:00Z"
    },
    {
      "id": "user-002",
      "email": "admin@example.com",
      "roles": ["Admin", "Analyst"],
      "created_at": "2024-01-01T00:00:00Z",
      "last_login": "2024-02-28T10:15:00Z"
    }
  ],
  "total": 125
}
```

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/v1/admin/users?limit=20"
```

---

## Error Handling

The API returns standard HTTP status codes with error details in JSON format.

### Common Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Request completed successfully |
| 201 | Created | Resource created (POST requests) |
| 400 | Bad Request | Invalid request body or parameters |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Authenticated but lacks required role |
| 404 | Not Found | Resource doesn't exist |
| 413 | Payload Too Large | File exceeds size limit |
| 500 | Server Error | Internal server error |

### Error Response Format

```json
{
  "detail": "Detailed error message"
}
```

### Example Error Responses

**Missing Authentication (401):**
```bash
curl http://localhost:8000/api/v1/reports
# Response:
# {
#   "detail": "Missing authorization token"
# }
```

**Insufficient Permissions (403):**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/v1/admin/users
# Response (if not Admin role):
# {
#   "detail": "Insufficient role"
# }
```

**Invalid File Size (413):**
```bash
curl -X POST http://localhost:8000/api/v1/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@huge-file.xlsx"
# Response:
# {
#   "detail": "File exceeds maximum size of 20 MB"
# }
```

---

## Rate Limiting

Rate limiting is currently disabled. When implemented, the API will return:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640707200
```

---

## Pagination

List endpoints support pagination via query parameters:

- `skip` (default: 0): Number of items to skip
- `limit` (default: 10-20): Maximum number of items to return

**Example:**
```bash
# Get items 20-29
curl "http://localhost:8000/api/v1/reports?skip=20&limit=10"
```

---

## Request Examples

### Complete Workflow Example

```bash
# 1. Check health
curl http://localhost:8000/api/v1/health

# 2. Upload a file
FILE_RESPONSE=$(curl -X POST http://localhost:8000/api/v1/upload \
  -F "file=@data.xlsx" \
  -F "description=Q4 Data")
FILE_ID=$(echo $FILE_RESPONSE | jq -r '.file_id')

# 3. Create a report from the file
REPORT_RESPONSE=$(curl -X POST http://localhost:8000/api/v1/reports \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Q4 Analysis\",
    \"description\": \"Analysis of quarterly data\",
    \"file_ids\": [\"$FILE_ID\"],
    \"analysis_type\": \"financial\"
  }")
REPORT_ID=$(echo $REPORT_RESPONSE | jq -r '.id')

# 4. Check report status
curl http://localhost:8000/api/v1/reports/$REPORT_ID

# 5. View dashboard
curl http://localhost:8000/api/v1/dashboard
```

---

## Frontend Integration

See `frontend/api-client.js` for a JavaScript client library that handles:

- Automatic base URL configuration
- Request/response interceptors
- Error handling
- Token management
- Request logging

### Example Usage

```javascript
import { apiClient } from './api-client.js';

// List reports
const reports = await apiClient.get('/reports');

// Upload file
const formData = new FormData();
formData.append('file', fileInput.files[0]);
const uploadResult = await apiClient.post('/upload', formData);

// Create report
const newReport = await apiClient.post('/reports', {
  title: 'My Report',
  file_ids: [uploadResult.file_id],
  analysis_type: 'financial'
});
```

---

## Testing the API

### Using cURL

See examples throughout this documentation and in the workflow example above.

### Using Postman

Import `postman-collection.json` into Postman:

1. Open Postman
2. Click **Import** → **File** → Select `postman-collection.json`
3. The collection includes all endpoints with example requests
4. Set variables: `base_url`, `token` (when needed)

### Using Python

```python
import httpx

client = httpx.AsyncClient(base_url="http://localhost:8000/api/v1")

# Get reports
response = await client.get("/reports")
print(response.json())

# Upload file
with open("data.xlsx", "rb") as f:
    files = {"file": f}
    response = await client.post("/upload", files=files)
    print(response.json())
```

### Running Tests

```bash
# Run all API tests
npm run backend-test

# Or run pytest directly
pytest tests/test_api_endpoints.py -v
```

---

## Security Considerations

### Authentication

- Authentication can be disabled via `AUTH_ENABLED=false` for development
- In production, always use OIDC with Microsoft Entra ID
- Tokens are validated using JWKS endpoints
- Store tokens securely in frontend (httpOnly cookies recommended)

### CORS

CORS is configured to allow requests from:
- `http://localhost:3000` (development)
- Additional origins can be configured via `CORS_ALLOWED_ORIGINS`

### File Uploads

- Maximum file size: 20 MB (configurable)
- Files are stored in Cloudflare R2 with signed URLs
- Signed URLs expire after 15 minutes (configurable)

### Environment Variables

- Never commit `.env.local` to version control
- Use `.env.local.example` as a template
- Always set strong credentials for production databases and storage

---

## Support & Documentation

- **Interactive Docs:** http://localhost:8000/api/v1/docs (Swagger UI)
- **API Spec:** http://localhost:8000/api/v1/openapi.json
- **Setup Guide:** See `BUILD_ENVIRONMENT.md`
- **Contributing:** See `CONTRIBUTING.md`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-02-28 | Initial API release |

---

## Changelog

### v1.0.0 (2024-02-28)

**Initial Release:**
- Health check endpoint
- File upload with validation
- Report CRUD operations
- Dashboard analytics
- Admin operations
- JWT authentication with role-based access control
- Comprehensive API documentation
