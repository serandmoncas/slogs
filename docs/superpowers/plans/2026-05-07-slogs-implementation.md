# SLOGS — Plan de Implementación

_Plan: 2026-05-07 | Spec: [2026-05-07-slogs-design.md](../specs/2026-05-07-slogs-design.md)_

---

## Secuencia de Épicas

```
E1 Infra → E2 BD → E3 Auth → E4 CRUD Maestros → E5 Envíos → E6 Design System → E7 Páginas → E8 Integración → E9 Docs & Deploy
```

Cada épica está lista cuando sus tests corren en verde y el linter no arroja errores.

---

## Epic 1 — Infraestructura

**Objetivo:** Monorepo corriendo con un solo `docker-compose up --build`.

### Tareas

**1.1 Scaffold monorepo**
- Crear estructura de directorios raíz: `backend/`, `frontend/`, `docs/`, `scripts/`
- `.gitignore` global (Python, Node, Docker)
- `README.md` con instrucciones mínimas de arranque

**1.2 Docker Compose**
- `docker-compose.yml` con servicios: `db` (postgres:16), `backend`, `frontend`
- Variables de entorno vía `.env` (no hardcoded): `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS`
- Healthcheck en `db` antes de levantar `backend`
- Volumes nombrados para persistencia de BD en desarrollo

**1.3 Backend scaffold (FastAPI)**
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI app, CORS, routers mount
│   ├── config.py        # Settings via pydantic-settings
│   ├── database.py      # Engine, SessionLocal, get_db
│   ├── models/          # SQLAlchemy models
│   ├── schemas/         # Pydantic schemas
│   ├── repositories/    # Repository pattern
│   ├── services/        # Business logic
│   └── routers/         # FastAPI routers
├── alembic/
│   ├── alembic.ini
│   └── versions/
├── tests/
├── Dockerfile
├── requirements.txt
└── .env.example
```
- `requirements.txt`: fastapi, uvicorn[standard], sqlalchemy, alembic, psycopg2-binary, pydantic-settings, python-jose[cryptography], passlib[bcrypt], pytest, httpx

**1.4 Frontend scaffold (Next.js 14)**
```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/login/
│   │   └── (app)/dashboard/
│   ├── components/
│   ├── lib/
│   │   ├── api.ts       # axios instance con interceptors
│   │   └── auth.ts      # token helpers
│   └── types/
├── Dockerfile
├── next.config.js
├── tsconfig.json
└── package.json
```
- `package.json` deps: next, react, typescript, @tanstack/react-query, axios

**Verificación E1:**
- [ ] `docker-compose up --build` levanta los 3 servicios sin errores
- [ ] `GET http://localhost:8000/` retorna `{"status": "ok"}`
- [ ] `GET http://localhost:3000/` retorna HTML de Next.js
- [ ] `psql` conecta a la BD en puerto 5432

---

## Epic 2 — Base de Datos y Modelos

**Objetivo:** Schema completo en BD vía Alembic, script SQL exportado.

### Tareas

**2.1 Modelos SQLAlchemy**

Archivo `backend/app/models/base.py`:
- `Base = declarative_base()`
- Mixin `TimestampMixin` con `created_at`, `updated_at` (auto via `server_default`, `onupdate`)

Modelos (uno por archivo en `models/`):
- `user.py` — `User`: id, email (unique, indexed), hashed_password, nombre, rol, is_active
- `cliente.py` — `Cliente`: id, nombre, nit (unique), email, telefono, direccion, ciudad
- `producto.py` — `Producto`: id, nombre, descripcion, categoria
- `bodega.py` — `Bodega`: id, nombre, ciudad, direccion, capacidad, tipo (Enum: NACIONAL/INTERNACIONAL)
- `puerto.py` — `Puerto`: id, nombre, ciudad, pais, codigo (unique), tipo (Enum)
- `envio_terrestre.py` — `EnvioTerrestre`: todos los campos del spec + FKs (cliente, producto, bodega) + Enum estado
- `envio_maritimo.py` — `EnvioMaritimo`: todos los campos + FKs (cliente, producto, puerto) + Enum estado

Enums Python (`models/enums.py`):
```python
class TipoBodega(str, Enum): NACIONAL = "NACIONAL"; INTERNACIONAL = "INTERNACIONAL"
class EstadoEnvio(str, Enum): PENDIENTE = "PENDIENTE"; EN_TRANSITO = "EN_TRÁNSITO"; ENTREGADO = "ENTREGADO"; CANCELADO = "CANCELADO"
```

