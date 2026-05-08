# ADR-006 — Criterios de Arquitectura y Decisiones de Diseño

**Estado:** Aceptado  
**Fecha:** 2026-05-07  
**Tipo:** Documento de criterios arquitectónicos (Architecture Fitness Functions)

---

## Criterios priorizados

Antes de tomar cualquier decisión de diseño, se establecieron los siguientes criterios en orden de prioridad para el contexto de SIATA Logistics:

### 1. Mantenibilidad (Prioridad: Alta)

**Definición:** El sistema puede ser modificado, extendido y corregido por un desarrollador que no participó en su construcción original, en tiempo razonable.

**Cómo se satisface:**
- Separación estricta de capas (Router/Service/Repository) — cada capa tiene una responsabilidad única
- Nomenclatura consistente en español para el dominio (envíos, clientes, bodegas)
- ADRs que documentan el "por qué" de cada decisión de diseño
- 37 tests de integración que actúan como red de seguridad ante cambios

**Métrica:** Un desarrollador nuevo puede añadir un nuevo tipo de envío (aéreo) modificando ≤ 5 archivos sin romper los tests existentes.

---

### 2. Testabilidad (Prioridad: Alta)

**Definición:** El código puede verificarse de forma automatizada en múltiples niveles.

**Cómo se satisface:**
- Funciones puras para reglas de negocio (`calcular_descuento_terrestre`, `calcular_precio_final`) — testeables sin BD
- Tests de integración con `transaction.rollback()` — BD aislada por test
- BD `slogs_test` separada de desarrollo — los tests no contaminan datos reales
- 8 tests E2E Playwright para flujos críticos del frontend

**Pirámide de tests:**
```
        [E2E]      ← 8 tests Playwright (lentos, costosos)
      [Integración] ← 37 tests pytest + BD real (medios)
    [Unitarios]     ← funciones puras de service layer (rápidos)
```

---

### 3. Bajo acoplamiento (Prioridad: Alta)

**Definición:** Los módulos pueden cambiar de forma independiente sin efecto en cascada.

**Cómo se satisface:**
- Repository Pattern: cambiar de PostgreSQL a MySQL requiere tocar solo los repositories
- Schemas Pydantic separados (Create/Update/Response): cambios en la API no afectan los modelos
- Frontend desacoplado del backend via REST + JWT: pueden deployarse independientemente
- `get_current_user` como Dependency Injection: el mecanismo de auth puede cambiar sin tocar los routers

---

### 4. Observabilidad (Prioridad: Media)

**Definición:** El estado del sistema puede inferirse a partir de sus salidas externas.

**Estado actual:**
- Swagger UI en `/docs` documenta todos los endpoints con ejemplos
- FastAPI genera logs de acceso automáticamente (método, ruta, status code, tiempo)
- Health check en `GET /` para monitoreo de uptime

**Deuda técnica identificada:**
- Sin logging estructurado (JSON) que permita búsqueda en sistemas como Datadog/CloudWatch
- Sin métricas de negocio (envíos creados/hora, tasa de error por endpoint)
- Sin tracing distribuido entre frontend y backend

**Ruta de mejora:** Integrar `structlog` + exportación a CloudWatch/Datadog en producción.

---

### 5. Escalabilidad (Prioridad: Baja para el contexto actual)

**Definición:** El sistema puede manejar mayor carga con cambios proporcionales en recursos.

**Estado actual:** El backend es stateless (JWT, sin sesiones en memoria) — escala horizontalmente añadiendo instancias detrás de un load balancer sin coordinación adicional.

**Cuello de botella identificado:** PostgreSQL como base de datos única. Para escala masiva se evaluaría:
- Read replicas para queries del dashboard
- Redis para cache de resultados frecuentes
- Particionamiento de tablas de envíos por fecha

**Justificación de prioridad baja:** SIATA Logistics opera con cientos de envíos/día, no millones. La complejidad de una arquitectura de alta escala no se justifica en esta etapa.

---

## Trade-offs documentados

| Decisión | Ganamos | Sacrificamos |
|---|---|---|
| Monolito modular | Simplicidad operacional | Escala independiente por dominio |
| Tablas separadas terrestres/marítimos | Integridad de datos | Queries de agregación más complejas |
| JWT stateless | Sin estado en servidor | Imposible revocar tokens antes de expirar |
| Inline styles en frontend | Cero dependencias CSS | Sin theming runtime |
| `Decimal` para precios | Precisión exacta en dinero | Serialización más verbosa que `float` |
| Tests de integración sobre unitarios | Confianza en el stack completo | Tests más lentos (8s vs <1s) |
