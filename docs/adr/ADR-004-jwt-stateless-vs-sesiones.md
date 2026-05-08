# ADR-004 — JWT Stateless vs Sesiones con base de datos

**Estado:** Aceptado  
**Fecha:** 2026-05-07

---

## Contexto

El frontend (Vercel) y el backend (Railway) están en dominios distintos. Se necesita un mecanismo de autenticación que funcione en este contexto cross-origin.

## Decisión

**JWT HS256 stateless** con expiración de 30 minutos, almacenado en cookie `sameSite=strict`.

## Alternativas descartadas

**Sesiones con base de datos** (session_id en cookie → lookup en BD):
- Requiere tabla de sesiones con estado en PostgreSQL
- Cada request protegido implica un query de BD adicional para validar la sesión
- Complejidad extra para invalidación (logout requiere DELETE de la sesión)
- Escala peor en arquitecturas distribuidas (varias instancias del backend compartiendo estado)

**Auth0 / Cognito (Identity Provider externo)**:
- Elimina completamente la responsabilidad de autenticación del backend
- Standard OAuth2/OIDC — solución enterprise recomendada para producción real
- Para este scope: dependencia de servicio externo, costo adicional, mayor complejidad de integración
- **Recomendado para una versión de producción real con múltiples aplicaciones cliente**

**Refresh tokens**:
- No implementado por simplicidad. En producción se recomendarían access tokens (15 min) + refresh tokens (7 días) para mejor UX sin comprometer seguridad.

## Implementación de seguridad

- `python-jose` para firma/verificación JWT (librería del lenguaje, no implementación propia)
- `passlib[bcrypt]` para hash de contraseñas (bcrypt con salt automático)
- Cookie `sameSite=strict` previene CSRF (no localStorage — previene XSS)
- `Depends(get_current_user)` valida el token en cada request protegido

## Consecuencias

- ✅ Sin estado en el servidor — escala horizontalmente sin coordinación
- ✅ Funciona cross-domain (Vercel + Railway) sin configuración adicional
- ✅ Logout en cliente (borra cookie) sin round-trip al servidor
- ⚠️ Revocación de tokens imposible antes de expiración (30 min de ventana)
- ⚠️ Si el SECRET_KEY es comprometido, todos los tokens activos son inválidos
