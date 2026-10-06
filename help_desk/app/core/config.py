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

_DEFAULT_CORS = "http://localhost:3000,http://127.0.0.1:3000"
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", _DEFAULT_CORS).split(",")
    if origin.strip()
]
