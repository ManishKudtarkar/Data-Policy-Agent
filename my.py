import joblib
import pandas as pd

# The exact absolute path to your model
model_path = r"C:\Users\Manish Kudtarkar\Policy-agent\compliance-agent\model_store\model.pkl"

try:
    model = joblib.load(model_path)
    print("✅ SUCCESS: ML Model loaded from model_store!")
    
    # Check what features the model expects
    if hasattr(model, 'feature_names_in_'):
        print(f"📊 Expected features: {model.feature_names_in_}")
    else:
        print("⚠️ Model loaded, but feature names aren't saved inside it.")
        
except Exception as e:
    print(f"❌ Error loading model: {e}")