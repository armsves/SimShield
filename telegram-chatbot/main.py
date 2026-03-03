import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from telegram import Update, KeyboardButton, ReplyKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes
from services.firestore_service import FirestoreService
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
firestore_service = FirestoreService()

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
