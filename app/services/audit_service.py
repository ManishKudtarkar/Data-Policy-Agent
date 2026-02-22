import os
import joblib
import yaml
import pandas as pd
import numpy as np
from google.genai import types
from app.services.llm_service import LLMService
from app.utils.db_handler import execute_query

# Absolute Path Setup
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class AuditService:
    def __init__(self, model_path: str):
        config_path = os.path.join(BASE_DIR, "config", "settings.yaml")
        with open(config_path, "r") as f:
            config = yaml.safe_load(f)

        self.llm = LLMService(model_name=config.get("gemini_model", "models/gemini-2.0-flash"))
        self.model_path = model_path
        self.ml_model = None
        self.expected_features = [
            'val', 'event_type_CASH_OUT', 'event_type_DEBIT',
            'event_type_Low Customer Satisfaction', 'event_type_Low Working Days',
            'event_type_Low Working Days, Low Customer Satisfaction',
            'event_type_Low Working Days, Target Not Met',
            'event_type_Low Working Days, Target Not Met, Low Customer Satisfaction',
            'event_type_No Reason (Compliant)', 'event_type_PAYMENT',
            'event_type_TRANSFER', 'event_type_Target Not Met',
            'event_type_Target Not Met, Low Customer Satisfaction',
            'source_transactions'
        ]
        self._load_model()

    def _load_model(self):
        try:
            if os.path.exists(self.model_path):
                # Using the path confirmed in model_store
                self.ml_model = joblib.load(self.model_path)
                print(f"✅ ML Model loaded successfully from {self.model_path}")
            else:
                print(f"⚠️ ML Model missing at: {self.model_path}")
        except Exception as e:
            print(f"❌ ML Model Load Error: {e}")

    def run_audit_with_parts(self, content_parts):
        system_instruction = """
        You are a Senior SQL and Compliance Expert for the Gujarat IT/ITES Policy.
        Database: SQLite. Table: unified_transactions.
        Columns: [subject_id, event_type, val, is_violation, source]
        
        Task: 
        1. Write a SELECT query based on the policy provided.
        2. Provide a short 'compliance_reason' (max 10 words) explaining the rule.
        
        Format your response EXACTLY like this:
        REASON: <brief explanation>
        SQL: <raw sql query>
        """
        
        try:
            # 1. Generate SQL via Gemini
            try:
                response = self.llm.client.models.generate_content(
                    model=self.llm.model_name,
                    contents=content_parts,
                    config=types.GenerateContentConfig(system_instruction=system_instruction)
                )
            except Exception as api_error:
                # Handle API quota errors and other API issues
                error_msg = str(api_error)
                if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                    print("⚠️ API Quota Exceeded - Using fallback query")
                    # Return empty result with helpful message
                    return [{
                        'subject_id': 'API_QUOTA_EXCEEDED',
                        'event_type': 'API Limit Reached',
                        'val': 0.0,
                        'reason': 'Gemini API quota exceeded. Please wait or upgrade your plan.',
                        'source': 'System',
                        'is_violation': 0
                    }]
                else:
                    raise api_error
            
            raw_text = response.text.strip()
            reason = "Policy Violation Flagged"
            sql = "SELECT * FROM unified_transactions WHERE 1=0;"
            
            if "REASON:" in raw_text and "SQL:" in raw_text:
                parts = raw_text.split("SQL:")
                reason = parts[0].replace("REASON:", "").strip()
                sql = parts[1].strip().replace('```sql', '').replace('```', '').split(';')[0] + ';'

            print(f"💡 AI Reason: {reason}")
            print(f"📡 AI Generated SQL: {sql}")
            
            # 2. Execute SQL
            results_df = execute_query(sql)
            if results_df.empty:
                return []

            # Filter to only include actual violations (is_violation == 1)
            if 'is_violation' in results_df.columns:
                results_df = results_df[results_df['is_violation'] == 1]
                if results_df.empty:
                    return []

            results_df['reason'] = reason

            # 3. ML Risk Scoring with Feature Alignment
            if self.ml_model is not None:
                try:
                    # Create a copy for transformation
                    X = results_df.copy()
                    
                    # One-Hot Encode 'event_type'
                    X = pd.get_dummies(X, columns=['event_type'])
                    
                    # Rename 'source' to 'source_transactions' if needed
                    if 'source' in X.columns:
                        X['source_transactions'] = 1  # Standardizing for model
                    
                    # Ensure all expected columns exist (fill missing with 0)
                    for col in self.expected_features:
                        if col not in X.columns:
                            X[col] = 0
                    
                    # Select and order features exactly as the model expects
                    X_input = X[self.expected_features]
                    
                    # Predict Risk Score
                    results_df['risk_score'] = self.ml_model.predict(X_input)
                    results_df['risk_score'] = results_df['risk_score'].apply(
                        lambda x: "🚨 High Risk" if x == 1 else "✅ Low Risk"
                    )
                except Exception as e:
                    print(f"⚠️ ML Prediction Error: {e}")
                    results_df['risk_score'] = "Manual Review Required"
            else:
                results_df['risk_score'] = "ML Model Offline"

            return results_df.to_dict(orient="records")
        except Exception as e:
            print(f"❌ Audit Service Method Error: {e}")
            raise e