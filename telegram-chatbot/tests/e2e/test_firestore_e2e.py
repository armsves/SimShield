import os
import sys
import time
from dotenv import load_dotenv

# Add the project root to sys.path so 'services' can be imported when running directly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from services.firestore_service import FirestoreService

# Load .env for local testing
load_dotenv()

def pause_for_validation(step_name, description):
    print(f"\n🛑 [ACTION REQUIRED] {step_name}")
    print(f"👉 {description}")
    input("Press Enter once you have validated this in the Firestore Studio console...")

def run_manual_test():
    print("🚀 Starting Interactive Firestore E2E Test...")
    
    # Initialize Service
    try:
        service = FirestoreService()
        project_id = service.db.project
        print(f"✅ Firestore client initialized for project: {project_id}")
    except Exception as e:
        print(f"❌ Initialization failed: {e}")
        return

    test_phone = "+1999888777"
    test_telegram_id = 987654321

    # 0. Clean Slate
    print(f"\n🧹 Cleaning up any existing test data for {test_phone}...")
    service.db.collection(service.users_collection).document(test_phone).delete()
    service.db.collection(service.incidents_collection).document(test_phone).delete()
    
    pause_for_validation(
        "Verify Clean Slate",
        f"In Firestore Studio, ensure the document '{test_phone}' DOES NOT exist in "
        f"the 'users' or 'incidents' collections."
    )

    # 1. User Initialization
    print(f"\n--- 1. Saving User: {test_phone} ---")
    service.save_user(test_phone, test_telegram_id)
    print("✅ User saved.")
    
    pause_for_validation(
        "Verify User Creation",
        f"In the 'users' collection, look for document '{test_phone}'. "
        f"Confirm 'telegram_id' is {test_telegram_id}."
    )

    # 2. Incident Initialization
    print(f"\n--- 2. Creating Incident for {test_phone} ---")
    service.create_incident(test_phone, "SIM_SWAP_DETECTED", "high")
    print("✅ Incident created.")
    
    pause_for_validation(
        "Verify Incident Creation",
        f"In the 'incidents' collection, look for document '{test_phone}'. "
        f"Confirm 'status' is 'pending' and 'alert_type' is 'SIM_SWAP_DETECTED'."
    )

    # 3. Incident Update
    print(f"\n--- 3. Resolving Incident ---")
    service.update_incident_status(test_phone, "resolved", "E2E interactive validation complete.")
    print("✅ Incident updated.")
    
    pause_for_validation(
        "Verify Incident Resolution",
        f"Refresh the 'incidents/{test_phone}' document. "
        f"Confirm 'status' is now 'resolved' and 'summary' is present."
    )

    print("\n🎉 E2E Interactive Test Complete! Database integration is fully verified.")

if __name__ == "__main__":
    run_manual_test()
