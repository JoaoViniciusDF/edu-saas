from __future__ import annotations

import base64
import uuid
from datetime import datetime
from typing import TypeVar

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.core.exceptions import not_found
from app.schemas.common import PaginatedResponse

T = TypeVar("T")


def encode_cursor(dt: datetime | None, entity_id: uuid.UUID) -> str:
    raw = f"{dt.isoformat() if dt else ''}|{entity_id}"
    return base64.urlsafe_b64encode(raw.encode()).decode()


def decode_cursor(cursor: str | None) -> tuple[datetime | None, uuid.UUID | None]:
    if not cursor:
        return None, None
    try:
        raw = base64.urlsafe_b64decode(cursor.encode()).decode()
        parts = raw.split("|", 1)
        dt = datetime.fromisoformat(parts[0]) if parts[0] else None
        eid = uuid.UUID(parts[1]) if len(parts) > 1 and parts[1] else None
        return dt, eid
    except Exception:
        return None, None


def paginate(
    stmt: Select,
    db: Session,
    limit: int = 50,
    cursor: str | None = None,
    order_col=None,
) -> PaginatedResponse:
    limit = min(limit, 100)
    items = list(db.scalars(stmt.limit(limit + 1)).all())
    has_more = len(items) > limit
    if has_more:
        items = items[:limit]
    next_cursor = None
    if has_more and items and order_col is not None:
        last = items[-1]
        ts = getattr(last, "criado_em", None) or getattr(last, "atualizado_em", None)
        next_cursor = encode_cursor(ts, last.id)
    return PaginatedResponse(items=items, next_cursor=next_cursor, has_more=has_more)


def ensure_found(entity, message: str = "Recurso não encontrado"):
    if entity is None:
        raise not_found(message)
    return entity
