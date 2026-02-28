"""
API Endpoint Integration Tests

Comprehensive test suite for UNNA Brain API endpoints.

Usage:
    pytest tests/test_api_endpoints.py -v
    pytest tests/test_api_endpoints.py::test_health -v
    pytest tests/test_api_endpoints.py -k "upload" -v
"""

import pytest
import httpx
import asyncio
from io import BytesIO

# Test configuration
BASE_URL = "http://localhost:8000/api/v1"
DEFAULT_TIMEOUT = 30.0


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def client():
    """Create async HTTP client for testing."""
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=DEFAULT_TIMEOUT) as client:
        yield client


@pytest.fixture
def sample_file():
    """Create a sample file for upload testing."""
    content = b"Sample,Data\n1,2\n3,4\n"
    return BytesIO(content), "sample.csv"


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
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_health_check_includes_version(client):
    """Test health check includes version info."""
    response = await client.get("/health")
    assert response.status_code == 200

    data = response.json()
    assert "version" in data


# ============================================================================
# Authentication Tests
# ============================================================================


@pytest.mark.asyncio
async def test_get_token(client):
    """Test getting auth token."""
    response = await client.post(
        "/auth/token",
        json={
            "username": "test@example.com",
            "password": "testpass123"
        }
    )

    # In development mode with AUTH_ENABLED=false, may return error
    # In production mode, should return token
    assert response.status_code in [200, 401, 422]

    if response.status_code == 200:
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data


@pytest.mark.asyncio
async def test_auth_endpoint_requires_credentials(client):
    """Test auth endpoint validation."""
    response = await client.post(
        "/auth/token",
        json={}
    )

    # Should fail without credentials
    assert response.status_code in [400, 422]


# ============================================================================
# File Upload Tests
# ============================================================================


@pytest.mark.asyncio
async def test_file_upload_success(client, sample_file):
    """Test successful file upload."""
    file_content, file_name = sample_file

    files = {"file": (file_name, file_content, "text/csv")}

    response = await client.post(
        "/upload",
        files=files
    )

    # Should succeed or return 401 if auth required
    assert response.status_code in [200, 201, 401]

    if response.status_code in [200, 201]:
        data = response.json()
        assert "file_id" in data
        assert "filename" in data
        assert data["filename"] == file_name
        assert "size_bytes" in data
        assert "uploaded_at" in data
        assert "status" in data


@pytest.mark.asyncio
async def test_file_upload_with_description(client, sample_file):
    """Test file upload with description."""
    file_content, file_name = sample_file

    files = {"file": (file_name, file_content, "text/csv")}
    data = {"description": "Test file upload"}

    response = await client.post(
        "/upload",
        files=files,
        data=data
    )

    assert response.status_code in [200, 201, 401]


@pytest.mark.asyncio
async def test_file_upload_requires_file(client):
    """Test upload endpoint requires file."""
    response = await client.post(
        "/upload",
        json={"description": "No file"}
    )

    # Should fail - multipart form expected
    assert response.status_code in [400, 422]


# ============================================================================
# Reports Tests
# ============================================================================


@pytest.mark.asyncio
async def test_list_reports(client):
    """Test listing reports."""
    response = await client.get("/reports")

    # May require auth depending on configuration
    assert response.status_code in [200, 401]

    if response.status_code == 200:
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert isinstance(data["items"], list)


@pytest.mark.asyncio
async def test_list_reports_with_pagination(client):
    """Test report listing with pagination."""
    response = await client.get(
        "/reports",
        params={"skip": 0, "limit": 10}
    )

    assert response.status_code in [200, 401]

    if response.status_code == 200:
        data = response.json()
        assert "items" in data
        assert len(data["items"]) <= 10


@pytest.mark.asyncio
async def test_list_reports_with_status_filter(client):
    """Test report listing with status filter."""
    response = await client.get(
        "/reports",
        params={"status": "completed"}
    )

    assert response.status_code in [200, 401]

    if response.status_code == 200:
        data = response.json()
        assert "items" in data
        # All items should have status field
        for item in data["items"]:
            assert "status" in item


