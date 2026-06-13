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

| Categoría | Total casos | PASS | FAIL | PENDIENTE |
|---|---|---|---|---|
| SEC — Seguridad de rutas | 10 | 0 | 0 | 10 |
| RBAC — Control de acceso UI | 31 | 0 | 0 | 31 |
| CRUD — Flujos de datos | 15 | 0 | 0 | 15 |
| VAL — Validaciones de formulario | 17 | 0 | 0 | 17 |
| BSRCH — Búsqueda e inputs | 6 | 0 | 0 | 6 |
| UI — Botones e íconos | 42 | 0 | 0 | 42 |
| FLOW — Flujos de estado/negocio | 12 | 0 | 0 | 12 |
| RN — Reglas de negocio | 6 | 0 | 0 | 6 |
| ERR — Mensajes de error | 10 | 0 | 0 | 10 |
| EMPTY — Estados vacíos | 6 | 0 | 0 | 6 |
| VIS — Visual y estética | 35 | 0 | 0 | 35 |
| **TOTAL** | **190** | **0** | **0** | **190** |

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
| SEC-01 | Acceso directo `/sales/orders/new` | WAREHOUSEMAN | Sesión activa | Redirige a home; mensaje "Acceso denegado" (D1, gate Propuesta C) | ⏳ PENDIENTE | |
| SEC-02 | Sin sesión activa — acceso a `/sales/clients` | (sin JWT) | Token expirado / sin login | Redirige a `/login` | ⏳ PENDIENTE | |
| SEC-03 | Acceso directo `/sales/clients`, `/sales/orders`, `/sales/orders/new`, `/sales/reservations` | ADMIN | Sesión activa | Todas las rutas accesibles | ⏳ PENDIENTE | |
| SEC-04 | Acceso directo `/sales/clients`, `/sales/orders`, `/sales/reservations` | WAREHOUSEMAN | Sesión activa | Las 3 rutas accesibles (solo lectura) | ⏳ PENDIENTE | |
| SEC-05 | Acceso directo `/sales/orders/new` | SALES | Sesión activa | Ruta accesible (SALES puede crear órdenes) | ⏳ PENDIENTE | |
| SEC-06 | `PATCH /api/v1/sales/orders/{id}/approve` (curl) | WAREHOUSEMAN | Orden PENDING existente, JWT WAREHOUSEMAN | 403 Forbidden | ⏳ PENDIENTE | |
| SEC-07 | `PATCH /api/v1/sales/orders/{id}/approve` (curl) | SALES | Orden PENDING existente, JWT SALES | 403 Forbidden | ⏳ PENDIENTE | |
| SEC-08 | `PATCH /api/v1/sales/orders/{id}/deliver` (curl) | SALES | Orden APPROVED existente, JWT SALES | 403 Forbidden | ⏳ PENDIENTE | |
| SEC-09 | `PATCH /api/v1/sales/orders/{id}/cancel` (curl) | WAREHOUSEMAN | Orden PENDING/APPROVED existente, JWT WAREHOUSEMAN | 403 Forbidden | ⏳ PENDIENTE | |
| SEC-10 | `DELETE /api/v1/sales/clients/{id}` (curl) | SALES | Cliente activo existente, JWT SALES | 403 Forbidden | ⏳ PENDIENTE | |

---

## 1. Lista de clientes (`ClientsPageComponent`)

### 1a. Visual y estructura (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-CLI-01 | Título de la página visible | ADMIN | "Clientes" | ⏳ PENDIENTE | |
| VIS-CLI-02 | Columnas de la tabla: Nombre, RFC, Contacto, Teléfono, Email, Acciones | ADMIN | Todas las columnas visibles | ⏳ PENDIENTE | |
| VIS-CLI-03 | Barra de búsqueda visible en la parte superior | ADMIN | Campo "Buscar" con ícono lupa | ⏳ PENDIENTE | |
| VIS-CLI-04 | Botón "Nuevo cliente" visible | ADMIN | Botón con ícono `add` visible | ⏳ PENDIENTE | |
| VIS-CLI-05 | Cursor `pointer` en filas; hover cambia el fondo; fila seleccionada `#F2E4F2` | ADMIN | Comportamiento correcto | ⏳ PENDIENTE | |
| VIS-CLI-06 | Texto largo en Nombre/Email se trunca con `…` y tooltip | ADMIN | text-overflow:ellipsis + tooltip | ⏳ PENDIENTE | |
| VIS-CLI-07 | Header de tabla con fondo `#F2E4F2` y texto `#6B3C6B` vía mixin SCSS compartido (L32) | ADMIN | Colores correctos; `.scss` usa `@include`/`@extend`, no copia manual | ⏳ PENDIENTE | |
| VIS-CLI-08 | `mat-progress-bar` visible durante carga (no spinner centrado) | ADMIN | Barra indeterminada en parte superior | ⏳ PENDIENTE | |

### 1b. Búsqueda (BSRCH)

> `GET /sales/clients/active?search=` — accent/case insensitive vía `f_unaccent`.

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| BSRCH-CLI-01 | Buscar por nombre exacto | ADMIN | Cliente "Distribuidora del Norte" existe | Filtra correctamente | ⏳ PENDIENTE | |
| BSRCH-CLI-02 | Buscar en minúsculas (case insensitive) | ADMIN | Registro con mayúsculas | Encuentra el registro | ⏳ PENDIENTE | |
| BSRCH-CLI-03 | Buscar sin acento (accent insensitive), ej. "Almacén" → "almacen" | ADMIN | Registro con acento | Encuentra el registro | ⏳ PENDIENTE | Verificar f_unaccent() |
| BSRCH-CLI-04 | Buscar término sin resultados | ADMIN | Término no existe | Estado vacío: ícono + mensaje contextual | ⏳ PENDIENTE | |
| BSRCH-CLI-05 | Limpiar campo de búsqueda | ADMIN | Campo con término activo | Lista restaurada; todos los clientes activos visibles | ⏳ PENDIENTE | |
| BSRCH-CLI-06 | Botón X de limpieza visible SOLO cuando hay texto | ADMIN | Campo vacío vs con texto | Sin texto → sin X; con texto → X visible | ⏳ PENDIENTE | |

