import pytest
from unittest.mock import MagicMock
from services.firestore_service import FirestoreService

def test_save_and_get_user(mocker):
    # Mock the Firestore client
    mock_db = MagicMock()
    mocker.patch("google.cloud.firestore.Client", return_value=mock_db)
    
    service = FirestoreService()
    phone = "+1234567890"
    telegram_id = 123456789
    
    # Mock the collection/document structure
    mock_doc = MagicMock()
    mock_db.collection.return_value.document.return_value = mock_doc
    
    # Mock retrieval
    mock_doc.get.return_value.to_dict.return_value = {"telegram_id": telegram_id, "phone_number": phone}
    mock_doc.get.return_value.exists = True

    # Act
    service.save_user(phone, telegram_id)
    user = service.get_user_by_phone(phone)
    
    # Assert
    assert user["telegram_id"] == telegram_id
    mock_db.collection.return_value.document.assert_called_with(phone)
    mock_doc.set.assert_called_once()

def test_incident_lifecycle(mocker):
    # Mock the Firestore client
    mock_db = MagicMock()
    mocker.patch("google.cloud.firestore.Client", return_value=mock_db)
    
    service = FirestoreService()
    phone = "+1234567890"
    
    # Mock the collection/document structure
    mock_doc = MagicMock()
    mock_db.collection.return_value.document.return_value = mock_doc
    
    # Mock retrieval for get_incident
    mock_doc.get.return_value.to_dict.return_value = {
        "phone_number": phone,
        "status": "pending",
        "alert_type": "SIM_SWAP"
    }
    mock_doc.get.return_value.exists = True

    # 1. Test Create
    service.create_incident(phone, "SIM_SWAP", "high")
    mock_doc.set.assert_called_once()

    # 2. Test Get
    incident = service.get_incident(phone)
    assert incident["status"] == "pending"

    # 3. Test Update
    service.update_incident_status(phone, "resolved", "User verified identity")
    mock_doc.update.assert_called_once()
