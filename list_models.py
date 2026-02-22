from google import genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

client = genai.Client(api_key=api_key)

print("Available models:\n")
try:
    models = client.models.list()
    for model in models:
        print(f"✅ {model.name}")
        # Print attributes if available
        if hasattr(model, 'supported_generation_methods'):
            print(f"   Methods: {model.supported_generation_methods}")
except Exception as e:
    print(f"Error listing models: {e}")
    import traceback
    traceback.print_exc()
