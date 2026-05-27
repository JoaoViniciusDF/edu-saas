from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorEnvelope(BaseModel):
    code: str
    message: str
    details: dict | None = None


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    next_cursor: str | None = None
    has_more: bool = False


class MessageResponse(BaseModel):
    message: str = "ok"


class IdResponse(BaseModel):
    id: str
