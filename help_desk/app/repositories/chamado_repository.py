import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import case, func
from sqlalchemy.orm import Session, joinedload

from app.models.categoria import Categoria
from app.models.chamado import Chamado
from app.models.usuario import Usuario
from app.schemas.chamado import ChamadoCreate
from app.services.sla_calculator import calcular_prazo_sla


def _query_chamados(db: Session):
    return db.query(Chamado).options(
        joinedload(Chamado.usuario),
        joinedload(Chamado.categoria),
    )


def buscar_chamado_por_id(db: Session, chamado_id: uuid.UUID) -> Chamado | None:
    return _query_chamados(db).filter(Chamado.id == chamado_id).first()


def listar_chamados(db: Session, status: str | None = None) -> list[Chamado]:
    query = _query_chamados(db)
    if status:
        query = query.filter(Chamado.status == status)
    return query.order_by(Chamado.created_at.desc()).all()


def criar_chamado(db: Session, payload: ChamadoCreate) -> Chamado:
    usuario = db.query(Usuario).filter(Usuario.id == payload.usuario_id).first()
    if usuario is None:
        raise ValueError("usuario_nao_encontrado")

    categoria = db.query(Categoria).filter(Categoria.id == payload.categoria_id).first()
    if categoria is None:
        raise ValueError("categoria_nao_encontrada")

    chamado = Chamado(
        titulo=payload.titulo,
        descricao=payload.descricao,
        prioridade=payload.prioridade,
        usuario_id=payload.usuario_id,
        categoria_id=payload.categoria_id,
        status="aberto",
    )
    db.add(chamado)
    db.flush()
    db.refresh(chamado)

    if chamado.created_at is not None:
        chamado.prazo_sla = calcular_prazo_sla(chamado.prioridade, chamado.created_at)

    db.commit()
    return buscar_chamado_por_id(db, chamado.id)


def calcular_e_salvar_sla(db: Session, chamado_id: uuid.UUID) -> Chamado | None:
    chamado = buscar_chamado_por_id(db, chamado_id)

    if chamado is None:
        return None

    if chamado.created_at is None:
        return chamado

    chamado.prazo_sla = calcular_prazo_sla(chamado.prioridade, chamado.created_at)
    db.commit()
    return buscar_chamado_por_id(db, chamado.id)


def resumo_chamados(db: Session) -> dict[str, int]:
    agora = datetime.now(timezone.utc)
    limite_risco = agora + timedelta(hours=2)
    total, abertos, em_andamento, atrasados, em_risco = db.query(
        func.count(Chamado.id),
        func.coalesce(func.sum(case((Chamado.status == "aberto", 1), else_=0)), 0),
        func.coalesce(
            func.sum(case((Chamado.status == "em_andamento", 1), else_=0)), 0
        ),
        func.coalesce(
            func.sum(case((Chamado.prazo_sla < agora, 1), else_=0)), 0
        ),
        func.coalesce(
            func.sum(
                case(
                    (
                        (Chamado.prazo_sla >= agora)
                        & (Chamado.prazo_sla <= limite_risco),
                        1,
                    ),
                    else_=0,
                )
            ),
            0,
        ),
    ).one()

    total, abertos, em_andamento, atrasados, em_risco = map(
        int, (total, abertos, em_andamento, atrasados, em_risco)
    )
    return {
        "total": total,
        "abertos": abertos,
        "em_andamento": em_andamento,
        "no_prazo": max(total - atrasados, 0),
        "em_risco": em_risco,
        "atrasados": atrasados,
    }
