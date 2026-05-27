from typing import Any


class AppError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        details: dict[str, Any] | None = None,
    ) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)


def not_found(message: str = "Recurso não encontrado") -> AppError:
    return AppError("NOT_FOUND", message, 404)


def forbidden(message: str = "Operação não permitida") -> AppError:
    return AppError("FORBIDDEN_PROFILE", message, 403)


def conflict(message: str, details: dict[str, Any] | None = None) -> AppError:
    return AppError("CONFLICT", message, 409, details)


def bad_request(message: str, details: dict[str, Any] | None = None) -> AppError:
    return AppError("BAD_REQUEST", message, 400, details)


def unauthorized(message: str = "Não autenticado") -> AppError:
    return AppError("UNAUTHORIZED", message, 401)
