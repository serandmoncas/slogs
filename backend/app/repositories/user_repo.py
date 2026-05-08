from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate

_pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def create(db: Session, data: UserCreate) -> User:
    user = User(
        email=data.email,
        hashed_password=_pwd_ctx.hash(data.password),
        nombre=data.nombre,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_ctx.verify(plain, hashed)
