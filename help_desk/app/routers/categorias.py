from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.categoria import Categoria
from app.schemas.categoria import CategoriaCreate, CategoriaOut

router = APIRouter(prefix="/categorias", tags=["Categorias"])


@router.get("", response_model=list[CategoriaOut])
def get_categorias(db: Session = Depends(get_db)):
    return db.query(Categoria).order_by(Categoria.nome.asc()).all()


@router.post("", response_model=CategoriaOut, status_code=201)
def post_categoria(payload: CategoriaCreate, db: Session = Depends(get_db)):
    categoria = Categoria(nome=payload.nome.strip())
    db.add(categoria)
    try:
        db.commit()
    except IntegrityError as erro:
        db.rollback()
        raise HTTPException(status_code=409, detail="Categoria já existe") from erro
    db.refresh(categoria)
    return categoria