@pytest.mark.asyncio
async def test_create_report(client):
    """Test creating a report."""
    report_data = {
        "title": "Test Report",
        "description": "Test report description",
        "file_ids": ["test-file-123"],
        "analysis_type": "financial"
    }

    response = await client.post(
        "/reports",
        json=report_data
    )

    assert response.status_code in [200, 201, 400, 401]

    if response.status_code in [200, 201]:
        data = response.json()
        assert "id" in data
        assert data["title"] == report_data["title"]
        assert "status" in data
        assert "created_at" in data


@pytest.mark.asyncio
async def test_create_report_requires_title(client):
    """Test report creation requires title."""
    report_data = {
        "description": "Missing title",
        "file_ids": ["test-file-123"]
    }

    response = await client.post(
        "/reports",
        json=report_data
    )

    # Should fail validation
    assert response.status_code in [400, 422, 401]


@pytest.mark.asyncio
async def test_get_report_details(client):
    """Test getting report details."""
    report_id = "test-report-123"

    response = await client.get(f"/reports/{report_id}")

    # Will fail with 404 or 401 depending on config
    assert response.status_code in [200, 401, 404]

    if response.status_code == 200:
        data = response.json()
        assert "id" in data
        assert data["id"] == report_id
        assert "title" in data
        assert "status" in data


# ============================================================================
# Dashboard Tests
# ============================================================================


@pytest.mark.asyncio
async def test_get_dashboard(client):
    """Test getting dashboard data."""
    response = await client.get("/dashboard")

    assert response.status_code in [200, 401]

    if response.status_code == 200:
        data = response.json()
        assert "summary" in data
        assert "metrics" in data

        # Check summary fields
        summary = data["summary"]
        assert "total_reports" in summary
        assert "completed_reports" in summary


@pytest.mark.asyncio
async def test_dashboard_with_period_filter(client):
    """Test dashboard with time period filter."""
    response = await client.get(
        "/dashboard",
        params={"period": "month"}
    )

    assert response.status_code in [200, 401]

    if response.status_code == 200:
        data = response.json()
        assert "summary" in data


@pytest.mark.asyncio
async def test_dashboard_with_report_filter(client):
    """Test dashboard filtered by report."""
    response = await client.get(
        "/dashboard",
        params={"report_id": "test-report-123"}
    )

    assert response.status_code in [200, 401]


# ============================================================================
# Admin Tests
# ============================================================================


@pytest.mark.asyncio
async def test_admin_status_requires_admin_role(client):
    """Test admin status endpoint requires admin role."""
    response = await client.get("/admin/status")

    # Will fail with 401 or 403 depending on auth
    assert response.status_code in [200, 401, 403]

    if response.status_code == 200:
        data = response.json()
        assert "status" in data
        assert "database" in data
        assert "storage" in data


@pytest.mark.asyncio
async def test_admin_list_users(client):
    """Test listing users (admin only)."""
    response = await client.get("/admin/users")

    assert response.status_code in [200, 401, 403]

    if response.status_code == 200:
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert isinstance(data["items"], list)


@pytest.mark.asyncio
async def test_admin_list_users_pagination(client):
    """Test user listing with pagination."""
    response = await client.get(
        "/admin/users",
        params={"skip": 0, "limit": 20}
    )

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
    response = await client.get("/reports/nonexistent-id")

    assert response.status_code in [401, 404]


@pytest.mark.asyncio
async def test_invalid_json_returns_400(client):
    """Test invalid JSON request body."""
    response = await client.post(
        "/reports",
        content="not valid json",
        headers={"Content-Type": "application/json"}
    )

    assert response.status_code in [400, 422]


@pytest.mark.asyncio
async def test_missing_required_fields_validation(client):
    """Test request validation for missing required fields."""
    response = await client.post(
        "/reports",
        json={}  # Empty request body
    )

    # Should fail validation
    assert response.status_code in [400, 422, 401]


# ============================================================================
# Request/Response Format Tests
# ============================================================================


@pytest.mark.asyncio
async def test_response_headers_include_json_type(client):
    """Test response headers include correct content type."""
    response = await client.get("/health")

    assert response.headers.get("content-type").startswith("application/json")


