# SLOGS — Siata Logistics System

Sistema de gestión de envíos terrestres y marítimos para SIATA Logistics. Prueba técnica nivel Senior — implementa todos los ítems requeridos y todos los bonus opcionales.

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Backend API | FastAPI | 0.115.5 |
| ORM | SQLAlchemy 2 | 2.0.36 |
| Migraciones | Alembic | 1.14.0 |
| Base de datos | PostgreSQL | 16 |
| Auth | python-jose + passlib[bcrypt] | JWT HS256 |
| Frontend | Next.js App Router | 14.2.18 |
| Estado servidor | React Query | 5.x |
| HTTP client | Axios | 1.x |
| Contenedores | Docker Compose | — |
| Deploy backend | Railway | — |
| Deploy frontend | Vercel | — |

---

## Cómo correr localmente

### Requisitos
- Docker Desktop ≥ 4.x
- Git

### Pasos

```bash
# 1. Clonar
git clone <repo-url> && cd slogs

# 2. Variables de entorno
cp .env.example .env
# Editar SECRET_KEY con: openssl rand -hex 32

# 3. Levantar el stack completo
docker compose up -d

# 4. Aplicar migraciones (primera vez)
docker compose exec backend alembic upgrade head

# 5. Datos de ejemplo (opcional)
docker compose exec backend python scripts/seed_dev.py
```

### URLs locales

| Servicio | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| PostgreSQL | localhost:5432 |

### Credenciales del seed

| Campo | Valor |
|---|---|
| Email | admin@siata.co |
| Contraseña | admin1234 |

---

## Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `POSTGRES_USER` | Usuario de PostgreSQL | `slogs` |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL | `slogs_dev` |
| `POSTGRES_DB` | Nombre de la base de datos | `slogs_db` |
| `DATABASE_URL` | URL de conexión SQLAlchemy | `postgresql://slogs:pass@db:5432/slogs_db` |
| `SECRET_KEY` | Clave para firmar JWT (≥32 chars) | `openssl rand -hex 32` |
| `ALGORITHM` | Algoritmo JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | TTL del token en minutos | `30` |
| `CORS_ORIGINS` | Orígenes permitidos por CORS | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | URL base del backend para el browser | `http://localhost:8000/api/v1` |

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    SLOGS Monorepo                        │
│                                                         │
│  ┌─────────────────┐      ┌─────────────────────────┐  │
│  │   Frontend       │      │      Backend             │  │
│  │  Next.js 14     │─────▶│     FastAPI 0.115        │  │
│  │  App Router     │ HTTP │                          │  │
│  │  React Query    │      │  Router → Service → Repo │  │
│  │  Inline styles  │      │                          │  │
│  └─────────────────┘      └──────────┬──────────────┘  │
│                                      │ SQLAlchemy 2     │
│                            ┌─────────▼──────────────┐  │
│                            │    PostgreSQL 16         │  │
│                            │  Migraciones: Alembic   │  │
│                            └────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Patrón de capas (backend)

```
HTTP Request
    │
    ▼
┌─────────┐     valida esquema (Pydantic)
│ Router  │     maneja códigos HTTP
└────┬────┘
     │ llama solo al service
     ▼
┌─────────┐     lógica de negocio (descuentos, unicidad)
│ Service │     lanza HTTPException con mensajes descriptivos
└────┬────┘
     │ delega acceso a datos
     ▼
┌────────────┐  queries SQLAlchemy
│ Repository │  sin lógica de negocio
└────────────┘
```

Cada capa **solo conoce la siguiente**. El router nunca toca SQLAlchemy. El repositorio nunca lanza HTTPException.

---

## Reglas de negocio implementadas

| Regla | Dónde | Detalle |
|---|---|---|
| Descuento terrestre | `envio_terrestre_service.py` | 5% si `cantidad > 10`, else 0% |
| Descuento marítimo | `envio_maritimo_service.py` | 3% si `cantidad > 10`, else 0% |
| `precio_final` | Service layer | `precio_envio × (1 - descuento_pct / 100)` |
| Guía única | Service + BD | `UNIQUE` constraint + 409 en conflicto |
| `fecha_registro` auto | Service | Asignada al crear, nunca editable |
| Validación placa | Pydantic `@field_validator` | Regex `^[A-Z]{3}[0-9]{3}$` |
| Validación flota | Pydantic `@field_validator` | Regex `^[A-Z]{3}[0-9]{4}[A-Z]$` |
| NIT único cliente | Service + BD | `UNIQUE` constraint + 409 en conflicto |
| Código único puerto | Service + BD | `UNIQUE` constraint + 409 en conflicto |

---

## Patrones de diseño aplicados

| Patrón | Dónde | Por qué |
|---|---|---|
| **Repository Pattern** | `backend/app/repositories/` | Desacopla BD del service layer; facilita testing sin BD real |
| **Service Layer** | `backend/app/services/` | Centraliza reglas de negocio; el router no conoce lógica |
| **Dependency Injection** | FastAPI `Depends()` | Auth y sesión de BD inyectadas por request; composable y testeable |
| **DTO / Schema separation** | Pydantic: `Create / Update / Response` | Evita over-posting; expone solo los campos necesarios |
| **SPA routing** | Next.js App Router | Navegación sin recarga de página completa |
| **Optimistic invalidation** | React Query `invalidateQueries` | Listas se actualizan automáticamente tras mutaciones |

---

## Buenas prácticas implementadas

