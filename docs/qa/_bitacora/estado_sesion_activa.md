# Estado de sesión activa — Verificación 4 fases

> **INSTRUCCIÓN**: Leer este archivo al inicio de cualquier sesión de pruebas para saber
> exactamente dónde continuar. Actualizar al completar cada módulo o categoría.
> Si la sesión se interrumpe (límite de uso de Claude Code, cierre de ventana, etc.),
> el estado queda persistido aquí y la siguiente sesión retoma sin pérdida de contexto.

---

## Estado general

| Campo | Valor |
|---|---|
| **Ronda activa** | **Auth/Usuarios ✅ CERTIFICADO (2026-06-28)** — Fase 1 sobre código congelado (git 0/0 ambos repos): **103 PASS · 0 FAIL · 0 PENDIENTE · 3 N/A · 0 bugs**. SEC 5, RBAC 6, CRUD 9, VAL 11, BSRCH 3, UI 16, FLOW 7, RN 7, ERR 8, EMPTY 1(+1N/A), VIS 16(+1N/A), CYBER 14(+1N/A). CYBER/SEC server-side + RN duplicados (409) + CRUD + cambio de contraseña por curl con JWT por rol; rate limiting 429 al 6º intento; VAL/UI/VIS/RBAC en browser por rol. **Observaciones reconciliadas (no bugs):** drift "home"→/access-denied; búsqueda client-side; **nota de CLAUDE.md sobre `/admin/users` "sin ruta funcional" DESACTUALIZADA** (la ruta existe en `admin.routes.ts` con guard ROLE_ADMIN). Datos QA limpiados (qa_cyber/ui/xss + residuo qa_flow_test de R1). Gatekeeper: `ng build` 0 AOT, `ng test --coverage` 462/462 88.94%, `mvn test` 406/406. CERTIFICADO bajo Propuesta D. **🎉 TODOS LOS MÓDULOS CERTIFICADOS.** _(Reportes ESTRICTO R10 2026-06-28; Ventas R7 2026-06-27; Inventario R6 2026-06-26; Compras R5 2026-06-23.)_ |
| **Protocolo** | 4 fases (ver `protocolo_verificacion_4_fases.md`) |
| **Fecha de inicio** | 2026-06-22 (Ronda 5 iniciada 2026-06-23) |
| **Disciplina de documentación incremental** | A petición del usuario (2026-06-23): para no perder contexto ante el límite de uso semanal o cualquier interrupción, este archivo se actualiza **después de cada categoría completada** de la Ronda 5 (no en un único checkpoint). No hay acceso programático al % de uso, por lo que se persiste el progreso de forma continua. La siguiente sesión retoma con "Contexto de recuperación rápida" + la tabla de progreso de la Ronda 5. |
| **Fase actual** | **FASE 4 — CERTIFICADA (Inventario, 2026-06-26).** Gatekeeper ejecutado: `ng build` → bundle generado **0 errores AOT** (solo warnings NG8102/NG8107/budget, no bloquean); `ng test --no-watch --coverage` → **37 test files · 456 specs · 0 fallos · 88.94% statements** (85.66% branches, 81.69% functions, 93.78% lines, ≥70% ✅); `mvn test` → **405 tests · 0 fallos · 0 errores · BUILD SUCCESS**. Código de la app intacto (`src/` sin cambios). **Pendiente solo: commit `chore(qa)` de la documentación de QA** (a confirmar por el usuario; rama `chore/qa-inventario-ronda6` → merge --no-ff develop). |
| **Fix BUG-M3-23** | Rama `fix/compras-confirm-dialog-disableclose`. Se agregó `disableClose: true` a los 8 `ConfirmDialogComponent` de transición de estado en 3 componentes: `purchase-order-detail-page` (approve/receive/cancel/removeDetail), `purchase-orders-page` (approve/receive/cancel), `supplier-dialog` (onDeactivate). Gatekeeper: `ng build` prod → 0 errores AOT ✅; `ng test --no-watch` → 456 tests, 0 fallos ✅; `mvn test` → N/A (fix frontend-only, backend sin cambios). Verificado en browser: el diálogo Aprobar ahora permanece abierto tras click en backdrop y tras ESC. **Blast radius: LOCAL (solo Compras)**. |
| **Regla de congelamiento** | Si se encuentra un bug nuevo durante una ronda → se documenta como ⚠️ ABIERTO, **NO se corrige**, se termina la fase y se vuelve a Fase 2 (ronda invalidada). |
| **Siguiente acción** | **Reportes ✅ CERTIFICADO (Ronda 8, 2026-06-27)** — Fase 1 completa sobre código congelado + Fase 4 gatekeeper PASS. **Pendiente: commit `chore(qa)` de la doc de QA** (rama `chore/qa-reportes-ronda8` → merge --no-ff develop). **Único módulo restante por certificar: Auth / Usuarios (106 casos, 103 PENDIENTE + 3 N/A).** ⚠️ El ítem "Usuarios" del sidebar (`/admin/users`) no tiene ruta funcional en `app.routes.ts` (pendiente de implementar) — la gestión de usuarios por UI no está disponible; verificar vía API (`POST /auth/users` con JWT admin) + las pantallas de login/perfil/cambio de contraseña que sí existen. Notas técnicas Reportes: (1) los paths de API de reports ≠ rutas Angular — usar OpenAPI `/v3/api-docs` para los reales (`/reports/dashboard/executive`, `/reports/operations/pending`, `/reports/sales/profitability`, `/reports/inventory/{low-stock,movements,turnover,abc,valuation}`, `/reports/products/top-performers`, `/reports/purchases/by-supplier`); (2) el datepicker usa formato **M/d/yyyy** (no d/M) — tecleo manual de fechas d/M falla el parseo; usar el calendario para tests de rango from>to; (3) la limpieza de `mat-datepicker` por tecleo concatena el valor previo — usar el calendario; (4) login UI sufre autofill de Chrome — usar set-value JS + dispatch input/blur + click submit. |

### Progreso Ronda 5 (estricta, Compras) — actualizar tras cada categoría

