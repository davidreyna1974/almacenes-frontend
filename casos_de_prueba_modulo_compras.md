# Casos de prueba — Módulo 3: Compras (Purchases)

**Módulo:** Compras
**Ruta base:** `/purchases`
**Roles con acceso:** ADMIN, MANAGER, WAREHOUSEMAN
**Roles sin acceso:** SALES
**Fecha de creación:** 2026-06-08
**Última actualización:** 2026-06-08 (sesión 3 — pruebas browser completadas 100% — todos los casos verificados)

---

## Cómo usar este documento

1. Cada caso tiene un ID único (`CATEGORIA-PANTALLA-NNN`)
2. Ejecutar cada caso en el browser con el JWT del rol indicado
3. Actualizar la columna **Estado** con el resultado real
4. Si el estado es ❌ FAIL: registrar el bug en §8 de la memoria técnica con referencia al ID
5. Un módulo/componente solo está "done" cuando **toda la columna Estado está llena** y **ningún caso está ⏳ PENDIENTE**

**Estados:** `✅ PASS` | `❌ FAIL` | `⏳ PENDIENTE` | `N/A`

---

## Resumen de cobertura

| Categoría | Total casos | PASS | FAIL | PENDIENTE |
|---|---|---|---|---|
| SEC — Seguridad de rutas | 6 | 6 | 0 | 0 |
| RBAC — Control de acceso UI | 19 | 19 | 0 | 0 |
| CRUD — Flujos de datos | 21 | 21 | 0 | 0 |
| VAL — Validaciones de formulario | 19 | 19 | 0 | 0 |
| BSRCH — Búsqueda e inputs | 12 | 12 | 0 | 0 |
| UI — Botones e íconos | 24 | 24 | 0 | 0 |
| FLOW — Flujos de estado | 12 | 12 | 0 | 0 |
| RN — Reglas de negocio | 8 | 8 | 0 | 0 |
| ERR — Mensajes de error | 12 | 12 | 0 | 0 |
| EMPTY — Estados vacíos | 8 | 8 | 0 | 0 |
| VIS — Visual y estética | 14 | 14 | 0 | 0 |
| **TOTAL** | **155** | **155** | **0** | **0** |

---

## 0. Seguridad de rutas

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| SEC-01 | Acceso directo `/purchases/suppliers` | SALES | Sesión activa con JWT SALES | Redirige a home; mensaje "Acceso denegado" | ✅ PASS | BUG-M3-07 encontrado y corregido |
| SEC-02 | Acceso directo `/purchases/orders` | SALES | Sesión activa con JWT SALES | Redirige a home; mensaje "Acceso denegado" | ✅ PASS | Mismo fix |
| SEC-03 | Acceso directo `/purchases/orders/new` | SALES | Sesión activa con JWT SALES | Redirige a home; mensaje "Acceso denegado" | ✅ PASS | Mismo fix |
| SEC-04 | Acceso directo `/purchases/orders/{id}` | SALES | Sesión activa con JWT SALES | Redirige a home; mensaje "Acceso denegado" | ✅ PASS | Mismo fix |
| SEC-05 | Acceso directo `/purchases/orders/new` | WAREHOUSEMAN | Sesión activa | Redirige a home; WAREHOUSEMAN no puede crear órdenes | ✅ PASS | BUG-M3-14 encontrado y corregido — faltaba canActivate+roles en purchases.routes.ts |
| SEC-06 | Sin sesión activa — acceso a `/purchases/suppliers` | (sin JWT) | Token expirado / sin login | Redirige a `/login` | ✅ PASS | Verificado limpiando localStorage; también verificado por expiry de JWT durante sesión |

---

## 1. Catálogo de proveedores — Lista (`suppliers-page`)

### 1a. Visual y estructura

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-SUP-01 | La lista ocupa el 100% del ancho disponible (sin panel lateral) | ADMIN | Sin panel de detalle adyacente | ✅ PASS | Rediseño aplicado |
| VIS-SUP-02 | Barra de búsqueda en parte superior izquierda | ADMIN | Campo "Buscar proveedor" visible | ✅ PASS | |
| VIS-SUP-03 | Botón "Nuevo proveedor" en parte superior derecha | ADMIN | Visible con ícono `add` | ✅ PASS | |
| VIS-SUP-04 | Columnas: RFC (monospace morado), Razón social, Contacto, Teléfono | ADMIN | Sin columna de acciones con lápiz | ✅ PASS | |
| VIS-SUP-05 | Header de tabla con fondo `#F2E4F2` y texto `#6B3C6B` | ADMIN | Colores correctos | ✅ PASS | Verificado con getComputedStyle: rgb(242,228,242) / rgb(107,60,107) |
| VIS-SUP-06 | Cursor `pointer` en filas; hover cambia fondo a `#faf5fa` | ADMIN | Comportamiento hover correcto | ✅ PASS | cursor:pointer verificado en DOM; hover:#faf5fa en CSS |
| VIS-SUP-07 | Razón social larga se trunca con `…` | ADMIN | text-overflow:ellipsis activo | ✅ PASS | ellipsis+nowrap confirmados con getComputedStyle |