**2.2 Migración Alembic inicial**
- `alembic init alembic` + configurar `env.py` para leer `DATABASE_URL` de `.env`
- `alembic revision --autogenerate -m "initial_schema"`
- Revisar migración generada (sin ops manuales si autogenerate es correcto)
- `alembic upgrade head` dentro del contenedor Docker

**2.3 Script SQL**
- `docs/schema.sql` — exportar con `pg_dump --schema-only` tras migración exitosa

**2.4 Seeder de desarrollo**
- `scripts/seed_dev.py` — inserta usuarios demo, clientes, productos, bodegas, puertos de ejemplo
- Ejecutable con `python scripts/seed_dev.py`

**Verificación E2:**
- [ ] `alembic upgrade head` sin errores
- [ ] `\dt` en psql muestra las 7 tablas
- [ ] `docs/schema.sql` existe y es válido
- [ ] Seeder inserta sin errores

---

## Epic 3 — Autenticación

**Objetivo:** Register, login con JWT, middleware Depends en todas las rutas protegidas.

### Tareas

**3.1 Schemas Pydantic (auth)**
`schemas/user.py`:
- `UserCreate`: email, password, nombre
- `UserResponse`: id, email, nombre, rol, is_active
- `Token`: access_token, token_type
- `TokenData`: email (campo del payload JWT)

**3.2 Repository — UserRepository**
`repositories/user_repo.py`:
- `get_by_email(db, email) → User | None`
- `create(db, user_create) → User` (hashea password con bcrypt)
- `get_by_id(db, id) → User | None`

**3.3 Service — AuthService**
`services/auth_service.py`:
- `register(db, user_create) → User` — verifica email único (409), llama repo
- `authenticate(db, email, password) → User | None` — bcrypt verify
- `create_access_token(data, expires_delta) → str` — HS256, exp 30 min
- `get_current_user(token, db) → User` — decode JWT, busca user, lanza 401 si inválido

**3.4 Router — /api/v1/auth**
`routers/auth.py`:
- `POST /register` → `UserResponse` 201
- `POST /login` → `Token` 200 (form: email + password)
- `GET /me` → `UserResponse` (requiere `Depends(get_current_user)`)

**3.5 Dependency inyectable**
`app/dependencies.py`:
- `get_current_user` como `Depends` reutilizable por todos los routers

**3.6 Tests de auth**
`tests/test_auth.py`:
- Test register exitoso, email duplicado (409)
- Test login exitoso, credenciales incorrectas (401)
- Test `/me` con token válido e inválido

**Verificación E3:**
- [ ] `POST /api/v1/auth/register` crea user, retorna 201
- [ ] `POST /api/v1/auth/login` retorna `access_token`
- [ ] `GET /api/v1/auth/me` con token válido retorna user
- [ ] `GET /api/v1/auth/me` sin token retorna 401
- [ ] Todos los tests de auth en verde

---

## Epic 4 — CRUD Maestros

**Objetivo:** CRUD completo (List/Create/Get/Update/Delete) para Clientes, Productos, Bodegas, Puertos.

### Patrón por recurso (repetir 4 veces)

Para cada recurso `X` en `{clientes, productos, bodegas, puertos}`:

**4.x.1 Schemas**
`schemas/x.py`:
- `XCreate`: campos requeridos para crear
- `XUpdate`: mismos campos como `Optional`
- `XResponse`: id + todos los campos + created_at
- `XListResponse`: items: List[XResponse], total, page, size

**4.x.2 Repository**
`repositories/x_repo.py`:
- `list(db, q, page, size) → tuple[list[X], int]` — ILIKE en nombre/nit si q
- `create(db, data) → X`
- `get_by_id(db, id) → X | None`
- `update(db, id, data) → X | None`
- `delete(db, id) → bool`

**4.x.3 Service**
`services/x_service.py`:
- Wrap de repo + validación de unicidad donde aplique
- Lanza `HTTPException(404)` si no existe
- Lanza `HTTPException(409)` si duplicado único (nit para cliente, codigo para puerto)