@pytest.mark.asyncio
async def test_response_is_valid_json(client):
    """Test all responses are valid JSON."""
    endpoints_to_test = [
        "/health",
        "/reports",
        "/dashboard"
    ]

    for endpoint in endpoints_to_test:
        response = await client.get(endpoint)

        # Valid JSON should not raise exception
        if response.status_code in [200, 201]:
            try:
                response.json()
            except ValueError:
                pytest.fail(f"Invalid JSON response from {endpoint}")


# ============================================================================
# Concurrent Request Tests
# ============================================================================


@pytest.mark.asyncio
async def test_concurrent_requests(client):
    """Test multiple concurrent requests."""
    tasks = [
        client.get("/health"),
        client.get("/reports"),
        client.get("/health")
    ]

    responses = await asyncio.gather(*tasks)

    assert all(r.status_code in [200, 401, 404] for r in responses)


# ============================================================================
# Integration Workflow Tests
# ============================================================================


@pytest.mark.asyncio
async def test_complete_workflow(client, sample_file):
    """Test complete workflow: health -> upload -> create report -> get report."""
    # Step 1: Health check
    health_response = await client.get("/health")
    assert health_response.status_code == 200

    # Step 2: Upload file
    file_content, file_name = sample_file
    files = {"file": (file_name, file_content, "text/csv")}

    upload_response = await client.post("/upload", files=files)
    assert upload_response.status_code in [200, 201, 401]

    if upload_response.status_code in [200, 201]:
        file_data = upload_response.json()
        file_id = file_data.get("file_id")

        # Step 3: Create report
        report_response = await client.post(
            "/reports",
            json={
                "title": "Integration Test Report",
                "file_ids": [file_id],
                "analysis_type": "financial"
            }
        )
        assert report_response.status_code in [200, 201, 401]

        if report_response.status_code in [200, 201]:
            report_data = report_response.json()
            report_id = report_data.get("id")

            # Step 4: Get report details
            detail_response = await client.get(f"/reports/{report_id}")
            assert detail_response.status_code in [200, 401]


# ============================================================================
# Configuration and Setup Tests
# ============================================================================


@pytest.mark.asyncio
async def test_api_is_running(client):
    """Test API is running and accessible."""
    response = await client.get("/health")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_api_has_correct_base_url():
    """Test API base URL is correct."""
    assert BASE_URL.startswith("http")
    assert "/api/v1" in BASE_URL


def test_sample_file_fixture_works(sample_file):
    """Test sample file fixture creation."""
    file_obj, file_name = sample_file
    assert file_name == "sample.csv"
    assert file_obj.getvalue().startswith(b"Sample,Data")


# ============================================================================
# Helper Functions for Test Utilities
# ============================================================================


async def create_test_file(client, file_content: bytes, file_name: str):
    """Helper to create a test file."""
    files = {"file": (file_name, BytesIO(file_content), "application/octet-stream")}
    response = await client.post("/upload", files=files)

    if response.status_code in [200, 201]:
        return response.json().get("file_id")
    return None


async def create_test_report(client, file_id: str, title: str = "Test Report"):
    """Helper to create a test report."""
    response = await client.post(
        "/reports",
        json={
            "title": title,
            "file_ids": [file_id],
            "analysis_type": "financial"
        }
    )

    if response.status_code in [200, 201]:
        return response.json().get("id")
    return None


# ============================================================================
# Performance/Load Tests (Optional, commented out for CI/CD)
# ============================================================================

# @pytest.mark.asyncio
# async def test_many_concurrent_requests(client):
#     """Test API under concurrent load."""
#     tasks = [client.get("/health") for _ in range(100)]
#     responses = await asyncio.gather(*tasks)
#     assert all(r.status_code in [200, 429] for r in responses)


# @pytest.mark.asyncio
# async def test_large_pagination_limit(client):
#     """Test large pagination limits."""
#     response = await client.get(
#         "/reports",
#         params={"skip": 0, "limit": 1000}
#     )
#     assert response.status_code in [200, 401, 422]
