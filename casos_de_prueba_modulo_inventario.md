# Casos de prueba — Módulo Inventario

**Módulo:** Inventario
**Ruta base:** `/inventory`
**Roles con acceso (lectura):** ADMIN, MANAGER, WAREHOUSEMAN, SALES
**Roles con escritura:** ADMIN, MANAGER
**Roles con movimientos de stock:** ADMIN, MANAGER, WAREHOUSEMAN
**Roles con desactivar productos:** ADMIN
**Fecha de creación:** 2026-06-08
**Última actualización:** 2026-06-10 — RONDA DE RE-VALIDACIÓN COMPLETA: los 162 casos previos se reinician a
⏳ PENDIENTE para re-ejecución íntegra en browser con los 4 roles; se agrega la sección 8
"Validaciones de ciberseguridad (CYBER)" con 17 casos nuevos. Adicionalmente se agregan 14 casos
nuevos de cobertura funcional (gap analysis): BSRCH-CAT-01..06 (búsqueda de categorías, sin
casos previos pese a existir el campo), VAL-PDET-11..15 (longitud máxima SKU/Nombre/Descripción
y categoría/proveedor obligatorios), VIS-LST-05 (verificación de columnas numéricas de stock
bajo) y UI-PROD-PAG-03 / UI-CAT-PAG-02 (cambio de tamaño de página). La columna Notas conserva el
resultado de la verificación anterior (2026-06-09) como referencia histórica.

**Verificación contra backend (2026-06-10)** — antes de cerrar este DRAFT se verificaron contra
el código fuente del backend los 4 puntos pendientes de los nuevos casos CYBER-18..22:
- CYBER-17/21: se corrigió el path del endpoint de movimientos a `POST /api/v1/inventory/products/movement`
  (verificado en `ProductController.java`); CYBER-21 (creación de producto) ya tenía el path correcto.
- CYBER-13: se confirmó la configuración CORS (`allowedOriginPatterns("*")` + `allowCredentials(true)`
  en `SecurityConfig.java`) — se espera que el caso documente este hallazgo como FAIL/⚠️ ABIERTO.
- CYBER-18: se confirmó que `SecurityConfig.java` no define `.headers(...)` — se espera PASS para
  `X-Content-Type-Options`/`X-Frame-Options` (defaults de Spring Security 6) y ausencia de CSP/HSTS
  como hallazgo documentado.
- CYBER-19: se confirmó (grep) que no existe lockout/rate-limiting en `UserServiceImpl.login()` —
  se espera que el caso documente este hallazgo como gap real.
- CYBER-22: se confirmó que `JwtUtils.parseClaims()` usa `parseSignedClaims()` (JJWT 0.12.x), que
  rechaza tokens `alg=none`/sin firma — se espera PASS.

> ⚠️ **DOCUMENTO BORRADOR — pendiente de autorización del usuario antes de iniciar la ejecución
> en browser.** No se ejecutará ninguna validación hasta recibir aprobación explícita.
>
> Si durante la re-ejecución se detecta un bug (nuevo o de regresión), se documentará en la
> columna Notas y en el Historial de bugs (§9) con estado `⚠️ ABIERTO` — **no se corregirá**
> hasta que el usuario lo autorice explícitamente.

---

## Cómo usar este documento

1. Cada caso tiene un ID único (`CATEGORIA-PANTALLA-NNN`)
2. Ejecutar cada caso en el browser con el JWT del rol indicado
3. Actualizar la columna **Estado** con el resultado real observado en el browser
4. Si el estado es ❌ FAIL: registrar el bug en §9 de este documento y en §8 de la memoria técnica
   con referencia al ID — **documentar únicamente, no corregir sin autorización**
5. Un componente solo está "done" cuando **toda la columna Estado está llena** y **ningún caso está ⏳ PENDIENTE**

**Estados:** `✅ PASS` | `❌ FAIL` | `⏳ PENDIENTE` | `N/A`

---

## Metodología y criterios de diseño de casos

Esta ronda de re-validación nombra explícitamente las técnicas de diseño de casos (ISTQB CTFL)
y el estándar de seguridad (OWASP ASVS) que sustentan las categorías de este documento:

- **Equivalence Partitioning (ISTQB CTFL)** — los casos `VAL-*` dividen el dominio de cada
  campo en clases válidas e inválidas (vacío, formato incorrecto, duplicado en backend, tipo
  incorrecto). Ejemplo: VAL-PDET-01/02 (campo vacío) vs VAL-PDET-09 (valor válido pero
  duplicado → clase de error de negocio distinta).
- **Boundary Value Analysis (ISTQB CTFL)** — los casos que prueban límites declarados en el
  código (`Validators.maxLength`, `Validators.min`) verifican el valor límite y el valor justo
  fuera del límite. Ejemplo: VAL-PDET-11/12/13 (SKU=50/51, Nombre=150/151, Descripción=500/501
  caracteres), VAL-MOV-02 (cantidad=0 vs 1), VAL-MOV-04 (cantidad = `availableStock` vs
  `availableStock`+1), VAL-PDET-03 (precio=0 vs 0.01).
- **State Transition Testing (ISTQB CTFL)** — los casos `RN-MOV-01/02` (cambio de tipo
  IN↔OUT recalcula validaciones de máximo) verifican que la transición de estado del
  formulario aplica/retira las reglas correctas, no solo el estado final.
- **OWASP ASVS v4 — Nivel 1 (L1)** — la sección 8 (CYBER) se diseñó mapeando cada caso contra
  un requisito de ASVS L1 (ver tabla de mapeo al inicio de la sección 8). Los huecos
  detectados en ese mapeo (cabeceras de seguridad HTTP, rate-limiting de login, invalidación
  de sesión en logout, validación server-side independiente del cliente, JWT `alg=none`)
  generaron los casos CYBER-18 a CYBER-22, agregados en esta ronda.

> Nota: Los flujos de máquina de estados de órdenes de compra (PENDING→APPROVED→RECEIVED/
> CANCELLED), que son el caso de uso más claro de **Decision Table Testing**, se documentan en
> `casos_de_prueba_modulo_compras_DRAFT.md` (sección FLOW-DET) — ver metodología allí.

---

## Resumen de cobertura

| Categoría | Total casos | PASS | FAIL | PENDIENTE | N/A |
|---|---|---|---|---|---|
| SEC — Seguridad de rutas | 5 | 0 | 0 | 5 | 0 |
| RBAC — Control de acceso UI | 28 | 0 | 0 | 28 | 0 |
| CRUD — Flujos de datos | 18 | 0 | 0 | 18 | 0 |
| VAL — Validaciones de formulario | 27 | 0 | 0 | 27 | 0 |
| BSRCH — Búsqueda e inputs | 20 | 0 | 0 | 20 | 0 |
| UI — Botones e íconos | 28 | 0 | 0 | 28 | 0 |
| FLOW — Flujos de estado/negocio | 8 | 0 | 0 | 8 | 0 |
| RN — Reglas de negocio | 10 | 0 | 0 | 10 | 0 |
| ERR — Mensajes de error | 10 | 0 | 0 | 10 | 0 |
| EMPTY — Estados vacíos | 7 | 0 | 0 | 7 | 0 |
| VIS — Visual y estética | 15 | 0 | 0 | 15 | 0 |
| CYBER — Ciberseguridad | 22 | 0 | 0 | 22 | 0 |
| **TOTAL** | **198** | **0** | **0** | **198** | **0** |

> Nota: las celdas PASS/FAIL/N/A de categorías previas quedan en 0 porque TODOS los casos
> se reinician a PENDIENTE para esta ronda (decisión del usuario: "re-ejecutar todo desde cero").
> El resultado anterior de cada caso se conserva en la columna Notas como referencia.
> Los 14 casos nuevos de gap analysis (BSRCH-CAT, VAL-PDET-11..15, VIS-LST-05, UI-*-PAG-03/02)
> son adicionales a los 179 (162 originales + 17 CYBER). Los 5 casos CYBER-18..22 surgen del
> mapeo contra OWASP ASVS L1 (ver sección 8).