**4.x.4 Router**
`routers/x.py`:
- `GET /api/v1/xs?q=&page=1&size=20` → `XListResponse`
- `POST /api/v1/xs` → `XResponse` 201
- `GET /api/v1/xs/{id}` → `XResponse` | 404
- `PUT /api/v1/xs/{id}` → `XResponse` | 404
- `DELETE /api/v1/xs/{id}` → 204 | 404
- Todos con `Depends(get_current_user)`

**4.x.5 Tests**
`tests/test_x.py`: CRUD completo + casos borde (404, 409, lista vacía, paginación)

**Verificación E4:**
- [ ] Los 4 recursos tienen endpoints funcionales
- [ ] Paginación y búsqueda funcionan
- [ ] Tests de cada recurso en verde
- [ ] Swagger UI en `/docs` muestra todos los endpoints

---

## Epic 5 — Envíos Terrestres y Marítimos

**Objetivo:** CRUD de envíos con reglas de negocio: descuento automático, validaciones de formato.

### Tareas

**5.1 Schemas — EnvioTerrestre**
`schemas/envio_terrestre.py`:
- `EnvioTerrestreCreate`: numero_guia, cliente_id, producto_id, bodega_id, cantidad (gt=0), fecha_entrega, precio_envio, placa (regex `^[A-Z]{3}[0-9]{3}$`)
- Validador Pydantic para `placa` con `@validator` o `@field_validator`
- `EnvioTerrestreUpdate`: mismos campos Optional (excepto fecha_registro y precio_final)
- `EnvioTerrestreResponse`: todos + precio_final calculado + descuento_pct + cliente/producto/bodega anidados

**5.2 Schemas — EnvioMaritimo**
`schemas/envio_maritimo.py`:
- Similar a terrestre pero: `puerto_id` en lugar de `bodega_id`, `numero_flota` (regex `^[A-Z]{3}[0-9]{4}[A-Z]$`)

**5.3 Service — EnvioTerrestreService (reglas de negocio)**
`services/envio_terrestre_service.py`:
```python
def calcular_descuento(cantidad: int) -> Decimal:
    return Decimal("5.00") if cantidad > 10 else Decimal("0.00")

def calcular_precio_final(precio_envio: Decimal, descuento_pct: Decimal) -> Decimal:
    return precio_envio * (1 - descuento_pct / 100)
```
- `crear_envio(db, data)`: calcula descuento y precio_final, verifica numero_guia único (409), asigna fecha_registro = today
- `actualizar_envio(db, id, data)`: recalcula precio si cambian cantidad o precio_envio

**5.4 Service — EnvioMaritimoService**
- Mismo patrón, descuento marítimo = 3% si cantidad > 10

**5.5 Routers**
`routers/envios.py`:
- `GET /api/v1/envios/terrestres?estado=&fecha_inicio=&fecha_fin=&cliente_id=`
- `POST /api/v1/envios/terrestres` → 201
- `GET /api/v1/envios/terrestres/{id}`
- `PUT /api/v1/envios/terrestres/{id}`
- `DELETE /api/v1/envios/terrestres/{id}`
- (mismo patrón para `/envios/maritimos`)

**5.6 Dashboard endpoint**
`routers/dashboard.py`:
- `GET /api/v1/dashboard/stats`:
  ```json
  {
    "total_envios": 142,
    "terrestres": 89,
    "maritimos": 53,
    "entregados_hoy": 7,
    "ingresos_mes": 450000.00,
    "por_estado": {"PENDIENTE": 20, "EN_TRÁNSITO": 45, ...}
  }
  ```
  Calculado con queries agregadas en SQL (un solo trip a BD).

**5.7 Tests de envíos**
`tests/test_envios.py`:
- Descuento terrestre: cantidad=11 → 5%, cantidad=10 → 0%
- Descuento marítimo: cantidad=11 → 3%, cantidad=10 → 0%
- precio_final correcto en ambos casos
- placa inválida → 422
- numero_flota inválido → 422
- numero_guia duplicado → 409
- Filtros por estado y fecha

**Verificación E5:**
- [ ] Descuentos calculados correctamente en ambos tipos
- [ ] Validaciones de formato rechazan valores inválidos con 422
- [ ] Dashboard retorna todos los KPIs
- [ ] Tests en verde

---

## Epic 6 — Design System Frontend

**Objetivo:** Todos los componentes UI reutilizables antes de construir páginas.

### Componentes a implementar (en `src/components/`)

