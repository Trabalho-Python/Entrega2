from datetime import datetime, timedelta, timezone

HORAS_POR_PRIORIDADE = {
    "alta": 6,
    "media": 12,
    "baixa": 24,
}


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def calcular_prazo_sla(
    prioridade: str,
    data_abertura: datetime,
    pausa_acumulada: timedelta = timedelta(0),
    pausado_em: datetime | None = None,
    agora: datetime | None = None,
) -> datetime:
    """Calculate an elapsed-hours deadline, extending it by all paused time."""
    try:
        horas = HORAS_POR_PRIORIDADE[prioridade]
    except KeyError as erro:
        raise ValueError(f"Prioridade inválida: {prioridade}") from erro
    if pausa_acumulada < timedelta(0):
        raise ValueError("A pausa acumulada não pode ser negativa")

    deadline = _as_utc(data_abertura) + timedelta(hours=horas) + pausa_acumulada
    if pausado_em is not None:
        instante_atual = _as_utc(agora or datetime.now(timezone.utc))
        instante_pausa = _as_utc(pausado_em)
        if instante_atual < instante_pausa:
            raise ValueError("O instante atual não pode preceder o início da pausa")
        deadline += instante_atual - instante_pausa
    return deadline
