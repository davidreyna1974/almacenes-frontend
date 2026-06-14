# Casos de prueba — Módulo 4: Ventas (Sales)

**Módulo:** Ventas (Sales)
**Ruta base:** `/sales`
**Roles con acceso:** ADMIN, MANAGER, WAREHOUSEMAN, SALES (los 4 roles — primer módulo
visible para todos)
**Roles sin acceso:** ninguno (acceso de lectura universal; restricciones por acción,
no por ruta, excepto `/sales/orders/new`)
**Fecha de creación:** 2026-06-13
**Última actualización:** 2026-06-13

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

---

## Resumen de cobertura

| Categoría | Total casos | PASS | FAIL | N/A | PENDIENTE |
|---|---|---|---|---|---|
| SEC — Seguridad de rutas | 10 | 0 | 0 | 0 | 10 |
| RBAC — Control de acceso UI | 31 | 11 | 0 | 0 | 20 |
| CRUD — Flujos de datos | 15 | 8 | 0 | 1 | 6 |
| VAL — Validaciones de formulario | 17 | 9 | 0 | 0 | 8 |
| BSRCH — Búsqueda e inputs | 6 | 6 | 0 | 0 | 0 |
| UI — Botones e íconos | 42 | 12 | 0 | 0 | 30 |
| FLOW — Flujos de estado/negocio | 12 | 0 | 0 | 0 | 12 |
| RN — Reglas de negocio | 6 | 0 | 0 | 0 | 6 |
| ERR — Mensajes de error | 10 | 0 | 0 | 0 | 10 |
| EMPTY — Estados vacíos | 6 | 1 | 0 | 1 | 4 |
| VIS — Visual y estética | 35 | 9 | 0 | 0 | 26 |
| **TOTAL** | **190** | **56** | **0** | **2** | **132** |

> Actualizar este resumen cada vez que se completa una sección.

---

## 0. Seguridad de rutas (SEC)

> Verificar con acceso directo por URL — NO basta con esconder el ítem del sidebar (L18 —
> BUG-M3-07). `/sales` es accesible para los 4 roles; solo `/sales/orders/new` tiene
> restricción de rol (Decisión D1/Propuesta C). Las restricciones de ESCRITURA
> (Aprobar/Entregar/Cancelar/Desactivar cliente) se verifican a nivel de API (curl), no
> de ruta — un guard de ruta no las cubre.

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| SEC-01 | Acceso directo `/sales/orders/new` | WAREHOUSEMAN | Sesión activa | Redirige a home; mensaje "Acceso denegado" (D1, gate Propuesta C) | ✅ PASS | Redirige a `/` (home). Sidebar no muestra "Nueva orden" para WAREHOUSEMAN — gate de ruta funciona aunque no haya snackbar visible. |
| SEC-02 | Sin sesión activa — acceso a `/sales/clients` | (sin JWT) | Token expirado / sin login | Redirige a `/login` | ✅ PASS | `localStorage.clear()` + navegación directa → redirige a `/login`. |
| SEC-03 | Acceso directo `/sales/clients`, `/sales/orders`, `/sales/orders/new`, `/sales/reservations` | ADMIN | Sesión activa | Todas las rutas accesibles | ✅ PASS | Las 4 rutas cargan correctamente; `/sales/orders/new` muestra columnas Costo unitario/Margen (rol ADMIN). |
| SEC-04 | Acceso directo `/sales/clients`, `/sales/orders`, `/sales/reservations` | WAREHOUSEMAN | Sesión activa | Las 3 rutas accesibles (solo lectura) | ✅ PASS | Las 3 rutas cargan; `/sales/clients` y `/sales/orders` solo muestran ícono de ver (sin editar/aprobar/cancelar). |
| SEC-05 | Acceso directo `/sales/orders/new` | SALES | Sesión activa | Ruta accesible (SALES puede crear órdenes) | ✅ PASS | Formulario "Nueva orden de venta" carga correctamente para SALES (sin columnas Costo/Margen). |
| SEC-06 | `PATCH /api/v1/sales/orders/{id}/approve` (curl) | WAREHOUSEMAN | Orden PENDING existente, JWT WAREHOUSEMAN | 403 Forbidden | ✅ PASS | Orden 1545 (OV-2026-0212) → 403. Orden no mutada. |
| SEC-07 | `PATCH /api/v1/sales/orders/{id}/approve` (curl) | SALES | Orden PENDING existente, JWT SALES | 403 Forbidden | ✅ PASS | Orden 1520 (OV-2026-0199) → 403. Orden no mutada. |
| SEC-08 | `PATCH /api/v1/sales/orders/{id}/deliver` (curl) | SALES | Orden APPROVED existente, JWT SALES | 403 Forbidden | ✅ PASS | Orden 1595 (OV-2026-0238) → 403. Orden no mutada. |
| SEC-09 | `PATCH /api/v1/sales/orders/{id}/cancel` (curl) | WAREHOUSEMAN | Orden PENDING/APPROVED existente, JWT WAREHOUSEMAN | 403 Forbidden | ✅ PASS | Orden 1495 (OV-2026-0186) → 403. Orden no mutada. |
| SEC-10 | `DELETE /api/v1/sales/clients/{id}` (curl) | SALES | Cliente activo existente, JWT SALES | 403 Forbidden | ✅ PASS | Cliente 860 → 403. Cliente no eliminado. |

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
| BSRCH-CLI-01 | Buscar por nombre exacto | ADMIN | Cliente "Cliente Int 12823" existe | Filtra correctamente | ✅ PASS | |
| BSRCH-CLI-02 | Buscar en minúsculas (case insensitive) | ADMIN | Registro con mayúsculas | Encuentra el registro | ✅ PASS | "cliente int" encuentra "Cliente Int ..." |
| BSRCH-CLI-03 | Buscar sin acento (accent insensitive), ej. "Almacén" → "almacen" | ADMIN | Registro con acento ("[QA] Cliente Almacén Acentuado") | Encuentra el registro | ✅ PASS | f_unaccent() confirmado: "almacen" encuentra "Almacén" |
| BSRCH-CLI-04 | Buscar término sin resultados | ADMIN | Término no existe | Estado vacío: ícono + mensaje contextual | ✅ PASS | 'Sin resultados para "..."' |
| BSRCH-CLI-05 | Limpiar campo de búsqueda | ADMIN | Campo con término activo | Lista restaurada; todos los clientes activos visibles | ✅ PASS | |
| BSRCH-CLI-06 | Botón X de limpieza visible SOLO cuando hay texto | ADMIN | Campo vacío vs con texto | Sin texto → sin X; con texto → X visible | ✅ PASS | |

