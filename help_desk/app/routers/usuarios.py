from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioOut

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.get("", response_model=list[UsuarioOut])
def get_usuarios(db: Session = Depends(get_db)):
    return db.query(Usuario).order_by(Usuario.nome.asc()).all()
