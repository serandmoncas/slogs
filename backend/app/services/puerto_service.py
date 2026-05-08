from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.puerto import Puerto
from app.repositories import puerto_repo
from app.schemas.common import PaginatedResponse
from app.schemas.puerto import PuertoCreate, PuertoResponse, PuertoUpdate


def list_puertos(
    db: Session, q: str | None, page: int, size: int
) -> PaginatedResponse[PuertoResponse]:
    items, total = puerto_repo.list_all(db, q, page, size)
    return PaginatedResponse(items=items, total=total, page=page, size=size)


def get_puerto(db: Session, id: int) -> Puerto:
    obj = puerto_repo.get_by_id(db, id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Puerto no encontrado.")
    return obj


def create_puerto(db: Session, data: PuertoCreate) -> Puerto:
    if puerto_repo.get_by_codigo(db, data.codigo):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Ya existe un puerto con ese código."
        )
    return puerto_repo.create(db, data)


def update_puerto(db: Session, id: int, data: PuertoUpdate) -> Puerto:
    obj = get_puerto(db, id)
    if data.codigo and data.codigo != obj.codigo and puerto_repo.get_by_codigo(db, data.codigo):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Ya existe un puerto con ese código."
        )
    return puerto_repo.update(db, obj, data)


def delete_puerto(db: Session, id: int) -> None:
    obj = get_puerto(db, id)
    puerto_repo.delete(db, obj)
