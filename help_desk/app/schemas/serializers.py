from app.models.chamado import Chamado
from app.schemas.chamado import ChamadoOut
from app.services.sla_status import sla_esta_em_risco, sla_esta_vencido


def chamado_to_out(chamado: Chamado) -> ChamadoOut:
    return ChamadoOut(
        id=chamado.id,
        titulo=chamado.titulo,
        descricao=chamado.descricao,
        status=chamado.status,
        prioridade=chamado.prioridade,
        prazo_sla=chamado.prazo_sla,
        usuario_id=chamado.usuario_id,
        categoria_id=chamado.categoria_id,
        usuario_nome=chamado.usuario.nome if chamado.usuario else "",
        categoria_nome=chamado.categoria.nome if chamado.categoria else "",
        sla_vencido=sla_esta_vencido(chamado.prazo_sla),
        sla_em_risco=sla_esta_em_risco(chamado.prazo_sla),
        created_at=chamado.created_at,
        updated_at=chamado.updated_at,
    )
