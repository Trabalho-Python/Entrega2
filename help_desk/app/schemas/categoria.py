import uuid

from pydantic import BaseModel, Field


class CategoriaOut(BaseModel):
    id: uuid.UUID
    nome: str

    class Config:
        from_attributes = True


class CategoriaCreate(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
