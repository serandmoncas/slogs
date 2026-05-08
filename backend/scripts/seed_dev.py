"""
Seeder de desarrollo — inserta datos de ejemplo para probar la app localmente.
Ejecutar: python scripts/seed_dev.py (desde backend/ con venv activo)
"""

import os
import sys
from datetime import date, timedelta
from decimal import Decimal

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from passlib.context import CryptContext

from app.database import SessionLocal
from app.models import Bodega, Cliente, EnvioMaritimo, EnvioTerrestre, Producto, Puerto, User
from app.models.enums import EstadoEnvio, TipoBodega, TipoPuerto

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed():
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            print("BD ya tiene datos, omitiendo seed.")
            return

        # Usuarios
        admin = User(
            email="admin@siata.co",
            hashed_password=pwd_ctx.hash("admin1234"),
            nombre="Admin SIATA",
            rol="admin",
        )
        db.add(admin)

        # Clientes
        clientes = [
            Cliente(
                nombre="Comercializadora del Pacífico",
                nit="900123456-1",
                email="compras@pacifico.co",
                telefono="3101234567",
                direccion="Cra 5 #10-20",
                ciudad="Cali",
            ),
            Cliente(
                nombre="Distribuidora Andina",
                nit="800456789-2",
                email="logistica@andina.co",
                telefono="3209876543",
                direccion="Cll 72 #15-30",
                ciudad="Bogotá",
            ),
            Cliente(
                nombre="Exportaciones Costa Norte",
                nit="700789012-3",
                email="export@costanorte.co",
                telefono="3157654321",
                direccion="Av El Lago #8-50",
                ciudad="Barranquilla",
            ),
        ]
        db.add_all(clientes)

        # Productos
        productos = [
            Producto(
                nombre="Café Especial",
                descripcion="Granos de café de origen colombiano",
                categoria="Alimentos",
            ),
            Producto(
                nombre="Aceite de Palma",
                descripcion="Aceite refinado para exportación",
                categoria="Alimentos",
            ),
            Producto(
                nombre="Tabletas Electrónicas",
                descripcion="Dispositivos de 10 pulgadas",
                categoria="Electrónica",
            ),
            Producto(
                nombre="Textiles Sintéticos",
                descripcion="Telas de poliéster para confección",
                categoria="Textil",
            ),
        ]
        db.add_all(productos)

        # Bodegas
        bodegas = [
            Bodega(
                nombre="Bodega Central Bogotá",
                ciudad="Bogotá",
                direccion="Zona Industrial Puente Aranda",
                capacidad=5000,
                tipo=TipoBodega.NACIONAL,
            ),
            Bodega(
                nombre="Bodega Palmira",
                ciudad="Palmira",
                direccion="Zona Franca Palmaseca",
                capacidad=3000,
                tipo=TipoBodega.NACIONAL,
            ),
            Bodega(
                nombre="Centro Logístico Internacional",
                ciudad="Bogotá",
                direccion="El Dorado Cargo Zone",
                capacidad=8000,
                tipo=TipoBodega.INTERNACIONAL,
            ),
        ]
        db.add_all(bodegas)

        # Puertos
        puertos = [
            Puerto(
                nombre="Puerto de Buenaventura",
                ciudad="Buenaventura",
                pais="Colombia",
                codigo="BUN",
                tipo=TipoPuerto.NACIONAL,
            ),
            Puerto(
                nombre="Puerto de Cartagena",
                ciudad="Cartagena",
                pais="Colombia",
                codigo="CTG",
                tipo=TipoPuerto.NACIONAL,
            ),
            Puerto(
                nombre="Port of Miami",
                ciudad="Miami",
                pais="Estados Unidos",
                codigo="MIA",
                tipo=TipoPuerto.INTERNACIONAL,
            ),
        ]
        db.add_all(puertos)

        db.flush()  # asigna IDs sin commit para poder referenciar FKs

        # Envíos terrestres de ejemplo
        hoy = date.today()
        envios_t = [
            EnvioTerrestre(
                numero_guia="TRR0000001",
                cliente_id=clientes[0].id,
                producto_id=productos[0].id,
                bodega_id=bodegas[0].id,
                cantidad=15,
                fecha_registro=hoy,
                fecha_entrega=hoy + timedelta(days=3),
                precio_envio=Decimal("250000"),
                descuento_pct=Decimal("5.00"),
                precio_final=Decimal("237500"),
                placa="ABC123",
                estado=EstadoEnvio.EN_TRANSITO,
            ),
            EnvioTerrestre(
                numero_guia="TRR0000002",
                cliente_id=clientes[1].id,
                producto_id=productos[2].id,
                bodega_id=bodegas[1].id,
                cantidad=5,
                fecha_registro=hoy,
                fecha_entrega=hoy + timedelta(days=2),
                precio_envio=Decimal("120000"),
                descuento_pct=Decimal("0.00"),
                precio_final=Decimal("120000"),
                placa="XYZ789",
                estado=EstadoEnvio.PENDIENTE,
            ),
        ]
        db.add_all(envios_t)

        # Envíos marítimos de ejemplo
        envios_m = [
            EnvioMaritimo(
                numero_guia="MAR0000001",
                cliente_id=clientes[2].id,
                producto_id=productos[1].id,
                puerto_id=puertos[0].id,
                cantidad=20,
                fecha_registro=hoy,
                fecha_entrega=hoy + timedelta(days=15),
                precio_envio=Decimal("1500000"),
                descuento_pct=Decimal("3.00"),
                precio_final=Decimal("1455000"),
                numero_flota="BCO1234A",
                estado=EstadoEnvio.PENDIENTE,
            ),
        ]
        db.add_all(envios_m)

        db.commit()
        print(
            "Seed completado: usuarios, clientes, productos, bodegas, puertos y envíos de ejemplo insertados."
        )

    except Exception as e:
        db.rollback()
        print(f"Error en seed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
