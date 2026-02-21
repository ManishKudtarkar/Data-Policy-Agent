from pydantic import BaseModel
from typing import List, Optional

class Violation(BaseModel):
    subject_id: str
    event_type: str
    val: float
    reason: str
    source: str

class AuditReport(BaseModel):
    policy_name: str
    total_violations: int
    violations: List[Violation]