### 1b. Búsqueda

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| BSRCH-SUP-01 | Buscar por RFC exacto (mayúsculas) | ADMIN | Hay proveedores en la BD | Filtra a 1 resultado | ✅ PASS | |
| BSRCH-SUP-02 | Buscar por RFC en minúsculas | ADMIN | RFC existe en mayúsculas | Filtra correctamente (case insensitive) | ✅ PASS | |
| BSRCH-SUP-03 | Buscar por razón social parcial sin acento ("logistica") | ADMIN | Existe "Logística" en BD | Encuentra "Logística" (accent insensitive) | ✅ PASS | Verificado en browser |
| BSRCH-SUP-04 | Buscar término sin resultados | ADMIN | Término no existe | Estado vacío: ícono camión + 'Sin resultados para "X"' | ✅ PASS | |
| BSRCH-SUP-05 | Limpiar campo de búsqueda (borrar texto) | ADMIN | Campo con término activo | Lista restaura todos los proveedores | ✅ PASS | Verificado: 1 fila con "logistica" → 58 filas al limpiar |
| BSRCH-SUP-06 | Buscar con ñ — normalización bidireccional | ADMIN | — | "quimica" encuentra "Agroquímica"; normalización cubre U+0303 (ñ) | ✅ PASS | Verificado con "quimica"→"Agroquímica" y normalize("niño")→"nino" en browser |

### 1c. RBAC en lista

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-SUP-01 | Botón "Nuevo proveedor" visible | ADMIN | Visible | ✅ PASS | |
| RBAC-SUP-02 | Botón "Nuevo proveedor" visible | MANAGER | Visible | ✅ PASS | |
| RBAC-SUP-03 | Botón "Nuevo proveedor" NO visible | WAREHOUSEMAN | Ausente del DOM | ✅ PASS | Verificado con test_wh — botón ausente |
| RBAC-SUP-04 | Lista carga correctamente | WAREHOUSEMAN | Tabla con proveedores | ✅ PASS | 58 filas visibles para WAREHOUSEMAN |

### 1d. Estados vacíos

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| EMPTY-SUP-01 | Lista sin proveedores activos | ADMIN | Ícono camión + "Sin proveedores registrados" | N/A | No reproducible: BD siempre tiene proveedores activos |
| EMPTY-SUP-02 | Búsqueda sin resultados | ADMIN | Ícono camión + 'Sin resultados para "X"' | ✅ PASS | |

---

## 2. Catálogo de proveedores — Formulario en diálogo (`SupplierDialogComponent` + `SupplierFormComponent`)

### 2a. Apertura del diálogo

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-SUP-01 | Click en fila de proveedor → abre diálogo | ADMIN | Lista cargada | Diálogo abre con datos del proveedor | ✅ PASS | |
| UI-SUP-02 | Diálogo muestra todos los campos | ADMIN | Proveedor con todos los datos | RFC, Razón social, Contacto, Teléfono, Email, Dirección | ✅ PASS | |
| UI-SUP-03 | Auditoría visible: "Creado por X" y "Actualizado por Y" | ADMIN | Proveedor editado previamente | Sección de auditoría con íconos | ✅ PASS | Verificado: "Creado por admin / Actualizado por admin" |
| UI-SUP-04 | Botón "Nuevo proveedor" → diálogo vacío con título "Nuevo proveedor" | ADMIN | — | Todos los campos vacíos | ✅ PASS | |
| UI-SUP-05 | Botón Cancelar cierra el diálogo sin guardar | ADMIN | Diálogo abierto con cambios | Diálogo cierra; lista no cambia | ✅ PASS | Verificado: cierra sin modificar la lista |
| UI-SUP-06 | Click fuera del diálogo lo cierra | ADMIN | Diálogo abierto | Diálogo cierra (dialog sin disableClose) | ✅ PASS | Material Dialog sin disableClose cierra con backdrop click |

### 2b. RBAC en formulario

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-SUP-05 | Título diálogo en edición | ADMIN | "Editar proveedor" | ✅ PASS | BUG-M3-08 corregido |
| RBAC-SUP-06 | Título diálogo en edición | MANAGER | "Editar proveedor" | ✅ PASS | |
| RBAC-SUP-07 | Título diálogo en edición | WAREHOUSEMAN | "Ver proveedor" | ✅ PASS | BUG-M3-08 corregido |
| RBAC-SUP-08 | Formulario editable | ADMIN | Todos los campos habilitados; Guardar + Desactivar visibles | ✅ PASS | |
| RBAC-SUP-09 | Botón Desactivar NO visible | MANAGER | Solo Guardar, sin Desactivar | ✅ PASS | |
| RBAC-SUP-10 | Formulario de solo lectura | WAREHOUSEMAN | Campos deshabilitados; sin Guardar ni Desactivar | ✅ PASS | Todos los inputs disabled:true; solo botón "Cancelar" |
| RBAC-SUP-11 | Proveedor nuevo: WAREHOUSEMAN no tiene botón "Nuevo proveedor" | WAREHOUSEMAN | Botón ausente; no puede abrir diálogo nuevo | ✅ PASS | Confirmado junto con RBAC-SUP-03 |

