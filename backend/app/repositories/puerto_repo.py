from sqlalchemy.orm import Session

from app.models.puerto import Puerto
from app.schemas.puerto import PuertoCreate, PuertoUpdate


def list_all(db: Session, q: str | None, page: int, size: int) -> tuple[list[Puerto], int]:
    query = db.query(Puerto)
    if q:
        like = f"%{q}%"
        query = query.filter(
            Puerto.nombre.ilike(like) | Puerto.codigo.ilike(like) | Puerto.ciudad.ilike(like)
        )
    total = query.count()
    items = query.offset((page - 1) * size).limit(size).all()
    return items, total


def get_by_id(db: Session, id: int) -> Puerto | None:
    return db.query(Puerto).filter(Puerto.id == id).first()


def get_by_codigo(db: Session, codigo: str) -> Puerto | None:
    return db.query(Puerto).filter(Puerto.codigo == codigo).first()


def create(db: Session, data: PuertoCreate) -> Puerto:
    obj = Puerto(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update(db: Session, obj: Puerto, data: PuertoUpdate) -> Puerto:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete(db: Session, obj: Puerto) -> None:
    db.delete(obj)
    db.commit()
