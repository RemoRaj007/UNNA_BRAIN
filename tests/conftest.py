"""
Pytest configuration and shared fixtures for UNNA Brain API tests.
"""
import asyncio
import os
from typing import AsyncGenerator, Generator
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.auth.dependencies import get_current_user
from app.core.database import get_db_session
from app.main import app
from app.schemas.auth import CurrentUser


@pytest.fixture(scope='session')
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for each test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def test_user() -> CurrentUser:
    """Return a test user with all roles."""
    return CurrentUser(
        sub=f'tester-{uuid4()}',
        roles=['Admin', 'Analyst', 'Viewer'],
        email='test@example.com',
        name='Test User',
    )


@pytest.fixture
def admin_user() -> CurrentUser:
    """Return a test user with admin role only."""
    return CurrentUser(
        sub=f'admin-{uuid4()}',
        roles=['Admin'],
        email='admin@example.com',
        name='Admin User',
    )


@pytest.fixture
def analyst_user() -> CurrentUser:
    """Return a test user with analyst role only."""
    return CurrentUser(
        sub=f'analyst-{uuid4()}',
        roles=['Analyst'],
        email='analyst@example.com',
        name='Analyst User',
    )


@pytest.fixture
def viewer_user() -> CurrentUser:
    """Return a test user with viewer role only."""
    return CurrentUser(
        sub=f'viewer-{uuid4()}',
        roles=['Viewer'],
        email='viewer@example.com',
        name='Viewer User',
    )


@pytest.fixture
def override_current_user(test_user: CurrentUser):
    """Override the get_current_user dependency with a test user."""
    async def _override() -> CurrentUser:
        return test_user
    
    app.dependency_overrides[get_current_user] = _override
    yield test_user
    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture
def test_db_engine() -> AsyncGenerator:
    """Create an in-memory SQLite database for testing."""
    engine = create_async_engine(
        'sqlite+aiosqlite:///:memory:',
        connect_args={'check_same_thread': False},
        poolclass=StaticPool,
    )
    yield engine
    asyncio.get_event_loop().run_until_complete(engine.dispose())


@pytest.fixture
async def test_db_session(test_db_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    async_session_factory = async_sessionmaker(
        bind=test_db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    async with async_session_factory() as session:
        yield session


@pytest.fixture
def override_db_session(test_db_session: AsyncSession):
    """Override the get_db_session dependency with a test session."""
    async def _override() -> AsyncGenerator[AsyncSession, None]:
        yield test_db_session
    
    app.dependency_overrides[get_db_session] = _override
    yield test_db_session
    app.dependency_overrides.pop(get_db_session, None)


@pytest.fixture
def client(override_current_user, override_db_session) -> Generator[TestClient, None, None]:
    """Create a test client with overridden dependencies."""
    with TestClient(app, raise_server_exceptions=True) as test_client:
        yield test_client


@pytest.fixture
async def async_client(override_current_user, override_db_session) -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client with overridden dependencies."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url='http://test',
    ) as ac:
        yield ac


@pytest.fixture(autouse=True)
def configure_test_environment():
    """Configure environment variables for testing."""
    os.environ['APP_ENV'] = 'testing'
    os.environ['APP_DEBUG'] = 'True'
    os.environ['AUTH_ENABLED'] = 'False'
    os.environ['DATABASE_URL'] = 'sqlite+aiosqlite:///:memory:'
    os.environ['R2_ENDPOINT_URL'] = 'https://test.r2.cloudflarestorage.com'
    os.environ['R2_ACCESS_KEY_ID'] = 'test_access_key'
    os.environ['R2_SECRET_ACCESS_KEY'] = 'test_secret_key'
    os.environ['R2_BUCKET_NAME'] = 'test-bucket'
    
    # Clear any cached settings
    from app.core.config import get_settings
    get_settings.cache_clear()
    
    yield
    
    # Cleanup
    app.dependency_overrides.clear()
    get_settings.cache_clear()


@pytest.fixture
def sample_csv_data() -> bytes:
    """Return sample CSV data for testing."""
    return b'''Date,Post text,Link,Impressions,Reactions,Comments,Shares
2024-01-01,Test post 1,https://example.com/post1,1000,50,10,5
2024-01-02,Test post 2,https://example.com/post2,1500,75,15,8
2024-01-03,Test post 3,https://example.com/post3,2000,100,20,12
'''


@pytest.fixture
def sample_excel_file(tmp_path) -> str:
    """Create a temporary Excel file with sample data."""
    import pandas as pd
    
    df = pd.DataFrame({
        'Date': ['2024-01-01', '2024-01-02', '2024-01-03'],
        'Post text': ['Post 1', 'Post 2', 'Post 3'],
        'Link': ['https://example.com/1', 'https://example.com/2', 'https://example.com/3'],
        'Impressions': [1000, 1500, 2000],
        'Reactions': [50, 75, 100],
        'Comments': [10, 15, 20],
        'Shares': [5, 8, 12],
    })
    
    file_path = tmp_path / 'sample.xlsx'
    df.to_excel(file_path, index=False)
    return str(file_path)
