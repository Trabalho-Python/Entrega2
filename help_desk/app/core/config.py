import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL is None:
    raise ValueError(
        "DATABASE_URL não foi encontrado. Verifique se o arquivo .env existe e está preenchido."
    )

# SQLAlchemy 2.1 pode selecionar o driver psycopg (v3) para a URL genérica,
# mas este projeto instala psycopg2-binary. Fixe o driver para manter a URL
# PostgreSQL padrão do .env compatível com a dependência declarada.
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://", "postgresql+psycopg2://", 1
    )
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)

SLA_API_KEY = os.getenv("SLA_API_KEY")


def _positive_int(name: str, default: int, *, allow_zero: bool = False) -> int:
    value = int(os.getenv(name, str(default)))
    minimum = 0 if allow_zero else 1
    if value < minimum:
        raise ValueError(f"{name} deve ser maior ou igual a {minimum}.")
    return value


# Defaults deliberadamente conservadores: cada processo da API mantém seu
# próprio pool, então o total máximo é (pool_size + max_overflow) * workers.
DB_POOL_SIZE = _positive_int("DB_POOL_SIZE", 5)
DB_MAX_OVERFLOW = _positive_int("DB_MAX_OVERFLOW", 2, allow_zero=True)
DB_POOL_TIMEOUT = _positive_int("DB_POOL_TIMEOUT", 10)
DB_POOL_RECYCLE = _positive_int("DB_POOL_RECYCLE", 1800)
DB_CONNECT_TIMEOUT = _positive_int("DB_CONNECT_TIMEOUT", 10)