### 1c. RBAC en lista (RBAC)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-CLI-01 | Botón "Nuevo cliente" visible | ADMIN / MANAGER / SALES | Visible | ⏳ PENDIENTE | |
| RBAC-CLI-02 | Botón "Nuevo cliente" NO visible | WAREHOUSEMAN | Ausente del DOM (no solo oculto) | ⏳ PENDIENTE | |
| RBAC-CLI-03 | Ícono "Editar" visible en fila | ADMIN / MANAGER / SALES | Visible | ⏳ PENDIENTE | |
| RBAC-CLI-04 | Ícono "Editar" NO visible en fila (solo Ver) | WAREHOUSEMAN | Ausente del DOM | ⏳ PENDIENTE | |
| RBAC-CLI-05 | Ícono "Desactivar" visible en fila | ADMIN / MANAGER | Visible | ⏳ PENDIENTE | |
| RBAC-CLI-06 | Ícono "Desactivar" NO visible en fila | SALES | Ausente del DOM (SecurityConfig: DELETE /clients excluye SALES) | ⏳ PENDIENTE | |
| RBAC-CLI-07 | Ícono "Desactivar" NO visible en fila | WAREHOUSEMAN | Ausente del DOM | ⏳ PENDIENTE | |

### 1d. Botones e íconos de acción (UI)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-CLI-01 | Click en fila selecciona el cliente en el panel/diálogo de detalle | ADMIN | Lista cargada | Detalle del cliente mostrado | ⏳ PENDIENTE | |
| UI-CLI-02 | Ícono Editar — clic abre `ClientDialog` con datos precargados | ADMIN | Cliente seleccionado | Diálogo abre SIN navegar fuera | ⏳ PENDIENTE | (L27) verificar `$event.stopPropagation()` |
| UI-CLI-03 | Ícono Desactivar — clic abre `ConfirmDialog` | ADMIN | Cliente activo | Diálogo de confirmación abre | ⏳ PENDIENTE | (L27) verificar `$event.stopPropagation()` |
| UI-CLI-04 | Confirmar Desactivar → cliente desaparece de la lista de activos | ADMIN | Diálogo abierto | Snackbar verde; lista actualizada sin recargar | ⏳ PENDIENTE | |

### 1e. Estados vacíos (EMPTY)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| EMPTY-CLI-01 | Lista sin clientes activos | Ícono + "Sin clientes registrados" | ⏳ PENDIENTE | |
| EMPTY-CLI-02 | Búsqueda sin resultados | Ícono + 'Sin resultados para "..."' | ⏳ PENDIENTE | |

### 1f. Paginación (UI)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| UI-CLI-PAG-01 | Paginador visible cuando hay > pageSize clientes | > 20 clientes en BD | Paginador con total, opciones 10/20/50 | ⏳ PENDIENTE | |
| UI-CLI-PAG-02 | Cambio de página carga la página correcta | Paginador visible | Filas cambian al ir a página 2 | ⏳ PENDIENTE | |
| UI-CLI-PAG-03 | Cambiar búsqueda estando en página > 0 resetea a página 0 (L31) | En página 2+, buscar | Paginador regresa a página 0 | ⏳ PENDIENTE | |

---

## 2. Formulario de cliente (`ClientDialogComponent` / `ClientFormComponent`) — D5

### 2a. Apertura y visual (UI)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-CLF-01 | Botón "Nuevo cliente" abre `ClientDialog` vacío | ADMIN / MANAGER / SALES | — | Todos los campos vacíos; sin datos precargados | ⏳ PENDIENTE | |
| UI-CLF-02 | Ícono Editar abre `ClientDialog` con datos del cliente | ADMIN / MANAGER / SALES | Cliente existente | Campos precargados correctamente | ⏳ PENDIENTE | |
| UI-CLF-03 | Botón Cancelar cierra sin guardar | ADMIN | Formulario con cambios | Cierra; lista no cambia | ⏳ PENDIENTE | |
| UI-CLF-04 | Campos muestran label visible (no solo placeholder) | ADMIN | Diálogo abierto | Labels siempre visibles | ⏳ PENDIENTE | |
| UI-CLF-05 | Click en backdrop/ESC con cambios sin guardar (L31, `disableClose: true`) | ADMIN | Diálogo abierto, con cambios | Diálogo permanece abierto; cambios no se pierden | ⏳ PENDIENTE | |
| VIS-CLF-01 | Campos obligatorios tienen un solo `*` (Validators.required) | ADMIN | Diálogo abierto | Solo un `*` por campo obligatorio (Nombre) | ⏳ PENDIENTE | |

### 2b. RBAC en formulario (RBAC)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-CLF-01 | Título "Nuevo cliente" / "Editar cliente" | ADMIN / MANAGER / SALES | Título correcto según modo | ⏳ PENDIENTE | |
| RBAC-CLF-02 | Formulario editable — todos los campos habilitados, botón Guardar visible | ADMIN / MANAGER / SALES | Campos editables | ⏳ PENDIENTE | |
| RBAC-CLF-03 | Diálogo en modo solo lectura — campos `disabled`, sin botón Guardar | WAREHOUSEMAN | Click en fila abre vista de solo lectura (si aplica) o ícono Ver | ⏳ PENDIENTE | |
| RBAC-CLF-04 | Botón "Desactivar" visible en el diálogo | ADMIN / MANAGER | Visible; ausente para SALES | ⏳ PENDIENTE | |

### 2c. Validaciones (VAL)