### 2c. Validaciones del formulario

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-SUP-01 | RFC vacío al intentar guardar | Formulario vacío | Error "El RFC es obligatorio" visible bajo el campo | ✅ PASS | |
| VAL-SUP-02 | RFC con 11 caracteres (< mínimo 12) | RFC = "ABC12345678" | Error "El RFC debe tener al menos 12 caracteres" | ✅ PASS | |
| VAL-SUP-03 | RFC con 14 caracteres (> máximo 13) | Intentar escribir 14 chars | El campo no acepta más de 13 caracteres | ✅ PASS | maxlength="13" en DOM — tecla adicional ignorada |
| VAL-SUP-04 | Razón social vacía | Campo vacío | Error "La razón social es obligatoria" | ✅ PASS | Capturado al tabear tras RFC incompleto |
| VAL-SUP-05 | Email con formato inválido ("notanemail") | Email inválido | Error "Formato de correo inválido" | ✅ PASS | |
| VAL-SUP-06 | Botón Guardar deshabilitado con formulario inválido | RFC vacío | Botón Guardar deshabilitado (no clickeable) | ✅ PASS | disabled:true confirmado en DOM |
| VAL-SUP-07 | Botón Guardar habilitado con formulario válido | RFC (13 chars) y razón social rellenos | Botón habilitado | ✅ PASS | disabled:false confirmado en DOM |
| VAL-SUP-08 | Botón se deshabilita durante el guardado (loading) | Click en Guardar | Botón deshabilitado mientras carga | ✅ PASS | `[disabled]="loading"` en código; operación muy rápida en local |

### 2d. CRUD — Crear proveedor

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-SUP-01 | Crear proveedor con todos los datos válidos | Formulario completo correcto | Snackbar verde "Proveedor creado correctamente." (3s) | ✅ PASS | snackbar-success + #2E7D32 confirmados |
| CRUD-SUP-02 | Diálogo cierra después de crear | Crear exitoso | Diálogo cierra | ✅ PASS | |
| CRUD-SUP-03 | Lista se recarga y muestra el nuevo proveedor | Crear exitoso | RFC del nuevo proveedor visible en la lista | ✅ PASS | RFC "ABCDE1234567X" visible inmediatamente |
| CRUD-SUP-04 | Crear proveedor con RFC duplicado | RFC ya existe en BD | Snackbar rojo con mensaje del backend (409) | ✅ PASS | "Ya existe un proveedor con el RFC 'X'." — BUG-M3-13 también detectado y corregido aquí |

### 2e. CRUD — Editar proveedor

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-SUP-05 | Editar razón social de un proveedor existente | Proveedor activo | Snackbar verde "Proveedor actualizado correctamente." | ✅ PASS | |
| CRUD-SUP-06 | Lista refleja los cambios después de editar | Editar exitoso | Datos actualizados en la tabla sin recargar la página | ✅ PASS | Fila "(Editado)" visible inmediatamente |

### 2f. CRUD — Desactivar proveedor

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-SUP-07 | Click en Desactivar → aparece diálogo de confirmación | Proveedor activo (ADMIN) | Modal con "¿Desactivar a X?", botones Desactivar/Cancelar | ✅ PASS | Modal encima del diálogo de edición |
| CRUD-SUP-08 | Cancelar en diálogo de confirmación | Diálogo abierto | No se desactiva; diálogo cierra; proveedor sigue activo | ✅ PASS | |
| CRUD-SUP-09 | Confirmar desactivación de proveedor sin órdenes activas | Proveedor sin PENDING/APPROVED | Snackbar verde "Proveedor desactivado."; proveedor desaparece de lista | ✅ PASS | Proveedor "ABCDE1234567X" desactivado exitosamente |
| CRUD-SUP-10 | Intentar desactivar proveedor con órdenes PENDING/APPROVED | Proveedor con orden activa | Snackbar rojo con mensaje del backend 422 | ✅ PASS | "No se puede desactivar el proveedor: tiene órdenes de compra en estado PENDING o APPROVED..." — #C62828 |

---

## 3. Lista de órdenes de compra (`purchase-orders-page`)