**6.1 Layout**
- `Sidebar.tsx` — navegación con `usePathname()` para active state, links a todas las secciones, status widget en la parte inferior
- `Header.tsx` — breadcrumb dinámico, reloj en vivo (`useEffect` con setInterval), user badge, botón logout
- `AppLayout.tsx` — wrapper que compone Sidebar + Header + `{children}`

**6.2 Primitivos**
- `StatusBadge.tsx` — `status: EstadoEnvio` → badge con color semántico (PENDIENTE=amber, EN_TRÁNSITO=blue, ENTREGADO=green, CANCELADO=red)
- `DiscountBadge.tsx` — `pct: number` → badge verde "5% OFF" | nada si 0%
- `KpiCard.tsx` — `{ label, value, delta, icon }` → tarjeta con valor grande y flecha de tendencia
- `FormInput.tsx` — `{ name, label, error, hint }` → input con estado visual ok/err/hint
- `FormSelect.tsx` — mismo patrón para selects
- `LoadingSpinner.tsx` — spinner para estados de carga

**6.3 DataTable**
`DataTable.tsx` (genérico tipado):
```typescript
interface Column<T> {
  key: keyof T | string
  label: string
  render?: (row: T) => React.ReactNode
}
interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  emptyMessage?: string
}
```

**6.4 ColombiaMap**
`ColombiaMap.tsx` — SVG inline de Colombia con:
- Departamentos como paths con hover state
- Partículas animadas representando rutas activas (CSS animation)
- Props: `rutas: { origen: string, destino: string }[]`

**6.5 Paleta y tokens**
`lib/styles.ts` — objeto con todos los colores del spec:
```typescript
export const colors = {
  bg: '#0B1220', panel: '#0E1626', sidebar: '#0A111E',
  amber: '#F59E0B', blue: '#60A5FA', green: '#4ADE80', red: '#F87171',
  text: '#F1F5F9', textMuted: '#94A3B8'
}
```

**Verificación E6:**
- [ ] Todos los componentes renderizan sin errores en aislamiento (story o página test)
- [ ] DataTable funciona con cualquier tipo genérico
- [ ] No hay errores TypeScript (`tsc --noEmit`)

---

## Epic 7 — Páginas Frontend

**Objetivo:** Todas las páginas de la aplicación con UI completa.

### Tareas

**7.1 Configuración React Query**
`src/app/providers.tsx` — `QueryClientProvider` wrapper
`src/app/layout.tsx` — importa providers, fuentes Google (Barlow Condensed, IBM Plex Sans, JetBrains Mono)

**7.2 API Client**
`src/lib/api.ts`:
- Instancia axios con `baseURL = process.env.NEXT_PUBLIC_API_URL`
- Interceptor request: añade `Authorization: Bearer <token>` desde cookie
- Interceptor response: si 401, redirige a `/login`

**7.3 Auth — Login**
`src/app/(auth)/login/page.tsx`:
- Split-screen: izquierda con radar SVG animado + branding, derecha con formulario
- Submit: `POST /auth/login` → guarda token en cookie httpOnly via API route `/api/set-token`
- Next.js API route `src/app/api/set-token/route.ts` — setea cookie httpOnly
- Redirect a `/dashboard` on success

**7.4 Dashboard**
`src/app/(app)/dashboard/page.tsx`:
- Grid de 4 `KpiCard` (total envíos, ingresos, entregados hoy, en tránsito)
- `ColombiaMap` con rutas recientes
- Feed de actividad reciente (últimos 10 envíos)
- Datos desde `GET /dashboard/stats` + `GET /envios/terrestres?size=5`

**7.5 Listado de Envíos Terrestres**
`src/app/(app)/terrestres/page.tsx`:
- `DataTable` con columnas: numero_guia, cliente, producto, bodega, estado, precio_final, fecha_entrega
- Filtros: dropdown de estado, date range, búsqueda por numero_guia
- `StatusBadge` y `DiscountBadge` inline
- Botón "Nuevo Envío" → `/terrestres/nuevo`
- Paginación

**7.6 Formulario Nuevo Envío Terrestre**
`src/app/(app)/terrestres/nuevo/page.tsx`:
- Formulario con `FormInput`, `FormSelect` para cada campo
- Panel sticky derecho: resumen del envío con precio_final calculado en tiempo real (useEffect al cambiar cantidad/precio)
- Descuento badge visible si cantidad > 10
- Submit: `POST /envios/terrestres` → redirect a listado

