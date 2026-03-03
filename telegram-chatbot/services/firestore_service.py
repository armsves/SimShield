import os
from google.cloud import firestore

class FirestoreService:
    def __init__(self, project_id: str = None, database_id: str = None):
        # Use provided project_id, or env var, or let ADC find it
        self.project_id = project_id or os.getenv("GCLOUD_PROJECT_ID")
        self.database_id = database_id or os.getenv("FIRESTORE_DATABASE_ID", "(default)")
        self.db = firestore.Client(project=self.project_id, database=self.database_id)
        self.users_collection = "users"
        self.incidents_collection = "incidents"
        self.chats_collection = "chat_history"

    def save_user(self, phone_number: str, telegram_id: int):
        doc_ref = self.db.collection(self.users_collection).document(phone_number)
        doc_ref.set({
            "phone_number": phone_number,
            "telegram_id": telegram_id
        })

    def get_user_by_phone(self, phone_number: str):
        doc_ref = self.db.collection(self.users_collection).document(phone_number)
        doc = doc_ref.get()
        if doc.exists:
            return doc.to_dict()
        return None

    #NIT this should have an uuid internal key, to prevent a user experiencing several incidents (maybe even close in time)
    def create_incident(self, phone_number: str, alert_type: str, severity: str):
        doc_ref = self.db.collection(self.incidents_collection).document(phone_number)
        doc_ref.set({
            "phone_number": phone_number,
            "alert_type": alert_type,
            "severity": severity,
            "status": "pending",
            "approved": False,
            "last_update": firestore.SERVER_TIMESTAMP,
            "summary": ""
        })

    def get_incident(self, phone_number: str):
        doc_ref = self.db.collection(self.incidents_collection).document(phone_number)
        doc = doc_ref.get()
        if doc.exists:
            return doc.to_dict()
        return None

    def update_incident_status(self, phone_number: str, status: str, summary: str = ""):
        doc_ref = self.db.collection(self.incidents_collection).document(phone_number)
        update_data = {
            "status": status,
            "last_update": firestore.SERVER_TIMESTAMP
        }
        if summary:
            update_data["summary"] = summary
        doc_ref.update(update_data)
