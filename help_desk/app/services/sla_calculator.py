from datetime import datetime, timedelta, timezone

HORAS_POR_PRIORIDADE = {
    "alta": 6,
    "media": 12,
    "baixa": 24,
}


def calcular_prazo_sla(prioridade: str, data_abertura: datetime) -> datetime:
    horas = HORAS_POR_PRIORIDADE[prioridade]
    if data_abertura.tzinfo is None:
        data_abertura = data_abertura.replace(tzinfo=timezone.utc)
    return data_abertura + timedelta(hours=horas)
