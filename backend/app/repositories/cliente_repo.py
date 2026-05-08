from sqlalchemy.orm import Session

from app.models.cliente import Cliente
from app.schemas.cliente import ClienteCreate, ClienteUpdate


def list_all(db: Session, q: str | None, page: int, size: int) -> tuple[list[Cliente], int]:
    query = db.query(Cliente)
    if q:
        like = f"%{q}%"
        query = query.filter(
            Cliente.nombre.ilike(like) | Cliente.nit.ilike(like) | Cliente.ciudad.ilike(like)
        )
    total = query.count()
    items = query.offset((page - 1) * size).limit(size).all()
    return items, total


def get_by_id(db: Session, id: int) -> Cliente | None:
    return db.query(Cliente).filter(Cliente.id == id).first()


def get_by_nit(db: Session, nit: str) -> Cliente | None:
    return db.query(Cliente).filter(Cliente.nit == nit).first()


def create(db: Session, data: ClienteCreate) -> Cliente:
    obj = Cliente(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update(db: Session, obj: Cliente, data: ClienteUpdate) -> Cliente:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete(db: Session, obj: Cliente) -> None:
    db.delete(obj)
    db.commit()