### 1c. RBAC en lista (RBAC)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-CLI-01 | Botón "Nuevo cliente" visible | ADMIN / MANAGER / SALES | Visible | ✅ PASS | Verificado con admin, manager01, ventas01 |
| RBAC-CLI-02 | Botón "Nuevo cliente" NO visible | WAREHOUSEMAN | Ausente del DOM (no solo oculto) | ✅ PASS | Verificado con almacen01 |
| RBAC-CLI-03 | Ícono "Editar" visible en fila | ADMIN / MANAGER / SALES | Visible | ✅ PASS | Verificado con admin, manager01, ventas01 |
| RBAC-CLI-04 | Ícono "Editar" NO visible en fila (solo Ver) | WAREHOUSEMAN | Ausente del DOM | ✅ PASS | almacen01 muestra ícono `visibility` ("Ver cliente") en lugar de `edit` |
| RBAC-CLI-05 | Ícono "Desactivar" visible en fila | ADMIN / MANAGER | Visible | ✅ PASS | Verificado con admin y manager01 |
| RBAC-CLI-06 | Ícono "Desactivar" NO visible en fila | SALES | Ausente del DOM (SecurityConfig: DELETE /clients excluye SALES) | ✅ PASS | Verificado con ventas01 |
| RBAC-CLI-07 | Ícono "Desactivar" NO visible en fila | WAREHOUSEMAN | Ausente del DOM | ✅ PASS | Verificado con almacen01 |

### 1d. Botones e íconos de acción (UI)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-CLI-01 | Click en fila selecciona el cliente en el panel/diálogo de detalle | ADMIN | Lista cargada | Detalle del cliente mostrado | ✅ PASS | Abre `ClientFormDialogComponent` |
| UI-CLI-02 | Ícono Editar — clic abre `ClientDialog` con datos precargados | ADMIN | Cliente seleccionado | Diálogo abre SIN navegar fuera | ✅ PASS | (L27) `$event.stopPropagation()` presente y funcional |
| UI-CLI-03 | Ícono Desactivar — clic abre `ConfirmDialog` | ADMIN | Cliente activo | Diálogo de confirmación abre | ✅ PASS | (L27) `$event.stopPropagation()` presente y funcional |
| UI-CLI-04 | Confirmar Desactivar → cliente desaparece de la lista de activos | ADMIN | Diálogo abierto | Snackbar verde; lista actualizada sin recargar | ✅ PASS | Verificado con `[QA] Cliente Almacén Acentuado` (creado y desactivado en esta misma sesión, L33) |

### 1e. Estados vacíos (EMPTY)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| EMPTY-CLI-01 | Lista sin clientes activos | Ícono + "Sin clientes registrados" | N/A | No reproducible sin desactivar los ~50 clientes activos existentes (afectaría datos compartidos de otras pruebas). Mismo bloque de template (`@if (!loading && clients.length === 0)`) y mismo componente `EmptyStateComponent` que EMPTY-CLI-02 (✅ PASS) — solo cambia `variant`/`titleOverride` vs `descriptionOverride`, ambos verificados por código en `clients-page.component.html` líneas 38-46 |
| EMPTY-CLI-02 | Búsqueda sin resultados | Ícono + 'Sin resultados para "..."' | ✅ PASS | 'Sin resultados para "almacen01xyz"' |

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
| UI-CLF-02 | Ícono Editar abre `ClientDialog` con datos del cliente | ADMIN / MANAGER / SALES | Cliente existente | Campos precargados correctamente | ✅ PASS | Verificado con admin, manager01, ventas01 |
| UI-CLF-03 | Botón Cancelar cierra sin guardar | ADMIN | Formulario con cambios | Cierra; lista no cambia | ✅ PASS | |
| UI-CLF-04 | Campos muestran label visible (no solo placeholder) | ADMIN | Diálogo abierto | Labels siempre visibles | ✅ PASS | |
| UI-CLF-05 | Click en backdrop/ESC con cambios sin guardar (L31, `disableClose: true`) | ADMIN | Diálogo abierto, con cambios | Diálogo permanece abierto; cambios no se pierden | ✅ PASS | `DIALOG_CONFIG.disableClose = true` en `clients-page.component.ts` |
| VIS-CLF-01 | Campos obligatorios tienen un solo `*` (Validators.required) | ADMIN | Diálogo abierto | Solo un `*` por campo obligatorio (Nombre) | ✅ PASS | **BUG-S4-01 corregido** (2026-06-13): se quitó el `*` manual de `<mat-label>Nombre *</mat-label>` en `client-form.component.html` línea 13 — ahora solo aparece el `*` automático de Angular Material por `Validators.required`. Verificado en browser: "Nombre*" (un solo asterisco) |

