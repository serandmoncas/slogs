# SLOGS — Guía de Presentación Técnica

**Candidato:** Sergio Monsalve  
**Cargo:** Desarrollador Fullstack Senior  
**Duración estimada:** 45–60 minutos

---

## Estructura de la presentación

| # | Sección | Tiempo |
|---|---|---|
| 1 | Intro y contexto del problema | 3 min |
| 2 | Decisiones de arquitectura (ADRs) | 8 min |
| 3 | Demo en vivo — requerimientos obligatorios | 15 min |
| 4 | Demo en vivo — bonus | 8 min |
| 5 | Profundización técnica | 10 min |
| 6 | Actividades adicionales entregadas | 5 min |
| 7 | Recomendaciones y next steps | 5 min |
| 8 | Q&A | 10 min |

---

## 1. Introducción

### Qué se construyó

SLOGS es un sistema de gestión logística que cubre el ciclo completo de envíos terrestres y marítimos para SIATA Logistics.

**URLs de demo en vivo:**

| Servicio | URL |
|---|---|
| Frontend | https://frontend-6xao78ml4-serandmoncas-6387s-projects.vercel.app |
| Backend API | https://slogs-api-production.up.railway.app |
| Swagger UI | https://slogs-api-production.up.railway.app/docs |
| Repositorio | https://github.com/serandmoncas/slogs |

**Credenciales:** `admin@siata.co` / `admin1234`

### Lo que diferencia esta entrega

- Todos los requerimientos obligatorios ✅
- Todos los ítems bonus ✅
- Actividades adicionales: CI/CD, roles, export CSV, tests E2E, ADRs, diagramas C4

---

## 2. Decisiones de Arquitectura (ADRs)

> "Un arquitecto senior no solo decide — documenta por qué."

Cada decisión relevante está en `docs/adr/`. Resumen ejecutivo:

### ADR-001: Monolito modular vs Microservicios

**Decisión:** Monolito con separación estricta de capas.

**Por qué no microservicios:**
- Para el volumen actual (cientos de envíos/día), el overhead de red entre servicios no se justifica
- Transacciones ACID sin coordinación distribuida
- Un solo `docker compose up --build` levanta todo

**Ruta de migración natural si escala:** auth-service / shipment-service / catalog-service — la arquitectura en capas actual facilita esa extracción futura.

---

### ADR-002: Tablas separadas para envíos terrestres y marítimos

**Decisión:** `envios_terrestres` y `envios_maritimos` como tablas independientes.

**Por qué no tabla única con NULLs:**
- Terrestre tiene `placa` + `bodega_id`; marítimo tiene `numero_flota` + `puerto_id`
- Una tabla unificada tendría columnas siempre nulas → antipatrón relacional
- Los constraints `NOT NULL` no funcionan condicionalmente en SQL estándar
- Reglas de negocio distintas (5% vs 3%) naturalmente separadas en services distintos

---

### ADR-003: FastAPI sobre Django REST Framework

**Decisión:** FastAPI 0.115 con Pydantic v2.

**Ventaja clave para esta prueba:** Swagger UI generado automáticamente en `/docs` — el evaluador puede probar todos los endpoints sin Postman.

**Patrón clave:** en lugar de escribir validaciones con `if not re.match(...)`, se usan los mecanismos del lenguaje:
```python
@field_validator('placa')
def validar_placa(cls, v):
    if not re.match(r'^[A-Z]{3}[0-9]{3}$', v):
        raise ValueError('Formato: ABC123')
    return v
```

---

### ADR-004: JWT Stateless vs Sesiones

**Decisión:** JWT HS256, 30 minutos, cookie `sameSite=strict`.

**Por qué no localStorage:** vulnerable a XSS. La cookie httpOnly no es accesible desde JavaScript por diseño del navegador.

**Por qué no Auth0:** para este scope es sobre-ingeniería; la implementación con `python-jose` + `passlib[bcrypt]` sigue las mismas prácticas. Auth0 sería recomendado en producción real con múltiples aplicaciones cliente.

---

### ADR-005: Repository Pattern + Service Layer

**Regla de capas:**
```
Router → Service → Repository → BD
```
Cada capa solo conoce la siguiente. El router nunca toca SQLAlchemy. El repositorio nunca lanza `HTTPException`.

