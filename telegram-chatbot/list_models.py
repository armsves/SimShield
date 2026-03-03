import os
from google import genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("Error: GEMINI_API_KEY not found in .env file.")
    exit(1)

client = genai.Client(api_key=GEMINI_API_KEY)

print("Listing available models using google-genai SDK:")
try:
    for m in client.models.list():
        print(f"- {m.name}")
except Exception as e:
    print(f"Error listing models: {e}")