> Botón Guardar requiere `form.dirty` en edición (L25 — BUG-M3-20).

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-CLF-01 | Nombre vacío al intentar guardar | Campo vacío | Error inline "Campo requerido"; botón deshabilitado | ⏳ PENDIENTE | |
| VAL-CLF-02 | Nombre > 150 caracteres | Valor de 151 chars | Campo no acepta más o error visible (maxlength 150) | ⏳ PENDIENTE | |
| VAL-CLF-03 | RFC > 13 caracteres | Valor de 14 chars | Error "Máximo 13 caracteres" | ⏳ PENDIENTE | |
| VAL-CLF-04 | Teléfono > 20 caracteres | Valor de 21 chars | Error "Máximo 20 caracteres" | ⏳ PENDIENTE | |
| VAL-CLF-05 | Nombre de contacto > 100 caracteres | Valor de 101 chars | Error "Máximo 100 caracteres" | ⏳ PENDIENTE | |
| VAL-CLF-06 | Email con formato inválido | "no-es-email" | Error "Formato de email inválido" | ⏳ PENDIENTE | |
| VAL-CLF-07 | Botón Guardar deshabilitado con formulario inválido | Nombre vacío | `disabled:true` en el DOM | ⏳ PENDIENTE | |
| VAL-CLF-08 | Botón Guardar deshabilitado al cargar en modo edición (sin cambios) | Diálogo recién abierto en modo editar | `disabled:true` — `form.dirty = false` | ⏳ PENDIENTE | |
| VAL-CLF-09 | Botón Guardar se activa al modificar un campo y se desactiva tras guardar | Modificar Nombre → Guardar | `disabled:false` tras editar; `disabled:true` tras guardar (`markAsPristine`) | ⏳ PENDIENTE | |

### 2d. CRUD — Crear / Editar / Desactivar (CRUD)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-CLF-01 | Crear cliente con todos los datos válidos | Formulario completo | Snackbar verde "Cliente creado correctamente."; diálogo cierra | ⏳ PENDIENTE | |
| CRUD-CLF-02 | Lista refleja el nuevo cliente inmediatamente | Crear exitoso | Nuevo cliente visible sin recargar | ⏳ PENDIENTE | |
| CRUD-CLF-03 | Crear cliente solo con Nombre (campos opcionales vacíos) | rfc/contactName/phone/email/address vacíos | Creación exitosa (todos opcionales excepto name) | ⏳ PENDIENTE | |
| CRUD-CLF-04 | Editar Nombre de un cliente existente | Cliente activo | Snackbar verde "Cliente actualizado correctamente." | ⏳ PENDIENTE | |
| CRUD-CLF-05 | Lista refleja los cambios después de editar | Editar exitoso | Datos actualizados visibles sin recargar | ⏳ PENDIENTE | |
| CRUD-CLF-06 | Click en Desactivar abre `ConfirmDialog` | Cliente activo | Modal con texto de confirmación y botones Confirmar/Cancelar | ⏳ PENDIENTE | |
| CRUD-CLF-07 | Cancelar en `ConfirmDialog` — cliente no cambia | Diálogo abierto | Cliente permanece activo | ⏳ PENDIENTE | |
| CRUD-CLF-08 | Confirmar desactivación de cliente sin órdenes activas | Cliente sin órdenes PENDING/APPROVED | Snackbar verde; cliente desaparece de `/clients/active` | ⏳ PENDIENTE | |
| CRUD-CLF-09 | Intentar desactivar cliente con órdenes PENDING/APPROVED (si el backend lo restringe) | Cliente con orden PENDING/APPROVED | Snackbar rojo con mensaje del backend (verificar regla real en `ClientServiceImpl` durante FASE 2) | ⏳ PENDIENTE | Confirmar si la regla existe; si no existe, marcar N/A y documentar |

---

## 3. Lista de órdenes de venta (`SaleOrdersPageComponent`)

### 3a. Visual y tabs (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-ORD-01 | Título de la página visible | ADMIN | "Órdenes de venta" | ⏳ PENDIENTE | |
| VIS-ORD-02 | Tabs: Pendientes / Aprobadas / Entregadas / Canceladas, con conteo por tab | ADMIN | 4 tabs visibles con badge numérico (L23/L24) | ⏳ PENDIENTE | |
| VIS-ORD-03 | Columnas: N° Orden, Cliente, Total, Creado por, Fecha, Estado, Acciones | ADMIN | Todas las columnas visibles | ⏳ PENDIENTE | |
| VIS-ORD-04 | Badge de estado con color semántico (PENDING=naranja, APPROVED=azul, DELIVERED=verde, CANCELLED=rojo) | ADMIN | Colores correctos por tab | ⏳ PENDIENTE | |
| VIS-ORD-05 | Botón "Nueva orden" visible | ADMIN | Botón con ícono `add` | ⏳ PENDIENTE | |
| VIS-ORD-06 | Cursor `pointer` en filas; hover cambia el fondo | ADMIN | Comportamiento correcto | ⏳ PENDIENTE | |
| VIS-ORD-07 | Header de tabla con mixin SCSS compartido (L32) | ADMIN | `#F2E4F2`/`#6B3C6B`, sin copia manual | ⏳ PENDIENTE | |
| VIS-ORD-08 | `mat-progress-bar` visible durante carga de cada tab | ADMIN | Barra indeterminada | ⏳ PENDIENTE | |

### 3b. RBAC — acciones por estado y rol (RBAC)

