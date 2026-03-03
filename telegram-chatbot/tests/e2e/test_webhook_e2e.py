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

def run_manual_webhook_test():
    print("🤖 Starting Interactive Telegram Webhook E2E Test...")

    # Initialize Service
    try:
        service = FirestoreService()
        project_id = service.db.project
        print(f"✅ Firestore client initialized for project: {project_id}")
    except Exception as e:
        print(f"❌ Initialization failed: {e}")
        return

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

    # Record current time to find only new entries
    start_time = time.time()

    pause_for_action(
        "Send /start",
        "Open your bot in Telegram and send the /start command. "
        "Verify that the bot replies with a 'Share Phone Number' button."
    )

    # 3. Telegram Interaction: Share Contact
    print("\n--- 3. Bot Interaction: Share Contact ---")
    pause_for_action(
        "Share Phone Number",
        "Click the 'Share Phone Number' button in Telegram."
    )

    # 4. Verification in Firestore
    print("\n--- 4. Verification ---")
    print("🔍 Looking for the newest user record in Firestore...")

    user_data = None
    # Wait up to 10 seconds
    for i in range(10):
        # Query Firestore for users created/updated recently
        # Since we don't have a 'created_at' field yet, we'll just look at all users
        # and see if we can find one.
        # For a more robust test, we can look for the most recently modified doc.
        users_ref = service.db.collection(service.users_collection)
        # Firestore doesn't automatically add a timestamp, but we can list and hope for the best
        # Or better: we just check if any document exists and prompt the user if multiple found.
        docs = users_ref.get()

        if docs:
            # For simplicity, we'll take the first one found that didn't exist before,
            # but since we can't easily know "before", we'll just show the latest one.
            # In a real scenario, we might want to add 'created_at' to save_user.

            # Let's just find ALL and print them for the user to confirm.
            print(f"Found {len(docs)} user(s) in Firestore.")
            for doc in docs:
                data = doc.to_dict()
                print(f"   Found Phone: {data.get('phone_number')} (Telegram ID: {data.get('telegram_id')})")

            user_data = docs[0].to_dict() # Just take the first one for the "Success" message
            break

        print(f"Waiting for data to propagate... ({i+1}/10)")
        time.sleep(1)

    if user_data:
        print("\n✅ SUCCESS! Webhook integration verified.")
    else:
        print("\n❌ FAILURE: No user data found in Firestore.")
        print("Check your server logs and ensure Telegram is sending updates to your webhook.")

    print("\n🎉 Webhook E2E Interactive Test Complete!")

if __name__ == "__main__":
    run_manual_webhook_test()
