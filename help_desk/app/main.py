from app import models  # noqa: F401
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import CORS_ORIGINS
from app.core.database import engine
from app.routers import categorias, chamados, sla, usuarios

app = FastAPI(title="No Prazo - Serviço SLA")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Accept", "Content-Type"],
)

app.include_router(chamados.router)
app.include_router(categorias.router)
app.include_router(usuarios.router)
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
