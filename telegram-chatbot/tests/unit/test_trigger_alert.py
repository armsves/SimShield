import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock
from main import app

client = TestClient(app)

@pytest.fixture
def mock_firestore(mocker):
    mock = MagicMock()
    mocker.patch("main.firestore_service", mock)
    return mock

@pytest.fixture
def mock_bot(mocker):
    mock = AsyncMock()
    mocker.patch("main.application.bot", mock)
    return mock

def test_trigger_alert_user_found(mock_firestore, mock_bot):
    # Setup: User exists in Firestore
    mock_firestore.get_user_by_phone.return_value = {"telegram_id": 123456789, "phone_number": "+1234567890"}
    
    payload = {
        "phone_number": "+1234567890",
        "alert_type": "SIM_SWAP_DETECTED",
        "severity": "high"
    }
    
    response = client.post("/api/v1/trigger-alert", json=payload)
    
    assert response.status_code == 202
    mock_firestore.create_incident.assert_called_once_with("+1234567890", "SIM_SWAP_DETECTED", "high")
    mock_bot.send_message.assert_called_once()

def test_trigger_alert_user_not_found(mock_firestore):
    # Setup: User does not exist in Firestore
    mock_firestore.get_user_by_phone.return_value = None
    
    payload = {
        "phone_number": "+1111111111",
        "alert_type": "SIM_SWAP_DETECTED",
        "severity": "high"
    }
    
    response = client.post("/api/v1/trigger-alert", json=payload)
    
    assert response.status_code == 404
    assert response.json() == {"detail": "User not found"}
    mock_firestore.create_incident.assert_not_called()
