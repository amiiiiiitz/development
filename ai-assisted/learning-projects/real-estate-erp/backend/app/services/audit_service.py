from typing import Any, Dict, Optional
import uuid
from sqlalchemy.orm import Session

from app.models.support_audit import ActivityLog

SENSITIVE_KEYS = {"password", "password_hash", "token", "access_token", "refresh_token", "secret"}


def _sanitize_metadata(metadata: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not metadata:
        return None
    sanitized: Dict[str, Any] = {}
    for k, v in metadata.items():
        if str(k).lower() in SENSITIVE_KEYS:
            continue
        sanitized[k] = str(v) if isinstance(v, uuid.UUID) else v
    return sanitized


def record_activity(
    db: Session,
    employee_id: Optional[uuid.UUID],
    action: str,
    entity_type: str,
    entity_id: Any,
    metadata: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
) -> ActivityLog:
    log = ActivityLog(
        employee_id=employee_id,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        metadata_json=_sanitize_metadata(metadata),
        ip_address=ip_address,
    )
    db.add(log)
    return log
