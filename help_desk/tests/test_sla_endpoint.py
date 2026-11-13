import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import httpx

from app.core.database import get_db
from app.main import app
from app.routers import sla


async def post(path: str, headers: dict[str, str] | None = None) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.post(path, headers=headers)


def test_sla_endpoint_rejects_missing_or_invalid_key(monkeypatch) -> None:
    monkeypatch.setattr(sla, "SLA_API_KEY", "configured-secret")
    response = asyncio.run(post(f"/sla/calcular/{uuid.uuid4()}"))
    assert response.status_code == 401
    response = asyncio.run(post(
        f"/sla/calcular/{uuid.uuid4()}",
        {"X-SLA-API-Key": "wrong-secret"},
    ))
    assert response.status_code == 401


def test_sla_endpoint_returns_calculated_deadline_with_key(monkeypatch) -> None:
    ticket_id = uuid.uuid4()
    deadline = datetime.now(timezone.utc) + timedelta(hours=6)
    ticket = SimpleNamespace(id=ticket_id, prioridade="alta", prazo_sla=deadline)
    monkeypatch.setattr(sla, "SLA_API_KEY", "configured-secret")
    monkeypatch.setattr(sla, "calcular_e_salvar_sla", lambda _db, _id: ticket)
    app.dependency_overrides[get_db] = lambda: object()
    try:
        response = asyncio.run(post(
            f"/sla/calcular/{ticket_id}",
            {"X-SLA-API-Key": "configured-secret"},
        ))
        assert response.status_code == 200
        assert response.json()["chamado_id"] == str(ticket_id)
        assert response.json()["prioridade"] == "alta"
        assert response.json()["sla_vencido"] is False
    finally:
        app.dependency_overrides.pop(get_db, None)