**Resultado:** cambiar el motor de BD requiere tocar solo los repositories. Las reglas de negocio están en un solo lugar testeable.

---

### ADR-006: Criterios de Arquitectura Priorizados

| Criterio | Prioridad | Cómo se satisface |
|---|---|---|
| **Mantenibilidad** | Alta | Capas separadas, ADRs, 37 tests como red de seguridad |
| **Testabilidad** | Alta | Funciones puras, BD de test aislada, rollback por test |
| **Bajo acoplamiento** | Alta | Repository Pattern, schemas DTO, deploy independiente |
| **Observabilidad** | Media | Swagger, logs FastAPI, health check `/` |
| **Escalabilidad** | Baja | Backend stateless (escala horizontal sin configuración) |

---

## 3. Demo — Requerimientos Obligatorios

### Preparación

1. Abrir https://frontend-6xao78ml4-serandmoncas-6387s-projects.vercel.app
2. Abrir https://slogs-api-production.up.railway.app/docs (segunda pestaña)
3. Tener a mano: curl o Swagger UI para mostrar respuestas crudas

---

### REQ-01: CRUD de Clientes

**Frontend:** `/clientes` → botón "+ Nuevo" → llenar formulario → guardar

**API (Swagger):** `POST /api/v1/clientes`
```json
{
  "nombre": "Empresa Demo S.A.S",
  "nit": "900999001-1",
  "email": "demo@empresa.co",
  "telefono": "3100000000",
  "direccion": "Cra 1 #1-1",
  "ciudad": "Bogotá"
}
```

**Qué demostrar:**
- Respuesta `201 Created` con el objeto completo
- `GET /api/v1/clientes` retorna lista paginada `{items, total, page, size}`
- NIT duplicado → `409 Conflict` con mensaje descriptivo en español

---

### REQ-02: CRUD de Productos, Bodegas, Puertos

**Flujo rápido (Swagger):**
```
POST /api/v1/productos → { "nombre": "Textiles", "categoria": "Manufactura" }
POST /api/v1/bodegas   → { "nombre": "Bodega Norte", "ciudad": "Barranquilla", "capacidad": 2000, "tipo": "NACIONAL" }
POST /api/v1/puertos   → { "nombre": "Puerto Barranquilla", "ciudad": "Barranquilla", "pais": "Colombia", "codigo": "BAQ", "tipo": "NACIONAL" }
```

**Qué demostrar:** los 4 maestros tienen el mismo patrón `GET/POST/GET{id}/PUT/DELETE`.

---

### REQ-03: Envío Terrestre con Descuento 5%

**Frontend:** `/terrestres/nuevo`

**Lo que muestra el panel sticky en tiempo real:**
- Cantidad = 10 → descuento = 0%, total = precio completo
- Cantidad = 11 → badge **-5% OFF** aparece, total se actualiza

**API (Swagger):** `POST /api/v1/envios/terrestres`
```json
{
  "numero_guia": "TRR9999999",
  "cliente_id": 1,
  "producto_id": 1,
  "bodega_id": 1,
  "cantidad": 11,
  "fecha_entrega": "2026-12-31",
  "precio_envio": "300000.00",
  "placa": "ABC123"
}
```

**Respuesta esperada:**
```json
{
  "descuento_pct": "5.00",
  "precio_final": "285000.00",
  "estado": "PENDIENTE"
}
```

**Qué demostrar:** `descuento_pct` y `precio_final` calculados automáticamente por el backend, no enviados por el cliente.

---

### REQ-04: Envío Marítimo con Descuento 3%

**API:** `POST /api/v1/envios/maritimos`
```json
{
  "numero_guia": "MAR9999999",
  "cliente_id": 1,
  "producto_id": 1,
  "puerto_id": 1,
  "cantidad": 15,
  "fecha_entrega": "2026-12-31",
  "precio_envio": "1000000.00",
  "numero_flota": "BCO1234A"
}
```

**Respuesta:** `descuento_pct: "3.00"`, `precio_final: "970000.00"`

---

### REQ-05: Validaciones de formato

**Placa inválida → 422:**
```json
{ "placa": "abc123" }
```
```json
{ "detail": [{ "msg": "Placa inválida. Formato: ABC123" }] }
```

**Número de flota inválido → 422:**
```json
{ "numero_flota": "12345678" }
```