**7.7 Editar Envío Terrestre**
`src/app/(app)/terrestres/[id]/page.tsx`:
- Misma UX que nuevo, pre-poblado con datos del envío
- Submit: `PUT /envios/terrestres/{id}`

**7.8 Páginas Marítimos** (mismo patrón que 7.5-7.7)
- `/maritimos`, `/maritimos/nuevo`, `/maritimos/[id]`
- Campo `numero_flota` en lugar de `placa`, `puerto` en lugar de `bodega`

**7.9 CRUD Maestros** (mismo patrón para los 4)
- `/clientes` — lista + nuevo + editar
- `/productos` — lista + nuevo + editar
- `/bodegas` — lista + nuevo + editar
- `/puertos` — lista + nuevo + editar

**Verificación E7:**
- [ ] Todas las páginas renderizan sin errores (`tsc --noEmit`)
- [ ] Login funciona y redirige
- [ ] Dashboard muestra KPIs (aunque sean datos de seed)
- [ ] No hay consola errors en el browser

---

## Epic 8 — Integración Frontend ↔ Backend

**Objetivo:** Flujo end-to-end funcional con datos reales.

### Tareas

**8.1 Custom hooks con React Query**
`src/hooks/`:
- `useEnviosTerrestres(filters)` — `useQuery` con invalidación por filtros
- `useCreateEnvioTerrestre()` — `useMutation` con `onSuccess: queryClient.invalidateQueries`
- `useUpdateEnvioTerrestre(id)` — `useMutation`
- `useDeleteEnvioTerrestre()` — `useMutation`
- (análogos para marítimos y cada maestro)
- `useDashboardStats()` — `useQuery` con `refetchInterval: 30000`

**8.2 Tipos TypeScript compartidos**
`src/types/`:
- `EnvioTerrestre`, `EnvioMaritimo`, `Cliente`, `Producto`, `Bodega`, `Puerto`
- `DashboardStats`
- Deben coincidir 1:1 con los schemas de respuesta del backend

**8.3 Manejo de errores**
- Toast notifications para errores de API (implementar con `useState` + portal)
- Mensaje descriptivo del campo `detail` del error del backend
- Loading states en todas las mutaciones (deshabilitar botón submit)

**8.4 CORS backend**
Verificar que `CORS_ORIGINS` en `.env` incluye `http://localhost:3000`.

**8.5 Prueba end-to-end manual**
Flujo completo a probar:
1. Registro de usuario → login
2. Crear cliente, producto, bodega
3. Crear envío terrestre con cantidad 11 → verificar 5% OFF
4. Crear envío marítimo con cantidad 11 → verificar 3% OFF
5. Cambiar estado a EN_TRÁNSITO → verificar badge actualizado
6. Dashboard muestra KPIs actualizados

**Verificación E8:**
- [ ] Flujo E2E completo sin errores en consola
- [ ] Los descuentos se muestran correctamente en el panel de resumen
- [ ] Las listas se actualizan automáticamente después de crear/editar
- [ ] El token expira y redirige a login (probar con exp corto en dev)

---

## Epic 9 — Documentación y Deploy

**Objetivo:** Entregables de documentación completos + deploy público funcional.

### Tareas

**9.1 Diagrama E-R**
- Generar con `pgAdmin` o `DBeaver` a partir del schema real
- Exportar como `docs/er-diagram.png`
- Incluir todas las relaciones FK

**9.2 README.md completo**
Secciones:
- Descripción del proyecto y objetivo
- Stack tecnológico con versiones
- Cómo correr localmente: `docker-compose up --build`, seed, URLs
- Variables de entorno requeridas (tabla)
- Arquitectura: diagrama de capas, decisiones de diseño
- Patrones aplicados (tabla del spec)
- Buenas prácticas implementadas
- Endpoints principales (link a Swagger)
- Justificación técnica: por qué estas tecnologías, por qué tablas separadas, por qué JWT, etc.

**9.3 Deploy Railway (Backend)**
- `railway.toml` o Dockerfile validado para Railway
- Variables de entorno configuradas en Railway dashboard
- PostgreSQL gestionado de Railway conectado
- `alembic upgrade head` como release command
- URL pública del backend

**9.4 Deploy Vercel (Frontend)**
- `vercel.json` si se necesita configuración especial
- `NEXT_PUBLIC_API_URL` apuntando al backend de Railway
- Deploy con `vercel --prod`
- URL pública del frontend

