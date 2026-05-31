from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.database import check_database_connection
from app.core.exceptions import AppError

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    base = settings.public_base_url.rstrip("/")
    print(f"EduSaaS API — Swagger UI: {base}/docs")
    print(f"EduSaaS API — OpenAPI JSON: {base}/openapi.json")
    yield


app = FastAPI(
    title="EduSaaS API",
    version=settings.app_version,
    docs_url="/docs" if settings.app_env == "development" else None,
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": exc.code,
            "message": exc.message,
            "details": exc.details,
        },
    )


app.include_router(api_router)


@app.get("/health")
def health() -> JSONResponse:
    db_ok = False
    latency_ms = 0.0
    try:
        _, latency_ms = check_database_connection()
        db_ok = True
    except Exception:
        db_ok = False

    database = "connected" if db_ok else "disconnected"
    status = "ok" if db_ok else "degraded"
    body = {
        "status": status,
        "api": "ok",
        "database": database,
        "latency_ms": latency_ms,
        "version": settings.app_version,
    }
    code = 200 if db_ok else 503
    return JSONResponse(status_code=code, content=body)
