# Plan de ejecución — Parametrización completa del dominio de despliegue

**Fecha:** 2026-07-04 · **Estado:** en ejecución · **Versión objetivo:** v1.0.0 (doc/config, sin bump)
**Rama:** `feature/parametrizar-dominio-despliegue` (una por repo; los cambios son interdependientes).

## Objetivo
Que el despliegue sea **100% agnóstico del dominio**: el dominio se introduce una sola vez,
como **argumento** de `02-ssl.sh` / `03-deploy.sh` (y en el DNS), sin editar ningún archivo.
Hoy el dominio está hardcodeado en dos sitios (`nginx.conf` rutas del cert, `environment.prod.ts`
`apiUrl`); esto los elimina. Sirve para servidor físico o VM en la nube y para cualquier cliente/dominio.

## Hallazgos que reducen el riesgo (verificados antes de ejecutar)
- Los 12 servicios usan `` `${environment.apiUrl}/...` `` (plantillas) → con `apiUrl:'/api/v1'` quedan
  rutas relativas válidas. **No hay `new URL()`** que las parsee.
- Los specs usan `environment.apiUrl` del entorno **dev** y `ng test` **no** aplica el `fileReplacement`
  de prod → el cambio de `environment.prod.ts` **no afecta a los 462 specs**.
- `nginx.conf` solo tiene el dominio en 2 líneas (cert); el resto usa variables de nginx (`$host`, `$uri`…).

---

## CAMBIO 1 — Frontend: `apiUrl` a URL relativa
- **Archivo:** `frontend/src/environments/environment.prod.ts`
- **Cambio:** `apiUrl: 'https://almacenes.codigo2enter.com/api/v1'` → `apiUrl: '/api/v1'`. `environment.ts` (dev) NO se toca.
- **Daño colateral posible:** consumidor que asuma URL absoluta (no existe); specs (usan dev, no cambian);
  servir el bundle prod sin nginx delante (escenario no soportado).
- **Corrección:** ninguna prevista; si apareciera, revertir a absoluta + vía manual.
- **Rollback:** `git checkout -- src/environments/environment.prod.ts`.
- **Criterios de éxito:** `ng build --configuration=production` 0 errores; el bundle contiene `/api/v1`
  y NO `almacenes.codigo2enter.com`; en despliegue, login → `https://<dominio>/api/v1/...` → 200.

## CAMBIO 2 — Frontend: `nginx.conf` por `${DOMAIN}` + Dockerfile
- **Archivo A:** `frontend/nginx.conf` líneas del cert:
  `/etc/letsencrypt/live/almacenes.codigo2enter.com/{fullchain,privkey}.pem` → `.../${DOMAIN}/...`
- **Archivo B:** `frontend/Dockerfile`:
  `COPY nginx.conf /etc/nginx/conf.d/default.conf` → `COPY nginx.conf /etc/nginx/templates/default.conf.template`
  (la imagen `nginx:alpine` procesa `/etc/nginx/templates/*.template` con envsubst al arrancar).
- **🔴 Riesgo crítico:** envsubst sustituye TODAS las `$var` → pisaría `$host`, `$uri`, `$scheme`, etc.
- **Corrección obligatoria:** `NGINX_ENVSUBST_FILTER=DOMAIN` (solo sustituye `${DOMAIN}`; deja intactas las de nginx).
- **Corrección alternativa (fallback):** enfoque symlink — `nginx.conf` con ruta fija
  `/etc/letsencrypt/live/almacenes-cert/` + `02-ssl.sh` crea el symlink al dominio real. Cero envsubst.
- **Otros riesgos:** `DOMAIN` no llega → ruta de cert vacía → nginx no arranca (corrección: compose pasa
  `DOMAIN`; `05-verify` detecta contenedor no-healthy). Imagen frontend construye en ARM (multi-arch, OK).
- **Rollback:** `git checkout -- nginx.conf Dockerfile`.
- **Criterios de éxito:** `docker build` OK; `cat /etc/nginx/conf.d/default.conf` en el contenedor muestra
  la ruta del cert con el dominio real y `$host`/`$uri` intactas; `nginx -t` OK.

## CAMBIO 3 — Backend: `03-deploy.sh` (env del frontend + validación)
- **Archivo:** `backend/scripts/03-deploy.sh`
  - **3a)** Servicio `frontend` del compose generado: añadir `environment: DOMAIN: ${DOMAIN}` y `NGINX_ENVSUBST_FILTER: DOMAIN`.
  - **3b)** Validación `grep "almacenes.codigo2enter.com" environment.prod.ts` → verificar `apiUrl: '/api/v1'` (relativa).
- **Riesgo:** error de YAML en el heredoc (corrección: `docker compose config`). Olvidar el FILTER (corrección: incluirlo).
- **Rollback:** `git checkout -- scripts/03-deploy.sh`.
- **Criterios de éxito:** `03-deploy.sh <dominio>` genera compose válido con `DOMAIN` en frontend; validación reporta URL relativa.

## CAMBIO 4 — Documentación: eliminar el paso de "editar 2 archivos"
- **Archivos:** guía GCP (FASE D sustitución (d)), INSTRUCTIVO (nota de dominio), plan §9 (si aplica).
- **Cambio:** el dominio es 100% parametrizado; ya no se edita `nginx.conf`/`environment.prod.ts`.
- **Rollback:** revertir los docs.
- **Criterio de éxito:** ningún documento pide editar esos archivos.

---

## Tests a ejecutar + blast radius
| # | Test | Valida |
|---|---|---|
| 1 | `ng build --configuration=production` | Build AOT 0 errores (C1) |
| 2 | `ng test --no-watch` → 462, 0 fallos | Specs no afectados (C1) |
| 3 | `mvn test` → 408, 0 fallos | Regresión backend |
| 4 | `grep /api/v1 dist` + ausencia de `codigo2enter` | apiUrl relativo (C1) |
| 5 | `docker build` frontend + run con `DOMAIN=test` → `cat` config + `nginx -t` | Cert con dominio real; `$host` intactas (C2) |
| 6 | `docker compose config` del compose generado | YAML válido con `DOMAIN` (C3) |
| 7 | E2E Playwright (dev) | Sin regresión (opcional) |
| 8 | **Despliegue real en VM de GCP (Fase F)** | **Validación definitiva** end-to-end (C1+C2+C3) |

> `ng test`/`mvn test` NO ejercen nginx ni compose. La validación definitiva de C2/C3 es un despliegue
> real (#5-6 en Docker local y, sobre todo, #8 en la VM de GCP). La parametrización y la prueba en GCP se
> validan mutuamente.

**Blast radius:** C1 = build frontend (cubierto por ng build/test); C2/C3 = artefactos de despliegue
(cubiertos por docker build + deploy, no por unit tests); C4 = docs. Sin cambios de lógica de negocio.

## Definición de "done" y rollback global
- **Done:** tests #1-3 verdes + #5-6 verdes en Docker local + docs sin referencias a edición manual.
  (#8 en GCP es la validación definitiva end-to-end, en la prueba de despliegue.)
- **Rollback global:** si el gatekeeper falla, no se mergea. Tras merge: `git revert -m 1 <hash-merge>` por repo.
  Fallback del CAMBIO 2 (symlink) conserva la parametrización aun si envsubst diera problemas.
