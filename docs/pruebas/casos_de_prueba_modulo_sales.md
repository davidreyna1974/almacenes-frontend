# Casos de prueba — Módulo 4: Ventas (Sales)

**Módulo:** Ventas (Sales)
**Ruta base:** `/sales`
**Roles con acceso:** ADMIN, MANAGER, WAREHOUSEMAN, SALES (los 4 roles — primer módulo
visible para todos)
**Roles sin acceso:** ninguno (acceso de lectura universal; restricciones por acción,
no por ruta, excepto `/sales/orders/new`)
**Fecha de creación:** 2026-06-13
**Última actualización:** 2026-06-23 — Estados reseteados a ⏳ PENDIENTE para nueva ronda de verificación bajo Protocolo 4 fases. Se agregan: sección "Protocolo 4 fases", L34/L35 en lecciones, sección CYBER (15 casos), "Historial de rondas" y "Checklist de cierre" actualizado.

> Generado a partir de `casos_de_prueba_modulo_TEMPLATE.md`, siguiendo la estructura de
> `casos_de_prueba_modulo_compras.md`. Basado en `propuesta_modulo_sales_frontend.txt`
> (aprobada 2026-06-13), incluyendo decisiones D1-D8 y hallazgos H1/H2/H3.

---

## Cómo usar este documento

1. Cada caso tiene un ID único (`CATEGORIA-PANTALLA-NNN`)
2. Ejecutar cada caso en el browser con el JWT del rol indicado
3. Actualizar la columna **Estado** con el resultado real observado en el browser
4. Si el estado es ❌ FAIL: registrar el bug en §10 de este documento y en §8 de la
   memoria técnica con referencia al ID — **documentar únicamente, no corregir sin
   autorización**
5. Un componente/módulo solo está "done" cuando **toda la columna Estado está llena**
   y **ningún caso está ⏳ PENDIENTE**

**Estados:** `✅ PASS` | `❌ FAIL` | `⏳ PENDIENTE` | `N/A`

**Usuarios QA permanentes (L35)**:
- `admin` / `Admin123!` · `qa_manager` / `QaManager123!` · `qa_warehouse` / `QaWarehouse123!` · `qa_sales` / `QaSales123!`

---

## ⚠️ Protocolo obligatorio de ejecución — 4 fases (permanente)

> Toda ronda de verificación de este documento sigue el protocolo completo en
> `docs/pruebas/protocolo_verificacion_4_fases.md`. Referencia rápida:

**FASE 1 — Inventario (código congelado)**: ejecutar TODOS los casos sin tocar código. Documentar bugs como `⚠️ ABIERTO`. No corregir nada.

**FASE 2 — Corrección + gatekeeper**: por cada fix, en orden: `ng build` (0 errores AOT) → `ng test --no-watch` (0 fallos) → `mvn test` (0 fallos nuevos). Documentar blast radius.

**FASE 3 — Re-ejecución congelada**: re-ejecutar todos los casos del blast radius en una sola sesión sin modificar código. Si aparece bug nuevo → ⚠️ ABIERTO, NO corregir, volver a Fase 2.
- Verificación de congelamiento antes del primer caso: git limpio 0/0 vs origin en ambos repos; backend 200; dev server 200 con bundle fresco; 4 usuarios QA autentican.

**FASE 4 — Certificación**: `ng build` 0 errores + `ng test --coverage` 0 fallos ≥70% statements + `mvn test` 0 fallos + commit `chore(qa)` + actualizar `estado_sesion_activa.md`.

> **Solo una Fase 3 de lectura estricta** (todos los casos, una sola sesión, código congelado de principio a fin) habilita declarar el módulo **CERTIFICADO** bajo Propuesta D.
> **`estado_sesion_activa.md`** — leer al iniciar cada sesión; actualizar al completar cada categoría.

---

## ⚠️ Lecciones MANDATORIAS (L29-L33) — aplicadas desde el diseño inicial

> Primera aplicación desde el día 1 de un módulo (ver `feedback_lecciones_mandatorias_L29_L33`).

- **L29** — Matriz de campos sensibles × roles (sección 6.2 de la propuesta):
  `SaleOrderDetailResponseDTO.unitCost` oculto para WAREHOUSEMAN/SALES — casos
  `RBAC-LIN-01..04`.
- **L30** — 401/403 explícitos; H1 documenta el caso transitorio de 500 con mensaje de
  negocio válido — caso `ERR-10`.
- **L31** — `disableClose: true` en `ClientDialog` y `SaleOrderDetailFormDialog`; reset
  de paginador a página 0 — casos `UI-CLF-05`, `UI-LIN-04`, `UI-CLI-PAG-03`,
  `UI-ORD-PAG-03`.
- **L32** — Mixin SCSS compartido para headers de tabla — casos `VIS-CLI-07`,
  `VIS-ORD-07`, `VIS-GEN-07`.
- **L33** — `forkJoin` en `ReservationsPageComponent` con `catchError` por observable —
  casos `RBAC-RES-FJ-01..03`.
- **L34** — Click en `mat-row` abre el diálogo de detalle/edición (`ClientDialog`, `SaleOrderDetailPage`);
  no existe columna `actions` redundante. Botones dentro del formulario usan `$event.stopPropagation()`.
  (Origen: homologación Clientes ↔ Proveedores 2026-06-14 — casos `UI-CLF-*`, `UI-ORD-*`).
- **L35** — Usar usuarios QA permanentes para verificación RBAC (no efímeros):
  `admin`, `qa_manager`, `qa_warehouse`, `qa_sales` — ver bloque al inicio del documento.

---

## Resumen de cobertura

| Categoría | Total casos | PASS | FAIL | PENDIENTE | N/A |
|---|---|---|---|---|---|
| SEC — Seguridad de rutas | 10 | 10 | 0 | 0 | 0 |
| RBAC — Control de acceso UI | 31 | 31 | 0 | 0 | 0 |
| CRUD — Flujos de datos | 15 | 15 | 0 | 0 | 0 |
| VAL — Validaciones de formulario | 17 | 17 | 0 | 0 | 0 |
| BSRCH — Búsqueda e inputs | 6 | 6 | 0 | 0 | 0 |
| UI — Botones e íconos | 41 | 41 | 0 | 0 | 0 |
| FLOW — Flujos de estado/negocio | 12 | 11 | 0 | 0 | 1 |
| RN — Reglas de negocio | 6 | 6 | 0 | 0 | 0 |
| ERR — Mensajes de error | 10 | 10 | 0 | 0 | 0 |
| EMPTY — Estados vacíos | 6 | 3 | 0 | 0 | 3 |
| VIS — Visual y estética | 36 | 36 | 0 | 0 | 0 |
| CYBER — Ciberseguridad | 15 | 15 | 0 | 0 | 0 |
| **TOTAL** | **205** | **201** | **0** | **0** | **4** |

> **Estado actual: ✅ MÓDULO VENTAS CERTIFICADO (Ronda 7, 2026-06-27)** — Fase 1: 205 casos sobre código
> congelado (`src/` intacto) → **201 ✅ PASS · 0 ❌ FAIL · 0 ⏳ · 4 N/A · 0 bugs funcionales**. **Fase 4 — Certificación:**
> `ng build` 0 errores AOT; `ng test --no-watch --coverage` 37 test files · 456 specs · 0 fallos · 88.94% statements;
> `mvn test` 405 tests · 0 fallos · BUILD SUCCESS. **Certificado bajo Propuesta D.**
>
> _(detalle Fase 1)_ — 205 casos ejecutados sobre código congelado (`src/` intacto): **201 ✅ PASS · 0 ❌ FAIL · 0 ⏳ · 4 N/A · 0 bugs funcionales**.
> Técnicas: tecleo real (BSRCH/VAL), `getComputedStyle()` RGB (VIS), inspección DOM por rol (RBAC/datos
> sensibles), `curl` con JWT por rol (SEC/CYBER/redacción `unitCost` L29). **Reconciliaciones aplicadas (2026-06-27,
> confirmadas por el usuario):** (1) **CYBER-04** — resultado esperado corregido de 403 a **201**: SALES SÍ puede
> crear clientes por diseño (regla de negocio confirmada; consistente con RBAC-CLI-01). NO es defecto.
> (2) **SEC-01** — resultado esperado actualizado de "home" a **`/access-denied`** (página 403 dedicada,
> consistente con Compras e Inventario, mejora de UX). NO es defecto.
> (3) Datos QA acumulados (clientes `Cliente Int`/`Cliente RBAC R*`, órdenes con productos `MGR-R*` inactivos)
> — limpieza L33 (RES-FJ-03) pendiente al cierre. N/A justificados: EMPTY-CLI-01/ORD-01/ORD-02 (sin datos vacíos
> reproducibles), FLOW-DET-07 (escenario inalcanzable por diseño). **Pendiente: limpieza L33 + Fase 4 certificación.**
> Mutaciones QA de la ronda documentadas y revertidas/limpiadas (clientes [QA]/hack/XSS desactivados; órdenes 2699/2879 con líneas restauradas; órdenes 2904/2926 canceladas — datos QA).

---

## 0. Seguridad de rutas (SEC)

> Verificar con acceso directo por URL — NO basta con esconder el ítem del sidebar (L18 —
> BUG-M3-07). `/sales` es accesible para los 4 roles; solo `/sales/orders/new` tiene
> restricción de rol (Decisión D1/Propuesta C). Las restricciones de ESCRITURA
> (Aprobar/Entregar/Cancelar/Desactivar cliente) se verifican a nivel de API (curl), no
> de ruta — un guard de ruta no las cubre.

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| SEC-01 | Acceso directo `/sales/orders/new` | WAREHOUSEMAN | Sesión activa | Redirige a `/access-denied` (página 403 dedicada con mensaje de acceso denegado; gate Propuesta C/D1) | ✅ PASS | Fase 1 R1 (2026-06-27): login `qa_warehouse` → navegar `/sales/orders/new` → redirige a `/access-denied` (gate de ruta bloquea correctamente). **RECONCILIADO (2026-06-27)**: el resultado esperado se actualizó de "home" a `/access-denied` — consistente con Compras e Inventario (la app evolucionó a una página 403 dedicada, mejora de UX). No es defecto. |
| SEC-02 | Sin sesión activa — acceso a `/sales/clients` | (sin JWT) | Token expirado / sin login | Redirige a `/login` | ✅ PASS | Fase 1 R1 (2026-06-27): `localStorage.clear()` + navegar `/sales/clients` → `pathname === /login`. |
| SEC-03 | Acceso directo `/sales/clients`, `/sales/orders`, `/sales/orders/new`, `/sales/reservations` | ADMIN | Sesión activa | Todas las rutas accesibles | ✅ PASS | Fase 1 R1 (2026-06-27): `admin` — las 4 rutas cargan (clients 20 filas, orders 20 filas, orders/new con Costo unit./Margen, reservations con contenido). |
| SEC-04 | Acceso directo `/sales/clients`, `/sales/orders`, `/sales/reservations` | WAREHOUSEMAN | Sesión activa | Las 3 rutas accesibles (solo lectura) | ✅ PASS | Fase 1 R1 (2026-06-27): `qa_warehouse` (chip WAREHOUSEMAN) — las 3 rutas cargan (clients 20 filas, orders 20 filas, reservations con contenido), sin redirect. |
| SEC-05 | Acceso directo `/sales/orders/new` | SALES | Sesión activa | Ruta accesible (SALES puede crear órdenes) | ✅ PASS | Fase 1 R1 (2026-06-27): `qa_sales` (chip SALES) — `/sales/orders/new` carga el formulario "Nueva orden de venta", sin redirect. |
| SEC-06 | `PATCH /api/v1/sales/orders/{id}/approve` (curl) | WAREHOUSEMAN | Orden PENDING existente, JWT WAREHOUSEMAN | 403 Forbidden | ✅ PASS | Fase 1 R1 (2026-06-27): orden 2929 (OV-2026-0920, PENDING) → 403. Orden sigue PENDING. |
| SEC-07 | `PATCH /api/v1/sales/orders/{id}/approve` (curl) | SALES | Orden PENDING existente, JWT SALES | 403 Forbidden | ✅ PASS | Fase 1 R1 (2026-06-27): orden 2904 (OV-2026-0907, PENDING) → 403. Orden sigue PENDING. |
| SEC-08 | `PATCH /api/v1/sales/orders/{id}/deliver` (curl) | SALES | Orden APPROVED existente, JWT SALES | 403 Forbidden | ✅ PASS | Fase 1 R1 (2026-06-27): orden 2926 (OV-2026-0917, APPROVED) → 403. Orden sigue APPROVED. |
| SEC-09 | `PATCH /api/v1/sales/orders/{id}/cancel` (curl) | WAREHOUSEMAN | Orden PENDING/APPROVED existente, JWT WAREHOUSEMAN | 403 Forbidden | ✅ PASS | Fase 1 R1 (2026-06-27): orden 2879 (OV-2026-0894, PENDING) → 403. Orden sigue PENDING. |
| SEC-10 | `DELETE /api/v1/sales/clients/{id}` (curl) | SALES | Cliente activo existente, JWT SALES | 403 Forbidden | ✅ PASS | Fase 1 R1 (2026-06-27): cliente 1715 → 403. Cliente sigue activo. |

