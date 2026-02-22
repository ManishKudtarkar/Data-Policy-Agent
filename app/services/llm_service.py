import os
from google import genai
from dotenv import load_dotenv

# Load .env only in local development (won't exist in production)
load_dotenv(override=True)

class LLMService:
    def __init__(self, model_name="models/gemini-2.0-flash"):
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is not set. Please configure it in your environment.")
        
        # Initialize the Google GenAI Client
        self.client = genai.Client(api_key=api_key)
        self.model_name = model_name