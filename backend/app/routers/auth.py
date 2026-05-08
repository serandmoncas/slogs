from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.repositories import user_repo
from app.schemas.user import Token, UserCreate, UserResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, db: Session = Depends(get_db)):
    user = auth_service.register(db, data)
    return user


@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth_service.authenticate(db, form.username, form.password)
    token = auth_service.create_access_token({"sub": user.email})
    return Token(access_token=token)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch(
    "/usuarios/{id}/rol", response_model=UserResponse, dependencies=[Depends(require_admin)]
)
def cambiar_rol(id: int, rol: str, db: Session = Depends(get_db)):
    from fastapi import HTTPException

    if rol not in ("admin", "operador"):
        raise HTTPException(status_code=400, detail="Rol inválido. Use 'admin' o 'operador'.")
    user = user_repo.get_by_id(db, id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    user.rol = rol
    db.commit()
    db.refresh(user)
    return user