**Número de guía duplicado → 409:**
Enviar mismo `numero_guia` dos veces.

**Cantidad = 0 → 422:**
```json
{ "cantidad": 0 }
```

---

### REQ-06: Estados HTTP semánticos

Mostrar en Swagger:

| Acción | Código |
|---|---|
| `POST` exitoso | 201 |
| `GET` exitoso | 200 |
| `DELETE` exitoso | 204 (sin cuerpo) |
| ID inexistente | 404 + `{"detail": "..."}` |
| Sin token | 401 |
| Token válido pero rol operador intentando DELETE | 403 |
| Guía duplicada | 409 |
| Placa inválida | 422 |

---

### REQ-07: Autenticación obligatoria

**Demostrar sin token:**
```bash
curl https://slogs-api-production.up.railway.app/api/v1/clientes
# → 401 Unauthorized
```

**Con token:**
```bash
curl -H "Authorization: Bearer eyJ..." \
  https://slogs-api-production.up.railway.app/api/v1/clientes
# → 200 OK con datos
```

---

### REQ-08: `fecha_registro` asignada por el servidor

**Enviar sin `fecha_registro`:** el campo no existe en el schema de entrada.

**Respuesta:** la fecha aparece en la respuesta, asignada automáticamente como `date.today()`.

**Intentar enviar con `fecha_registro`:** Pydantic lo ignora porque el schema `Create` no lo incluye (DTO separation).

---

## 4. Demo — Ítems Bonus

### BONUS-01: Despliegue en servidor público

**Mostrar en vivo:**
- Frontend: https://frontend-6xao78ml4-serandmoncas-6387s-projects.vercel.app
- Backend: https://slogs-api-production.up.railway.app
- Railway logs en tiempo real mientras se hace un POST

---

### BONUS-02: Backend y frontend separados

**Mostrar arquitectura:**
- Frontend en Vercel (CDN global, Next.js)
- Backend en Railway (Docker, FastAPI)
- Comunicación via REST + JWT Bearer
- `docker compose up --build` levanta ambos localmente de forma orquestada

---

### BONUS-03: Documentación API completa (Swagger)

**Abrir:** https://slogs-api-production.up.railway.app/docs

**Demostrar:**
1. El botón "Authorize" → ingresa el token → todos los endpoints se prueban sin Postman
2. Cada endpoint muestra schemas de request y response automáticamente
3. ReDoc en `/redoc` para documentación legible

---

### BONUS-04 y BONUS-05: Registro + Login + JWT

**Flujo en Swagger:**
1. `POST /api/v1/auth/register` → crea usuario
2. `POST /api/v1/auth/login` → retorna `{access_token, token_type: "bearer"}`
3. Copiar token → botón "Authorize" en Swagger → pegar token
4. `GET /api/v1/auth/me` → retorna usuario autenticado con `rol`

---

### BONUS-06: Validaciones y códigos HTTP

> Ya demostrado en REQ-05 y REQ-06.

---

### BONUS-07: Autorización de acceso (Roles)

**Demostrar diferencia admin vs operador:**

1. Crear usuario operador:
```json
POST /auth/register
{ "email": "operador@test.co", "password": "pass1234", "nombre": "Operador" }
```

2. Login como operador → obtener token

3. Intentar DELETE con token de operador:
```
DELETE /api/v1/clientes/1
Authorization: Bearer <token-operador>
→ 403 Forbidden: "Se requiere rol administrador para esta acción."
```

4. Mostrar en frontend: el botón "Eliminar" no aparece para el operador (UI condicional con `{isAdmin && ...}`).

---

### BONUS-08: Navegación SPA

**Demostrar:**
- Navegar entre páginas (Dashboard → Terrestres → Nuevo → volver)
- **Sin recarga de página** — Next.js App Router con `router.push()`
- URL cambia pero la página no hace full reload
- Header muestra breadcrumb actualizado en tiempo real

---

## 5. Profundización Técnica

### Patrón Repository — código real

```python
# repositories/envio_terrestre_repo.py
def list_all(db, estado, fecha_inicio, fecha_fin, cliente_id, page, size):
    query = db.query(EnvioTerrestre).options(
        joinedload(EnvioTerrestre.cliente),
        joinedload(EnvioTerrestre.producto),
        joinedload(EnvioTerrestre.bodega),
    )
    if estado:
        query = query.filter(EnvioTerrestre.estado == estado)
    total = query.count()
    items = query.order_by(EnvioTerrestre.id.desc())
               .offset((page-1)*size).limit(size).all()
    return items, total
```