> Matriz §6.1 de la propuesta. D6: `totalAmount` visible para los 4 roles.

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-ORD-01 | Tab PENDING: acciones Ver/Editar/Aprobar/Cancelar visibles | ADMIN / MANAGER | Las 4 acciones presentes | ⏳ PENDIENTE | |
| RBAC-ORD-02 | Tab PENDING: acciones Ver/Editar/Cancelar visibles, Aprobar AUSENTE | SALES | Aprobar no está en el DOM | ⏳ PENDIENTE | |
| RBAC-ORD-03 | Tab PENDING: solo acción Ver | WAREHOUSEMAN | Editar/Aprobar/Cancelar ausentes | ⏳ PENDIENTE | |
| RBAC-ORD-04 | Tab APPROVED: acciones Ver/Entregar/Cancelar visibles | ADMIN / MANAGER | Las 3 acciones presentes | ⏳ PENDIENTE | |
| RBAC-ORD-05 | Tab APPROVED: acciones Ver/Cancelar visibles, Entregar AUSENTE | SALES | Entregar no está en el DOM | ⏳ PENDIENTE | |
| RBAC-ORD-06 | Tab APPROVED: acciones Ver/Entregar visibles (único rol de escritura) | WAREHOUSEMAN | Entregar presente, Cancelar ausente | ⏳ PENDIENTE | |
| RBAC-ORD-07 | Tab DELIVERED: solo acción Ver | ADMIN / MANAGER / WAREHOUSEMAN / SALES | Ninguna acción de transición | ⏳ PENDIENTE | |
| RBAC-ORD-08 | Tab CANCELLED: solo acción Ver | ADMIN / MANAGER / WAREHOUSEMAN / SALES | Ninguna acción de transición | ⏳ PENDIENTE | |
| RBAC-ORD-09 | Botón "Nueva orden" visible | ADMIN / MANAGER / SALES | Visible | ⏳ PENDIENTE | |
| RBAC-ORD-10 | Botón "Nueva orden" NO visible | WAREHOUSEMAN | Ausente del DOM | ⏳ PENDIENTE | |
| RBAC-ORD-11 | Columna "Total" (`totalAmount`) visible en las 4 tabs (D6) | WAREHOUSEMAN | Columna visible con valor real | ⏳ PENDIENTE | |

### 3c. Botones e íconos de acción (UI)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-ORD-01 | Click en fila navega a `/sales/orders/:id?from=<tab>` | ADMIN | Lista cargada | Navegación correcta con queryParam `from` | ⏳ PENDIENTE | |
| UI-ORD-02 | Ícono Aprobar (tab PENDING) — clic abre `ConfirmDialog` | ADMIN / MANAGER | Orden PENDING con detalles | Diálogo abre SIN navegar (L27 `stopPropagation`) | ⏳ PENDIENTE | |
| UI-ORD-03 | Confirmar Aprobar → estado cambia a APPROVED en la lista | ADMIN | Diálogo abierto, stock suficiente | Snackbar verde; fila pasa al tab Aprobadas | ⏳ PENDIENTE | |
| UI-ORD-04 | Ícono Entregar (tab APPROVED) — clic abre `ConfirmDialog` | ADMIN / MANAGER / WAREHOUSEMAN | Orden APPROVED | Diálogo abre SIN navegar (L27) | ⏳ PENDIENTE | |
| UI-ORD-05 | Ícono Cancelar — clic abre `ConfirmDialog` | ADMIN / MANAGER / SALES | Orden PENDING o APPROVED | Diálogo abre SIN navegar (L27) | ⏳ PENDIENTE | |
| UI-ORD-06 | Cambiar de tab carga la página correspondiente y actualiza el contador activo | ADMIN | Tabs con conteos cargados | Datos y conteo correctos por tab | ⏳ PENDIENTE | |

### 3d. Estados vacíos (EMPTY)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| EMPTY-ORD-01 | Tab sin órdenes (ej. Canceladas vacío) | Ícono + "Sin órdenes en este estado" | ⏳ PENDIENTE | |
| EMPTY-ORD-02 | Módulo recién creado, sin ninguna orden | Ícono + "Sin órdenes de venta registradas" en cada tab | ⏳ PENDIENTE | |

### 3e. Paginación (UI)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| UI-ORD-PAG-01 | Paginador visible por tab cuando hay > pageSize órdenes | > 20 órdenes en un estado | Paginador con total, opciones 10/20/50 | ⏳ PENDIENTE | |
| UI-ORD-PAG-02 | Cambio de página carga la página correcta | Paginador visible | Filas cambian al ir a página 2 | ⏳ PENDIENTE | |
| UI-ORD-PAG-03 | Cambiar de tab estando en página > 0 resetea a página 0 (L31) | En página 2+ de un tab, cambiar a otro tab | Nuevo tab inicia en página 0 | ⏳ PENDIENTE | |

### 3f. Flujo de tabs y conteos (FLOW)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-ORD-01 | Al cargar la pantalla, tab activo por defecto = Pendientes (D2) | ADMIN | Tab Pendientes seleccionado | ⏳ PENDIENTE | |
| FLOW-ORD-02 | Conteos de los 4 tabs se cargan al inicio (`counts: Map` separado de `pages: Map`, L23/L24) | ADMIN | Badges numéricos correctos en los 4 tabs sin necesidad de visitarlos | ⏳ PENDIENTE | |

---

## 4. Detalle de orden de venta (`SaleOrderDetailPageComponent`) — D1, D4

### 4a. Visual (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-DET-01 | Título muestra `orderNumber` (o "Nueva orden" en `/sales/orders/new`) | ADMIN | "OV-2026-XXXX" o "Nueva orden" | ⏳ PENDIENTE | |
| VIS-DET-02 | Badge de estado con color semántico correcto | ADMIN | PENDING naranja `#FFF3E0`/`#E65100`, APPROVED azul, DELIVERED verde, CANCELLED rojo | ⏳ PENDIENTE | |
| VIS-DET-03 | Botón ← regresa a `/sales/orders` con el tab de origen (`?from=`) | ADMIN | Viene de tab "Aprobadas" | Regresa con tab "Aprobadas" activo | ⏳ PENDIENTE | |
| VIS-DET-04 | Historial de estado: tabla de 3 filas (Aprobada/Entregada/Cancelada) con usuario+fecha o "—" (D4) | ADMIN | Orden DELIVERED: fila "Aprobada" y "Entregada" con datos, "Cancelada" con "—" | ⏳ PENDIENTE | |
| VIS-DET-05 | `totalAmount` visible en cabecera para los 4 roles (D6) | WAREHOUSEMAN | Total visible con valor real | ⏳ PENDIENTE | |
| VIS-DET-06 | `mat-progress-bar` visible durante carga | ADMIN | Barra indeterminada | ⏳ PENDIENTE | |