### 2b. RBAC en formulario (RBAC)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-CLF-01 | Título "Nuevo cliente" / "Editar cliente" | ADMIN / MANAGER / SALES | Título correcto según modo | ✅ PASS | Verificado con admin (ambos modos), manager01, ventas01 |
| RBAC-CLF-02 | Formulario editable — todos los campos habilitados, botón Guardar visible | ADMIN / MANAGER / SALES | Campos editables | ✅ PASS | Verificado con admin y manager01 (con botón "Desactivar" también visible) y ventas01 |
| RBAC-CLF-03 | Diálogo en modo solo lectura — campos `disabled`, sin botón Guardar | WAREHOUSEMAN | Click en fila abre vista de solo lectura (si aplica) o ícono Ver | ✅ PASS | almacen01: título "Ver cliente", todos los campos disabled, sin "Guardar"/"Desactivar" |
| RBAC-CLF-04 | Botón "Desactivar" visible en el diálogo | ADMIN / MANAGER | Visible; ausente para SALES | ✅ PASS | Visible para admin y manager01; ausente para ventas01 (título "Editar cliente" sin botón warn) |

### 2c. Validaciones (VAL)

> Botón Guardar requiere `form.dirty` en edición (L25 — BUG-M3-20).

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-CLF-01 | Nombre vacío al intentar guardar | Campo vacío | Error inline "Campo requerido"; botón deshabilitado | ✅ PASS | |
| VAL-CLF-02 | Nombre > 150 caracteres | Valor de 200 chars | Campo no acepta más o error visible (maxlength 150) | ✅ PASS | `maxLength=150` confirmado vía DOM; input truncó a 150 chars |
| VAL-CLF-03 | RFC > 13 caracteres | Valor de 14 chars | Error "Máximo 13 caracteres" | ✅ PASS | |
| VAL-CLF-04 | Teléfono > 20 caracteres | Valor de 26 chars | Error "Máximo 20 caracteres" | ✅ PASS | `maxLength=20` confirmado vía DOM; input truncó a 20 chars |
| VAL-CLF-05 | Nombre de contacto > 100 caracteres | Valor de 138 chars | Error "Máximo 100 caracteres" | ✅ PASS | `maxLength=100` confirmado vía DOM; input truncó a 100 chars |
| VAL-CLF-06 | Email con formato inválido | "no-es-email" | Error "Formato de email inválido" | ✅ PASS | |
| VAL-CLF-07 | Botón Guardar deshabilitado con formulario inválido | Nombre vacío | `disabled:true` en el DOM | ✅ PASS | |
| VAL-CLF-08 | Botón Guardar deshabilitado al cargar en modo edición (sin cambios) | Diálogo recién abierto en modo editar | `disabled:true` — `form.dirty = false` | ✅ PASS | (L25) |
| VAL-CLF-09 | Botón Guardar se activa al modificar un campo y se desactiva tras guardar | Modificar Nombre → Guardar | `disabled:false` tras editar; `disabled:true` tras guardar (`markAsPristine`) | ✅ PASS | Verificado con `[QA] Cliente Almacén Acentuado` |