**Qué mostrar:** El router llama `envio_terrestre_service.list_envios(db, ...)`. El service llama al repo. El router nunca ve una query SQL.

---

### Regla de negocio — función pura

```python
# services/envio_terrestre_service.py
def calcular_descuento_terrestre(cantidad: int) -> Decimal:
    return Decimal("5.00") if cantidad > 10 else Decimal("0.00")

def calcular_precio_final(precio_envio: Decimal, descuento_pct: Decimal) -> Decimal:
    return (precio_envio * (1 - descuento_pct / 100)).quantize(Decimal("0.01"))
```

**Por qué `Decimal` y no `float`:** `850000 * 0.95` en float puede ser `807499.999...`. Con Decimal es exactamente `807500.00`. En operaciones monetarias la precisión es no negociable.

**Tests de estas funciones:** no requieren BD ni servidor — son puras y deterministas.

---

### Diagrama de Secuencia — flujo completo

> Ver `docs/architecture.md` → Sección 4: Diagrama de Secuencia

Mostrar el diagrama renderizado en GitHub (Mermaid nativo):
https://github.com/serandmoncas/slogs/blob/main/docs/architecture.md

---

### CI/CD en vivo

**Mostrar:** https://github.com/serandmoncas/slogs/actions

- Workflow `Backend CI` corrió en 43 segundos
- PostgreSQL como service container en GitHub Actions
- 37 tests pasando automáticamente en cada push a `backend/`

---

## 6. Actividades Adicionales

### Lo que va más allá de los requerimientos

| Actividad | Detalle |
|---|---|
| **Roles y permisos** | `admin` vs `operador` — DELETE requiere admin, UI oculta botones |
| **Export CSV** | `GET /api/v1/envios/terrestres/export` — descarga con BOM UTF-8 para Excel |
| **Tests E2E Playwright** | 8 tests que corren en el browser real verificando flujos de usuario |
| **BD de tests aislada** | `slogs_test` separada de desarrollo — los tests no contaminan datos reales |
| **CI/CD GitHub Actions** | Pytest automático en cada push con PostgreSQL real |
| **ADRs** | 6 documentos que explican las decisiones de arquitectura |
| **Diagramas C4 Mermaid** | Contexto, Contenedores, Componentes, Secuencia, ER |
| **Toast notifications** | Feedback global para operaciones async (delete, errors) |
| **Auth guard frontend** | Redirect a login si no hay token antes de renderizar |

---

## 7. Recomendaciones y Next Steps

### Lo que haría con más tiempo

**Prioridad alta:**

1. **Upgrade Next.js 15/16** — las CVEs actuales no afectan SLOGS (no usa Image Optimizer, rewrites ni RSC puro) pero es buena práctica mantenerse al día. Requiere actualizar hooks async de App Router.

2. **Logging estructurado** — integrar `structlog` con salida JSON para permitir búsqueda en sistemas como Datadog o CloudWatch. El backend actualmente solo tiene los logs básicos de uvicorn.

3. **Refresh tokens** — el token actual expira en 30 minutos sin opción de renovar. Implementar access token (15 min) + refresh token (7 días) mejoraría significativamente la UX de sesiones largas.

**Prioridad media:**

4. **Auth0 / Cognito** — para una versión productiva con múltiples aplicaciones cliente (app móvil, portal clientes, etc.), delegar la autenticación a un Identity Provider especializado es la práctica recomendada.

5. **Dominio custom en Vercel** — elimina la restricción de SSO del plan Hobby y resuelve el problema de CORS en cada nuevo deploy.

6. **Paginación infinita o virtual scrolling** — para listas con miles de envíos, el scroll infinito es más performante que la paginación clásica.

**Deuda técnica identificada:**

7. **Tests unitarios puros** — tenemos tests de integración (37) y E2E (8) pero faltan tests unitarios de las funciones de servicio en aislamiento completo.

8. **Observabilidad** — sin métricas de negocio (envíos/hora, tasa de error por endpoint). Pendiente integrar una solución de monitoreo.

---

### Sobre las sugerencias del revisor

