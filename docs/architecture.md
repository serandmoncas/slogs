# SLOGS — Diagramas de Arquitectura

_Modelo C4 simplificado: Contexto → Contenedores → Componentes → Secuencia_

---

## 1. Diagrama de Contexto (C4 Level 1)

```mermaid
graph TB
    U["👤 Usuario\nGestor de envíos"]

    subgraph SLOGS["Sistema SLOGS"]
        FE["Frontend\nNext.js 14"]
        BE["Backend API\nFastAPI"]
        DB[("PostgreSQL 16")]
    end

    U -->|"Browser HTTPS"| FE
    FE -->|"REST JSON + JWT"| BE
    BE -->|"SQL / psycopg2"| DB
```

---

## 2. Diagrama de Contenedores (C4 Level 2)

```mermaid
graph TB
    U["👤 Usuario"]

    subgraph Vercel["Vercel (CDN global)"]
        FE["**Frontend**\nNext.js 14 App Router\nReact Query · Axios\nInline styles"]
    end

    subgraph Railway["Railway (SFO)"]
        BE["**Backend API**\nFastAPI 0.115\nSQLAlchemy 2 · Alembic\nJWT HS256 · bcrypt"]
        DB[("**PostgreSQL 16**\n7 tablas\nENUM types")]
    end

    U -->|"HTTPS"| FE
    FE -->|"REST API\nAuthorization: Bearer JWT"| BE
    BE -->|"SQL\npycopg2-binary"| DB

    style Vercel fill:#0E1626,stroke:#60A5FA,color:#F1F5F9
    style Railway fill:#0E1626,stroke:#4ADE80,color:#F1F5F9
```

---

## 3. Diagrama de Componentes — Backend (C4 Level 3)

```mermaid
graph TB
    subgraph "FastAPI Application"
        direction TB

        subgraph Routers["Capa Router (HTTP)"]
            R_auth["auth.py\nPOST /login /register\nGET /me"]
            R_env["envios.py\nCRUD terrestres\nCRUD marítimos"]
            R_mae["clientes · productos\nbodegas · puertos"]
            R_exp["export.py\nGET /export CSV"]
            R_dash["dashboard.py\nGET /stats"]
        end

        subgraph Services["Capa Service (Negocio)"]
            S_auth["auth_service\nJWT · bcrypt"]
            S_ter["envio_terrestre_service\ncalcular_descuento 5%"]
            S_mar["envio_maritimo_service\ncalcular_descuento 3%"]
            S_mae["cliente · producto\nbodega · puerto services"]
        end

        subgraph Repos["Capa Repository (Datos)"]
            Rep["*_repo.py\nSQLAlchemy queries\nsin lógica de negocio"]
        end

        subgraph Cross["Transversales"]
            Dep["dependencies.py\nget_current_user\nrequire_admin"]
            Sch["schemas/\nPydantic DTOs\nCreate · Update · Response"]
        end
    end

    DB[("PostgreSQL 16")]

    Routers -->|"llama"| Services
    Services -->|"delega BD"| Repos
    Repos -->|"ORM"| DB
    Routers -.->|"inyecta"| Dep
    Routers -.->|"valida"| Sch

    style Routers fill:#111827,stroke:#F59E0B
    style Services fill:#111827,stroke:#60A5FA
    style Repos fill:#111827,stroke:#4ADE80
    style Cross fill:#111827,stroke:#475569
```

**Regla de capas:** cada capa solo conoce la siguiente. El router nunca toca SQLAlchemy. El repositorio nunca lanza `HTTPException`.

---

## 4. Diagrama de Secuencia — Login y Crear Envío

```mermaid
sequenceDiagram
    actor U as Usuario
    participant FE as Frontend (Vercel)
    participant BE as Backend (Railway)
    participant DB as PostgreSQL

    Note over U,DB: Flujo de autenticación
    U->>FE: Ingresa email + contraseña
    FE->>BE: POST /api/v1/auth/login\n(form-urlencoded)
    BE->>DB: SELECT * FROM users WHERE email=?
    DB-->>BE: {hashed_password, rol, is_active}
    BE->>BE: bcrypt.verify(password, hash)
    BE-->>FE: 200 {access_token: "eyJ..."}
    FE->>FE: setToken(cookie sameSite=strict)
    FE-->>U: Redirect → /dashboard

    Note over U,DB: Flujo de creación de envío terrestre
    U->>FE: Ingresa datos (cantidad=11, precio=300.000)
    FE->>FE: Preview: descuento=5%, total=$285.000
    U->>FE: Submit

    FE->>BE: POST /api/v1/envios/terrestres\nAuthorization: Bearer eyJ...
    BE->>BE: decode_token() → get_current_user()
    BE->>BE: calcular_descuento_terrestre(11) = 5%
    BE->>BE: precio_final = 300000 × 0.95 = 285000
    BE->>DB: INSERT INTO envios_terrestres\n(descuento_pct=5, precio_final=285000)
    DB-->>BE: {id: 4, numero_guia: "TRR..."}
    BE-->>FE: 201 Created {descuento_pct: "5.00"}
    FE->>FE: queryClient.invalidateQueries(['envios-terrestres'])
    FE-->>U: Lista actualizada · badge -5% OFF visible
```

