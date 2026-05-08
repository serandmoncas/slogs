from sqlalchemy import Enum as SAEnum
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin
from app.models.enums import TipoPuerto


class Puerto(Base, TimestampMixin):
    __tablename__ = "puertos"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    ciudad: Mapped[str] = mapped_column(String(100), nullable=False)
    pais: Mapped[str] = mapped_column(String(100), nullable=False)
    codigo: Mapped[str] = mapped_column(String(10), unique=True, index=True, nullable=False)
    tipo: Mapped[TipoPuerto] = mapped_column(
        SAEnum(TipoPuerto, name="tipopuerto", native_enum=True), nullable=False
    )
