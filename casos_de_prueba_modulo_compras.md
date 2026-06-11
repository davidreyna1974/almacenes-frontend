# Casos de prueba — Módulo 3: Compras (Purchases)

**Módulo:** Compras
**Ruta base:** `/purchases`
**Roles con acceso:** ADMIN, MANAGER, WAREHOUSEMAN
**Roles sin acceso:** SALES
**Fecha de creación:** 2026-06-08
**Última actualización:** 2026-06-10 — RONDA DE RE-VALIDACIÓN COMPLETA: los 155 casos previos
(todos ✅ PASS) se reinician a ⏳ PENDIENTE para re-ejecución íntegra en browser; se agrega la
sección 9 "Validaciones de ciberseguridad (CYBER)" con 14 casos nuevos más CYBER-15 (mapeo
OWASP ASVS L1). La columna Notas conserva el resultado de la verificación anterior
(2026-06-08) como referencia histórica.

> ⚠️ **DOCUMENTO BORRADOR — pendiente de autorización del usuario antes de iniciar la ejecución
> en browser.** No se ejecutará ninguna validación hasta recibir aprobación explícita.
>
> Si durante la re-ejecución se detecta un bug (nuevo o de regresión), se documentará en la
> columna Notas y en el Historial de bugs (§10) con estado `⚠️ ABIERTO` — **no se corregirá**
> hasta que el usuario lo autorice explícitamente.

**Verificación contra backend (2026-06-10):** CYBER-15 (`POST /purchases/orders/{id}/details`)
confirmado contra `PurchaseOrderController.java`. CYBER-13 (CORS) confirmado contra
`SecurityConfig.java` — misma configuración global (`allowedOriginPatterns("*")` +
`allowCredentials(true)`) verificada para el módulo de Inventario; se espera hallazgo
FAIL/⚠️ ABIERTO, no falso positivo. Los requisitos ASVS L1 cubiertos a nivel global
(CYBER-18/19/20/22 — cabeceras HTTP, rate limiting, logout, firma JWT) están verificados
en `casos_de_prueba_modulo_inventario_DRAFT.md` y no se duplican aquí. El resto de los
casos CYBER-01..12 y CYBER-14 (155 casos originales) no requieren verificación adicional
de contratos de API — usan endpoints ya documentados en `memoria_tecnica_global_proyecto.md`.

---

## Cómo usar este documento

1. Cada caso tiene un ID único (`CATEGORIA-PANTALLA-NNN`)
2. Ejecutar cada caso en el browser con el JWT del rol indicado
3. Actualizar la columna **Estado** con el resultado real
4. Si el estado es ❌ FAIL: registrar el bug en §10 de este documento y en §8 de la memoria
   técnica con referencia al ID — **documentar únicamente, no corregir sin autorización**
5. Un módulo/componente solo está "done" cuando **toda la columna Estado está llena** y **ningún caso está ⏳ PENDIENTE**

**Estados:** `✅ PASS` | `❌ FAIL` | `⏳ PENDIENTE` | `N/A`

---

## Metodología y criterios de diseño de casos

Esta ronda de re-validación nombra explícitamente las técnicas de diseño de casos (ISTQB CTFL)
y el estándar de seguridad (OWASP ASVS) que sustentan las categorías de este documento:

- **Equivalence Partitioning (ISTQB CTFL)** — los casos `VAL-SUP-*` y `VAL-LIN-*` dividen el
  dominio de cada campo en clases válidas e inválidas (vacío, formato inválido, duplicado en
  backend). Ejemplo: VAL-SUP-01 (RFC vacío) vs VAL-SUP-02/03 (RFC con longitud incorrecta) vs
  CRUD-SUP-04 (RFC válido pero duplicado → clase de error de negocio distinta).
- **Boundary Value Analysis (ISTQB CTFL)** — los casos que prueban límites declarados en el
  código (`Validators.minLength`, `Validators.maxLength`, `Validators.min`) verifican el valor
  límite y el valor justo fuera del límite. Ejemplo: VAL-SUP-02 (RFC=11 vs 12 caracteres),
  VAL-SUP-03 (RFC=13 vs 14), VAL-LIN-04/05 (cantidad=0/-1 vs 1), VAL-LIN-07/08 (precio=0/-1
  vs >0).
- **State Transition Testing / Decision Table Testing (ISTQB CTFL)** — la máquina de estados de
  una orden de compra (`PENDING → APPROVED → RECEIVED` y `PENDING/APPROVED → CANCELLED`) se
  modela como tabla de decisión rol × estado × acción:

  | Estado orden \ Acción | Aprobar | Recibir | Cancelar | Editar cabecera/líneas |
  |---|---|---|---|---|
  | PENDING | ADMIN/MANAGER ✅ (FLOW-DET-01) | — | ADMIN/MANAGER ✅ (FLOW-DET-04) | ✅ (FLOW-DET-07) |
  | APPROVED | — (ya aprobada) | ADMIN/MANAGER/WAREHOUSEMAN ✅ (FLOW-DET-03) | ADMIN/MANAGER ✅ (FLOW-DET-05) | ❌ deshabilitado (RN-DET-01) |
  | RECEIVED | — | — | — | ❌ deshabilitado (RN-DET-02) |
  | CANCELLED | — | — | — | ❌ (estado terminal, sin caso explícito de re-edición) |

  Las celdas "—" representan transiciones inválidas; CYBER-12 cubre la verificación de que una
  transición inválida (`PENDING → receive`) es rechazada también a nivel de API, no solo de UI.
- **OWASP ASVS v4 — Nivel 1 (L1)** — la sección 9 (CYBER) se diseñó mapeando cada caso contra un
  requisito de ASVS L1 (ver tabla de mapeo al inicio de la sección 9). El hueco detectado
  (validación server-side de líneas de orden independiente del frontend) generó el caso
  CYBER-15, agregado en esta ronda. Las cabeceras HTTP de seguridad (ASVS V14.4), el
  rate-limiting de login (V2.2.1), la invalidación de sesión en logout (V3.3) y la validación
  de firma JWT (V3.5.3) son configuraciones globales — sus casos viven en
  `casos_de_prueba_modulo_inventario_DRAFT.md` (CYBER-18..22) y no se duplican aquí.

---

## Resumen de cobertura