**9.5 Verificación final**
- [ ] `docker-compose up --build` levanta todo en un solo comando
- [ ] `docs/er-diagram.png` existe y es legible
- [ ] `docs/schema.sql` existe y es válido
- [ ] README tiene todas las secciones
- [ ] Backend en Railway responde en la URL pública
- [ ] Frontend en Vercel responde y conecta al backend
- [ ] Swagger UI accesible en `/docs`

---

## Orden de archivos a crear

### Backend (en secuencia)
```
backend/
  app/main.py
  app/config.py
  app/database.py
  app/models/base.py
  app/models/enums.py
  app/models/user.py
  app/models/cliente.py
  app/models/producto.py
  app/models/bodega.py
  app/models/puerto.py
  app/models/envio_terrestre.py
  app/models/envio_maritimo.py
  app/schemas/user.py
  app/schemas/cliente.py
  app/schemas/producto.py
  app/schemas/bodega.py
  app/schemas/puerto.py
  app/schemas/envio_terrestre.py
  app/schemas/envio_maritimo.py
  app/schemas/dashboard.py
  app/repositories/user_repo.py
  app/repositories/cliente_repo.py
  app/repositories/producto_repo.py
  app/repositories/bodega_repo.py
  app/repositories/puerto_repo.py
  app/repositories/envio_terrestre_repo.py
  app/repositories/envio_maritimo_repo.py
  app/services/auth_service.py
  app/services/cliente_service.py
  app/services/producto_service.py
  app/services/bodega_service.py
  app/services/puerto_service.py
  app/services/envio_terrestre_service.py
  app/services/envio_maritimo_service.py
  app/services/dashboard_service.py
  app/routers/auth.py
  app/routers/clientes.py
  app/routers/productos.py
  app/routers/bodegas.py
  app/routers/puertos.py
  app/routers/envios.py
  app/routers/dashboard.py
  app/dependencies.py
  alembic/env.py
  alembic/versions/001_initial_schema.py
  tests/conftest.py
  tests/test_auth.py
  tests/test_clientes.py
  tests/test_envios.py
```

### Frontend (en secuencia)
```
frontend/src/
  lib/styles.ts
  lib/api.ts
  lib/auth.ts
  types/index.ts
  hooks/useClientes.ts
  hooks/useProductos.ts
  hooks/useBodegas.ts
  hooks/usePuertos.ts
  hooks/useEnviosTerrestres.ts
  hooks/useEnviosMaritimos.ts
  hooks/useDashboard.ts
  components/Sidebar.tsx
  components/Header.tsx
  components/AppLayout.tsx
  components/StatusBadge.tsx
  components/DiscountBadge.tsx
  components/KpiCard.tsx
  components/FormInput.tsx
  components/FormSelect.tsx
  components/LoadingSpinner.tsx
  components/DataTable.tsx
  components/ColombiaMap.tsx
  app/providers.tsx
  app/layout.tsx
  app/api/set-token/route.ts
  app/(auth)/login/page.tsx
  app/(app)/layout.tsx
  app/(app)/dashboard/page.tsx
  app/(app)/terrestres/page.tsx
  app/(app)/terrestres/nuevo/page.tsx
  app/(app)/terrestres/[id]/page.tsx
  app/(app)/maritimos/page.tsx
  app/(app)/maritimos/nuevo/page.tsx
  app/(app)/maritimos/[id]/page.tsx
  app/(app)/clientes/page.tsx
  app/(app)/clientes/nuevo/page.tsx
  app/(app)/clientes/[id]/page.tsx
  app/(app)/productos/page.tsx
  app/(app)/bodegas/page.tsx
  app/(app)/puertos/page.tsx
```

---

## Dependencias entre épicas

| Si quieres implementar | Necesitas tener listo |
|------------------------|----------------------|
| E2 Modelos BD | E1 Scaffold backend |
| E3 Auth | E2 User model |
| E4 CRUD Maestros | E3 Auth (Depends) |
| E5 Envíos | E4 Clientes, Productos, Bodegas, Puertos |
| E6 Design System | E1 Scaffold frontend |
| E7 Páginas | E6 Componentes |
| E8 Integración | E4 + E5 backend, E7 páginas |
| E9 Deploy | E8 Integración completa |

E6 y E7 pueden avanzar en paralelo con E3-E5 siempre que el backend esté corriendo con datos de seed.
