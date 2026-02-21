import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.services.audit_service import AuditService
from app.models.schemas import AuditReport, Violation

app = FastAPI(title="Compliance Agent API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Absolute path for the ML model
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
model_path = os.path.join(BASE_DIR, "model_store", "model.pkl")

# Initialize Service
audit_service = AuditService(model_path)

@app.get("/")
def root():
    return {"status": "online", "engine": "Gemini-1.5-Flash + ML Fusion"}

@app.post("/audit", response_model=AuditReport)
async def perform_audit(file: UploadFile = File(...)):
    content = await file.read()
    
    if file.filename.lower().endswith(".pdf"):
        from google.genai import types
        content_parts = [
            types.Part.from_bytes(data=content, mime_type="application/pdf"),
            "Extract compliance rules from this document and audit the database."
        ]
    else:
        text = content.decode("utf-8")
        content_parts = [f"Policy Document:\n{text}"]

    raw_violations = audit_service.run_audit_with_parts(content_parts)
    
    violations = [
        Violation(
            subject_id=str(v.get('subject_id') or ''),
            event_type=str(v.get('event_type') or ''),
            val=float(v.get('val') or 0),
            reason=str(v.get('reason') or 'Policy Violation'),
            source=str(v.get('source') or 'Unknown')
        ) for v in raw_violations
    ]
    
    return AuditReport(
        policy_name=file.filename,
        total_violations=len(violations),
        violations=violations
    )