**Backend:**
- Tipos estáticos con anotaciones en todos los métodos
- Enums en Python y PostgreSQL para estados y tipos (no strings libres)
- `Decimal` para precios (nunca `float`) — evita errores de punto flotante en dinero
- Separación de schemas Create/Update/Response por recurso
- Migraciones versionadas con Alembic (no `create_all` en producción)
- Tests de integración con transacciones rollback (no truncate)
- Contraseñas con bcrypt (passlib), nunca almacenadas en texto plano
- JWT con expiración de 30 minutos, validado en cada request protegido
- CORS configurado via variable de entorno (no hardcodeado)

**Frontend:**
- Token en cookie con `sameSite=strict` (no localStorage — XSS-safe)
- Auth guard en AppLayout (redirect a `/login` si no hay token)
- React Query para cache, loading states y refetch automático
- Cálculo de descuento client-side en tiempo real (UX) + validación server-side (verdad)
- Inline styles con tokens centralizados (sin CSS framework — sin dependencias de build)
- TypeScript strict en todo el frontend
- Interceptor axios para redirect automático en 401

---

## Endpoints principales

Documentación interactiva completa disponible en **http://localhost:8000/docs** (Swagger UI).

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Registrar usuario |
| `POST` | `/api/v1/auth/login` | Login → JWT |
| `GET` | `/api/v1/auth/me` | Usuario actual |
| `GET` | `/api/v1/clientes` | Lista paginada + búsqueda |
| `POST` | `/api/v1/clientes` | Crear cliente |
| `GET/PUT/DELETE` | `/api/v1/clientes/{id}` | CRUD unitario |
| `GET` | `/api/v1/productos` | Lista paginada + búsqueda |
| `GET` | `/api/v1/bodegas` | Lista paginada |
| `GET` | `/api/v1/puertos` | Lista paginada |
| `GET` | `/api/v1/envios/terrestres` | Lista con filtros (estado, fecha, cliente) |
| `POST` | `/api/v1/envios/terrestres` | Crear — descuento calculado automáticamente |
| `GET/PUT/DELETE` | `/api/v1/envios/terrestres/{id}` | CRUD unitario |
| `GET` | `/api/v1/envios/maritimos` | Lista con filtros |
| `POST` | `/api/v1/envios/maritimos` | Crear — descuento 3% automático |
| `GET/PUT/DELETE` | `/api/v1/envios/maritimos/{id}` | CRUD unitario |
| `GET` | `/api/v1/dashboard/stats` | KPIs agregados |

**Códigos de respuesta estándar:**
`200` OK · `201` Creado · `204` Eliminado · `400` Error negocio · `401` No autenticado · `404` No encontrado · `409` Conflicto único · `422` Validación Pydantic

---

## Justificación técnica

**¿Por qué FastAPI?**
Tipado nativo con Pydantic, documentación Swagger/OpenAPI generada automáticamente, rendimiento async comparable a Node.js, y ecosystem maduro para APIs REST. La curva de aprendizaje es baja para equipos Python.

**¿Por qué tablas separadas para terrestres y marítimos?**
Los envíos terrestres tienen `placa` y `bodega_id`; los marítimos tienen `numero_flota` y `puerto_id`. Modelarlos en una sola tabla requeriría columnas nullable o herencia, añadiendo complejidad sin beneficio a esta escala. Tablas separadas permiten queries simples, índices específicos y validaciones limpias.

**¿Por qué JWT HS256 y no sesiones?**
El frontend puede estar en un dominio diferente al backend (Vercel + Railway). JWT stateless elimina la necesidad de sincronizar sesiones entre instancias y es el estándar para APIs REST modernas.

**¿Por qué React Query y no Redux/Zustand?**
El estado de la aplicación es fundamentalmente *servidor-derivado* (listas de envíos, clientes, etc.). React Query resuelve exactamente ese problema con cache inteligente, refetch automático e invalidación por mutation, sin boilerplate. Redux sería sobreingeniería (YAGNI).

**¿Por qué inline styles?**
Cero dependencias de CSS framework → cero conflictos de especificidad → el diseño es 100% predecible. Los tokens de color centralizados en `lib/styles.ts` dan la misma reutilización que CSS variables, con type-safety de TypeScript.

**¿Por qué Decimal para precios?**
`float` tiene errores de representación binaria (`0.1 + 0.2 ≠ 0.3`). Para valores monetarios, Python `Decimal` y PostgreSQL `NUMERIC(12,2)` garantizan precisión exacta.

---

## Estructura del proyecto

```
slogs/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic DTOs
│   │   ├── repositories/    # Acceso a datos
│   │   ├── services/        # Lógica de negocio
│   │   ├── routers/         # Endpoints FastAPI
│   │   ├── config.py        # Settings via pydantic-settings
│   │   ├── database.py      # Engine + SessionLocal
│   │   ├── dependencies.py  # get_current_user
│   │   └── main.py          # App factory + CORS
│   ├── alembic/             # Migraciones
│   ├── scripts/             # seed_dev.py
│   ├── tests/               # pytest + httpx
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/             # Next.js App Router pages
│       ├── components/      # UI components
│       ├── hooks/           # React Query hooks
│       ├── lib/             # api.ts, auth.ts, styles.ts, format.ts
│       └── types/           # TypeScript types
├── docs/
│   ├── schema.sql           # Schema SQL exportado
│   └── er-diagram.svg       # Diagrama E-R
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Deploy

### Backend → Railway

```bash
railway login
railway init
railway link
railway variables set DATABASE_URL=... SECRET_KEY=... CORS_ORIGINS=https://tuapp.vercel.app
railway up
```

El `railway.toml` configura `alembic upgrade head` como release command automático.

### Frontend → Vercel

```bash
cd frontend
vercel --prod
# Configurar NEXT_PUBLIC_API_URL=https://tubackend.railway.app/api/v1
```