### 4b. Botones de acción según estado y rol (UI)

> Matriz §6.1. Para cada botón: verificar presencia/ausencia exacta — "ausente del DOM",
> no solo `hidden`/`display:none`.

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-DET-01 | Campos Cliente/Notas editables | ADMIN / MANAGER / SALES | Orden PENDING | Inputs habilitados | ⏳ PENDIENTE | |
| UI-DET-02 | Campos Cliente/Notas de solo lectura | WAREHOUSEMAN | Orden PENDING | Inputs `disabled` | ⏳ PENDIENTE | |
| UI-DET-03 | Botón "Guardar cambios" requiere `form.dirty` (L25) | ADMIN / MANAGER / SALES | Orden PENDING, sin cambios | `disabled:true` al cargar; se activa al modificar; se desactiva tras guardar | ⏳ PENDIENTE | |
| UI-DET-04 | Botón "Aprobar" visible | ADMIN / MANAGER | Orden PENDING con ≥1 detalle | Visible y clickeable | ⏳ PENDIENTE | |
| UI-DET-05 | Botón "Aprobar" NO visible | SALES | Orden PENDING | Ausente del DOM | ⏳ PENDIENTE | |
| UI-DET-06 | Botón "Cancelar" visible | ADMIN / MANAGER / SALES | Orden PENDING | Visible y clickeable | ⏳ PENDIENTE | |
| UI-DET-07 | Ningún botón de transición visible | WAREHOUSEMAN | Orden PENDING | Aprobar/Cancelar/Guardar ausentes | ⏳ PENDIENTE | |
| UI-DET-08 | Botones "Entregar" y "Cancelar" visibles | ADMIN / MANAGER | Orden APPROVED | Ambos presentes | ⏳ PENDIENTE | |
| UI-DET-09 | Solo botón "Entregar" visible | WAREHOUSEMAN | Orden APPROVED | Entregar presente, Cancelar ausente | ⏳ PENDIENTE | |
| UI-DET-10 | Solo botón "Cancelar" visible, "Entregar" AUSENTE | SALES | Orden APPROVED | Cancelar presente, Entregar ausente | ⏳ PENDIENTE | |
| UI-DET-11 | Ningún botón de transición | ADMIN / MANAGER / WAREHOUSEMAN / SALES | Orden DELIVERED | Sin botones de transición (terminal) | ⏳ PENDIENTE | |
| UI-DET-12 | Ningún botón de transición | ADMIN / MANAGER / WAREHOUSEMAN / SALES | Orden CANCELLED | Sin botones de transición (terminal) | ⏳ PENDIENTE | |
| UI-DET-13 | Botón "Agregar detalle" e íconos Editar/Eliminar por línea visibles | ADMIN / MANAGER / SALES | Orden PENDING | Visibles y funcionales | ⏳ PENDIENTE | |
| UI-DET-14 | Tabla de detalles de solo lectura, sin íconos de acción | WAREHOUSEMAN (cualquier estado) / cualquier rol en APPROVED+ | Orden no editable | "Agregar/Editar/Eliminar" ausentes (R1) | ⏳ PENDIENTE | |

### 4c. Flujos de estado (FLOW) — R4, R5, R7, R8, R9, R10

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| FLOW-DET-01 | Aprobar: `ConfirmDialog` muestra preview de `availableStock` vs `quantity` por línea (R4) | ADMIN / MANAGER | Orden PENDING con detalles | Tabla de preview visible antes de confirmar | ⏳ PENDIENTE | |
| FLOW-DET-02 | Confirmar Aprobar con stock suficiente en todas las líneas | ADMIN | Preview OK en todas las líneas | PENDING→APPROVED; `reservedStock` incrementado por línea (R5); snackbar verde | ⏳ PENDIENTE | Verificar `reservedStock` en Inventory tras la acción |
| FLOW-DET-03 | Confirmar Aprobar con stock insuficiente en alguna línea | ADMIN | Una línea con `quantity > availableStock` | Snackbar rojo "Stock disponible insuficiente para 'X'. Disponible: N, solicitado: M."; estado NO cambia, NINGUNA línea se reserva (R4 todo-o-nada) | ⏳ PENDIENTE | (H1) status real puede ser 500 — documentar |
| FLOW-DET-04 | Cancelar en `ConfirmDialog` de Aprobar | ADMIN | Diálogo abierto | Estado permanece PENDING; sin cambios en stock | ⏳ PENDIENTE | |
| FLOW-DET-05 | Entregar: `ConfirmDialog` muestra preview de `currentStock` vs `quantity` por línea (R7) | ADMIN / MANAGER / WAREHOUSEMAN | Orden APPROVED | Tabla de preview visible antes de confirmar | ⏳ PENDIENTE | |
| FLOW-DET-06 | Confirmar Entregar con stock físico suficiente | WAREHOUSEMAN | Preview OK en todas las líneas | APPROVED→DELIVERED; `reservedStock -= quantity` y `currentStock -= quantity` por línea (R8); snackbar verde | ⏳ PENDIENTE | Verificar movimiento OUT "Entrega orden de venta {orderNumber}" en Inventory/Kardex |
| FLOW-DET-07 | Confirmar Entregar con stock físico insuficiente | ADMIN | Una línea con `quantity > currentStock` | Snackbar rojo "Stock físico insuficiente para 'X'."; estado NO cambia | ⏳ PENDIENTE | (H1) status real puede ser 500 — documentar |
| FLOW-DET-08 | Cancelar orden desde PENDING | SALES | Orden PENDING (propia) | PENDING→CANCELLED; sin impacto en stock; snackbar verde | ⏳ PENDIENTE | |
| FLOW-DET-09 | Cancelar orden desde APPROVED | ADMIN | Orden APPROVED | APPROVED→CANCELLED; `reservedStock -= quantity` por línea liberado (R10); mensaje de `ConfirmDialog` distinto, advirtiendo liberación de reserva; snackbar verde | ⏳ PENDIENTE | Verificar `reservedStock` decrementado en Inventory |
| FLOW-DET-10 | Intentar cancelar orden DELIVERED (verificación de backend, botón ya oculto en UI) | ADMIN | Orden DELIVERED, vía curl `PATCH .../cancel` | Backend rechaza: "No se puede cancelar una orden ya entregada." | ⏳ PENDIENTE | (H1) status real puede ser 500 — documentar |

