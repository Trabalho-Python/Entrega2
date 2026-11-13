from sqlalchemy.orm import configure_mappers

from app import models  # noqa: F401


def test_sqlalchemy_relationships_are_unambiguous() -> None:
    configure_mappers()
