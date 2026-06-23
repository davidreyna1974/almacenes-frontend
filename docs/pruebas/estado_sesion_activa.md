# Estado de sesión activa — Verificación 4 fases

> **INSTRUCCIÓN**: Leer este archivo al inicio de cualquier sesión de pruebas para saber
> exactamente dónde continuar. Actualizar al completar cada módulo o categoría.
> Si la sesión se interrumpe (límite de uso de Claude Code, cierre de ventana, etc.),
> el estado queda persistido aquí y la siguiente sesión retoma sin pérdida de contexto.

---

## Estado general

| Campo | Valor |
|---|---|
| **Ronda activa** | **Ronda 4 estricta ⛔ INVALIDADA por BUG-M3-23** → Fase 2 completada → **pendiente reiniciar Fase 3 estricta (Ronda 5)** |
| **Protocolo** | 4 fases (ver `protocolo_verificacion_4_fases.md`) |
| **Fecha de inicio** | 2026-06-22 |
| **Fase actual** | **FASE 2 COMPLETADA (BUG-M3-23, 2026-06-23)** — fix aplicado + gatekeeper OK + verificado en browser. Próximo: **Fase 3 estricta desde cero (Ronda 5)** sobre el nuevo bundle congelado. |
| **Fix BUG-M3-23** | Rama `fix/compras-confirm-dialog-disableclose`. Se agregó `disableClose: true` a los 8 `ConfirmDialogComponent` de transición de estado en 3 componentes: `purchase-order-detail-page` (approve/receive/cancel/removeDetail), `purchase-orders-page` (approve/receive/cancel), `supplier-dialog` (onDeactivate). Gatekeeper: `ng build` prod → 0 errores AOT ✅; `ng test --no-watch` → 456 tests, 0 fallos ✅; `mvn test` → N/A (fix frontend-only, backend sin cambios). Verificado en browser: el diálogo Aprobar ahora permanece abierto tras click en backdrop y tras ESC. **Blast radius: LOCAL (solo Compras)**. |
| **Regla de congelamiento** | Si se encuentra un bug nuevo durante una ronda → se documenta como ⚠️ ABIERTO, **NO se corrige**, se termina la fase y se vuelve a Fase 2 (ronda invalidada). |
| **Siguiente acción** | **Reiniciar Fase 3 estricta (Ronda 5)**: congelar el nuevo bundle (commit/merge del fix, dev server sirviendo código nuevo), re-ejecutar los 170 casos de Compras en una sola sesión continua. VIS-GEN-12 debe volver a PASS. Al terminar sin bugs: Fase 4 (`ng build` + `ng test --no-watch --coverage` ≥70% + `mvn test` + commit `chore(qa)`). |

---

## FASE 1 — Inventario (estado: ✅ COMPLETADA en rondas anteriores)

> La Fase 1 de esta ronda usa los resultados de las rondas anteriores como inventario.
> Bugs actualmente abiertos documentados en los documentos de casos.

| Módulo | Casos totales | PASS | FAIL/ABIERTO | N/A | PENDIENTE | Estado Fase 1 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Auth / Usuarios | 91 | 90 | 0 | 1 | 0 | ✅ Inventariado |
| Inventario | 198 | 191 | 0 | 7 | 0 | ✅ Inventariado |
| Compras | 170 | 159 | 6 | 5 | 0 | ✅ Inventariado |
| Ventas | 190 | 186 | 0 | 4 | 0 | ✅ Inventariado |
| Reportes | 94 | 82 | 0 | 12 | 0 | ✅ Inventariado |

---

## FASE 2 — Corrección de bugs (estado: ✅ COMPLETADA 2026-06-22 + reinicio por BUG-M3-15b)

### Bugs corregidos

