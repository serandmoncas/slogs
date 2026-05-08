from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.bodega import Bodega
from app.schemas.bodega import BodegaCreate, BodegaUpdate
from app.schemas.common import PaginatedResponse
from app.schemas.bodega import BodegaResponse
from app.repositories import bodega_repo


def list_bodegas(db: Session, q: str | None, page: int, size: int) -> PaginatedResponse[BodegaResponse]:
    items, total = bodega_repo.list_all(db, q, page, size)
    return PaginatedResponse(items=items, total=total, page=page, size=size)


def get_bodega(db: Session, id: int) -> Bodega:
    obj = bodega_repo.get_by_id(db, id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bodega no encontrada.")
    return obj


def create_bodega(db: Session, data: BodegaCreate) -> Bodega:
    return bodega_repo.create(db, data)


def update_bodega(db: Session, id: int, data: BodegaUpdate) -> Bodega:
    obj = get_bodega(db, id)
    return bodega_repo.update(db, obj, data)


def delete_bodega(db: Session, id: int) -> None:
    obj = get_bodega(db, id)
    bodega_repo.delete(db, obj)
