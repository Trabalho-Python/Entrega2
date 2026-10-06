import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.chamado_repository import (
    buscar_chamado_por_id,
    criar_chamado,
    listar_chamados,
    resumo_chamados,
)
from app.schemas.chamado import ChamadoCreate, ChamadoOut, ChamadoResumo, STATUS_VALIDOS
from app.schemas.serializers import chamado_to_out

router = APIRouter(prefix="/chamados", tags=["Chamados"])


@router.get("", response_model=list[ChamadoOut])
def get_chamados(
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    if status and status not in STATUS_VALIDOS:
        raise HTTPException(status_code=422, detail="status inválido")
    return [chamado_to_out(item) for item in listar_chamados(db, status)]


@router.get("/resumo", response_model=ChamadoResumo)
def get_resumo(db: Session = Depends(get_db)):
    return resumo_chamados(db)


@router.get("/{chamado_id}", response_model=ChamadoOut)
def get_chamado(chamado_id: uuid.UUID, db: Session = Depends(get_db)):
    chamado = buscar_chamado_por_id(db, chamado_id)
    if chamado is None:
        raise HTTPException(status_code=404, detail="Chamado não encontrado")
    return chamado_to_out(chamado)


@router.post("", response_model=ChamadoOut, status_code=201)
def post_chamado(payload: ChamadoCreate, db: Session = Depends(get_db)):
    try:
        chamado = criar_chamado(db, payload)
    except ValueError as erro:
        mensagens = {
            "usuario_nao_encontrado": "Usuário não encontrado",
            "categoria_nao_encontrada": "Categoria não encontrada",
        }
        raise HTTPException(
            status_code=404,
            detail=mensagens.get(str(erro), "Não foi possível criar o chamado"),
        ) from erro

    if chamado is None:
        raise HTTPException(status_code=500, detail="Falha ao persistir o chamado")
    return chamado_to_out(chamado)
