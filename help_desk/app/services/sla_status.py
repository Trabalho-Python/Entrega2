from datetime import datetime, timedelta, timezone


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def sla_esta_vencido(prazo_sla: datetime | None) -> bool:
    if prazo_sla is None:
        return False
    return datetime.now(timezone.utc) > _as_utc(prazo_sla)


def sla_esta_em_risco(prazo_sla: datetime | None, janela: timedelta = timedelta(hours=2)) -> bool:
    if prazo_sla is None or sla_esta_vencido(prazo_sla):
        return False
    restante = _as_utc(prazo_sla) - datetime.now(timezone.utc)
    return restante <= janela
