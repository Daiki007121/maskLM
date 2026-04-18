"""Test fixtures for backend API tests."""

import pytest
from httpx import ASGITransport, AsyncClient

from backend.app.main import app


@pytest.fixture
def client():
    """Synchronous test client for the FastAPI app."""
    from starlette.testclient import TestClient

    return TestClient(app)
