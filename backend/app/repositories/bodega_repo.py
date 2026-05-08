from sqlalchemy.orm import Session

from app.models.bodega import Bodega
from app.schemas.bodega import BodegaCreate, BodegaUpdate


def list_all(db: Session, q: str | None, page: int, size: int) -> tuple[list[Bodega], int]:
    query = db.query(Bodega)
    if q:
        like = f"%{q}%"
        query = query.filter(Bodega.nombre.ilike(like) | Bodega.ciudad.ilike(like))
    total = query.count()
    items = query.offset((page - 1) * size).limit(size).all()
    return items, total


def get_by_id(db: Session, id: int) -> Bodega | None:
    return db.query(Bodega).filter(Bodega.id == id).first()


def create(db: Session, data: BodegaCreate) -> Bodega:
    obj = Bodega(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update(db: Session, obj: Bodega, data: BodegaUpdate) -> Bodega:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete(db: Session, obj: Bodega) -> None:
    db.delete(obj)
    db.commit()
