import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock
from main import app

client = TestClient(app)

@pytest.fixture
def mock_firestore(mocker):
    mock = MagicMock()
    mocker.patch("main.firestore_service", mock)
    return mock

def test_get_incident_status_found(mock_firestore):
    # Setup: Incident exists in Firestore (not approved)
    mock_firestore.get_incident.return_value = {
        "status": "pending",
        "last_update": "2023-10-27T10:00:00Z",
        "summary": "Waiting for user response",
        "approved": False
    }
    
    response = client.get("/api/v1/incident-status/+1234567890")
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "pending"
    assert data["approved"] is False

def test_get_incident_status_approved(mock_firestore):
    # Setup: Incident exists and is approved
    mock_firestore.get_incident.return_value = {
        "status": "resolved",
        "last_update": "2023-10-27T10:05:00Z",
        "summary": "User confirmed identity",
        "approved": True
    }
    
    response = client.get("/api/v1/incident-status/+1234567890")
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "resolved"
    assert data["approved"] is True

def test_get_incident_status_no_approved_field(mock_firestore):
    # Setup: Incident exists but missing 'approved' field (legacy data)
    mock_firestore.get_incident.return_value = {
        "status": "pending",
        "last_update": "2023-10-27T10:00:00Z",
        "summary": "Legacy incident"
    }
    
    response = client.get("/api/v1/incident-status/+1234567890")
    
    assert response.status_code == 200
    data = response.json()
    assert "approved" not in data or data["approved"] is None # Current impl returns whatever Firestore has

def test_get_incident_status_not_found(mock_firestore):
    # Setup: Incident does not exist
    mock_firestore.get_incident.return_value = None
    
    response = client.get("/api/v1/incident-status/+1234567890")
    
    assert response.status_code == 404
    assert response.json() == {"detail": "Incident not found"}
