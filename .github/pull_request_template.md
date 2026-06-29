<!-- Plantilla de Pull Request — Almacenes Frontend -->

## Descripción
<!-- ¿Qué cambia y por qué? -->

## Tipo de cambio
- [ ] `feature/` — nueva funcionalidad o módulo
- [ ] `fix/` — corrección
- [ ] `chore/` — infraestructura, configuración o documentación

## Checklist (Protocolo del repositorio)
- [ ] La rama parte de `develop` y se integra vía `merge --no-ff` (nunca commit directo a `main`/`develop`).
- [ ] `ng build --configuration=production` → 0 errores AOT.
- [ ] `ng test --no-watch` → 0 fallos.
- [ ] Si aplica backend: `mvn test` → 0 fallos.
- [ ] Rutas nuevas con `canActivate: [authGuard]` + `data.roles` (gate de seguridad).
- [ ] Casos de prueba actualizados en `docs/qa/` y memoria técnica del módulo en `docs/modulos/`.
- [ ] Sin datos de prueba (QA) residuales.

## Evidencia de pruebas
<!-- Pega el resumen de tests / capturas relevantes -->