### 4d. Reglas de negocio (RN)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RN-DET-01 | Campos `orderNumber`, `totalAmount`, `subtotal`, `status`, timestamps de auditoría son de solo lectura (L14) | Formulario de orden (cualquier estado) | Sin inputs editables para estos campos | ⏳ PENDIENTE | |
| RN-DET-02 | `unitCost` no se muestra en el formulario para ningún rol (R14) | Diálogo de detalle de línea | Campo ausente del formulario | ⏳ PENDIENTE | |
| RN-DET-03 | En APPROVED, agregar/editar/eliminar detalle deshabilitado (R1) | Orden APPROVED | Botones ausentes; único camino es Cancelar | ⏳ PENDIENTE | |
| RN-DET-04 | `addDetail` bloquea producto duplicado en la misma orden (R11) | Producto ya existe en la orden | Snackbar rojo con mensaje del backend ("...ya existe en esta orden...") | ⏳ PENDIENTE | (H1) status real puede ser 500 — documentar |
| RN-DET-05 | Selector de producto solo muestra productos activos (R12) | Catálogo con productos inactivos | Productos inactivos ausentes del autocomplete | ⏳ PENDIENTE | |
| RN-DET-06 | `unitPrice` editable y pre-rellenado con `Product.price`, puede diferir del precio de catálogo (R13) | Agregar detalle | Valor pre-rellenado editable; se guarda el valor modificado | ⏳ PENDIENTE | |

---

## 5. Diálogo Agregar/Editar detalle (`SaleOrderDetailFormComponent`) — D3

### 5a. Apertura y visual (UI)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-LIN-01 | Botón "Agregar detalle" abre diálogo vacío (`disableClose: true`, L31) | ADMIN / MANAGER / SALES | Orden PENDING | Campos vacíos | ⏳ PENDIENTE | |
| UI-LIN-02 | Ícono Editar en fila abre diálogo con datos precargados | ADMIN / MANAGER / SALES | Línea existente | `productId`/`quantity`/`unitPrice` precargados | ⏳ PENDIENTE | |
| UI-LIN-03 | Botón Cancelar cierra sin guardar | ADMIN | Diálogo con cambios | Cierra; tabla de detalles no cambia | ⏳ PENDIENTE | |
| UI-LIN-04 | Click en backdrop/ESC con cambios sin guardar (L31) | ADMIN | Diálogo abierto con cambios | Diálogo permanece abierto | ⏳ PENDIENTE | |
| UI-LIN-05 | Autocomplete de producto muestra "[SKU] — Nombre (disponible: N)" usando `availableStock` (D3) | ADMIN | Catálogo con productos activos | Formato correcto en cada opción | ⏳ PENDIENTE | |
| UI-LIN-06 | Productos ya presentes en la orden aparecen deshabilitados en el autocomplete (R11) | ADMIN | Orden con ≥1 detalle | Opciones correspondientes `disabled` | ⏳ PENDIENTE | |

### 5b. Validaciones (VAL)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-LIN-01 | `productId` vacío al guardar | Sin producto seleccionado | Error inline; botón Guardar deshabilitado | ⏳ PENDIENTE | |
| VAL-LIN-02 | `quantity` vacío o 0 | Cantidad = 0 | Error "Mínimo 1" | ⏳ PENDIENTE | |
| VAL-LIN-03 | `quantity` negativo | Cantidad = -1 | Error de validación visible | ⏳ PENDIENTE | |
| VAL-LIN-04 | `unitPrice` vacío | Sin valor | Error inline; botón deshabilitado | ⏳ PENDIENTE | |
| VAL-LIN-05 | `unitPrice` = 0 | Precio = 0 | Error "Debe ser mayor a 0.01" (min 0.01) | ⏳ PENDIENTE | |
| VAL-LIN-06 | `unitPrice` negativo | Precio = -1 | Error de validación visible | ⏳ PENDIENTE | |
| VAL-LIN-07 | `quantity` > `availableStock` | Cantidad solicitada mayor al disponible | Advertencia visual (no bloquea el guardado del detalle — el bloqueo real es al Aprobar, R4) | ⏳ PENDIENTE | |
| VAL-LIN-08 | `subtotal` se recalcula en tiempo real (`quantity × unitPrice`) | Cambiar cantidad o precio | Subtotal actualizado sin guardar | ⏳ PENDIENTE | |

### 5c. CRUD de detalles (CRUD)

