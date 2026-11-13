import pytest
from fastapi import HTTPException

from app.routers import sla


def test_sla_route_key_accepts_only_configured_server_secret(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(sla, "SLA_API_KEY", "configured-secret")
    assert sla.require_sla_api_key("configured-secret") is None
    with pytest.raises(HTTPException) as error:
        sla.require_sla_api_key("wrong-secret")
    assert error.value.status_code == 401


def test_sla_route_fails_closed_when_secret_is_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(sla, "SLA_API_KEY", None)
    with pytest.raises(HTTPException) as error:
        sla.require_sla_api_key("any-value")
    assert error.value.status_code == 503


def test_sla_route_fails_closed_for_example_placeholder(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(sla, "SLA_API_KEY", "replace-with-a-long-random-secret")
    with pytest.raises(HTTPException) as error:
        sla.require_sla_api_key("replace-with-a-long-random-secret")
    assert error.value.status_code == 503
