from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.schemas.puerto import PuertoCreate, PuertoUpdate, PuertoResponse
from app.schemas.common import PaginatedResponse
from app.services import puerto_service

router = APIRouter(prefix="/puertos", tags=["Puertos"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=PaginatedResponse[PuertoResponse])
def list_puertos(
    q: str | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return puerto_service.list_puertos(db, q, page, size)


@router.post("", response_model=PuertoResponse, status_code=status.HTTP_201_CREATED)
def create_puerto(data: PuertoCreate, db: Session = Depends(get_db)):
    return puerto_service.create_puerto(db, data)


@router.get("/{id}", response_model=PuertoResponse)
def get_puerto(id: int, db: Session = Depends(get_db)):
    return puerto_service.get_puerto(db, id)


@router.put("/{id}", response_model=PuertoResponse)
def update_puerto(id: int, data: PuertoUpdate, db: Session = Depends(get_db)):
    return puerto_service.update_puerto(db, id, data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_puerto(id: int, db: Session = Depends(get_db)):
    puerto_service.delete_puerto(db, id)