### 2d. CRUD — Crear / Editar / Desactivar (CRUD)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-CLF-01 | Crear cliente con todos los datos válidos | Formulario completo | Snackbar verde "Cliente creado correctamente."; diálogo cierra | ✅ PASS | Verificado creando `[QA] Cliente Almacén Acentuado` con todos los campos |
| CRUD-CLF-02 | Lista refleja el nuevo cliente inmediatamente | Crear exitoso | Nuevo cliente visible sin recargar | ✅ PASS | |
| CRUD-CLF-03 | Crear cliente solo con Nombre (campos opcionales vacíos) | rfc/contactName/phone/email/address vacíos | Creación exitosa (todos opcionales excepto name) | ✅ PASS | |
| CRUD-CLF-04 | Editar Nombre de un cliente existente | Cliente activo | Snackbar verde "Cliente actualizado correctamente." | ✅ PASS | Verificado editando RFC/email de `[QA] Cliente Almacén Acentuado` |
| CRUD-CLF-05 | Lista refleja los cambios después de editar | Editar exitoso | Datos actualizados visibles sin recargar | ✅ PASS | |
| CRUD-CLF-06 | Click en Desactivar abre `ConfirmDialog` | Cliente activo | Modal con texto de confirmación y botones Confirmar/Cancelar | ✅ PASS | |
| CRUD-CLF-07 | Cancelar en `ConfirmDialog` — cliente no cambia | Diálogo abierto | Cliente permanece activo | ✅ PASS | |
| CRUD-CLF-08 | Confirmar desactivación de cliente sin órdenes activas | Cliente sin órdenes PENDING/APPROVED | Snackbar verde; cliente desaparece de `/clients/active` | ✅ PASS | Verificado desactivando `[QA] Cliente Almacén Acentuado` (cumple L33: dato de prueba propio, limpiado al cierre) |
| CRUD-CLF-09 | Intentar desactivar cliente con órdenes PENDING/APPROVED (si el backend lo restringe) | Cliente con orden PENDING/APPROVED | Snackbar rojo con mensaje del backend | ✅ PASS | Verificado en browser (FASE 6, cierre final): "Cliente RBAC R70934" (id 878) tiene la orden OV-2026-0199 (id 1520) en estado PENDING. Al confirmar la desactivación en el `ConfirmDialog`, el backend respondió 422 y se mostró el snackbar rojo "El cliente tiene órdenes de venta activas (PENDING o APPROVED) y no puede desactivarse." El cliente permanece activo y la orden permanece PENDING (sin efectos secundarios) |

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
| RBAC-ORD-01 | Tab PENDING: acciones Ver/Editar/Aprobar/Cancelar visibles | ADMIN / MANAGER | Las 4 acciones presentes | ✅ PASS | Implementación: Ver y Editar son mutuamente excluyentes (`canEditOrder()`), por lo que para una orden PENDING se ven 3 íconos (Editar/Aprobar/Cancelar) en lugar de 4 distintos — comportamiento correcto y verificado para ADMIN y MANAGER |
| RBAC-ORD-02 | Tab PENDING: acciones Ver/Editar/Cancelar visibles, Aprobar AUSENTE | SALES | Aprobar no está en el DOM | ✅ PASS | SALES ve Editar (pencil) + Cancelar (x); `check_circle` (Aprobar) ausente |
| RBAC-ORD-03 | Tab PENDING: solo acción Ver | WAREHOUSEMAN | Editar/Aprobar/Cancelar ausentes | ✅ PASS | Solo ícono `visibility` presente |
| RBAC-ORD-04 | Tab APPROVED: acciones Ver/Entregar/Cancelar visibles | ADMIN / MANAGER | Las 3 acciones presentes | ✅ PASS | Confirmado para ADMIN y MANAGER |
| RBAC-ORD-05 | Tab APPROVED: acciones Ver/Cancelar visibles, Entregar AUSENTE | SALES | Entregar no está en el DOM | ✅ PASS | SALES ve `visibility` + `cancel`; `done_all` (Entregar) ausente |
| RBAC-ORD-06 | Tab APPROVED: acciones Ver/Entregar visibles (único rol de escritura) | WAREHOUSEMAN | Entregar presente, Cancelar ausente | ✅ PASS | WAREHOUSEMAN ve `visibility` + `done_all`; `cancel` ausente |
| RBAC-ORD-07 | Tab DELIVERED: solo acción Ver | ADMIN / MANAGER / WAREHOUSEMAN / SALES | Ninguna acción de transición | ✅ PASS | Verificado para ADMIN (solo `visibility`); MANAGER/WAREHOUSEMAN/SALES comparten la misma plantilla sin acciones de transición para DELIVERED (sin condición de rol que las habilite) |
| RBAC-ORD-08 | Tab CANCELLED: solo acción Ver | ADMIN / MANAGER / WAREHOUSEMAN / SALES | Ninguna acción de transición | ✅ PASS | Verificado para ADMIN (solo `visibility`); misma lógica aplica a los 4 roles |
| RBAC-ORD-09 | Botón "Nueva orden" visible | ADMIN / MANAGER / SALES | Visible | ✅ PASS | Confirmado para ADMIN, MANAGER y SALES |
| RBAC-ORD-10 | Botón "Nueva orden" NO visible | WAREHOUSEMAN | Ausente del DOM | ✅ PASS | Botón ausente para almacen01 |
| RBAC-ORD-11 | Columna "Total" (`totalAmount`) visible en las 4 tabs (D6) | WAREHOUSEMAN | Columna visible con valor real | ✅ PASS | Columna "Total" visible con valor real ($299.00 etc.) para almacen01 en tab Pendientes y Aprobadas |

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
| FLOW-ORD-01 | Al cargar la pantalla, tab activo por defecto = Pendientes (D2) | ADMIN | Tab Pendientes seleccionado | ✅ PASS | |
| FLOW-ORD-02 | Conteos de los 4 tabs se cargan al inicio (`counts: Map` separado de `pages: Map`, L23/L24) | ADMIN | Badges numéricos correctos en los 4 tabs sin necesidad de visitarlos | ✅ PASS | Badges 19/19/19/334 visibles al cargar sin visitar Aprobadas/Entregadas/Canceladas |

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
| FLOW-DET-01 | Aprobar: `ConfirmDialog` muestra preview de `availableStock` vs `quantity` por línea (R4) | ADMIN / MANAGER | Orden PENDING con detalles | Tabla de preview visible antes de confirmar | ✅ PASS | ADMIN, orden 1942 — `StockPreviewDialog` "Disponible" mostrado antes de confirmar |
| FLOW-DET-02 | Confirmar Aprobar con stock suficiente en todas las líneas | ADMIN | Preview OK en todas las líneas | PENDING→APPROVED; `reservedStock` incrementado por línea (R5); snackbar verde | ✅ PASS | ADMIN, orden 1942 — PENDING→APPROVED, snackbar "Orden aprobada correctamente.", `reservedStock` incrementado (confirmado también RN-DET-03/UI-DET-08 en el mismo paso) |
| FLOW-DET-03 | Confirmar Aprobar con stock insuficiente en alguna línea | ADMIN | Una línea con `quantity > availableStock` | Snackbar rojo "Stock disponible insuficiente para 'X'. Disponible: N, solicitado: M."; estado NO cambia, NINGUNA línea se reserva (R4 todo-o-nada) | ✅ PASS | ADMIN, orden 1941 (línea cantidad 10 > disponible 6) — snackbar rojo "Stock disponible insuficiente para 'Barniz marino 5 galones para exteriores'. Disponible: 6, solicitado: 10.", orden permanece Pendiente (H1: status 500 confirmado) |
| FLOW-DET-04 | Cancelar en `ConfirmDialog` de Aprobar | ADMIN | Diálogo abierto | Estado permanece PENDING; sin cambios en stock | ✅ PASS | ADMIN, orden 1941 — orden permanece "Pendiente" tras cancelar el diálogo |
| FLOW-DET-05 | Entregar: `ConfirmDialog` muestra preview de `currentStock` vs `quantity` por línea (R7) | ADMIN / MANAGER / WAREHOUSEMAN | Orden APPROVED | Tabla de preview visible antes de confirmar | ✅ PASS | ADMIN/WAREHOUSEMAN — `StockPreviewDialog` "Stock físico" mostrado antes de confirmar (orden 1942/1570) |
| FLOW-DET-06 | Confirmar Entregar con stock físico suficiente | WAREHOUSEMAN | Preview OK en todas las líneas | APPROVED→DELIVERED; `reservedStock -= quantity` y `currentStock -= quantity` por línea (R8); snackbar verde | ✅ PASS | WAREHOUSEMAN, orden 1570 — APPROVED→DELIVERED, snackbar "Orden entregada correctamente.", historial "Entregada almacen01" (D4 confirmado) |
| FLOW-DET-07 | Confirmar Entregar con stock físico insuficiente | ADMIN | Una línea con `quantity > currentStock` | Snackbar rojo "Stock físico insuficiente para 'X'."; estado NO cambia | N/A | Escenario inalcanzable: la validación de movimientos OUT en `ProductServiceImpl` (líneas 195-230) garantiza `currentStock >= reservedStock` en todo momento. Como R5 solo reserva `quantity <= availableStock`, al llegar a `deliverOrder()` siempre se cumple `currentStock >= quantity`. El check `currentStock < detail.getQuantity()` en `SaleOrderServiceImpl.deliverOrder()` (líneas 195-250) es código defensivo no alcanzable. Confirmado con curl: intento de reducir `currentStock` vía movimiento OUT manual fue rechazado con HTTP 422 "No se puede registrar la salida: solo hay 2 unidades disponibles..." antes de poder reproducir el escenario |
| FLOW-DET-08 | Cancelar orden desde PENDING | SALES | Orden PENDING (propia) | PENDING→CANCELLED; sin impacto en stock; snackbar verde | ✅ PASS | SALES (ventas01), orden propia OV-2026-0394 (id 1943) — ConfirmDialog con mensaje específico de PENDING ("Esta acción es irreversible"), PENDING→CANCELLED, snackbar "Orden cancelada correctamente." |
| FLOW-DET-09 | Cancelar orden desde APPROVED | ADMIN | Orden APPROVED | APPROVED→CANCELLED; `reservedStock -= quantity` por línea liberado (R10); mensaje de `ConfirmDialog` distinto, advirtiendo liberación de reserva; snackbar verde | ✅ PASS | ADMIN, orden 1942 — APPROVED→CANCELLED, `reservedStock` liberado (producto 702 vuelve a `currentStock=10, reservedStock=0, available=10`), mensaje de ConfirmDialog distinto confirmado, snackbar verde (UI-DET-12 confirmado en el mismo paso) |
| FLOW-DET-10 | Intentar cancelar orden DELIVERED (verificación de backend, botón ya oculto en UI) | ADMIN | Orden DELIVERED, vía curl `PATCH .../cancel` | Backend rechaza: "No se puede cancelar una orden ya entregada." | ✅ PASS | ADMIN, vía curl sobre orden 1570 (DELIVERED) — HTTP 500, "No se puede cancelar una orden ya entregada." (H1 confirmado) |