| Bug ID | Módulo | Descripción | Blast radius | Estado |
|---|---|---|---|---|
| BUG-M3-15 | Compras | Búsqueda client-side → server-side (backend+frontend) | Local (purchases) | ✅ CORREGIDO (incompleto — ver BUG-M3-15b) |
| BUG-M3-16 | Compras | Sin campo "motivo" — DISEÑO CONFIRMADO, caso actualizado | Local (purchases) | ✅ DISEÑO CONFIRMADO |
| BUG-M3-17 | Compras | Historial en creación — DISEÑO CONFIRMADO, caso N/A | Local (purchases) | ✅ DISEÑO CONFIRMADO |
| BUG-M3-18 | Compras | Subtotal negativo → guard `(q>=1 && p>0)` | Local (purchases) | ✅ CORREGIDO |
| BUG-M3-19 | Compras | Subtotal $0 en edición + sin confirm en creación | Local (purchases) | ✅ CORREGIDO |
| BUG-INV-15 / CYBER-13 | Global | CORS ya corregido — confirmado en código | N/A (ya estaba) | ✅ CONFIRMADO |
| CYBER-02 / BUG-INV-13 | Global | JWT firma — resuelto por BUG-INV-09 globalmente | N/A (ya estaba) | ✅ CONFIRMADO |
| BUG-M3-15b | Compras | Regresión: native query ignoraba `:search` sin CAST → fix patrón inventario | Local (purchases) | ✅ CORREGIDO (2026-06-22 reinicio) |
| BUG-BUILD-01 | Global (build) | `ng serve`/`ng build` falla con 2 errores TS2322: `trackById(_, item: { id: number })` no asignable a `TrackByFunction<SupplierDTO>`/`<ClientDTO>` (ambos DTO tienen `id: number \| null`) bajo strictTemplates Angular 21. Enmascarado por bundle stale del dev server. Fix: tipar el parámetro al DTO real y retornar `number \| null` | Local (2 componentes: SuppliersPage, ClientsPage) | ✅ CORREGIDO (2026-06-22 2º reinicio) |

### Resultados del gatekeeper

| Fix aplicado | ng test | ng build | mvn test | Fecha |
|---|---|---|---|---|
| Todos los fixes BUG-M3-15..19 + docs | 456 specs, 0 fallos ✅ | (no ejecutado — brecha) ⚠️ | 405 tests, 0 fallos ✅ | 2026-06-22 |
| BUG-M3-15b (native query CAST fix) | 456 specs, 0 fallos ✅ | (no ejecutado — brecha) ⚠️ | mvn test -q exit code 0 ✅ | 2026-06-22 |
| BUG-BUILD-01 (trackBy strictTemplates) | 456 tests, 0 fallos ✅ | 0 errores ✅ | N/A (frontend-only) | 2026-06-22 |

> **⚠️ Brecha de gatekeeper detectada (BUG-BUILD-01)**: el gatekeeper de Fase 2 usaba solo
> `ng test`, cuya compilación (Vitest) no aplica el type-check AOT estricto de templates de
> `ng build`/`ng serve`. Por eso 456 specs pasaban pero el build de producción estaba roto.
> **A partir de ahora el gatekeeper DEBE incluir `ng build` además de `ng test` y `mvn test`.**

---

## FASE 3 — Re-ejecución ESTRICTA (Ronda 4 — Compras) — ⛔ INVALIDADA (BUG-M3-23, 2026-06-23)

