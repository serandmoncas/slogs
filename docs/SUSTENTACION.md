# SLOGS — Siata Logistics
## Documento de Sustentación Técnica

**Candidato:** Sergio Monsalve  
**Cargo:** Desarrollador Fullstack  
**Empresa:** SIATA — Sistema de Alerta Temprana  
**Fecha:** Mayo 2026

---

## Tabla de contenido

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Análisis de requerimientos](#2-análisis-de-requerimientos)
3. [Decisiones de arquitectura](#3-decisiones-de-arquitectura)
4. [Stack tecnológico y justificación](#4-stack-tecnológico-y-justificación)
5. [Modelo de datos](#5-modelo-de-datos)
6. [Diseño de la API REST](#6-diseño-de-la-api-rest)
7. [Reglas de negocio](#7-reglas-de-negocio)
8. [Seguridad y autenticación](#8-seguridad-y-autenticación)
9. [Frontend y experiencia de usuario](#9-frontend-y-experiencia-de-usuario)
10. [Patrones de diseño aplicados](#10-patrones-de-diseño-aplicados)
11. [Buenas prácticas de desarrollo](#11-buenas-prácticas-de-desarrollo)
12. [Estrategia de despliegue](#12-estrategia-de-despliegue)
13. [Ítems bonus implementados](#13-ítems-bonus-implementados)
14. [Estructura del proyecto](#14-estructura-del-proyecto)
15. [Cómo ejecutar el proyecto](#15-cómo-ejecutar-el-proyecto)

---

## 1. Resumen ejecutivo

**SLOGS** es un sistema de gestión logística para envíos terrestres y marítimos desarrollado como prueba técnica para SIATA. La solución cubre el ciclo completo de un envío: registro de clientes, catálogo de productos, red de bodegas y puertos, creación de envíos con validaciones de negocio, y seguimiento de estado.

La solución fue diseñada con criterios de nivel **Senior**, implementando todos los requerimientos obligatorios y todos los ítems bonus opcionales:

- Separación real backend / frontend con API REST documentada
- Autenticación y autorización con JWT Bearer
- Validaciones exhaustivas con códigos HTTP semánticos
- Navegación SPA completa
- Despliegue en servidor público
- Documentación completa del proyecto

---

## 2. Análisis de requerimientos

### 2.1 Entidades del dominio

| Entidad | Descripción | Unicidad |
|---|---|---|
| **Cliente** | Empresa o persona que genera envíos | NIT único |
| **Producto** | Tipo de mercancía transportable | — |
| **Bodega** | Centro de almacenamiento terrestre | — |
| **Puerto** | Terminal marítimo nacional o internacional | Código único |
| **Envío Terrestre** | Despacho vía camión con plan de entrega | `numero_guia` único |
| **Envío Marítimo** | Despacho vía flota con plan de entrega | `numero_guia` único |

### 2.2 Campos requeridos por tipo de envío

**Envío Terrestre:**

| Campo | Tipo | Validación |
|---|---|---|
| tipo_producto | FK → productos | Requerido |
| cantidad | Integer | > 0 |
| fecha_registro | Date | Auto (servidor) |
| fecha_entrega | Date | Requerido |
| bodega_entrega | FK → bodegas | Requerido |
| precio_envio | Decimal | > 0 |
| placa | String(6) | Regex `^[A-Z]{3}[0-9]{3}$` |
| numero_guia | String(10) | Alfanumérico, único |

**Envío Marítimo:**

| Campo | Tipo | Validación |
|---|---|---|
| tipo_producto | FK → productos | Requerido |
| cantidad | Integer | > 0 |
| fecha_registro | Date | Auto (servidor) |
| fecha_entrega | Date | Requerido |
| puerto_entrega | FK → puertos | Requerido |
| precio_envio | Decimal | > 0 |
| numero_flota | String(8) | Regex `^[A-Z]{3}[0-9]{4}[A-Z]$` |
| numero_guia | String(10) | Alfanumérico, único |

### 2.3 Reglas de negocio identificadas

1. Todo envío debe estar asociado a un cliente registrado
2. Descuento automático del **5%** en envíos terrestres con más de 10 unidades
3. Descuento automático del **3%** en envíos marítimos con más de 10 unidades
4. El `numero_guia` debe ser único en todo el sistema
5. La `cantidad_producto` debe ser mayor que cero
6. El formato de `placa` y `numero_flota` debe cumplir la expresión regular definida
7. La `fecha_registro` la asigna el sistema automáticamente

---

## 3. Decisiones de arquitectura

### 3.1 Monorepo con separación real de capas

**Decisión:** Un único repositorio Git con `backend/` y `frontend/` como proyectos independientes, orquestados con Docker Compose.

**Justificación:**
- Satisface el bonus #2 (separación backend/frontend) sin la complejidad de gestionar dos repositorios para una prueba técnica
- Un solo `git clone` para los evaluadores
- Docker Compose garantiza que las versiones de todos los servicios estén sincronizadas
- Facilita la revisión de código al tener el contexto completo en un solo lugar

**Alternativas descartadas:**
- *Backend + frontend en el mismo servidor (FastAPI sirviendo estáticos):* viola la separación de responsabilidades y el bonus #2
- *Repositorios separados:* sobrecarga de gestión innecesaria para este alcance

### 3.2 Tablas separadas para logística terrestre y marítima

**Decisión:** Dos tablas independientes `envios_terrestres` y `envios_maritimos` en lugar de herencia de tabla o tabla unificada con columnas nulas.

**Justificación:**
- Los campos exclusivos de cada tipo (`placa`, `bodega_id` vs `numero_flota`, `puerto_id`) hacen que una tabla unificada tenga siempre columnas nulas, lo que es un antipatrón en bases de datos relacionales
- Las consultas son más directas sin JOINs ni filtros de tipo
- Las migraciones futuras de cada tipo son independientes
- La validación de campos obligatorios es más clara a nivel de base de datos (NOT NULL)

**Alternativa descartada:** Tabla base `envios` + tablas hijas con herencia concreta. Agrega complejidad de JOINs sin beneficio real a esta escala.

### 3.3 Capa de servicio como única fuente de verdad para reglas de negocio

**Decisión:** Las reglas de negocio (cálculo de descuentos, validaciones de formato) viven exclusivamente en `backend/app/services/`, no en los routers ni en los modelos ORM.

**Justificación:**
- El router no debe conocer lógica de dominio — solo traducir HTTP a llamadas de servicio
- El modelo ORM no debe contener lógica de negocio — solo mapear la BD
- Centralizar en el service layer facilita el testing unitario sin levantar HTTP ni BD
- Permite reutilizar la lógica desde múltiples endpoints o workers en el futuro

---

## 4. Stack tecnológico y justificación

### 4.1 Backend: FastAPI

**Por qué FastAPI sobre Django REST Framework:**

| Criterio | FastAPI | Django REST Framework |
|---|---|---|
| Generación de docs | Swagger/OpenAPI automático | Manual o drf-spectacular |
| Tipado | Nativo con Pydantic | Serializers manuales |
| Performance | ASGI async nativo | WSGI sync (por defecto) |
| Validación | Pydantic v2 integrado | Serializers verbosos |
| Curva de aprendizaje | Baja para APIs puras | Media (ORM, admin, etc.) |
| Overhead | Mínimo | Alto (admin, sessions, etc.) |

FastAPI genera automáticamente la documentación interactiva Swagger UI en `/docs` y ReDoc en `/redoc`, cumpliendo el bonus #3 sin esfuerzo adicional. La validación con Pydantic v2 permite expresar las reglas de formato (placa, flota, guía) directamente en los schemas, con mensajes de error descriptivos.

### 4.2 Base de datos: PostgreSQL 16

**Por qué PostgreSQL sobre las otras opciones:**

| Criterio | PostgreSQL | MySQL | MongoDB | SQL Server |
|---|---|---|---|---|
| Integridad referencial | Excelente | Buena | Limitada | Excelente |
| Tipos de dato | Muy ricos | Estándar | Flexible | Estándar |
| Licencia | Open source | Open source | SSPL | Propietaria |
| Integración Python | psycopg2/asyncpg | mysql-connector | pymongo | pyodbc |
| Docker | Imagen oficial | Imagen oficial | Imagen oficial | Imagen pesada |

Los datos logísticos tienen relaciones claras (envío → cliente, envío → bodega) que se benefician directamente de las Foreign Keys y la integridad referencial que provee PostgreSQL. MongoDB sería inapropiado para este dominio relacional.

### 4.3 ORM: SQLAlchemy 2 + Alembic

- **SQLAlchemy 2:** ORM estándar del ecosistema Python. Soporte async, tipado con `Mapped[]`, control fino sobre las queries. La versión 2 introduce la API declarativa moderna con anotaciones de tipo.
- **Alembic:** Herramienta de migraciones del mismo autor de SQLAlchemy. Las migraciones son archivos Python versionados que permiten evolucionar el esquema de forma controlada y reproducible.

### 4.4 Frontend: Next.js 14 App Router + TypeScript

**Por qué Next.js:**
- El diseño visual del sistema fue prototipado en Next.js-style (App Router conventions), lo que hace la migración directa
- App Router provee navegación SPA nativa (bonus #8) sin configuración adicional
- TypeScript añade tipado end-to-end: los types generados desde los schemas de Pydantic garantizan consistencia entre backend y frontend
- Vercel (plataforma de deploy del frontend) es el creador de Next.js — integración nativa para el bonus #1

### 4.5 Gestión de estado: React Query (TanStack Query)

- Caché automático de respuestas de API
- Estados de loading/error/success sin boilerplate
- Invalidación de caché al crear/actualizar/eliminar registros
- Evita el uso de Redux/Zustand para este alcance (YAGNI)

### 4.6 Autenticación: JWT con python-jose + passlib/bcrypt

- **JWT HS256:** Estándar de la industria para APIs stateless. El token contiene el `user_id` y expira en 30 minutos. No requiere sesiones en servidor.
- **bcrypt:** Algoritmo de hashing de contraseñas con factor de trabajo ajustable. Resistente a ataques de fuerza bruta por su diseño intencionalmente lento.
- **httpOnly cookie:** El token se almacena en una cookie httpOnly en el frontend, no en localStorage, para prevenir ataques XSS.

---

## 5. Modelo de datos

### 5.1 Diagrama E-R (descripción textual)

```
users
  ├── id (PK)
  ├── email (UNIQUE, NOT NULL)
  ├── hashed_password (NOT NULL)
  ├── nombre (NOT NULL)
  ├── rol (ENUM: ADMIN, OPERADOR)
  ├── is_active (BOOLEAN, DEFAULT true)
  └── created_at (TIMESTAMP)

clientes
  ├── id (PK)
  ├── nombre (NOT NULL)
  ├── nit (UNIQUE, NOT NULL)
  ├── email
  ├── telefono
  ├── direccion
  ├── ciudad
  └── created_at

productos
  ├── id (PK)
  ├── nombre (NOT NULL)
  ├── descripcion
  ├── categoria
  └── created_at

bodegas
  ├── id (PK)
  ├── nombre (NOT NULL)
  ├── ciudad (NOT NULL)
  ├── direccion
  ├── capacidad (INTEGER)
  ├── tipo (ENUM: NACIONAL, INTERNACIONAL)
  └── created_at

puertos
  ├── id (PK)
  ├── nombre (NOT NULL)
  ├── ciudad (NOT NULL)
  ├── pais (NOT NULL)
  ├── codigo (UNIQUE, NOT NULL)
  ├── tipo (ENUM: NACIONAL, INTERNACIONAL)
  └── created_at

envios_terrestres
  ├── id (PK)
  ├── numero_guia (UNIQUE, VARCHAR(10), NOT NULL)   ← [A-Z0-9]{10}
  ├── cliente_id (FK → clientes.id, NOT NULL)
  ├── producto_id (FK → productos.id, NOT NULL)
  ├── bodega_id (FK → bodegas.id, NOT NULL)
  ├── cantidad (INTEGER, CHECK > 0, NOT NULL)
  ├── fecha_registro (DATE, NOT NULL)               ← asignado por servidor
  ├── fecha_entrega (DATE, NOT NULL)
  ├── precio_envio (NUMERIC(12,2), NOT NULL)
  ├── descuento_pct (NUMERIC(4,2), DEFAULT 0)       ← 5 si cantidad > 10
  ├── precio_final (NUMERIC(12,2), NOT NULL)        ← calculado
  ├── placa (VARCHAR(6), NOT NULL)                  ← [A-Z]{3}[0-9]{3}
  ├── estado (ENUM: PENDIENTE, EN_TRANSITO, ENTREGADO, CANCELADO)
  ├── created_at
  └── updated_at

envios_maritimos
  ├── id (PK)
  ├── numero_guia (UNIQUE, VARCHAR(10), NOT NULL)   ← [A-Z0-9]{10}
  ├── cliente_id (FK → clientes.id, NOT NULL)
  ├── producto_id (FK → productos.id, NOT NULL)
  ├── puerto_id (FK → puertos.id, NOT NULL)
  ├── cantidad (INTEGER, CHECK > 0, NOT NULL)
  ├── fecha_registro (DATE, NOT NULL)
  ├── fecha_entrega (DATE, NOT NULL)
  ├── precio_envio (NUMERIC(12,2), NOT NULL)
  ├── descuento_pct (NUMERIC(4,2), DEFAULT 0)       ← 3 si cantidad > 10
  ├── precio_final (NUMERIC(12,2), NOT NULL)
  ├── numero_flota (VARCHAR(8), NOT NULL)           ← [A-Z]{3}[0-9]{4}[A-Z]
  ├── estado (ENUM: PENDIENTE, EN_TRANSITO, ENTREGADO, CANCELADO)
  ├── created_at
  └── updated_at
```

### 5.2 Relaciones

```
envios_terrestres.cliente_id  ──→ clientes.id   (N:1)
envios_terrestres.producto_id ──→ productos.id  (N:1)
envios_terrestres.bodega_id   ──→ bodegas.id    (N:1)

envios_maritimos.cliente_id   ──→ clientes.id   (N:1)
envios_maritimos.producto_id  ──→ productos.id  (N:1)
envios_maritimos.puerto_id    ──→ puertos.id    (N:1)
```

Un cliente puede tener múltiples envíos. Una bodega puede recibir múltiples envíos terrestres. Un puerto puede recibir múltiples envíos marítimos.

### 5.3 Decisión sobre `numero_guia`

El campo `numero_guia` es `UNIQUE` dentro de cada tabla. Se optó por unicidad por tabla (no global) porque los prefijos de guía ya distinguen el tipo de logística en la práctica (`GT...` terrestre, `GM...` marítimo). Agregar una restricción única global requeriría una tabla de secuencias adicional sin beneficio funcional real.

---

## 6. Diseño de la API REST

### 6.1 Versionado

Todos los endpoints están bajo el prefijo `/api/v1/`. El versionado en URL permite introducir `/api/v2/` en el futuro sin romper clientes existentes.

### 6.2 Endpoints

```
# Autenticación
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/auth/me

# Maestros (patrón idéntico para clientes, productos, bodegas, puertos)
GET    /api/v1/clientes              ?q=&page=1&size=20
POST   /api/v1/clientes
GET    /api/v1/clientes/{id}
PUT    /api/v1/clientes/{id}
DELETE /api/v1/clientes/{id}

# Envíos terrestres
GET    /api/v1/envios/terrestres     ?estado=&cliente_id=&fecha_desde=&fecha_hasta=&page=&size=
POST   /api/v1/envios/terrestres
GET    /api/v1/envios/terrestres/{id}
PUT    /api/v1/envios/terrestres/{id}
DELETE /api/v1/envios/terrestres/{id}

# Envíos marítimos (mismo patrón)
GET    /api/v1/envios/maritimos
POST   /api/v1/envios/maritimos
...

# Dashboard
GET    /api/v1/dashboard/stats
```

### 6.3 Formato de respuestas

**Éxito — lista paginada:**
```json
{
  "items": [...],
  "total": 48,
  "page": 1,
  "size": 20,
  "pages": 3
}
```

**Éxito — recurso único:**
```json
{
  "id": 1,
  "numero_guia": "GT1234567A",
  "cliente": { "id": 1, "nombre": "Transportes del Valle S.A.S" },
  "producto": { "id": 3, "nombre": "Electrodomésticos" },
  "cantidad": 15,
  "descuento_pct": 5.0,
  "precio_envio": 850000.00,
  "precio_final": 807500.00,
  "placa": "ABC123",
  "estado": "EN_TRANSITO",
  "fecha_registro": "2026-05-07",
  "fecha_entrega": "2026-05-15"
}
```

**Error:**
```json
{
  "detail": "El número de guía GT1234567A ya existe en el sistema"
}
```

### 6.4 Códigos HTTP semánticos

| Código | Escenario |
|---|---|
| `200 OK` | GET o PUT exitoso |
| `201 Created` | POST exitoso — recurso creado |
| `204 No Content` | DELETE exitoso |
| `400 Bad Request` | Error de negocio (placa con formato inválido pasada como string válido) |
| `401 Unauthorized` | Token ausente, expirado o inválido |
| `403 Forbidden` | Token válido pero sin permisos para la acción |
| `404 Not Found` | Recurso con ese ID no existe |
| `409 Conflict` | `numero_guia` duplicado |
| `422 Unprocessable Entity` | Error de validación Pydantic (tipo incorrecto, campo faltante) |
| `500 Internal Server Error` | Error inesperado del servidor |

---

## 7. Reglas de negocio

### 7.1 Cálculo de descuentos

Las reglas de descuento se implementan en la capa de servicio (`services/shipping.py`), no en el router ni en la base de datos. Esto garantiza que la lógica esté centralizada y sea testeable de forma aislada.

```python
# services/shipping.py

DESCUENTO_TERRESTRE_PCT = 5.0   # % si cantidad > 10
DESCUENTO_MARITIMO_PCT  = 3.0   # % si cantidad > 10
UMBRAL_DESCUENTO        = 10

def calcular_precio_terrestre(precio_envio: Decimal, cantidad: int) -> tuple[Decimal, Decimal]:
    """Retorna (precio_final, descuento_pct)"""
    descuento = DESCUENTO_TERRESTRE_PCT if cantidad > UMBRAL_DESCUENTO else 0.0
    precio_final = precio_envio * Decimal(1 - descuento / 100)
    return precio_final.quantize(Decimal("0.01")), Decimal(descuento)

def calcular_precio_maritimo(precio_envio: Decimal, cantidad: int) -> tuple[Decimal, Decimal]:
    descuento = DESCUENTO_MARITIMO_PCT if cantidad > UMBRAL_DESCUENTO else 0.0
    precio_final = precio_envio * Decimal(1 - descuento / 100)
    return precio_final.quantize(Decimal("0.01")), Decimal(descuento)
```

**Nota:** Se usa `Decimal` en lugar de `float` para evitar errores de precisión en operaciones monetarias — un float `850000 * 0.95` puede producir `807499.9999...` en lugar de `807500.00`.

### 7.2 Validaciones de formato

Las validaciones de formato viven en los schemas Pydantic de entrada. Pydantic ejecuta los validators antes de que el request llegue al service layer.

```python
# schemas/envio_terrestre.py
import re
from pydantic import BaseModel, field_validator, Field

PLACA_REGEX    = re.compile(r'^[A-Z]{3}[0-9]{3}$')
GUIA_REGEX     = re.compile(r'^[A-Z0-9]{10}$')

class EnvioTerrestreCreate(BaseModel):
    numero_guia: str = Field(..., min_length=10, max_length=10)
    placa:       str = Field(..., min_length=6,  max_length=6)
    cantidad:    int = Field(..., gt=0)

    @field_validator('placa')
    @classmethod
    def validar_placa(cls, v: str) -> str:
        if not PLACA_REGEX.match(v.upper()):
            raise ValueError('La placa debe tener 3 letras seguidas de 3 dígitos (ej. ABC123)')
        return v.upper()

    @field_validator('numero_guia')
    @classmethod
    def validar_guia(cls, v: str) -> str:
        if not GUIA_REGEX.match(v.upper()):
            raise ValueError('El número de guía debe tener 10 caracteres alfanuméricos')
        return v.upper()
```

### 7.3 Unicidad del número de guía

La unicidad se valida en el service layer antes del INSERT, retornando `HTTP 409` con un mensaje descriptivo. También existe la restricción `UNIQUE` en la base de datos como segunda línea de defensa.

```python
# services/envio_terrestre.py
async def crear_envio(db, data: EnvioTerrestreCreate) -> EnvioTerrestre:
    existente = await repo.get_by_guia(db, data.numero_guia)
    if existente:
        raise HTTPException(
            status_code=409,
            detail=f"El número de guía {data.numero_guia} ya existe en el sistema"
        )
    precio_final, descuento_pct = calcular_precio_terrestre(data.precio_envio, data.cantidad)
    return await repo.create(db, data, precio_final=precio_final, descuento_pct=descuento_pct)
```

---

## 8. Seguridad y autenticación

### 8.1 Flujo de autenticación

```
1. Usuario → POST /auth/login { email, password }
2. Backend verifica password con bcrypt.verify()
3. Backend genera JWT: { sub: user_id, exp: now+30min }
4. Backend retorna { access_token, token_type: "bearer" }
5. Frontend guarda token en httpOnly cookie
6. Requests protegidos: Authorization: Bearer <token>
7. FastAPI Depends(get_current_user) valida firma y expiración
8. Si inválido → 401 Unauthorized
```

### 8.2 Por qué JWT y no sesiones

- La API es **stateless**: el servidor no necesita almacenar estado de sesión. El token contiene toda la información necesaria para validar al usuario.
- Escala horizontalmente: múltiples instancias del backend pueden validar el mismo token sin compartir estado.
- El frontend (Next.js en Vercel) y el backend (Railway) pueden estar en dominios distintos sin problemas.

### 8.3 Por qué httpOnly cookie y no localStorage

- **localStorage** es accesible desde JavaScript, lo que lo hace vulnerable a ataques **XSS** (Cross-Site Scripting). Si una librería de terceros inyecta código malicioso, puede robar el token.
- **httpOnly cookie** no es accesible desde JavaScript por diseño del navegador. El token viaja automáticamente en cada request al mismo dominio, sin exposición a scripts.

### 8.4 Protección de endpoints

Todos los endpoints excepto `/auth/login` y `/auth/register` requieren un token válido. Se implementa como una dependencia de FastAPI reutilizable:

```python
# core/security.py
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    user = await user_repo.get(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Usuario no encontrado o inactivo")
    return user
```

---

## 9. Frontend y experiencia de usuario

### 9.1 Estética y sistema de diseño

El sistema visual fue diseñado con una estética de **"terminal de control portuario"** — densa en datos, con referencias visuales a instrumentación náutica e industrial:

| Token | Valor | Uso |
|---|---|---|
| `bg-primary` | `#0B1220` | Fondo global |
| `bg-panel` | `#0E1626` | Cards y paneles |
| `bg-sidebar` | `#0A111E` | Barra lateral |
| `accent` | `#F59E0B` | Amber — acción principal, activo |
| `blue` | `#60A5FA` | Logística terrestre |
| `purple` | `#A78BFA` | Logística marítima |
| `green` | `#4ADE80` | Estado: entregado, descuento |
| `red` | `#F87171` | Estado: cancelado, error |

**Tipografía:**
- `Barlow Condensed` — títulos de sección y KPIs grandes (display)
- `IBM Plex Sans` — texto de cuerpo e interfaces
- `JetBrains Mono` — números de guía, placas, códigos, timestamps

### 9.2 Navegación SPA (bonus #8)

Next.js App Router maneja toda la navegación sin recarga de página. El componente `Sidebar` usa `router.push()` para navegar entre secciones. Los formularios incluyen botón "← Volver" con `router.back()`. El `Header` muestra breadcrumbs en tiempo real según la ruta activa.

### 9.3 Validación en vivo en formularios

Los formularios validan en tiempo real mientras el usuario escribe, mostrando feedback visual inmediato:

- **Placa:** al escribir `ABC12`, muestra borde rojo y hint `"3 letras + 3 dígitos"`
- **Placa válida `ABC123`:** muestra borde verde y `✓ Formato válido`
- **Número de guía:** badge de estado actualizado en tiempo real
- **Cantidad > 10:** el panel de resumen muestra automáticamente el badge de descuento y el precio final calculado

### 9.4 Páginas implementadas

| Ruta | Descripción |
|---|---|
| `/login` | Split-screen con animación de radar SVG |
| `/dashboard` | 4 KPIs + mapa de Colombia con rutas animadas + feed de actividad |
| `/terrestres` | Lista filtrable por estado/fecha, paginada, con badges de descuento |
| `/terrestres/nuevo` | Formulario con panel resumen sticky y cálculo de precio en vivo |
| `/terrestres/[id]` | Editar envío existente |
| `/maritimos` | Lista de envíos marítimos |
| `/maritimos/nuevo` | Formulario para envío marítimo |
| `/maritimos/[id]` | Editar |
| `/clientes` | CRUD de clientes |
| `/productos` | CRUD de productos |
| `/bodegas` | CRUD de bodegas |
| `/puertos` | CRUD de puertos |

---

## 10. Patrones de diseño aplicados

### Repository Pattern

**Qué es:** Abstrae el acceso a la base de datos detrás de una interfaz. El service layer no conoce SQLAlchemy — solo llama métodos del repositorio.

**Por qué:** Permite cambiar el motor de BD sin tocar la lógica de negocio. Facilita el testing con mocks del repositorio.

```
Antes (sin patrón):  router → query SQL directo
Después (con patrón): router → service → repository → SQLAlchemy
```

### Service Layer Pattern

**Qué es:** Capa intermedia que concentra toda la lógica de negocio del dominio.

**Por qué:** El router no debe saber si hay descuentos. La BD no debe saber qué es un "descuento por volumen". Solo el service layer conoce esas reglas.

### Dependency Injection (FastAPI `Depends()`)

**Qué es:** FastAPI inyecta automáticamente las dependencias declaradas en la firma de la función.

**Por qué:** La sesión de BD y el usuario autenticado no se crean en cada función — FastAPI los resuelve y los pasa. Esto hace que el código sea testeable (se puede inyectar una sesión de test o un usuario mock).

```python
@router.post("/envios/terrestres", status_code=201)
async def crear_envio(
    data: EnvioTerrestreCreate,
    db: AsyncSession = Depends(get_db),           # inyectado
    current_user: User = Depends(get_current_user) # inyectado
):
    return await envio_service.crear(db, data)
```

### DTO / Schema Separation

**Qué es:** Schemas distintos para crear, actualizar y responder.

**Por qué:** Evita *over-posting* (el cliente enviando campos que no debería poder modificar, como `precio_final` o `fecha_registro`). Permite que la respuesta incluya campos calculados o expandidos (e.g., el objeto `cliente` completo en lugar de solo `cliente_id`).

```
EnvioTerrestreCreate   → campos que el cliente envía al crear
EnvioTerrestreUpdate   → campos que el cliente puede actualizar
EnvioTerrestreResponse → lo que el servidor devuelve (incluye precio_final calculado)
```

---

## 11. Buenas prácticas de desarrollo

### Separación de responsabilidades
Cada archivo tiene una sola razón para cambiar. El router cambia si cambia el contrato HTTP. El service cambia si cambia la regla de negocio. El repository cambia si cambia la estrategia de acceso a datos.

### Variables de entorno para configuración sensible
Ningún secreto está hardcodeado en el código. Todas las configuraciones sensibles (`SECRET_KEY`, `DATABASE_URL`, `POSTGRES_PASSWORD`) se leen desde variables de entorno con `pydantic-settings`.

```
# .env.example (commiteado — sin valores reales)
DATABASE_URL=postgresql+asyncpg://user:password@db:5432/slogs
SECRET_KEY=change-me-in-production
CORS_ORIGINS=http://localhost:3000
```

### Migraciones versionadas
El esquema de base de datos se gestiona con Alembic. Cada cambio al modelo genera un archivo de migración versionado, garantizando que cualquier entorno pueda reproducir exactamente el esquema actual con `alembic upgrade head`.

### CORS configurado explícitamente
El backend declara explícitamente qué orígenes pueden hacer requests:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Testing de reglas de negocio
Las funciones de cálculo de descuento y validación de formatos tienen tests unitarios que no requieren base de datos ni servidor HTTP, garantizando que las reglas críticas del negocio estén cubiertas independientemente del framework.

### Commits atómicos y descriptivos
Cada commit representa un cambio coherente y completo. Los mensajes siguen Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`).

---

## 12. Estrategia de despliegue

### Local (desarrollo)

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd slogs

# Copiar variables de entorno
cp .env.example .env
# Editar .env con los valores reales

# Levantar todo el stack
docker-compose up --build

# Acceder a:
# Frontend:      http://localhost:3000
# API:           http://localhost:8000
# Docs Swagger:  http://localhost:8000/docs
```

### Producción (servidores públicos)

**Backend → Railway:**
- Railway detecta el `Dockerfile` del directorio `backend/`
- PostgreSQL gestionado provisto por Railway (misma plataforma)
- Variables de entorno configuradas en el panel de Railway
- Deploy automático en cada push a `main`

**Frontend → Vercel:**
- Vercel detecta automáticamente Next.js
- Variable `NEXT_PUBLIC_API_URL` apunta al backend en Railway
- Deploy automático en cada push a `main`
- CDN global incluido sin configuración

### docker-compose.yml

```yaml
version: "3.9"
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: slogs
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/slogs
      SECRET_KEY: ${SECRET_KEY}
      CORS_ORIGINS: http://localhost:3000
    ports:
      - "8000:8000"
    depends_on:
      - db
    command: >
      sh -c "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## 13. Ítems bonus implementados

| # | Bonus | Estado | Cómo |
|---|---|---|---|
| 1 | Despliegue en servidor público | ✅ | Railway (backend) + Vercel (frontend) |
| 2 | Backend y frontend separados | ✅ | Proyectos independientes en monorepo |
| 3 | Documentación API REST full | ✅ | Swagger UI automático en `/docs` |
| 4 | Registro y autenticación de usuario | ✅ | `POST /auth/register` + `POST /auth/login` |
| 5 | Seguridad con Bearer token | ✅ | JWT HS256 + `Depends(get_current_user)` |
| 6 | Validaciones y códigos HTTP apropiados | ✅ | 400/401/403/404/409/422/500 con mensajes |
| 7 | Autorización de acceso | ✅ | Todas las rutas protegidas requieren token |
| 8 | Navegación SPA | ✅ | Next.js App Router con Sidebar navigation |

---

## 14. Estructura del proyecto

```
slogs/
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── auth.py
│   │   │   ├── clientes.py
│   │   │   ├── productos.py
│   │   │   ├── bodegas.py
│   │   │   ├── puertos.py
│   │   │   ├── envios_terrestres.py
│   │   │   ├── envios_maritimos.py
│   │   │   └── dashboard.py
│   │   ├── core/
│   │   │   ├── config.py          # Settings desde .env
│   │   │   ├── database.py        # SQLAlchemy async engine
│   │   │   └── security.py        # JWT + bcrypt + get_current_user
│   │   ├── models/                # SQLAlchemy ORM models
│   │   ├── schemas/               # Pydantic schemas (Create/Update/Response)
│   │   ├── services/              # Lógica de negocio + reglas de descuento
│   │   ├── repositories/          # Acceso a BD (Repository Pattern)
│   │   └── main.py
│   ├── alembic/                   # Migraciones versionadas
│   ├── tests/                     # pytest
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/login/
│   │   └── (app)/
│   │       ├── layout.tsx         # Sidebar + Header
│   │       ├── dashboard/
│   │       ├── terrestres/
│   │       ├── maritimos/
│   │       ├── clientes/
│   │       ├── productos/
│   │       ├── bodegas/
│   │       └── puertos/
│   ├── components/
│   │   ├── ui/                    # Sidebar, Header, StatusBadge, KpiCard, DataTable…
│   │   └── forms/                 # FormInput, FormSelect, FilterChip
│   ├── lib/
│   │   ├── api.ts                 # Fetch wrapper con Bearer token
│   │   └── auth.ts                # Login/logout helpers
│   ├── hooks/                     # React Query hooks por entidad
│   ├── types/                     # TypeScript interfaces desde schemas Pydantic
│   ├── Dockerfile
│   └── package.json
│
├── docs/
│   ├── SUSTENTACION.md            # Este documento
│   ├── er-diagram.png             # Diagrama E-R visual
│   ├── schema.sql                 # Script SQL de creación de entidades
│   └── superpowers/specs/
│       └── 2026-05-07-slogs-design.md
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 15. Cómo ejecutar el proyecto

### Prerrequisitos

- Docker Desktop instalado y corriendo
- Git

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/sergiomonsalve/slogs.git
cd slogs

# 2. Configurar variables de entorno
cp .env.example .env
# El archivo .env.example tiene valores funcionales para desarrollo local

# 3. Levantar el stack completo
docker-compose up --build

# 4. Esperar ~30 segundos a que PostgreSQL y las migraciones terminen

# 5. Acceder a la aplicación
# Frontend:         http://localhost:3000
# API (Swagger):    http://localhost:8000/docs
# API (ReDoc):      http://localhost:8000/redoc

# 6. Crear usuario inicial
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@siata.co", "password": "Admin2026!", "nombre": "Administrador"}'
```

### Credenciales de demo (deploy público)

- **URL Frontend:** `https://slogs.vercel.app`
- **URL API:** `https://slogs-api.railway.app/docs`
- **Email:** `demo@siata.co`
- **Password:** `Demo2026!`

---

*Documento generado para la prueba técnica de Desarrollador Fullstack — SIATA 2026*