| Categoría | Total casos | PASS | FAIL | PENDIENTE |
|---|---|---|---|---|
| SEC — Seguridad de rutas | 6 | 0 | 0 | 6 |
| RBAC — Control de acceso UI | 19 | 0 | 0 | 19 |
| CRUD — Flujos de datos | 21 | 0 | 0 | 21 |
| VAL — Validaciones de formulario | 19 | 0 | 0 | 19 |
| BSRCH — Búsqueda e inputs | 12 | 0 | 0 | 12 |
| UI — Botones e íconos | 24 | 0 | 0 | 24 |
| FLOW — Flujos de estado | 12 | 0 | 0 | 12 |
| RN — Reglas de negocio | 8 | 0 | 0 | 8 |
| ERR — Mensajes de error | 12 | 0 | 0 | 12 |
| EMPTY — Estados vacíos | 8 | 0 | 0 | 8 |
| VIS — Visual y estética | 14 | 0 | 0 | 14 |
| CYBER — Ciberseguridad | 15 | 0 | 0 | 15 |
| **TOTAL** | **170** | **0** | **0** | **170** |

> Nota: las celdas PASS de categorías previas quedan en 0 porque TODOS los casos se reinician
> a PENDIENTE para esta ronda (decisión del usuario: "re-ejecutar todo desde cero"). El
> resultado anterior de cada caso se conserva en la columna Notas como referencia.
> El caso CYBER-15 surge del mapeo contra OWASP ASVS L1 (ver sección 9).

---

## 0. Seguridad de rutas

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| SEC-01 | Acceso directo `/purchases/suppliers` | SALES | Sesión activa con JWT SALES | Redirige a home; mensaje "Acceso denegado" | ⏳ PENDIENTE | BUG-M3-07 encontrado y corregido (Re-test 2026-06-10; anterior: ✅ PASS) |
| SEC-02 | Acceso directo `/purchases/orders` | SALES | Sesión activa con JWT SALES | Redirige a home; mensaje "Acceso denegado" | ⏳ PENDIENTE | Mismo fix (Re-test 2026-06-10; anterior: ✅ PASS) |
| SEC-03 | Acceso directo `/purchases/orders/new` | SALES | Sesión activa con JWT SALES | Redirige a home; mensaje "Acceso denegado" | ⏳ PENDIENTE | Mismo fix (Re-test 2026-06-10; anterior: ✅ PASS) |
| SEC-04 | Acceso directo `/purchases/orders/{id}` | SALES | Sesión activa con JWT SALES | Redirige a home; mensaje "Acceso denegado" | ⏳ PENDIENTE | Mismo fix (Re-test 2026-06-10; anterior: ✅ PASS) |
| SEC-05 | Acceso directo `/purchases/orders/new` | WAREHOUSEMAN | Sesión activa | Redirige a home; WAREHOUSEMAN no puede crear órdenes | ⏳ PENDIENTE | BUG-M3-14 encontrado y corregido — faltaba canActivate+roles en purchases.routes.ts (Re-test 2026-06-10; anterior: ✅ PASS) |
| SEC-06 | Sin sesión activa — acceso a `/purchases/suppliers` | (sin JWT) | Token expirado / sin login | Redirige a `/login` | ⏳ PENDIENTE | Verificado limpiando localStorage; también verificado por expiry de JWT durante sesión (Re-test 2026-06-10; anterior: ✅ PASS) |

---

## 1. Catálogo de proveedores — Lista (`suppliers-page`)