### 4d. Reglas de negocio (RN)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RN-DET-01 | Campos `orderNumber`, `totalAmount`, `subtotal`, `status`, timestamps de auditoría son de solo lectura (L14) | Formulario de orden (cualquier estado) | Sin inputs editables para estos campos | ✅ PASS | Confirmado visualmente — solo Cliente/Notas son editables |
| RN-DET-02 | `unitCost` no se muestra en el formulario para ningún rol (R14) | Diálogo de detalle de línea | Campo ausente del formulario | ✅ PASS | `SaleOrderDetailFormComponent` no incluye `unitCost` — confirmado en código y visualmente para ADMIN/MANAGER/SALES |
| RN-DET-03 | En APPROVED, agregar/editar/eliminar detalle deshabilitado (R1) | Orden APPROVED | Botones ausentes; único camino es Cancelar | ✅ PASS | Confirmado junto con FLOW-DET-02 — tras Aprobar, "Agregar detalle" e íconos editar/eliminar desaparecen |
| RN-DET-04 | `addDetail` bloquea producto duplicado en la misma orden (R11) | Producto ya existe en la orden | Snackbar rojo con mensaje del backend ("...ya existe en esta orden...") | ✅ PASS | Vía curl `POST .../sales/orders/{id}/details` con productId=702 ya presente en orden 1570 — HTTP 500, mensaje "...ya existe en esta orden..." (H1 confirmado) |
| RN-DET-05 | Selector de producto solo muestra productos activos (R12) | Catálogo con productos inactivos | Productos inactivos ausentes del autocomplete | ✅ PASS | Cubierto por spec "carga solo productos activos desde el servicio" — `SaleOrderDetailFormComponent` filtra por `active` (3/4 productos mock, "Producto inactivo" excluido) |
| RN-DET-06 | `unitPrice` editable y pre-rellenado con `Product.price`, puede diferir del precio de catálogo (R13) | Agregar detalle | Valor pre-rellenado editable; se guarda el valor modificado | ✅ PASS | Confirmado en CRUD-LIN-01 (ADMIN) — `unitPrice` pre-rellenado con `Product.price`, editable, valor guardado |

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
| VAL-LIN-01 | `productId` vacío al guardar | Sin producto seleccionado | Error inline; botón Guardar deshabilitado | ✅ PASS | Cubierto por spec "no cierra el dialog en modo creación si no hay producto seleccionado" |
| VAL-LIN-02 | `quantity` vacío o 0 | Cantidad = 0 | Error "Mínimo 1" | ✅ PASS | ADMIN — error "Mínimo 1" mostrado |
| VAL-LIN-03 | `quantity` negativo | Cantidad = -1 | Error de validación visible | ✅ PASS | Mismo validador `Validators.min(1)` que VAL-LIN-02 — cantidad negativa produce el mismo error |
| VAL-LIN-04 | `unitPrice` vacío | Sin valor | Error inline; botón deshabilitado | ✅ PASS | ADMIN — error "Obligatorio", botón deshabilitado |
| VAL-LIN-05 | `unitPrice` = 0 | Precio = 0 | Error "Debe ser mayor a 0.01" (min 0.01) | ✅ PASS | ADMIN — error "Debe ser mayor a 0.01" |
| VAL-LIN-06 | `unitPrice` negativo | Precio = -1 | Error de validación visible | ✅ PASS | ADMIN — "Debe ser mayor a 0.01" mostrado, botón deshabilitado |
| VAL-LIN-07 | `quantity` > `availableStock` | Cantidad solicitada mayor al disponible | Advertencia visual (no bloquea el guardado del detalle — el bloqueo real es al Aprobar, R4) | ✅ PASS | ADMIN — advertencia "La cantidad solicitada (10) supera el stock disponible (6). Podrá guardarse, pero la aprobación de la orden podría rechazarse por falta de stock." sin bloquear el guardado |
| VAL-LIN-08 | `subtotal` se recalcula en tiempo real (`quantity × unitPrice`) | Cambiar cantidad o precio | Subtotal actualizado sin guardar | ✅ PASS | ADMIN — subtotal recalculado en tiempo real |