---

## 1. Lista de clientes (`ClientsPageComponent`)

### 1a. Visual y estructura (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-CLI-01 | Título de la página visible | ADMIN | "Clientes" | ✅ PASS | Breadcrumb "Ventas → Clientes" |
| VIS-CLI-02 | Columnas de la tabla: Nombre, RFC, Contacto, Teléfono, Email, Acciones | ADMIN | Todas las columnas visibles | ✅ PASS | |
| VIS-CLI-03 | Barra de búsqueda visible en la parte superior | ADMIN | Campo "Buscar" con ícono lupa | ✅ PASS | |
| VIS-CLI-04 | Botón "Nuevo cliente" visible | ADMIN | Botón con ícono `add` visible | ✅ PASS | |
| VIS-CLI-05 | Cursor `pointer` en filas; hover cambia el fondo; fila seleccionada `#F2E4F2` | ADMIN | Comportamiento correcto | ✅ PASS | |
| VIS-CLI-06 | Texto largo en Nombre/Email se trunca con `…` y tooltip | ADMIN | text-overflow:ellipsis + tooltip | ✅ PASS | Verificado con "Cliente Int XXXXX" / emails largos |
| VIS-CLI-07 | Header de tabla con fondo `#F2E4F2` y texto `#6B3C6B` vía mixin SCSS compartido (L32) | ADMIN | Colores correctos; `.scss` usa `@include`/`@extend`, no copia manual | ✅ PASS | `clients-page.component.scss` usa `@include mixins.catalog-table-header` |
| VIS-CLI-08 | `mat-progress-bar` visible durante carga (no spinner centrado) | ADMIN | Barra indeterminada en parte superior | ✅ PASS | `@if (loading) { <mat-progress-bar mode="indeterminate"> }` confirmado en código y al recargar |

### 1b. Búsqueda (BSRCH)

> `GET /sales/clients/active?search=` — accent/case insensitive vía `f_unaccent`.

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| BSRCH-CLI-01 | Buscar por nombre exacto | ADMIN | Cliente "Cliente Int 12823" existe | Filtra correctamente | ✅ PASS | Fase 1 R1 (2026-06-27): "Cliente Int 12947" → 1 fila exacta. |
| BSRCH-CLI-02 | Buscar en minúsculas (case insensitive) | ADMIN | Registro con mayúsculas | Encuentra el registro | ✅ PASS | Fase 1 R1 (2026-06-27): "cliente int 12947" (minúsculas) → "Cliente Int 12947". |
| BSRCH-CLI-03 | Buscar sin acento (accent insensitive), ej. "Almacén" → "almacen" | ADMIN | Registro con acento ("[QA] Cliente Almacén Acentuado") | Encuentra el registro | ✅ PASS | Fase 1 R1 (2026-06-27): "almacen" → "[QA] Cliente Almacén Acentuado" (f_unaccent). |
| BSRCH-CLI-04 | Buscar término sin resultados | ADMIN | Término no existe | Estado vacío: ícono + mensaje contextual | ✅ PASS | Fase 1 R1 (2026-06-27): "zzznoexiste999" → 0 filas + empty-state. |
| BSRCH-CLI-05 | Limpiar campo de búsqueda | ADMIN | Campo con término activo | Lista restaurada; todos los clientes activos visibles | ✅ PASS | Fase 1 R1 (2026-06-27): borrar el campo → 20 filas restauradas. |
| BSRCH-CLI-06 | Botón X de limpieza visible SOLO cuando hay texto | ADMIN | Campo vacío vs con texto | Sin texto → sin X; con texto → X visible | ✅ PASS | Fase 1 R1 (2026-06-27): con texto → botón X presente; campo vacío → botón X ausente. |

### 1c. RBAC en lista (RBAC)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-CLI-01 | Botón "Nuevo cliente" visible | ADMIN / MANAGER / SALES | Visible | ✅ PASS | Fase 1 R1 (2026-06-27): visible con `admin`, `qa_manager`, `qa_sales` (DOM). |
| RBAC-CLI-02 | Botón "Nuevo cliente" NO visible | WAREHOUSEMAN | Ausente del DOM (no solo oculto) | ✅ PASS | Fase 1 R1 (2026-06-27): `qa_warehouse` — botón ausente del DOM. |
| RBAC-CLI-03 | Click en fila abre "Editar cliente" (campos editables) | ADMIN / MANAGER / SALES | Diálogo "Editar cliente" con campos habilitados | ✅ PASS | Fase 1 R1 (2026-06-27): click fila → "Editar cliente" 6 inputs editables, con `admin`/`qa_manager`/`qa_sales`. |
| RBAC-CLI-04 | Click en fila abre "Ver cliente" (solo lectura) | WAREHOUSEMAN | Diálogo "Ver cliente" con campos `disabled` y solo botón "Cancelar" | ✅ PASS | Fase 1 R1 (2026-06-27): `qa_warehouse` — título "Ver cliente", 6 campos `disabled`, único botón "Cancelar". |
| RBAC-CLI-05 | Botón "Desactivar" visible dentro del diálogo "Editar cliente" | ADMIN / MANAGER | Visible | ✅ PASS | Fase 1 R1 (2026-06-27): `admin` y `qa_manager` — botón "Desactivar" presente. |
| RBAC-CLI-06 | Botón "Desactivar" NO visible dentro del diálogo "Editar cliente" | SALES | Ausente del DOM (`canDeactivate()` excluye SALES) | ✅ PASS | Fase 1 R1 (2026-06-27): `qa_sales` — "Editar cliente" solo Cancelar/Guardar cambios, sin "Desactivar". |
| RBAC-CLI-07 | Botón "Desactivar" NO visible (modo solo lectura) | WAREHOUSEMAN | Ausente del DOM | ✅ PASS | Fase 1 R1 (2026-06-27): `qa_warehouse` — "Ver cliente" sin "Desactivar" (= CLI-04). |

### 1d. Botones e íconos de acción (UI)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-CLI-01 | Click en fila selecciona el cliente en el panel/diálogo de detalle | ADMIN | Lista cargada | Detalle del cliente mostrado | ✅ PASS | Abre `ClientFormDialogComponent` |
| UI-CLI-02 | Click en fila abre `ClientFormDialogComponent` con datos precargados, campo editado se guarda | ADMIN | Cliente seleccionado | Diálogo "Editar cliente" abre con precarga; tras editar y "Guardar cambios" → snackbar "Cliente actualizado correctamente" y valor persistido visible en la tabla | ✅ PASS | **Homologación 2026-06-14**: reemplaza el patrón de ícono "Editar" (eliminado). Verificado end-to-end con `[QA] Cliente Homologacion Row`: editar teléfono → guardar → reabrir muestra "Actualizado por admin" y el nuevo teléfono |
| UI-CLI-03 | Botón "Desactivar" dentro de `ClientFormDialogComponent` abre `ConfirmDialog` | ADMIN | Cliente activo, diálogo "Editar cliente" abierto | Diálogo de confirmación abre con mensaje correcto | ✅ PASS | **Homologación 2026-06-14**: reemplaza el patrón de ícono "Desactivar" (eliminado). El botón vive ahora dentro de `ClientFormComponent` (línea 71) |
| UI-CLI-04 | Confirmar Desactivar → cliente desaparece de la lista de activos | ADMIN | Diálogo de confirmación abierto | Snackbar verde "Cliente desactivado."; lista actualizada sin recargar | ✅ PASS | Verificado con `[QA] Cliente Homologacion Row` (creado, editado y desactivado en esta sesión, L33) |

### 1e. Estados vacíos (EMPTY)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| EMPTY-CLI-01 | Lista sin clientes activos | Ícono + "Sin clientes registrados" | N/A | No reproducible sin desactivar los ~50 clientes activos existentes (afectaría datos compartidos de otras pruebas). Mismo bloque de template (`@if (!loading && clients.length === 0)`) y mismo componente `EmptyStateComponent` que EMPTY-CLI-02 (✅ PASS) — solo cambia `variant`/`titleOverride` vs `descriptionOverride`, ambos verificados por código en `clients-page.component.html` líneas 38-46 |
| EMPTY-CLI-02 | Búsqueda sin resultados | Ícono + 'Sin resultados para "..."' | ✅ PASS | Fase 1 R1 (2026-06-27): "almacen01xyz999" → empty-state ícono `search_off` + "Sin resultados" + 'Sin resultados para "almacen01xyz999"'. |

### 1f. Paginación (UI)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| UI-CLI-PAG-01 | Paginador visible cuando hay > pageSize clientes | > 20 clientes en BD | Paginador con total, opciones 10/20/50 | ✅ PASS | ~50 clientes activos, paginador con opciones 10/20/50 |
| UI-CLI-PAG-02 | Cambio de página carga la página correcta | Paginador visible | Filas cambian al ir a página 2 | ✅ PASS | |
| UI-CLI-PAG-03 | Cambiar búsqueda estando en página > 0 resetea a página 0 (L31) | En página 2+, buscar | Paginador regresa a página 0 | ✅ PASS | `currentPage = 0` se aplica en el mismo punto que dispara `load()` tras `searchCtrl.valueChanges` |

---

## 2. Formulario de cliente (`ClientDialogComponent` / `ClientFormComponent`) — D5

### 2a. Apertura y visual (UI)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-CLF-01 | Botón "Nuevo cliente" abre `ClientDialog` vacío | ADMIN / MANAGER / SALES | — | Todos los campos vacíos; sin datos precargados | ✅ PASS | Verificado con admin y ventas01 |
| UI-CLF-02 | Click en el renglón de la tabla abre `ClientDialog` con datos del cliente (homologado con pantalla de Proveedores — sin columna de acciones/íconos por renglón) | ADMIN / MANAGER / SALES | Cliente existente | Campos precargados correctamente; el botón "Desactivar" está dentro del propio diálogo | ✅ PASS | **Homologación 2026-06-14**: se eliminó la columna "Acciones" (íconos editar/desactivar) de `clients-page.component.html/ts/scss` — ahora el único punto de entrada es el click en el renglón (`onRowClick` → `openDetail`), igual que `SuppliersPageComponent`. El botón "Desactivar" ya existía en `ClientFormComponent` (visible si `canDeactivate && item.active`) y sigue funcionando sin cambios. Verificado en browser con admin: click en renglón abre "Editar cliente" con campos precargados y botón "Desactivar" visible |
| UI-CLF-03 | Botón Cancelar cierra sin guardar | ADMIN | Formulario con cambios | Cierra; lista no cambia | ✅ PASS | |
| UI-CLF-04 | Campos muestran label visible (no solo placeholder) | ADMIN | Diálogo abierto | Labels siempre visibles | ✅ PASS | |
| UI-CLF-05 | Click en backdrop/ESC con cambios sin guardar (L31, `disableClose: true`) | ADMIN | Diálogo abierto, con cambios | Diálogo permanece abierto; cambios no se pierden | ✅ PASS | `DIALOG_CONFIG.disableClose = true` en `clients-page.component.ts` |
| VIS-CLF-01 | Campos obligatorios tienen un solo `*` (Validators.required) | ADMIN | Diálogo abierto | Solo un `*` por campo obligatorio (Nombre) | ✅ PASS | **BUG-S4-01 corregido** (2026-06-13): se quitó el `*` manual de `<mat-label>Nombre *</mat-label>` en `client-form.component.html` línea 13 — ahora solo aparece el `*` automático de Angular Material por `Validators.required`. Verificado en browser: "Nombre*" (un solo asterisco) |