> Proteger eliminación de la última línea (L26 — BUG-M3-21).

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-LIN-01 | Agregar detalle válido | Producto activo, cantidad y precio válidos | Snackbar verde; tabla refleja nueva línea; `totalAmount` recalculado | ⏳ PENDIENTE | |
| CRUD-LIN-02 | Editar `quantity`/`unitPrice` de una línea existente | Línea existente | Snackbar verde; subtotal y `totalAmount` recalculados | ⏳ PENDIENTE | |
| CRUD-LIN-03 | Eliminar línea (no es la última) | Orden con ≥2 líneas | `ConfirmDialog` → confirmar → línea desaparece; `totalAmount` recalculado | ⏳ PENDIENTE | |
| CRUD-LIN-04 | Intentar eliminar la última línea de la orden (L26) | Orden con 1 sola línea | Bloqueado con mensaje claro; sin llamada al API | ⏳ PENDIENTE | |
| CRUD-LIN-05 | Agregar producto duplicado en la misma orden | Producto ya existe en la orden | Snackbar rojo con mensaje del backend (R11) | ⏳ PENDIENTE | (H1) status real puede ser 500 |
| CRUD-LIN-06 | `unitCost` se re-lee de `Product.unitCost` en cada `addDetail`/`updateDetail` mientras PENDING (R14) | Cambiar `Product.unitCost` en Inventory, luego editar la línea | Valor interno actualizado (verificar vía respuesta del backend con rol ADMIN, no en UI) | ⏳ PENDIENTE | Verificación de backend, no de UI |

### 5d. RBAC — campos sensibles (RBAC) — L29/H2

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-LIN-01 | Columna "Costo unitario"/Margen visible en la tabla de detalles | ADMIN / MANAGER | Columna visible con valor real | ⏳ PENDIENTE | |
| RBAC-LIN-02 | Columna "Costo unitario"/Margen AUSENTE del DOM (no solo CSS) | WAREHOUSEMAN | Columna no renderizada — excluida de `displayedColumns` | ⏳ PENDIENTE | |
| RBAC-LIN-03 | Columna "Costo unitario"/Margen AUSENTE del DOM (no solo CSS) | SALES | Columna no renderizada — excluida de `displayedColumns` | ⏳ PENDIENTE | |
| RBAC-LIN-04 | Verificar en Network (Dev Tools) si `unitCost` llega poblado en el JSON para WAREHOUSEMAN/SALES (H2) | WAREHOUSEMAN / SALES | Si el backend YA redacta: `unitCost: null`. Si no: documentar como H2 pendiente — NO bloquea (la UI ya lo oculta independientemente) | ⏳ PENDIENTE | Resultado informativo, no bloqueante (D7) |

---

## 6. Reservas de stock (`ReservationsPageComponent`)

### 6a. Visual (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-RES-01 | Título "Reservas de stock" | ADMIN | Visible | ⏳ PENDIENTE | |
| VIS-RES-02 | 4 tarjetas de resumen: productos con reservas, unidades reservadas, valor reservado, órdenes APPROVED (`ReservationSummaryDTO`) | ADMIN | Las 4 tarjetas con valores correctos | ⏳ PENDIENTE | |
| VIS-RES-03 | Tabla "Por producto" expandible (`GET /reservations/products`) | ADMIN | Fila expandible muestra `ReservedProductOrderDTO` | ⏳ PENDIENTE | |
| VIS-RES-04 | Tabla "Por cliente" expandible (`GET /reservations/clients`) | ADMIN | Fila expandible muestra `ReservedClientOrderDTO` | ⏳ PENDIENTE | |
| VIS-RES-05 | `mat-progress-bar` visible durante carga | ADMIN | Barra indeterminada | ⏳ PENDIENTE | |

### 6b. RBAC y navegación (RBAC)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-RES-01 | Dashboard completo visible, incluyendo `totalReservedValue`/`unitPrice` (precio de venta, no costo — sección 6.2) | ADMIN / MANAGER / WAREHOUSEMAN / SALES | Visible para los 4 roles sin diferencias | ⏳ PENDIENTE | |
| RBAC-RES-02 | Click en `orderNumber` (dentro de una fila expandida) navega a `/sales/orders/:id?from=reservations` | ADMIN | Fila expandida | Navegación correcta | ⏳ PENDIENTE | |

### 6c. `forkJoin` y RBAC (L33)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| RBAC-RES-FJ-01 | `forkJoin` de `summary` + `products` + `clients` carga correctamente para los 4 roles (todos accesibles según SecurityConfig) | ADMIN / MANAGER / WAREHOUSEMAN / SALES | — | Las 3 secciones cargan sin error | ⏳ PENDIENTE | |
| RBAC-RES-FJ-02 | Si una fuente responde 404/500 aislado, `catchError` devuelve un valor por defecto vacío y el dashboard no se rompe completamente | Cualquier rol | Simular fallo de una fuente (si es posible en entorno de prueba) | Las otras 2 secciones cargan; la sección fallida muestra estado vacío, sin error global | ⏳ PENDIENTE | |
| RBAC-RES-FJ-03 | Datos de prueba (`[QA] `/`TEST_`) usados durante pruebas de seguridad se limpian antes de cerrar el módulo | — | Tras completar todas las pruebas | Sin clientes/órdenes de prueba activos en BD | ⏳ PENDIENTE | Verificar al cierre (FASE 6) |

### 6d. Estados vacíos (EMPTY)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| EMPTY-RES-01 | Sin productos con reservas activas | EmptyState "Sin reservas activas" en sección "Por producto" | ⏳ PENDIENTE | |
| EMPTY-RES-02 | Sin clientes con reservas activas | EmptyState en sección "Por cliente" | ⏳ PENDIENTE | |

---

