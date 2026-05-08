# ADR-003 — FastAPI vs Django REST Framework vs Flask

**Estado:** Aceptado  
**Fecha:** 2026-05-07

---

## Contexto

Selección del framework backend para la API REST de SLOGS.

## Decisión

**FastAPI 0.115** con Pydantic v2 y SQLAlchemy 2.

## Comparativa

| Característica | FastAPI | Django REST | Flask |
|---|---|---|---|
| Documentación Swagger automática | ✅ Nativa | ⚠️ drf-spectacular | ❌ Manual |
| Validación de datos | ✅ Pydantic (tipado) | ✅ Serializers | ❌ Manual |
| Performance | ✅ ASGI async | ⚠️ WSGI sync | ⚠️ WSGI sync |
| Tipado estático | ✅ Nativo (type hints) | ⚠️ Parcial | ❌ No |
| Curva de aprendizaje | ✅ Baja | ⚠️ Media-Alta | ✅ Baja |
| Inyección de dependencias | ✅ `Depends()` nativo | ⚠️ Manual | ❌ Manual |
| ORM integrado | ❌ Se elige (SQLAlchemy) | ✅ Django ORM | ❌ Se elige |
| Ecosistema enterprise | ⚠️ Creciente | ✅ Maduro | ⚠️ Fragmentado |

## Por qué FastAPI sobre Django

Django REST Framework (DRF) es el estándar enterprise en Python, pero para una API REST pura sin templates ni admin Django es over-engineered. FastAPI produce código más conciso, la Swagger UI se genera automáticamente, y el sistema de `Depends()` para inyección de dependencias (auth, DB session) es elegante y testeable.

## Por qué SQLAlchemy sobre Django ORM

Django ORM está atado al ecosistema Django. SQLAlchemy 2 es agnóstico al framework, soporta el patrón Repository explícito que buscamos, y tiene mejor soporte para tipos avanzados de PostgreSQL (ENUM nativo, JSONB).

## Uso correcto de librerías del lenguaje

En lugar de implementar validaciones manualmente con condicionales (`if not re.match(...)`), se usan los mecanismos del framework:
- Pydantic `@field_validator` para regex de placa/flota
- Pydantic `Field(gt=0)` para cantidad positiva
- FastAPI `Depends()` para auth middleware
- SQLAlchemy `mapped_column` con anotaciones de tipo Python nativas

## Consecuencias

- ✅ Swagger UI en `/docs` sin configuración adicional
- ✅ Errores de validación automáticos con mensajes descriptivos (422)
- ✅ Separación limpia de schemas (Create/Update/Response) vía Pydantic
- ⚠️ Sin admin panel integrado (Django lo incluye gratis)
- ⚠️ Ecosistema más joven que Django para plugins de terceros