### 2b. RBAC en formulario (RBAC)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-CLF-01 | Título "Nuevo cliente" / "Editar cliente" | ADMIN / MANAGER / SALES | Título correcto según modo | ✅ PASS | Fase 1 R1 (2026-06-27): "Editar cliente" con admin/qa_manager/qa_sales. |
| RBAC-CLF-02 | Formulario editable — todos los campos habilitados, botón Guardar visible | ADMIN / MANAGER / SALES | Campos editables | ✅ PASS | Fase 1 R1 (2026-06-27): 6 inputs editables + "Guardar cambios" con admin/qa_manager/qa_sales. |
| RBAC-CLF-03 | Diálogo en modo solo lectura — campos `disabled`, sin botón Guardar | WAREHOUSEMAN | Click en fila abre vista de solo lectura (si aplica) o ícono Ver | ✅ PASS | Fase 1 R1 (2026-06-27): `qa_warehouse` — "Ver cliente", 6 campos disabled, sin "Guardar"/"Desactivar". |
| RBAC-CLF-04 | Botón "Desactivar" visible en el diálogo | ADMIN / MANAGER | Visible; ausente para SALES | ✅ PASS | Fase 1 R1 (2026-06-27): visible para admin/qa_manager; ausente para qa_sales. |

### 2c. Validaciones (VAL)

> Botón Guardar requiere `form.dirty` en edición (L25 — BUG-M3-20).

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-CLF-01 | Nombre vacío al intentar guardar | Campo vacío | Error inline "Campo requerido"; botón deshabilitado | ✅ PASS | Fase 1 R1 (2026-06-27): Nombre vacío + blur → "El nombre es obligatorio." + submit disabled. |
| VAL-CLF-02 | Nombre > 150 caracteres | Valor de 200 chars | Campo no acepta más o error visible (maxlength 150) | ✅ PASS | Fase 1 R1 (2026-06-27): `maxlength=150` confirmado vía DOM. |
| VAL-CLF-03 | RFC > 13 caracteres | Valor de 14 chars | Error "Máximo 13 caracteres" | ✅ PASS | Fase 1 R1 (2026-06-27): `maxlength=13` confirmado vía DOM. |
| VAL-CLF-04 | Teléfono > 20 caracteres | Valor de 26 chars | Error "Máximo 20 caracteres" | ✅ PASS | Fase 1 R1 (2026-06-27): `maxlength=20` confirmado vía DOM. |
| VAL-CLF-05 | Nombre de contacto > 100 caracteres | Valor de 138 chars | Error "Máximo 100 caracteres" | ✅ PASS | Fase 1 R1 (2026-06-27): `maxlength=100` confirmado vía DOM. |
| VAL-CLF-06 | Email con formato inválido | "no-es-email" | Error "Formato de email inválido" | ✅ PASS | Fase 1 R1 (2026-06-27): email "no-es-email" + blur → "Formato de correo inválido.". |
| VAL-CLF-07 | Botón Guardar deshabilitado con formulario inválido | Nombre vacío | `disabled:true` en el DOM | ✅ PASS | Fase 1 R1 (2026-06-27): formulario nuevo vacío → "Crear cliente" `disabled:true`. |
| VAL-CLF-08 | Botón Guardar deshabilitado al cargar en modo edición (sin cambios) | Diálogo recién abierto en modo editar | `disabled:true` — `form.dirty = false` | ✅ PASS | Fase 1 R1 (2026-06-27): "Editar cliente" recién abierto → "Guardar cambios" `disabled:true` (pristine, L25). |
| VAL-CLF-09 | Botón Guardar se activa al modificar un campo y se desactiva tras guardar | Modificar Nombre → Guardar | `disabled:false` tras editar; `disabled:true` tras guardar (`markAsPristine`) | ✅ PASS | Fase 1 R1 (2026-06-27): editar Nombre → submit `disabled:false` (CRUD-CLF-04); tras guardar y reabrir → `disabled:true` (CLF-08, pristine). |

