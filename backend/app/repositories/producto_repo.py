from sqlalchemy.orm import Session

from app.models.producto import Producto
from app.schemas.producto import ProductoCreate, ProductoUpdate


def list_all(db: Session, q: str | None, page: int, size: int) -> tuple[list[Producto], int]:
    query = db.query(Producto)
    if q:
        like = f"%{q}%"
        query = query.filter(Producto.nombre.ilike(like) | Producto.categoria.ilike(like))
    total = query.count()
    items = query.offset((page - 1) * size).limit(size).all()
    return items, total


def get_by_id(db: Session, id: int) -> Producto | None:
    return db.query(Producto).filter(Producto.id == id).first()


def create(db: Session, data: ProductoCreate) -> Producto:
    obj = Producto(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update(db: Session, obj: Producto, data: ProductoUpdate) -> Producto:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete(db: Session, obj: Producto) -> None:
    db.delete(obj)
    db.commit()
