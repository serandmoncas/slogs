# Contexto de sesión — SLOGS

_Última actualización: 2026-05-07_

## Estado

**HECHO** — El diseño fue completado y aprobado. El spec está en:
`docs/superpowers/specs/2026-05-07-slogs-design.md`

**PENDIENTE** — Escribir el plan de implementación en:
`docs/superpowers/plans/2026-05-07-slogs-implementation.md`

---

## Decisiones tomadas (no volver a preguntar)

| Decisión | Resultado |
|---|---|
| Backend framework | FastAPI |
| Base de datos | PostgreSQL |
| Arquitectura | Monorepo Opción A (backend/ + frontend/ separados) |
| Frontend | Next.js 14 App Router + TypeScript |
| Auth | JWT Bearer (python-jose + bcrypt) |
| Deploy | Railway (backend) + Vercel (frontend) |
| Orquestación | Docker Compose |

---

## Stack completo

```
backend/    FastAPI 0.115 + SQLAlchemy 2 + Alembic + Pydantic v2
frontend/   Next.js 14 App Router + TypeScript + React Query
db/         PostgreSQL 16
auth/       JWT HS256 30min + bcrypt passwords
deploy/     Docker Compose local | Railway + Vercel prod
```

---

## Diseño de datos (entidades)

- `users` — auth
- `clientes` — nit unique
- `productos` — catálogo
- `bodegas` — tipo NACIONAL/INTERNACIONAL
- `puertos` — tipo NACIONAL/INTERNACIONAL
- `envios_terrestres` — placa `[A-Z]{3}[0-9]{3}`, descuento 5% si cantidad>10
- `envios_maritimos` — flota `[A-Z]{3}[0-9]{4}[A-Z]`, descuento 3% si cantidad>10

Tablas separadas (no herencia). `numero_guia` único en cada tabla.

---

## API endpoints (todos bajo /api/v1)

```
POST  /auth/register | /auth/login | GET /auth/me
CRUD  /clientes | /productos | /bodegas | /puertos
CRUD  /envios/terrestres | /envios/maritimos
GET   /dashboard/stats
```

Patrones de error: `{ "detail": "mensaje" }` con códigos 400/401/403/404/409/422/500

---

## Frontend pages

Login (radar SVG) → Dashboard (KPIs + mapa Colombia) → Terrestres/Marítimos (lista+crear+editar) → Clientes/Productos/Bodegas/Puertos (CRUD)

Design system: inline styles, fondo `#0B1220`, accent `#F59E0B`, fuentes Barlow Condensed + IBM Plex Sans + JetBrains Mono

---

## Patrones de arquitectura backend

```
Router → Service (reglas de negocio) → Repository (BD)
```

- Repository Pattern en `backend/app/repositories/`
- Service Layer en `backend/app/services/`
- Dependency Injection con `Depends()`
- Schemas separados: Create / Update / Response

---

## Lo que hay que hacer en la próxima sesión

1. Escribir directamente el archivo `docs/superpowers/plans/2026-05-07-slogs-implementation.md`
2. Implementar las 9 épicas del backlog:
   - Epic 1: Infraestructura (monorepo, Docker Compose)
   - Epic 2: BD y modelos SQLAlchemy + Alembic
   - Epic 3: Auth (register, login, JWT)
   - Epic 4: CRUD maestros (clientes, productos, bodegas, puertos)
   - Epic 5: Envíos terrestres + marítimos con reglas de negocio
   - Epic 6: Design system components TypeScript
   - Epic 7: Páginas frontend
   - Epic 8: Integración frontend ↔ backend
   - Epic 9: Documentación, E-R, README, deploy