| Sugerencia | Respuesta |
|---|---|
| **4+1 vistas** | Cubierto por los diagramas C4 en `docs/architecture.md` |
| **Repository + Unit of Work** | Repository implementado; UoW es la Session de SQLAlchemy implícitamente — documentado en ADR-005 |
| **Strategy para descuentos** | Con 2 reglas es over-engineering. Si el sistema crece a 10+ tipos de descuento, Strategy sería la refactorización natural. Documentado en ADR-006 como trade-off |
| **Pruebas unitarias** | 37 integración + 8 E2E. Tests unitarios de funciones puras son el siguiente paso |
| **Logging + CI/CD** | CI/CD implementado ✅. Logging estructurado como deuda técnica documentada |
| **Criterios de arquitectura** | ADR-006 cubre mantenibilidad, testabilidad, acoplamiento, observabilidad, escalabilidad |
| **MVC + status HTTP** | MVC implementado (Router=Controller, Model=SQLAlchemy, View=Pydantic schemas). Status HTTP semánticos en cada endpoint |
| **Swagger** | `/docs` automático vía FastAPI — probado en vivo |
| **Microservicios** | ADR-001 justifica la decisión de monolito modular con ruta de migración documentada |
| **Librerías del lenguaje** | Pydantic validators, SQLAlchemy ORM, python-jose, `Decimal` para dinero, `joinedload` para eager loading — todo con librerías, nada "a pelo" |
| **BD documentada** | `docs/schema.sql`, `docs/er-diagram.svg`, modelos con comentarios en el diagrama ER Mermaid |
| **python-jose + bcrypt** | Exactamente los estándares del ecosistema Python. Auth0 como mejora futura documentada en ADR-004 |
| **SOLID** | Single Responsibility en cada capa. Open/Closed en los services (añadir un tipo de envío no modifica los existentes) |
| **FastAPI** | Es el stack del sistema ✅ |
| **Diagramas Mermaid** | `docs/architecture.md` — 5 diagramas incluyendo C4 y secuencia |
| **Colección endpoints** | Swagger UI en `/docs` cubre esto completamente. Exportable a Postman en un clic desde la UI |

---

## 8. Preguntas frecuentes en entrevistas técnicas

**¿Por qué usaste `Decimal` para los precios?**
> Los `float` tienen errores de representación binaria. `850000 * 0.95` puede dar `807499.999...`. Con `Decimal` y `NUMERIC(12,2)` en PostgreSQL, la precisión es exacta. En sistemas financieros y logísticos, eso no es opcional.

**¿Cómo escalarías esto a 10 millones de envíos?**
> Primero, índices adicionales en `fecha_registro` y `cliente_id` para las queries de dashboard. Segundo, read replica para queries de solo lectura. Tercero, cache de Redis para el endpoint `/dashboard/stats` que agrega toda la tabla. Si necesita escala masiva independiente, extraer `shipment-service` como microservicio es la ruta — la arquitectura de capas actual lo facilita.

**¿Cómo manejarías la revocación de tokens JWT?**
> Con la implementación actual (stateless), no es posible invalidar un token antes de su expiración. La solución estándar es una blacklist en Redis con los tokens revocados, o usar refresh tokens con rotación (el refresh token puede invalidarse en BD). En producción real optaría por Auth0 que maneja esto nativamente.

**¿Por qué no usaste async/await en el backend?**
> SQLAlchemy síncrono con psycopg2 es perfectamente funcional para este alcance. El beneficio de async con asyncpg se nota con centenares de conexiones concurrentes — en ese punto migraríamos la capa de BD. La arquitectura actual facilita ese cambio porque el async/await solo afectaría repositories y engine, no el service layer.

**¿Qué harías diferente si lo empezaras de nuevo?**
> Agregaría logging estructurado desde el día 1 — es trivial de añadir pero invaluable para debugging en producción. También configuraría el dominio custom de Vercel desde el inicio para evitar el problema de URLs cambiantes en cada deploy.

---

## Checklist de demo

- [ ] Browser abierto en frontend (Vercel)
- [ ] Segunda pestaña en Swagger (`/docs`)
- [ ] Token de admin listo para copiar
- [ ] `docs/architecture.md` en GitHub (diagramas Mermaid)
- [ ] GitHub Actions mostrando CI verde
- [ ] Terminal lista para `curl` si hace falta mostrar respuestas crudas