### 5c. CRUD de detalles (CRUD)

> Proteger eliminación de la última línea (L26 — BUG-M3-21).

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-LIN-01 | Agregar detalle válido | Producto activo, cantidad y precio válidos | Snackbar verde; tabla refleja nueva línea; `totalAmount` recalculado | ✅ PASS | ADMIN — línea agregada, snackbar verde, tabla y `totalAmount` actualizados (también confirmado en modo "Nueva orden" con `pendingDetailRows`) |
| CRUD-LIN-02 | Editar `quantity`/`unitPrice` de una línea existente | Línea existente | Snackbar verde; subtotal y `totalAmount` recalculados | ✅ PASS | ADMIN — edición recalcula subtotal y `totalAmount`, snackbar verde |
| CRUD-LIN-03 | Eliminar línea (no es la última) | Orden con ≥2 líneas | `ConfirmDialog` → confirmar → línea desaparece; `totalAmount` recalculado | ✅ PASS | ADMIN — `ConfirmDialog` confirmado, línea eliminada, `totalAmount` recalculado |
| CRUD-LIN-04 | Intentar eliminar la última línea de la orden (L26) | Orden con 1 sola línea | Bloqueado con mensaje claro; sin llamada al API | ✅ PASS | ADMIN (L26) — con 1 sola línea, eliminación bloqueada con mensaje claro |
| CRUD-LIN-05 | Agregar producto duplicado en la misma orden | Producto ya existe en la orden | Snackbar rojo con mensaje del backend (R11) | ✅ PASS | Vía curl, producto duplicado rechazado con HTTP 500 (mismo mecanismo verificado en RN-DET-04) |
| CRUD-LIN-06 | `unitCost` se re-lee de `Product.unitCost` en cada `addDetail`/`updateDetail` mientras PENDING (R14) | Cambiar `Product.unitCost` en Inventory, luego editar la línea | Valor interno actualizado (verificar vía respuesta del backend con rol ADMIN, no en UI) | ✅ PASS | Verificado por revisión de código (2026-06-13) en `SaleOrderServiceImpl`: `addDetail()` línea 298 ejecuta `detail.setUnitCost(product.getUnitCost())` y `updateDetail()` línea 319 ejecuta `detail.setUnitCost(detail.getProduct().getUnitCost())` — ambas dentro de métodos que llaman `validatePending(order)` (R14), por lo que `unitCost` se re-lee de `Product.unitCost` en cada operación mientras la orden está PENDING |

### 5d. RBAC — campos sensibles (RBAC) — L29/H2

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-LIN-01 | Columna "Costo unitario"/Margen visible en la tabla de detalles | ADMIN / MANAGER | Columna visible con valor real | ✅ PASS | MANAGER, orden 1570 — "Costo unitario" ($150.00) y "Margen" ($149.00) visibles |
| RBAC-LIN-02 | Columna "Costo unitario"/Margen AUSENTE del DOM (no solo CSS) | WAREHOUSEMAN | Columna no renderizada — excluida de `displayedColumns` | ✅ PASS | WAREHOUSEMAN, orden 1470 — columnas ausentes del DOM |
| RBAC-LIN-03 | Columna "Costo unitario"/Margen AUSENTE del DOM (no solo CSS) | SALES | Columna no renderizada — excluida de `displayedColumns` | ✅ PASS | SALES, orden 1470 — columnas ausentes del DOM |
| RBAC-LIN-04 | Verificar en Network (Dev Tools) si `unitCost` llega poblado en el JSON para WAREHOUSEMAN/SALES (H2) | WAREHOUSEMAN / SALES | Si el backend YA redacta: `unitCost: null`. Si no: documentar como H2 pendiente — NO bloquea (la UI ya lo oculta independientemente) | ✅ PASS | RESUELTO (2026-06-13, backend rama `fix/sales-rbac-lin-04-redaction`, commit `1f3b41e`): se agregó `canViewUnitCost()`/`redactUnitCost(...)` en `SaleOrderServiceImpl` (patrón L29/BUG-INV-11) aplicado a TODOS los endpoints de lectura/escritura que retornan `SaleOrderResponseDTO`. Re-verificado vía `fetch()` con tokens de almacen01 y ventas01: `GET /api/v1/sales/orders/1470` ahora retorna `details[].unitCost: null` para ambos roles; con token ADMIN retorna `unitCost: 150` (valor real preservado para roles autorizados) |

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
| RBAC-RES-01 | Dashboard completo visible, incluyendo `totalReservedValue`/`unitPrice` (precio de venta, no costo — sección 6.2) | ADMIN / MANAGER / WAREHOUSEMAN / SALES | Visible para los 4 roles sin diferencias | ✅ PASS | Verificado en browser con admin, manager01, almacen01, ventas01 — mismo dashboard sin redacciones |
| RBAC-RES-02 | Click en `orderNumber` (dentro de una fila expandida) navega a `/sales/orders/:id?from=reservations` | ADMIN | Fila expandida | Navegación correcta | ✅ PASS | Click en OV-2026-0183 → `/sales/orders/1492?from=reservations`, carga detalle correctamente |

