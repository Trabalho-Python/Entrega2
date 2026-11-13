from datetime import datetime, timedelta, timezone

import pytest

from app.services.sla_calculator import calcular_prazo_sla


@pytest.mark.parametrize(
    ("prioridade", "horas"),
    [("alta", 6), ("media", 12), ("baixa", 24)],
)
def test_deadline_uses_priority_elapsed_hours(prioridade: str, horas: int) -> None:
    opened = datetime(2026, 11, 13, 8, 30, tzinfo=timezone.utc)
    assert calcular_prazo_sla(prioridade, opened) == opened + timedelta(hours=horas)


def test_naive_timestamp_is_interpreted_as_utc() -> None:
    opened = datetime(2026, 11, 13, 8, 30)
    expected = datetime(2026, 11, 13, 20, 30, tzinfo=timezone.utc)
    assert calcular_prazo_sla("media", opened) == expected


def test_aware_timestamp_is_normalized_to_utc_across_day_boundary() -> None:
    opened = datetime(2026, 11, 13, 23, 30, tzinfo=timezone(timedelta(hours=-3)))
    expected = datetime(2026, 11, 14, 8, 30, tzinfo=timezone.utc)
    assert calcular_prazo_sla("alta", opened) == expected


def test_deadline_includes_accumulated_pause() -> None:
    opened = datetime(2026, 11, 13, 8, tzinfo=timezone.utc)
    deadline = calcular_prazo_sla("alta", opened, pausa_acumulada=timedelta(hours=2, minutes=15))
    assert deadline == datetime(2026, 11, 13, 16, 15, tzinfo=timezone.utc)


def test_deadline_extends_during_current_pause() -> None:
    opened = datetime(2026, 11, 13, 8, tzinfo=timezone.utc)
    paused_at = datetime(2026, 11, 13, 12, tzinfo=timezone.utc)
    now = datetime(2026, 11, 13, 15, 30, tzinfo=timezone.utc)
    deadline = calcular_prazo_sla("alta", opened, pausado_em=paused_at, agora=now)
    assert deadline == datetime(2026, 11, 13, 17, 30, tzinfo=timezone.utc)


def test_active_pause_and_previous_pause_are_both_counted() -> None:
    opened = datetime(2026, 11, 13, 8, tzinfo=timezone.utc)
    paused_at = datetime(2026, 11, 13, 12, tzinfo=timezone.utc)
    now = datetime(2026, 11, 13, 13, tzinfo=timezone.utc)
    deadline = calcular_prazo_sla("alta", opened, timedelta(hours=2), paused_at, now)
    assert deadline == datetime(2026, 11, 13, 17, tzinfo=timezone.utc)


def test_rejects_unknown_priority_and_negative_pause() -> None:
    opened = datetime(2026, 11, 13, 8, tzinfo=timezone.utc)
    with pytest.raises(ValueError, match="Prioridade inválida"):
        calcular_prazo_sla("urgente", opened)
    with pytest.raises(ValueError, match="negativa"):
        calcular_prazo_sla("alta", opened, timedelta(seconds=-1))


def test_rejects_clock_before_pause_start() -> None:
    paused_at = datetime(2026, 11, 13, 12, tzinfo=timezone.utc)
    with pytest.raises(ValueError, match="preceder"):
        calcular_prazo_sla(
            "alta",
            datetime(2026, 11, 13, 8, tzinfo=timezone.utc),
            pausado_em=paused_at,
            agora=paused_at - timedelta(seconds=1),
        )