---

## 5. Modelo Entidad-Relación (Crow's Foot Notation)

> Notación: `||` = exactamente uno · `o{` = cero o muchos · `|{` = uno o muchos

```mermaid
erDiagram
    USERS {
        int     id              PK "autoincremento"
        varchar email           UK "NOT NULL, único"
        varchar hashed_password    "bcrypt, no reversible"
        varchar nombre
        varchar rol                "admin | operador"
        bool    is_active          "default true"
        ts      created_at
        ts      updated_at
    }

    CLIENTES {
        int     id          PK
        varchar nombre         "NOT NULL"
        varchar nit         UK "NOT NULL, único en sistema"
        varchar email
        varchar telefono
        varchar direccion
        varchar ciudad
        ts      created_at
        ts      updated_at
    }

    PRODUCTOS {
        int     id          PK
        varchar nombre         "NOT NULL"
        text    descripcion    "nullable"
        varchar categoria      "NOT NULL"
        ts      created_at
        ts      updated_at
    }

    BODEGAS {
        int     id          PK
        varchar nombre         "NOT NULL"
        varchar ciudad         "NOT NULL"
        varchar direccion
        int     capacidad       "unidades disponibles"
        enum    tipo            "NACIONAL | INTERNACIONAL"
        ts      created_at
        ts      updated_at
    }

    PUERTOS {
        int     id          PK
        varchar nombre         "NOT NULL"
        varchar ciudad         "NOT NULL"
        varchar pais           "NOT NULL"
        varchar codigo      UK "único, ej: CTG, BUN, MIA"
        enum    tipo            "NACIONAL | INTERNACIONAL"
        ts      created_at
        ts      updated_at
    }

    ENVIOS_TERRESTRES {
        int     id              PK
        varchar numero_guia     UK "max 10 chars, único"
        int     cliente_id      FK "→ clientes.id"
        int     producto_id     FK "→ productos.id"
        int     bodega_id       FK "→ bodegas.id"
        int     cantidad           "gt 0"
        date    fecha_registro     "auto = hoy, no editable"
        date    fecha_entrega      "NOT NULL"
        numeric precio_envio       "NUMERIC(12,2)"
        numeric descuento_pct      "5.00 si cantidad > 10"
        numeric precio_final       "calculado: envio*(1-desc)"
        varchar placa              "regex [A-Z]{3}[0-9]{3}"
        enum    estado             "PENDIENTE|EN_TRANSITO|ENTREGADO|CANCELADO"
        ts      created_at
        ts      updated_at
    }

    ENVIOS_MARITIMOS {
        int     id              PK
        varchar numero_guia     UK "max 10 chars, único"
        int     cliente_id      FK "→ clientes.id"
        int     producto_id     FK "→ productos.id"
        int     puerto_id       FK "→ puertos.id"
        int     cantidad           "gt 0"
        date    fecha_registro     "auto = hoy, no editable"
        date    fecha_entrega      "NOT NULL"
        numeric precio_envio       "NUMERIC(12,2)"
        numeric descuento_pct      "3.00 si cantidad > 10"
        numeric precio_final       "calculado: envio*(1-desc)"
        varchar numero_flota       "regex [A-Z]{3}[0-9]{4}[A-Z]"
        enum    estado             "PENDIENTE|EN_TRANSITO|ENTREGADO|CANCELADO"
        ts      created_at
        ts      updated_at
    }

    %% ── Relaciones (crow's foot) ─────────────────────────────────────────
    %% ||  = exactamente uno (lado maestro)
    %% o{  = cero o muchos  (lado detalle — el "pie de cuervo")

    CLIENTES   ||--o{ ENVIOS_TERRESTRES : "1 cliente  → N terrestres"
    PRODUCTOS  ||--o{ ENVIOS_TERRESTRES : "1 producto → N terrestres"
    BODEGAS    ||--o{ ENVIOS_TERRESTRES : "1 bodega   → N terrestres"

    CLIENTES   ||--o{ ENVIOS_MARITIMOS  : "1 cliente  → N marítimos"
    PRODUCTOS  ||--o{ ENVIOS_MARITIMOS  : "1 producto → N marítimos"
    PUERTOS    ||--o{ ENVIOS_MARITIMOS  : "1 puerto   → N marítimos"
```

### Lectura de la notación

| Símbolo | Significado |
|---|---|
| `\|\|` | Exactamente uno (obligatorio) |
| `o\|` | Cero o uno (opcional) |
| `\|\{` | Uno o muchos (obligatorio) |
| `o\{` | Cero o muchos — **pie de cuervo** (opcional) |
| `--` | Línea de relación identificante |