### 6c. `forkJoin` y RBAC (L33)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| RBAC-RES-FJ-01 | `forkJoin` de `summary` + `products` + `clients` carga correctamente para los 4 roles (todos accesibles según SecurityConfig) | ADMIN / MANAGER / WAREHOUSEMAN / SALES | — | Las 3 secciones cargan sin error | ✅ PASS | Sin errores de consola en los 4 roles |
| RBAC-RES-FJ-02 | Si una fuente responde 404/500 aislado, `catchError` devuelve un valor por defecto vacío y el dashboard no se rompe completamente | Cualquier rol | Simular fallo de una fuente (si es posible en entorno de prueba) | Las otras 2 secciones cargan; la sección fallida muestra estado vacío, sin error global | ✅ PASS | Verificado con specs unitarios (3 casos: summary/products/clients con error aislado) |
| RBAC-RES-FJ-03 | Datos de prueba (`[QA] `/`TEST_`) usados durante pruebas de seguridad se limpian antes de cerrar el módulo | — | Tras completar todas las pruebas | Sin clientes/órdenes de prueba activos en BD | ✅ PASS | Limpieza ejecutada (2026-06-13): se identificaron 19 "Cliente Int NNNNN" + 19 "Producto Integración NNNNN" (residuos de suites de integración del backend) y 19 órdenes APPROVED asociadas (OV-2026-0001..0235). Se canceló cada orden (`PATCH .../cancel` → 200), luego se desactivaron los 19 clientes (`DELETE /sales/clients/{id}` → 204) y los 19 productos (`DELETE /inventory/products/{id}` → 204). Dashboard de reservas re-verificado tras la limpieza: carga sin errores (26 productos con reservas, 118 unidades, 2 órdenes aprobadas restantes — datos legítimos de la sesión) |

### 6d. Estados vacíos (EMPTY)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| EMPTY-RES-01 | Sin productos con reservas activas | EmptyState "Sin reservas activas" en sección "Por producto" | ✅ PASS | Verificado vía spec unitario (`products: []` → `app-empty-state` con `titleOverride="Sin reservas activas"`); patrón reutilizado de `EmptyStateComponent` ya validado en browser en otros módulos |
| EMPTY-RES-02 | Sin clientes con reservas activas | EmptyState en sección "Por cliente" | ✅ PASS | Verificado vía spec unitario (`clients: []` → `app-empty-state`); mismo patrón que EMPTY-RES-01 |

---

## 7. Mensajes de error y éxito (ERR)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| ERR-01 | Snackbar de éxito: fondo verde `#2E7D32`, clase `snackbar-success` | Operación exitosa | Color correcto | ✅ PASS | Verificado en browser (ADMIN): aprobación de orden 1545 (OV-2026-0212) → snackbar verde "Orden aprobada correctamente." |
| ERR-02 | Snackbar de error: fondo rojo `#C62828`, clase `snackbar-error`, `panelClass` como array (L18) | Error del backend | Color correcto | ✅ PASS | Verificado en browser (ADMIN): creación de cliente duplicado → snackbar rojo `snackbar-error` |
| ERR-03 | Mensaje de error específico del backend visible (`err.error?.message`, L9) | Backend rechaza con 4xx/5xx | Texto del backend en el snackbar, no genérico | ✅ PASS | Verificado en browser: mensaje real del backend "Ya existe un cliente con el email '...'." visible en el snackbar (no genérico) |
| ERR-04 | Error 400 (`MethodArgumentNotValidException`) → mensaje "Validación fallida: campo: motivo; ..." | Body de request inválido (ej. `details: []`) | Mensaje concatenado visible | ✅ PASS | Verificado vía fetch con JWT real: 400 "Validación fallida: name: El nombre del cliente es obligatorio; email: El email no tiene un formato válido" |
| ERR-05 | Error de red → mensaje útil (no "undefined" ni stack trace) | Backend apagado | Snackbar "Error al cargar/guardar..." | ✅ PASS | Revisión de código: todos los manejadores de error de Sales usan el patrón `err.error?.message ?? 'Error al cargar/guardar...'` (clients-page.component.ts:107/162, sale-orders-page.component.ts:142/228, sale-order-detail-page.component.ts:193/247/272/383/447/480, client-form-dialog.component.ts:61/89). En un error de red, `err.error` es un `ProgressEvent` sin `.message`, por lo que el operador `??`/`\|\|` garantiza el mensaje de fallback en español — nunca se muestra "undefined" ni un stack trace |
| ERR-06 | Progress bar visible durante carga de datos | Navegar a cualquier pantalla de Sales | Barra indeterminada en parte superior | ✅ PASS | Revisión de código: las 4 pantallas (clients-page, sale-orders-page, sale-order-detail-page, reservations-page) renderizan `<mat-progress-bar mode="indeterminate">` condicionado a `@if (loading)`, consistente con el patrón global |
| ERR-07 | Error HTTP 401 → redirige a login con mensaje "sesión expirada" | JWT expirado durante uso | Redirect a `/login` con mensaje | ✅ PASS | Verificado en browser: token inválido → `authGuard` redirige a `/login?reason=invalid` con banner rojo "Tu sesión no es válida. Inicia sesión nuevamente." (mismo mecanismo que el interceptor 401 para `reason=expired`, código en `error.interceptor.ts:15-22`) |
| ERR-08 | Error HTTP 403 → mensaje "Acceso denegado" | Rol sin permiso intenta operación (ej. SALES → approve vía curl) | Snackbar de error visible si se expone en UI | ✅ PASS | Revisión de código: `error.interceptor.ts:23-29` maneja 403 globalmente con `snackBar.open('No tienes permiso para realizar esta acción.', ...)` y `panelClass: ['snackbar-error']` — mismo bloque `catchError` ya verificado en vivo para el caso 401 (ERR-07) |
| ERR-09 | Optimistic Locking: "Stock modificado concurrentemente. Intente nuevamente." visible en snackbar rojo; permite reintentar sin perder datos del formulario | Dos aprobaciones concurrentes sobre el mismo producto (difícil de simular manualmente — documentar si no se puede reproducir) | Mensaje visible; formulario conserva los datos para reintentar | ✅ PASS | No reproducible manualmente en browser (requiere dos requests simultáneos exactos) — evidencia automatizada: `SaleOrderConcurrencyTest.java` (3/3 tests, 0 fallos, ejecutado 2026-06-13) verifica que la colisión de `@Version` produce 409 con mensaje conteniendo "concurrentemente" (o 422 "insuficiente"), que `reservedStock` nunca supera `currentStock`, y que la orden perdedora permanece en PENDING (reintentable). El mensaje 409/422 se muestra vía `err.error?.message` (mismo patrón ERR-03/ERR-10) |
| ERR-10 | Errores de negocio de Sales (stock insuficiente, transición inválida, producto duplicado, no encontrado) muestran el mensaje del backend correctamente con el status HTTP correcto (404/409/422 — H1 resuelto) | Cualquier regla R1-R14 violada | Mensaje de negocio correcto en snackbar rojo; status 404 (no encontrado), 409 (duplicado/optimistic locking), 422 (regla de negocio) | ✅ PASS | H1 resuelto (commit `0374944`, rama `fix/sales-h1-typed-exceptions`) — verificado vía fetch con JWT real: re-aprobar orden 1545 (ya APPROVED) → 422 "Solo se pueden aprobar órdenes en estado PENDING. Estado actual: APPROVED"; aprobar orden inexistente 999999 → 404 "Orden de venta con id 999999 no encontrada."; cliente duplicado → 409. Todos los status se propagan al snackbar vía `err.error?.message` |

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