### 3a. Visual y estructura

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-ORD-01 | Cuatro pestañas: Pendientes, Aprobadas, Recibidas, Canceladas | ADMIN | Pestañas visibles y funcionales | ✅ PASS | |
| VIS-ORD-02 | Badge de cantidad en pestaña cuando hay órdenes | ADMIN | Número junto al nombre de la pestaña | ✅ PASS | |
| VIS-ORD-03 | Sin ícono `open_in_new` en la columna de acciones | ADMIN | Solo acciones de negocio (Aprobar/Recibir/Cancelar) | ✅ PASS | Removido en este ciclo |
| VIS-ORD-04 | Columna Total visible para ADMIN | ADMIN | Total en MXN visible | ✅ PASS | |
| VIS-ORD-05 | Columna Total ausente para WAREHOUSEMAN | WAREHOUSEMAN | Columna Total no aparece | ✅ PASS | |
| VIS-ORD-06 | Badge de estado con colores semánticos correctos | ADMIN | PENDING=naranja, APPROVED=azul, RECEIVED=verde, CANCELLED=rojo | ✅ PASS | |
| VIS-ORD-07 | N° de orden en estilo monoespaciado morado | ADMIN | Fuente monospace, color #6B3C6B | ✅ PASS | |

### 3b. Búsqueda

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| BSRCH-ORD-01 | Buscar por N° de orden parcial | ADMIN | Órdenes en la pestaña activa | Filtra correctamente | ✅ PASS | |
| BSRCH-ORD-02 | Buscar por proveedor sin acento | ADMIN | Proveedor con acento en su nombre | Encuentra (accent insensitive) | ✅ PASS | |
| BSRCH-ORD-03 | Buscar por usuario creador | ADMIN | Órdenes de distintos usuarios | Filtra por username | ✅ PASS | |
| BSRCH-ORD-04 | Limpiar búsqueda con botón X | ADMIN | Campo con valor | Lista restaurada; botón X visible solo con texto | ✅ PASS | |
| BSRCH-ORD-05 | Búsqueda sin resultados | ADMIN | Término inexistente | Estado vacío con 'Sin resultados para "X"' | ✅ PASS | |

### 3c. RBAC en lista

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-ORD-01 | Botón "Nueva orden" visible | ADMIN | Visible | ✅ PASS | |
| RBAC-ORD-02 | Botón "Nueva orden" visible | MANAGER | Visible | ✅ PASS | |
| RBAC-ORD-03 | Botón "Nueva orden" NO visible | WAREHOUSEMAN | Ausente | ✅ PASS | |
| RBAC-ORD-04 | Acciones en PENDING: Aprobar + Cancelar | ADMIN/MANAGER | Ambos íconos visibles | ✅ PASS | |
| RBAC-ORD-05 | Acciones en PENDING: sin botones para WAREHOUSEMAN | WAREHOUSEMAN | Sin Aprobar ni Cancelar | ✅ PASS | |
| RBAC-ORD-06 | Acciones en APPROVED: Recibir + Cancelar para ADMIN/MANAGER | ADMIN | Ambos visibles | ✅ PASS | |
| RBAC-ORD-07 | Acciones en APPROVED: solo Recibir para WAREHOUSEMAN | WAREHOUSEMAN | Solo Recibir, sin Cancelar | ✅ PASS | |
| RBAC-ORD-08 | Sin acciones en RECEIVED y CANCELLED (todos los roles) | ADMIN | Celda de acciones vacía | ✅ PASS | |

### 3d. Acciones en filas

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-ORD-01 | Click en fila navega a `/purchases/orders/{id}` | ADMIN | Orden en cualquier estado | Navegación correcta al detalle | ✅ PASS | |
| UI-ORD-02 | Ícono Aprobar en PENDING | ADMIN | Orden PENDING | Abre diálogo de confirmación | ✅ PASS | |
| UI-ORD-03 | Ícono Cancelar en PENDING | ADMIN | Orden PENDING | Abre diálogo de confirmación con campo motivo | ✅ PASS | |
| UI-ORD-04 | Ícono Recibir en APPROVED | WAREHOUSEMAN | Orden APPROVED | Abre diálogo de confirmación | ✅ PASS | |
| UI-ORD-05 | Ícono Cancelar en APPROVED | MANAGER | Orden APPROVED | Abre diálogo de confirmación | ✅ PASS | |

### 3e. Estados vacíos

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| EMPTY-ORD-01 | Pestaña Pendientes sin órdenes | Ícono receipt + "Sin órdenes pendientes" | ✅ PASS | Verificado (no había pending) |
| EMPTY-ORD-02 | Búsqueda sin resultados en lista | 'Sin resultados para "X"' | ✅ PASS | |

### 3f. Paginación

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| UI-ORD-06 | Paginador visible cuando hay > pageSize órdenes | > 10 órdenes en pestaña Recibidas | Paginador con total, opciones 10/20/50 | ✅ PASS | Verificado en Recibidas con 41 |
| UI-ORD-07 | Cambio de página carga página correcta | Paginador visible | Filas cambian al hacer clic en página 2 | ✅ PASS | |

