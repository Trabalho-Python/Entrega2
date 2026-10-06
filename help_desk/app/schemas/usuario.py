import uuid

from pydantic import BaseModel


class UsuarioOut(BaseModel):
    id: uuid.UUID
    nome: str
    email: str

    class Config:
        from_attributes = True
