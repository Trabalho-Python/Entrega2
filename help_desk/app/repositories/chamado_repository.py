import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session, joinedload

from app.models.chamado import Chamado
from app.services.sla_calculator import calcular_prazo_sla


def buscar_chamado_por_id(db: Session, chamado_id: uuid.UUID) -> Chamado | None:
    return (
        db.query(Chamado)
        .options(joinedload(Chamado.usuario), joinedload(Chamado.categoria))
        .filter(Chamado.id == chamado_id)
        .first()
    )


def calcular_e_salvar_sla(db: Session, chamado_id: uuid.UUID) -> Chamado | None:
    chamado = buscar_chamado_por_id(db, chamado_id)
    if chamado is None or chamado.created_at is None:
        return chamado

    chamado.prazo_sla = calcular_prazo_sla(
        prioridade=chamado.prioridade,
        data_abertura=chamado.created_at,
        pausa_acumulada=chamado.sla_pausado_total,
        pausado_em=chamado.sla_pausado_em,
        agora=datetime.now(timezone.utc),
    )
    db.commit()
    return buscar_chamado_por_id(db, chamado.id)