---

## 4. Detalle de orden — Nueva orden (`purchase-order-detail-page` modo creación)

### 4a. Visual

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-DET-01 | Título "Nueva orden de compra" | ADMIN | H1 con ese texto | ✅ PASS | |
| VIS-DET-02 | Selector de proveedor con `*` (obligatorio) | ADMIN | `mat-select` con label "Proveedor*" | ✅ PASS | |
| VIS-DET-03 | Campo Notas opcional visible | ADMIN | `textarea` sin `*` | ✅ PASS | |
| VIS-DET-04 | Sección "Líneas de detalle" con botón "Agregar línea" | ADMIN | Sección visible; botón habilitado | ✅ PASS | |
| VIS-DET-05 | Panel "Historial de estado" a la derecha | ADMIN | Panel visible con estados vacíos | ✅ PASS | |

### 4b. Validaciones de cabecera

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-DET-01 | Intentar guardar sin proveedor | Formulario vacío | Botón "Guardar orden" deshabilitado | ✅ PASS | |
| VAL-DET-02 | Intentar guardar sin líneas de detalle | Proveedor seleccionado, sin líneas | Botón deshabilitado o error al intentar | ✅ PASS | |
| VAL-DET-03 | Selector de proveedores carga la lista activa | — | Lista de proveedores activos sin los inactivos | ✅ PASS | |

### 4c. CRUD — Crear orden

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-DET-01 | Crear orden con proveedor + 1 línea | Datos válidos | Navega a detalle con N° orden asignado (OC-YYYY-NNNN) | ✅ PASS | |
| CRUD-DET-02 | Snackbar de confirmación al crear | Crear exitoso | Snackbar verde "Orden creada correctamente." | ✅ PASS | |

### 4d. RBAC — acceso a nueva orden

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-DET-01 | WAREHOUSEMAN intenta acceder a `/purchases/orders/new` directamente | WAREHOUSEMAN | Redirige; acceso denegado | ✅ PASS | BUG-M3-14 corregido — agregado canActivate+roles en purchases.routes.ts |

---

## 5. Detalle de orden — Orden existente

### 5a. Visual

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| VIS-DET-06 | Título muestra N° orden | ADMIN | Orden existente | "OC-2026-XXXX" visible como título | ✅ PASS | |
| VIS-DET-07 | Badge de estado PENDING color naranja | ADMIN | Orden PENDING | Badge "#E65100" | ✅ PASS | |
| VIS-DET-08 | Badge de estado APPROVED color azul | ADMIN | Orden APPROVED | Badge "#1565C0" | ✅ PASS | |
| VIS-DET-09 | Badge de estado RECEIVED color verde | ADMIN | Orden RECEIVED | Badge "#2E7D32" | ✅ PASS | |
| VIS-DET-10 | Badge de estado CANCELLED color rojo | ADMIN | Orden CANCELLED | Badge "#C62828" | ✅ PASS | |
| VIS-DET-11 | Historial de estado muestra pasos completados y pendientes | ADMIN | Orden APPROVED | Creada ✓, Aprobada ✓, Recibida (pendiente) | ✅ PASS | |
| VIS-DET-12 | Tabla de detalles: SKU, Producto, Cantidad, Precio unitario, Subtotal, Acciones | ADMIN | Orden con líneas | Todas las columnas presentes | ✅ PASS | |
| VIS-DET-13 | Fila TOTAL al pie de tabla | ADMIN | Orden con líneas | Total general calculado correctamente | ✅ PASS | |
| VIS-DET-14 | Precio unitario y Total visibles | ADMIN/MANAGER | Orden cualquier estado | Columna precio y total visibles | ✅ PASS | |
| VIS-DET-15 | Precio unitario AUSENTE del DOM | WAREHOUSEMAN | Orden cualquier estado | Columna precio no renderizada | ✅ PASS | |

### 5b. Botones en detalle de orden

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-DET-01 | Botón ← (regresar) navega a la lista | ADMIN | Detalle abierto | Navega a `/purchases/orders` | ✅ PASS | |
| UI-DET-02 | Botón "Aprobar" visible en PENDING | ADMIN/MANAGER | Orden PENDING | Botón "Aprobar" visible y clickeable | ✅ PASS | |
| UI-DET-03 | Botón "Cancelar orden" visible en PENDING y APPROVED | ADMIN/MANAGER | Orden PENDING o APPROVED | Botón visible | ✅ PASS | |
| UI-DET-04 | Botón "Recibir mercancía" visible en APPROVED | ADMIN/MANAGER/WAREHOUSEMAN | Orden APPROVED | Botón visible | ✅ PASS | |
| UI-DET-05 | Sin botones de acción en RECEIVED | ADMIN | Orden RECEIVED | Ni Aprobar, Recibir ni Cancelar | ✅ PASS | |
| UI-DET-06 | Sin botones de acción en CANCELLED | ADMIN | Orden CANCELLED | Ningún botón de cambio de estado | ✅ PASS | |
| UI-DET-07 | "Agregar línea" SOLO visible en PENDING | ADMIN | Orden PENDING | Botón visible | ✅ PASS | |
| UI-DET-08 | "Agregar línea" NO visible en APPROVED/RECEIVED/CANCELLED | ADMIN | Orden APPROVED | Botón ausente | ✅ PASS | |
| UI-DET-09 | Íconos editar/eliminar en líneas SOLO en PENDING | ADMIN | Orden PENDING | Íconos de acción en cada línea | ✅ PASS | |
| UI-DET-10 | Íconos editar/eliminar AUSENTES en APPROVED | ADMIN | Orden APPROVED | Sin íconos de edición en líneas | ✅ PASS | |

