from app import models  # noqa: F401
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import CORS_ORIGINS
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
