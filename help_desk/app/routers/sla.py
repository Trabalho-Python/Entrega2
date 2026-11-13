import uuid
import hmac

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.core.config import SLA_API_KEY
from app.core.database import get_db
from app.repositories.chamado_repository import calcular_e_salvar_sla
from app.schemas.sla import SLAResponse
from app.services.sla_status import sla_esta_vencido

router = APIRouter(prefix="/sla", tags=["SLA"])


def require_sla_api_key(api_key: str | None = Header(default=None, alias="X-SLA-API-Key")) -> None:
    if not SLA_API_KEY or SLA_API_KEY.startswith("replace-with-"):
        raise HTTPException(status_code=503, detail="Serviço de SLA não configurado")
    if not api_key or not hmac.compare_digest(api_key, SLA_API_KEY):
        raise HTTPException(status_code=401, detail="Credencial inválida")


@router.post("/calcular/{chamado_id}", response_model=SLAResponse)
def calcular_sla(
    chamado_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: None = Depends(require_sla_api_key),
):
    chamado = calcular_e_salvar_sla(db, chamado_id)

    if chamado is None:
        raise HTTPException(status_code=404, detail="Chamado não encontrado")

    return SLAResponse(
        chamado_id=chamado.id,
        prioridade=chamado.prioridade,
        prazo_sla=chamado.prazo_sla,
        sla_vencido=sla_esta_vencido(chamado.prazo_sla),
    )
