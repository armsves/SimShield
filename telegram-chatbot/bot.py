import os
import logging
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes, MessageHandler, filters
from google import genai
from google.genai import types

# Load environment variables
load_dotenv()

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

# Configure Gemini
if not GEMINI_API_KEY:
    print("Error: GEMINI_API_KEY not found in environment variables.")
    exit(1)

client = genai.Client(api_key=GEMINI_API_KEY)

# Define the system prompt for "SimShield"
SYSTEM_PROMPT = """
You are SimShield, a proactive bank security assistant.
Your goal is to help users with security concerns, specifically focusing on SIM swap alerts and potential account compromises.
You have access to telco insights (via future tool integrations) and bank systems.
Be professional, reassuring, and quick to identify high-risk situations.
If a user reports a suspicious event, ask clarifying questions to assess the risk.
You are currently in a conversational phase, so you don't have tool access yet, but you should act as if you are monitoring their security.
"""

# Chat session storage (for context)
# In production, use a database.
chat_sessions = {}

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    # Reset/Create chat session for new start
    chat_sessions[user_id] = client.chats.create(
        model="gemini-2.5-flash",
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT
        )
    )
    
    await update.message.reply_text(
        "Hello! I am SimShield, your security assistant. I am monitoring your account for any suspicious activity. "
        "How can I help you today?"
    )

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    text = update.message.text
    
    # Get or create chat session
    if user_id not in chat_sessions:
        chat_sessions[user_id] = client.chats.create(
            model="gemini-2.5-flash",
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT
            )
        )
    
    chat = chat_sessions[user_id]
    
    try:
        response = chat.send_message(text)
        await update.message.reply_text(response.text)
    except Exception as e:
        logging.error(f"Error calling Gemini: {e}")
        await update.message.reply_text("I'm sorry, I'm having trouble processing your request right now.")

if __name__ == '__main__':
    if not TOKEN:
        print("Error: TELEGRAM_BOT_TOKEN not found in environment variables.")
        exit(1)

    application = ApplicationBuilder().token(TOKEN).build()
    
    start_handler = CommandHandler('start', start)
    message_handler = MessageHandler(filters.TEXT & (~filters.COMMAND), handle_message)

    application.add_handler(start_handler)
    application.add_handler(message_handler)
    
    print("SimShield Bot is running with Gemini integration...")
    application.run_polling()
