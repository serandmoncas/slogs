# ADR-002 — Tablas separadas para envíos terrestres y marítimos

**Estado:** Aceptado  
**Fecha:** 2026-05-07

---

## Contexto

Los envíos tienen atributos comunes (numero_guia, cliente, producto, cantidad, precio, estado) pero también atributos específicos:
- Terrestres: `placa` (regex `^[A-Z]{3}[0-9]{3}$`), `bodega_id`
- Marítimos: `numero_flota` (regex `^[A-Z]{3}[0-9]{4}[A-Z]$`), `puerto_id`

También tienen reglas de negocio distintas: descuento 5% vs 3%.

## Decisión

**Dos tablas separadas**: `envios_terrestres` y `envios_maritimos`.

## Alternativas descartadas

**Tabla única con NULLs** (`tipo ENUM, placa NULLABLE, numero_flota NULLABLE`):
- Columnas siempre vacías según el tipo → degrada la integridad de datos
- Las constraints de NOT NULL no se pueden aplicar condicionalmente en SQL estándar
- Queries con `WHERE tipo = 'TERRESTRE'` en cada consulta

**Herencia de tablas PostgreSQL** (`envios` + `envios_terrestres` heredando):
- Complejidad de queries: JOINs implícitos
- Las ORMs (SQLAlchemy) tienen soporte limitado y quirky para herencia de tablas
- Dificulta las migraciones Alembic

**ORM Single Table Inheritance** (SQLAlchemy):
- Mismo problema que tabla única con NULLs, solo abstracto a nivel ORM

## Consecuencias

- ✅ Constraints de NOT NULL aplicadas estrictamente en cada tabla
- ✅ Queries simples sin filtros de tipo ni columnas nulas
- ✅ Reglas de negocio (descuento 5% vs 3%) encapsuladas en services separados
- ✅ Índices específicos por tabla (`ix_envios_terrestres_numero_guia`)
- ⚠️ Si se añaden más tipos de envío (aéreo, fluvial), se requieren nuevas tablas
- ⚠️ El dashboard agrega conteos sumando queries de ambas tablas
