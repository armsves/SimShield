import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, HTTPException
from pydantic import BaseModel
from telegram import Update, KeyboardButton, ReplyKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes
from services.firestore_service import FirestoreService
from dotenv import load_dotenv

# Load environment variables based on ENV variable
env = os.getenv("ENV", "TEST").upper()
env_file = f".env.{env}"
if os.path.exists(env_file):
    logging.info(f"Loading environment from {env_file}")
    load_dotenv(env_file)
else:
    logging.info("Loading environment from default .env")
    load_dotenv()

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
firestore_service = FirestoreService()

# API Models
class TriggerAlertRequest(BaseModel):
    phone_number: str
    alert_type: str
    severity: str
    amountCents: int = None
    posLatitude: float = None
    posLongitude: float = None

# Initialize Telegram Application
application = ApplicationBuilder().token(TOKEN).build()

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    contact_button = KeyboardButton(text="Share Phone Number", request_contact=True)
    keyboard = ReplyKeyboardMarkup([[contact_button]], one_time_keyboard=True, resize_keyboard=True)
    
    await update.message.reply_text(
        "Welcome to SimShield! To protect your account, I need to verify your identity. "
        "Please share your phone number using the button below.",
        reply_markup=keyboard
    )

async def contact_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    contact = update.message.contact
    telegram_id = update.effective_user.id
    phone_number = contact.phone_number
    
    # Standardize phone number format if needed
    # For now, just save as is
    firestore_service.save_user(phone_number, telegram_id)
    
    await update.message.reply_text(
        f"Thank you! Your phone number ({phone_number}) has been verified and linked to your SimShield account. "
        "I am now monitoring your security."
    )

# Add Handlers
application.add_handler(CommandHandler("start", start))
application.add_handler(MessageHandler(filters.CONTACT, contact_handler))

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Set webhook if BASE_URL is provided
    base_url = os.getenv("BASE_URL")
    if base_url:
        webhook_url = f"{base_url.rstrip('/')}/webhook"
        logging.info(f"Setting webhook to {webhook_url}")
        # Note: In a production environment, you might want to verify if the webhook is already set
        await application.bot.set_webhook(url=webhook_url)
    else:
        logging.warning("BASE_URL not set. Webhook will not be configured automatically.")

    # Initialize the application
    await application.initialize()
    await application.start()
    yield
    # Stop the application
    await application.stop()
    await application.shutdown()

app = FastAPI(lifespan=lifespan)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/webhook")
async def webhook(request: Request):
    data = await request.json()
    update = Update.de_json(data, application.bot)
    await application.process_update(update)
    return Response(status_code=200)

@app.post("/api/v1/trigger-alert", status_code=202)
async def trigger_alert(request: TriggerAlertRequest):
    user = firestore_service.get_user_by_phone(request.phone_number)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    telegram_id = user["telegram_id"]
    
    # Create incident in Firestore
    firestore_service.create_incident(
        request.phone_number, 
        request.alert_type, 
        request.severity
    )
    
    # Notify user via Telegram
    message = f"🚨 *SimShield Alert: {request.alert_type}* 🚨\n\n"
    if request.alert_type == "PAYMENT_DENIAL":
        amount_str = f" of {request.amountCents/100:.2f}€" if request.amountCents else ""
        message += f"We detected a suspicious payment attempt{amount_str}. Was this you?"
    elif request.alert_type == "SIM_SWAP_DETECTED":
        message += "We detected a suspicious SIM swap activity on your line. Please confirm your identity."
    else:
        message += "Suspicious activity detected. Please review your account."
        
    await application.bot.send_message(chat_id=telegram_id, text=message, parse_mode="Markdown")
    
    return {"status": "alert_triggered", "phone_number": request.phone_number}

@app.get("/api/v1/incident-status/{phone_number}")
async def get_incident_status(phone_number: str):
    incident = firestore_service.get_incident(phone_number)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    return incident