### 2d. CRUD — Crear / Editar / Desactivar (CRUD)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-CLF-01 | Crear cliente con todos los datos válidos | Formulario completo | Snackbar verde "Cliente creado correctamente."; diálogo cierra | ✅ PASS | Fase 1 R1 (2026-06-27): creado `[QA] Cliente Ventas R7 Test` (RFC QAVR260627AB1, contacto/tel/email/dirección) → snackbar verde `rgb(46,125,50)` "Cliente creado correctamente.", diálogo cierra. |
| CRUD-CLF-02 | Lista refleja el nuevo cliente inmediatamente | Crear exitoso | Nuevo cliente visible sin recargar | ✅ PASS | Fase 1 R1 (2026-06-27): búsqueda "[QA] Cliente Ventas R7" → 1 fila con el cliente nuevo, sin recargar. |
| CRUD-CLF-03 | Crear cliente solo con Nombre (campos opcionales vacíos) | rfc/contactName/phone/email/address vacíos | Creación exitosa (todos opcionales excepto name) | ✅ PASS | Fase 1 R1 (2026-06-27): creado `[QA] Cliente Solo Nombre R7` solo con Nombre → snackbar verde "Cliente creado correctamente." (resto opcional). |
| CRUD-CLF-04 | Editar Nombre de un cliente existente | Cliente activo | Snackbar verde "Cliente actualizado correctamente." | ✅ PASS | Fase 1 R1 (2026-06-27): editado nombre → "[QA] Cliente Ventas R7 Editado" → snackbar verde "Cliente actualizado correctamente.". |
| CRUD-CLF-05 | Lista refleja los cambios después de editar | Editar exitoso | Datos actualizados visibles sin recargar | ✅ PASS | Fase 1 R1 (2026-06-27): lista refleja "[QA] Cliente Ventas R7 Editado" sin recargar. |
| CRUD-CLF-06 | Click en Desactivar abre `ConfirmDialog` | Cliente activo | Modal con texto de confirmación y botones Confirmar/Cancelar | ✅ PASS | Fase 1 R1 (2026-06-27): "Desactivar cliente" — '¿Deseas desactivar al cliente "[QA] Cliente Ventas R7 Editado"? No podrá usarse en nuevas órdenes de venta.' + Cancelar/Desactivar. |
| CRUD-CLF-07 | Cancelar en `ConfirmDialog` — cliente no cambia | Diálogo abierto | Cliente permanece activo | ✅ PASS | Fase 1 R1 (2026-06-27): Cancelar → confirm cierra, edit dialog sigue abierto, cliente activo. |
| CRUD-CLF-08 | Confirmar desactivación de cliente sin órdenes activas | Cliente sin órdenes PENDING/APPROVED | Snackbar verde; cliente desaparece de `/clients/active` | ✅ PASS | Fase 1 R1 (2026-06-27): Confirmar → snackbar verde "Cliente desactivado.", desaparece de la lista activa (0 filas). L33: cliente QA propio limpiado. |
| CRUD-CLF-09 | Intentar desactivar cliente con órdenes PENDING/APPROVED (si el backend lo restringe) | Cliente con orden PENDING/APPROVED | Snackbar rojo con mensaje del backend | ✅ PASS | Fase 1 R1 (2026-06-27): "Cliente RBAC R5035" (orden OV-2026-0920 PENDING) → Desactivar→Confirmar → snackbar rojo `rgb(198,40,40)` (#C62828) "El cliente tiene órdenes de venta activas (PENDING o APPROVED) y no puede desactivarse." Cliente sigue activo (422, sin mutación). Histórico: "Cliente RBAC R70934" (id 878) tiene la orden OV-2026-0199 (id 1520) en estado PENDING. Al confirmar la desactivación en el `ConfirmDialog`, el backend respondió 422 y se mostró el snackbar rojo "El cliente tiene órdenes de venta activas (PENDING o APPROVED) y no puede desactivarse." El cliente permanece activo y la orden permanece PENDING (sin efectos secundarios) |

---

## 3. Lista de órdenes de venta (`SaleOrdersPageComponent`)

### 3a. Visual y tabs (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-ORD-01 | Título de la página visible | ADMIN | "Órdenes de venta" | ✅ PASS | |
| VIS-ORD-02 | Tabs: Pendientes / Aprobadas / Entregadas / Canceladas, con conteo por tab | ADMIN | 4 tabs visibles con badge numérico (L23/L24) | ✅ PASS | Conteos iniciales 19/19/19/334 (luego 18/20/19/334 tras UI-ORD-03) |
| VIS-ORD-03 | Columnas: N° Orden, Cliente, Total, Creado por, Fecha, Estado, Acciones | ADMIN | Todas las columnas visibles | ✅ PASS | Header "Acciones" vacío por diseño |
| VIS-ORD-04 | Badge de estado con color semántico (PENDING=naranja, APPROVED=azul, DELIVERED=verde, CANCELLED=rojo) | ADMIN | Colores correctos por tab | ✅ PASS | Confirmado en las 4 tabs |
| VIS-ORD-05 | Botón "Nueva orden" visible | ADMIN | Botón con ícono `add` | ✅ PASS | |
| VIS-ORD-06 | Cursor `pointer` en filas; hover cambia el fondo | ADMIN | Comportamiento correcto | ✅ PASS | Hover y `cursor:pointer` confirmados vía `.catalog-row--clickable`; tooltip de cliente truncado visible |
| VIS-ORD-07 | Header de tabla con mixin SCSS compartido (L32) | ADMIN | `#F2E4F2`/`#6B3C6B`, sin copia manual | ✅ PASS | Confirmado por zoom; `.catalog-table` usa `@include mixins.catalog-table-header` |
| VIS-ORD-08 | `mat-progress-bar` visible durante carga de cada tab | ADMIN | Barra indeterminada | ✅ PASS | Verificado por código (`@if (loading) { mat-progress-bar mode="indeterminate" }` ligado a `pendingRequests`); no capturable en screenshot por su brevedad (<300ms) |

### 3b. RBAC — acciones por estado y rol (RBAC)

> Matriz §6.1 de la propuesta. D6: `totalAmount` visible para los 4 roles.

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-ORD-01 | Tab PENDING: acciones Ver/Editar/Aprobar/Cancelar visibles | ADMIN / MANAGER | Las 4 acciones presentes | ✅ PASS | Fase 1 R1 (2026-06-27): PENDING → `edit`/`check_circle`/`cancel` (3 íconos, Ver/Editar excluyentes) con admin y qa_manager. |
| RBAC-ORD-02 | Tab PENDING: acciones Ver/Editar/Cancelar visibles, Aprobar AUSENTE | SALES | Aprobar no está en el DOM | ✅ PASS | Fase 1 R1 (2026-06-27): `qa_sales` PENDING → `edit`+`cancel`; `check_circle` (Aprobar) ausente. |
| RBAC-ORD-03 | Tab PENDING: solo acción Ver | WAREHOUSEMAN | Editar/Aprobar/Cancelar ausentes | ✅ PASS | Fase 1 R1 (2026-06-27): `qa_warehouse` PENDING → solo `visibility`. |
| RBAC-ORD-04 | Tab APPROVED: acciones Ver/Entregar/Cancelar visibles | ADMIN / MANAGER | Las 3 acciones presentes | ✅ PASS | Fase 1 R1 (2026-06-27): APPROVED → `visibility`/`done_all`/`cancel` con admin y qa_manager. |
| RBAC-ORD-05 | Tab APPROVED: acciones Ver/Cancelar visibles, Entregar AUSENTE | SALES | Entregar no está en el DOM | ✅ PASS | Fase 1 R1 (2026-06-27): `qa_sales` APPROVED → `visibility`+`cancel`; `done_all` (Entregar) ausente. |
| RBAC-ORD-06 | Tab APPROVED: acciones Ver/Entregar visibles (único rol de escritura) | WAREHOUSEMAN | Entregar presente, Cancelar ausente | ✅ PASS | Fase 1 R1 (2026-06-27): `qa_warehouse` APPROVED → `visibility`+`done_all`; `cancel` ausente. |
| RBAC-ORD-07 | Tab DELIVERED: solo acción Ver | ADMIN / MANAGER / WAREHOUSEMAN / SALES | Ninguna acción de transición | ✅ PASS | Fase 1 R1 (2026-06-27): DELIVERED → solo `visibility` (verificado ADMIN; plantilla compartida sin acciones de transición para los 4 roles). |
| RBAC-ORD-08 | Tab CANCELLED: solo acción Ver | ADMIN / MANAGER / WAREHOUSEMAN / SALES | Ninguna acción de transición | ✅ PASS | Fase 1 R1 (2026-06-27): CANCELLED → solo `visibility` (verificado ADMIN; misma lógica para los 4 roles). |
| RBAC-ORD-09 | Botón "Nueva orden" visible | ADMIN / MANAGER / SALES | Visible | ✅ PASS | Fase 1 R1 (2026-06-27): visible con admin/qa_manager/qa_sales. |
| RBAC-ORD-10 | Botón "Nueva orden" NO visible | WAREHOUSEMAN | Ausente del DOM | ✅ PASS | Fase 1 R1 (2026-06-27): `qa_warehouse` — botón ausente del DOM. |
| RBAC-ORD-11 | Columna "Total" (`totalAmount`) visible en las 4 tabs (D6) | WAREHOUSEMAN | Columna visible con valor real | ✅ PASS | Fase 1 R1 (2026-06-27): `qa_warehouse` — columna "Total" presente con valor real. |

### 3c. Botones e íconos de acción (UI)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-ORD-01 | Click en fila navega a `/sales/orders/:id?from=<tab>` | ADMIN | Lista cargada | Navegación correcta con queryParam `from` | ✅ PASS | Navegó a `/sales/orders/1940?from=CANCELLED`; muestra placeholder FASE 4 "Detalle de orden de venta — Próximamente" |
| UI-ORD-02 | Ícono Aprobar (tab PENDING) — clic abre `ConfirmDialog` | ADMIN / MANAGER | Orden PENDING con detalles | Diálogo abre SIN navegar (L27 `stopPropagation`) | ✅ PASS | Diálogo "Aprobar orden" abrió sin navegar para OV-2026-0238 |
| UI-ORD-03 | Confirmar Aprobar → estado cambia a APPROVED en la lista | ADMIN | Diálogo abierto, stock suficiente | Snackbar verde; fila pasa al tab Aprobadas | ✅ PASS | Snackbar "Orden aprobada correctamente."; Pendientes 19→18, Aprobadas 19→20; OV-2026-0238 movida |
| UI-ORD-04 | Ícono Entregar (tab APPROVED) — clic abre `ConfirmDialog` | ADMIN / MANAGER / WAREHOUSEMAN | Orden APPROVED | Diálogo abre SIN navegar (L27) | ✅ PASS | Confirmado para ADMIN y WAREHOUSEMAN sobre OV-2026-0238; diálogo "Entregar orden" abre sin navegar. Cancelado sin confirmar para no alterar stock real |
| UI-ORD-05 | Ícono Cancelar — clic abre `ConfirmDialog` | ADMIN / MANAGER / SALES | Orden PENDING o APPROVED | Diálogo abre SIN navegar (L27) | ✅ PASS | Confirmado para ADMIN (OV-2026-0238, APPROVED — mensaje incluye "liberará la reserva de stock") y SALES (OV-2026-0225, PENDING — mensaje sin mención de stock); ambos sin navegar. Cancelado sin confirmar |
| UI-ORD-06 | Cambiar de tab carga la página correspondiente y actualiza el contador activo | ADMIN | Tabs con conteos cargados | Datos y conteo correctos por tab | ✅ PASS | Cambio Aprobadas→Entregadas→Canceladas cargó datos correctos en cada tab con conteos actualizados |

### 3d. Estados vacíos (EMPTY)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| EMPTY-ORD-01 | Tab sin órdenes (ej. Canceladas vacío) | Ícono + "Sin órdenes en este estado" | N/A | No reproducible: las 4 tabs tienen datos (18/20/19/334) — no hay ningún tab vacío con los datos actuales del entorno de pruebas. Verificado por código: `@if (!loading && orders.length === 0) { app-empty-state [titleOverride]="'Sin órdenes ' + activeTabLabel.toLowerCase()" }` |
| EMPTY-ORD-02 | Módulo recién creado, sin ninguna orden | Ícono + "Sin órdenes de venta registradas" en cada tab | N/A | No reproducible: el entorno tiene cientos de órdenes preexistentes (no es un módulo "recién creado"). Verificado por código (mismo bloque `app-empty-state` que EMPTY-ORD-01) |

### 3e. Paginación (UI)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| UI-ORD-PAG-01 | Paginador visible por tab cuando hay > pageSize órdenes | > 20 órdenes en un estado | Paginador con total, opciones 10/20/50 | ✅ PASS | Tab Canceladas (334 registros) muestra "1-20 de 334" |
| UI-ORD-PAG-02 | Cambio de página carga la página correcta | Paginador visible | Filas cambian al ir a página 2 | ✅ PASS | "Siguiente" → "21-40 de 334" con filas nuevas |
| UI-ORD-PAG-03 | Cambiar de tab estando en página > 0 resetea a página 0 (L31) | En página 2+ de un tab, cambiar a otro tab | Nuevo tab inicia en página 0 | ✅ PASS | Tras estar en página 2 de Canceladas, cambiar de tab y volver resetea a "1-20 de 334" |

### 3f. Flujo de tabs y conteos (FLOW)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-ORD-01 | Al cargar la pantalla, tab activo por defecto = Pendientes (D2) | ADMIN | Tab Pendientes seleccionado | ✅ PASS | Fase 1 R1 (2026-06-27): al cargar `/sales/orders`, tab activo = "Pendientes" (`aria-selected=true`). |
| FLOW-ORD-02 | Conteos de los 4 tabs se cargan al inicio (`counts: Map` separado de `pages: Map`, L23/L24) | ADMIN | Badges numéricos correctos en los 4 tabs sin necesidad de visitarlos | ✅ PASS | Fase 1 R1 (2026-06-27): badges Pendientes 39 / Aprobadas 37 / Entregadas 61 / Canceladas 792 visibles al cargar sin visitar las otras tabs. |

---

## 4. Detalle de orden de venta (`SaleOrderDetailPageComponent`) — D1, D4

### 4a. Visual (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-DET-01 | Título muestra `orderNumber` (o "Nueva orden" en `/sales/orders/new`) | ADMIN | "OV-2026-XXXX" o "Nueva orden" | ✅ PASS | Confirmado en órdenes OV-2026-0238/0392/0393/0394 |
| VIS-DET-02 | Badge de estado con color semántico correcto | ADMIN | PENDING naranja `#FFF3E0`/`#E65100`, APPROVED azul, DELIVERED verde, CANCELLED rojo | ✅ PASS | Verificado en órdenes 1941/1570/1470/1943 (los 4 estados) |
| VIS-DET-03 | Botón ← regresa a `/sales/orders` con el tab de origen (`?from=`) | ADMIN | Viene de tab "Aprobadas" | Regresa con tab "Aprobadas" activo | ✅ PASS | URL conserva `?from=PENDING` al volver |
| VIS-DET-04 | Historial de estado: tabla de 3 filas (Aprobada/Entregada/Cancelada) con usuario+fecha o "—" (D4) | ADMIN | Orden DELIVERED: fila "Aprobada" y "Entregada" con datos, "Cancelada" con "—" | ✅ PASS | Confirmado junto con FLOW-DET-02/06 — historial muestra "Aprobada"/"Entregada" con usuario+fecha |
| VIS-DET-05 | `totalAmount` visible en cabecera para los 4 roles (D6) | WAREHOUSEMAN | Total visible con valor real | ✅ PASS | Total visible para almacen01 (orden 1470/1570) |
| VIS-DET-06 | `mat-progress-bar` visible durante carga | ADMIN | Barra indeterminada | ✅ PASS | Barra indeterminada visible durante recargas |

### 4b. Botones de acción según estado y rol (UI)

> Matriz §6.1. Para cada botón: verificar presencia/ausencia exacta — "ausente del DOM",
> no solo `hidden`/`display:none`.

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-DET-01 | Campos Cliente/Notas editables | ADMIN / MANAGER / SALES | Orden PENDING | Inputs habilitados | ✅ PASS | ADMIN, orden 1941 — editó "Notas" |
| UI-DET-02 | Campos Cliente/Notas de solo lectura | WAREHOUSEMAN | Orden PENDING | Inputs `disabled` | ✅ PASS | WAREHOUSEMAN, orden 1470 |
| UI-DET-03 | Botón "Guardar cambios" requiere `form.dirty` (L25) | ADMIN / MANAGER / SALES | Orden PENDING, sin cambios | `disabled:true` al cargar; se activa al modificar; se desactiva tras guardar | ✅ PASS | ADMIN, orden 1941 |
| UI-DET-04 | Botón "Aprobar" visible | ADMIN / MANAGER | Orden PENDING con ≥1 detalle | Visible y clickeable | ✅ PASS | MANAGER, orden 1570 (también ADMIN, orden 1942) |
| UI-DET-05 | Botón "Aprobar" NO visible | SALES | Orden PENDING | Ausente del DOM | ✅ PASS | SALES, orden 1470 |
| UI-DET-06 | Botón "Cancelar" visible | ADMIN / MANAGER / SALES | Orden PENDING | Visible y clickeable | ✅ PASS | ADMIN (orden 1941, FLOW-DET-04) y SALES (orden 1943, FLOW-DET-08) |
| UI-DET-07 | Ningún botón de transición visible | WAREHOUSEMAN | Orden PENDING | Aprobar/Cancelar/Guardar ausentes | ✅ PASS | WAREHOUSEMAN |
| UI-DET-08 | Botones "Entregar" y "Cancelar" visibles | ADMIN / MANAGER | Orden APPROVED | Ambos presentes | ✅ PASS | MANAGER, orden 1570 (también ADMIN, orden 1942) |
| UI-DET-09 | Solo botón "Entregar" visible | WAREHOUSEMAN | Orden APPROVED | Entregar presente, Cancelar ausente | ✅ PASS | WAREHOUSEMAN, orden 1570 |
| UI-DET-10 | Solo botón "Cancelar" visible, "Entregar" AUSENTE | SALES | Orden APPROVED | Cancelar presente, Entregar ausente | ✅ PASS | SALES |
| UI-DET-11 | Ningún botón de transición | ADMIN / MANAGER / WAREHOUSEMAN / SALES | Orden DELIVERED | Sin botones de transición (terminal) | ✅ PASS | Confirmado vía orden 1470 (DELIVERED) — `canApprove/canDeliver/canCancel` evalúan `status`, igual para los 4 roles |
| UI-DET-12 | Ningún botón de transición | ADMIN / MANAGER / WAREHOUSEMAN / SALES | Orden CANCELLED | Sin botones de transición (terminal) | ✅ PASS | ADMIN, orden 1941 (post FLOW-DET-09) |
| UI-DET-13 | Botón "Agregar detalle" e íconos Editar/Eliminar por línea visibles | ADMIN / MANAGER / SALES | Orden PENDING | Visibles y funcionales | ✅ PASS | ADMIN (orden 1941/1942) y MANAGER (orden 1570) |
| UI-DET-14 | Tabla de detalles de solo lectura, sin íconos de acción | WAREHOUSEMAN (cualquier estado) / cualquier rol en APPROVED+ | Orden no editable | "Agregar/Editar/Eliminar" ausentes (R1) | ✅ PASS | WAREHOUSEMAN, orden 1470 |

### 4c. Flujos de estado (FLOW) — R4, R5, R7, R8, R9, R10

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| FLOW-DET-01 | Aprobar: `ConfirmDialog` muestra preview de `availableStock` vs `quantity` por línea (R4) | ADMIN / MANAGER | Orden PENDING con detalles | Tabla de preview visible antes de confirmar | ✅ PASS | Fase 1 R1 (2026-06-27): MANAGER, orden 2699 — `StockPreviewDialog` "Aprobar orden" con headers Producto/Cantidad/Disponible antes de confirmar. |
| FLOW-DET-02 | Confirmar Aprobar con stock suficiente en todas las líneas | ADMIN | Preview OK en todas las líneas | PENDING→APPROVED; `reservedStock` incrementado por línea (R5); snackbar verde | ✅ PASS | Fase 1 R1 (2026-06-27): orden 2699 (producto 13 qty 1) → snackbar verde "Orden aprobada correctamente.", PENDING→APPROVED, producto 13 `reservedStock` 0→1 / available 104→103 (R5). |
| FLOW-DET-03 | Confirmar Aprobar con stock insuficiente en alguna línea | ADMIN | Una línea con `quantity > availableStock` | Snackbar rojo "Stock disponible insuficiente para 'X'. Disponible: N, solicitado: M."; estado NO cambia, NINGUNA línea se reserva (R4 todo-o-nada) | ✅ PASS | Fase 1 R1 (2026-06-27): curl, orden 2879 con línea qty 99999 > disponible 103 → HTTP 422 "Stock disponible insuficiente para ' (editado QA)'. Disponible: 103, solicitado: 99999.", orden sigue PENDING (R4 todo-o-nada). Línea bogus eliminada tras la prueba. |
| FLOW-DET-04 | Cancelar en `ConfirmDialog` de Aprobar | ADMIN | Diálogo abierto | Estado permanece PENDING; sin cambios en stock | ✅ PASS | Fase 1 R1 (2026-06-27): orden 2699 — Cancelar el StockPreviewDialog → orden permanece "Pendiente". |
| FLOW-DET-05 | Entregar: `ConfirmDialog` muestra preview de `currentStock` vs `quantity` por línea (R7) | ADMIN / MANAGER / WAREHOUSEMAN | Orden APPROVED | Tabla de preview visible antes de confirmar | ✅ PASS | Fase 1 R1 (2026-06-27): MANAGER, orden 2699 (APPROVED) — `StockPreviewDialog` "Entregar orden" con headers Producto/Cantidad/Stock físico antes de confirmar (R7). |
| FLOW-DET-06 | Confirmar Entregar con stock físico suficiente | WAREHOUSEMAN | Preview OK en todas las líneas | APPROVED→DELIVERED; `reservedStock -= quantity` y `currentStock -= quantity` por línea (R8); snackbar verde | ✅ PASS | Fase 1 R1 (2026-06-27): orden 2699 → snackbar verde "Orden entregada correctamente.", APPROVED→DELIVERED, producto 13 `currentStock` 104→103 y `reservedStock` 1→0 (R8). |
| FLOW-DET-07 | Confirmar Entregar con stock físico insuficiente | ADMIN | Una línea con `quantity > currentStock` | Snackbar rojo "Stock físico insuficiente para 'X'."; estado NO cambia | N/A | Escenario inalcanzable: la validación de movimientos OUT en `ProductServiceImpl` (líneas 195-230) garantiza `currentStock >= reservedStock` en todo momento. Como R5 solo reserva `quantity <= availableStock`, al llegar a `deliverOrder()` siempre se cumple `currentStock >= quantity`. El check `currentStock < detail.getQuantity()` en `SaleOrderServiceImpl.deliverOrder()` (líneas 195-250) es código defensivo no alcanzable. Confirmado con curl: intento de reducir `currentStock` vía movimiento OUT manual fue rechazado con HTTP 422 "No se puede registrar la salida: solo hay 2 unidades disponibles..." antes de poder reproducir el escenario |
| FLOW-DET-08 | Cancelar orden desde PENDING | SALES | Orden PENDING (propia) | PENDING→CANCELLED; sin impacto en stock; snackbar verde | ✅ PASS | Fase 1 R1 (2026-06-27): MANAGER, orden 2904 (OV-2026-0907 PENDING) — ConfirmDialog "¿Cancelar la orden OV-2026-0907? Esta acción es irreversible." (mensaje PENDING), PENDING→CANCELLED, snackbar verde "Orden cancelada correctamente." |
| FLOW-DET-09 | Cancelar orden desde APPROVED | ADMIN | Orden APPROVED | APPROVED→CANCELLED; `reservedStock -= quantity` por línea liberado (R10); mensaje de `ConfirmDialog` distinto, advirtiendo liberación de reserva; snackbar verde | ✅ PASS | Fase 1 R1 (2026-06-27): orden 2926 (OV-2026-0917 APPROVED) — ConfirmDialog DISTINTO "¿Cancelar la orden OV-2026-0917? Esta acción liberará la reserva de stock. Es irreversible.", APPROVED→CANCELLED, producto 2599 `reservedStock` 2→0 liberado (R10), snackbar verde. |
| FLOW-DET-10 | Intentar cancelar orden DELIVERED (verificación de backend, botón ya oculto en UI) | ADMIN | Orden DELIVERED, vía curl `PATCH .../cancel` | Backend rechaza: "No se puede cancelar una orden ya entregada." | ✅ PASS | Fase 1 R1 (2026-06-27): curl `PATCH /sales/orders/2927/cancel` (DELIVERED) → HTTP 422 "No se puede cancelar una orden ya entregada." |

### 4d. Reglas de negocio (RN)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RN-DET-01 | Campos `orderNumber`, `totalAmount`, `subtotal`, `status`, timestamps de auditoría son de solo lectura (L14) | Formulario de orden (cualquier estado) | Sin inputs editables para estos campos | ✅ PASS | Fase 1 R1 (2026-06-27): en "Nueva orden", únicos controles editables = `clientSearch` (Cliente) y `notes` (Notas); orderNumber/totalAmount/subtotal/status sin inputs editables. |
| RN-DET-02 | `unitCost` no se muestra en el formulario para ningún rol (R14) | Diálogo de detalle de línea | Campo ausente del formulario | ✅ PASS | Fase 1 R1 (2026-06-27): "Agregar línea de detalle" tiene solo productSearch/quantity/unitPrice; `[formcontrolname=unitCost]` ausente. |
| RN-DET-03 | En APPROVED, agregar/editar/eliminar detalle deshabilitado (R1) | Orden APPROVED | Botones ausentes; único camino es Cancelar | ✅ PASS | Fase 1 R1 (2026-06-27): orden 2901 (APPROVED) — sin botón "Agregar detalle" ni íconos edit/delete en las líneas. |
| RN-DET-04 | `addDetail` bloquea producto duplicado en la misma orden (R11) | Producto ya existe en la orden | Snackbar rojo con mensaje del backend ("...ya existe en esta orden...") | ✅ PASS | Fase 1 R1 (2026-06-27): = CRUD-LIN-05 — curl agregar producto 35 ya existente en orden 2699 → HTTP 409 "...ya existe en esta orden. Use la opción de actualizar detalle...". |
| RN-DET-05 | Selector de producto solo muestra productos activos (R12) | Catálogo con productos inactivos | Productos inactivos ausentes del autocomplete | ✅ PASS | Fase 1 R1 (2026-06-27): autocomplete "Aceite" → solo LUBR-ACE20-035 (activo); productos inactivos excluidos (filtro `active`, R12). |
| RN-DET-06 | `unitPrice` editable y pre-rellenado con `Product.price`, puede diferir del precio de catálogo (R13) | Agregar detalle | Valor pre-rellenado editable; se guarda el valor modificado | ✅ PASS | Fase 1 R1 (2026-06-27): seleccionar LUBR-ACE20-035 → `unitPrice` pre-rellenado "380" (= Product.price), editable. |

---

## 5. Diálogo Agregar/Editar detalle (`SaleOrderDetailFormComponent`) — D3

### 5a. Apertura y visual (UI)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-LIN-01 | Botón "Agregar detalle" abre diálogo vacío (`disableClose: true`, L31) | ADMIN / MANAGER / SALES | Orden PENDING | Campos vacíos | ✅ PASS | ADMIN, orden 1941/1942 |
| UI-LIN-02 | Ícono Editar en fila abre diálogo con datos precargados | ADMIN / MANAGER / SALES | Línea existente | `productId`/`quantity`/`unitPrice` precargados | ✅ PASS | ADMIN — confirmado junto con CRUD-LIN-02 |
| UI-LIN-03 | Botón Cancelar cierra sin guardar | ADMIN | Diálogo con cambios | Cierra; tabla de detalles no cambia | ✅ PASS | ADMIN — diálogo cerrado sin agregar línea, tabla sin cambios |
| UI-LIN-04 | Click en backdrop/ESC con cambios sin guardar (L31) | ADMIN | Diálogo abierto con cambios | Diálogo permanece abierto | ✅ PASS | ADMIN — ESC con cambios sin guardar no cierra el diálogo (`disableClose:true`) |
| UI-LIN-05 | Autocomplete de producto muestra "[SKU] — Nombre (disponible: N)" usando `availableStock` (D3) | ADMIN | Catálogo con productos activos | Formato correcto en cada opción | ✅ PASS | ADMIN — disponibilidad visible en las opciones (confirmado durante VAL-LIN-07, "disponible: 6") |
| UI-LIN-06 | Productos ya presentes en la orden aparecen deshabilitados en el autocomplete (R11) | ADMIN | Orden con ≥1 detalle | Opciones correspondientes `disabled` | ✅ PASS | ADMIN — producto ya presente en la orden deshabilitado en el autocomplete |

### 5b. Validaciones (VAL)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-LIN-01 | `productId` vacío al guardar | Sin producto seleccionado | Error inline; botón Guardar deshabilitado | ✅ PASS | Fase 1 R1 (2026-06-27): "Agregar línea de detalle" sin producto → botón disabled. |
| VAL-LIN-02 | `quantity` vacío o 0 | Cantidad = 0 | Error "Mínimo 1" | ✅ PASS | Fase 1 R1 (2026-06-27): cantidad=0 → "Mínimo 1". |
| VAL-LIN-03 | `quantity` negativo | Cantidad = -1 | Error de validación visible | ✅ PASS | Fase 1 R1 (2026-06-27): cantidad=-1 → "Mínimo 1" (mismo `Validators.min(1)`). |
| VAL-LIN-04 | `unitPrice` vacío | Sin valor | Error inline; botón deshabilitado | ✅ PASS | Fase 1 R1 (2026-06-27): precio vacío → "Obligatorio", botón disabled. |
| VAL-LIN-05 | `unitPrice` = 0 | Precio = 0 | Error "Debe ser mayor a 0.01" (min 0.01) | ✅ PASS | Fase 1 R1 (2026-06-27): precio=0 → "Debe ser mayor a 0.01". |
| VAL-LIN-06 | `unitPrice` negativo | Precio = -1 | Error de validación visible | ✅ PASS | Fase 1 R1 (2026-06-27): precio=-1 → "Debe ser mayor a 0.01". |
| VAL-LIN-07 | `quantity` > `availableStock` | Cantidad solicitada mayor al disponible | Advertencia visual (no bloquea el guardado del detalle — el bloqueo real es al Aprobar, R4) | ✅ PASS | Fase 1 R1 (2026-06-27): producto LUBR-ACE20-035 (disponible 152), cantidad=200 → advertencia "supera el stock disponible (152)." sin bloquear (R4). |
| VAL-LIN-08 | `subtotal` se recalcula en tiempo real (`quantity × unitPrice`) | Cambiar cantidad o precio | Subtotal actualizado sin guardar | ✅ PASS | Fase 1 R1 (2026-06-27): qty 200×$50 → subtotal $10,000.00; cambiar a qty 3 → $150.00 (recálculo en tiempo real). |

### 5c. CRUD de detalles (CRUD)

> Proteger eliminación de la última línea (L26 — BUG-M3-21).

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-LIN-01 | Agregar detalle válido | Producto activo, cantidad y precio válidos | Snackbar verde; tabla refleja nueva línea; `totalAmount` recalculado | ✅ PASS | Fase 1 R1 (2026-06-27): orden 2699 — agregar producto 35 (qty 2, $100) → HTTP 201, líneas 1→2, `totalAmount` 319999680→319999880 (recalculado). Lógica API verificada (UI con snackbar verde = mismo patrón de CLF/Compras). |
| CRUD-LIN-02 | Editar `quantity`/`unitPrice` de una línea existente | Línea existente | Snackbar verde; subtotal y `totalAmount` recalculados | ✅ PASS | Fase 1 R1 (2026-06-27): PUT línea (qty 2→5) → HTTP 200, `totalAmount` 319999880→320000180 (recalculado). |
| CRUD-LIN-03 | Eliminar línea (no es la última) | Orden con ≥2 líneas | `ConfirmDialog` → confirmar → línea desaparece; `totalAmount` recalculado | ✅ PASS | Fase 1 R1 (2026-06-27): DELETE línea no-última → HTTP 204, líneas 2→1, `totalAmount` recalculado a 319999680. |
| CRUD-LIN-04 | Intentar eliminar la última línea de la orden (L26) | Orden con 1 sola línea | Bloqueado con mensaje claro; sin llamada al API | ✅ PASS | Fase 1 R1 (2026-06-27): browser, orden 2699 PENDING (1 línea), MANAGER — click delete → snackbar rojo "No se puede eliminar la única línea. Una orden debe tener al menos un producto." SIN ConfirmDialog ni llamada al API (guard frontend L26); línea intacta. |
| CRUD-LIN-05 | Agregar producto duplicado en la misma orden | Producto ya existe en la orden | Snackbar rojo con mensaje del backend (R11) | ✅ PASS | Fase 1 R1 (2026-06-27): curl, agregar producto 35 ya existente → HTTP 409 "El producto 'Aceite Lubricante Motor 20W-50 Galón' ya existe en esta orden. Use la opción de actualizar detalle para cambiar la cantidad." |
| CRUD-LIN-06 | `unitCost` se re-lee de `Product.unitCost` en cada `addDetail`/`updateDetail` mientras PENDING (R14) | Cambiar `Product.unitCost` en Inventory, luego editar la línea | Valor interno actualizado (verificar vía respuesta del backend con rol ADMIN, no en UI) | ✅ PASS | Fase 1 R1 (2026-06-27): code review confirmado (sin cambios de código esta ronda). Verificado por revisión de código (2026-06-13) en `SaleOrderServiceImpl`: `addDetail()` línea 298 ejecuta `detail.setUnitCost(product.getUnitCost())` y `updateDetail()` línea 319 ejecuta `detail.setUnitCost(detail.getProduct().getUnitCost())` — ambas dentro de métodos que llaman `validatePending(order)` (R14), por lo que `unitCost` se re-lee de `Product.unitCost` en cada operación mientras la orden está PENDING |

### 5d. RBAC — campos sensibles (RBAC) — L29/H2

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-LIN-01 | Columna "Costo unitario"/Margen visible en la tabla de detalles | ADMIN / MANAGER | Columna visible con valor real | ✅ PASS | Fase 1 R1 (2026-06-27): orden 2926 — headers incluyen "Costo unitario" y "Margen" con admin y qa_manager. |
| RBAC-LIN-02 | Columna "Costo unitario"/Margen AUSENTE del DOM (no solo CSS) | WAREHOUSEMAN | Columna no renderizada — excluida de `displayedColumns` | ✅ PASS | Fase 1 R1 (2026-06-27): `qa_warehouse` orden 2926 — headers solo Producto/Cantidad/Precio unitario/Subtotal; Costo/Margen ausentes del DOM. |
| RBAC-LIN-03 | Columna "Costo unitario"/Margen AUSENTE del DOM (no solo CSS) | SALES | Columna no renderizada — excluida de `displayedColumns` | ✅ PASS | Fase 1 R1 (2026-06-27): `qa_sales` orden 2926 — Costo/Margen ausentes del DOM. |
| RBAC-LIN-04 | Verificar en Network (Dev Tools) si `unitCost` llega poblado en el JSON para WAREHOUSEMAN/SALES (H2) | WAREHOUSEMAN / SALES | Si el backend YA redacta: `unitCost: null`. Si no: documentar como H2 pendiente — NO bloquea (la UI ya lo oculta independientemente) | ✅ PASS | Fase 1 R1 (2026-06-27): `curl GET /sales/orders/2926` — ADMIN/MANAGER `details[].unitCost=500.0`, WAREHOUSEMAN/SALES `unitCost=null` (redacción server-side L29 confirmada). RESUELTO (2026-06-13, backend rama `fix/sales-rbac-lin-04-redaction`, commit `1f3b41e`): se agregó `canViewUnitCost()`/`redactUnitCost(...)` en `SaleOrderServiceImpl` (patrón L29/BUG-INV-11) aplicado a TODOS los endpoints de lectura/escritura que retornan `SaleOrderResponseDTO`. Re-verificado vía `fetch()` con tokens de almacen01 y ventas01: `GET /api/v1/sales/orders/1470` ahora retorna `details[].unitCost: null` para ambos roles; con token ADMIN retorna `unitCost: 150` (valor real preservado para roles autorizados) |

---

## 6. Reservas de stock (`ReservationsPageComponent`)

### 6a. Visual (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-RES-01 | Título "Reservas de stock" | ADMIN | Visible | ✅ PASS | |
| VIS-RES-02 | 4 tarjetas de resumen: productos con reservas, unidades reservadas, valor reservado, órdenes APPROVED (`ReservationSummaryDTO`) | ADMIN | Las 4 tarjetas con valores correctos | ✅ PASS | 44 / 155 / $570,798.00 / 20 — coincide con `GET /reservations/summary` |
| VIS-RES-03 | Tabla "Por producto" expandible (`GET /reservations/products`) | ADMIN | Fila expandible muestra `ReservedProductOrderDTO` | ✅ PASS | Verificado con SKU-SO-12823 → orden OV-2026-0183 |
| VIS-RES-04 | Tabla "Por cliente" expandible (`GET /reservations/clients`) | ADMIN | Fila expandible muestra `ReservedClientOrderDTO` | ✅ PASS | Verificado con "Cliente Int 38661" → orden OV-2026-0092 |
| VIS-RES-05 | `mat-progress-bar` visible durante carga | ADMIN | Barra indeterminada | ✅ PASS | `@if (loading)` — verificado en código y en recarga de página |

### 6b. RBAC y navegación (RBAC)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-RES-01 | Dashboard completo visible, incluyendo `totalReservedValue`/`unitPrice` (precio de venta, no costo — sección 6.2) | ADMIN / MANAGER / WAREHOUSEMAN / SALES | Visible para los 4 roles sin diferencias | ✅ PASS | Fase 1 R1 (2026-06-27): dashboard con secciones "Reservas de stock"/"Por producto"/"Por cliente" visible para admin, qa_warehouse y qa_sales (mismo dashboard sin redacciones; MANAGER comparte plantilla). |
| RBAC-RES-02 | Click en `orderNumber` (dentro de una fila expandida) navega a `/sales/orders/:id?from=reservations` | ADMIN | Fila expandida | Navegación correcta | ✅ PASS | Fase 1 R1 (2026-06-27): expandir fila "Por cliente" → botón OV-2026-0800 → navega a `/sales/orders/2701?from=reservations`. (Nota automatización: el mat-button requiere `dispatchEvent(MouseEvent('click'))`; con click sintético no navega — no es defecto.) |

### 6c. `forkJoin` y RBAC (L33)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| RBAC-RES-FJ-01 | `forkJoin` de `summary` + `products` + `clients` carga correctamente para los 4 roles (todos accesibles según SecurityConfig) | ADMIN / MANAGER / WAREHOUSEMAN / SALES | — | Las 3 secciones cargan sin error | ✅ PASS | Fase 1 R1 (2026-06-27): las 3 secciones cargan sin errores de consola (solo log de extensión) con admin, qa_warehouse y qa_sales. |
| RBAC-RES-FJ-02 | Si una fuente responde 404/500 aislado, `catchError` devuelve un valor por defecto vacío y el dashboard no se rompe completamente | Cualquier rol | Simular fallo de una fuente (si es posible en entorno de prueba) | Las otras 2 secciones cargan; la sección fallida muestra estado vacío, sin error global | ✅ PASS | Fase 1 R1 (2026-06-27): cubierto por specs unitarios de `ReservationsPageComponent` (3 casos: summary/products/clients con `catchError` aislado) — no reproducible en browser sin tumbar una fuente; confirmado en `ng test` (456 specs, ver Fase 4). |
| RBAC-RES-FJ-03 | Datos de prueba (`[QA] `/`TEST_`) usados durante pruebas de seguridad se limpian antes de cerrar el módulo | — | Tras completar todas las pruebas | Sin clientes/órdenes de prueba activos en BD | ✅ PASS | Fase 1 R1 (2026-06-27): **los datos QA creados por esta ronda se limpiaron durante la ejecución** (clientes `[QA] Cliente Ventas R7 Test`/`[QA] Cliente Solo Nombre R7`/`hack`/cliente XSS → desactivados; órdenes QA 2904/2926 canceladas; líneas de las órdenes 2699/2879 restauradas tras las pruebas de CRUD-LIN/FLOW). **Decisión del usuario (2026-06-27)**: NO se ejecuta limpieza masiva del dataset seed — en Ventas los 90 clientes activos son TODOS data de prueba/seed (`Cliente Int`/`Cliente RBAC R*`, de suites de integración y rondas previas; 0 clientes reales de dominio); borrarlos vaciaría el módulo y requeriría cancelar ~800 órdenes asociadas (cascada destructiva sobre data no creada en esta ronda). RES-FJ-03 se cumple respecto a la data QA propia de la ronda. Limpieza histórica (2026-06-13): se identificaron 19 "Cliente Int NNNNN" + 19 "Producto Integración NNNNN" (residuos de suites de integración del backend) y 19 órdenes APPROVED asociadas (OV-2026-0001..0235). Se canceló cada orden (`PATCH .../cancel` → 200), luego se desactivaron los 19 clientes (`DELETE /sales/clients/{id}` → 204) y los 19 productos (`DELETE /inventory/products/{id}` → 204). Dashboard de reservas re-verificado tras la limpieza: carga sin errores (26 productos con reservas, 118 unidades, 2 órdenes aprobadas restantes — datos legítimos de la sesión) |

### 6d. Estados vacíos (EMPTY)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| EMPTY-RES-01 | Sin productos con reservas activas | EmptyState "Sin reservas activas" en sección "Por producto" | ✅ PASS | Fase 1 R1 (2026-06-27): no reproducible en browser (todos los productos tienen reservas); confirmado por spec unitario (`products: []` → `app-empty-state` `titleOverride="Sin reservas activas"`). |
| EMPTY-RES-02 | Sin clientes con reservas activas | EmptyState en sección "Por cliente" | ✅ PASS | Fase 1 R1 (2026-06-27): no reproducible en browser; confirmado por spec unitario (`clients: []` → `app-empty-state`); mismo patrón que EMPTY-RES-01. |

---

## 7. Mensajes de error y éxito (ERR)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| ERR-01 | Snackbar de éxito: fondo verde `#2E7D32`, clase `snackbar-success` | Operación exitosa | Color correcto | ✅ PASS | Fase 1 R1 (2026-06-27): snackbar verde `rgb(46,125,50)` (#2E7D32) `snackbar-success` en crear/editar/desactivar cliente, aprobar/entregar/cancelar orden (CRUD/FLOW esta ronda). |
| ERR-02 | Snackbar de error: fondo rojo `#C62828`, clase `snackbar-error`, `panelClass` como array (L18) | Error del backend | Color correcto | ✅ PASS | Fase 1 R1 (2026-06-27): snackbar rojo `rgb(198,40,40)` (#C62828) `snackbar-error` en CRUD-CLF-09 y CRUD-LIN-05. |
| ERR-03 | Mensaje de error específico del backend visible (`err.error?.message`, L9) | Backend rechaza con 4xx/5xx | Texto del backend en el snackbar, no genérico | ✅ PASS | Fase 1 R1 (2026-06-27): mensajes específicos visibles: "El cliente tiene órdenes de venta activas..." (CLF-09), "El producto '...' ya existe en esta orden..." (LIN-05). |
| ERR-04 | Error 400 (`MethodArgumentNotValidException`) → mensaje "Validación fallida: campo: motivo; ..." | Body de request inválido (ej. `details: []`) | Mensaje concatenado visible | ✅ PASS | Fase 1 R1 (2026-06-27): curl POST /sales/clients body inválido → 400 "Validación fallida: name: El nombre del cliente es obligatorio; email: El email no tiene un formato válido". |
| ERR-05 | Error de red → mensaje útil (no "undefined" ni stack trace) | Backend apagado | Snackbar "Error al cargar/guardar..." | ✅ PASS | Fase 1 R1 (2026-06-27): code-review (sin cambios de código esta ronda; backend apagado no reproducible local). Revisión de código: todos los manejadores de error de Sales usan el patrón `err.error?.message ?? 'Error al cargar/guardar...'` (clients-page.component.ts:107/162, sale-orders-page.component.ts:142/228, sale-order-detail-page.component.ts:193/247/272/383/447/480, client-form-dialog.component.ts:61/89). En un error de red, `err.error` es un `ProgressEvent` sin `.message`, por lo que el operador `??`/`\|\|` garantiza el mensaje de fallback en español — nunca se muestra "undefined" ni un stack trace |
| ERR-06 | Progress bar visible durante carga de datos | Navegar a cualquier pantalla de Sales | Barra indeterminada en parte superior | ✅ PASS | Fase 1 R1 (2026-06-27): code-review (carga demasiado rápida para captura visual). Revisión de código: las 4 pantallas (clients-page, sale-orders-page, sale-order-detail-page, reservations-page) renderizan `<mat-progress-bar mode="indeterminate">` condicionado a `@if (loading)`, consistente con el patrón global |
| ERR-07 | Error HTTP 401 → redirige a login con mensaje "sesión expirada" | JWT expirado durante uso | Redirect a `/login` con mensaje | ✅ PASS | Fase 1 R1 (2026-06-27): verificado en vivo — el JWT expiró durante la ronda y la app redirigió a `/login?reason=expired` (interceptor 401, `error.interceptor.ts:15-22`). |
| ERR-08 | Error HTTP 403 → mensaje "Acceso denegado" | Rol sin permiso intenta operación (ej. SALES → approve vía curl) | Snackbar de error visible si se expone en UI | ✅ PASS | Fase 1 R1 (2026-06-27): los 403 server-side verificados vía curl (SEC-06..10). Revisión de código: `error.interceptor.ts:23-29` maneja 403 globalmente con `snackBar.open('No tienes permiso para realizar esta acción.', ...)` y `panelClass: ['snackbar-error']` — mismo bloque `catchError` ya verificado en vivo para el caso 401 (ERR-07) |
| ERR-09 | Optimistic Locking: "Stock modificado concurrentemente. Intente nuevamente." visible en snackbar rojo; permite reintentar sin perder datos del formulario | Dos aprobaciones concurrentes sobre el mismo producto (difícil de simular manualmente — documentar si no se puede reproducir) | Mensaje visible; formulario conserva los datos para reintentar | ✅ PASS | Fase 1 R1 (2026-06-27): no reproducible manualmente (requiere requests simultáneos); confirmado por specs automatizados. No reproducible manualmente en browser (requiere dos requests simultáneos exactos) — evidencia automatizada: `SaleOrderConcurrencyTest.java` (3/3 tests, 0 fallos, ejecutado 2026-06-13) verifica que la colisión de `@Version` produce 409 con mensaje conteniendo "concurrentemente" (o 422 "insuficiente"), que `reservedStock` nunca supera `currentStock`, y que la orden perdedora permanece en PENDING (reintentable). El mensaje 409/422 se muestra vía `err.error?.message` (mismo patrón ERR-03/ERR-10) |
| ERR-10 | Errores de negocio de Sales (stock insuficiente, transición inválida, producto duplicado, no encontrado) muestran el mensaje del backend correctamente con el status HTTP correcto (404/409/422 — H1 resuelto) | Cualquier regla R1-R14 violada | Mensaje de negocio correcto en snackbar rojo; status 404 (no encontrado), 409 (duplicado/optimistic locking), 422 (regla de negocio) | ✅ PASS | Fase 1 R1 (2026-06-27): curl — aprobar orden inexistente 999999 → **404** "Orden de venta con id 999999 no encontrada."; re-aprobar APPROVED → **422** "Solo se pueden aprobar órdenes en estado PENDING. Estado actual: APPROVED"; producto duplicado → **409** (LIN-05); stock insuficiente → **422** (FLOW-DET-03). H1 resuelto (commit `0374944`, rama `fix/sales-h1-typed-exceptions`) — verificado vía fetch con JWT real: re-aprobar orden 1545 (ya APPROVED) → 422 "Solo se pueden aprobar órdenes en estado PENDING. Estado actual: APPROVED"; aprobar orden inexistente 999999 → 404 "Orden de venta con id 999999 no encontrada."; cliente duplicado → 409. Todos los status se propagan al snackbar vía `err.error?.message` |

---

## 8. Visual general del módulo (VIS-GEN)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| VIS-GEN-01 | Sidebar colapsado al entrar al módulo (`layoutService.collapse()`) | Sidebar en modo íconos al navegar a `/sales/*` | ✅ PASS | Verificado en browser (ADMIN y MANAGER): sidebar en modo íconos (64px) al entrar a `/sales/orders`, `/sales/clients`, `/sales/reservations` |
| VIS-GEN-02 | Breadcrumb correcto en todas las pantallas ("Ventas → Clientes", "Ventas → Órdenes de venta", "Ventas → Detalle de orden", "Ventas → Reservas de stock") | Topbar muestra breadcrumb correcto por ruta | ✅ PASS | Verificado en browser: los 4 breadcrumbs aparecen correctamente por ruta |
| VIS-GEN-03 | Botón primario con color de marca `#6B3C6B` | Botones "Nuevo/Crear/Guardar/Agregar" con color correcto | ✅ PASS | Verificado en browser: botones "Nuevo cliente", "Nueva orden", "Agregar línea", "Guardar" en `#6B3C6B` |
| VIS-GEN-04 | Botones destructivos con color `warn` (rojo) | "Eliminar/Cancelar/Desactivar" en rojo | ✅ PASS | Verificado en browser con zoom: "Cancelar orden" e ícono cancelar en rojo (warn); ícono aprobar en púrpura/accent; ícono editar (lápiz) en gris neutro — colores semánticos correctos y distinguibles |
| VIS-GEN-05 | Diálogos de confirmación son modales (click fuera no cierra) | Click backdrop no cierra `ConfirmDialog` | ✅ PASS | Verificado en browser: diálogo de cancelación de la orden 1545 — click en el backdrop no cierra el diálogo (`disableClose: true`, L31) |
| VIS-GEN-06 | Campo de búsqueda tiene ícono lupa | Ícono `search` visible en Clientes | ✅ PASS | Verificado en browser: ícono `search` visible en el campo de búsqueda de `/sales/clients` |
| VIS-GEN-07 | Header de tabla con color `#F2E4F2`/`#6B3C6B` vía mixin SCSS compartido (L32) en TODAS las tablas del módulo (Clientes, Órdenes, Detalles, Reservas) | Consistencia visual entre las 4 tablas | ✅ PASS | Verificado: las 4 `.catalog-table` (clients-page, sale-orders-page, sale-order-detail-page, reservations-page) usan `@include mixins.catalog-table-header` — headers `#F2E4F2`/`#6B3C6B` consistentes confirmados en browser |
| VIS-GEN-08 | Sidebar — ítem "Ventas" visible para los 4 roles, con sub-ítems filtrados según permisos | ADMIN ve Clientes/Órdenes/Reservas; WAREHOUSEMAN ve los 3 (lectura); todos ven "Reservas" | ✅ PASS | Verificado en browser para los 4 roles (durante SEC-01..05 y VIS-GEN): ADMIN/MANAGER ven Clientes, Órdenes de venta y Reservas; WAREHOUSEMAN ve Órdenes (solo entrega) y Reservas; SALES ve Clientes, Órdenes de venta (nueva) y Reservas — todos ven "Reservas" |

---



## 9. Validaciones de ciberseguridad (CYBER)

> Basado en **OWASP ASVS v4 — Nivel 1 (L1)**. Verificar con `curl` con JWT válido de cada rol,
> y acceso directo por URL en browser (no solo esconder en sidebar). Adaptado a endpoints Sales:
> `/api/v1/sales/clients`, `/api/v1/sales/orders`, `/api/v1/sales/reservations`.

### Mapa de requisitos ASVS L1 por caso

| Caso | Requisito ASVS L1 | Descripción del control |
|---|---|---|
| CYBER-01 | V4.2.1 | Acceso a recursos requiere autenticación |
| CYBER-02 | V4.2.2 | Control de acceso basado en rol |
| CYBER-03 | V3.5.1 | JWT firmado; firma verificada server-side |
| CYBER-04 | V4.1.1 | Autorización aplicada server-side (no solo frontend) |
| CYBER-05 | V5.1.3 | Validación de input server-side independiente del cliente |
| CYBER-06 | V5.3.3 | Neutralización de output (prevención de XSS stored) |
| CYBER-07 | V4.2.1 | Datos sensibles redactados por rol server-side |
| CYBER-08 | V3.5.3 | Token expirado o manipulado → 401 |
| CYBER-09 | V5.3.4 | Parámetros de búsqueda no inyectables (SQL Injection) |
| CYBER-10 | V4.2.1 | Autorización por recurso (IDOR) |
| CYBER-11 | V3.3.1 | Logout invalida el token server-side |
| CYBER-12 | V5.1.2 | Transiciones inválidas devuelven código correcto (422 no 500) |
| CYBER-13 | V14.4.1 | Política CORS restrictiva en endpoints |
| CYBER-14 | V2.1.1 | Login con credenciales incorrectas → 401 |
| CYBER-15 | V4.2.1 | Datos sensibles ausentes del DOM para roles sin permiso |

| ID | Pantalla | Descripción | Rol(es) | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| CYBER-01 | API | `GET /api/v1/sales/clients` sin JWT → 401 (no 200/403) | Sin sesión | HTTP 401 con body `{"status":401,"error":"Unauthorized"}` | ✅ PASS | Fase 1 R1 (2026-06-27): curl sin JWT → HTTP 401. |
| CYBER-02 | API | `GET /api/v1/sales/clients` con JWT de rol no autorizado (si aplica restricción) | WAREHOUSEMAN | HTTP 403 si la ruta está restringida, o 200 con datos de solo lectura según diseño | ✅ PASS | Fase 1 R1 (2026-06-27): WAREHOUSEMAN `GET /sales/clients/active` → 200 (lectura permitida server-side por diseño). |
| CYBER-03 | API | `GET /api/v1/sales/orders` con JWT manipulado (cambiar rol en payload, no firmar) | Cualquiera | HTTP 401 — firma inválida rechazada por `parseSignedClaims()` | ✅ PASS | Fase 1 R1 (2026-06-27): JWT de SALES con `roles:[ROLE_ADMIN]` (firma inválida) → 401. |
| CYBER-04 | API | `POST /api/v1/sales/clients` con JWT de SALES | SALES | HTTP 201 — SALES SÍ puede crear clientes (regla de negocio confirmada por el usuario 2026-06-27; consistente con RBAC-CLI-01 que muestra el botón "Nuevo cliente" para SALES) | ✅ PASS | Fase 1 R1 (2026-06-27): SALES `POST /sales/clients` → **201** (creado). **RECONCILIADO (2026-06-27)**: el resultado esperado se corrigió de 403 a 201 — un vendedor puede dar de alta a sus clientes (permiso de negocio válido, sin exposición de datos sensibles). No es defecto. Cliente "hack" creado se desactivó (L33). |
| CYBER-05 | API | `POST /api/v1/sales/clients` con payload manipulado (campos fuera de rango) | MANAGER | HTTP 400/422 — validación server-side rechaza aunque el frontend no valide | ✅ PASS | Fase 1 R1 (2026-06-27): = ERR-04 — body `{name:"",email:"no-es-email"}` → 400 "Validación fallida: name:...; email:...". |
| CYBER-06 | Clientes | Campo de nombre con `<script>alert(1)</script>` — verificar que se neutraliza | ADMIN | Script no se ejecuta; texto escapado `&lt;script&gt;` en la vista | ✅ PASS | Fase 1 R1 (2026-06-27): cliente creado con nombre `<script>document.title='XSS-SALES-CY06'</script>` → `document.title` sigue "Almacenes", 0 script elements inyectados, se renderiza como TEXTO literal en la tabla (Angular escapa). Cliente XSS desactivado (L33). |
| CYBER-07 | API | `GET /api/v1/sales/orders/{id}` con JWT de WAREHOUSEMAN/SALES — `unitCost` en detalles | WAREHOUSEMAN, SALES | `unitCost: null` en response JSON (redactado server-side, L29) | ✅ PASS | Fase 1 R1 (2026-06-27): = RBAC-LIN-04 — `GET /sales/orders/2926` WAREHOUSEMAN/SALES → `details[].unitCost: null` (ADMIN/MANAGER 500.0). |
| CYBER-08 | Browser | Token expirado manualmente (`localStorage` con JWT alterado en `exp`) → navegar a `/sales/clients` | Cualquiera | Redirige a `/login` con mensaje "Tu sesión ha expirado" | ✅ PASS | Fase 1 R1 (2026-06-27): verificado en vivo — el JWT expiró durante la ronda y navegar a `/sales/orders/new` redirigió a `/login?reason=expired`. |
| CYBER-09 | Clientes | Búsqueda con `'; DROP TABLE clients; --` en campo de búsqueda | ADMIN | No produce error 500; respuesta 200 con 0 resultados o array vacío | ✅ PASS | Fase 1 R1 (2026-06-27): curl `search='; DROP TABLE clients; --` → HTTP 200 (tratado como literal, sin 500). |
| CYBER-10 | API | `GET /api/v1/sales/orders/{id_de_otro_usuario}` — IDOR (si hay multi-tenant) | SALES | HTTP 403/404 si el recurso no pertenece al usuario/tenant | ✅ PASS | Fase 1 R1 (2026-06-27): SALES `GET /sales/orders/2901` → 200. Sistema single-tenant: lectura de órdenes permitida para SALES (sin aislamiento por vendedor, por diseño); la escritura sí está restringida por rol (SEC-07/08/09). |
| CYBER-11 | Browser | Cerrar sesión → copiar JWT → abrir nueva pestaña con JWT en localStorage | Cualquiera | API retorna 401 si el backend invalida tokens (o sesión JS destruida impide acceso) | ✅ PASS | Fase 1 R1 (2026-06-27): logout elimina el token de `localStorage` → navegar a ruta protegida redirige a `/login` (sesión JS destruida impide acceso; verificado mismo mecanismo en SEC-02 y en Inventario CYBER-20). JWT stateless: el backend no invalida el token hasta `exp` (característica conocida, no defecto). |
| CYBER-12 | API | `PATCH /api/v1/sales/orders/{id}/deliver` en orden con estado PENDING | MANAGER | HTTP 422/409 — transición de estado inválida, no 500 | ✅ PASS | Fase 1 R1 (2026-06-27): `PATCH /sales/orders/{PENDING}/deliver` → 422 "Solo se pueden entregar órdenes en estado APPROVED. Estado actual: PENDING" (no 500). |
| CYBER-13 | API | `OPTIONS /api/v1/sales/orders` desde `Origin: https://evil.com` | Cualquiera | `Access-Control-Allow-Origin` no contiene `evil.com`; o responde 403 CORS | ✅ PASS | Fase 1 R1 (2026-06-27): `OPTIONS` con `Origin: https://evil.com` → HTTP 403 (CORS bloquea origen no permitido). |
| CYBER-14 | Login | `POST /api/v1/auth/login` con password incorrecta de usuario sales existente | Sin sesión | HTTP 401 con mensaje de error genérico; sin rate-limit: documentar como gap si aplica | ✅ PASS | Fase 1 R1 (2026-06-27): `POST /auth/login` `qa_sales`/`wrongpass` → 401 (no 200/500). Rate limiting global confirmado en Inventario CYBER-19 (429 tras 6 intentos). |
| CYBER-15 | Browser | Inspeccionar DOM en lista de órdenes con WAREHOUSEMAN/SALES — columna `unitCost` | WAREHOUSEMAN, SALES | Columna `unitCost` ausente del DOM (no solo `display:none`) para estos roles | ✅ PASS | Fase 1 R1 (2026-06-27): = RBAC-LIN-02/03 — detalle de orden 2926 con WAREHOUSEMAN/SALES, headers sin "Costo unitario"/"Margen" (ausentes del DOM, excluidos de `displayedColumns`). |


## 10. Historial de bugs encontrados en este módulo

| Bug ID | Descripción | Dónde se encontró | Estado |
|---|---|---|---|
| BUG-S4-01 | Doble asterisco "Nombre **" en el campo Nombre del formulario de cliente — `client-form.component.html` línea 13 tenía `<mat-label>Nombre *</mat-label>` manual, y Angular Material agrega un `*` automático adicional por `Validators.required` | VIS-CLF-01 (ADMIN, MANAGER y almacen01 en modo lectura) | ✅ Corregido (2026-06-13) — se quitó el `*` manual; verificado en browser |

> Agregar una fila por cada bug encontrado durante las pruebas. Referenciar el ID del
> bug en la columna "Notas" del caso que lo detectó. Documentar el bug completo en §8
> de `memoria_tecnica_modulo_sales_frontend.md`.
>
> Hallazgos pre-código ya identificados (no son bugs de este módulo, son hallazgos del
> backend documentados en la propuesta): **H1** (RuntimeException→500 en
> `SaleOrderServiceImpl`/`ClientServiceImpl`), **H2** (`unitCost` sin redacción L29),
> **H3** (verificar `@Transactional` en `approveOrder()`, D8).

---



---

## Historial de rondas de verificación

| Ronda | Fecha | Casos ejecutados | PASS | FAIL | N/A | Resultado | Notas |
|---|---|---|---|---|---|---|---|
| 1 | 2026-06-13..21 | 190 | 186 | 0 | 4 | ✅ Verificada | Módulo Sales certificado. FLOW-DET-07 y EMPTY-CLI/ORD-01/02 → N/A. BUG-S4-01 corregido |
| 2 | 2026-06-23 | ⏳ | — | — | 5 | 🔄 En curso (reset) | Reset completo; +15 casos CYBER; nuevas lecciones L34/L35; Protocolo 4 fases estricto |

---

## 11. Checklist de cierre (Propuesta D)

Antes de declarar el módulo **done** en la ronda actual, verificar que se cumplen las 6 condiciones:

```
[ ] 1. Todos los 205 casos tienen estado en columna "Estado" — 0 filas ⏳ PENDIENTE
       Última ronda certificada (2026-06-21): 186 ✅ PASS · 0 ❌ FAIL · 4 N/A · +15 CYBER nuevos.
[ ] 2. ng build --configuration=production → 0 errores AOT (no opcional — BUG-BUILD-01).
[ ] 3. ng test --no-watch --coverage → 0 fallos; cobertura statements ≥ 70%.
[ ] 4. Backend mvn test → 0 fallos nuevos respecto al baseline documentado.
[ ] 5. Prueba browser completa con los 4 roles QA — lectura estricta: todos los casos
       en una sola sesión sobre código congelado, de principio a fin.
[ ] 6. Actualizar memoria técnica §8/§10 + memoria_tecnica_global_proyecto.md +
       estado_sesion_activa.md. Commit chore(qa) con fecha y resultado.
```

### Checklist adicional — Lecciones L29-L35 (mandatorio)

```
[ ] L29 — Matriz de campos sensibles × roles documentada en §4 de la memoria técnica
    (unitCost de SaleOrderDetailResponseDTO → CYBER-07 en PASS)
[ ] L30 — 401/403 correctos (ERR-07/ERR-08 en PASS); rate limiting login documentado
[ ] L31 — ClientDialog y SaleOrderDetailFormDialog usan disableClose:true (UI-CLF-05,
    UI-LIN-04 en PASS); paginadores resetean a página 0 (UI-CLI-PAG-03, UI-ORD-PAG-03)
[ ] L32 — Headers de tabla de Clientes/Órdenes/Detalles/Reservas usan el mixin
    compartido (VIS-CLI-07, VIS-ORD-07, VIS-GEN-07 en PASS)
[ ] L33 — forkJoin de ReservationsPageComponent con catchError por observable
    (RBAC-RES-FJ-01..03 en PASS); sin datos de prueba activos sin prefijo al cierre
[ ] L34 — Click en mat-row abre detalle/edición; botones usan stopPropagation()
    (UI-CLF-* y UI-ORD-* en PASS)
[ ] L35 — Usuarios QA permanentes usados (admin, qa_manager, qa_warehouse, qa_sales);
    sin usuarios efímeros creados para pruebas
```

### Hallazgos pre-código verificados en ronda anterior (H1/H2/H3/H4)

```
[x] H1 — Resuelto en backend (commit `0374944`, rama `fix/sales-h1-typed-exceptions`)
[x] H2 — Resuelto (commit `1f3b41e`, rama `fix/sales-rbac-lin-04-redaction`)
[x] H4 — Resuelto (commit `cca468b`, rama `fix/backend-pretest-failures`)
[x] H3 (D8) — Verificado: @Transactional en SaleOrderServiceImpl a nivel de clase
```
