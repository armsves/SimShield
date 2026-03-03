import os
import sys
import time
from dotenv import load_dotenv

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from services.firestore_service import FirestoreService

# Load .env for local testing
load_dotenv()

def pause_for_action(step_name, description):
    print(f"\n🚀 [ACTION REQUIRED] {step_name}")
    print(f"👉 {description}")
    return input("Press Enter once you have completed this step (or type 'skip' to move on)... ")

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

    # Configuration
    # We'll ask the user for their test phone number or use a default
    test_phone = input("\nEnter the phone number you will share with the bot (default: +1234567890): ").strip()
    if not test_phone:
        test_phone = "+1234567890"
        print(f"Using default: {test_phone}")

    # 0. Clean Slate
    print(f"\n🧹 Cleaning up any existing user data for {test_phone}...")
    service.db.collection(service.users_collection).document(test_phone).delete()
    print(f"✅ Document {test_phone} deleted from 'users' collection.")

    # 1. Server Setup
    print("\n--- 1. Server Preparation ---")
    print("Ensure your FastAPI server is running. If testing locally with real Telegram, use ngrok.")
    print("Example: 'uvicorn main:app --reload' and 'ngrok http 8000'")
    print("Don't forget to set your WEBHOOK_URL in Telegram (or let the bot handle it if implemented).")

    #TODO how to make reachable: ngrok url + /health endpoint
    #TODO maybe require (user paste) the ngrok url and set everything here (including the bot's webhook)
    pause_for_action(
        "Start Server",
        "Make sure your FastAPI server is reachable and TELEGRAM_BOT_TOKEN is set in .env."
    )

    # 2. Telegram Interaction: /start
    print("\n--- 2. Bot Interaction: /start ---")
    #TODO maybe I should delete the chat first?
    #TODO also, maybe the test can derive the test number from the 1st interaction here
    pause_for_action(
        "Send /start",
        "Open your bot in Telegram and send the /start command. "
        "Verify that the bot replies with a 'Share Phone Number' button."
    )

    # 3. Telegram Interaction: Share Contact
    print("\n--- 3. Bot Interaction: Share Contact ---")
    pause_for_action(
        "Share Phone Number",
        f"Click the 'Share Phone Number' button in Telegram. "
        f"Make sure you are sharing the number: {test_phone}"
    )

    # 4. Verification in Firestore
    print("\n--- 4. Verification ---")
    print(f"🔍 Checking Firestore for user: {test_phone}...")

    # Retry a few times in case of latency
    user_data = None
    for i in range(5):
        user_data = service.get_user_by_phone(test_phone)
        if user_data:
            break
        print(f"Waiting for data to propagate... ({i+1}/5)")
        time.sleep(2)

    if user_data:
        print("✅ SUCCESS! User data found in Firestore:")
        print(f"   Phone: {user_data.get('phone_number')}")
        print(f"   Telegram ID: {user_data.get('telegram_id')}")
    else:
        print(f"❌ FAILURE: User data for {test_phone} was not found in Firestore.")
        print("Check your server logs for errors and ensure the webhook is receiving updates.")

    print("\n🎉 Webhook E2E Interactive Test Complete!")

if __name__ == "__main__":
    run_manual_webhook_test()
