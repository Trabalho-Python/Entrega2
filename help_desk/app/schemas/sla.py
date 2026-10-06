import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SLAResponse(BaseModel):
    chamado_id: uuid.UUID
    prioridade: str
    prazo_sla: Optional[datetime]
    sla_vencido: bool