## 7. Mensajes de error y éxito (ERR)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| ERR-01 | Snackbar de éxito: fondo verde `#2E7D32`, clase `snackbar-success` | Operación exitosa | Color correcto | ⏳ PENDIENTE | |
| ERR-02 | Snackbar de error: fondo rojo `#C62828`, clase `snackbar-error`, `panelClass` como array (L18) | Error del backend | Color correcto | ⏳ PENDIENTE | |
| ERR-03 | Mensaje de error específico del backend visible (`err.error?.message`, L9) | Backend rechaza con 4xx/5xx | Texto del backend en el snackbar, no genérico | ⏳ PENDIENTE | |
| ERR-04 | Error 400 (`MethodArgumentNotValidException`) → mensaje "Validación fallida: campo: motivo; ..." | Body de request inválido (ej. `details: []`) | Mensaje concatenado visible | ⏳ PENDIENTE | |
| ERR-05 | Error de red → mensaje útil (no "undefined" ni stack trace) | Backend apagado | Snackbar "Error al cargar/guardar..." | ⏳ PENDIENTE | |
| ERR-06 | Progress bar visible durante carga de datos | Navegar a cualquier pantalla de Sales | Barra indeterminada en parte superior | ⏳ PENDIENTE | |
| ERR-07 | Error HTTP 401 → redirige a login con mensaje "sesión expirada" | JWT expirado durante uso | Redirect a `/login` con mensaje | ⏳ PENDIENTE | |
| ERR-08 | Error HTTP 403 → mensaje "Acceso denegado" | Rol sin permiso intenta operación (ej. SALES → approve vía curl) | Snackbar de error visible si se expone en UI | ⏳ PENDIENTE | |
| ERR-09 | Optimistic Locking: "Stock modificado concurrentemente. Intente nuevamente." visible en snackbar rojo; permite reintentar sin perder datos del formulario | Dos aprobaciones concurrentes sobre el mismo producto (difícil de simular manualmente — documentar si no se puede reproducir) | Mensaje visible; formulario conserva los datos para reintentar | ⏳ PENDIENTE | Caso de difícil reproducción manual — marcar `N/A` con justificación si no se puede simular |
| ERR-10 | Errores de negocio de Sales (stock insuficiente, transición inválida, producto duplicado, no encontrado) muestran el mensaje del backend correctamente AUNQUE el status real sea 500 (H1) | Cualquier regla R1-R14 violada | Mensaje de negocio correcto en snackbar rojo, independientemente del status code real | ⏳ PENDIENTE | Documentar el status code real observado (500 vs 422/404 esperado) — referencia H1 |

---

## 8. Visual general del módulo (VIS-GEN)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| VIS-GEN-01 | Sidebar colapsado al entrar al módulo (`layoutService.collapse()`) | Sidebar en modo íconos al navegar a `/sales/*` | ⏳ PENDIENTE | |
| VIS-GEN-02 | Breadcrumb correcto en todas las pantallas ("Ventas → Clientes", "Ventas → Órdenes de venta", "Ventas → Detalle de orden", "Ventas → Reservas de stock") | Topbar muestra breadcrumb correcto por ruta | ⏳ PENDIENTE | |
| VIS-GEN-03 | Botón primario con color de marca `#6B3C6B` | Botones "Nuevo/Crear/Guardar/Agregar" con color correcto | ⏳ PENDIENTE | |
| VIS-GEN-04 | Botones destructivos con color `warn` (rojo) | "Eliminar/Cancelar/Desactivar" en rojo | ⏳ PENDIENTE | |
| VIS-GEN-05 | Diálogos de confirmación son modales (click fuera no cierra) | Click backdrop no cierra `ConfirmDialog` | ⏳ PENDIENTE | |
| VIS-GEN-06 | Campo de búsqueda tiene ícono lupa | Ícono `search` visible en Clientes | ⏳ PENDIENTE | |
| VIS-GEN-07 | Header de tabla con color `#F2E4F2`/`#6B3C6B` vía mixin SCSS compartido (L32) en TODAS las tablas del módulo (Clientes, Órdenes, Detalles, Reservas) | Consistencia visual entre las 4 tablas | ⏳ PENDIENTE | |
| VIS-GEN-08 | Sidebar — ítem "Ventas" visible para los 4 roles, con sub-ítems filtrados según permisos | ADMIN ve Clientes/Órdenes/Reservas; WAREHOUSEMAN ve los 3 (lectura); todos ven "Reservas" | ⏳ PENDIENTE | |

---

## 9. Historial de bugs encontrados en este módulo

| Bug ID | Descripción | Dónde se encontró | Estado |
|---|---|---|---|
| BUG-S4-01 | (placeholder) | | ⏳ Pendiente |

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
[ ] 1. Todos los casos de este documento tienen estado ✅ PASS — ninguna fila ⏳ PENDIENTE
[ ] 2. ng test --no-watch → 0 fallos; cobertura ≥ 70% statements
[ ] 3. Prueba browser completada con CADA ROL (ADMIN, MANAGER, WAREHOUSEMAN, SALES)
[ ] 4. Memoria técnica §10 actualizada con resultado final
```

### Checklist adicional — Lecciones L29-L33 (mandatorio)

```
[ ] L29 — Matriz de campos sensibles × roles documentada en §4 de la memoria técnica
    (unitCost de SaleOrderDetailResponseDTO), con RBAC-LIN-01..04 en PASS
[ ] L30 — H1 documentado (404/422 esperados vs 500 real); ERR-07/ERR-08 en PASS
[ ] L31 — ClientDialog y SaleOrderDetailFormDialog usan disableClose:true (UI-CLF-05,
    UI-LIN-04 en PASS); paginadores resetean a página 0 (UI-CLI-PAG-03, UI-ORD-PAG-03)
[ ] L32 — Headers de tabla de Clientes/Órdenes/Detalles/Reservas usan el mixin
    compartido (VIS-CLI-07, VIS-ORD-07, VIS-GEN-07 en PASS)
[ ] L33 — forkJoin de ReservationsPageComponent con catchError por observable
    (RBAC-RES-FJ-01..03 en PASS); sin datos de prueba activos sin prefijo al cierre
```

### Checklist adicional — Hallazgos pre-código (D7/D8)

```
[ ] H1 — Resuelto en backend durante FASE 1 (con autorización) y casos ERR-10,
    FLOW-DET-03/07/10, RN-DET-04, CRUD-LIN-05 re-verificados con status 404/409/422;
    O documentado como pendiente formal si no se autorizó
[ ] H2 — Mitigado en frontend desde FASE 4 (RBAC-LIN-02/03 en PASS) independientemente
    del estado de redacción en backend (RBAC-LIN-04 informativo)
[ ] H3 (D8) — @Transactional verificado en approveOrder(); documentado si no está presente
```
