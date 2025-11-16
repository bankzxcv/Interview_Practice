"""Tests for Flask server."""

import pytest
from server import app


@pytest.fixture
def client():
    """Create test client."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_home(client):
    """Test home endpoint."""
    response = client.get('/')
    assert response.status_code == 200
    assert b"Hello from Docker" in response.data


def test_health(client):
    """Test health endpoint."""
    response = client.get('/health')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'healthy'


def test_version(client):
    """Test version endpoint."""
    response = client.get('/version')
    assert response.status_code == 200
    assert 'version' in response.get_json()
