from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.auth.dependencies import get_current_user
from app.core.database import get_db_session
from app.main import app
from app.schemas.auth import CurrentUser


class DummySession:  # noqa: D101
    pass


async def override_user():
    return CurrentUser(sub='tester', roles=['Admin', 'Analyst', 'Viewer'], email='t@example.com')


async def override_db():
    yield DummySession()


@pytest.fixture(autouse=True)
def setup_test_dependencies(monkeypatch):
    """Setup test dependencies for integration flow tests."""
    app.dependency_overrides[get_current_user] = override_user
    app.dependency_overrides[get_db_session] = override_db

    async def fake_handle_upload(db, r2, filename, content_type, file_bytes, user_id):
        return SimpleNamespace(id=uuid4())

    async def fake_create_report_request(db, file_id, user_id):
        return SimpleNamespace(id=uuid4())

    monkeypatch.setattr('app.api.routes.upload.handle_upload', fake_handle_upload)
    monkeypatch.setattr('app.api.routes.reports.create_report_request', fake_create_report_request)
    
    async def fake_generate_report_background(*args, **kwargs):
        return None

    monkeypatch.setattr('app.api.routes.reports.generate_report_background', fake_generate_report_background)

    yield

    app.dependency_overrides.clear()


def test_upload_and_generate_report_flow(setup_test_dependencies):
    """Test the complete upload and report generation flow."""
    client = TestClient(app, raise_server_exceptions=True)

    file_payload = (
        'sample.csv',
        b'Date,Post text,Link,Impressions,Reactions,Comments,Shares\n2026-01-01,test,https://x,1,1,1,1',
        'text/csv',
    )
    upload_resp = client.post('/api/v1/upload', files={'file': file_payload})
    assert upload_resp.status_code == 201, f"Upload failed: {upload_resp.text}"

    file_id = upload_resp.json()['file_id']
    report_resp = client.post(
        '/api/v1/reports/generate',
        json={'file_id': file_id, 'start_date': '2026-01-01', 'end_date': '2026-01-31'},
    )
    assert report_resp.status_code == 202, f"Report generation failed: {report_resp.text}"