### 1a. Visual y estructura

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-SUP-01 | La lista ocupa el 100% del ancho disponible (sin panel lateral) | ADMIN | Sin panel de detalle adyacente | ⏳ PENDIENTE | Rediseño aplicado (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-SUP-02 | Barra de búsqueda en parte superior izquierda | ADMIN | Campo "Buscar proveedor" visible | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-SUP-03 | Botón "Nuevo proveedor" en parte superior derecha | ADMIN | Visible con ícono `add` | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-SUP-04 | Columnas: RFC (monospace morado), Razón social, Contacto, Teléfono | ADMIN | Sin columna de acciones con lápiz | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-SUP-05 | Header de tabla con fondo `#F2E4F2` y texto `#6B3C6B` | ADMIN | Colores correctos | ⏳ PENDIENTE | Verificado con getComputedStyle: rgb(242,228,242) / rgb(107,60,107) (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-SUP-06 | Cursor `pointer` en filas; hover cambia fondo a `#faf5fa` | ADMIN | Comportamiento hover correcto | ⏳ PENDIENTE | cursor:pointer verificado en DOM; hover:#faf5fa en CSS (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-SUP-07 | Razón social larga se trunca con `…` | ADMIN | text-overflow:ellipsis activo | ⏳ PENDIENTE | ellipsis+nowrap confirmados con getComputedStyle (Re-test 2026-06-10; anterior: ✅ PASS) |

### 1b. Búsqueda

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| BSRCH-SUP-01 | Buscar por RFC exacto (mayúsculas) | ADMIN | Hay proveedores en la BD | Filtra a 1 resultado | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| BSRCH-SUP-02 | Buscar por RFC en minúsculas | ADMIN | RFC existe en mayúsculas | Filtra correctamente (case insensitive) | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| BSRCH-SUP-03 | Buscar por razón social parcial sin acento ("logistica") | ADMIN | Existe "Logística" en BD | Encuentra "Logística" (accent insensitive) | ⏳ PENDIENTE | Verificado en browser (Re-test 2026-06-10; anterior: ✅ PASS) |
| BSRCH-SUP-04 | Buscar término sin resultados | ADMIN | Término no existe | Estado vacío: ícono camión + 'Sin resultados para "X"' | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| BSRCH-SUP-05 | Limpiar campo de búsqueda (borrar texto) | ADMIN | Campo con término activo | Lista restaura todos los proveedores | ⏳ PENDIENTE | Verificado: 1 fila con "logistica" → 58 filas al limpiar (Re-test 2026-06-10; anterior: ✅ PASS) |
| BSRCH-SUP-06 | Buscar con ñ — normalización bidireccional | ADMIN | — | "quimica" encuentra "Agroquímica"; normalización cubre U+0303 (ñ) | ⏳ PENDIENTE | Verificado con "quimica"→"Agroquímica" y normalize("niño")→"nino" en browser (Re-test 2026-06-10; anterior: ✅ PASS) |

### 1c. RBAC en lista

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-SUP-01 | Botón "Nuevo proveedor" visible | ADMIN | Visible | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-SUP-02 | Botón "Nuevo proveedor" visible | MANAGER | Visible | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-SUP-03 | Botón "Nuevo proveedor" NO visible | WAREHOUSEMAN | Ausente del DOM | ⏳ PENDIENTE | Verificado con test_wh — botón ausente (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-SUP-04 | Lista carga correctamente | WAREHOUSEMAN | Tabla con proveedores | ⏳ PENDIENTE | 58 filas visibles para WAREHOUSEMAN (Re-test 2026-06-10; anterior: ✅ PASS) |

### 1d. Estados vacíos

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| EMPTY-SUP-01 | Lista sin proveedores activos | ADMIN | Ícono camión + "Sin proveedores registrados" | ⏳ PENDIENTE | No reproducible: BD siempre tiene proveedores activos (Re-test 2026-06-10; anterior: N/A) |
| EMPTY-SUP-02 | Búsqueda sin resultados | ADMIN | Ícono camión + 'Sin resultados para "X"' | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |

---

## 2. Catálogo de proveedores — Formulario en diálogo (`SupplierDialogComponent` + `SupplierFormComponent`)

### 2a. Apertura del diálogo

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-SUP-01 | Click en fila de proveedor → abre diálogo | ADMIN | Lista cargada | Diálogo abre con datos del proveedor | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-SUP-02 | Diálogo muestra todos los campos | ADMIN | Proveedor con todos los datos | RFC, Razón social, Contacto, Teléfono, Email, Dirección | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-SUP-03 | Auditoría visible: "Creado por X" y "Actualizado por Y" | ADMIN | Proveedor editado previamente | Sección de auditoría con íconos | ⏳ PENDIENTE | Verificado: "Creado por admin / Actualizado por admin" (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-SUP-04 | Botón "Nuevo proveedor" → diálogo vacío con título "Nuevo proveedor" | ADMIN | — | Todos los campos vacíos | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-SUP-05 | Botón Cancelar cierra el diálogo sin guardar | ADMIN | Diálogo abierto con cambios | Diálogo cierra; lista no cambia | ⏳ PENDIENTE | Verificado: cierra sin modificar la lista (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-SUP-06 | Click fuera del diálogo lo cierra | ADMIN | Diálogo abierto | Diálogo cierra (dialog sin disableClose) | ⏳ PENDIENTE | Material Dialog sin disableClose cierra con backdrop click (Re-test 2026-06-10; anterior: ✅ PASS) |

### 2b. RBAC en formulario

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-SUP-05 | Título diálogo en edición | ADMIN | "Editar proveedor" | ⏳ PENDIENTE | BUG-M3-08 corregido (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-SUP-06 | Título diálogo en edición | MANAGER | "Editar proveedor" | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-SUP-07 | Título diálogo en edición | WAREHOUSEMAN | "Ver proveedor" | ⏳ PENDIENTE | BUG-M3-08 corregido (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-SUP-08 | Formulario editable | ADMIN | Todos los campos habilitados; Guardar + Desactivar visibles | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-SUP-09 | Botón Desactivar NO visible | MANAGER | Solo Guardar, sin Desactivar | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-SUP-10 | Formulario de solo lectura | WAREHOUSEMAN | Campos deshabilitados; sin Guardar ni Desactivar | ⏳ PENDIENTE | Todos los inputs disabled:true; solo botón "Cancelar" (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-SUP-11 | Proveedor nuevo: WAREHOUSEMAN no tiene botón "Nuevo proveedor" | WAREHOUSEMAN | Botón ausente; no puede abrir diálogo nuevo | ⏳ PENDIENTE | Confirmado junto con RBAC-SUP-03 (Re-test 2026-06-10; anterior: ✅ PASS) |

### 2c. Validaciones del formulario

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-SUP-01 | RFC vacío al intentar guardar | Formulario vacío | Error "El RFC es obligatorio" visible bajo el campo | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-SUP-02 | RFC con 11 caracteres (< mínimo 12) | RFC = "ABC12345678" | Error "El RFC debe tener al menos 12 caracteres" | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-SUP-03 | RFC con 14 caracteres (> máximo 13) | Intentar escribir 14 chars | El campo no acepta más de 13 caracteres | ⏳ PENDIENTE | maxlength="13" en DOM — tecla adicional ignorada (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-SUP-04 | Razón social vacía | Campo vacío | Error "La razón social es obligatoria" | ⏳ PENDIENTE | Capturado al tabear tras RFC incompleto (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-SUP-05 | Email con formato inválido ("notanemail") | Email inválido | Error "Formato de correo inválido" | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-SUP-06 | Botón Guardar deshabilitado con formulario inválido | RFC vacío | Botón Guardar deshabilitado (no clickeable) | ⏳ PENDIENTE | disabled:true confirmado en DOM (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-SUP-07 | Botón Guardar habilitado con formulario válido | RFC (13 chars) y razón social rellenos | Botón habilitado | ⏳ PENDIENTE | disabled:false confirmado en DOM (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-SUP-08 | Botón se deshabilita durante el guardado (loading) | Click en Guardar | Botón deshabilitado mientras carga | ⏳ PENDIENTE | `[disabled]="loading"` en código; operación muy rápida en local (Re-test 2026-06-10; anterior: ✅ PASS) |

### 2d. CRUD — Crear proveedor

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-SUP-01 | Crear proveedor con todos los datos válidos | Formulario completo correcto | Snackbar verde "Proveedor creado correctamente." (3s) | ⏳ PENDIENTE | snackbar-success + #2E7D32 confirmados (Re-test 2026-06-10; anterior: ✅ PASS) |
| CRUD-SUP-02 | Diálogo cierra después de crear | Crear exitoso | Diálogo cierra | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| CRUD-SUP-03 | Lista se recarga y muestra el nuevo proveedor | Crear exitoso | RFC del nuevo proveedor visible en la lista | ⏳ PENDIENTE | RFC "ABCDE1234567X" visible inmediatamente (Re-test 2026-06-10; anterior: ✅ PASS) |
| CRUD-SUP-04 | Crear proveedor con RFC duplicado | RFC ya existe en BD | Snackbar rojo con mensaje del backend (409) | ⏳ PENDIENTE | "Ya existe un proveedor con el RFC 'X'." — BUG-M3-13 también detectado y corregido aquí (Re-test 2026-06-10; anterior: ✅ PASS) |

### 2e. CRUD — Editar proveedor

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-SUP-05 | Editar razón social de un proveedor existente | Proveedor activo | Snackbar verde "Proveedor actualizado correctamente." | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| CRUD-SUP-06 | Lista refleja los cambios después de editar | Editar exitoso | Datos actualizados en la tabla sin recargar la página | ⏳ PENDIENTE | Fila "(Editado)" visible inmediatamente (Re-test 2026-06-10; anterior: ✅ PASS) |

### 2f. CRUD — Desactivar proveedor

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-SUP-07 | Click en Desactivar → aparece diálogo de confirmación | Proveedor activo (ADMIN) | Modal con "¿Desactivar a X?", botones Desactivar/Cancelar | ⏳ PENDIENTE | Modal encima del diálogo de edición (Re-test 2026-06-10; anterior: ✅ PASS) |
| CRUD-SUP-08 | Cancelar en diálogo de confirmación | Diálogo abierto | No se desactiva; diálogo cierra; proveedor sigue activo | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| CRUD-SUP-09 | Confirmar desactivación de proveedor sin órdenes activas | Proveedor sin PENDING/APPROVED | Snackbar verde "Proveedor desactivado."; proveedor desaparece de lista | ⏳ PENDIENTE | Proveedor "ABCDE1234567X" desactivado exitosamente (Re-test 2026-06-10; anterior: ✅ PASS) |
| CRUD-SUP-10 | Intentar desactivar proveedor con órdenes PENDING/APPROVED | Proveedor con orden activa | Snackbar rojo con mensaje del backend 422 | ⏳ PENDIENTE | "No se puede desactivar el proveedor: tiene órdenes de compra en estado PENDING o APPROVED..." — #C62828 (Re-test 2026-06-10; anterior: ✅ PASS) |

---

## 3. Lista de órdenes de compra (`purchase-orders-page`)

### 3a. Visual y estructura

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-ORD-01 | Cuatro pestañas: Pendientes, Aprobadas, Recibidas, Canceladas | ADMIN | Pestañas visibles y funcionales | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-ORD-02 | Badge de cantidad en pestaña cuando hay órdenes | ADMIN | Número junto al nombre de la pestaña | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-ORD-03 | Sin ícono `open_in_new` en la columna de acciones | ADMIN | Solo acciones de negocio (Aprobar/Recibir/Cancelar) | ⏳ PENDIENTE | Removido en este ciclo (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-ORD-04 | Columna Total visible para ADMIN | ADMIN | Total en MXN visible | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-ORD-05 | Columna Total ausente para WAREHOUSEMAN | WAREHOUSEMAN | Columna Total no aparece | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-ORD-06 | Badge de estado con colores semánticos correctos | ADMIN | PENDING=naranja, APPROVED=azul, RECEIVED=verde, CANCELLED=rojo | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-ORD-07 | N° de orden en estilo monoespaciado morado | ADMIN | Fuente monospace, color #6B3C6B | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |

### 3b. Búsqueda

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| BSRCH-ORD-01 | Buscar por N° de orden parcial | ADMIN | Órdenes en la pestaña activa | Filtra correctamente | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| BSRCH-ORD-02 | Buscar por proveedor sin acento | ADMIN | Proveedor con acento en su nombre | Encuentra (accent insensitive) | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| BSRCH-ORD-03 | Buscar por usuario creador | ADMIN | Órdenes de distintos usuarios | Filtra por username | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| BSRCH-ORD-04 | Limpiar búsqueda con botón X | ADMIN | Campo con valor | Lista restaurada; botón X visible solo con texto | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| BSRCH-ORD-05 | Búsqueda sin resultados | ADMIN | Término inexistente | Estado vacío con 'Sin resultados para "X"' | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |

### 3c. RBAC en lista

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-ORD-01 | Botón "Nueva orden" visible | ADMIN | Visible | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-ORD-02 | Botón "Nueva orden" visible | MANAGER | Visible | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-ORD-03 | Botón "Nueva orden" NO visible | WAREHOUSEMAN | Ausente | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-ORD-04 | Acciones en PENDING: Aprobar + Cancelar | ADMIN/MANAGER | Ambos íconos visibles | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-ORD-05 | Acciones en PENDING: sin botones para WAREHOUSEMAN | WAREHOUSEMAN | Sin Aprobar ni Cancelar | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-ORD-06 | Acciones en APPROVED: Recibir + Cancelar para ADMIN/MANAGER | ADMIN | Ambos visibles | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-ORD-07 | Acciones en APPROVED: solo Recibir para WAREHOUSEMAN | WAREHOUSEMAN | Solo Recibir, sin Cancelar | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-ORD-08 | Sin acciones en RECEIVED y CANCELLED (todos los roles) | ADMIN | Celda de acciones vacía | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |

### 3d. Acciones en filas

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-ORD-01 | Click en fila navega a `/purchases/orders/{id}` | ADMIN | Orden en cualquier estado | Navegación correcta al detalle | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-ORD-02 | Ícono Aprobar en PENDING | ADMIN | Orden PENDING | Abre diálogo de confirmación | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-ORD-03 | Ícono Cancelar en PENDING | ADMIN | Orden PENDING | Abre diálogo de confirmación con campo motivo | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-ORD-04 | Ícono Recibir en APPROVED | WAREHOUSEMAN | Orden APPROVED | Abre diálogo de confirmación | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-ORD-05 | Ícono Cancelar en APPROVED | MANAGER | Orden APPROVED | Abre diálogo de confirmación | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |

### 3e. Estados vacíos

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| EMPTY-ORD-01 | Pestaña Pendientes sin órdenes | Ícono receipt + "Sin órdenes pendientes" | ⏳ PENDIENTE | Verificado (no había pending) (Re-test 2026-06-10; anterior: ✅ PASS) |
| EMPTY-ORD-02 | Búsqueda sin resultados en lista | 'Sin resultados para "X"' | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |

### 3f. Paginación

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| UI-ORD-06 | Paginador visible cuando hay > pageSize órdenes | > 10 órdenes en pestaña Recibidas | Paginador con total, opciones 10/20/50 | ⏳ PENDIENTE | Verificado en Recibidas con 41 (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-ORD-07 | Cambio de página carga página correcta | Paginador visible | Filas cambian al hacer clic en página 2 | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |

---

## 4. Detalle de orden — Nueva orden (`purchase-order-detail-page` modo creación)

### 4a. Visual

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-DET-01 | Título "Nueva orden de compra" | ADMIN | H1 con ese texto | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-DET-02 | Selector de proveedor con `*` (obligatorio) | ADMIN | `mat-select` con label "Proveedor*" | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-DET-03 | Campo Notas opcional visible | ADMIN | `textarea` sin `*` | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-DET-04 | Sección "Líneas de detalle" con botón "Agregar línea" | ADMIN | Sección visible; botón habilitado | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-DET-05 | Panel "Historial de estado" a la derecha | ADMIN | Panel visible con estados vacíos | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |

### 4b. Validaciones de cabecera

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-DET-01 | Intentar guardar sin proveedor | Formulario vacío | Botón "Guardar orden" deshabilitado | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-DET-02 | Intentar guardar sin líneas de detalle | Proveedor seleccionado, sin líneas | Botón deshabilitado o error al intentar | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-DET-03 | Selector de proveedores carga la lista activa | — | Lista de proveedores activos sin los inactivos | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |

### 4c. CRUD — Crear orden

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-DET-01 | Crear orden con proveedor + 1 línea | Datos válidos | Navega a detalle con N° orden asignado (OC-YYYY-NNNN) | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| CRUD-DET-02 | Snackbar de confirmación al crear | Crear exitoso | Snackbar verde "Orden creada correctamente." | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |

### 4d. RBAC — acceso a nueva orden

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-DET-01 | WAREHOUSEMAN intenta acceder a `/purchases/orders/new` directamente | WAREHOUSEMAN | Redirige; acceso denegado | ⏳ PENDIENTE | BUG-M3-14 corregido — agregado canActivate+roles en purchases.routes.ts (Re-test 2026-06-10; anterior: ✅ PASS) |

---

## 5. Detalle de orden — Orden existente

### 5a. Visual

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| VIS-DET-06 | Título muestra N° orden | ADMIN | Orden existente | "OC-2026-XXXX" visible como título | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-DET-07 | Badge de estado PENDING color naranja | ADMIN | Orden PENDING | Badge "#E65100" | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-DET-08 | Badge de estado APPROVED color azul | ADMIN | Orden APPROVED | Badge "#1565C0" | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-DET-09 | Badge de estado RECEIVED color verde | ADMIN | Orden RECEIVED | Badge "#2E7D32" | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-DET-10 | Badge de estado CANCELLED color rojo | ADMIN | Orden CANCELLED | Badge "#C62828" | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-DET-11 | Historial de estado muestra pasos completados y pendientes | ADMIN | Orden APPROVED | Creada ✓, Aprobada ✓, Recibida (pendiente) | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-DET-12 | Tabla de detalles: SKU, Producto, Cantidad, Precio unitario, Subtotal, Acciones | ADMIN | Orden con líneas | Todas las columnas presentes | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-DET-13 | Fila TOTAL al pie de tabla | ADMIN | Orden con líneas | Total general calculado correctamente | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-DET-14 | Precio unitario y Total visibles | ADMIN/MANAGER | Orden cualquier estado | Columna precio y total visibles | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-DET-15 | Precio unitario AUSENTE del DOM | WAREHOUSEMAN | Orden cualquier estado | Columna precio no renderizada | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |

### 5b. Botones en detalle de orden

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-DET-01 | Botón ← (regresar) navega a la lista | ADMIN | Detalle abierto | Navega a `/purchases/orders` | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-DET-02 | Botón "Aprobar" visible en PENDING | ADMIN/MANAGER | Orden PENDING | Botón "Aprobar" visible y clickeable | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-DET-03 | Botón "Cancelar orden" visible en PENDING y APPROVED | ADMIN/MANAGER | Orden PENDING o APPROVED | Botón visible | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-DET-04 | Botón "Recibir mercancía" visible en APPROVED | ADMIN/MANAGER/WAREHOUSEMAN | Orden APPROVED | Botón visible | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-DET-05 | Sin botones de acción en RECEIVED | ADMIN | Orden RECEIVED | Ni Aprobar, Recibir ni Cancelar | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-DET-06 | Sin botones de acción en CANCELLED | ADMIN | Orden CANCELLED | Ningún botón de cambio de estado | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-DET-07 | "Agregar línea" SOLO visible en PENDING | ADMIN | Orden PENDING | Botón visible | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-DET-08 | "Agregar línea" NO visible en APPROVED/RECEIVED/CANCELLED | ADMIN | Orden APPROVED | Botón ausente | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-DET-09 | Íconos editar/eliminar en líneas SOLO en PENDING | ADMIN | Orden PENDING | Íconos de acción en cada línea | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-DET-10 | Íconos editar/eliminar AUSENTES en APPROVED | ADMIN | Orden APPROVED | Sin íconos de edición en líneas | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |

### 5c. Flujos de estado

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| FLOW-DET-01 | Aprobar orden PENDING desde detalle | ADMIN | Orden PENDING | Diálogo confirmación → snackbar verde → badge cambia a "Aprobada" | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| FLOW-DET-02 | Cancelar confirmación de aprobación | ADMIN | Diálogo confirmación abierto | No se aprueba; badge permanece PENDING | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| FLOW-DET-03 | Recibir orden APPROVED desde detalle | WAREHOUSEMAN | Orden APPROVED | Diálogo confirmación → snackbar verde → badge "Recibida" | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| FLOW-DET-04 | Cancelar orden PENDING desde detalle | MANAGER | Orden PENDING | Diálogo con motivo → snackbar verde → badge "Cancelada" | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| FLOW-DET-05 | Cancelar orden APPROVED desde detalle | MANAGER | Orden APPROVED | Igual que anterior | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| FLOW-DET-06 | Cancelar confirmación de cancelar | ADMIN | Diálogo cancelar abierto | No se cancela | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| FLOW-DET-07 | Editar proveedor/notas de orden en PENDING y guardar | ADMIN | Orden PENDING | Cambios guardados; snackbar verde | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| FLOW-DET-08 | Aprobar orden con 0 líneas de detalle | ADMIN | Orden PENDING sin líneas | Backend rechaza; snackbar rojo | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |

### 5d. Reglas de negocio

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RN-DET-01 | Editar campos de orden en estado APPROVED | ADMIN | Orden APPROVED | Campos proveedor y notas deshabilitados | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| RN-DET-02 | Editar campos de orden en estado RECEIVED | ADMIN | Orden RECEIVED | Campos deshabilitados | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| RN-DET-03 | Proveedor seleccionado muestra solo activos | ADMIN | Nueva orden | Dropdown sin proveedores inactivos | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |

---

## 6. Líneas de detalle (`purchase-order-detail-form`)

### 6a. Formulario de nueva línea

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| UI-LIN-01 | Botón "+ Agregar línea" muestra el formulario inline | Orden PENDING | Formulario aparece en la sección de detalles | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-LIN-02 | Autocomplete se abre al escribir en campo Producto | Formulario abierto | Panel con opciones visible | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-LIN-03 | Autocompletado muestra: `[SKU]` `Nombre`   `disponible: N` | Escribir término | Formato con espacio visual entre nombre y disponible | ⏳ PENDIENTE | Espaciado corregido (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-LIN-04 | "disponible: N" muestra `availableStock` (no `currentStock`) | Producto con reservas | Valor correcto | ⏳ PENDIENTE | Campo verificado (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-LIN-05 | "disponible: N" en naranja cuando stock bajo | Producto con availableStock ≤ minimumStock | Texto en color #E65100 | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-LIN-06 | Seleccionar producto rellena precio unitario automáticamente | Producto con precio | Campo "Precio unitario" se completa | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-LIN-07 | Subtotal se calcula en tiempo real (cantidad × precio) | Cantidad y precio rellenos | Valor de subtotal actualizado al cambiar qty o precio | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-LIN-08 | Producto ya en la orden aparece deshabilitado en el autocomplete | Línea ya guardada | Opción gris y no seleccionable | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |

### 6b. Búsqueda de producto

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| BSRCH-LIN-01 | Buscar por SKU parcial | Formulario abierto | Opciones que contienen el SKU | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| BSRCH-LIN-02 | Buscar por nombre parcial sin acento ("galon") | Producto "Galón" en BD | Encuentra "Galón" | ⏳ PENDIENTE | Verificado en browser (Re-test 2026-06-10; anterior: ✅ PASS) |
| BSRCH-LIN-03 | Buscar con mayúsculas | Nombre del producto en minúsculas | Encuentra (case insensitive) | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |

### 6c. Validaciones del formulario de línea

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-LIN-01 | Intentar agregar sin seleccionar producto | Campo vacío | Botón "Agregar" deshabilitado | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-LIN-02 | Escribir en autocomplete sin seleccionar opción | Texto escrito, sin clic en opción | Botón "Agregar" deshabilitado (no hay selectedProduct) | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-LIN-03 | Cantidad vacía | Campo borrado | Error "Obligatorio" | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-LIN-04 | Cantidad = 0 | Campo con 0 | Error "Mínimo 1" | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-LIN-05 | Cantidad negativa | Campo con -1 | Error "Mínimo 1" | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-LIN-06 | Precio unitario vacío | Campo borrado | Error "Obligatorio" | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-LIN-07 | Precio = 0 | Campo con 0 | Error "Debe ser mayor a cero" | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-LIN-08 | Precio negativo | Campo con -1 | Error "Debe ser mayor a cero" | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |

### 6d. CRUD — Líneas

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-LIN-01 | Agregar línea válida | Producto + cantidad + precio | Línea aparece en la tabla de detalles | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| CRUD-LIN-02 | Cancelar formulario de nueva línea | Formulario con datos | Formulario desaparece; tabla no cambia | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| CRUD-LIN-03 | Editar línea existente — campo Producto muestra "[SKU] — Nombre" | Orden PENDING con línea | No muestra "undefined" | ⏳ PENDIENTE | BUG-M3-12 corregido (Re-test 2026-06-10; anterior: ✅ PASS) |
| CRUD-LIN-04 | Editar cantidad de línea existente | Línea con cantidad 1 | Cambiar a 5, guardar; tabla se actualiza | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| CRUD-LIN-05 | Editar precio de línea existente | Línea con precio X | Cambiar precio, guardar; subtotal y total se actualizan | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| CRUD-LIN-06 | Cancelar edición de línea | Formulario de edición abierto con cambios | Datos originales sin modificar | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| CRUD-LIN-07 | Eliminar línea — aparece diálogo de confirmación | Línea en tabla | Modal "¿Eliminar esta línea?" | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| CRUD-LIN-08 | Confirmar eliminar línea | Diálogo abierto | Línea desaparece; total recalculado | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| CRUD-LIN-09 | Cancelar eliminar línea | Diálogo abierto | Línea permanece; tabla sin cambios | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |

---

## 7. Mensajes de error y éxito

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| ERR-01 | Snackbar de éxito: fondo verde, color #2E7D32 | Crear proveedor exitoso | Snackbar con panelClass "snackbar-success" | ⏳ PENDIENTE | #2E7D32 verificado con CSS var (Re-test 2026-06-10; anterior: ✅ PASS) |
| ERR-02 | Snackbar de error: fondo rojo, color #C62828 | Error del backend | Snackbar con panelClass "snackbar-error" | ⏳ PENDIENTE | BUG-M3-13 corregido — era 'snack-error' → 'snackbar-error' (Re-test 2026-06-10; anterior: ✅ PASS) |
| ERR-03 | RFC duplicado → mensaje del backend visible (no mensaje genérico) | Crear con RFC existente | Mensaje específico del backend en snackbar | ⏳ PENDIENTE | "Ya existe un proveedor con el RFC 'X'." (Re-test 2026-06-10; anterior: ✅ PASS) |
| ERR-04 | Desactivar con órdenes activas → mensaje 422 visible | Proveedor con PENDING/APPROVED | Mensaje específico en snackbar | ⏳ PENDIENTE | Mensaje completo del backend visible (Re-test 2026-06-10; anterior: ✅ PASS) |
| ERR-05 | Error de red → mensaje genérico útil (no "undefined") | Backend apagado | Snackbar con "Error al cargar proveedores" | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| ERR-06 | Snackbar de éxito al crear orden | Orden creada | "Orden creada correctamente." | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| ERR-07 | Snackbar de éxito al aprobar | Orden aprobada | "Orden aprobada." | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| ERR-08 | Snackbar de éxito al recibir | Orden recibida | "Mercancía recibida." | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| ERR-09 | Snackbar de éxito al cancelar | Orden cancelada | "Orden cancelada." | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| ERR-10 | Progress bar durante carga de lista | Navegar a /purchases/suppliers | Barra indeterminada visible mientras carga | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| ERR-11 | Error HTTP 401 → redirige a login con mensaje "sesión expirada" | JWT expirado durante uso | Snackbar/alerta + redirect a /login?reason=expired | ⏳ PENDIENTE | Verificado durante la sesión de pruebas (Re-test 2026-06-10; anterior: ✅ PASS) |
| ERR-12 | Error HTTP 403 → mensaje "Acceso denegado" | Rol sin permiso | Snackbar de error visible | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |

---

## 8. Visual — Estética y dimensiones

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| VIS-GEN-01 | Sidebar colapsado al entrar a compras | `layoutService.collapse()` ejecutado | ⏳ PENDIENTE | Verificado en ambas páginas (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-GEN-02 | Breadcrumb muestra "Compras → Proveedores" | Texto correcto en topbar | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-GEN-03 | Breadcrumb muestra "Compras → Órdenes de compra" | Texto correcto | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-GEN-04 | Diálogo de proveedor tiene ancho ~640px | Abrir en pantalla 1280px | Diálogo no ocupa toda la pantalla | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-GEN-05 | Diálogo de proveedor se adapta en pantalla pequeña (maxWidth: 95vw) | Viewport < 640px | Diálogo se comprime | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-GEN-06 | Header de tabla proveedores con color #F2E4F2 | Abrir lista | Fondo lavanda en cabecera | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-GEN-07 | Texto RFC en monospace color #6B3C6B | Lista de proveedores | Fuente y color correctos | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-GEN-08 | Botón primario con color #6B3C6B | "Nuevo proveedor" / "Nueva orden" | Color de brand correcto | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-GEN-09 | Campo de búsqueda tiene ícono lupa como suffix/prefix | Ambas páginas | Ícono `search` visible | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-GEN-10 | Espaciado "disponible: N" separado del nombre del producto | Autocomplete de producto | Margen izquierdo visible | ⏳ PENDIENTE | Corregido en este ciclo (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-GEN-11 | Subtotal del formulario de línea en card #F2E4F2 | Formulario línea con datos | Card con fondo lavanda | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-GEN-12 | Diálogos de confirmación son modales (no se cierra con click fuera) | Diálogo de desactivar/cancelar | Click fuera no cierra | ⏳ PENDIENTE | Confirmado durante prueba CRUD-SUP-08 (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-GEN-13 | Botones destructivos (Desactivar, Cancelar orden) son de color `warn` | Inspección visual | Color rojo mat-warn | ⏳ PENDIENTE | Verificado visualmente en screenshot (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-GEN-14 | `mat-progress-bar` visible durante carga (no spinner centrado) | Carga de datos | Barra en parte superior del panel | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |

---

## 9. Validaciones de ciberseguridad (CYBER)

> Casos nuevos agregados en la ronda de re-validación 2026-06-10 (solicitados explícitamente
> por el usuario). Cubren OWASP Top 10 aplicable al stack Angular + Spring Boot + JWT +
> PostgreSQL, con foco en los endpoints y campos sensibles del módulo Compras (`unitCost`,
> `totalAmount`, RFC, datos de proveedores, JWT, roles, máquina de estados de órdenes).
> Ejecutar con DevTools (Network/Console/Application→LocalStorage) y, donde se indique,
> con `curl` contra `http://localhost:8080/api/v1/...`.
>
> ⚠️ Si algún caso falla, **documentar el bug en §10 con estado ABIERTO — no corregir sin
> autorización.**

### 9.0 Mapeo contra OWASP ASVS v4 — Nivel 1 (L1)

| Caso | Requisito ASVS L1 | Categoría ASVS |
|---|---|---|
| CYBER-01 | V8.3.4 — datos sensibles no expuestos innecesariamente al cliente | V8 — Data Protection |
| CYBER-02 | V4.1.1/V4.1.3 — control de acceso aplicado en el servidor, no en el cliente | V4 — Access Control |
| CYBER-03 | V3.3 — terminación de sesión efectiva | V3 — Session Management |
| CYBER-04 | V5.3.4 — prevención de inyección SQL | V5 — Validation, Sanitization, Encoding |
| CYBER-05 | V5.3.3 — codificación de salida / prevención de XSS almacenado | V5 — Validation, Sanitization, Encoding |
| CYBER-06 | V5.3.3 — codificación de salida / prevención de XSS reflejado | V5 — Validation, Sanitization, Encoding |
| CYBER-07 | V4.2 / OWASP API3:2023 — autorización a nivel de campo (`unitPrice`/`totalAmount`) | V4 — Access Control |
| CYBER-08 | V4.1.1 — todo endpoint requiere autenticación | V4 — Access Control |
| CYBER-09 | V4.1.3 — sin bypass de control de acceso vía API directa | V4 — Access Control |
| CYBER-10 | V7.4.1 — mensajes de error genéricos, sin información sensible | V7 — Error Handling and Logging |
| CYBER-11 | V3.3 — expiración de sesión | V3 — Session Management |
| CYBER-12 | V4.2.1 / decision table de estados — sin transición de estado inválida vía API | V4 — Access Control |
| CYBER-13 | V14.5 — configuración CORS restringida | V14 — Configuration |
| CYBER-14 | V5.3.3 — manejo seguro de caracteres especiales | V5 — Validation, Sanitization, Encoding |
| CYBER-15 *(nuevo)* | V5.1.3 — validación de entrada también en el backend, independiente del frontend | V5 — Validation, Sanitization, Encoding |

> Requisitos ASVS L1 cubiertos a nivel global en `casos_de_prueba_modulo_inventario_DRAFT.md`
> (no se duplican aquí): V14.4 (cabeceras HTTP — CYBER-18), V2.2.1 (rate limiting login —
> CYBER-19), V3.3.1/V8.2.3 (logout — CYBER-20), V3.5.3 (firma JWT — CYBER-22).

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| CYBER-01 | El JWT decodificado no contiene contraseña ni datos sensibles del proveedor en el payload | ADMIN | Sesión activa | Claims limitados a `sub`, `roles`, `iat`, `exp` | ⏳ PENDIENTE | |
| CYBER-02 | SALES (sin acceso al módulo) intenta acceder a `/purchases/suppliers` y `/purchases/orders` con su propio JWT manipulado para incluir `ROLE_ADMIN` | SALES | Editar el JWT en `localStorage` | El backend rechaza con 401/403 al primer request a `/api/v1/purchases/...`; frontend redirige sin mostrar datos de compras | ⏳ PENDIENTE | Complementa SEC-01..04 (que prueban con el JWT real de SALES sin manipular) |
| CYBER-03 | Eliminar el JWT de `localStorage` con la sesión activa en `/purchases/orders` y recargar | ADMIN | Sesión activa | Redirige a `/login`; peticiones siguientes devuelven 401 | ⏳ PENDIENTE | |
| CYBER-04 | Inyección SQL en búsqueda de proveedores y órdenes: `' OR '1'='1`, `'; DROP TABLE suppliers;--` | ADMIN | Campos de búsqueda de proveedores y de órdenes | Sin error 500; texto tratado como literal; tablas `suppliers`/`purchase_orders` intactas | ⏳ PENDIENTE | |
| CYBER-05 | XSS almacenado: crear proveedor con razón social `<script>alert(1)</script>` o notas de orden con `<img src=x onerror=alert(1)>` | ADMIN | Formulario Nuevo proveedor / Notas de orden | Se guarda como texto; al listar/ver detalle se muestra escapado, sin ejecutar script | ⏳ PENDIENTE | |
| CYBER-06 | XSS reflejado vía query param: `/purchases/orders?search=<img src=x onerror=alert(1)>` | ADMIN | URL manual con payload | El valor se usa como texto; ningún script se ejecuta | ⏳ PENDIENTE | |
| CYBER-07 | Respuesta JSON de `GET /purchases/orders` NO incluye `unitPrice`/`totalAmount` para WAREHOUSEMAN | WAREHOUSEMAN | DevTools → Network, inspeccionar response body | Campos de precio/total ausentes del JSON (no solo ocultos en UI) | ⏳ PENDIENTE | Complementa VIS-DET-15 (UI) verificando el contrato real |
| CYBER-08 | Acceso directo a la API sin token: `curl http://localhost:8080/api/v1/purchases/suppliers` | (sin JWT) | Backend corriendo | HTTP 401 Unauthorized | ⏳ PENDIENTE | |
| CYBER-09 | WAREHOUSEMAN intenta vía `curl` con su JWT: `POST /purchases/orders` (crear orden) y `PATCH /purchases/orders/{id}/approve` | WAREHOUSEMAN | Token JWT válido de WAREHOUSEMAN | HTTP 403 Forbidden en ambos — WAREHOUSEMAN solo puede recibir (`/receive`), no crear ni aprobar | ⏳ PENDIENTE | Verificación a nivel API de RBAC-ORD-03/05/07 |
| CYBER-10 | Mensajes de error del backend no exponen stack traces, rutas ni nombres de tablas/clases internas | ADMIN | Forzar error (RFC duplicado, payload malformado en línea de orden) | Mensaje de negocio legible; sin trazas Java/SQL en el snackbar ni en el body de respuesta | ⏳ PENDIENTE | |
| CYBER-11 | Token JWT expirado durante edición de una orden → al guardar, la sesión expira | ADMIN | JWT expirado (>2h) | HTTP 401/403; redirige a `/login` con mensaje de sesión expirada; cambios no guardados sin corromper la orden | ⏳ PENDIENTE | |
| CYBER-12 | Transición de estado inválida forzada vía API: `PATCH /purchases/orders/{id}/receive` sobre una orden en estado `PENDING` (no `APPROVED`) | ADMIN | Orden en PENDING, request manual | HTTP 422/409 con mensaje de regla de negocio; estado de la orden NO cambia | ⏳ PENDIENTE | Verifica que la máquina de estados se valida en backend, no solo ocultando botones en UI |
| CYBER-13 | Cabeceras CORS de la API no permiten `Access-Control-Allow-Origin: *` con `Access-Control-Allow-Credentials: true` | — | `curl -I` con header `Origin` arbitrario | Configuración CORS restringida (no wildcard + credentials) | ⏳ PENDIENTE | Mismo caso que en Inventario — verificar una sola vez a nivel de configuración global. Verificado 2026-06-10: `SecurityConfig.java` usa `setAllowedOriginPatterns(List.of("*"))` + `setAllowCredentials(true)` — Spring refleja el `Origin` recibido, permitiendo credenciales desde CUALQUIER origen. Se espera que este caso documente el hallazgo (FAIL/⚠️ ABIERTO), no que sea un falso positivo |
| CYBER-14 | Caracteres especiales HTML (`"`, `<`, `>`, `&`) en campo RFC/notas no rompen el layout ni inyectan atributos | ADMIN | Campo notas de orden con `"><svg onload=alert(1)>` | Caracteres tratados como texto literal; sin alteración del DOM fuera del campo | ⏳ PENDIENTE | |
| CYBER-15 | Validación server-side de líneas de orden independiente del cliente: `POST /purchases/orders/{id}/details` vía curl con `quantity: -5` o `unitPrice: -100`, evitando los `Validators` de Angular | ADMIN | Token JWT válido de ADMIN, orden PENDING, request manual (Postman/curl) con payload inválido | HTTP 400/422 — el backend rechaza el payload aunque el frontend nunca lo hubiera enviado así; el total de la orden no cambia | ⏳ PENDIENTE | NUEVO (mapeo OWASP ASVS L1 2026-06-10) — ASVS V5.1.3; complementa VAL-LIN-04/05/07/08 |

---

## 10. Historial de bugs encontrados en este módulo

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

> Cualquier bug NUEVO encontrado durante la re-validación (incluidos los hallazgos de la
> sección CYBER) se agrega aquí con estado `⚠️ ABIERTO` y referencia al ID del caso que lo
> detectó. No se corrige sin autorización del usuario.

---

## Checklist de cierre (Propuesta D)

Antes de declarar el módulo **done**, verificar que se cumplen las 4 condiciones:

```
[ ] 1. Los 170 casos de este documento (155 originales + 14 CYBER + 1 CYBER de mapeo ASVS L1)
       tienen estado ✅ PASS — ninguna fila ⏳ PENDIENTE
[ ] 2. ng test --no-watch → 0 fallos; cobertura ≥ 70% statements (re-confirmar valor actual)
[ ] 3. Prueba browser completa de los 169 casos con ADMIN, MANAGER, WAREHOUSEMAN
       (y SALES solo para los casos SEC/CYBER de denegación de acceso)
[ ] 4. Memoria técnica del módulo Compras §10 actualizada con el resultado final de esta ronda
```
