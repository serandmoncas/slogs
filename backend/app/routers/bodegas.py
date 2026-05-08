from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.bodega import BodegaCreate, BodegaUpdate, BodegaResponse
from app.schemas.common import PaginatedResponse
from app.services import bodega_service

router = APIRouter(prefix="/bodegas", tags=["Bodegas"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=PaginatedResponse[BodegaResponse])
def list_bodegas(
    q: str | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return bodega_service.list_bodegas(db, q, page, size)


@router.post("", response_model=BodegaResponse, status_code=status.HTTP_201_CREATED)
def create_bodega(data: BodegaCreate, db: Session = Depends(get_db)):
    return bodega_service.create_bodega(db, data)


@router.get("/{id}", response_model=BodegaResponse)
def get_bodega(id: int, db: Session = Depends(get_db)):
    return bodega_service.get_bodega(db, id)


@router.put("/{id}", response_model=BodegaResponse)
def update_bodega(id: int, data: BodegaUpdate, db: Session = Depends(get_db)):
    return bodega_service.update_bodega(db, id, data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bodega(id: int, db: Session = Depends(get_db)):
    bodega_service.delete_bodega(db, id)