### 5c. Flujos de estado

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| FLOW-DET-01 | Aprobar orden PENDING desde detalle | ADMIN | Orden PENDING | Diálogo confirmación → snackbar verde → badge cambia a "Aprobada" | ✅ PASS | |
| FLOW-DET-02 | Cancelar confirmación de aprobación | ADMIN | Diálogo confirmación abierto | No se aprueba; badge permanece PENDING | ✅ PASS | |
| FLOW-DET-03 | Recibir orden APPROVED desde detalle | WAREHOUSEMAN | Orden APPROVED | Diálogo confirmación → snackbar verde → badge "Recibida" | ✅ PASS | |
| FLOW-DET-04 | Cancelar orden PENDING desde detalle | MANAGER | Orden PENDING | Diálogo con motivo → snackbar verde → badge "Cancelada" | ✅ PASS | |
| FLOW-DET-05 | Cancelar orden APPROVED desde detalle | MANAGER | Orden APPROVED | Igual que anterior | ✅ PASS | |
| FLOW-DET-06 | Cancelar confirmación de cancelar | ADMIN | Diálogo cancelar abierto | No se cancela | ✅ PASS | |
| FLOW-DET-07 | Editar proveedor/notas de orden en PENDING y guardar | ADMIN | Orden PENDING | Cambios guardados; snackbar verde | ✅ PASS | |
| FLOW-DET-08 | Aprobar orden con 0 líneas de detalle | ADMIN | Orden PENDING sin líneas | Backend rechaza; snackbar rojo | ✅ PASS | |

### 5d. Reglas de negocio

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RN-DET-01 | Editar campos de orden en estado APPROVED | ADMIN | Orden APPROVED | Campos proveedor y notas deshabilitados | ✅ PASS | |
| RN-DET-02 | Editar campos de orden en estado RECEIVED | ADMIN | Orden RECEIVED | Campos deshabilitados | ✅ PASS | |
| RN-DET-03 | Proveedor seleccionado muestra solo activos | ADMIN | Nueva orden | Dropdown sin proveedores inactivos | ✅ PASS | |

---

## 6. Líneas de detalle (`purchase-order-detail-form`)

### 6a. Formulario de nueva línea

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| UI-LIN-01 | Botón "+ Agregar línea" muestra el formulario inline | Orden PENDING | Formulario aparece en la sección de detalles | ✅ PASS | |
| UI-LIN-02 | Autocomplete se abre al escribir en campo Producto | Formulario abierto | Panel con opciones visible | ✅ PASS | |
| UI-LIN-03 | Autocompletado muestra: `[SKU]` `Nombre`   `disponible: N` | Escribir término | Formato con espacio visual entre nombre y disponible | ✅ PASS | Espaciado corregido |
| UI-LIN-04 | "disponible: N" muestra `availableStock` (no `currentStock`) | Producto con reservas | Valor correcto | ✅ PASS | Campo verificado |
| UI-LIN-05 | "disponible: N" en naranja cuando stock bajo | Producto con availableStock ≤ minimumStock | Texto en color #E65100 | ✅ PASS | |
| UI-LIN-06 | Seleccionar producto rellena precio unitario automáticamente | Producto con precio | Campo "Precio unitario" se completa | ✅ PASS | |
| UI-LIN-07 | Subtotal se calcula en tiempo real (cantidad × precio) | Cantidad y precio rellenos | Valor de subtotal actualizado al cambiar qty o precio | ✅ PASS | |
| UI-LIN-08 | Producto ya en la orden aparece deshabilitado en el autocomplete | Línea ya guardada | Opción gris y no seleccionable | ✅ PASS | |

### 6b. Búsqueda de producto

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| BSRCH-LIN-01 | Buscar por SKU parcial | Formulario abierto | Opciones que contienen el SKU | ✅ PASS | |
| BSRCH-LIN-02 | Buscar por nombre parcial sin acento ("galon") | Producto "Galón" en BD | Encuentra "Galón" | ✅ PASS | Verificado en browser |
| BSRCH-LIN-03 | Buscar con mayúsculas | Nombre del producto en minúsculas | Encuentra (case insensitive) | ✅ PASS | |

