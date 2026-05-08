from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.cliente import Cliente
from app.schemas.cliente import ClienteCreate, ClienteUpdate
from app.schemas.common import PaginatedResponse
from app.schemas.cliente import ClienteResponse
from app.repositories import cliente_repo


def list_clientes(db: Session, q: str | None, page: int, size: int) -> PaginatedResponse[ClienteResponse]:
    items, total = cliente_repo.list_all(db, q, page, size)
    return PaginatedResponse(items=items, total=total, page=page, size=size)


def get_cliente(db: Session, id: int) -> Cliente:
    obj = cliente_repo.get_by_id(db, id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado.")
    return obj


def create_cliente(db: Session, data: ClienteCreate) -> Cliente:
    if cliente_repo.get_by_nit(db, data.nit):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya existe un cliente con ese NIT.")
    return cliente_repo.create(db, data)


def update_cliente(db: Session, id: int, data: ClienteUpdate) -> Cliente:
    obj = get_cliente(db, id)
    if data.nit and data.nit != obj.nit and cliente_repo.get_by_nit(db, data.nit):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya existe un cliente con ese NIT.")
    return cliente_repo.update(db, obj, data)


def delete_cliente(db: Session, id: int) -> None:
    obj = get_cliente(db, id)
    cliente_repo.delete(db, obj)
