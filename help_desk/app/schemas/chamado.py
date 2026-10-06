import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

PRIORIDADES = {"baixa", "media", "alta"}
STATUS_VALIDOS = {"aberto", "em_andamento", "resolvido", "fechado"}


def normalizar_prioridade(valor: str) -> str:
    normalizado = valor.lower().strip().replace("é", "e")
    if normalizado not in PRIORIDADES:
        raise ValueError("prioridade deve ser baixa, media ou alta")
    return normalizado


class ChamadoCreate(BaseModel):
    titulo: str = Field(min_length=3, max_length=255)
    descricao: str = Field(min_length=3)
    prioridade: str
    usuario_id: uuid.UUID
    categoria_id: uuid.UUID

    @field_validator("titulo", "descricao")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("prioridade")
    @classmethod
    def validar_prioridade(cls, value: str) -> str:
        return normalizar_prioridade(value)


class ChamadoOut(BaseModel):
    id: uuid.UUID
    titulo: str
    descricao: str
    status: str
    prioridade: str
    prazo_sla: Optional[datetime] = None
    usuario_id: uuid.UUID
    categoria_id: uuid.UUID
    usuario_nome: str
    categoria_nome: str
    sla_vencido: bool
    sla_em_risco: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ChamadoResumo(BaseModel):
    total: int
    abertos: int
    em_andamento: int
    no_prazo: int
    em_risco: int
    atrasados: int