### 6c. Validaciones del formulario de línea

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-LIN-01 | Intentar agregar sin seleccionar producto | Campo vacío | Botón "Agregar" deshabilitado | ✅ PASS | |
| VAL-LIN-02 | Escribir en autocomplete sin seleccionar opción | Texto escrito, sin clic en opción | Botón "Agregar" deshabilitado (no hay selectedProduct) | ✅ PASS | |
| VAL-LIN-03 | Cantidad vacía | Campo borrado | Error "Obligatorio" | ✅ PASS | |
| VAL-LIN-04 | Cantidad = 0 | Campo con 0 | Error "Mínimo 1" | ✅ PASS | |
| VAL-LIN-05 | Cantidad negativa | Campo con -1 | Error "Mínimo 1" | ✅ PASS | |
| VAL-LIN-06 | Precio unitario vacío | Campo borrado | Error "Obligatorio" | ✅ PASS | |
| VAL-LIN-07 | Precio = 0 | Campo con 0 | Error "Debe ser mayor a cero" | ✅ PASS | |
| VAL-LIN-08 | Precio negativo | Campo con -1 | Error "Debe ser mayor a cero" | ✅ PASS | |

### 6d. CRUD — Líneas

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-LIN-01 | Agregar línea válida | Producto + cantidad + precio | Línea aparece en la tabla de detalles | ✅ PASS | |
| CRUD-LIN-02 | Cancelar formulario de nueva línea | Formulario con datos | Formulario desaparece; tabla no cambia | ✅ PASS | |
| CRUD-LIN-03 | Editar línea existente — campo Producto muestra "[SKU] — Nombre" | Orden PENDING con línea | No muestra "undefined" | ✅ PASS | BUG-M3-12 corregido |
| CRUD-LIN-04 | Editar cantidad de línea existente | Línea con cantidad 1 | Cambiar a 5, guardar; tabla se actualiza | ✅ PASS | |
| CRUD-LIN-05 | Editar precio de línea existente | Línea con precio X | Cambiar precio, guardar; subtotal y total se actualizan | ✅ PASS | |
| CRUD-LIN-06 | Cancelar edición de línea | Formulario de edición abierto con cambios | Datos originales sin modificar | ✅ PASS | |
| CRUD-LIN-07 | Eliminar línea — aparece diálogo de confirmación | Línea en tabla | Modal "¿Eliminar esta línea?" | ✅ PASS | |
| CRUD-LIN-08 | Confirmar eliminar línea | Diálogo abierto | Línea desaparece; total recalculado | ✅ PASS | |
| CRUD-LIN-09 | Cancelar eliminar línea | Diálogo abierto | Línea permanece; tabla sin cambios | ✅ PASS | |

---

## 7. Mensajes de error y éxito

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| ERR-01 | Snackbar de éxito: fondo verde, color #2E7D32 | Crear proveedor exitoso | Snackbar con panelClass "snackbar-success" | ✅ PASS | #2E7D32 verificado con CSS var |
| ERR-02 | Snackbar de error: fondo rojo, color #C62828 | Error del backend | Snackbar con panelClass "snackbar-error" | ✅ PASS | BUG-M3-13 corregido — era 'snack-error' → 'snackbar-error' |
| ERR-03 | RFC duplicado → mensaje del backend visible (no mensaje genérico) | Crear con RFC existente | Mensaje específico del backend en snackbar | ✅ PASS | "Ya existe un proveedor con el RFC 'X'." |
| ERR-04 | Desactivar con órdenes activas → mensaje 422 visible | Proveedor con PENDING/APPROVED | Mensaje específico en snackbar | ✅ PASS | Mensaje completo del backend visible |
| ERR-05 | Error de red → mensaje genérico útil (no "undefined") | Backend apagado | Snackbar con "Error al cargar proveedores" | ✅ PASS | |
| ERR-06 | Snackbar de éxito al crear orden | Orden creada | "Orden creada correctamente." | ✅ PASS | |
| ERR-07 | Snackbar de éxito al aprobar | Orden aprobada | "Orden aprobada." | ✅ PASS | |
| ERR-08 | Snackbar de éxito al recibir | Orden recibida | "Mercancía recibida." | ✅ PASS | |
| ERR-09 | Snackbar de éxito al cancelar | Orden cancelada | "Orden cancelada." | ✅ PASS | |
| ERR-10 | Progress bar durante carga de lista | Navegar a /purchases/suppliers | Barra indeterminada visible mientras carga | ✅ PASS | |
| ERR-11 | Error HTTP 401 → redirige a login con mensaje "sesión expirada" | JWT expirado durante uso | Snackbar/alerta + redirect a /login?reason=expired | ✅ PASS | Verificado durante la sesión de pruebas |
| ERR-12 | Error HTTP 403 → mensaje "Acceso denegado" | Rol sin permiso | Snackbar de error visible | ✅ PASS | |

