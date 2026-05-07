# SLOGS — Siata Logistics: Diseño del Sistema

_Spec aprobado: 2026-05-07_

---

## Contexto y objetivo

Sistema de gestión logística para **SIATA Logistics** que cubre envíos terrestres y marítimos. Prueba técnica nivel Senior: se implementan todos los ítems requeridos y todos los bonus opcionales.

**Stack:**
- Backend: FastAPI 0.115 + SQLAlchemy 2 + Alembic + PostgreSQL 16
- Frontend: Next.js 14 App Router + TypeScript
- Auth: JWT Bearer (python-jose + bcrypt)
- Contenedores: Docker Compose
- Deploy: Railway (backend) + Vercel (frontend)

---

## Arquitectura general

Monorepo con separación real backend/frontend, orquestado con Docker Compose.

```
slogs/
├── backend/
├── frontend/
├── docs/
├── docker-compose.yml
└── README.md
```

**Patrón de capas (backend):**
```
Router (HTTP) → Service (lógica de negocio) → Repository (BD)
```
Cada capa solo conoce la siguiente. El router nunca toca SQLAlchemy. El repositorio nunca conoce reglas de negocio.

---

## Modelo de datos

### Entidades

**users**
- id, email (unique), hashed_password, nombre, rol, is_active, created_at

**clientes**
- id, nombre, nit (unique), email, telefono, direccion, ciudad, created_at

**productos**
- id, nombre, descripcion, categoria, created_at

**bodegas**
- id, nombre, ciudad, direccion, capacidad, tipo (NACIONAL/INTERNACIONAL), created_at

**puertos**
- id, nombre, ciudad, pais, codigo (unique), tipo (NACIONAL/INTERNACIONAL), created_at

**envios_terrestres**
- id, numero_guia VARCHAR(10) UNIQUE, cliente_id FK, producto_id FK, bodega_id FK
- cantidad INT (> 0), fecha_registro DATE (auto), fecha_entrega DATE
- precio_envio NUMERIC(12,2), descuento_pct NUMERIC(4,2), precio_final NUMERIC(12,2)
- placa VARCHAR(6) — regex `^[A-Z]{3}[0-9]{3}$`
- estado ENUM(PENDIENTE, EN_TRÁNSITO, ENTREGADO, CANCELADO)
- created_at, updated_at

**envios_maritimos**
- id, numero_guia VARCHAR(10) UNIQUE, cliente_id FK, producto_id FK, puerto_id FK
- cantidad INT (> 0), fecha_registro DATE (auto), fecha_entrega DATE
- precio_envio NUMERIC(12,2), descuento_pct NUMERIC(4,2), precio_final NUMERIC(12,2)
- numero_flota VARCHAR(8) — regex `^[A-Z]{3}[0-9]{4}[A-Z]$`
- estado ENUM(PENDIENTE, EN_TRÁNSITO, ENTREGADO, CANCELADO)
- created_at, updated_at

### Decisión de diseño
Tablas separadas para terrestres y marítimos (no herencia). Más simple de consultar, sin JOINs adicionales, adecuado para esta escala.

---

## Reglas de negocio

Implementadas exclusivamente en el **service layer** del backend. El frontend las refleja como UX inmediata pero el backend es fuente de verdad.

1. `precio_final = precio_envio * (1 - descuento_pct / 100)`
2. Descuento terrestre: `5%` si `cantidad > 10`, else `0%`
3. Descuento marítimo: `3%` si `cantidad > 10`, else `0%`
4. `numero_guia` debe ser único — validado antes de INSERT con 409 en conflicto
5. `cantidad` debe ser `> 0` — validado con Pydantic (gt=0)
6. `placa` regex `^[A-Z]{3}[0-9]{3}$` — validado con Pydantic validator
7. `numero_flota` regex `^[A-Z]{3}[0-9]{4}[A-Z]$` — validado con Pydantic validator
8. `fecha_registro` se asigna automáticamente al crear (no editable)

---

## API REST (`/api/v1`)

### Auth
```
POST  /auth/register
POST  /auth/login        → { access_token, token_type }
GET   /auth/me
```

### CRUD maestros (mismo patrón para clientes, productos, bodegas, puertos)
```
GET    /{recurso}          Lista paginada + búsqueda (?q=, ?page=, ?size=)
POST   /{recurso}          Crear                        → 201
GET    /{recurso}/{id}     Detalle                      → 200 | 404
PUT    /{recurso}/{id}     Actualizar                   → 200 | 404 | 422
DELETE /{recurso}/{id}     Eliminar                     → 204 | 404
```

### Envíos
```
GET    /envios/terrestres          Lista con filtros (estado, fecha, cliente_id)
POST   /envios/terrestres          Crear — descuento se calcula automáticamente → 201
GET    /envios/terrestres/{id}
PUT    /envios/terrestres/{id}
DELETE /envios/terrestres/{id}
                                   (mismo patrón para /envios/maritimos)
GET    /dashboard/stats            KPIs agregados
```