> **⛔ RONDA INVALIDADA.** Durante la re-ejecución estricta (continuada el 2026-06-23 sobre el
> mismo bundle congelado) se encontró un bug nuevo en VIS-GEN-12 → **BUG-M3-23**. Conforme al
> protocolo de 4 fases (regla fundamental: una ronda solo es válida si se ejecuta íntegra sin
> hallazgos que obliguen a tocar código), **la ronda queda invalidada y NO se corrigió durante
> la ronda**. Próximo paso: **Fase 2** (corregir BUG-M3-23 + gatekeeper `ng build` + `ng test
> --no-watch` + `mvn test`), y luego **reiniciar la Fase 3 estricta desde cero**.
>
> **BUG-M3-23 — diálogos de confirmación de transición de estado sin `disableClose: true`.**
> En `purchase-order-detail-page.component.ts` los métodos `approve()` (L199), `receive()`
> (L208), `cancel()` (L220) y `removeDetail()` (L331) abren `ConfirmDialogComponent` SIN
> `disableClose: true`. Verificado en browser: el diálogo "Aprobar orden" (backdrop modal
> `cdk-overlay-dark-backdrop`) **se cierra al hacer click fuera** (la orden queda "Pendiente"
> porque `afterClosed` devuelve `undefined`). Viola **L31** ("todo MatDialog que pueda generar
> cambios de estado se abre con `disableClose: true` por defecto"). Único diálogo correcto:
> `removePendingDetail()` (L276). **Blast radius del fix: LOCAL** (solo componente
> `purchase-order-detail-page`) → en la próxima Fase 3 solo Compras necesita re-prueba.
> El PASS previo de VIS-GEN-12 (Re-test 2026-06-11) fue una observación incorrecta: la lectura
> estricta de la Ronda 4 lo detectó. Es exactamente el tipo de defecto que el protocolo busca.

> **Ronda 4 (lectura estricta)**: a diferencia de Ronda 3 (blast radius), aquí se re-ejecutan
> TODOS los casos de Compras (170) en una sola sesión continua sobre el bundle congelado
> (HEAD `8847c17`, app src = `cf5eefb`). Único modo que habilita declarar el módulo CERTIFICADO
> bajo Propuesta D. Ningún cambio de fuente entre el primer y el último caso.
>
> **Técnicas aplicadas** (catálogo en `protocolo_verificacion_4_fases.md`): tecleo real para
> BSRCH/VAL; `getComputedStyle()` RGB exacto para VIS; presencia/ausencia en DOM para RBAC/datos
> sensibles; `fetch`/`curl` con JWT por rol para SEC/CYBER/redacción de campos (L29); agrupación
> por rol para minimizar re-logins.

### Progreso Ronda 4 (estricta) por categoría — Compras

> Estado al momento de la invalidación (todos los casos ejecutados ANTES de encontrar
> BUG-M3-23 fueron PASS; el hallazgo aparece en VIS). La ronda se reinicia desde cero tras Fase 2.

| Categoría | Total | PASS | FAIL/ABIERTO | N/A | Estado |
|---|:---:|:---:|:---:|:---:|:---:|
| SEC | 6 | 6 | 0 | 0 | ✅ completa |
| RBAC | 19 | 19 | 0 | 0 | ✅ proveedores (01–11) + órdenes (RBAC-ORD-01..08, RBAC-DET) + pasadas MANAGER/WAREHOUSEMAN |
| CRUD | 21 | 21 | 0 | 0 | ✅ proveedores + órdenes (CRUD-DET-01/02 create UI) + líneas (CRUD-LIN-01..09) |
| VAL | 19 | 19 | 0 | 0 | ✅ proveedores + detalle + líneas (03/06 N/A donde aplica) |
| BSRCH | 12 | 12 | 0 | 0 | ✅ proveedores + órdenes (server-side f_unaccent) + líneas |
| UI | 24 | 24 | 0 | 0 | ✅ proveedores + órdenes (UI-ORD-02..07) + detalle (UI-DET-01..10) + líneas (UI-LIN-01..08) |
| FLOW | 12 | 12 | 0 | 0 | ✅ FLOW-DET-01..08 (aprobar/recibir/cancelar/editar, diálogos confirmar+cancelar) |
| RN | 8 | 8 | 0 | 0 | ✅ RN-DET-01/02/03 (campos disabled por estado) + RN backend |
| ERR | 12 | 12 | 0 | 0 | ✅ ERR-05 (fallback genérico, fuente) ..ERR-12 (403, interceptor) |
| EMPTY | 8 | 7 | 0 | 1 | ✅ proveedores + órdenes (1 N/A) |
| VIS | 14 | 13 | **1** | 0 | ⛔ **VIS-GEN-12 ⚠️ ABIERTO (BUG-M3-23)**; resto ✅ (VIS-ORD/DET/GEN con RGB exacto) |
| CYBER | 15 | 15 | 0 | 0 | ✅ completa (01–15) |
| **TOTAL** | **170** | **168** | **1** | **1** | ⛔ **INVALIDADA por BUG-M3-23** — 168 PASS antes del hallazgo, pero la ronda NO certifica. Reiniciar Fase 3 tras corregir en Fase 2. |

**Observaciones de la Ronda 4 (no invalidantes — drift documental, no defectos):**
1. **Destino de redirect SEC (SEC-01..05)**: el doc dice "redirige a home" pero el código
   congelado redirige a `/access-denied` (página 403 dedicada: ícono `lock`, "403 Acceso
   denegado", botones "Volver"/"Ir al inicio"). El control de acceso bloquea correctamente
   (no se alcanza la ruta protegida) — es una mejora de UX/seguridad, no un defecto.
   SEC-06 (sin token) sí redirige a `/login` como documentado. → actualizar texto del doc.
2. **L25 en SupplierFormComponent**: el botón "Guardar cambios" en edición usa
   `[disabled]="form.invalid || loading"` sin la guarda `!form.dirty` que exige L25. Es
   comportamiento preexistente del bundle congelado, no aseverado por ningún caso de Compras
   en alcance ni regresión de esta ronda → se registra como deuda técnica/observación honesta
   (no invalida la ronda).

---

## FASE 3 — Re-ejecución por blast radius (Ronda 3 — ✅ COMPLETADA — Compras, 2026-06-22)

> Fase 2 completada 2026-06-22. Todos los fixes son locales al módulo Compras.
> Alcance de re-ejecución acordado con el usuario: **"Solo zonas tocadas por los fixes"** —
> se re-ejecutó en browser únicamente el blast radius de los fixes de esta ronda (lista de
> órdenes con búsqueda server-side, formulario de línea, lista de proveedores/trackById)
> sobre bundle fresco. El resto de categorías de Compras y los demás módulos (Auth,
> Inventario, Ventas, Reportes) están **fuera del blast radius** → conservan su estado
> PASS/N/A de las verificaciones previas; no se re-probaron.

### Blast radius acumulado de los fixes de Fase 2

| Fix | Blast radius | Módulos afectados |
|---|---|---|
| BUG-M3-15..19 | Local (purchases) | Solo Compras |
| BUG-M3-16/17 (diseño) | Ninguno | N/A |
| BUG-INV-15/CYBER-13/CYBER-02 | N/A (ya estaban corregidos) | N/A |

**Módulos a re-ejecutar en Fase 3**: **solo Compras** (170 casos)

### Progreso de re-ejecución por módulo

| Módulo | Estado | Última categoría completada | Bugs nuevos encontrados |
|---|---|---|---|
| Auth / Usuarios | ⬜ Fuera de blast radius | — (sin fix en esta ronda) | — |
| Inventario | ⬜ Fuera de blast radius | — (sin fix en esta ronda) | — |
| Compras | ✅ COMPLETADA (blast radius) | BSRCH-SUP (lista proveedores / trackById) | 0 — código congelado |
| Ventas | ⬜ Fuera de blast radius | — (sin fix en esta ronda) | — |
| Reportes | ⬜ Fuera de blast radius | — (sin fix en esta ronda) | — |

### Progreso detallado por categoría (actualizar en tiempo real)

#### Auth / Usuarios
| Categoría | Total | PASS | FAIL | N/A | Estado |
|---|:---:|:---:|:---:|:---:|:---:|
| SEC | 5 | — | — | — | ⏳ |
| RBAC | 6 | — | — | — | ⏳ |
| CRUD | 9 | — | — | — | ⏳ |
| VAL | 11 | — | — | — | ⏳ |
| BSRCH | 3 | — | — | — | ⏳ |
| UI | 16 | — | — | — | ⏳ |
| FLOW | 7 | — | — | — | ⏳ |
| RN | 7 | — | — | — | ⏳ |
| ERR | 8 | — | — | — | ⏳ |
| EMPTY | 2 | — | — | — | ⏳ |
| VIS | 17 | — | — | — | ⏳ |

#### Inventario
| Categoría | Total | PASS | FAIL | N/A | Estado |
|---|:---:|:---:|:---:|:---:|:---:|
| SEC | 5 | — | — | — | ⏳ |
| RBAC | 28 | — | — | — | ⏳ |
| CRUD | 18 | — | — | — | ⏳ |
| VAL | 27 | — | — | — | ⏳ |
| BSRCH | 20 | — | — | — | ⏳ |
| UI | 28 | — | — | — | ⏳ |
| FLOW | 8 | — | — | — | ⏳ |
| RN | 10 | — | — | — | ⏳ |
| ERR | 10 | — | — | — | ⏳ |
| EMPTY | 7 | — | — | — | ⏳ |
| VIS | 15 | — | — | — | ⏳ |
| CYBER | 22 | — | — | — | ⏳ |

#### Compras (re-ejecución scoped al blast radius — 2026-06-22)
> Solo se re-ejecutaron en browser las categorías dentro del blast radius de los fixes de
> esta ronda. Las demás conservan su estado de 2026-06-11/12/21 (✅ fuera de blast radius).

| Categoría | Total | Re-ejecutado en Fase 3 (blast radius) | Estado |
|---|:---:|---|:---:|
| SEC | 10 | — (fuera de blast radius) | ✅ conservado |
| RBAC | 16 | — (fuera de blast radius) | ✅ conservado |
| CRUD | 19 | CRUD-LIN: eliminar línea con confirmación (BUG-M3-19 p2) | ✅ PASS |
| VAL | 19 | VAL-LIN-05 (subtotal no negativo, BUG-M3-18) | ✅ PASS |
| BSRCH | 12 | BSRCH-ORD-01..05 (búsqueda órdenes server-side) + BSRCH-SUP-03/04/05 (proveedores) | ✅ PASS |
| UI | 24 | — (fuera de blast radius) | ✅ conservado |
| FLOW | 12 | — (fuera de blast radius) | ✅ conservado |
| RN | 8 | — (fuera de blast radius) | ✅ conservado |
| ERR | 12 | — (fuera de blast radius) | ✅ conservado |
| EMPTY | 8 | EMPTY-ORD/EMPTY-SUP (estados vacíos de búsqueda) | ✅ PASS |
| VIS | 14 | VIS-SUP (render lista proveedores tras fix trackById) | ✅ PASS |
| CYBER | 15 | — (fuera de blast radius) | ✅ conservado |

#### Ventas
| Categoría | Total | PASS | FAIL | N/A | Estado |
|---|:---:|:---:|:---:|:---:|:---:|
| SEC | 10 | — | — | — | ⏳ |
| RBAC | 31 | — | — | — | ⏳ |
| CRUD | 15 | — | — | — | ⏳ |
| VAL | 17 | — | — | — | ⏳ |
| BSRCH | 6 | — | — | — | ⏳ |
| UI | 41 | — | — | — | ⏳ |
| FLOW | 12 | — | — | — | ⏳ |
| RN | 6 | — | — | — | ⏳ |
| ERR | 10 | — | — | — | ⏳ |
| EMPTY | 6 | — | — | — | ⏳ |
| VIS | 36 | — | — | — | ⏳ |

#### Reportes
| Categoría | Total | PASS | FAIL | N/A | Estado |
|---|:---:|:---:|:---:|:---:|:---:|
| (categorías pendientes de mapear del doc) | 94 | — | — | — | ⏳ |

---

## FASE 4 — Certificación (estado: ✅ CERTIFICADA — 2026-06-22)

| Campo | Valor |
|---|---|
| Fecha de certificación | 2026-06-22 |
| Commit hash frontend | `cf5eefb` (fix trackById/BUG-BUILD-01) mergeado a develop + commit `chore(qa)` de esta certificación |
| Commit hash backend | `c82a868` (fix BUG-M3-15b) → merge `d231270` en develop |
| ng test resultado | **37 test files · 456 specs · 0 fallos** (`ng test --no-watch`) |
| ng test cobertura | **88.94% statements** · 85.66% branches · 81.69% functions · 93.78% lines (≥70% ✅) |
| mvn test resultado | **405 tests · 0 fallos · 0 errores · BUILD SUCCESS** (`mvn clean test`) |

> **Nota:** durante la Fase 4 se detectó que dos fixes de Fase 2 estaban sin integrar a
> develop: el fix backend BUG-M3-15b (`PurchaseOrderRepository.java`) estaba modificado pero
> sin commitear en develop, y el fix frontend BUG-BUILD-01 (`cf5eefb`) vivía en la rama
> `fix/trackby-strict-templates-build` sin mergear. Ambos se integraron a develop vía
> `git merge --no-ff` antes de cerrar la certificación, de modo que el estado certificado
> coincide con el estado commiteado en develop. El backend requirió `mvn clean test` por una
> corrupción de instrumentación JaCoCo en `target/` (clean la resolvió).

---

## Contexto de recuperación rápida

> Si la sesión se interrumpe, iniciar la siguiente con estos pasos:

```
1. Leer este archivo (estado_sesion_activa.md)
2. Verificar qué fase está activa y cuál es la "Siguiente acción"
3. Si Fase 2: continuar con el primer bug ⏳ Pendiente de la tabla de bugs
4. Si Fase 3: continuar con el primer módulo/categoría que tenga ⏳ en la tabla
5. Re-obtener tokens JWT al inicio del primer módulo que se vaya a probar:
   Login con admin/Admin123!, qa_manager/QaManager123!, qa_warehouse/QaWarehouse123!, qa_sales/QaSales123!
6. Frontend en: http://localhost:4200
7. Backend en: http://localhost:8080/api/v1
```

---

## Notas de sesión

| Fecha | Nota |
|---|---|
| 2026-06-22 | Inicio de Ronda 3. Protocolo 4 fases establecido. 6 bugs de Compras autorizados para corrección. |
| 2026-06-22 | Fase 2 completada. Backend: 405 tests 0 fallos. Frontend: 456 tests 0 fallos. Todos los fixes mergeados a develop. |
| 2026-06-22 | Fase 3 iniciada. Blast radius: solo Compras (170 casos). Pendiente re-ejecución completa en browser. |
| 2026-06-22 | Fase 3 interrumpida: BUG-M3-15b encontrado en BSRCH-ORD-01 — native query ignoraba :search sin CAST(:search AS text). Fase 2 reiniciada. Fix aplicado. Gatekeeper: 456 specs 0 fallos + mvn exit 0. Fase 3 reiniciada. |
| 2026-06-22 | **Fase 3 INVALIDADA — bundle stale del dev server.** Al verificar BUG-M3-15b en browser, el paginador de órdenes mostraba "1–2 of 2" con 1 fila. Investigación (intercepción XHR + `getByStatus.toString()` en runtime) reveló que el navegador ejecutaba un **bundle compilado ANTERIOR al fix frontend de BUG-M3-15**: el `getByStatus` en runtime no enviaba el parámetro `search` y filtraba client-side (el código fuente sí lo envía). Conclusión: todos los casos "verificados" de esta Fase 3 corrieron contra código obsoleto → **inválidos**. Acción: kill ng serve + `rm -rf .angular/cache` + reinicio limpio. |
| 2026-06-22 | **Build roto descubierto (BUG-BUILD-01).** El reinicio limpio del dev server falló a compilar: 2 errores TS2322 en `trackById` de SuppliersPage y ClientsPage (strictTemplates). El bundle stale los enmascaraba. Vuelta a Fase 2. Fix aplicado (tipar param al DTO). Gatekeeper endurecido: `ng build` 0 errores ✅ + `ng test` 456 tests 0 fallos ✅. Dev server reiniciado y sirviendo HTTP 200 con código actual. **Pendiente: reconectar extensión de navegador para reiniciar Fase 3 desde cero sobre el bundle correcto.** |
| 2026-06-22 | **Fase 3 reinicio COMPLETADA (Compras, blast radius).** Navegador reconectado sobre bundle fresco. Alcance acordado con el usuario: "Solo zonas tocadas por los fixes". Re-ejecutado en browser: BSRCH-ORD-01..05 (búsqueda server-side `f_unaccent`, BUG-M3-15/15b) ✅; VAL-LIN-05 (subtotal $0.00 con cantidad -1, BUG-M3-18) ✅; BUG-M3-19 p1 (subtotal $960 al editar) + p2 (confirm dialog al eliminar línea en creación) ✅; lista proveedores tras fix trackById (BUG-BUILD-01): 116 filas sin errores de consola, búsqueda "logistica"→1 fila (accent-insensitive, tecleo real), "zzznoexiste"→empty-state, limpiar→restaura lista ✅. **0 bugs nuevos, código congelado de principio a fin.** Resultado Compras: 165 PASS · 5 N/A · 0 FAIL · 0 ABIERTO · 0 PENDIENTE. → Listo para Fase 4. |
| 2026-06-22 | **Fase 4 CERTIFICADA + integración de fixes a develop.** Frontend `ng test` 456 specs 0 fallos, cobertura 88.94% statements; backend `mvn clean test` 405 tests 0 fallos. Se integraron a develop dos fixes de Fase 2 que estaban sin mergear: backend BUG-M3-15b (`fix/purchases-m3-15b-search-cast` → merge `d231270`) y frontend BUG-BUILD-01 (`fix/trackby-strict-templates-build` → merge `6b5b1d6`); doc QA en `chore(qa)` `c323cfc` → merge `0236f27`. Push a `origin/develop` en ambos repos. Limpieza de duplicados de Finder en backend (`Dockerfile 2`, etc.). |
| 2026-06-22 | **Limpieza L33 de datos QA (proveedores).** Desactivados 101 proveedores de prueba vía `DELETE /api/v1/purchases/suppliers/{id}` (soft-delete): 1 XSS (`XSSTST999AA1`), 50 `AINT*` (integración), 50 `MGBR*` (RBAC). Verificación post-limpieza: 19 proveedores activos, todos reales, 0 coincidencias QA. |
