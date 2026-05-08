from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Integer, Numeric, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.models.enums import EstadoEnvio


class EnvioMaritimo(Base, TimestampMixin):
    __tablename__ = "envios_maritimos"

    id: Mapped[int] = mapped_column(primary_key=True)
    numero_guia: Mapped[str] = mapped_column(String(10), unique=True, index=True, nullable=False)

    cliente_id: Mapped[int] = mapped_column(ForeignKey("clientes.id"), nullable=False)
    producto_id: Mapped[int] = mapped_column(ForeignKey("productos.id"), nullable=False)
    puerto_id: Mapped[int] = mapped_column(ForeignKey("puertos.id"), nullable=False)

    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    fecha_registro: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_entrega: Mapped[date] = mapped_column(Date, nullable=False)

    precio_envio: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    descuento_pct: Mapped[Decimal] = mapped_column(Numeric(4, 2), nullable=False, default=0)
    precio_final: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    # regex ^[A-Z]{3}[0-9]{4}[A-Z]$ — validado en Pydantic, almacenado tal cual
    numero_flota: Mapped[str] = mapped_column(String(8), nullable=False)

    estado: Mapped[EstadoEnvio] = mapped_column(
        # reutiliza el mismo tipo ENUM de PostgreSQL que envios_terrestres
        SAEnum(EstadoEnvio, name="estadoenvio", native_enum=True, create_type=False),
        nullable=False,
        default=EstadoEnvio.PENDIENTE,
    )

    cliente = relationship("Cliente", lazy="select")
    producto = relationship("Producto", lazy="select")
    puerto = relationship("Puerto", lazy="select")