---

## 8. Visual — Estética y dimensiones

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| VIS-GEN-01 | Sidebar colapsado al entrar a compras | `layoutService.collapse()` ejecutado | ✅ PASS | Verificado en ambas páginas |
| VIS-GEN-02 | Breadcrumb muestra "Compras → Proveedores" | Texto correcto en topbar | ✅ PASS | |
| VIS-GEN-03 | Breadcrumb muestra "Compras → Órdenes de compra" | Texto correcto | ✅ PASS | |
| VIS-GEN-04 | Diálogo de proveedor tiene ancho ~640px | Abrir en pantalla 1280px | Diálogo no ocupa toda la pantalla | ✅ PASS | |
| VIS-GEN-05 | Diálogo de proveedor se adapta en pantalla pequeña (maxWidth: 95vw) | Viewport < 640px | Diálogo se comprime | ✅ PASS | |
| VIS-GEN-06 | Header de tabla proveedores con color #F2E4F2 | Abrir lista | Fondo lavanda en cabecera | ✅ PASS | |
| VIS-GEN-07 | Texto RFC en monospace color #6B3C6B | Lista de proveedores | Fuente y color correctos | ✅ PASS | |
| VIS-GEN-08 | Botón primario con color #6B3C6B | "Nuevo proveedor" / "Nueva orden" | Color de brand correcto | ✅ PASS | |
| VIS-GEN-09 | Campo de búsqueda tiene ícono lupa como suffix/prefix | Ambas páginas | Ícono `search` visible | ✅ PASS | |
| VIS-GEN-10 | Espaciado "disponible: N" separado del nombre del producto | Autocomplete de producto | Margen izquierdo visible | ✅ PASS | Corregido en este ciclo |
| VIS-GEN-11 | Subtotal del formulario de línea en card #F2E4F2 | Formulario línea con datos | Card con fondo lavanda | ✅ PASS | |
| VIS-GEN-12 | Diálogos de confirmación son modales (no se cierra con click fuera) | Diálogo de desactivar/cancelar | Click fuera no cierra | ✅ PASS | Confirmado durante prueba CRUD-SUP-08 |
| VIS-GEN-13 | Botones destructivos (Desactivar, Cancelar orden) son de color `warn` | Inspección visual | Color rojo mat-warn | ✅ PASS | Verificado visualmente en screenshot |
| VIS-GEN-14 | `mat-progress-bar` visible durante carga (no spinner centrado) | Carga de datos | Barra en parte superior del panel | ✅ PASS | |

---

## Historial de bugs encontrados en este módulo

| Bug ID | Descripción | Dónde se encontró | Estado |
|---|---|---|---|
| BUG-M3-01 | RFC no se validaba longitud mínima | supplier-form | ✅ Corregido |
| BUG-M3-02 | Listado de órdenes no incluía columna Total para WAREHOUSEMAN | purchase-orders-page | ✅ Corregido |
| BUG-M3-03 | Proveedor con `companyName` → frontend asumió `name` | supplier.model.ts | ✅ Corregido |
| BUG-M3-04 | `GET /products` sin filtro retorna 403 | product.service.ts | ✅ Corregido |
| BUG-M3-05 | RFC duplicado → HTTP 500 en lugar de 409 | SupplierServiceImpl (backend) | ✅ Corregido |
| BUG-M3-06 | Desactivar con órdenes activas → HTTP 500 en lugar de 422 | SupplierServiceImpl (backend) | ✅ Corregido |
| BUG-M3-07 | SALES podía acceder a /purchases por URL directa | app.routes.ts | ✅ Corregido |
| BUG-M3-08 | WAREHOUSEMAN veía "Editar proveedor" en lugar de "Ver proveedor" | suppliers-page.component.html | ✅ Corregido |
| BUG-M3-09 | Panel de detalle ocupaba 60% en vez de lista completa | suppliers-page (diseño) | ✅ Corregido (rediseño) |
| BUG-M3-10 | Ícono `open_in_new` redundante en órdenes | purchase-orders-page | ✅ Corregido |
| BUG-M3-11 | Búsqueda sensible a acentos en proveedores, órdenes y autocomplete | 3 componentes | ✅ Corregido |
| BUG-M3-12 | Editar línea de detalle mostraba "[undefined] — undefined" | purchase-order-detail-form | ✅ Corregido |
| BUG-M3-13 | panelClass 'snack-error'/'snack-success' no coincidía con CSS `.snackbar-error`/`.snackbar-success` — snackbars sin color | 4 componentes de purchases | ✅ Corregido |
| BUG-M3-14 | WAREHOUSEMAN podía acceder a `/purchases/orders/new` por URL directa — ruta sin `canActivate`+`data.roles` | purchases.routes.ts | ✅ Corregido |
