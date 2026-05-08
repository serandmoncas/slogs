# ADR-001 — Monolito modular vs Microservicios

**Estado:** Aceptado  
**Fecha:** 2026-05-07  
**Contexto:** Diseño inicial de la arquitectura del sistema SLOGS

---

## Contexto

SLOGS gestiona envíos terrestres y marítimos para SIATA Logistics. La pregunta inicial fue si modelar el sistema como un conjunto de microservicios independientes (un servicio de autenticación, uno de envíos terrestres, uno de envíos marítimos, uno de maestros) o como un monolito modular con separación de capas interna.

## Decisión

**Monolito modular** con separación estricta de capas (Router → Service → Repository).

## Criterios evaluados

| Criterio | Peso | Monolito modular | Microservicios |
|---|---|---|---|
| Mantenibilidad | Alto | ✅ Un repo, un deploy, un stack | ⚠️ Sincronización entre servicios |
| Tiempo de implementación | Alto | ✅ Sin overhead de red entre servicios | ❌ Infraestructura distribuida compleja |
| Testabilidad | Alto | ✅ Tests de integración en un solo proceso | ⚠️ Tests de contrato entre servicios |
| Escalabilidad independiente | Medio | ⚠️ Escala todo o nada | ✅ Escala por servicio |
| Observabilidad | Medio | ✅ Un punto de logs y métricas | ⚠️ Tracing distribuido requerido |
| Complejidad operacional | Alto | ✅ Un contenedor Docker | ❌ Orquestador (K8s/ECS) requerido |

## Alternativas descartadas

**Microservicios estrictos** — Para el volumen actual (cientos de envíos/día), el overhead de latencia de red entre servicios, la complejidad de transacciones distribuidas (saga pattern) y el costo operacional de múltiples contenedores no se justifican. Los principios SOLID de responsabilidad única se satisfacen dentro del monolito a través de las capas de Service y Repository.

**Ruta de migración futura:** Si el sistema crece a millones de envíos/día y los equipos de terrestres y marítimos necesitan deployar de forma independiente, la separación natural sería:
- `auth-service` (ya tiene su propio router y service)
- `shipment-service` (envíos terrestres + marítimos)
- `catalog-service` (maestros: clientes, productos, bodegas, puertos)

La arquitectura de capas actual facilita esta extracción porque el Service Layer no depende de la infraestructura HTTP.

## Consecuencias

- ✅ Un solo `docker compose up --build` levanta todo el sistema
- ✅ Transacciones ACID sin coordinación distribuida
- ✅ Deploys atómicos: frontend + backend + BD en sincronía
- ⚠️ El servicio de autenticación comparte proceso con la lógica de negocio