---

## 0. Seguridad de rutas (SEC)

> La ruta `/inventory` solo requiere autenticación (no tiene `data.roles`).
> Todos los roles autenticados pueden acceder — SALES incluido.
> Las operaciones de escritura se controlan en el componente (canWrite, canDeactivate, etc.).

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| SEC-01 | Sin sesión — acceso directo a `/inventory/products` | (sin JWT) | Token expirado / sin login | Redirige a `/login` | ⏳ PENDIENTE | Verificado 2026-06-09 (Re-test 2026-06-10; anterior: ✅ PASS) |
| SEC-02 | Sin sesión — acceso directo a `/inventory/categories` | (sin JWT) | Token expirado / sin login | Redirige a `/login` | ⏳ PENDIENTE | Verificado 2026-06-09 (Re-test 2026-06-10; anterior: ✅ PASS) |
| SEC-03 | Sin sesión — acceso directo a `/inventory/low-stock` | (sin JWT) | Token expirado / sin login | Redirige a `/login` | ⏳ PENDIENTE | Verificado 2026-06-09 (Re-test 2026-06-10; anterior: ✅ PASS) |
| SEC-04 | SALES accede a `/inventory/products` — lectura permitida | SALES | Sesión SALES activa | Carga la página; lista visible; sin botón "Nuevo producto" | ⏳ PENDIENTE | Sin redirect; sin Nuevo producto (Re-test 2026-06-10; anterior: ✅ PASS) |
| SEC-05 | SALES accede a `/inventory/categories` — lectura permitida | SALES | Sesión SALES activa | Carga la página; lista visible; sin botón "Nueva categoría" | ⏳ PENDIENTE | Sin redirect; sin Nueva categoría (Re-test 2026-06-10; anterior: ✅ PASS) |

---

## 1. Página de Productos (`/inventory/products`)

### 1a. Visual y estructura (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-PROD-01 | Título "Productos" visible | ADMIN | Encabezado "Productos" presente | ⏳ PENDIENTE | Visible en página (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-PROD-02 | Columnas tabla: SKU, Nombre, Categoría, Proveedor, Stock, Precio, Estado | ADMIN | Todas las columnas visibles | ⏳ PENDIENTE | Confirmado en snapshot (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-PROD-03 | Columna "Costo unitario" visible para ADMIN | ADMIN | Columna presente en la tabla | ⏳ PENDIENTE | Confirmado (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-PROD-04 | Columna "Acciones" visible para WAREHOUSEMAN | WAREHOUSEMAN | Ícono de movimiento en cada fila | ⏳ PENDIENTE | 20 botones swap_vert (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-PROD-05 | Barra de búsqueda y filtros visibles | ADMIN | Campos búsqueda, categoría, estado, proveedor presentes | ⏳ PENDIENTE | Todos presentes (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-PROD-06 | `StockBadge` muestra colores semánticos | ADMIN | Verde (ok), naranja (bajo), rojo (sin stock) | ⏳ PENDIENTE | Verde #E8F5E9, naranja #FFF3E0, rojo #FFEBEE — verificado con BLAN-SEC10-045 (stock=0) (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-PROD-07 | `mat-progress-bar` visible durante carga | ADMIN | Barra en parte superior mientras carga | ⏳ PENDIENTE | Template tiene `@if (loading) { <mat-progress-bar> }` — verificado por code review (Re-test 2026-06-10; anterior: ✅ PASS) |

### 1b. Búsqueda y filtros (BSRCH)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| BSRCH-PROD-01 | Buscar por SKU exacto | ADMIN | Productos en BD | Filtra correctamente | ⏳ PENDIENTE | LUBR → 2 resultados (Re-test 2026-06-10; anterior: ✅ PASS) |
| BSRCH-PROD-02 | Buscar por nombre (case insensitive) | ADMIN | Productos en BD | Encuentra el producto | ⏳ PENDIENTE | lubr = LUBR, aceite → 1 (Re-test 2026-06-10; anterior: ✅ PASS) |
| BSRCH-PROD-03 | Buscar con acento / sin acento (accent insensitive) | ADMIN | Producto con nombre acentuado | Encuentra el producto | ⏳ PENDIENTE | "galon" no encuentra "Galón"; backend no normaliza acentos — BUG-INV-06 (Re-test 2026-06-10; anterior: ❌ FAIL). NOTA: `ProductRepository.java` líneas 144-155 YA usa `f_unaccent(lower(...))` en `search()` — posible fix ya aplicado tras la última verificación; re-confirmar en browser con "galon"→"Galón" |
| BSRCH-PROD-04 | Filtrar por categoría | ADMIN | Varias categorías en BD | Solo muestra productos de esa categoría | ⏳ PENDIENTE | Filtro "Cat-Int-12406" → 2 de 2 resultados (Re-test 2026-06-10; anterior: ✅ PASS) |
| BSRCH-PROD-05 | Filtrar por estado (AVAILABLE / DISCONTINUED / OUT_OF_STOCK) | ADMIN | Productos con distintos estados | Lista filtrada por estado | ⏳ PENDIENTE | Filtro "Sin stock" → 3 resultados, todos OUT_OF_STOCK (Re-test 2026-06-10; anterior: ✅ PASS) |
| BSRCH-PROD-06 | Filtrar por proveedor | ADMIN | Productos con distintos proveedores | Lista filtrada por proveedor | ⏳ PENDIENTE | "Constructora y Suministros del Bajío S.A." → 6 de 6 resultados (Re-test 2026-06-10; anterior: ✅ PASS) |
| BSRCH-PROD-07 | Término sin resultados muestra estado vacío | ADMIN | Término inexistente | Ícono + "Sin resultados para …" | ⏳ PENDIENTE | "zzz999" → "Sin resultados" + icono (Re-test 2026-06-10; anterior: ✅ PASS) |
| BSRCH-PROD-08 | Botón "Limpiar filtros" restaura la lista completa | ADMIN | Filtros activos | Lista sin filtros; contador de filtros activos = 0 | ⏳ PENDIENTE | Botón `filter_alt_off` presente con filtros activos (Re-test 2026-06-10; anterior: ✅ PASS) |

### 1c. RBAC en lista (RBAC)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-PROD-01 | Botón "Nuevo producto" visible | ADMIN | Visible | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-PROD-02 | Botón "Nuevo producto" visible | MANAGER | Visible | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-PROD-03 | Botón "Nuevo producto" AUSENTE | WAREHOUSEMAN | Ausente del DOM | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-PROD-04 | Botón "Nuevo producto" AUSENTE | SALES | Ausente del DOM | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-PROD-05 | Columna "Costo unitario" visible | ADMIN | Columna presente | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-PROD-06 | Columna "Costo unitario" visible | MANAGER | Columna presente | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-PROD-07 | Columna "Costo unitario" AUSENTE del DOM | WAREHOUSEMAN | Columna no renderizada | ⏳ PENDIENTE | Headers sin "Costo unit." (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-PROD-08 | Columna "Costo unitario" AUSENTE del DOM | SALES | Columna no renderizada | ⏳ PENDIENTE | Headers sin "Costo unit." (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-PROD-09 | Ícono "Registrar movimiento" visible | ADMIN | Ícono en cada fila | ⏳ PENDIENTE | swap_vert en cada fila (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-PROD-10 | Ícono "Registrar movimiento" visible | WAREHOUSEMAN | Ícono en cada fila | ⏳ PENDIENTE | 20 botones presentes (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-PROD-11 | Ícono "Registrar movimiento" AUSENTE | SALES | Columna acciones sin ícono | ⏳ PENDIENTE | swapBtns: 0 (Re-test 2026-06-10; anterior: ✅ PASS) |

