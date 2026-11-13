from app import models  # noqa: F401
from fastapi import FastAPI, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import engine
from app.routers import sla

app = FastAPI(title="NoPrazo - Serviço de SLA", docs_url=None, redoc_url=None, openapi_url=None)
app.include_router(sla.router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/readyz")
def readiness():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError as erro:
        raise HTTPException(
            status_code=503, detail="Banco de dados indisponível"
        ) from erro
    return {"status": "ok", "database": "ok"}
