from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.cliente import ClienteCreate, ClienteUpdate, ClienteResponse
from app.schemas.common import PaginatedResponse
from app.services import cliente_service

router = APIRouter(prefix="/clientes", tags=["Clientes"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=PaginatedResponse[ClienteResponse])
def list_clientes(
    q: str | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return cliente_service.list_clientes(db, q, page, size)


@router.post("", response_model=ClienteResponse, status_code=status.HTTP_201_CREATED)
def create_cliente(data: ClienteCreate, db: Session = Depends(get_db)):
    return cliente_service.create_cliente(db, data)


@router.get("/{id}", response_model=ClienteResponse)
def get_cliente(id: int, db: Session = Depends(get_db)):
    return cliente_service.get_cliente(db, id)


@router.put("/{id}", response_model=ClienteResponse)
def update_cliente(id: int, data: ClienteUpdate, db: Session = Depends(get_db)):
    return cliente_service.update_cliente(db, id, data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cliente(id: int, db: Session = Depends(get_db)):
    cliente_service.delete_cliente(db, id)
