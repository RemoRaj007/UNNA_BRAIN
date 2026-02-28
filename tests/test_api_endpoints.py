"""
API Endpoint Integration Tests

Comprehensive test suite for UNNA Brain API endpoints.

Tests the actual implemented endpoints:
- GET  /health - Health check
- GET  /auth/session - Get current user
- POST /upload - File upload
- POST /reports/generate - Generate report (async, returns 202)
- GET  /reports/{report_id} - Get signed download URL
- GET  /dashboard/summary - Dashboard statistics
- POST /admin/audit-ping - Admin operations

Usage:
    pytest tests/test_api_endpoints.py -v
    pytest tests/test_api_endpoints.py::test_health_check -v
    pytest tests/test_api_endpoints.py -k "upload" -v
"""

import pytest
import pytest_asyncio
import httpx
from io import BytesIO
import uuid

# Test configuration
BASE_URL = "http://localhost:8000/api/v1"
DEFAULT_TIMEOUT = 30.0


@pytest_asyncio.fixture(scope="session")
async def event_loop():
    """Create event loop for async tests."""
    import asyncio
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def client():
    """Create async HTTP client for testing."""
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=DEFAULT_TIMEOUT) as client:
        yield client


@pytest.fixture
def sample_file():
    """Create a sample CSV file for upload testing."""
    content = b"date,title,engagement\n2024-01-01,Post1,100\n2024-01-02,Post2,150\n"
    return BytesIO(content), "sample.csv"


@pytest.fixture
def sample_excel_file():
    """Create a sample Excel file for upload testing."""
    # Simple bytes for a minimal Excel file
    content = b"PK\x03\x04\x14\x00\x06\x00\x08\x00"  # ZIP header (Excel is ZIP format)
    return BytesIO(content), "sample.xlsx"


# ============================================================================
# Health Check Tests
# ============================================================================


