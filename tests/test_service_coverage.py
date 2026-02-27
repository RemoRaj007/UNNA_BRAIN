from __future__ import annotations

from io import BytesIO
from types import SimpleNamespace
from uuid import uuid4

import pandas as pd
import pytest

from app.models.enums import ReportStatus
from app.services import audit_service, r2_service, report_service, upload_service


class FakeDB:
    def __init__(self):
        self.added = []
        self.commits = 0
        self.refreshed = []
        self.get_map = {}
        self.scalar_values = []

    def add(self, obj):
        self.added.append(obj)

    async def commit(self):
        self.commits += 1

    async def refresh(self, obj):
        self.refreshed.append(obj)

    async def get(self, model, key):
        return self.get_map.get((model, key))

    async def scalar(self, _query):
        return self.scalar_values.pop(0)


class FakeR2:
    def __init__(self, data: bytes = b""):
        self.data = data
        self.put_calls: list[tuple[str, str, int]] = []

    async def put_object(self, key: str, content: bytes, content_type: str):
        self.put_calls.append((key, content_type, len(content)))

    async def get_object(self, key: str) -> bytes:
        return self.data


@pytest.mark.asyncio
async def test_create_audit_log_commits():
    db = FakeDB()
    await audit_service.create_audit_log(db, action="UPLOAD", user_id="u1", resource_id="r1", payload={"x": 1})
    assert db.commits == 1
    assert len(db.added) == 1


@pytest.mark.asyncio
async def test_upload_service_success(monkeypatch):
    db = FakeDB()
    r2 = FakeR2()

    df = pd.DataFrame(
        {
            "Date": ["2026-01-01"],
            "Post text": ["x"],
            "Link": ["https://example.com"],
            "Impressions": [1],
            "Reactions": [1],
            "Comments": [1],
            "Shares": [1],
        }
    )

    monkeypatch.setattr(upload_service, "read_tabular_file", lambda *_args, **_kwargs: df)
    monkeypatch.setattr(upload_service, "validate_schema", lambda _df: {"rows": 1, "columns": list(df.columns)})

    created_audits = []

    async def fake_audit(*_args, **kwargs):
        created_audits.append(kwargs)

    monkeypatch.setattr(upload_service, "create_audit_log", fake_audit)

    saved = await upload_service.handle_upload(
        db,
        r2,
        filename="sample.csv",
        content_type="text/csv",
        file_bytes=b"a,b\n1,2",
        user_id="user-1",
    )

    assert saved.uploaded_by == "user-1"
    assert db.commits == 1
    assert len(r2.put_calls) == 1
    assert created_audits and created_audits[0]["action"] == "UPLOAD"


@pytest.mark.asyncio
async def test_create_get_and_summary_report_service():
    db = FakeDB()
    file_id = uuid4()

    report = await report_service.create_report_request(db, file_id=file_id, user_id="u1")
    assert report.file_id == file_id
    assert db.commits == 1

    rid = uuid4()
    marker = object()
    db.get_map[(report_service.Report, rid)] = marker
    got = await report_service.get_report(db, rid)
    assert got is marker

    db.scalar_values = [3, 5, 4, 1]
    stats = await report_service.summary_stats(db)
    assert stats == {
        "total_uploads": 3,
        "total_reports": 5,
        "completed_reports": 4,
        "failed_reports": 1,
    }


@pytest.mark.asyncio
async def test_generate_report_background_success(monkeypatch):
    df = pd.DataFrame(
        {
            "Date": ["2026-01-01", "2026-01-02"],
            "Post text": ["a", "b"],
            "Reactions": [1, 2],
            "Comments": [1, 1],
            "Shares": [0, 1],
        }
    )
    excel = BytesIO()
    df.to_excel(excel, index=False)

    db = FakeDB()
    report_id = uuid4()
    file_id = uuid4()
    report = SimpleNamespace(id=report_id, status=ReportStatus.PENDING.value, output_r2_key=None)
    file_asset = SimpleNamespace(id=file_id, r2_key="uploads/a.xlsx", original_filename="a.xlsx")
    db.get_map[(report_service.Report, report_id)] = report
    db.get_map[(report_service.FileAsset, file_id)] = file_asset

    r2 = FakeR2(excel.getvalue())
    audits = []

    async def fake_audit(*_args, **kwargs):
        audits.append(kwargs)

    monkeypatch.setattr(report_service, "create_audit_log", fake_audit)

    await report_service.generate_report_background(
        db,
        r2,
        report_id=report_id,
        file_id=file_id,
        user_id="u1",
        start_date="2026-01-01",
        end_date="2026-01-31",
    )

    assert report.status == ReportStatus.COMPLETED.value
    assert report.output_r2_key.endswith("report.xlsx")
    assert len(r2.put_calls) == 2
    assert audits and audits[0]["action"] == "REPORT_GENERATE"


@pytest.mark.asyncio
async def test_generate_report_background_failure(monkeypatch):
    db = FakeDB()
    report_id = uuid4()
    file_id = uuid4()
    report = SimpleNamespace(id=report_id, status=ReportStatus.PENDING.value, output_r2_key=None)
    file_asset = SimpleNamespace(id=file_id, r2_key="uploads/a.csv", original_filename="a.csv")
    db.get_map[(report_service.Report, report_id)] = report
    db.get_map[(report_service.FileAsset, file_id)] = file_asset

    class FailingR2(FakeR2):
        async def get_object(self, key: str) -> bytes:
            raise RuntimeError("boom")

    audits = []

    async def fake_audit(*_args, **kwargs):
        audits.append(kwargs)

    monkeypatch.setattr(report_service, "create_audit_log", fake_audit)

    await report_service.generate_report_background(
        db,
        FailingR2(),
        report_id=report_id,
        file_id=file_id,
        user_id="u2",
        start_date="2026-01-01",
        end_date="2026-01-31",
    )

    assert report.status == ReportStatus.FAILED.value
    assert audits and audits[0]["action"] == "REPORT_FAILED"


@pytest.mark.asyncio
async def test_r2_service_methods(monkeypatch):
    calls = {}

    class FakeBody:
        async def read(self):
            return b"bytes"

    class FakeClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def put_object(self, **kwargs):
            calls["put"] = kwargs

        async def get_object(self, **kwargs):
            calls["get"] = kwargs
            return {"Body": FakeBody()}

        async def generate_presigned_url(self, **kwargs):
            calls["signed"] = kwargs
            return "https://signed"

    class FakeSession:
        def client(self, *_args, **_kwargs):
            return FakeClient()

    monkeypatch.setattr(r2_service.aioboto3, "Session", lambda **_kwargs: FakeSession())

    svc = r2_service.R2Service()
    await svc.put_object("k", b"c", "text/plain")
    payload = await svc.get_object("k")
    url = await svc.get_signed_url("k")

    assert payload == b"bytes"
    assert url == "https://signed"
    assert calls["put"]["Key"] == "k"
    assert calls["get"]["Key"] == "k"