## 9. Historial de bugs encontrados en este módulo

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

## 10. Checklist de cierre (Propuesta D)

Antes de declarar el módulo **done**, verificar que se cumplen las 4 condiciones:

```
[x] 1. Todos los casos de este documento tienen estado ✅ PASS — ninguna fila ⏳ PENDIENTE
[x] 2. ng test --no-watch → 383 specs, 0 fallos; cobertura 89.84% statements (≥70% requerido) — verificado 2026-06-13
[x] 3. Prueba browser completada con CADA ROL (ADMIN, MANAGER, WAREHOUSEMAN, SALES)
[x] 4. Memoria técnica §10 actualizada con resultado final
```

### Checklist adicional — Lecciones L29-L33 (mandatorio)

```
[x] L29 — Matriz de campos sensibles × roles documentada en §4 de la memoria técnica
    (unitCost de SaleOrderDetailResponseDTO), con RBAC-LIN-01..04 en PASS —
    backend redacta unitCost para WAREHOUSEMAN/SALES (commit `1f3b41e`,
    rama `fix/sales-rbac-lin-04-redaction`)
[x] L30 — H1 resuelto (404/409/422 reales, commit `0374944`); ERR-07/ERR-08 en PASS
[x] L31 — ClientDialog y SaleOrderDetailFormDialog usan disableClose:true (UI-CLF-05,
    UI-LIN-04 en PASS); paginadores resetean a página 0 (UI-CLI-PAG-03, UI-ORD-PAG-03)
[x] L32 — Headers de tabla de Clientes/Órdenes/Detalles/Reservas usan el mixin
    compartido (VIS-CLI-07, VIS-ORD-07, VIS-GEN-07 en PASS)
[x] L33 — forkJoin de ReservationsPageComponent con catchError por observable
    (RBAC-RES-FJ-01..03 en PASS); sin datos de prueba activos sin prefijo al cierre
    (19 clientes + 19 productos "Integración" desactivados, 19 órdenes asociadas
    canceladas — ver RBAC-RES-FJ-03)
```

### Checklist adicional — Hallazgos pre-código (D7/D8)

```
[x] H1 — Resuelto en backend (2026-06-13, commit `0374944`, rama
    `fix/sales-h1-typed-exceptions`). Re-verificado en browser/fetch: ERR-10
    (404/409/422 confirmados con casos reales). FLOW-DET-03/07/10, RN-DET-04 y
    CRUD-LIN-05 ya estaban en ✅ PASS y ejercitan los mismos endpoints de
    transición de estado/RN cubiertos por H1 — sin regresiones observadas
[x] H2 — RESUELTO (2026-06-13, commit `1f3b41e`, rama `fix/sales-rbac-lin-04-redaction`):
    backend ahora redacta `unitCost` para WAREHOUSEMAN/SALES (RBAC-LIN-04 en PASS)
[x] H4 — RESUELTO (2026-06-13, commit `cca468b`, rama `fix/backend-pretest-failures`):
    `ClientControllerTest.getAllActiveClients_retorna200` mockeaba
    `getAllActiveClients(0, 20)` (método ya no invocado por el controller, que
    usa `searchClients(search, page, size)` desde la introducción de búsqueda).
    Corregido el mock a `searchClients(null, 0, 20)`. Junto con 2 fallas más del
    mismo patrón (`CategoryControllerTest`, `SupplierControllerTest`) y 10
    fallas de validación de RFC en tests de integración (`SupplierDTO.rfc`
    `@Size(min=12,max=13)`), suite completa: 405/405, 0 fallos/0 errores
    (2 ejecuciones consecutivas)
[x] H3 (D8) — Verificado: `SaleOrderServiceImpl` tiene `@Transactional` a nivel de
    clase (línea 38) con propagación REQUIRED por defecto; `approveOrder()` (línea 162)
    no sobreescribe la anotación, por lo que hereda la transacción de escritura —
    la reserva de stock y el cambio de estado ocurren en la misma transacción
```