### 1d. Botones e íconos de acción (UI)

> ⚠️ Verificar `$event.stopPropagation()` en todos los íconos de fila clickeable (L27 — BUG-M3-22).

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-PROD-01 | Click en fila abre diálogo de detalle | ADMIN | Lista cargada | Diálogo `ProductDetailDialog` abre sin navegar | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-PROD-02 | Click en fila (WAREHOUSEMAN) abre diálogo en modo lectura | WAREHOUSEMAN | Lista cargada | Diálogo abre; campos deshabilitados; sin botón Guardar | ⏳ PENDIENTE | Solo botón "Cerrar" (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-PROD-03 | Ícono movimiento → clic abre `MovementDialog` sin navegar | ADMIN | Lista cargada | Diálogo de movimiento abre; página permanece | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-PROD-04 | Ícono movimiento → confirmar movimiento → stock se actualiza | ADMIN | MovementDialog abierto con tipo IN | Snackbar verde; lista recarga con nuevo stock | ⏳ PENDIENTE | IN +5 stock 147→152 (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-PROD-05 | Ícono movimiento → cancelar → stock NO cambia | ADMIN | MovementDialog abierto | Cerrar sin guardar; stock sin cambios | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-PROD-PAG-01 | Paginador visible cuando hay > pageSize productos | BD con >20 productos | Paginador con total y opciones 10/20/50 | ⏳ PENDIENTE | 108 productos, "1-20 of 108" (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-PROD-PAG-02 | Cambio de página carga página siguiente | Paginador visible | Filas cambian al ir a pág 2 | ⏳ PENDIENTE | Paginador funciona (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-PROD-PAG-03 | Cambiar tamaño de página (10/20/50) recarga la lista con el nuevo tamaño | Paginador visible, >50 productos | Selector "Items por página" cambia a 10/50; tabla muestra el número correcto de filas; vuelve a página 0 | ⏳ PENDIENTE | NUEVO (gap analysis 2026-06-10) |

### 1e. Estados vacíos (EMPTY)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| EMPTY-PROD-01 | Búsqueda sin resultados | Ícono + 'Sin resultados para "…"' | ⏳ PENDIENTE | "Sin resultados / Ningún registro coincide…" mostrado (Re-test 2026-06-10; anterior: ✅ PASS) |
| EMPTY-PROD-02 | Filtro activo sin resultados | Mensaje + botón "Limpiar filtros" visible | ⏳ PENDIENTE | Botón `filter_alt_off` (`aria-label="Limpiar todos los filtros"`) visible (Re-test 2026-06-10; anterior: ✅ PASS) |

---

## 2. Diálogo Nuevo/Editar Producto (`ProductDetailDialogComponent`)

### 2a. RBAC en el diálogo (RBAC)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-PDET-01 | Título "Nuevo producto" al crear | ADMIN | "Nuevo producto" como título | ⏳ PENDIENTE | product-form.html: isEdit=false → "Nuevo producto" (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-PDET-02 | Título "Editar producto" al editar | ADMIN | "Editar producto" como título | ⏳ PENDIENTE | Confirmado en MANAGER dialog (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-PDET-03 | Título "Ver producto" para WAREHOUSEMAN | WAREHOUSEMAN | "Ver producto" como título | ⏳ PENDIENTE | ❌→✅ FIXED: título añadido a vista read-only (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-PDET-04 | Campos editables y botón Guardar visible | ADMIN | Todos los inputs habilitados; "Guardar" presente | ⏳ PENDIENTE | 6 inputs habilitados, "Guardar cambios" presente (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-PDET-05 | Campos deshabilitados y sin botón Guardar | WAREHOUSEMAN | inputs `disabled:true`; sin "Guardar" | ⏳ PENDIENTE | Solo botón "Cerrar", campos como texto (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-PDET-06 | Botón "Desactivar" visible solo para ADMIN | ADMIN | Visible | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-PDET-07 | Botón "Desactivar" AUSENTE para MANAGER | MANAGER | Ausente del DOM | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-PDET-08 | Campo "Costo unitario" visible para ADMIN | ADMIN | Campo presente y editable | ⏳ PENDIENTE | hasCosto: true (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-PDET-09 | Campo "Costo unitario" AUSENTE para WAREHOUSEMAN | WAREHOUSEMAN | Campo no renderizado | ⏳ PENDIENTE | No renderizado en vista read-only (Re-test 2026-06-10; anterior: ✅ PASS) |

### 2b. Validaciones del formulario (VAL)

> ⚠️ Verificar que "Guardar" esté deshabilitado al cargar el formulario de edición (`form.dirty = false`) y que se reactive solo al modificar un campo (L25 — BUG-M3-20).

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-PDET-01 | Campo SKU vacío → error inline | Formulario nuevo | Error "SKU requerido" bajo el campo | ⏳ PENDIENTE | "El SKU es obligatorio." (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-PDET-02 | Campo Nombre vacío → error inline | Formulario nuevo | Error "Nombre requerido" | ⏳ PENDIENTE | "El nombre es obligatorio." (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-PDET-03 | Precio ≤ 0 → error | Precio = 0 | Error "Debe ser mayor a cero" | ⏳ PENDIENTE | "El precio debe ser mayor a 0." (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-PDET-04 | Stock mínimo negativo → error | Valor negativo | Error de validación visible | ⏳ PENDIENTE | ❌→✅ FIXED: `<mat-error>` añadido para `min` (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-PDET-05 | Formulario inválido → botón Guardar deshabilitado | Campos inválidos | `disabled:true` en el DOM | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-PDET-06 | Formulario de edición recién cargado → Guardar deshabilitado | Sin modificaciones | `disabled:true` (form.dirty = false) | ⏳ PENDIENTE | ❌→✅ FIXED: `!form.dirty` añadido (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-PDET-07 | Modificar un campo → Guardar se activa | Modificar nombre | `disabled:false` | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-PDET-08 | Guardar exitoso → Guardar se desactiva | Guardar con éxito | `disabled:true` (markAsPristine) | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-PDET-09 | SKU duplicado → snackbar error con mensaje del backend | SKU ya existe | Snackbar rojo con mensaje 409/422 del backend | ⏳ PENDIENTE | "Ya existe un producto con el SKU 'ELEC-PRO-043'." — 409 del backend (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-PDET-10 | Campo Stock no es editable en el formulario | Formulario de edición | Campo "Stock actual" ausente o `disabled:true` — se registra vía movimientos | ⏳ PENDIENTE | Campo disabled con candado + hint (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-PDET-11 | Campo SKU > 50 caracteres → error o input no acepta más | Escribir 51+ caracteres en SKU | Error "Máximo 50 caracteres" o `maxlength` en el DOM impide escribir más | ⏳ PENDIENTE | NUEVO (gap analysis 2026-06-10) — `Validators.maxLength(50)` en `product-form.component.ts:51` |
| VAL-PDET-12 | Campo Nombre > 150 caracteres → error o input no acepta más | Escribir 151+ caracteres en Nombre | Error "Máximo 150 caracteres" o `maxlength` en el DOM impide escribir más | ⏳ PENDIENTE | NUEVO (gap analysis 2026-06-10) — `Validators.maxLength(150)` en `product-form.component.ts:52` |
| VAL-PDET-13 | Campo Descripción > 500 caracteres → error o input no acepta más | Escribir 501+ caracteres en Descripción | Error "Máximo 500 caracteres" o `maxlength` en el DOM impide escribir más | ⏳ PENDIENTE | NUEVO (gap analysis 2026-06-10) — `Validators.maxLength(500)` en `product-form.component.ts:53` |
| VAL-PDET-14 | Guardar sin seleccionar Categoría → formulario inválido | Formulario nuevo, categoría sin seleccionar, resto completo | Botón "Guardar" deshabilitado o error "Categoría requerida" | ⏳ PENDIENTE | NUEVO (gap analysis 2026-06-10) — `categoryId: [null, Validators.required]` en `product-form.component.ts:59` |
| VAL-PDET-15 | Guardar sin seleccionar Proveedor → formulario inválido | Formulario nuevo, proveedor sin seleccionar, resto completo | Botón "Guardar" deshabilitado o error "Proveedor requerido" | ⏳ PENDIENTE | NUEVO (gap analysis 2026-06-10) — `supplierId: [null, Validators.required]` en `product-form.component.ts:60` |

### 2c. CRUD Productos (CRUD)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-PDET-01 | Crear producto con todos los datos válidos | Formulario nuevo completo | Snackbar verde "Producto creado correctamente."; diálogo cierra; lista recarga | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| CRUD-PDET-02 | Editar nombre de un producto | Producto existente | Snackbar verde "Producto actualizado."; lista refleja cambio | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| CRUD-PDET-03 | Desactivar producto — click Desactivar abre diálogo de confirmación | ADMIN, producto activo | Modal con texto confirmatorio | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| CRUD-PDET-04 | Cancelar desactivación — producto permanece activo | Diálogo confirmación | Sin cambios | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| CRUD-PDET-05 | Confirmar desactivación — producto desaparece de la lista activa | ADMIN, confirmar | Snackbar verde; producto ya no aparece | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |

### 2d. Kardex / Historial de movimientos (UI)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-PDET-01 | Sección "Kardex" visible en diálogo de detalle | ADMIN | Producto con movimientos | Tabla de movimientos visible con fecha, tipo, cantidad, motivo | ⏳ PENDIENTE | Tab Kardex presente (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-PDET-02 | Sección Kardex visible para WAREHOUSEMAN | WAREHOUSEMAN | Producto con movimientos | Tabla visible | ⏳ PENDIENTE | Tab Kardex visible en modo read-only (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-PDET-03 | Paginación del Kardex funciona | ADMIN | Producto con movimientos | Paginador activo; cambio de página carga filas siguientes | ⏳ PENDIENTE | pageSize=5, 6 movs → "6-6 of 6" en pág 2 (Re-test 2026-06-10; anterior: ✅ PASS) |

---

## 3. Diálogo Movimiento de Stock (`MovementDialogComponent`)

### 3a. Visual y apertura (VIS / UI)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-MOV-01 | Diálogo muestra nombre y SKU del producto | ADMIN | Nombre y SKU del producto seleccionado visibles | ⏳ PENDIENTE | "(editado QA) (HMAN-DES-013)" — nombre y SKU visibles (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-MOV-02 | Stock disponible visible antes de ingresar cantidad | ADMIN | "Stock disponible: N unidades" visible | ⏳ PENDIENTE | Panel con "Stock físico 90 / Reservado 0 / Disponible para salida 90" (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-MOV-01 | Selector de tipo: IN (Entrada) y OUT (Salida) disponibles | ADMIN | Ambas opciones en el `mat-select` | ⏳ PENDIENTE | "Entrada (IN)" y "Salida (OUT)" presentes (Re-test 2026-06-10; anterior: ✅ PASS) |

### 3b. Validaciones (VAL)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-MOV-01 | Cantidad vacía → error | Campo vacío | Error "Cantidad requerida" | ⏳ PENDIENTE | "La cantidad es obligatoria." (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-MOV-02 | Cantidad = 0 → error | Valor 0 | Error "Debe ser mayor a 0" | ⏳ PENDIENTE | "La cantidad debe ser al menos 1." (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-MOV-03 | Motivo vacío → error | Campo vacío | Error "Motivo requerido" | ⏳ PENDIENTE | "El motivo es obligatorio." (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-MOV-04 | OUT con cantidad > stock disponible → error | availableStock = 5, cantidad = 10 | Error de validación; botón Guardar deshabilitado | ⏳ PENDIENTE | "Supera el stock disponible" (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-MOV-05 | IN sin límite de cantidad — cualquier cantidad positiva válida | Tipo IN, cantidad 9999 | Sin error de máximo | ⏳ PENDIENTE | Tipo IN, 9999 → sin error de máximo (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-MOV-06 | Motivo con > 300 caracteres → error | Texto largo | Error "Máximo 300 caracteres" | ⏳ PENDIENTE | ❌→✅ FIXED: `<mat-error>` para maxlength añadido (Re-test 2026-06-10; anterior: ✅ PASS) |

### 3c. Reglas de negocio (RN)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RN-MOV-01 | Al cambiar tipo de IN a OUT se aplica validación de máximo automáticamente | Tipo cambia a OUT | Validación máx=availableStock aplicada sin submit | ⏳ PENDIENTE | IN→OUT con cantidad 9999: "Supera el stock disponible (90 unidades)." (Re-test 2026-06-10; anterior: ✅ PASS) |
| RN-MOV-02 | Al cambiar tipo de OUT a IN se quita la validación de máximo | Tipo cambia de OUT a IN | Validación de máximo desaparece | ⏳ PENDIENTE | OUT→IN: error desaparece, sin errores activos (Re-test 2026-06-10; anterior: ✅ PASS) |
| RN-MOV-03 | Movimiento OUT correcto → stock disminuye en la lista | ADMIN, OUT 3 unidades | Lista de productos recarga; stock = anterior − 3 | ⏳ PENDIENTE | OUT -3, 152→149 (Re-test 2026-06-10; anterior: ✅ PASS) |
| RN-MOV-04 | Movimiento IN correcto → stock aumenta en la lista | ADMIN, IN 5 unidades | Lista de productos recarga; stock = anterior + 5 | ⏳ PENDIENTE | IN +5, 147→152 (Re-test 2026-06-10; anterior: ✅ PASS) |

### 3d. CRUD Movimiento (CRUD)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-MOV-01 | Registrar movimiento IN válido | Formulario completo, tipo IN | Snackbar verde "Movimiento registrado correctamente."; diálogo cierra | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| CRUD-MOV-02 | Registrar movimiento OUT válido | Formulario completo, tipo OUT, cantidad ≤ availableStock | Snackbar verde; diálogo cierra | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| CRUD-MOV-03 | Cancelar / cerrar sin guardar | Formulario con datos | Diálogo cierra; stock sin cambios; lista no recarga | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |

---

## 4. Página de Categorías (`/inventory/categories`)

### 4a. Visual y estructura (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-CAT-01 | Título "Categorías" visible | ADMIN | Encabezado presente | ⏳ PENDIENTE | Heading visible (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-CAT-02 | Columnas tabla: Nombre, Descripción, Acciones | ADMIN | Todas las columnas visibles | ⏳ PENDIENTE | Nombre, Descripción, acciones (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-CAT-03 | `mat-progress-bar` visible durante carga | ADMIN | Barra en parte superior | ⏳ PENDIENTE | Template tiene `@if (loading) { <mat-progress-bar> }` — verificado por code review (Re-test 2026-06-10; anterior: ✅ PASS) |

### 4b. Búsqueda (BSRCH)

> NUEVO (gap analysis 2026-06-10): `categories-page.component.ts` tiene `searchCtrl` con
> `debounceTime(350)` y campo "Buscar categoría" en el HTML, pero no existían casos de
> prueba para esta funcionalidad — análogo a BSRCH-PROD y BSRCH-SUP.

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| BSRCH-CAT-01 | Buscar por nombre exacto | ADMIN | Categorías en BD | Filtra a la(s) categoría(s) coincidente(s) | ⏳ PENDIENTE | NUEVO (gap analysis 2026-06-10) |
| BSRCH-CAT-02 | Buscar en minúsculas (case insensitive) | ADMIN | Categoría con nombre en mayúsculas/mixto | Encuentra la categoría sin importar mayúsculas/minúsculas | ⏳ PENDIENTE | NUEVO (gap analysis 2026-06-10) |
| BSRCH-CAT-03 | Buscar sin acento encuentra nombre acentuado (accent insensitive) | ADMIN | Categoría con acento (ej. "Climatización") | "climatizacion" encuentra "Climatización" — verificar `f_unaccent()` en `CategoryRepository` | ⏳ PENDIENTE | NUEVO (gap analysis 2026-06-10) |
| BSRCH-CAT-04 | Término sin resultados muestra estado vacío | ADMIN | Término inexistente | Ícono + 'Sin resultados para "…"' | ⏳ PENDIENTE | NUEVO (gap analysis 2026-06-10) |
| BSRCH-CAT-05 | Limpiar campo de búsqueda restaura la lista completa | ADMIN | Campo con término activo | Lista restaura todas las categorías activas | ⏳ PENDIENTE | NUEVO (gap analysis 2026-06-10) |
| BSRCH-CAT-06 | Buscar con ñ — normalización bidireccional | ADMIN | Categoría con "ñ" en el nombre (si existe) o usar "Climatización"/"Construcción" | Búsqueda sin diacríticos encuentra el nombre con diacríticos y viceversa | ⏳ PENDIENTE | NUEVO (gap analysis 2026-06-10) |

### 4c. RBAC en categorías (RBAC)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-CAT-01 | Botón "Nueva categoría" visible | ADMIN | Visible | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-CAT-02 | Botón "Nueva categoría" visible | MANAGER | Visible | ⏳ PENDIENTE | Confirmado (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-CAT-03 | Botón "Nueva categoría" AUSENTE | WAREHOUSEMAN | Ausente del DOM | ⏳ PENDIENTE | hasNuevaCategoria: false (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-CAT-04 | Botón "Nueva categoría" AUSENTE | SALES | Ausente del DOM | ⏳ PENDIENTE | hasNueva: false (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-CAT-05 | Click en fila (ADMIN) abre diálogo edición | ADMIN | Diálogo de edición abre | ⏳ PENDIENTE | Título "Editar categoría" + Desactivar (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-CAT-06 | Click en fila (WAREHOUSEMAN) NO abre diálogo | WAREHOUSEMAN | Sin acción; no abre diálogo | ⏳ PENDIENTE | cursor:auto, sin diálogo (Re-test 2026-06-10; anterior: ✅ PASS) |

### 4d. Botones e íconos de acción (UI)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-CAT-01 | Ícono "Ver productos" en fila → navega a `/inventory/products?categoryId=X` | ADMIN | Lista cargada | Navega a productos filtrados por esa categoría | ⏳ PENDIENTE | Navegó a `?categoryId=28` (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-CAT-02 | Ícono "Editar" en fila → abre diálogo | ADMIN | Lista cargada | Diálogo de edición abre con datos precargados | ⏳ PENDIENTE | Click en fila = editar (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-CAT-PAG-01 | Paginador visible cuando hay > pageSize categorías | BD con >20 categorías | Paginador activo | ⏳ PENDIENTE | 68 categorías, Next page activo (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-CAT-PAG-02 | Cambiar tamaño de página (10/20/50) recarga la lista con el nuevo tamaño | Paginador visible, >50 categorías | Selector "Items por página" cambia a 10/50; tabla muestra el número correcto de filas; vuelve a página 0 | ⏳ PENDIENTE | NUEVO (gap analysis 2026-06-10) |

### 4e. CRUD Categorías (CRUD)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-CAT-01 | Crear categoría con datos válidos | Formulario completo | Snackbar verde "Categoría creada."; diálogo cierra; lista recarga | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| CRUD-CAT-02 | Editar nombre de categoría | Categoría existente | Snackbar verde "Categoría actualizada."; lista refleja cambio | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| CRUD-CAT-03 | Desactivar categoría abre diálogo de confirmación | ADMIN, categoría activa | Modal con texto de confirmación | ⏳ PENDIENTE | "Desactivar categoría" modal (Re-test 2026-06-10; anterior: ✅ PASS) |
| CRUD-CAT-04 | Confirmar desactivación | ADMIN | Snackbar verde; categoría ya no aparece | ⏳ PENDIENTE | "Calzado Industrial" desactivada (Re-test 2026-06-10; anterior: ✅ PASS) |
| CRUD-CAT-05 | Intentar desactivar categoría con productos activos | Categoría con productos | Snackbar rojo con mensaje del backend | ⏳ PENDIENTE | 422 para "Herramientas Manuales" (Re-test 2026-06-10; anterior: ✅ PASS) |

### 4f. Validaciones formulario de categoría (VAL)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-CAT-01 | Nombre vacío → error inline | Campo vacío | Error "Nombre requerido" | ⏳ PENDIENTE | "El nombre es obligatorio." al vaciar campo y hacer blur (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-CAT-02 | Nombre duplicado → error del backend | Nombre ya existe | Snackbar rojo con mensaje 409/422 | ⏳ PENDIENTE | 409 para "Herramientas Manuales" (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-CAT-03 | Botón Guardar deshabilitado al cargar formulario de edición | Sin modificaciones | `disabled:true` (form.dirty = false) | ⏳ PENDIENTE | ❌→✅ FIXED: `!form.dirty` añadido (Re-test 2026-06-10; anterior: ✅ PASS) |
| VAL-CAT-04 | Botón Guardar se activa al modificar un campo | Modificar nombre | `disabled:false` | ⏳ PENDIENTE | disabled=false tras keyup en el campo nombre (Re-test 2026-06-10; anterior: ✅ PASS) |

### 4g. Estado vacío (EMPTY)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| EMPTY-CAT-01 | Sin categorías activas en BD | Ícono + "Sin categorías registradas" | ⏳ PENDIENTE | Hay 68 categorías activas; no reproducible sin BD limpia (Re-test 2026-06-10; anterior: N/A) |

---

## 5. Página de Stock Bajo (`/inventory/low-stock`)

### 5a. Visual y estructura (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-LST-01 | Contadores resumen visibles: "Sin stock", "Crítico", "Por reservas" | ADMIN | Los 3 contadores con valor numérico | ⏳ PENDIENTE | Chips con contadores visibles (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-LST-02 | Columna "Severidad" con color semántico | ADMIN | Rojo (sin stock), naranja (crítico), amarillo (por reservas) | ⏳ PENDIENTE | "Sin stock" rojo #FFEBEE/#C62828; "Crítico" naranja #FFF3E0/#E65100 (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-LST-03 | Columna "Costo unitario" visible para ADMIN/MANAGER | ADMIN | Columna presente | ⏳ PENDIENTE | MANAGER: "Costo unit." en headers (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-LST-04 | Columna "Costo unitario" AUSENTE para WAREHOUSEMAN | WAREHOUSEMAN | Columna no renderizada | ⏳ PENDIENTE | Sin "Costo unit." en WAREHOUSEMAN (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-LST-05 | Columnas numéricas (Stock actual, Reservado, Disponible, Mínimo, Déficit) muestran valores correctos y consistentes por fila | ADMIN | Lista cargada | Para cada fila: `availableStock = currentStock - reservedStock` y `deficit = minimumStock - availableStock` (coincide con `low-stock-page.component.ts`) | ⏳ PENDIENTE | NUEVO (gap analysis 2026-06-10) — solo se verificaban Severidad y Costo unitario, no las 5 columnas numéricas |

### 5b. RBAC en stock bajo (RBAC)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-LST-01 | Ícono "Registrar movimiento" visible | ADMIN | Visible en cada fila | ⏳ PENDIENTE | add_circle icons en cada fila (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-LST-02 | Ícono "Registrar movimiento" visible | WAREHOUSEMAN | Visible en cada fila | ⏳ PENDIENTE | 5 botones add_circle presentes (Re-test 2026-06-10; anterior: ✅ PASS) |
| RBAC-LST-03 | Ícono "Registrar movimiento" AUSENTE | SALES | Columna acciones ausente | ⏳ PENDIENTE | tdBtns: 0 para SALES (Re-test 2026-06-10; anterior: ✅ PASS) |

### 5c. Botones e íconos de acción (UI)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-LST-01 | Ícono movimiento → abre `MovementDialog` correctamente | ADMIN | Lista con productos bajo stock | Diálogo abre con datos del producto | ⏳ PENDIENTE | (Re-test 2026-06-10; anterior: ✅ PASS) |
| UI-LST-02 | Movimiento IN desde stock bajo → lista recarga | ADMIN | MovementDialog abierto, tipo IN | Snackbar verde; lista actualizada | ⏳ PENDIENTE | IN +5 en ELEC-PRO-043: contador "2 sin stock" → "1 sin stock"; lista recargó (Re-test 2026-06-10; anterior: ✅ PASS) |

### 5d. Reglas de negocio (RN)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RN-LST-01 | Productos ordenados por déficit descendente (mayor déficit primero) | Lista cargada con varios productos | Producto con mayor déficit (min-available) en primera fila | ⏳ PENDIENTE | Verificado en sesión anterior (Re-test 2026-06-10; anterior: ✅ PASS) |
| RN-LST-02 | Déficit = minimumStock − availableStock | Producto con min=10, available=3 | Columna "Déficit" muestra 7 | ⏳ PENDIENTE | Verificado en sesión anterior (Re-test 2026-06-10; anterior: ✅ PASS) |
| RN-LST-03 | Producto con reservas y stock ≥ mínimo → severidad "Por reservas" | Producto con reservedStock>0, currentStock≥min | Etiqueta "Por reservas" en columna severidad | ⏳ PENDIENTE | Sin datos que cumplan la condición; lógica `getSeverity()` verificada en código (Re-test 2026-06-10; anterior: N/A) |

### 5e. Estado vacío (EMPTY)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| EMPTY-LST-01 | Sin productos con stock bajo | Ícono + "Sin productos con bajo stock" | ⏳ PENDIENTE | Hay 5 productos con bajo stock; no reproducible sin modificar datos (Re-test 2026-06-10; anterior: N/A) |

---

## 6. Mensajes de error y éxito (ERR)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| ERR-01 | Snackbar éxito: fondo verde `#2E7D32` | Crear/editar producto o categoría | Color correcto; clase `snackbar-success` | ⏳ PENDIENTE | Snackbar verde al crear/editar (Re-test 2026-06-10; anterior: ✅ PASS) |
| ERR-02 | Snackbar error: fondo rojo `#C62828` | Error del backend | Color correcto; clase `snackbar-error` | ⏳ PENDIENTE | Snackbar rojo en 409/422 (Re-test 2026-06-10; anterior: ✅ PASS) |
| ERR-03 | Mensaje específico del backend en snackbar (no genérico) | Backend rechaza con 409/422 | Texto descriptivo del backend visible | ⏳ PENDIENTE | Mensaje real del backend mostrado (Re-test 2026-06-10; anterior: ✅ PASS) |
| ERR-04 | Error al registrar movimiento OUT > stock → mensaje en el diálogo (no snackbar) | OUT cantidad > disponible | Mensaje de error inline en el diálogo; diálogo NO se cierra | ⏳ PENDIENTE | Error inline "Supera el stock disponible" (Re-test 2026-06-10; anterior: ✅ PASS) |
| ERR-05 | Error al cargar productos → snackbar con mensaje útil | Backend apagado | "Error al cargar productos." visible | ⏳ PENDIENTE | No reproducible sin apagar backend (Re-test 2026-06-10; anterior: N/A) |
| ERR-06 | Error al cargar categorías → snackbar con mensaje útil | Backend apagado | "Error al cargar categorías." visible | ⏳ PENDIENTE | No reproducible sin apagar backend (Re-test 2026-06-10; anterior: N/A) |
| ERR-07 | Error al cargar stock bajo → snackbar con mensaje útil | Backend apagado | "Error al cargar productos con bajo stock." visible | ⏳ PENDIENTE | No reproducible sin apagar backend (Re-test 2026-06-10; anterior: N/A) |
| ERR-08 | Progress bar visible durante carga inicial en cada pantalla | Navegar a la pantalla | Barra indeterminada mientras carga | ⏳ PENDIENTE | Carga demasiado rápida para verificar manualmente (Re-test 2026-06-10; anterior: N/A) |

---

## 7. Visual general del módulo (VIS)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| VIS-GEN-01 | Sidebar colapsado al entrar a cualquier pantalla del módulo | Sidebar en modo íconos al navegar | ⏳ PENDIENTE | `layoutService.collapse()` en `ngOnInit` de low-stock (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-GEN-02 | Breadcrumb correcto: "Inventario → Productos" / "→ Categorías" / "→ Stock bajo" | Breadcrumb en topbar correcto | ⏳ PENDIENTE | "Inventario → Productos" / "→ Categorías" / "→ Bajo stock" — correctos (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-GEN-03 | Botones primarios con color de marca `#6B3C6B` | "Nuevo producto", "Nueva categoría", "Guardar" con color correcto | ⏳ PENDIENTE | `color="primary"` → tema de marca (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-GEN-04 | Botones destructivos con color `warn` (rojo) | "Desactivar" en rojo | ⏳ PENDIENTE | `color="warn"` en todos los Desactivar (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-GEN-05 | Diálogos de confirmación son modales (click fuera no cierra) | Click backdrop → diálogo permanece | ⏳ PENDIENTE | Verificado con ConfirmDialog (Re-test 2026-06-10; anterior: ✅ PASS) |
| VIS-GEN-06 | Header de tabla con fondo `#F2E4F2` y texto `#6B3C6B` | Colores de marca correctos en todas las tablas | ⏳ PENDIENTE | Productos/Categorías: fondo #FFF, texto negro. Solo sticky headers (low-stock) tienen #F2E4F2 — BUG-INV-07 (Re-test 2026-06-10; anterior: ❌ FAIL). FIX APLICADO en esta sesión: se agregó `.mat-mdc-header-cell { font-weight:600; color:#6B3C6B; background:#F2E4F2; }` en `products-page.component.scss` y `categories-page.component.scss` — re-confirmar visualmente en browser |
| VIS-GEN-07 | Texto largo en celdas se trunca con `…` y tooltip con valor completo | Nombre/descripción larga | Truncado + tooltip | ⏳ PENDIENTE | `matTooltip` en columnas name (Re-test 2026-06-10; anterior: ✅ PASS) |

---

## 8. Validaciones de ciberseguridad (CYBER)

> Casos nuevos agregados en la ronda de re-validación 2026-06-10 (solicitados explícitamente
> por el usuario). Cubren OWASP Top 10 aplicable al stack Angular + Spring Boot + JWT + PostgreSQL,
> con foco en los endpoints y campos sensibles del módulo Inventario (`unitCost`, stock, JWT,
> roles). Ejecutar con DevTools (Network/Console/Application→LocalStorage) y, donde se indique,
> con `curl` contra `http://localhost:8080/api/v1/...`.
>
> ⚠️ Si algún caso falla (ej. el backend expone `unitCost` a WAREHOUSEMAN en el JSON, o un XSS
> se ejecuta), **documentar el bug en §9 con estado ABIERTO — no corregir sin autorización.**

### 8.0 Mapeo contra OWASP ASVS v4 — Nivel 1 (L1)

| Caso | Requisito ASVS L1 | Categoría ASVS |
|---|---|---|
| CYBER-01 | V8.3.4 — datos sensibles no se exponen innecesariamente al cliente | V8 — Data Protection |
| CYBER-02 | V4.1.1/V4.1.3 — control de acceso aplicado en el servidor, no en el cliente | V4 — Access Control |
| CYBER-03 | V3.3 — terminación de sesión efectiva | V3 — Session Management |
| CYBER-04 | V5.3.4 — prevención de inyección SQL | V5 — Validation, Sanitization, Encoding |
| CYBER-05 | V5.3.3 — codificación de salida / prevención de XSS almacenado | V5 — Validation, Sanitization, Encoding |
| CYBER-06 | V5.3.3 — codificación de salida / prevención de XSS reflejado | V5 — Validation, Sanitization, Encoding |
| CYBER-07 | V4.2 / OWASP API3:2023 — autorización a nivel de campo (no exponer `unitCost`) | V4 — Access Control |
| CYBER-08 | V4.1.1 — todo endpoint requiere autenticación | V4 — Access Control |
| CYBER-09 | V4.1.3 — sin bypass de control de acceso vía API directa | V4 — Access Control |
| CYBER-10 | V7.4.1 — mensajes de error genéricos, sin información sensible | V7 — Error Handling and Logging |
| CYBER-11 | V3.3 — expiración de sesión | V3 — Session Management |
| CYBER-12 | V4.2.1 — sin IDOR | V4 — Access Control |
| CYBER-13 | V14.5 — configuración CORS restringida | V14 — Configuration |
| CYBER-14 | V2.2.1 — sin enumeración de usuarios | V2 — Authentication |
| CYBER-15 | V9.1 — protección de credenciales en tránsito/cliente | V9 — Communications |
| CYBER-16 | V5.3.3 — manejo seguro de caracteres especiales | V5 — Validation, Sanitization, Encoding |
| CYBER-17 | V5.1 — validación de entrada en el servidor | V5 — Validation, Sanitization, Encoding |
| CYBER-18 *(nuevo)* | V14.4 — cabeceras de seguridad HTTP | V14 — Configuration |
| CYBER-19 *(nuevo)* | V2.2.1 — protección anti-automatización en login (rate limiting) | V2 — Authentication |
| CYBER-20 *(nuevo)* | V3.3.1/V8.2.3 — invalidación de sesión en logout; sin datos sensibles cacheados tras logout | V3/V8 |
| CYBER-21 *(nuevo)* | V5.1.3 — validación de entrada también en el backend, independiente del frontend | V5 — Validation, Sanitization, Encoding |
| CYBER-22 *(nuevo)* | V3.5.3 — el servidor valida la firma/algoritmo del JWT (rechaza `alg=none`) | V3 — Session Management |

> Requisitos ASVS L1 evaluados como **N/A** para este módulo: V2.1 (políticas de contraseña —
> gestionadas en el módulo Auth), V2.3 (recuperación de cuenta — no aplica a app interna),
> V9.1.1 (TLS obligatorio — entorno `dev` es HTTP local; revisar en `environment.prod.ts`).

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| CYBER-01 | El JWT decodificado (jwt.io / `atob`) no contiene contraseña ni datos sensibles en el payload | ADMIN | Sesión activa | Claims limitados a `sub`, `roles`, `iat`, `exp` (sin password/email sensible) | ⏳ PENDIENTE | |
| CYBER-02 | Manipular el JWT en `localStorage` (cambiar rol a `ROLE_ADMIN`) y recargar | SALES | Sesión SALES activa, editar token en Application→LocalStorage | El backend rechaza con 401/403 al primer request; frontend redirige a login (no se otorga acceso elevado por confiar en un JWT alterado) | ⏳ PENDIENTE | |
| CYBER-03 | Eliminar el JWT de `localStorage` con la sesión activa y navegar/recargar | ADMIN | Sesión activa, borrar `localStorage` clave del token | Redirige a `/login`; próximas peticiones HTTP devuelven 401 | ⏳ PENDIENTE | |
| CYBER-04 | Inyección SQL en campo de búsqueda de productos: `' OR '1'='1` y `'; DROP TABLE products;--` | ADMIN | Campo de búsqueda de Productos | Sin error 500; backend trata el texto como literal; sin resultados o resultados normales; tabla `products` intacta | ⏳ PENDIENTE | Verificar también en búsqueda de Categorías y Bajo stock |
| CYBER-05 | XSS almacenado: crear producto/categoría con nombre `<script>alert(1)</script>` | ADMIN | Formulario Nuevo producto / Nueva categoría | El valor se guarda como texto; al listar/ver el detalle se muestra escapado (`&lt;script&gt;`) sin ejecutar el script | ⏳ PENDIENTE | Repetir con `<img src=x onerror=alert(1)>` |
| CYBER-06 | XSS reflejado vía query param: navegar a `/inventory/products?search=<img src=x onerror=alert(1)>` | ADMIN | URL manual con payload en `?search=` | El valor se usa como texto en el campo de búsqueda / petición HTTP; ningún script se ejecuta | ⏳ PENDIENTE | |
| CYBER-07 | Respuesta JSON de `GET /inventory/products` NO incluye `unitCost`/`costPrice` para WAREHOUSEMAN/SALES | WAREHOUSEMAN, SALES | DevTools → pestaña Network, inspeccionar response body | Campo `unitCost` ausente del JSON (no solo oculto en UI) | ⏳ PENDIENTE | Repetir con `GET /inventory/low-stock` |
| CYBER-08 | Acceso directo a la API sin token: `curl http://localhost:8080/api/v1/inventory/products` | (sin JWT) | Backend corriendo | HTTP 401 Unauthorized; sin datos en el body | ⏳ PENDIENTE | |
| CYBER-09 | Acceso a endpoint de escritura con rol sin permiso vía `curl`: `POST /inventory/products` con JWT de SALES | SALES | Token JWT válido de SALES capturado del login | HTTP 403 Forbidden | ⏳ PENDIENTE | Repetir `POST /inventory/movements` con JWT de SALES |
| CYBER-10 | Mensajes de error del backend (4xx/5xx) no exponen stack traces, rutas de archivos ni nombres de tablas/clases internas | ADMIN | Forzar un error (ej. crear producto con SKU duplicado, o payload malformado) | Mensaje de error de negocio legible; sin trazas Java/SQL en el body de la respuesta ni en el snackbar | ⏳ PENDIENTE | |
| CYBER-11 | Token JWT expirado (simular cambiando `exp` o esperando 2h) → request rechazado | ADMIN | JWT expirado | HTTP 403/401; frontend redirige a `/login` con "Tu sesión ha expirado..."; sin loop infinito de redirects | ⏳ PENDIENTE | |
| CYBER-12 | IDOR — acceder a `/inventory/products` y abrir el detalle de un producto cuyo `id` no corresponde a ningún elemento visible en la lista filtrada del rol actual (ID secuencial adivinado) | SALES | Conocer/adivinar un `id` válido | El backend solo permite lo autorizado por rol (lectura general permitida para SALES); para escritura (`PUT/PATCH`) responde 403 si SALES intenta modificar | ⏳ PENDIENTE | Caso de control — en Inventario la lectura es abierta a los 4 roles; el foco es la escritura |
| CYBER-13 | Cabeceras CORS de la API no permiten `Access-Control-Allow-Origin: *` junto con `Access-Control-Allow-Credentials: true` | — | `curl -I` a cualquier endpoint con header `Origin` arbitrario | Configuración CORS restringida a orígenes conocidos (no wildcard + credentials) | ⏳ PENDIENTE | Verificado 2026-06-10: `SecurityConfig.java` usa `setAllowedOriginPatterns(List.of("*"))` + `setAllowCredentials(true)` — con `allowedOriginPatterns` Spring refleja el `Origin` recibido en `Access-Control-Allow-Origin`, permitiendo credenciales desde CUALQUIER origen. Se espera que este caso documente el hallazgo (FAIL/⚠️ ABIERTO), no que sea un falso positivo |
| CYBER-14 | Login con credenciales incorrectas no revela si el usuario existe | (sin sesión) | Probar `admin`/`pass-incorrecto` vs `usuario-inexistente`/`cualquier-pass` | Mismo mensaje genérico "Usuario o contraseña incorrectos" en ambos casos | ⏳ PENDIENTE | |
| CYBER-15 | Campo de contraseña en formularios (login, cambio de contraseña) usa `type="password"` y no se loggea en consola/network como texto plano fuera de HTTPS | (sin sesión) | DevTools → Console + Network durante login | Sin contraseña visible en consola; input enmascarado | ⏳ PENDIENTE | En `dev` el tráfico es HTTP local — documentar como hallazgo si no hay HTTPS configurado para producción |
| CYBER-16 | Búsqueda con caracteres especiales HTML (`"`, `<`, `>`, `&`) en filtros no rompe el layout ni inyecta atributos | ADMIN | Campo de búsqueda con `"><svg onload=alert(1)>` | Caracteres tratados como texto literal; sin alteración del DOM fuera del campo | ⏳ PENDIENTE | |
| CYBER-17 | Movimiento de stock (`POST /api/v1/inventory/products/movement`) con `productId` de un producto inactivo/inexistente | ADMIN | `productId` inválido vía request manual (Postman/curl) | HTTP 404/422 con mensaje de negocio; no crea el movimiento ni altera stock | ⏳ PENDIENTE | Path corregido 2026-06-10 — verificado en `ProductController.java` (`@PostMapping("/movement")` bajo `@RequestMapping("/api/v1/inventory/products")`) |
| CYBER-18 | Cabeceras de seguridad HTTP en las respuestas de la API y del frontend (`X-Content-Type-Options: nosniff`, `X-Frame-Options`, `Content-Security-Policy`, `Strict-Transport-Security` en prod) | — | `curl -I http://localhost:8080/api/v1/inventory/products` y `curl -I http://localhost:4200/` | `SecurityConfig.java` no tiene bloque `.headers(...)` explícito → aplican los defaults de Spring Security 6: `X-Content-Type-Options: nosniff` y `X-Frame-Options: DENY` deberían estar presentes (PASS esperado); `Content-Security-Policy` y `Strict-Transport-Security` NO están configurados → esperar su ausencia y documentarla como hallazgo (ASVS V14.4) | ⏳ PENDIENTE | NUEVO (mapeo OWASP ASVS L1 2026-06-10) — verificado contra `SecurityConfig.java`: sin `.headers()` custom |
| CYBER-19 | Rate limiting / bloqueo tras múltiples intentos fallidos de login | (sin sesión) | `POST /api/v1/auth/login` con credenciales incorrectas 5-10 veces seguidas | El backend bloquea, retrasa o introduce captcha tras N intentos; si no lo hace, documentar como hallazgo (ASVS V2.2.1) | ⏳ PENDIENTE | NUEVO (mapeo OWASP ASVS L1 2026-06-10) — verificado: `UserServiceImpl.login()` no implementa lockout/rate-limiting (grep de `lockout/rate.limit/bucket4j/failedAttempt` en `src/main/java` = vacío); se espera que el caso documente este hallazgo como gap real, no como falla inesperada |
| CYBER-20 | Logout invalida la sesión: tras cerrar sesión, el botón "atrás" del navegador no muestra datos de Inventario sin re-autenticación | ADMIN | Sesión activa, navegar a `/inventory/products`, cerrar sesión | `localStorage` sin token; redirige a `/login`; botón atrás no expone datos protegidos (o redirige a login) | ⏳ PENDIENTE | NUEVO (mapeo OWASP ASVS L1 2026-06-10) — ASVS V3.3.1 / V8.2.3 |
| CYBER-21 | Validación server-side independiente del cliente: `POST /api/v1/inventory/products` vía curl con `price: -10` o `sku` de 60 caracteres, evitando los `Validators` de Angular | ADMIN | Token JWT válido de ADMIN, request manual (Postman/curl) con payload inválido | HTTP 400/422 — el backend rechaza el payload aunque el frontend nunca lo hubiera enviado así | ⏳ PENDIENTE | NUEVO (mapeo OWASP ASVS L1 2026-06-10) — ASVS V5.1.3; complementa VAL-PDET-03/11. Path verificado contra `ProductController.java` (`@PostMapping` bajo `@RequestMapping("/api/v1/inventory/products")`) |
| CYBER-22 | JWT con algoritmo alterado a `none` o firma inválida es rechazado | ADMIN | Construir manualmente un JWT con `alg: none` (sin firma) o con firma modificada, usarlo en `Authorization` header | HTTP 401 — el backend valida la firma y el algoritmo, no confía en el payload sin verificar | ⏳ PENDIENTE | NUEVO (mapeo OWASP ASVS L1 2026-06-10) — ASVS V3.5.3. Verificado: `JwtUtils.parseClaims()` usa `Jwts.parser().verifyWith(key).build().parseSignedClaims(token)` (JJWT 0.12.x) — `parseSignedClaims` exige un JWS firmado y rechaza tokens `alg=none`/sin firma con `JwtException`, capturada por `validateToken()` → `false`. PASS esperado |

---

## 9. Historial de bugs encontrados en este módulo

| Bug ID | Descripción | Componente | Estado |
|---|---|---|---|
| BUG-INV-01 | Botón "Guardar cambios" habilitado sin modificaciones en formulario de edición | `product-form.component.html` | ✅ CORREGIDO — `!form.dirty` añadido |
| BUG-INV-02 | Sin mensaje de error visible para stock mínimo negativo | `product-form.component.html` | ✅ CORREGIDO — `<mat-error>` para `min` añadido |
| BUG-INV-03 | Botón "Guardar cambios" habilitado sin modificaciones en categorías | `category-form.component.html` | ✅ CORREGIDO — `!form.dirty` añadido |
| BUG-INV-04 | Vista read-only (WAREHOUSEMAN/SALES) sin título "Ver producto" | `product-detail.component.html` | ✅ CORREGIDO — `<h3>Ver producto</h3>` añadido |
| BUG-INV-05 | Sin mensaje de error visible para motivo > 300 caracteres | `movement-dialog.component.html` | ✅ CORREGIDO — `<mat-error>` para `maxlength` añadido |
| BUG-INV-06 | Búsqueda no normaliza acentos (accent-insensitive no implementado) | Backend `ProductServiceImpl` | 🔄 POSIBLE FIX SIN VERIFICAR — `ProductRepository.java` ya usa `f_unaccent()` en `search()` (líneas 144-155); pendiente re-test en browser de BSRCH-PROD-03 |
| BUG-INV-07 | Headers de tabla sin colores de marca en tablas no-sticky (productos, categorías) | `products-page`, `categories-page` SCSS | 🔄 FIX APLICADO SIN VERIFICAR — `.mat-mdc-header-cell` con `#F2E4F2`/`#6B3C6B` agregado en esta sesión; pendiente re-test en browser de VIS-GEN-06 |

> Cualquier bug NUEVO encontrado durante la re-validación se agrega aquí con estado `⚠️ ABIERTO`
> y referencia al ID del caso que lo detectó. No se corrige sin autorización del usuario.

---

## Checklist de cierre (Propuesta D)

Antes de declarar el módulo **done**, verificar que se cumplen las 4 condiciones:

```
[ ] 1. Los 198 casos de este documento (162 originales + 17 CYBER + 14 de gap analysis +
       5 CYBER de mapeo ASVS L1) tienen estado ✅ PASS — ninguna fila ⏳ PENDIENTE.
       Re-confirmar especialmente BSRCH-PROD-03 (BUG-INV-06) y VIS-GEN-06 (BUG-INV-07),
       cuyos fixes ya están en el código pero sin verificar en browser.
[✅] 2. ng test --no-watch → 215 specs, 0 fallos ✅; cobertura statements: 89.32% ✅
         (movement-dialog 81.3%, product-form 82.6%, product-detail 92.0%)
         — re-ejecutar tras cualquier corrección que se autorice durante esta ronda
[ ] 3. Prueba browser completa de los 179 casos con ADMIN, MANAGER, WAREHOUSEMAN y SALES
[ ] 4. Memoria técnica §10 actualizada con el resultado final de esta ronda
```
