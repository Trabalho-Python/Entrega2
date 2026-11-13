import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL is None:
    raise ValueError(
        "DATABASE_URL não foi encontrado. Verifique se o arquivo .env existe e está preenchido."
    )

if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://", "postgresql+psycopg2://", 1
    )
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif not DATABASE_URL.startswith("postgresql+psycopg2://"):
    raise ValueError(
        "DATABASE_URL deve ser uma URI PostgreSQL (postgresql://...). "
        "A URL HTTPS do projeto Supabase não é a connection string do banco. "
        "Copie a URI em Supabase Dashboard > Connect/Database e use sslmode=require."
    )

SLA_API_KEY = os.getenv("SLA_API_KEY")


def _positive_int(name: str, default: int, *, allow_zero: bool = False) -> int:
    value = int(os.getenv(name, str(default)))
    minimum = 0 if allow_zero else 1
    if value < minimum:
        raise ValueError(f"{name} deve ser maior ou igual a {minimum}.")
    return value


DB_POOL_SIZE = _positive_int("DB_POOL_SIZE", 5)
DB_MAX_OVERFLOW = _positive_int("DB_MAX_OVERFLOW", 2, allow_zero=True)
DB_POOL_TIMEOUT = _positive_int("DB_POOL_TIMEOUT", 10)
DB_POOL_RECYCLE = _positive_int("DB_POOL_RECYCLE", 1800)
DB_CONNECT_TIMEOUT = _positive_int("DB_CONNECT_TIMEOUT", 10)
