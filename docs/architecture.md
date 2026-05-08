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

## 5. Diagrama de Base de Datos (ER simplificado)

```mermaid
erDiagram
    CLIENTES {
        serial id PK
        varchar nit UK
        varchar nombre
        varchar email
        varchar ciudad
    }
    PRODUCTOS {
        serial id PK
        varchar nombre
        varchar categoria
    }
    BODEGAS {
        serial id PK
        varchar nombre
        enum tipo "NACIONAL|INTERNACIONAL"
    }
    PUERTOS {
        serial id PK
        varchar codigo UK
        varchar pais
        enum tipo "NACIONAL|INTERNACIONAL"
    }
    ENVIOS_TERRESTRES {
        serial id PK
        varchar numero_guia UK
        int cliente_id FK
        int producto_id FK
        int bodega_id FK
        int cantidad
        numeric precio_final
        numeric descuento_pct "5% si cantidad>10"
        varchar placa "^[A-Z]{3}[0-9]{3}$"
        enum estado
    }
    ENVIOS_MARITIMOS {
        serial id PK
        varchar numero_guia UK
        int cliente_id FK
        int producto_id FK
        int puerto_id FK
        int cantidad
        numeric precio_final
        numeric descuento_pct "3% si cantidad>10"
        varchar numero_flota "^[A-Z]{3}[0-9]{4}[A-Z]$"
        enum estado
    }
    USERS {
        serial id PK
        varchar email UK
        varchar rol "admin|operador"
    }

    CLIENTES ||--o{ ENVIOS_TERRESTRES : "realiza"
    PRODUCTOS ||--o{ ENVIOS_TERRESTRES : "contiene"
    BODEGAS ||--o{ ENVIOS_TERRESTRES : "almacena"
    CLIENTES ||--o{ ENVIOS_MARITIMOS : "realiza"
    PRODUCTOS ||--o{ ENVIOS_MARITIMOS : "contiene"
    PUERTOS ||--o{ ENVIOS_MARITIMOS : "despacha"
```