### Códigos HTTP
| Código | Cuándo |
|--------|--------|
| 200 | GET / PUT exitoso |
| 201 | POST exitoso |
| 204 | DELETE exitoso |
| 400 | Error de negocio (placa inválida, etc.) |
| 401 | Token ausente o expirado |
| 403 | Sin permisos |
| 404 | Recurso no encontrado |
| 409 | numero_guia duplicado |
| 422 | Error de validación Pydantic |
| 500 | Error interno |

Todas las respuestas de error siguen el formato:
```json
{ "detail": "Mensaje descriptivo en español" }
```

---

## Autenticación y seguridad

- JWT HS256, access token 30 min
- Contraseñas con bcrypt (passlib)
- Todas las rutas excepto `/auth/login` y `/auth/register` requieren Bearer token
- FastAPI `Depends(get_current_user)` valida el token en cada request protegido
- Frontend almacena token en httpOnly cookie (no localStorage — XSS safe)

---

## Frontend (Next.js 14 App Router)

### Páginas
```
(auth)/login/                   Split-screen con radar SVG animado
(app)/dashboard/                KPIs + mapa Colombia SVG + feed actividad
(app)/terrestres/               Lista filtrable con paginación
(app)/terrestres/nuevo/         Formulario + panel resumen sticky
(app)/terrestres/[id]/          Editar
(app)/maritimos/                Lista
(app)/maritimos/nuevo/
(app)/maritimos/[id]/
(app)/clientes/                 CRUD completo
(app)/clientes/nuevo/
(app)/clientes/[id]/
(app)/productos/                CRUD completo
(app)/bodegas/                  CRUD completo
(app)/puertos/                  CRUD completo
```

### Componentes clave
- `Sidebar` — navegación SPA con router.push(), active state, status widget
- `Header` — breadcrumb, reloj en vivo, user badge, logout
- `StatusBadge` — colores semánticos por estado
- `DiscountBadge` — badge verde "5% OFF" / "3% OFF"
- `KpiCard` — valor grande, delta vs ayer, ícono
- `DataTable` — tabla genérica con render functions tipadas
- `FormInput` / `FormSelect` — validación visual en vivo (ok/err/hint)
- `ColombiaMap` — SVG animado con rutas y partículas

### Sistema de estilos
Inline styles puros (fiel al diseño de Claude Design). Paleta:
- Background: `#0B1220`, Panels: `#0E1626`, Sidebar: `#0A111E`
- Accent amber: `#F59E0B`, Blue: `#60A5FA`, Green: `#4ADE80`, Red: `#F87171`
- Fuentes: Barlow Condensed (display) / IBM Plex Sans (body) / JetBrains Mono (datos)

### Gestión de estado
- React Query para fetching, caché y loading states
- Estado local con useState para formularios
- No se introduce Redux/Zustand (YAGNI)

---

## Despliegue

```yaml
# docker-compose.yml
services:
  db:        postgres:16        → puerto 5432
  backend:   ./backend          → puerto 8000
  frontend:  ./frontend         → puerto 3000
```

Un solo `docker-compose up --build` levanta el stack completo.

**Deploy público:**
- Backend → Railway (Docker nativo, PostgreSQL gestionado)
- Frontend → Vercel (integración Next.js nativa)

---

## Documentación entregable

| Artefacto | Ubicación |
|-----------|-----------|
| Diagrama E-R | `docs/er-diagram.png` |
| Script SQL de creación | `docs/schema.sql` |
| Migraciones Alembic | `backend/alembic/versions/` |
| API docs interactiva | `http://localhost:8000/docs` (Swagger UI) |
| Justificación técnica | `README.md` |
| Buenas prácticas | `README.md` sección dedicada |

---

## Patrones de diseño aplicados

| Patrón | Dónde | Por qué |
|--------|-------|---------|
| Repository Pattern | `backend/app/repositories/` | Desacopla BD del service layer |
| Service Layer | `backend/app/services/` | Centraliza reglas de negocio |
| Dependency Injection | FastAPI `Depends()` | Auth y DB session por request |
| DTO / Schema separation | Pydantic: Create / Update / Response schemas distintos | Evita over-posting |
| SPA routing | Next.js App Router | Navegación sin recarga |

---

## Backlog (épicas)

- **Epic 1 — Infraestructura:** Monorepo, Docker Compose, CI básico
- **Epic 2 — BD y modelos:** Entidades SQLAlchemy, migraciones Alembic, script SQL
- **Epic 3 — Auth:** Register, login, JWT middleware
- **Epic 4 — CRUD maestros:** Clientes, Productos, Bodegas, Puertos
- **Epic 5 — Envíos:** Terrestres y Marítimos con reglas de negocio
- **Epic 6 — Design system:** Componentes UI del diseño Claude Design → TypeScript
- **Epic 7 — Páginas frontend:** Login, Dashboard, Terrestres, Marítimos, maestros
- **Epic 8 — Integración:** Frontend ↔ Backend, React Query
- **Epic 9 — Documentación y deploy:** E-R, README, Docker, Railway/Vercel
