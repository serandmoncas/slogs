from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.producto import ProductoCreate, ProductoUpdate, ProductoResponse
from app.schemas.common import PaginatedResponse
from app.services import producto_service

router = APIRouter(prefix="/productos", tags=["Productos"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=PaginatedResponse[ProductoResponse])
def list_productos(
    q: str | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return producto_service.list_productos(db, q, page, size)


@router.post("", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED)
def create_producto(data: ProductoCreate, db: Session = Depends(get_db)):
    return producto_service.create_producto(db, data)


@router.get("/{id}", response_model=ProductoResponse)
def get_producto(id: int, db: Session = Depends(get_db)):
    return producto_service.get_producto(db, id)


@router.put("/{id}", response_model=ProductoResponse)
def update_producto(id: int, data: ProductoUpdate, db: Session = Depends(get_db)):
    return producto_service.update_producto(db, id, data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_producto(id: int, db: Session = Depends(get_db)):
    producto_service.delete_producto(db, id)
