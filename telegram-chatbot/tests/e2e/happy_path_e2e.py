import os
import sys
import time
import requests
from dotenv import load_dotenv
from google.cloud import firestore

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from services.firestore_service import FirestoreService

# Load .env for local testing
load_dotenv()

def pause_for_action(step_name, description):
    print(f"\n🚀 [ACTION REQUIRED] {step_name}")
    print(f"👉 {description}")
    return input("Press Enter once you have completed this step (or type 'skip' to move on)... ")

def check_server_health(base_url):
    try:
        response = requests.get(f"{base_url.rstrip('/')}/health", timeout=5)
        if response.status_code == 200 and response.json().get("status") == "ok":
            return True
    except Exception:
        pass
    return False

def delete_collection(db, collection_name, batch_size=20):
    """Deletes all documents in a collection."""
    coll_ref = db.collection(collection_name)
    docs = coll_ref.list_documents(page_size=batch_size)
    deleted = 0

    for doc in docs:
        doc.delete()
        deleted += 1

    if deleted > 0:
        print(f"   🧹 Cleaned collection '{collection_name}' ({deleted} docs deleted).")
    else:
        print(f"   ✨ Collection '{collection_name}' was already empty.")

def run_manual_webhook_test():
    print("🤖 Starting Interactive Telegram Webhook & API E2E Test...")

    # Initialize Service
    try:
        service = FirestoreService()
        project_id = service.db.project
        print(f"✅ Firestore client initialized for project: {project_id}")
    except Exception as e:
        print(f"❌ Initialization failed: {e}")
        return

    # 0. Clean Test Environment
    print("\n--- 0. Cleaning Test Environment ---")
    confirm = input("⚠️ This will DELETE all users and incidents from Firestore. Proceed? (y/n): ").strip().lower()
    if confirm == 'y':
        delete_collection(service.db, service.users_collection)
        delete_collection(service.db, service.incidents_collection)
    else:
        print("⏭️ Skipping cleanup.")

    # 1. Server Setup & Verification
    print("\n--- 1. Server Preparation ---")
    base_url = input("Enter your public BASE_URL (e.g., ngrok URL): ").strip()
    if not base_url:
        print("❌ BASE_URL is required.")
        return

    print(f"🔍 Verifying server health at {base_url}...")
    if not check_server_health(base_url):
        print(f"❌ Server at {base_url} is NOT reachable or /health failed.")
        print("Make sure your server is running with BASE_URL set:")
        print(f"  BASE_URL={base_url} uvicorn main:app --reload")
        return
    print("✅ Server is healthy and reachable.")

    # 2. Telegram Interaction: /start
    print("\n--- 2. Bot Interaction: /start ---")
    print("Hint: If you've used this bot before, you might want to 'Clear Chat History' or 'Delete Chat' in Telegram for a fresh start.")

    pause_for_action(
        "Send /start",
        "Open your bot in Telegram and send the /start command."
    )

    # 3. Telegram Interaction: Share Contact
    print("\n--- 3. Bot Interaction: Share Contact ---")
    pause_for_action(
        "Share Phone Number",
        "Click the 'Share Phone Number' button in Telegram."
    )

    # 2.5. Verification in Firestore
    print("\n🔍 Verifying user record in Firestore...")
    user_data = None
    for i in range(10):
        docs = service.db.collection(service.users_collection).get()
        if docs:
            user_data = docs[0].to_dict()
            print(f"✅ Found User: {user_data.get('phone_number')} (Telegram ID: {user_data.get('telegram_id')})")
            break
        print(f"Waiting for data... ({i+1}/10)")
        time.sleep(1)

    if not user_data:
        print("❌ FAILURE: No user data found in Firestore.")
        return

    phone_number = user_data.get('phone_number')

    # 3. Trigger Alert API
    print("\n--- 3. Trigger Alert API ---")
    alert_payload = {
        "phone_number": phone_number,
        "alert_type": "PAYMENT_DENIAL",
        "severity": "high",
        "amountCents": 4999
    }

    print(f"🚀 Calling POST /api/v1/trigger-alert for {phone_number}...")
    try:
        response = requests.post(f"{base_url.rstrip('/')}/api/v1/trigger-alert", json=alert_payload)
        print(f"   Response Status: {response.status_code}")
        if response.status_code == 202:
            print("✅ Alert triggered successfully.")
        else:
            print(f"❌ Alert trigger failed: {response.text}")
            return
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return

    pause_for_action(
        "Check Telegram",
        "Verify that you received a 'SimShield Alert' message about a suspicious payment of 49.99€."
    )

    # 4. Incident Status Polling
    print("\n--- 4. Incident Status Polling ---")
    print(f"🔍 Calling GET /api/v1/incident-status/{phone_number}...")
    try:
        response = requests.get(f"{base_url.rstrip('/')}/api/v1/incident-status/{phone_number}")
        print(f"   Response Status: {response.status_code}")
        if response.status_code == 200:
            status_data = response.json()
            print(f"✅ Current Incident Status: {status_data.get('status')}")
            print(f"   Approved: {status_data.get('approved')}")
            print(f"   Full Payload: {status_data}")
        else:
            print(f"❌ Status polling failed: {response.text}")
            return
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return

    print("\n🎉 E2E Interactive Test Complete!")

if __name__ == "__main__":
    run_manual_webhook_test()
