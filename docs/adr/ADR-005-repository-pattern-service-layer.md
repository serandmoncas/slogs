# ADR-005 — Repository Pattern + Service Layer

**Estado:** Aceptado  
**Fecha:** 2026-05-07

---

## Contexto

Diseño de la arquitectura de capas interna del backend. El principal riesgo era mezclar lógica de negocio, acceso a datos y manejo HTTP en los mismos módulos (antipatrón "fat controller").

## Decisión

Tres capas estrictamente separadas:

```
Router (HTTP)  →  Service (Negocio)  →  Repository (Datos)
```

Con la regla: **cada capa solo conoce la capa inmediatamente siguiente**.

## Responsabilidades

**Router** (`routers/`):
- Mapear rutas HTTP y métodos
- Delegar a schemas Pydantic la validación de entrada
- Llamar al Service y retornar la respuesta con el código HTTP correcto
- _Nunca toca SQLAlchemy directamente_

**Service** (`services/`):
- Contener todas las reglas de negocio (descuentos, unicidad, estados)
- Lanzar `HTTPException` con mensajes descriptivos en español
- Coordinar múltiples llamadas al Repository cuando es necesario
- _Nunca conoce rutas HTTP ni status codes de forma directa_

**Repository** (`repositories/`):
- Construir queries SQLAlchemy
- Retornar objetos del dominio (modelos SQLAlchemy)
- _Nunca contiene lógica de negocio ni lanza HTTPException_

## Por qué no Active Record (Django ORM style)

Active Record pone lógica en los modelos (`user.save()`, `user.set_password()`), lo que dificulta la separación y el testing. El Repository Pattern es más verboso pero permite testear el Service con un Repository falso (o real en tests de integración) sin tocar la BD de producción.

## Unit of Work implícito

SQLAlchemy Session actúa como Unit of Work: acumula cambios en memoria y los aplica en una sola transacción en el `db.commit()`. Los tests usan `transaction.rollback()` para aislar cada test sin limpiar datos manualmente.

## Consecuencias

- ✅ El Service Layer es testeable en aislamiento
- ✅ Cambiar la BD (ej. de PostgreSQL a MySQL) solo requiere tocar repositories
- ✅ Las reglas de negocio están en un solo lugar — el Service
- ✅ Separación de responsabilidades clara — cumple principio Single Responsibility (SOLID)
- ⚠️ Más archivos y más capas que un enfoque "flat"
- ⚠️ Para operaciones simples CRUD, las capas pueden sentirse redundantes
