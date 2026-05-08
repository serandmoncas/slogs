from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.producto import Producto
from app.schemas.producto import ProductoCreate, ProductoUpdate
from app.schemas.common import PaginatedResponse
from app.schemas.producto import ProductoResponse
from app.repositories import producto_repo


def list_productos(db: Session, q: str | None, page: int, size: int) -> PaginatedResponse[ProductoResponse]:
    items, total = producto_repo.list_all(db, q, page, size)
    return PaginatedResponse(items=items, total=total, page=page, size=size)


def get_producto(db: Session, id: int) -> Producto:
    obj = producto_repo.get_by_id(db, id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado.")
    return obj


def create_producto(db: Session, data: ProductoCreate) -> Producto:
    return producto_repo.create(db, data)


def update_producto(db: Session, id: int, data: ProductoUpdate) -> Producto:
    obj = get_producto(db, id)
    return producto_repo.update(db, obj, data)


def delete_producto(db: Session, id: int) -> None:
    obj = get_producto(db, id)
    producto_repo.delete(db, obj)