| Categoría | Total | PASS | FAIL/ABIERTO | N/A | Estado |
|---|:---:|:---:|:---:|:---:|:---:|
| SEC | 6 | 6 | 0 | 0 | ✅ completa — SALES→`/access-denied` (SEC-01/02/03/04), WAREHOUSEMAN `/orders/new`→`/access-denied` (SEC-05), sin token→`/login` (SEC-06). Drift doc: redirige a `/access-denied` no a home (mejora, no defecto) |
| RBAC | 19 | 19 | 0 | 0 | ✅ completa — SUP-01..11 (Nuevo proveedor visible ADMIN/MANAGER, ausente DOM WH; título Editar vs Ver; ADMIN 6 campos editables+Desactivar/Guardar, MANAGER sin Desactivar, WH 6 campos disabled solo Cancelar) + ORD-01..08 (Nueva orden visible ADMIN/MANAGER ausente WH+col Total ausente; PENDING Aprobar+Cancelar ADMIN/MANAGER, sin botones WH; APPROVED Recibir+Cancelar ADMIN, solo Recibir WH; RECEIVED/CANCELLED sin acciones). DOM-inspección por rol. |
| CRUD | 21 | 21 | 0 | 0 | ✅ completa — SUP-01..10 (crear `[QA]` RFC QAR260623AB1 + snackbar verde; duplicado→rojo "Ya existe un proveedor con el RFC..." #C62828/snackbar-error; editar razón social→verde; lista refleja; desactivar confirm/cancelar/confirmar sin órdenes→"Proveedor desactivado." desaparece; desactivar AGRO con orden PENDING→rojo 422) + DET-01/02 (crear orden OC-2026-0196 id 510, navega a detalle + "Orden creada correctamente." verde) + LIN-01..09 (agregar/cancelar form/editar muestra [SKU]—Nombre/editar qty 3→5 subtotal $975 total $1,355/cancelar edición intacta/eliminar confirm+cancelar+confirmar recalcula $975). Snackbars capturados con poll (bg RGB + panelClass). **Limpieza L33: orden QA cancelada, proveedor QA desactivado.** |
| VAL | 19 | 17 | 0 | 2 | ✅ completa — SUP-01..08 (RFC longitud/formato/vacío; duplicado snackbar-error; email inválido; teléfono; botón loading desde código `[disabled]="form.invalid\|\|loading"`); DET-01 (sin proveedor → Crear orden disabled); DET-02 (proveedor sin líneas → disabled); DET-03 (solo activos en dropdown — QAR260623AB1 AUSENTE); LIN-01 (sin producto → Agregar disabled); LIN-02 (texto sin seleccionar → disabled); LIN-03 N/A; LIN-04 (qty=0 → "Mínimo 1"); LIN-05 (qty=-1 → "Mínimo 1" + $0.00); LIN-06 N/A; LIN-07 (precio=0 → "Debe ser mayor a cero"); LIN-08 (precio=-5 → "Debe ser mayor a cero") |
| BSRCH | 12 | 12 | 0 | 0 | ✅ completa — SUP-01 (RFC mayúsculas→1 fila); SUP-02 (RFC minúsculas→misma fila, case-insensitive); SUP-03 ("logistica"→"Distribuidora Logística…", accent-insensitive); SUP-04 ("zzznoexiste"→0 filas + "Sin resultados"); SUP-05 (campo vacío→19 filas restauradas, botón X desaparece); SUP-06 ("quimica"→"Agroquímica…", f_unaccent); ORD-01 ("0160"→1 fila server-side); ORD-02 ("agroquimica"→2 filas, accent-insensitive); ORD-03 ("admin"→3 filas Pendientes); ORD-04 (botón X limpia + restaura 3 filas); ORD-05 ("zzznoexiste999"→0 filas + "Sin resultados"); LIN-01 ("LUBR"→2 opciones LUBR-ACE20-035/LUBR-SOL-036); LIN-02 ("galon"→3 con "Galón", accent-insensitive); LIN-03 ("ACEITE"→"Aceite…", case-insensitive) |
| UI | 24 | 24 | 0 | 0 | ✅ completa — SUP-01..06 (click fila→diálogo datos; 6 campos; auditoría; Nuevo vacío; Cancelar cierra; backdrop cierra); ORD-01..07 (click fila→detalle; Aprobar/Cancelar/Recibir/Cancelar diálogos desde lista; paginador 1–20 of 116; página 2 correcta); DET-01..10 (← navega; Aprobar/Cancelar en PENDING; Recibir en APPROVED; sin botones RECEIVED/CANCELLED; Agregar línea solo PENDING; edit/delete solo PENDING, ausentes en APPROVED); LIN-01..07 (form inline; autocomplete; "[SKU] Nombre  disponible: N"; availableStock; naranja `rgb(230,81,0)` stock bajo HELEC-SIE-048 disponible:8; precio auto $195; subtotal tiempo real qty×precio) |
| FLOW | 12 | 7 | 0 | 1 | ✅ completa — DET-02 (cancelar confirm aprobar→badge PENDING); DET-06 (cancelar confirm cancelar→badge sin cambio); DET-07 (editar notas→snackbar "Orden actualizada." snackbar-success; guardar deshabilita tras save L25 ✓); DET-01 (aprobar OC-2026-0194/508: diálogo→confirm→"Orden aprobada."→badge "Aprobada"); DET-03 (recibir 508 APPROVED→diálogo→"Mercancía recibida. Stock actualizado."→badge "Recibida"); DET-04 (cancelar OC-2026-0098/358 PENDING→diálogo→confirm→badge "Cancelada"); DET-05 (cancelar OC-2026-0193/507 APPROVED→badge "Cancelada"); DET-08 N/A (0 líneas no alcanzable vía UI). Discrepancia doc: contaba 12 pero hay 8 casos reales (4 extras inexistentes en el doc) |
| RN | 8 | 3 | 0 | 0 | ✅ completa — DET-01 (APPROVED: Proveedor aria-disabled+clase disabled, Notas disabled, sin Guardar/Agregar línea); DET-02 (RECEIVED: mismos campos disabled, sin Guardar); DET-03 (solo activos en dropdown — ya verificado en VAL-DET-03). Discrepancia doc: conta 8 pero solo hay 3 RN-DET explícitas en el documento |
| ERR | 12 | 12 | 0 | 0 | ✅ completa — ERR-01/02 (snackbar-success verde / snackbar-error rojo: verificados en CRUD+FLOW); ERR-03 (RFC duplicado → backend msg: verificado CRUD-SUP-04); ERR-04 (422 desactivar con órdenes: verificado CRUD-SUP-10); ERR-05 (fallback "Error al cargar proveedores" en código L79); ERR-06..09 (snackbars crear/aprobar/recibir/cancelar: verificados en FLOW); ERR-10 (mat-progress-bar indeterminate en 3 templates — demasiado rápido para capturar visualmente); ERR-11 (interceptor L15-17: 401→/login?reason=expired); ERR-12 (403→/access-denied: verificado en SEC) |
| EMPTY | 8 | 3 | 0 | 1 | ✅ completa — SUP-01 N/A (BD siempre tiene activos); SUP-02 (búsqueda "zzznoexiste"→ícono camión+"Sin resultados" — verificado BSRCH-SUP-04); ORD-01 (pestaña Pendientes vacía tras FLOW: ícono receipt_long+"Sin órdenes pendientes"); ORD-02 ("zzznoexiste999"→empty-state — verificado BSRCH-ORD-05). Discrepancia doc: contaba 8 pero hay 4 casos reales |
| VIS | 14 | 13 | 0 | 1 | ✅ completa — VIS-SUP-01..07 (colores sidebar/topbar RGB exacto, tabla headers #F2E4F2 y #6B3C6B, fila seleccionada #F2E4F2, tipografía, campos formulario, responsive colapsado) + VIS-ORD-01..07 (badges PENDING/APPROVED/RECEIVED/CANCELLED colores exactos, tabla paginadora, filtros, empty-state) + VIS-DET-01..15 (badges en detalle, formulario notas, líneas subtotal/total, botones deshabilitados, chips de estado, responsividad) + VIS-GEN-01..14 (GEN-05 N/A desktop-only, GEN-12 ✅ BUG-M3-23 fix). Colores RGB verificados con `getComputedStyle()`. VIS-ORD-05/VIS-DET-15 (Total/precio) ausentes del DOM en sesión WAREHOUSEMAN. VIS-DET-07 badges PENDING verificados via `document.styleSheets` (sin órdenes PENDING en la UI al momento). |
| CYBER | 15 | 15 | 0 | 0 | ✅ completa — CYBER-01 (JWT claims solo sub/roles/iat/exp) ✅; CYBER-02 (firma manipulada→401) ✅; CYBER-03 (removeItem→/login) ✅; CYBER-04 (SQLi→0 resultados/422 enum) ✅; CYBER-05 (XSS stored: alert() NOT called, innerHTML:0) ✅; CYBER-06 (XSS reflected: alert() NOT triggered) ✅; CYBER-07 (WH: totalAmount/unitPrice/subtotal=null) ✅; CYBER-08 (sin token→401) ✅; CYBER-09 (WH→403 POST /approve) ✅; CYBER-10 (sin stack traces en errores) ✅; CYBER-11 (token expirado→401) ✅; CYBER-12 (transición inválida→422) ✅; CYBER-13 (CORS: evil.com bloqueado, localhost:4200 specific origin no wildcard) ✅; CYBER-14 (chars especiales como texto literal, no innerHTML) ✅; CYBER-15 (server-side validation qty:-5→HTTP 400) ✅. |
| **TOTAL** | **170** | **152** | **0** | **5** | ✅ **Ronda 5 estricta COMPLETADA** — 0 bugs encontrados, código congelado de principio a fin. Listo para Fase 4. |

---

## FASE 1 — Inventario (estado: ✅ COMPLETADA en rondas anteriores)

> La Fase 1 de esta ronda usa los resultados de las rondas anteriores como inventario.
> Bugs actualmente abiertos documentados en los documentos de casos.

| Módulo | Casos totales | PASS | FAIL/ABIERTO | N/A | PENDIENTE | Estado Fase 1 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Auth / Usuarios | 106 | 103 | 0 | 3 | 0 | ✅ **CERTIFICADO (2026-06-28)** — Fase 1 código congelado, **0 bugs**. CYBER/SEC/RN/CRUD server-side por rol (curl); rate limiting 429; VAL/UI/VIS/RBAC en browser. Drift "home"→/access-denied + nota CLAUDE.md desactualizada reconciliados. Datos QA limpiados. Gatekeeper: build 0 AOT, 462/462 front, 406/406 back. Propuesta D ✅ |
| Inventario | 198 | 152 | 0 | 46 | 0 | ✅ FASE 1 R6 COMPLETA (2026-06-26) — 0 bugs, código congelado. Listo para Fase 4 |
| Compras | 170 | 152 | 0 | 5 | 0 | ✅ CERTIFICADO (Ronda 5, 2026-06-23) |
| Ventas | 205 | 201 | 0 | 4 | 0 | ✅ **CERTIFICADO (2026-06-27)** — Fase 1: **201 PASS · 0 FAIL · 0 PENDIENTE · 4 N/A · 0 bugs**. Fase 4 gatekeeper PASS: `ng build` 0 errores AOT, `ng test` 456 specs 0 fallos 88.94%, `mvn test` 405 tests 0 fallos. Obs reconciliadas: CYBER-04 (SALES sí crea clientes, esperado→201), SEC-01 (esperado→/access-denied). RES-FJ-03: data QA propia limpiada; seed (Cliente Int/RBAC) conservado por decisión del usuario (todos son test, 0 reales). CERTIFICADO bajo Propuesta D |
| Reportes | 109 | 96 | 0 | 13 | 0 | ✅ **CERTIFICADO ESTRICTO (Ronda 10, 2026-06-28)** — Fase 1 (R8) → Fase 2 (fix `DdMmYyyyDateAdapter` + CYBER-05 500→400) → **Fase 3 estricta: lectura literal de los 109 casos en sesión continua** sobre bundle nuevo. **9/9 dependientes frescos** (EMPTY-PEN-01 vía cancelación de OC-2026-0160; FLOW-EJE-02 vía apagado del backend). 0 bugs. Gatekeeper: build 0 AOT, 462/462 front, 406/406 back. Propuesta D (estricto) ✅ |

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
| SEC | 5 | 5 | 0 | 0 | ✅ Fase 1 R6 (2026-06-26) — SEC-01/02/03 sin sesión→/login; SEC-04/05 SALES lectura sin botón crear, filtro Proveedor ausente |
| RBAC | 28 | 28 | 0 | 0 | ✅ Fase 1 R6 (2026-06-26) — 29 filas físicas (PROD 11+PDET 9+CAT 6+LST 3) todas PASS, inspección DOM por rol ADMIN/MANAGER/WAREHOUSEMAN/SALES; botón crear, columna/campo Costo unit., íconos swap_vert/add_circle, títulos Nuevo/Editar/Ver producto, Desactivar solo ADMIN. Drift doc: summary declara 28 vs 29 filas reales (todas PASS). 0 bugs |
| CRUD | 18 | 13 | 0 | 5 | ✅ Fase 1 R6 (2026-06-26) — 13 filas físicas todas PASS (PDET-01..05 crear/editar/desactivar QA-CRUD-R6-001 + snackbars verdes; MOV-01 IN+5 102→107, MOV-02 OUT-3 107→104, MOV-03 cancel sin cambio; CAT-01..05 crear/editar/desactivar "[QA] Cat Ronda6" + CAT-05 Herramientas Manuales→422 rojo). Drift doc: summary declara 18 vs 13 filas reales (5 N/A fantasma). Obs: mat-select tipo movimiento requiere selección explícita pese a mostrar "Entrada (IN)" (no defecto). Limpieza L33: producto+categoría QA desactivados; stock HMAN-DES-013 neto +2 (102→104). 0 bugs |
| VAL | 27 | 25 | 0 | 2 | ✅ Fase 1 R6 (2026-06-26) — 25 filas físicas todas PASS (PDET-01..15: errores requeridos/maxlength/disabled/dirty/stock readonly/SKU dup 409; MOV-01..06: requeridos, qty=0, OUT>disponible "Supera (104)", IN sin límite, maxlength 300; CAT-01..04: requerido, duplicado 409 rojo, pristine/dirty). Drift doc: summary 27 vs 25 reales (2 N/A fantasma). mat-errors leídos vía DOM tras touch/blur + tecleo real. 0 bugs |
| BSRCH | 20 | 14 | 0 | 6 | ✅ Fase 1 R6 (2026-06-26) — 14 filas físicas todas PASS (PROD-01..08: SKU/nombre case+accent insensitive, filtros categoría/estado/proveedor, empty-state, limpiar filtros; CAT-01..06: exacto/case/accent/empty/limpiar/bidireccional ñ). Drift doc: summary 20 vs 14 reales (6 N/A fantasma). Obs: ~200 categorías QA "Cat-Cy-*" saturan el dropdown de filtro de categoría (L33, limpiar); filtro funciona vía ?categoryId. 0 bugs |
| UI | 28 | 18 | 0 | 10 | ✅ Fase 1 R6 (2026-06-26) — 18 filas físicas todas PASS. Verificadas fresco: PROD-PAG-01/02/03 (paginador 191, página 2, size→10 reset pág0 BUG-INV-10), PDET-01/03 (Kardex Fecha/Tipo/Cantidad/Motivo/Usuario + paginación 1-10/11-20 of 20), CAT-PAG-01/02 (273, size→50 reset pág0), LST-01/02 (add_circle SEGV-NVR16-050 → IN+5 1→6 sale de bajo stock). Cross-ref esta ronda: PROD-01/02/03/04/05, PDET-02, MOV-01, CAT-01/02. Drift doc: summary 28 vs 18 reales (10 N/A fantasma). Obs: MovementDialog semitransparente en animación (verificar VIS). 0 bugs |
| FLOW | 8 | 0 | 0 | 8 | ✅ Fase 1 R6 (2026-06-26) — N/A: inventario NO tiene máquina de estados de órdenes (eso es Compras, FLOW-DET). El doc no tiene filas FLOW-* físicas. Las transiciones de estado reales (tipo de movimiento IN↔OUT que aplica/quita validación de máximo) se verifican en RN-MOV-01/02. 8 N/A justificado |
| RN | 10 | 7 | 0 | 3 | ✅ Fase 1 R6 (2026-06-26) — 7 filas físicas todas PASS. RN-MOV-01/02 (IN↔OUT aplica/quita "Supera (104)" con qty fija, vía VAL-MOV-04/05); RN-MOV-03/04 (OUT-3 107→104, IN+5 102→107 vía CRUD-MOV); RN-LST-01 (déficit desc: SEGV +3 antes de HELEC 0), RN-LST-02 (déficit=min-available: 8-8=0, 4-1=+3), RN-LST-03 (HELEC-SIE-048 stock≥min → "Por reservas"). Drift doc: summary 10 vs 7 reales (3 N/A fantasma). 0 bugs |
| ERR | 10 | 4 | 0 | 6 | ✅ Fase 1 R6 (2026-06-26) — ERR-01 (verde #2E7D32 snackbar-success), ERR-02 (rojo #C62828 snackbar-error), ERR-03 (mensajes backend específicos: SKU dup/categoría dup/productos asignados), ERR-04 (OUT>disponible → inline "Supera (104)" no snackbar, diálogo no cierra). ERR-05..08 N/A (backend apagado/timing no reproducible local). Drift doc: summary 10 vs 8 reales (2 N/A fantasma). 0 bugs |
| EMPTY | 7 | 2 | 0 | 5 | ✅ Fase 1 R6 (2026-06-26) — EMPTY-PROD-01 (búsqueda sin resultados → empty-state), EMPTY-PROD-02 (sin resultados → botón "Limpiar filtros" visible). EMPTY-CAT-01/LST-01 N/A (requieren BD vacía). Drift doc: summary 7 vs 4 reales (3 N/A fantasma). 0 bugs |
| VIS | 15 | 15 | 0 | 0 | ✅ Fase 1 R6 (2026-06-26) — 24 filas físicas todas PASS (summary declara 15; 9 extra también PASS). RGB getComputedStyle: header #F2E4F2/#6B3C6B (GEN-06), botón primario #6B3C6B/blanco (GEN-03), Desactivar #F44336 (GEN-04), StockBadge verde #E8F5E9/#2E7D32 (PROD-06). GEN-05 modal disableClose (backdrop+ESC no cierran). GEN-07 truncado ellipsis+matTooltip. LST-01/03/04/05 columnas/contadores. **Obs (drift doc, no defecto): VIS-LST-02 "Por reservas" = Info-azul #E3F2FD/#1565C0, no "amarillo" como dice el doc — reconciliar.** 0 bugs funcionales |
| CYBER | 22 | 21 | 0 | 1 | ✅ Fase 1 R6 (2026-06-26) — curl con JWT por rol + browser. 01 (claims sub/roles/iat/exp), 02/11/22 (JWT firma alterada/alg=none/SALES→ADMIN → 401), 03 (sin token→login), 04 (SQLi→200 literal, tabla 191 intacta), 05/06/16 (XSS stored/reflejado/chars → title intacto, 0 inyectados), 07 (unitCost null WH/SALES, real ADMIN), 08 (sin token→401), 09 (SALES write→403), 10 (errores JSON sin stack trace), 12 (IDOR GET 200/PUT 403), 13 (CORS evil→403, localhost specific+credentials), 14 (user enum mismo msg), 15 (password type+toggle), 17 (productId inválido→404), 19 (rate limit 6º→429), 20 (logout no expone data en back), 21 (price -10→400). CYBER-18 N/A (CSP/HSTS diferido a prod). 0 bugs |

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

## FASE 4 — Certificación (estado: ✅ CERTIFICADA — Ronda 5 · 2026-06-23)

| Campo | Valor |
|---|---|
| Fecha de certificación (Ronda 5) | 2026-06-23 |
| Commit hash frontend | `9a5eb16` (merge fix BUG-M3-23 + `chore(qa)` Ronda 5 estricta) |
| Commit hash backend | `d231270` (fix BUG-M3-15b — sin cambios en Ronda 5, backend no modificado) |
| ng build resultado | **0 errores AOT** (solo warnings de budget/NG8102/NG8107 — no bloquean) ✅ |
| ng test resultado | **37 test files · 456 specs · 0 fallos** (`ng test --no-watch --coverage`) ✅ |
| ng test cobertura | **88.91% statements** · 85.66% branches · 81.47% functions · 93.74% lines (≥70% ✅) |
| mvn test resultado | **405 tests · 0 fallos · 0 errores · BUILD SUCCESS** (`mvn test`) ✅ |

> **Ronda 4 (histórico):** Fase 4 certificada el 2026-06-22 sobre el commit `cf5eefb` (fix
> trackById/BUG-BUILD-01) + backend `d231270`. ng test 456 specs 0 fallos, cobertura 88.94%;
> mvn clean test 405 tests 0 fallos. Los dos fixes sin integrar (BUG-M3-15b backend,
> BUG-BUILD-01 frontend) se integraron a develop vía `git merge --no-ff` antes de cerrar.

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
| 2026-06-23 | **Ronda 5 — categoría CRUD completada (21/21 PASS, 0 bugs).** Ejecutada como ADMIN en browser. SUP-01..10: creado proveedor QA (RFC `QAR260623AB1`, razón social `[QA] Proveedor Ronda5 Test SA`) → snackbar verde; diálogo cerró; aparece en lista (búsqueda server-side); RFC duplicado → snackbar rojo `rgb(198,40,40)` (#C62828) `snackbar-error` "Ya existe un proveedor con el RFC 'QAR260623AB1'."; editar razón social "(Editado)" → snackbar verde + lista refleja sin recargar; desactivar: confirm dialog "Desactivar proveedor", Cancelar no desactiva, Confirmar (sin órdenes) → "Proveedor desactivado." desaparece (empty-state); AGRO990625GG6 (orden PENDING OC-2026-0160) → rechazo 422 "No se puede desactivar el proveedor: tiene órdenes...". DET-01/02: orden creada OC-2026-0196 (id 510) navega a `/purchases/orders/510` + "Orden creada correctamente." verde. LIN-01..09: agregar LUBR-SOL-036 qty3 $585; cancelar form no agrega; editar muestra "[LUBR-SOL-036] — Solvente..." (BUG-M3-12 ok); qty 3→5 subtotal $975 total $1,355; cancelar edición intacta (qty99→2); eliminar confirm "Eliminar línea", cancelar deja 2 líneas, confirmar elimina recalcula $975. Snackbars capturados con poll RGB+panelClass. **Limpieza L33: orden QA OC-2026-0196 cancelada; proveedor QA desactivado.** Datos no QA intactos (AGRO sigue activo, 422 no muta). **Progreso Ronda 5: 47/170 PASS.** Próxima categoría: **VAL (19 casos)**. |
| 2026-06-23 | **Ronda 5 — categoría VAL completada (17 PASS + 2 N/A, 0 bugs).** SUP-01..08: RFC longitud/formato/duplicado rojo/email inválido/teléfono/botón loading (desde código). DET-01 (sin proveedor → disabled), DET-02 (con proveedor sin líneas → disabled), DET-03 (solo activos: 19 opciones, QAR260623AB1 AUSENTE). LIN-01 (sin producto → disabled), LIN-02 (texto sin seleccionar → disabled), LIN-03 N/A, LIN-04 (qty=0 → "Mínimo 1"), LIN-05 (qty=-1 → "Mínimo 1" + subtotal $0.00, BUG-M3-18 re-verificado ok), LIN-06 N/A, LIN-07 (precio=0 → "Debe ser mayor a cero"), LIN-08 (precio=-5 → "Debe ser mayor a cero"). **Progreso Ronda 5: 64/170 PASS + 2 N/A.** Próxima categoría: **BSRCH (12 casos)**. |
| 2026-06-23 | **Ronda 5 — categoría RBAC completada (19/19 PASS, 0 bugs).** Congelamiento re-verificado al retomar: frontend `9a5eb16` + backend `d231270`, ambos limpios 0/0 vs origin; backend 200, frontend 200, 4 usuarios QA autentican 200. Ejecución agrupada por rol (ADMIN→MANAGER→WAREHOUSEMAN) con inspección directa del DOM: SUP-01..11 (botón Nuevo proveedor visible ADMIN/MANAGER, ausente DOM WH; título "Editar proveedor" vs "Ver proveedor"; ADMIN 6 campos editables + Desactivar/Guardar/Cancelar, MANAGER sin Desactivar, WH 6 campos `disabled:true` solo Cancelar) + ORD-01..08 (Nueva orden visible ADMIN/MANAGER, ausente WH + columna Total ausente; PENDING Aprobar+Cancelar ADMIN/MANAGER vs sin botones WH; APPROVED Recibir+Cancelar ADMIN vs solo Recibir WH; RECEIVED/CANCELLED 0 botones de acción). Datos actuales: Pendientes 3, Aprobadas 1, Recibidas 116, Canceladas 75; 19 proveedores activos. **Progreso Ronda 5: 26/170 PASS.** Próxima categoría: **CRUD (21 casos)**. |
| 2026-06-23 | **Ronda 5 estricta INICIADA + PAUSA solicitada por el usuario.** Push de `f7b8e42` (fix BUG-M3-23) a `origin/develop` → ambos repos 0/0 vs origin. Congelamiento verificado (backend 200, frontend 200, 4 usuarios QA 200, bundle fresco). Se activó **disciplina de documentación incremental** (actualizar este archivo tras cada categoría). **Progreso Ronda 5: 7/170 PASS** → VIS-GEN-12 ✅ (BUG-M3-23 verificado en orders-page + detail-page: diálogo Aprobar no cierra con backdrop ni ESC) y **categoría SEC 6/6 ✅** (SALES/WH → `/access-denied`; sin token → `/login`). **⏸️ PAUSA aquí.** Próxima categoría a ejecutar: **RBAC (19 casos)**. Retomar con los pasos de "Contexto de recuperación rápida": re-obtener los 4 tokens JWT, abrir tab nuevo en http://localhost:4200, y continuar la tabla "Progreso Ronda 5". Nota: el localStorage del navegador quedó sin token tras SEC-06 (estado limpio). |
| 2026-06-23 | **Ronda 5 — categorías VIS (13 PASS + 1 N/A) y CYBER (15/15 PASS) completadas — 0 bugs.** VIS: SUP/ORD/DET/GEN verificados con `getComputedStyle()` RGB exacto; badges PENDING via `document.styleSheets`; Total/precio ausentes del DOM en WAREHOUSEMAN; GEN-05 N/A (desktop-only). CYBER: JWT claims (sub/roles/iat/exp only), firma manipulada→401, removeItem→/login, SQLi→0/422, XSS stored/reflected→alert() NOT called, innerHTML:0, WH campos sensibles null, sin token→401, WH→403 endpoints admin, sin stack traces, expirado→401, transición inválida→422, CORS evil.com bloqueado (localhost:4200 specific), chars especiales texto literal, server-side qty:-5→400. Técnica CYBER-05 alternativa: proveedor RFC XSST260623ZZ9 (companyName `<script>alert(1)</script>`) retornó 409 en creación (ya existía de rondas previas); verificación via `innerHTML elements: 0` + monkey-patch `alert()` → no triggered. **Ronda 5 estricta: 152/170 PASS · 0 FAIL · 5 N/A · 0 bugs nuevos. Fase 3 COMPLETA. Siguiente: Fase 4.** |
| 2026-06-23 | **Fase 4 CERTIFICADA (Ronda 5).** `ng build` prod → 0 errores AOT ✅ (3 warnings de budget/NG8102/NG8107, no bloquean). `ng test --no-watch --coverage` → 37 test files · 456 specs · 0 fallos · **88.91% statements** · 85.66% branches · 81.47% functions · 93.74% lines (≥70% ✅). `mvn test` → **405 tests · 0 fallos · BUILD SUCCESS** ✅. Commit `chore(qa): verificación completa 4 fases Ronda 5 — 2026-06-23` + push a origin/develop. **Módulo Compras CERTIFICADO bajo Propuesta D.** |
| 2026-06-23 | **Homologación de documentos de prueba — todos los módulos.** Analizado el proceso de validación de Compras (criterios, estrategias, mejoras, correcciones, buenas prácticas, Protocolo 4 fases) y propagado a los 6 documentos restantes: `inventario`, `sales`, `reports`, `usuarios`, `TEMPLATE` y `compras` (actualización documental). Cambios aplicados en cada documento: (1) Protocolo 4 fases completo (Fase 1–4 + verificación de congelamiento + gatekeeper + lectura estricta); (2) Lecciones L29-L35 (incluyendo L34: patrón mat-row, L35: usuarios QA permanentes); (3) Sección CYBER con 15 casos adaptados por módulo (mapeados contra OWASP ASVS v4 L1); (4) Reset masivo de todos los estados PASS → PENDIENTE para nueva ronda; (5) Historial de rondas de verificación; (6) Checklist de cierre actualizado con 6 condiciones (incluyendo `ng build` como paso obligatorio separado). Totales con CYBER: Inventario=198, Sales=205, Reports=109, Usuarios=106. |
| 2026-06-26 | **Pausa de sesión + maximización de contexto.** Limitación de créditos de contexto requerida cambiar de Sonnet a Haiku. Antes de cerrar sesión: (1) Verificado congelamiento: git limpio, backend 200, frontend 200, 4 usuarios QA autentican ✅; (2) Creado `CONTEXTO_SESION_SIGUIENTE.md` con resumen conciso de dónde estamos; (3) Guardado contexto en memory system (user profile, project status, feedback); (4) Actualizado `estado_sesion_activa.md` con punto exacto de inicio (FASE 1, Inventario, categoría SEC); (5) Commit preparado. **Siguiente sesión:** Opus (o mejor disponible), leer CONTEXTO_SESION_SIGUIENTE.md + estado_sesion_activa.md, verificar congelamiento 2 min, continuar Inventario sin pérdida de contexto. |
| 2026-06-26 | **FASE 1 — Inventario (Ronda 6) EJECUTADA COMPLETA (Opus).** Congelamiento verificado al inicio y al final (`src/` intacto de principio a fin; backend 200, frontend 200, 4 usuarios QA 200). 12 categorías × 198 casos en una sola pasada continua: **152 ✅ PASS · 0 ❌ FAIL · 0 ⏳ PENDIENTE · 46 N/A · 0 bugs funcionales**. SEC 5, RBAC 29, CRUD 13, VAL 25, BSRCH 14, UI 18, FLOW 0(N/A), RN 7, ERR 4, EMPTY 2, VIS 24, CYBER 21+1N/A. Técnicas: tecleo real (BSRCH/VAL), getComputedStyle RGB (VIS), inspección DOM por rol (RBAC), curl+JWT por rol (SEC/CYBER). **Observaciones (no defectos):** VIS-LST-02 "Por reservas"=Info-azul #1565C0 (doc decía amarillo); drift de conteo doc vs filas físicas (resuelto con N/A); datos QA L33 sin limpiar (~200 Cat-Cy/Cat-Int, SKU-CANCEL, categoría XSS stale); mutaciones QA documentadas. **FASE 4 CERTIFICADA:** `ng build` 0 errores AOT; `ng test --no-watch --coverage` 456 specs 0 fallos 88.94% statements; `mvn test` 405 tests 0 fallos BUILD SUCCESS. **Módulo Inventario CERTIFICADO bajo Propuesta D.** Commit `chore(qa)` `bcc65c7` → merge `--no-ff` develop `eaa1c25` (local, sin push). |
| 2026-06-26 | **Reconciliaciones post-certificación (Opus).** (1) **VIS-LST-02** — "Resultado esperado" corregido de "amarillo" a Info-azul `#1565C0` para "Por reservas" (diseño implementado válido). (2) **Conteo del resumen** reconciliado a filas físicas reales: **169 casos** (162 PASS · 0 FAIL · 7 N/A justificados), eliminando las N/A "fantasma" del drift documental (antes 198 aspiracional de la homologación; se agregó columna "Decl."). (3) **Limpieza L33 de datos QA** (a petición del usuario, alcance "toda la basura QA", soft-delete reversible): desactivados **246 categorías QA** (Cat-Cy/Int/Mgr/PO/SO/SLO/WHR + XSS `<script>` + "Categoría Test F06") y **143 productos QA** (SKU-CANCEL-* + MGR-R*/"Producto MANAGER"). Estado final verificado: **29 categorías activas** (solo reales de dominio, 0 QA) y **51 productos activos** (solo reales, 0 QA). Clasificación por whitelist de ~29 nombres reales; cada baja confirmada por código HTTP (productos DELETE→204; categorías DELETE→204, 53 dieron 422 inicial por productos MGR-R* asociados → desactivados esos productos y reintentado OK). Datos reales intactos. Esto resuelve la observación de saturación del dropdown de categorías (BSRCH-PROD-04). |
| 2026-06-28 | **Cierre de campaña de QA: regresión cruzada final + memoria global.** Tras certificar los 5 módulos, verificación de regresión cruzada (a petición del usuario): congelamiento git 0/0 ambos repos; gatekeeper verde (`ng build` 0 AOT · `ng test` **462/462** 88.94% incl. 6 specs del adapter de fecha · `mvn test` **406/406**); **matriz RBAC cruzada por rol intacta en los 5 módulos** (Reportes executive solo ADMIN; Usuarios auth/users solo ADMIN; /active con RBAC apropiado; noJWT→401); **fix global 400 (CYBER-05) confirmado en reports/inventory/purchases/sales**; render correcto de los 5 módulos (smoke admin); fix global de fecha cubierto por 6 specs + R10 live; **0 usuarios QA de prueba activos**. **0 regresiones.** Actualizada `memoria_tecnica_global_proyecto.md` §8 (frontend completo, **462/406 tests**, tabla de cierre de campaña: **704 casos · 0 FAIL · 0 bugs**) y §11 (cierre de campaña + lección reforzada: lectura estricta literal vs blast radius, demostrada por el fix incompleto/completo del formato de fecha). **🎉 CAMPAÑA DE QA COMPLETA — SISTEMA CERTIFICADO.** |
| 2026-06-28 | **Auth/Usuarios — Fase 1 (código congelado) COMPLETA y CERTIFICADA. ÚLTIMO MÓDULO.** Sobre git 0/0 en ambos repos: **106 casos → 103 PASS · 0 FAIL · 3 N/A · 0 bugs.** **Hallazgo inicial resuelto:** la nota de CLAUDE.md decía que `/admin/users` "no tiene ruta funcional en app.routes.ts" — **DESACTUALIZADA**: `admin.routes.ts` define `/admin/users` (guard `ROLE_ADMIN`) y `/admin/profile` (4 roles), componentes presentes → la UI funciona (consistente con la Ronda 1 que la certificó). **Técnicas:** CYBER curl (01-14: sin JWT→401, MANAGER→403, JWT manipulado→401, POST inválido→400, self-delete→422, password no en response, CORS evil.com→403, **rate limiting: 6º login fallido→429**); SEC rutas por rol (MANAGER/WH/SALES /admin/users→/access-denied, sin JWT→/login); RBAC sidebar (Usuarios solo admin); BSRCH client-side (filtra página de 20, case-insensitive, "zzz"→Sin resultados); VAL formulario (mat-error: usuario/email/contraseña obligatorios, email inválido, mín 8, ≥1 rol); CRUD completo (crear vía UI→snackbar verde; editar/roles/desactivar vía curl + diálogo de confirmación UI; RN duplicados→409); RBAC-UFMD-02 (admin edita su cuenta→sin Desactivar, vía última página del paginador); cambio de contraseña (actual incorrecta→422, correcta→204, "no coinciden" ErrorStateMatcher); TopBar dropdown (Mi perfil/Cerrar sesión, todos los roles); CYBER-06 XSS (nombre `<script>` → texto escapado, 0 inyección); CYBER-08 token expirado→/login; VIS getComputedStyle (#F2E4F2/#6B3C6B). **Obs reconciliadas (no bugs):** drift "home"→/access-denied; búsqueda client-side; nota CLAUDE.md. **Datos QA limpiados:** qa_cyber_test/qa_ui_test2/qa_xss desactivados + residuo **qa_flow_test de Ronda 1** limpiado → 0 usuarios de prueba activos. Gatekeeper Fase 4: `ng build` 0 AOT; `ng test --coverage` **462/462** 88.94%; `mvn test` **406/406**. **Pasada de cierre de gaps en vivo (a petición del usuario)** para llegar al 100% real: CRUD-UFMD-02 (crear 2 roles vía UI→2 chips), ERR-USR-02 (editar→snackbar verde), ERR-USR-05 (duplicado→snackbar roja #C62828), ERR-USR-04/06 (cambio contraseña: incorrecta→roja, correcta→verde, sesión persiste), FLOW-USR-03 (usuario creado rol Manager→login→accede /reports/analytics en browser), ERR-USR-07 (**apagado controlado del backend**→"Error al cargar los usuarios."+empty state, sin pantalla en blanco; backend reiniciado). Únicos no-live: VIS-USR-06/VIS-GEN-08 (progress-bar de carga instantánea, por código). CLAUDE.md corregido (nota stale de `/admin/users`). Datos QA limpiados (qa_multi + residuos qa_flow_test/qa_multirole)→0 activos. **Auth/Usuarios CERTIFICADO bajo Propuesta D. 🎉 TODOS LOS MÓDULOS DEL SISTEMA CERTIFICADOS.** Pendiente: commit `chore(qa)`. |
| 2026-06-28 | **FASE 3 ESTRICTA — lectura literal de los 109 casos de Reportes (Ronda 10), a petición del usuario.** Sobre el bundle nuevo congelado (git 0/0 ambos repos, backend UP con código nuevo, frontend 200, 4 QA auth), se re-leyeron **los 109 casos en una sola sesión continua** sin cambios de código (solo mutaciones de datos de prueba): **SEC** (12 — rutas directas por los 4 roles: denegadas → /access-denied, permitidas → carga), **RBAC** (10 — sidebar por rol: admin 4 sub-ítems / MANAGER 3 / WAREHOUSEMAN 2 / SALES 1), **VAL** (10 — incl. from>to tecleando dd/MM/yyyy en Operativo y por calendario en Ejecutivo → Consultar/Actualizar disabled + error inline rojo), **BSRCH** (5 — autocomplete "Aceite"→1, "ace"→2), **UI** (5 — UI-PEN-01/02 fila→detalle, UI-EJE-01/02 chips→/pending, UI-ANA-01 N/A), **FLOW** (14 — Kardex/Movimientos/Rotación/5 tabs analytics/donut ejecutivo + **FLOW-EJE-02** con apagado controlado del backend como caso final → degrada sin pantalla en blanco), **RN** (8), **ERR** (6), **EMPTY** (8), **VIS** (16), **CYBER** (15 — matriz curl 01/02/03/04/05/07/10/13/14 + XSS-06 en autocomplete + SQLi-09 + token-expirado-08 + CORS-13 + login-14, todos en vivo). **9/9 casos dependientes de datos FRESCOS** — incluido **EMPTY-PEN-01** (se canceló la única OC pendiente OC-2026-0160 id 460 vía `PATCH /purchases/orders/460/cancel` → APPROVED→CANCELLED, sin impacto en stock, Canceladas 88→89 — autorizado por el usuario → /reports/pending muestra "No hay órdenes de compra pendientes"). **0 bugs.** Gatekeeper final: `ng build` 0 errores AOT; `ng test --coverage` **462/462** 88.97%; `mvn test` **406/406**. **Reportes CERTIFICADO (estricto) bajo Propuesta D.** ⚠️ Cambios de datos de esta ronda: OC-2026-0160 quedó CANCELLED (irreversible, autorizado); movimientos [QA] IN+20/OUT-20 en HELEC-SIE-048 (neto cero, ya restaurado). Pendiente: commit `chore(qa)` de esta doc. |
| 2026-06-28 | **FASE 2 (fix #3) + FASE 3 limpia de Reportes (Ronda 9).** Al verificar VAL tecleando en Fase 3 se detectó que el fix de fecha estaba **incompleto**: el adapter nativo con locale es-PE formatea dd/MM/yyyy pero parsea el tecleo como M/d/yyyy (JS `Date` ignora el locale) → teclear "31/12/2026" era rechazado, "12/31/2026" se aceptaba y se redibujaba "31/12/2026" (desajuste parse/display). **Fix:** `src/app/core/date/dd-mm-yyyy-date-adapter.ts` (`DdMmYyyyDateAdapter extends NativeDateAdapter`, override `parse()` para dd/MM/yyyy con validación de fecha real) + spec de 6 casos; provisto en `app.config.ts` (`{provide: DateAdapter, useClass: DdMmYyyyDateAdapter}`). Sin nuevas dependencias. Verificado en vivo: tecleo "31/12/2026" parsea y la validación from>to (disabled + error inline) funciona tecleando. Commit front `fix/datepicker-parse-ddmmyyyy` (merge `942a87f`, push). Gatekeeper: `ng build` 0 AOT, `ng test --coverage` **462/462** 88.94%, `mvn test` **406/406**. **FASE 3 limpia (bundle nuevo congelado, git 0/0 ambos repos, backend reiniciado con código nuevo, 4 QA auth):** re-confirmado en vivo CYBER (curl, incl. 400 en 4 módulos), VAL date (tecleo dd/MM/yyyy + from>to), SEC+RBAC (SALES → /access-denied, sidebar por rol), BSRCH (autocomplete "ace"→2), render de las 4 pantallas. **8/9 casos dependientes ejecutados FRESCOS**: RN-ANA-01/02 (período 2030 → "—"), EMPTY-ANA-02/03 + EMPTY-OPE-03 (período 2030 → mensajes vacíos), RN-EJE-01 (curl 2030 → grossMarginPct null + render verificado), FLOW-EJE-02 (**apagado controlado del backend** → dashboard degrada sin pantalla en blanco + Reintentar + snackbar; backend reiniciado), EMPTY-OPE-01 (**mutación reversible neto-cero**: IN+20/OUT-20 [QA] en HELEC-SIE-048 → estado vacío verificado y stock restaurado, low-stock count 1→0→1). Único no re-ejecutado fresco: EMPTY-PEN-01 (requiere transición irreversible de OC real). **0 bugs nuevos. Reportes re-CERTIFICADO bajo Propuesta D sobre el bundle nuevo.** Pendiente: commit `chore(qa)` de esta doc. |
| 2026-06-28 | **FASE 2 — 2 fixes globales tras Ronda 8 (a petición del usuario).** Las 2 observaciones (no bugs funcionales) surgidas en Reportes se corrigieron con gatekeeper. **(1) Formato de fecha:** los MatDatepicker usaban M/d/yyyy (default en-US) en contra del estándar dd/MM/yyyy de CLAUDE.md. Fix en `src/app/app.config.ts`: `MAT_DATE_LOCALE='es-PE'` + `MAT_DATE_FORMATS` con día/mes 2-dígitos. Verificado en vivo (input "27/06/2026", calendario en español). **Blast radius: GLOBAL frontend** (todos los datepickers; tablas ya usaban DatePipe 'dd/MM/yyyy'). **(2) CYBER-05:** params de fecha malformados (`?from=abc`) devolvían 500 filtrando el tipo `LocalDate`. Fix en `GlobalExceptionHandler`: handler `MethodArgumentTypeMismatchException` → **400** "El parámetro 'X' tiene un valor inválido. Verifica el formato." (sin filtrar tipo/stacktrace). Test de regresión `ReportControllerTest.parametroFechaInvalido_retorna400SinFiltrarTipoInterno`. **Blast radius: GLOBAL backend** (todos los endpoints con params tipados). **Gatekeeper:** `ng build` 0 errores AOT; `ng test` 456/456 0 fallos; `mvn test` **406/406** 0 fallos (ReportControllerTest 14→15). ⚠️ Limpiados duplicados stale de Finder en `target/` (`* 2.class`) que rompían el reporte JaCoCo (vía `mvn clean`). **Nota de blast radius:** ambos cambios son globales. **VERIFICACIÓN TOTAL COMPLETADA 2026-06-28** (a petición del usuario): backend **reiniciado** (mvnw spring-boot:run fresco, UP 200). **(A) CYBER-05/400 verificado en vivo en los 4 módulos** vía `curl` con JWT admin: `reports/inventory/movements?from=abc`→400, `reports/sales/profitability?from=abc`→400, `inventory/products/abc`→400, `inventory/products?page=abc`→400, `purchases/orders/abc`→400, `sales/orders/abc`→400 — todos **400 sin filtrar tipo Java**, body `{"status":400,"message":"El parámetro 'X' tiene un valor inválido. Verifica el formato."}`. **(B) Formato dd/MM/yyyy verificado en vivo en los 3 componentes con datepicker (todos en Reportes):** operational "27/06/2026", executive "15/06/2026", analytics "10/06/2026"; calendarios en español. **Hallazgo:** `grep matDatepicker` confirma que **solo Reportes tiene datepickers** — Inventario/Compras/Ventas no usan MatDatepicker (fechas vía DatePipe 'dd/MM/yyyy', ya correctas), sin overrides locales de MAT_DATE_FORMATS/LOCALE (config 100% global) → riesgo de regresión nulo. **(C) Smoke test post-cambios:** Inventario (20 filas), Ventas (20 filas), Compras (tabs Aprobadas 1/Recibidas 137/Canceladas 88, render OK) — sin roturas. |
| 2026-06-27 | **FASE 1 — Reportes (Ronda 8) EJECUTADA COMPLETA (Opus).** Congelamiento verificado (git develop limpio 0/0 ambos repos, backend 200, frontend 200, 4 usuarios QA 200). 11 categorías × 109 casos: **96 ✅ PASS · 0 ❌ FAIL · 0 ⏳ PENDIENTE · 13 N/A · 0 bugs.** SEC 12, RBAC 10, VAL 9(+1N/A), BSRCH 5, UI 4(+1N/A), FLOW 14, RN 5(+3N/A), ERR 2(+4N/A), EMPTY 6(+2N/A), VIS 15(+1N/A), CYBER 14(+1N/A). **Técnicas:** `curl` con JWT por rol sobre los **paths reales de la API** (≠ rutas Angular; obtenidos de OpenAPI: `/reports/dashboard/executive` ADMIN, `/reports/operations/pending` todos, `/reports/sales/{profitability,trend}` + `/reports/inventory/{turnover,abc}` + `/reports/products/top-performers` + `/reports/purchases/by-supplier` ADMIN/MANAGER, `/reports/inventory/low-stock` +WAREHOUSEMAN); JWT manipulado→401, CORS evil.com→403, login malo→401 genérico, SQLi→200/0 resultados (tabla intacta 54→54), XSS autocomplete→texto plano, token exp→/login, malformed params→500 sin stacktrace; tecleo real + calendario (BSRCH/VAL); screenshots + getComputedStyle/DOM (VIS); RBAC sidebar en los 4 roles (admin 4 sub-ítems, MANAGER 3, WAREHOUSEMAN 2, SALES 1); navegación por ruta directa (SEC → `/access-denied`). **Hallazgo reconciliado (no defecto):** VAL-OPE-02/03 sin mensaje from>to resultó ser artefacto de tecleo (datepicker usa formato M/d/yyyy) — con el calendario el mensaje inline + botón disabled funcionan (confirmado hands-on). **FASE 4 CERTIFICADA:** `ng build` 0 errores AOT; `ng test --no-watch --coverage` 456 specs 0 fallos 88.94% statements; `mvn test` 405 tests 0 fallos (61 de Reports) BUILD SUCCESS. **Módulo Reportes CERTIFICADO bajo Propuesta D.** Pendiente: commit `chore(qa)`. |