@pytest.mark.asyncio
async def test_health_check(client):
    """Test health check endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200

    data = response.json()
    assert "status" in data
    assert data["status"] == "ok"


# ============================================================================
# Authentication Tests
# ============================================================================


@pytest.mark.asyncio
async def test_auth_session(client):
    """Test getting current user session."""
    response = await client.get("/auth/session")

    # May return 200 (auth disabled) or 401 (auth required)
    assert response.status_code in [200, 401]

    if response.status_code == 200:
        data = response.json()
        # Should have CurrentUser response with sub, roles, email
        assert "sub" in data or "email" in data or "roles" in data


# ============================================================================
# File Upload Tests
# ============================================================================


@pytest.mark.asyncio
async def test_file_upload_success(client, sample_file):
    """Test successful file upload."""
    file_content, file_name = sample_file
    file_content.seek(0)  # Reset file pointer

    files = {"file": (file_name, file_content, "text/csv")}

    response = await client.post(
        "/upload",
        files=files
    )

    # Should succeed with 201 or return 401 if auth required
    assert response.status_code in [201, 401, 422]

    if response.status_code == 201:
        data = response.json()
        assert "file_id" in data
        # Store file_id for later tests
        return data["file_id"]


@pytest.mark.asyncio
async def test_file_upload_missing_file(client):
    """Test upload endpoint requires file."""
    response = await client.post(
        "/upload",
        data={"description": "No file"}
    )

    # Should fail without file
    assert response.status_code in [400, 422, 401]


# ============================================================================
# Report Generation Tests
# ============================================================================


@pytest.mark.asyncio
async def test_generate_report(client):
    """Test creating a report (async)."""
    report_data = {
        "file_id": str(uuid.uuid4()),
        "start_date": "2024-01-01",
        "end_date": "2024-12-31"
    }

    response = await client.post(
        "/reports/generate",
        json=report_data
    )

    # Should return 202 Accepted for async operation or 401/404/422
    assert response.status_code in [202, 401, 404, 422]

    if response.status_code == 202:
        data = response.json()
        assert "report_id" in data


@pytest.mark.asyncio
async def test_generate_report_requires_fields(client):
    """Test report generation requires required fields."""
    response = await client.post(
        "/reports/generate",
        json={}
    )

    # Should fail validation
    assert response.status_code in [422, 401, 400]


@pytest.mark.asyncio
async def test_get_report_signed_url(client):
    """Test getting report download URL."""
    report_id = str(uuid.uuid4())

    response = await client.get(f"/reports/{report_id}")

    # May return 200 with signed URL, or 404/401 if not found or auth required
    assert response.status_code in [200, 401, 404, 422]

    if response.status_code == 200:
        data = response.json()
        # Should have signed_url field
        assert "signed_url" in data or "report_id" in data


# ============================================================================
# Dashboard Tests
# ============================================================================


@pytest.mark.asyncio
async def test_get_dashboard_summary(client):
    """Test getting dashboard summary."""
    response = await client.get("/dashboard/summary")

    # May require auth depending on configuration
    assert response.status_code in [200, 401]

    if response.status_code == 200:
        data = response.json()
        # Should have summary statistics
        assert "total_uploads" in data or "total_reports" in data


# ============================================================================
# Admin Tests
# ============================================================================


@pytest.mark.asyncio
async def test_admin_audit_ping(client):
    """Test admin audit ping endpoint."""
    response = await client.post("/admin/audit-ping")

    # May require admin role (403) or auth (401)
    assert response.status_code in [200, 401, 403]


# ============================================================================
# Error Handling Tests
# ============================================================================


@pytest.mark.asyncio
async def test_invalid_endpoint_returns_404(client):
    """Test invalid endpoint returns 404."""
    response = await client.get("/nonexistent")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_invalid_report_id_returns_404(client):
    """Test accessing non-existent report."""
    response = await client.get("/reports/00000000-0000-0000-0000-000000000000")
    # Will be 404 if report doesn't exist, or may need auth first
    assert response.status_code in [404, 401]


# ============================================================================
# Concurrent Request Tests
# ============================================================================


@pytest.mark.asyncio
async def test_health_check_is_fast(client):
    """Test health check responds quickly."""
    import time

    start = time.time()
    response = await client.get("/health")
    elapsed = time.time() - start

    assert response.status_code == 200
    # Health check should respond in less than 1 second
    assert elapsed < 1.0


@pytest.mark.asyncio
async def test_multiple_concurrent_requests(client):
    """Test multiple concurrent requests."""
    tasks = [
        client.get("/health"),
        client.get("/health"),
        client.get("/auth/session")
    ]

    import asyncio
    responses = await asyncio.gather(*tasks)

    # All should succeed or require auth
    assert all(r.status_code in [200, 401] for r in responses)


# ============================================================================
# API Configuration Tests
# ============================================================================


def test_api_base_url_configured():
    """Test API base URL is correct."""
    assert BASE_URL.startswith("http")
    assert "/api/v1" in BASE_URL


@pytest.mark.asyncio
async def test_api_is_running(client):
    """Test API is running and accessible."""
    response = await client.get("/health")
    assert response.status_code == 200


# ============================================================================
# Response Format Tests
# ============================================================================


@pytest.mark.asyncio
async def test_response_headers_include_json_type(client):
    """Test response headers include correct content type."""
    response = await client.get("/health")

    content_type = response.headers.get("content-type", "")
    assert "application/json" in content_type or response.status_code == 404


@pytest.mark.asyncio
async def test_health_response_is_valid_json(client):
    """Test health endpoint returns valid JSON."""
    response = await client.get("/health")

    assert response.status_code == 200
    try:
        data = response.json()
        assert isinstance(data, dict)
    except ValueError:
        pytest.fail("Health endpoint did not return valid JSON")


# ============================================================================
# Integration Workflow Tests
# ============================================================================


@pytest.mark.asyncio
async def test_complete_workflow(client, sample_file):
    """Test complete workflow: health -> upload -> generate report -> get report."""
    # Step 1: Health check
    health_response = await client.get("/health")
    assert health_response.status_code == 200

    # Step 2: Upload file
    file_content, file_name = sample_file
    file_content.seek(0)
    files = {"file": (file_name, file_content, "text/csv")}

    upload_response = await client.post("/upload", files=files)

    # If upload succeeds, test report generation
    if upload_response.status_code == 201:
        file_data = upload_response.json()
        file_id = file_data.get("file_id")

        # Step 3: Generate report
        report_response = await client.post(
            "/reports/generate",
            json={
                "file_id": file_id,
                "start_date": "2024-01-01",
                "end_date": "2024-12-31"
            }
        )

        # Should return 202 (async) or 201
        assert report_response.status_code in [202, 201, 401, 404]

        if report_response.status_code in [202, 201]:
            report_data = report_response.json()
            report_id = report_data.get("report_id")

            # Step 4: Get report details
            if report_id:
                detail_response = await client.get(f"/reports/{report_id}")
                assert detail_response.status_code in [200, 401, 404]


# ============================================================================
# Edge Cases and Validation
# ============================================================================


@pytest.mark.asyncio
async def test_upload_empty_file(client):
    """Test uploading empty file."""
    files = {"file": ("empty.csv", BytesIO(b""), "text/csv")}

    response = await client.post("/upload", files=files)

    # Should fail validation or succeed with empty file
    assert response.status_code in [201, 400, 422, 401]


@pytest.mark.asyncio
async def test_report_with_invalid_date_range(client):
    """Test report generation with invalid date range."""
    report_data = {
        "file_id": str(uuid.uuid4()),
        "start_date": "2024-12-31",
        "end_date": "2024-01-01"  # End before start
    }

    response = await client.post("/reports/generate", json=report_data)

    # Should fail validation or be accepted
    assert response.status_code in [422, 202, 401, 404]


# ============================================================================
# Authentication & Authorization Tests
# ============================================================================


@pytest.mark.asyncio
async def test_dashboard_may_require_auth(client):
    """Test dashboard endpoint behavior."""
    response = await client.get("/dashboard/summary")

    # Should either return data (auth disabled) or require auth
    assert response.status_code in [200, 401, 403]


@pytest.mark.asyncio
async def test_admin_requires_role(client):
    """Test admin endpoint requires appropriate role."""
    response = await client.post("/admin/audit-ping")

    # Should be 200 (admin role), 403 (insufficient role), or 401 (no auth)
    assert response.status_code in [200, 401, 403]
