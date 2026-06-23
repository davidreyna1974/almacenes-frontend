# Casos de prueba — Módulo Inventario

**Módulo:** Inventario
**Ruta base:** `/inventory`
**Roles con acceso (lectura):** ADMIN, MANAGER, WAREHOUSEMAN, SALES
**Roles con escritura:** ADMIN, MANAGER
**Roles con movimientos de stock:** ADMIN, MANAGER, WAREHOUSEMAN
**Roles con desactivar productos:** ADMIN
**Fecha de creación:** 2026-06-08
**Última actualización:** 2026-06-23 — Estados reseteados a ⏳ PENDIENTE para nueva ronda
de verificación bajo Protocolo 4 fases. Historial de rondas anteriores conservado en la
columna Notas y en la sección "Historial de rondas" al final del documento. Se agregan:
sección "Protocolo 4 fases", L34/L35 en lecciones, "Historial de rondas" y "Checklist cierre".

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

---

## Cómo usar este documento

1. Cada caso tiene un ID único (`CATEGORIA-PANTALLA-NNN`)
2. Ejecutar cada caso en el browser con el JWT del rol indicado
3. Actualizar la columna **Estado** con el resultado real observado en el browser
4. Si el estado es ❌ FAIL: registrar el bug en §9 de este documento y en §8 de la memoria técnica
   con referencia al ID — **documentar únicamente, no corregir sin autorización**
5. Un componente solo está "done" cuando **toda la columna Estado está llena** y **ningún caso está ⏳ PENDIENTE**

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
| ERR — Mensajes de error | 10 | 0 | 0 | 6 | 4 |
| EMPTY — Estados vacíos | 7 | 0 | 0 | 5 | 2 |
| VIS — Visual y estética | 15 | 0 | 0 | 15 | 0 |
| CYBER — Ciberseguridad | 22 | 0 | 0 | 21 | 1 |
| **TOTAL** | **198** | **0** | **0** | **191** | **7** |

> **Estado actual: ⏳ PENDIENTE** — reset el 2026-06-23 para nueva ronda de verificación bajo
> Protocolo 4 fases. Ronda anterior completada el 2026-06-11: 191 ✅ PASS, 0 ❌ FAIL, 7 N/A.
> N/A justificados (se conservan): ERR-05..08 requieren condiciones de red/timeout no
> reproducibles en entorno local; EMPTY-CAT-01 y EMPTY-LST-01 requieren BD vacía; CYBER-18
> (CSP/HSTS) diferido a checklist de producción. Ver "Historial de rondas" al final del documento.
> En la próxima ronda de verificación, resetear PASS → PENDIENTE antes del primer caso.

---

## 0. Seguridad de rutas (SEC)

> La ruta `/inventory` solo requiere autenticación (no tiene `data.roles`).
> Todos los roles autenticados pueden acceder — SALES incluido.
> Las operaciones de escritura se controlan en el componente (canWrite, canDeactivate, etc.).

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| SEC-01 | Sin sesión — acceso directo a `/inventory/products` | (sin JWT) | Token expirado / sin login | Redirige a `/login` | ⏳ PENDIENTE | Re-test 2026-06-10: `localStorage.clear()` + navegar a `/inventory/products` → redirige a `/login` |
| SEC-02 | Sin sesión — acceso directo a `/inventory/categories` | (sin JWT) | Token expirado / sin login | Redirige a `/login` | ⏳ PENDIENTE | Re-test 2026-06-10: sin token, navegar a `/inventory/categories` → redirige a `/login` |
| SEC-03 | Sin sesión — acceso directo a `/inventory/low-stock` | (sin JWT) | Token expirado / sin login | Redirige a `/login` | ⏳ PENDIENTE | Re-test 2026-06-10: sin token, navegar a `/inventory/low-stock` → redirige a `/login` |
| SEC-04 | SALES accede a `/inventory/products` — lectura permitida | SALES | Sesión SALES activa | Carga la página; lista visible; sin botón "Nuevo producto" | ⏳ PENDIENTE | Re-test 2026-06-12 (BUG-INV-12 corregido): login `ventas01` — sin redirect, lista de 108 productos visible, sin botón "Nuevo producto", SIN snackbar de error, filtro "Categoría" poblado con todas las categorías, filtro "Proveedor" oculto (rol sin acceso a `/purchases/**`) |
| SEC-05 | SALES accede a `/inventory/categories` — lectura permitida | SALES | Sesión SALES activa | Carga la página; lista visible; sin botón "Nueva categoría" | ⏳ PENDIENTE | Re-test 2026-06-10: login `ventas01` — sin redirect, lista de categorías visible, sin botón "Nueva categoría" ni mensaje de error |

---

## 1. Página de Productos (`/inventory/products`)

### 1a. Visual y estructura (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-PROD-01 | Título "Productos" visible | ADMIN | Encabezado "Productos" presente | ⏳ PENDIENTE | Re-test 2026-06-10: breadcrumb "Inventario → Productos" presente en la topbar (no hay h1 separado; el breadcrumb es el encabezado de página en este layout) |
| VIS-PROD-02 | Columnas tabla: SKU, Nombre, Categoría, Proveedor, Stock, Precio, Estado | ADMIN | Todas las columnas visibles | ⏳ PENDIENTE | Re-test 2026-06-10: columnas Código, Nombre, Categoría, Proveedor, Stock, Precio, Costo unit., Estado confirmadas en `get_page_text` |
| VIS-PROD-03 | Columna "Costo unitario" visible para ADMIN | ADMIN | Columna presente en la tabla | ⏳ PENDIENTE | Re-test 2026-06-10: columna "Costo unit." presente con valores ($180.00, $220.00, etc.) |
| VIS-PROD-04 | Columna "Acciones" visible para WAREHOUSEMAN | WAREHOUSEMAN | Ícono de movimiento en cada fila | ⏳ PENDIENTE | Login `almacen01` — columna "Acciones" con ícono `swap_vert` presente en cada fila |
| VIS-PROD-05 | Barra de búsqueda y filtros visibles | ADMIN | Campos búsqueda, categoría, estado, proveedor presentes | ⏳ PENDIENTE | Re-test 2026-06-10: "Buscar por código o nombre", Categoría, Estado, Proveedor todos presentes |
| VIS-PROD-06 | `StockBadge` muestra colores semánticos | ADMIN | Verde (ok), naranja (bajo), rojo (sin stock) | ⏳ PENDIENTE | Re-test 2026-06-10: zoom confirma verde (#E8F5E9, stock=5/10), naranja (#FFF3E0, PINT-BAR5G-049 stock=6), rojo (#FFEBEE, BLAN-SEC10-045 stock=0) |
| VIS-PROD-07 | `mat-progress-bar` visible durante carga | ADMIN | Barra en parte superior mientras carga | ⏳ PENDIENTE | Re-test 2026-06-10: confirmado por code review — `products-page.component.html` línea 72-74: `@if (loading) { <mat-progress-bar mode="indeterminate" class="catalog-page__progress" /> }` |

### 1b. Búsqueda y filtros (BSRCH)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| BSRCH-PROD-01 | Buscar por SKU exacto | ADMIN | Productos en BD | Filtra correctamente | ⏳ PENDIENTE | Re-test 2026-06-10: "LUBR" → 2 resultados (LUBR-ACE20-035, LUBR-SOL-036) |
| BSRCH-PROD-02 | Buscar por nombre (case insensitive) | ADMIN | Productos en BD | Encuentra el producto | ⏳ PENDIENTE | Re-test 2026-06-10: "lubr" (minúsculas) → mismos 2 resultados que "LUBR"; "aceite" → 1 resultado |
| BSRCH-PROD-03 | Buscar con acento / sin acento (accent insensitive) | ADMIN | Producto con nombre acentuado | Encuentra el producto | ⏳ PENDIENTE | RESUELTO — Re-test 2026-06-10: búsqueda "galon" devuelve 3 resultados incluyendo productos con "Galón" en el nombre. Fix `f_unaccent()` confirmado funcionando (BUG-INV-06 → ✅ RESUELTO) |
| BSRCH-PROD-04 | Filtrar por categoría | ADMIN | Varias categorías en BD | Solo muestra productos de esa categoría | ⏳ PENDIENTE | Re-test 2026-06-10: filtro "Cat-Int-12406" → 2 de 2 resultados (SKU-CANCEL-13082, SKU-SO-12823) |
| BSRCH-PROD-05 | Filtrar por estado (AVAILABLE / DISCONTINUED / OUT_OF_STOCK) | ADMIN | Productos con distintos estados | Lista filtrada por estado | ⏳ PENDIENTE | Re-test 2026-06-10: filtro "Sin stock" → 3 resultados (ELEC-PRO-043, BLAN-SEC10-045, COMP-SSD1T-044), todos "Sin stock" |
| BSRCH-PROD-06 | Filtrar por proveedor | ADMIN | Productos con distintos proveedores | Lista filtrada por proveedor | ⏳ PENDIENTE | Re-test 2026-06-10: "Constructora y Suministros del Bajío S.A." → 6 de 6 resultados |
| BSRCH-PROD-07 | Término sin resultados muestra estado vacío | ADMIN | Término inexistente | Ícono + "Sin resultados para …" | ⏳ PENDIENTE | Re-test 2026-06-10: "zzz999" → "Sin resultados / Ningún registro coincide con los filtros aplicados" + icono |
| BSRCH-PROD-08 | Botón "Limpiar filtros" restaura la lista completa | ADMIN | Filtros activos | Lista sin filtros; contador de filtros activos = 0 | ⏳ PENDIENTE | Re-test 2026-06-10: con filtro de proveedor activo, click en `filter_alt_off` restaura la lista completa de 108 productos sin filtros |

### 1c. RBAC en lista (RBAC)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-PROD-01 | Botón "Nuevo producto" visible | ADMIN | Visible | ⏳ PENDIENTE | Re-test 2026-06-10: botón "+ Nuevo producto" visible en la esquina superior derecha |
| RBAC-PROD-02 | Botón "Nuevo producto" visible | MANAGER | Visible | ⏳ PENDIENTE | Re-test 2026-06-10: login `manager01` — botón "Nuevo producto" visible |
| RBAC-PROD-03 | Botón "Nuevo producto" AUSENTE | WAREHOUSEMAN | Ausente del DOM | ⏳ PENDIENTE | Re-test 2026-06-10: login `almacen01` — botón "Nuevo producto" ausente del DOM |
| RBAC-PROD-04 | Botón "Nuevo producto" AUSENTE | SALES | Ausente del DOM | ⏳ PENDIENTE | Re-test 2026-06-10: login `ventas01` — botón "Nuevo producto" ausente del DOM |
| RBAC-PROD-05 | Columna "Costo unitario" visible | ADMIN | Columna presente | ⏳ PENDIENTE | Re-test 2026-06-10: columna "Costo unit." presente con valores para ADMIN |
| RBAC-PROD-06 | Columna "Costo unitario" visible | MANAGER | Columna presente | ⏳ PENDIENTE | Re-test 2026-06-10: login `manager01` — columna "Costo unit." presente con valores |
| RBAC-PROD-07 | Columna "Costo unitario" AUSENTE del DOM | WAREHOUSEMAN | Columna no renderizada | ⏳ PENDIENTE | Re-test 2026-06-10: login `almacen01` — headers sin "Costo unit." |
| RBAC-PROD-08 | Columna "Costo unitario" AUSENTE del DOM | SALES | Columna no renderizada | ⏳ PENDIENTE | Re-test 2026-06-10: login `ventas01` — headers Código/Nombre/Categoría/Proveedor/Stock/Precio/Estado, sin "Costo unit." |
| RBAC-PROD-09 | Ícono "Registrar movimiento" visible | ADMIN | Ícono en cada fila | ⏳ PENDIENTE | Re-test 2026-06-10: ícono `swap_vert` presente en la columna de acciones de cada fila |
| RBAC-PROD-10 | Ícono "Registrar movimiento" visible | WAREHOUSEMAN | Ícono en cada fila | ⏳ PENDIENTE | Re-test 2026-06-10: login `almacen01` — ícono `swap_vert` presente en cada fila |
| RBAC-PROD-11 | Ícono "Registrar movimiento" AUSENTE | SALES | Columna acciones sin ícono | ⏳ PENDIENTE | Re-test 2026-06-10: login `ventas01` — sin columna "Acciones" ni ícono `swap_vert` (displayedColumns no incluye 'actions' para SALES) |

### 1d. Botones e íconos de acción (UI)

> ⚠️ Verificar `$event.stopPropagation()` en todos los íconos de fila clickeable (L27 — BUG-M3-22).

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-PROD-01 | Click en fila abre diálogo de detalle | ADMIN | Lista cargada | Diálogo `ProductDetailDialog` abre sin navegar | ⏳ PENDIENTE | Re-test 2026-06-10: click en fila HMAN-DES-013 abre diálogo "Editar producto" sin cambiar la URL (`/inventory/products`) |
| UI-PROD-02 | Click en fila (WAREHOUSEMAN) abre diálogo en modo lectura | WAREHOUSEMAN | Lista cargada | Diálogo abre; campos deshabilitados; sin botón Guardar | ⏳ PENDIENTE | Login `almacen01` — click en fila HMAN-DES-013 abre "Ver producto" con campos como texto (no inputs editables) y único botón "Cerrar" |
| UI-PROD-03 | Ícono movimiento → clic abre `MovementDialog` sin navegar | ADMIN | Lista cargada | Diálogo de movimiento abre; página permanece | ⏳ PENDIENTE | Re-test 2026-06-10: click en `swap_vert` de HMAN-DES-013 abre "Registrar movimiento de stock" con Stock físico/Reservado/Disponible para salida, sin navegar |
| UI-PROD-04 | Ícono movimiento → confirmar movimiento → stock se actualiza | ADMIN | MovementDialog abierto con tipo IN | Snackbar verde; lista recarga con nuevo stock | ⏳ PENDIENTE | Re-test 2026-06-10: Entrada (IN) +5 sobre HMAN-DES-013, snackbar verde "Movimiento registrado correctamente.", stock 90→95 |
| UI-PROD-05 | Ícono movimiento → cancelar → stock NO cambia | ADMIN | MovementDialog abierto | Cerrar sin guardar; stock sin cambios | ⏳ PENDIENTE | Re-test 2026-06-10: con Cantidad=5 y Motivo llenados, click en "Cancelar" cierra el diálogo sin cambios; stock de HMAN-DES-013 permaneció en 90 |
| UI-PROD-PAG-01 | Paginador visible cuando hay > pageSize productos | BD con >20 productos | Paginador con total y opciones 10/20/50 | ⏳ PENDIENTE | Re-test 2026-06-10: 108 productos, "1-20 of 108", selector "Items per page" con opciones 10/20/50 confirmadas |
| UI-PROD-PAG-02 | Cambio de página carga página siguiente | Paginador visible | Filas cambian al ir a pág 2 | ⏳ PENDIENTE | Re-test 2026-06-10: click en flecha "siguiente" → "21-40 of 108" con filas distintas (HMAN-JLL-012, COMP-LT15-003, etc.) |
| UI-PROD-PAG-03 | Cambiar tamaño de página (10/20/50) recarga la lista con el nuevo tamaño | Paginador visible, >50 productos | Selector "Items por página" cambia a 10/50; tabla muestra el número correcto de filas; vuelve a página 0 | ⏳ PENDIENTE | Corregido y re-test 2026-06-11/12 (BUG-INV-10): estando en página 3 ("41-60 of 108", size=20), al cambiar "Items per page" a 10 la tabla muestra correctamente 10 filas y el rango vuelve a "1-10 of 108" (página 0). Navegación normal entre páginas (sin cambiar tamaño) sigue preservando el índice — "Siguiente" desde "1-10" → "11-20 of 108" ✅ |

### 1e. Estados vacíos (EMPTY)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| EMPTY-PROD-01 | Búsqueda sin resultados | Ícono + 'Sin resultados para "…"' | ⏳ PENDIENTE | Re-test 2026-06-10: búsqueda "zzz999" muestra ícono + "Sin resultados / Ningún registro coincide con los filtros aplicados." |
| EMPTY-PROD-02 | Filtro activo sin resultados | Mensaje + botón "Limpiar filtros" visible | ⏳ PENDIENTE | Re-test 2026-06-10: con búsqueda "zzz999" activa (sin resultados), botón `filter_alt_off` ("Limpiar filtros") visible junto a los filtros |

---

## 2. Diálogo Nuevo/Editar Producto (`ProductDetailDialogComponent`)

### 2a. RBAC en el diálogo (RBAC)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-PDET-01 | Título "Nuevo producto" al crear | ADMIN | "Nuevo producto" como título | ⏳ PENDIENTE | Verificado en browser 2026-06-10: diálogo "Nuevo producto" con SKU/Nombre/Precio/Costo/Stock inicial/Stock mínimo/Estado/Categoría/Proveedor/Descripción |
| RBAC-PDET-02 | Título "Editar producto" al editar | ADMIN | "Editar producto" como título | ⏳ PENDIENTE | Verificado en browser 2026-06-10: diálogo de HMAN-DES-013 muestra "Editar producto" |
| RBAC-PDET-03 | Título "Ver producto" para WAREHOUSEMAN | WAREHOUSEMAN | "Ver producto" como título | ⏳ PENDIENTE | Re-test 2026-06-10: login `almacen01` — título "Ver producto" presente en el diálogo |
| RBAC-PDET-04 | Campos editables y botón Guardar visible | ADMIN | Todos los inputs habilitados; "Guardar" presente | ⏳ PENDIENTE | Verificado en browser 2026-06-10: campos SKU/Nombre/Precio/Costo/Categoría/Proveedor/Descripción editables, "Guardar cambios" presente |
| RBAC-PDET-05 | Campos deshabilitados y sin botón Guardar | WAREHOUSEMAN | inputs `disabled:true`; sin "Guardar" | ⏳ PENDIENTE | Re-test 2026-06-10: login `almacen01` — campos como texto (no inputs), solo botón "Cerrar" |
| RBAC-PDET-06 | Botón "Desactivar" visible solo para ADMIN | ADMIN | Visible | ⏳ PENDIENTE | Verificado en browser 2026-06-10: botón "Desactivar" rojo visible en diálogo de edición de HMAN-DES-013 |
| RBAC-PDET-07 | Botón "Desactivar" AUSENTE para MANAGER | MANAGER | Ausente del DOM | ⏳ PENDIENTE | Re-test 2026-06-10: login `manager01` — diálogo "Editar producto" de HMAN-DES-013 con campos editables, "Cancelar"/"Guardar cambios", sin botón "Desactivar" |
| RBAC-PDET-08 | Campo "Costo unitario" visible para ADMIN | ADMIN | Campo presente y editable | ⏳ PENDIENTE | Verificado en browser 2026-06-10: campo "Costo unitario" presente con valor $180, editable |
| RBAC-PDET-09 | Campo "Costo unitario" AUSENTE para WAREHOUSEMAN | WAREHOUSEMAN | Campo no renderizado | ⏳ PENDIENTE | Re-test 2026-06-10: login `almacen01` — campo "Costo unitario" no renderizado en vista "Ver producto" |

### 2b. Validaciones del formulario (VAL)

> ⚠️ Verificar que "Guardar" esté deshabilitado al cargar el formulario de edición (`form.dirty = false`) y que se reactive solo al modificar un campo (L25 — BUG-M3-20).

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-PDET-01 | Campo SKU vacío → error inline | Formulario nuevo | Error "SKU requerido" bajo el campo | ⏳ PENDIENTE | Re-test 2026-06-10: blur en SKU vacío → "El SKU es obligatorio." |
| VAL-PDET-02 | Campo Nombre vacío → error inline | Formulario nuevo | Error "Nombre requerido" | ⏳ PENDIENTE | Re-test 2026-06-10: blur en Nombre vacío → "El nombre es obligatorio." |
| VAL-PDET-03 | Precio ≤ 0 → error | Precio = 0 | Error "Debe ser mayor a cero" | ⏳ PENDIENTE | Re-test 2026-06-10: Precio=0, blur → "El precio debe ser mayor a 0." |
| VAL-PDET-04 | Stock mínimo negativo → error | Valor negativo | Error de validación visible | ⏳ PENDIENTE | Re-test 2026-06-10: Stock mínimo=-1, blur → "El stock mínimo no puede ser negativo." (BUG-INV-02 confirmado corregido) |
| VAL-PDET-05 | Formulario inválido → botón Guardar deshabilitado | Campos inválidos | `disabled:true` en el DOM | ⏳ PENDIENTE | Re-test 2026-06-10: con SKU/Nombre/Precio/Costo/Categoría/Proveedor inválidos o vacíos, "Crear producto" permanece gris/deshabilitado |
| VAL-PDET-06 | Formulario de edición recién cargado → Guardar deshabilitado | Sin modificaciones | `disabled:true` (form.dirty = false) | ⏳ PENDIENTE | Verificado en browser 2026-06-10: "Guardar cambios" gris/deshabilitado al abrir diálogo de edición de HMAN-DES-013 |
| VAL-PDET-07 | Modificar un campo → Guardar se activa | Modificar nombre | `disabled:false` | ⏳ PENDIENTE | Verificado en browser 2026-06-10: al modificar SKU el botón "Guardar cambios" se activa (color púrpura) |
| VAL-PDET-08 | Guardar exitoso → Guardar se desactiva | Guardar con éxito | `disabled:true` (markAsPristine) | ⏳ PENDIENTE | Re-test 2026-06-10: tras guardar exitosamente (CRUD-PDET-02), al reabrir el diálogo de edición "Guardar cambios" está deshabilitado/gris (form pristine); se activa solo al modificar un campo (form.dirty) |
| VAL-PDET-09 | SKU duplicado → snackbar error con mensaje del backend | SKU ya existe | Snackbar rojo con mensaje 409/422 del backend | ⏳ PENDIENTE | Re-test 2026-06-10: al editar QA-CRUD-001 cambiando SKU a "ELEC-PRO-043" (ya en uso) y guardar, PUT /api/v1/inventory/products/854 → 409, snackbar rojo "El SKU 'ELEC-PRO-043' ya está en uso por otro producto.", diálogo permaneció abierto. SKU revertido a QA-CRUD-001 tras la prueba |
| VAL-PDET-10 | Campo Stock no es editable en el formulario | Formulario de edición | Campo "Stock actual" ausente o `disabled:true` — se registra vía movimientos | ⏳ PENDIENTE | Verificado en browser 2026-06-10: campo "Stock físico (solo lectura)" disabled con ícono de candado + hint "El stock físico solo puede modificarse mediante Registrar movimiento." |
| VAL-PDET-11 | Campo SKU > 50 caracteres → error o input no acepta más | Escribir 51+ caracteres en SKU | Error "Máximo 50 caracteres" o `maxlength` en el DOM impide escribir más | ⏳ PENDIENTE | Verificado en browser 2026-06-10: se escribieron 66 caracteres en SKU, el input quedó truncado a 50 (`maxLength=50` confirmado vía DOM) |
| VAL-PDET-12 | Campo Nombre > 150 caracteres → error o input no acepta más | Escribir 151+ caracteres en Nombre | Error "Máximo 150 caracteres" o `maxlength` en el DOM impide escribir más | ⏳ PENDIENTE | Verificado en browser 2026-06-10: atributo `maxLength=150` confirmado en input "Nombre" vía DOM |
| VAL-PDET-13 | Campo Descripción > 500 caracteres → error o input no acepta más | Escribir 501+ caracteres en Descripción | Error "Máximo 500 caracteres" o `maxlength` en el DOM impide escribir más | ⏳ PENDIENTE | Verificado en browser 2026-06-10: atributo `maxLength=500` confirmado en textarea "Descripción" vía DOM |
| VAL-PDET-14 | Guardar sin seleccionar Categoría → formulario inválido | Formulario nuevo, categoría sin seleccionar, resto completo | Botón "Guardar" deshabilitado o error "Categoría requerida" | ⏳ PENDIENTE | Re-test 2026-06-11/12: al hacer blur en "Categoría*" sin seleccionar, aparece "La categoría es obligatoria." (concordancia de género CORRECTA — texto femenino para "la categoría") y "Crear producto" permanece deshabilitado. El registro original 2026-06-10 indicaba "obligatorio" (masculino) — no reproducible en el código actual; ver BUG-INV-08 |
| VAL-PDET-15 | Guardar sin seleccionar Proveedor → formulario inválido | Formulario nuevo, proveedor sin seleccionar, resto completo | Botón "Guardar" deshabilitado o error "Proveedor requerido" | ⏳ PENDIENTE | Verificado en browser 2026-06-10: al hacer blur en "Proveedor*" sin seleccionar, aparece "El proveedor es obligatorio." y "Crear producto" permanece deshabilitado |

### 2c. CRUD Productos (CRUD)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-PDET-01 | Crear producto con todos los datos válidos | Formulario nuevo completo | Snackbar verde "Producto creado correctamente."; diálogo cierra; lista recarga | ⏳ PENDIENTE | Re-test 2026-06-10 con JWT fresco (re-login): producto QA-CRUD-001 creado, POST /api/v1/inventory/products → 201, snackbar verde "Producto creado correctamente.", diálogo cerró, lista recargó. Confirma diagnóstico de BUG-INV-09: ADMIN tiene permisos correctos, el 403 del intento 1 fue por JWT expirado (no RBAC) |
| CRUD-PDET-02 | Editar nombre de un producto | Producto existente | Snackbar verde "Producto actualizado."; lista refleja cambio | ⏳ PENDIENTE | Re-test 2026-06-10: editado el nombre de QA-CRUD-001 a "Producto QA CRUD-PDET-01 (editado)", PUT /api/v1/inventory/products/854 → 200, snackbar verde "Producto actualizado correctamente.", diálogo cerró, lista refleja el nuevo nombre |
| CRUD-PDET-03 | Desactivar producto — click Desactivar abre diálogo de confirmación | ADMIN, producto activo | Modal con texto confirmatorio | ⏳ PENDIENTE | Re-test 2026-06-10: click en "Desactivar" (dentro del diálogo de edición de QA-CRUD-001) abre modal "Desactivar producto" con texto '¿Deseas desactivar "Producto QA CRUD-PDET-01 (editado)" (QA-CRUD-001)?' y botones Cancelar/Desactivar |
| CRUD-PDET-04 | Cancelar desactivación — producto permanece activo | Diálogo confirmación | Sin cambios | ⏳ PENDIENTE | Re-test 2026-06-10: click en "Cancelar" del modal de confirmación lo cierra sin cambios; el diálogo de edición permanece abierto y el Estado sigue "Disponible" |
| CRUD-PDET-05 | Confirmar desactivación — producto desaparece de la lista activa | ADMIN, confirmar | Snackbar verde; producto ya no aparece | ⏳ PENDIENTE | Re-test 2026-06-10: click en "Desactivar" del modal confirma la baja, snackbar verde "Producto desactivado.", el diálogo cierra y la búsqueda "QA-CRUD-001" muestra "Sin resultados" en la lista (filtro por defecto = activos) |

### 2d. Kardex / Historial de movimientos (UI)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-PDET-01 | Sección "Kardex" visible en diálogo de detalle | ADMIN | Producto con movimientos | Tabla de movimientos visible con fecha, tipo, cantidad, motivo | ⏳ PENDIENTE | Re-test 2026-06-10: se registraron 6 movimientos de "Entrada" sobre QA-CRUD-001 vía "Registrar movimiento"; tab Kardex muestra tabla con columnas Fecha, Tipo, Cantidad, Motivo, Usuario — 6 filas visibles |
| UI-PDET-02 | Sección Kardex visible para WAREHOUSEMAN | WAREHOUSEMAN | Producto con movimientos | Tabla visible | ⏳ PENDIENTE | Login `almacen01` — tab "Kardex" en HMAN-DES-013 muestra el movimiento "Entrada +5, UI-PROD-04 confirmar movimiento de prueba, admin" |
| UI-PDET-03 | Paginación del Kardex funciona | ADMIN | Producto con movimientos | Paginador activo; cambio de página carga filas siguientes | ⏳ PENDIENTE | Re-test 2026-06-10: con los 6 movimientos de QA-CRUD-001, Items per page=5 → "1-5 of 6"; al hacer click en "siguiente" → "6-6 of 6" mostrando el movimiento restante |

---

## 3. Diálogo Movimiento de Stock (`MovementDialogComponent`)

### 3a. Visual y apertura (VIS / UI)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-MOV-01 | Diálogo muestra nombre y SKU del producto | ADMIN | Nombre y SKU del producto seleccionado visibles | ⏳ PENDIENTE | Re-test 2026-06-10: login `admin` — diálogo "Registrar movimiento de stock" muestra "Producto: (editado QA) (HMAN-DES-013)" |
| VIS-MOV-02 | Stock disponible visible antes de ingresar cantidad | ADMIN | "Stock disponible: N unidades" visible | ⏳ PENDIENTE | Re-test 2026-06-10: panel muestra "Stock físico 95 / Reservado (órdenes pendientes) 0 / Disponible para salida 95" |
| UI-MOV-01 | Selector de tipo: IN (Entrada) y OUT (Salida) disponibles | ADMIN | Ambas opciones en el `mat-select` | ⏳ PENDIENTE | Re-test 2026-06-10: "Entrada (IN)" y "Salida (OUT)" ambas presentes en el `mat-select` |

### 3b. Validaciones (VAL)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-MOV-01 | Cantidad vacía → error | Campo vacío | Error "Cantidad requerida" | ⏳ PENDIENTE | Re-test 2026-06-10: campo Cantidad vacío + blur → "La cantidad es obligatoria." |
| VAL-MOV-02 | Cantidad = 0 → error | Valor 0 | Error "Debe ser mayor a 0" | ⏳ PENDIENTE | Re-test 2026-06-10: cantidad = 0 + blur → "La cantidad debe ser al menos 1." |
| VAL-MOV-03 | Motivo vacío → error | Campo vacío | Error "Motivo requerido" | ⏳ PENDIENTE | Re-test 2026-06-10: campo Motivo vacío + blur → "El motivo es obligatorio." |
| VAL-MOV-04 | OUT con cantidad > stock disponible → error | availableStock = 5, cantidad = 10 | Error de validación; botón Guardar deshabilitado | ⏳ PENDIENTE | Re-test 2026-06-10: tipo OUT, availableStock=95, cantidad=9999 → "Supera el stock disponible (95 unidades)." y botón "Registrar" deshabilitado |
| VAL-MOV-05 | IN sin límite de cantidad — cualquier cantidad positiva válida | Tipo IN, cantidad 9999 | Sin error de máximo | ⏳ PENDIENTE | Re-test 2026-06-10: tipo IN, cantidad=9999 → sin error de máximo en Cantidad |
| VAL-MOV-06 | Motivo con > 300 caracteres → error | Texto largo | Error "Máximo 300 caracteres" | ⏳ PENDIENTE | Re-test 2026-06-10: el `<textarea>` tiene `maxlength="300"` — el navegador impide escribir más de 300 caracteres (verificado: al pegar 420 'a', `value.length`=300, sin `<mat-error>` y "Registrar" habilitado). Cumple la regla de negocio (no se puede exceder 300) mediante prevención en vez de mensaje de error |

### 3c. Reglas de negocio (RN)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RN-MOV-01 | Al cambiar tipo de IN a OUT se aplica validación de máximo automáticamente | Tipo cambia a OUT | Validación máx=availableStock aplicada sin submit | ⏳ PENDIENTE | Re-test 2026-06-10: con cantidad=9999 fija, IN→OUT → "Supera el stock disponible (95 unidades)." aparece sin tocar el campo Cantidad |
| RN-MOV-02 | Al cambiar tipo de OUT a IN se quita la validación de máximo | Tipo cambia de OUT a IN | Validación de máximo desaparece | ⏳ PENDIENTE | Re-test 2026-06-10: con cantidad=9999 fija, OUT→IN → error "Supera el stock disponible" desaparece, sin errores en Cantidad |
| RN-MOV-03 | Movimiento OUT correcto → stock disminuye en la lista | ADMIN, OUT 3 unidades | Lista de productos recarga; stock = anterior − 3 | ⏳ PENDIENTE | Re-test 2026-06-10: OUT -3 sobre HMAN-DES-013, 100→97 |
| RN-MOV-04 | Movimiento IN correcto → stock aumenta en la lista | ADMIN, IN 5 unidades | Lista de productos recarga; stock = anterior + 5 | ⏳ PENDIENTE | Re-test 2026-06-10: IN +5 sobre HMAN-DES-013, 95→100 |

### 3d. CRUD Movimiento (CRUD)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-MOV-01 | Registrar movimiento IN válido | Formulario completo, tipo IN | Snackbar verde "Movimiento registrado correctamente."; diálogo cierra | ⏳ PENDIENTE | Re-test 2026-06-10: IN cantidad=5, motivo="Movimiento de entrada - prueba QA re-test" sobre HMAN-DES-013 → snackbar verde "Movimiento registrado correctamente.", diálogo cierra, stock 95→100 |
| CRUD-MOV-02 | Registrar movimiento OUT válido | Formulario completo, tipo OUT, cantidad ≤ availableStock | Snackbar verde; diálogo cierra | ⏳ PENDIENTE | Re-test 2026-06-10: OUT cantidad=3, motivo="Movimiento de salida - prueba QA re-test" sobre HMAN-DES-013 → snackbar verde "Movimiento registrado correctamente.", diálogo cierra, stock 100→97 |
| CRUD-MOV-03 | Cancelar / cerrar sin guardar | Formulario con datos | Diálogo cierra; stock sin cambios; lista no recarga | ⏳ PENDIENTE | Re-test 2026-06-11: con cantidad=10, motivo="Movimiento que será cancelado - QA" (IN), clic en "Cancelar" → diálogo cierra, stock de HMAN-DES-013 permanece en 97 |

---

## 4. Página de Categorías (`/inventory/categories`)

### 4a. Visual y estructura (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-CAT-01 | Título "Categorías" visible | ADMIN | Encabezado presente | ⏳ PENDIENTE | Re-test 2026-06-11: breadcrumb superior "Inventario → Categorías" visible como título de la pantalla |
| VIS-CAT-02 | Columnas tabla: Nombre, Descripción, Acciones | ADMIN | Todas las columnas visibles | ⏳ PENDIENTE | Re-test 2026-06-11: columnas "Nombre", "Descripción" y columna de acciones con ícono `shopping_bag` (ver productos) en cada fila |
| VIS-CAT-03 | `mat-progress-bar` visible durante carga | ADMIN | Barra en parte superior | ⏳ PENDIENTE | Re-test 2026-06-11: template tiene `@if (loading) { <mat-progress-bar> }` — verificado por code review |

### 4b. Búsqueda (BSRCH)

> NUEVO (gap analysis 2026-06-10): `categories-page.component.ts` tiene `searchCtrl` con
> `debounceTime(350)` y campo "Buscar categoría" en el HTML, pero no existían casos de
> prueba para esta funcionalidad — análogo a BSRCH-PROD y BSRCH-SUP.

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| BSRCH-CAT-01 | Buscar por nombre exacto | ADMIN | Categorías en BD | Filtra a la(s) categoría(s) coincidente(s) | ⏳ PENDIENTE | Re-test 2026-06-11: "Cat-Cy-47061" → 1 resultado exacto |
| BSRCH-CAT-02 | Buscar en minúsculas (case insensitive) | ADMIN | Categoría con nombre en mayúsculas/mixto | Encuentra la categoría sin importar mayúsculas/minúsculas | ⏳ PENDIENTE | Re-test 2026-06-11: "cat-cy-47061" (minúsculas) → "Cat-Cy-47061" |
| BSRCH-CAT-03 | Buscar sin acento encuentra nombre acentuado (accent insensitive) | ADMIN | Categoría con acento (ej. "Climatización") | "climatizacion" encuentra "Climatización" — verificar `f_unaccent()` en `CategoryRepository` | ⏳ PENDIENTE | Re-test 2026-06-11: "construccion" (sin acento) → "Material de Construcción" |
| BSRCH-CAT-04 | Término sin resultados muestra estado vacío | ADMIN | Término inexistente | Ícono + 'Sin resultados para "…"' | ⏳ PENDIENTE | Re-test 2026-06-11: "zzzznoexiste" → ícono + "Sin resultados" / "Ningún registro coincide con los filtros aplicados." (texto no incluye el término entre comillas, pero cumple la función de estado vacío de búsqueda) |
| BSRCH-CAT-05 | Limpiar campo de búsqueda restaura la lista completa | ADMIN | Campo con término activo | Lista restaura todas las categorías activas | ⏳ PENDIENTE | Re-test 2026-06-11: borrar el campo de búsqueda restaura las 75 categorías (1-20 of 75) |
| BSRCH-CAT-06 | Buscar con ñ — normalización bidireccional | ADMIN | Categoría con "ñ" en el nombre (si existe) o usar "Climatización"/"Construcción" | Búsqueda sin diacríticos encuentra el nombre con diacríticos y viceversa | ⏳ PENDIENTE | Re-test 2026-06-11: búsqueda "límpíezá" (con acentos añadidos) → "Limpieza Profesional" (sin acentos en BD) — normalización bidireccional confirmada |

### 4c. RBAC en categorías (RBAC)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-CAT-01 | Botón "Nueva categoría" visible | ADMIN | Visible | ⏳ PENDIENTE | Re-test 2026-06-11: login `admin` — botón "+ Nueva categoría" visible arriba a la derecha |
| RBAC-CAT-02 | Botón "Nueva categoría" visible | MANAGER | Visible | ⏳ PENDIENTE | Re-test 2026-06-10: login `manager01` — botón "Nueva categoría" visible |
| RBAC-CAT-03 | Botón "Nueva categoría" AUSENTE | WAREHOUSEMAN | Ausente del DOM | ⏳ PENDIENTE | Re-test 2026-06-10: login `almacen01` — botón "Nueva categoría" ausente del DOM |
| RBAC-CAT-04 | Botón "Nueva categoría" AUSENTE | SALES | Ausente del DOM | ⏳ PENDIENTE | Re-test 2026-06-10: login `ventas01` — botón "Nueva categoría" ausente del DOM |
| RBAC-CAT-05 | Click en fila (ADMIN) abre diálogo edición | ADMIN | Diálogo de edición abre | ⏳ PENDIENTE | Re-test 2026-06-11: login `admin` — click en fila "Cat-Cy-47061" abre diálogo "Editar categoría" con Nombre="Cat-Cy-47061" y Descripción="test" precargados, botones Desactivar/Cancelar/Guardar cambios |
| RBAC-CAT-06 | Click en fila (WAREHOUSEMAN) NO abre diálogo | WAREHOUSEMAN | Sin acción; no abre diálogo | ⏳ PENDIENTE | Re-test 2026-06-10: login `almacen01` — click en fila "Cat-Cy-47061" solo resalta la fila, ningún diálogo se abre |

### 4d. Botones e íconos de acción (UI)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-CAT-01 | Ícono "Ver productos" en fila → navega a `/inventory/products?categoryId=X` | ADMIN | Lista cargada | Navega a productos filtrados por esa categoría | ⏳ PENDIENTE | Re-test 2026-06-11: clic en ícono shopping_bag de "Cat-Cy-47061" → navega a `/inventory/products?categoryId=647` con filtro Categoría="Cat-Cy-47061" preseleccionado; "Sin resultados" porque la categoría no tiene productos |
| UI-CAT-02 | Ícono "Editar" en fila → abre diálogo | ADMIN | Lista cargada | Diálogo de edición abre con datos precargados | ⏳ PENDIENTE | Re-test 2026-06-11: click en fila "Cat-Cy-47061" abre "Editar categoría" con Nombre y Descripción precargados (no hay ícono dedicado de editar — el click en la fila completa abre el diálogo, consistente con RBAC-CAT-06) |
| UI-CAT-PAG-01 | Paginador visible cuando hay > pageSize categorías | BD con >20 categorías | Paginador activo | ⏳ PENDIENTE | Re-test 2026-06-11: paginador muestra "1 – 20 of 75", botón "Next page" habilitado |
| UI-CAT-PAG-02 | Cambiar tamaño de página (10/20/50) recarga la lista con el nuevo tamaño | Paginador visible, >50 categorías | Selector "Items por página" cambia a 10/50; tabla muestra el número correcto de filas; vuelve a página 0 | ⏳ PENDIENTE | Re-test 2026-06-11: cambiar de 20 a 50 → "1 – 50 of 75", la lista vuelve a la página 0 (primera fila "Cat-Cy-47061") y muestra 50 filas |

### 4e. CRUD Categorías (CRUD)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-CAT-01 | Crear categoría con datos válidos | Formulario completo | Snackbar verde "Categoría creada."; diálogo cierra; lista recarga | ⏳ PENDIENTE | Re-test 2026-06-11: creada "Cat-QA-Retest-2026" / "Categoria de prueba QA re-test 2026-06-11" → snackbar verde "Categoría creada correctamente.", diálogo cierra, lista recarga |
| CRUD-CAT-02 | Editar nombre de categoría | Categoría existente | Snackbar verde "Categoría actualizada."; lista refleja cambio | ⏳ PENDIENTE | Re-test 2026-06-11: editado "Cat-QA-Retest-2026" → "Cat-QA-Retest-2026-Edited" → snackbar verde "Categoría actualizada correctamente.", lista refleja el nuevo nombre |
| CRUD-CAT-03 | Desactivar categoría abre diálogo de confirmación | ADMIN, categoría activa | Modal con texto de confirmación | ⏳ PENDIENTE | Re-test 2026-06-11: clic "Desactivar" sobre "Cat-QA-Retest-2026-Edited" → modal "Desactivar categoría" con texto "¿Deseas desactivar la categoría \"Cat-QA-Retest-2026-Edited\"? Esta acción ocultará la categoría del sistema." y botones Cancelar/Desactivar |
| CRUD-CAT-04 | Confirmar desactivación | ADMIN | Snackbar verde; categoría ya no aparece | ⏳ PENDIENTE | Re-test 2026-06-11: confirmar "Desactivar" → snackbar verde "Categoría desactivada.", "Cat-QA-Retest-2026-Edited" ya no aparece en la búsqueda (lista activa) |
| CRUD-CAT-05 | Intentar desactivar categoría con productos activos | Categoría con productos | Snackbar rojo con mensaje del backend | ⏳ PENDIENTE | Re-test 2026-06-11: clic "Desactivar" → confirmar sobre "Herramientas Manuales" → snackbar rojo "No se puede desactivar la categoría: tiene productos activos asignados. Reasigne o desactive los productos antes de continuar." |

### 4f. Validaciones formulario de categoría (VAL)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-CAT-01 | Nombre vacío → error inline | Campo vacío | Error "Nombre requerido" | ⏳ PENDIENTE | Re-test 2026-06-11: en "Editar categoría", vaciar el campo Nombre (cmd+a + Backspace) y blur → borde rojo + "El nombre es obligatorio." debajo del campo, "Guardar cambios" permanece deshabilitado |
| VAL-CAT-02 | Nombre duplicado → error del backend | Nombre ya existe | Snackbar rojo con mensaje 409/422 | ⏳ PENDIENTE | Re-test 2026-06-11: editar "Cat-Int-12406" → Nombre="Herramientas Manuales" → Guardar cambios → snackbar rojo "Ya existe otra categoría con el nombre 'Herramientas Manuales'.", diálogo permanece abierto |
| VAL-CAT-03 | Botón Guardar deshabilitado al cargar formulario de edición | Sin modificaciones | `disabled:true` (form.dirty = false) | ⏳ PENDIENTE | Re-test 2026-06-11: al abrir "Editar categoría" sobre "Cat-Cy-47061" sin modificar nada, "Guardar cambios" aparece en gris/deshabilitado |
| VAL-CAT-04 | Botón Guardar se activa al modificar un campo | Modificar nombre | `disabled:false` | ⏳ PENDIENTE | Re-test 2026-06-11: al escribir "X" al final de "Cat-Cy-47061" en el campo Nombre, "Guardar cambios" pasa de gris/deshabilitado a color marca/habilitado |

### 4g. Estado vacío (EMPTY)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| EMPTY-CAT-01 | Sin categorías activas en BD | Ícono + "Sin categorías registradas" | N/A | Re-test 2026-06-11: hay 75 categorías activas; no reproducible sin BD limpia |

---

## 5. Página de Stock Bajo (`/inventory/low-stock`)

### 5a. Visual y estructura (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-LST-01 | Contadores resumen visibles: "Sin stock", "Crítico", "Por reservas" | ADMIN | Los 3 contadores con valor numérico | ⏳ PENDIENTE | Re-test 2026-06-11: chips "1 sin stock" y "3 críticos" visibles; el chip "Por reservas" se renderiza condicionalmente solo si `reservasCount > 0` (código `low-stock-page.component.html` línea 22) — actualmente 0 productos en esa categoría, por lo que el chip no se muestra (consistente con RN-LST-03) |
| VIS-LST-02 | Columna "Severidad" con color semántico | ADMIN | Rojo (sin stock), naranja (crítico), amarillo (por reservas) | ⏳ PENDIENTE | Re-test 2026-06-11: "Sin stock" rojo #FFEBEE/#C62828; "Crítico" naranja #FFF3E0/#E65100 |
| VIS-LST-03 | Columna "Costo unitario" visible para ADMIN/MANAGER | ADMIN | Columna presente | ⏳ PENDIENTE | Re-test 2026-06-10: login `manager01` — columna "Costo unit." visible con valores ($1,750.00, $1,300.00, $5,500.00, $7,800.00) en /inventory/low-stock |
| VIS-LST-04 | Columna "Costo unitario" AUSENTE para WAREHOUSEMAN | WAREHOUSEMAN | Columna no renderizada | ⏳ PENDIENTE | Re-test 2026-06-10: login `almacen01` — headers Nivel/SKU/Nombre/Categoría/Proveedor/Físico/Reservado/Disponible/Mínimo/Déficit, sin "Costo unit." |
| VIS-LST-05 | Columnas numéricas (Stock actual, Reservado, Disponible, Mínimo, Déficit) muestran valores correctos y consistentes por fila | ADMIN | Lista cargada | Para cada fila: `availableStock = currentStock - reservedStock` y `deficit = minimumStock - availableStock` (coincide con `low-stock-page.component.ts`) | ⏳ PENDIENTE | Re-test 2026-06-11: 4 filas verificadas — HELEC-SIE-048 (3,0,3,8,+5), PINT-BAR5G-049 (6,0,6,10,+4), SEGV-NVR16-050 (1,0,1,4,+3), BLAN-SEC10-045 (0,0,0,2,+2) — todas cumplen `available=current-reserved` y `deficit=minimum-available` |

### 5b. RBAC en stock bajo (RBAC)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-LST-01 | Ícono "Registrar movimiento" visible | ADMIN | Visible en cada fila | ⏳ PENDIENTE | Re-test 2026-06-11: ícono `add_circle` (botón circular morado) presente en las 4 filas |
| RBAC-LST-02 | Ícono "Registrar movimiento" visible | WAREHOUSEMAN | Visible en cada fila | ⏳ PENDIENTE | Re-test 2026-06-10: login `almacen01` — botón circular `+` (add_circle) presente en las 4 filas (1 sin stock + 3 críticos) |
| RBAC-LST-03 | Ícono "Registrar movimiento" AUSENTE | SALES | Columna acciones ausente | ⏳ PENDIENTE | Re-test 2026-06-10: login `ventas01` — headers Nivel/SKU/Nombre/Categoría/Proveedor/Físico/Reservado/Disponible/Mínimo/Déficit, sin columna "Acciones" ni "Costo unit.", página carga sin snackbar de error |

### 5c. Botones e íconos de acción (UI)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-LST-01 | Ícono movimiento → abre `MovementDialog` correctamente | ADMIN | Lista con productos bajo stock | Diálogo abre con datos del producto | ⏳ PENDIENTE | Re-test 2026-06-11: clic en `add_circle` de HELEC-SIE-048 → diálogo "Registrar movimiento de stock" con "Producto: Sierra Circular 7-1/4\" 1800W (HELEC-SIE-048)", Stock físico=3, Disponible=3, tipo "Entrada (IN)" preseleccionado |
| UI-LST-02 | Movimiento IN desde stock bajo → lista recarga | ADMIN | MovementDialog abierto, tipo IN | Snackbar verde; lista actualizada | ⏳ PENDIENTE | Re-test 2026-06-11: IN +5 en HELEC-SIE-048 (3→8) → snackbar verde "Movimiento registrado correctamente."; lista recargó: "3 críticos"→"2 críticos", apareció chip nuevo "1 por reservas" y HELEC-SIE-048 ahora con severidad "Por reservas" (Físico=8=Mínimo, Déficit=0) |

### 5d. Reglas de negocio (RN)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RN-LST-01 | Productos ordenados por déficit descendente (mayor déficit primero) | Lista cargada con varios productos | Producto con mayor déficit (min-available) en primera fila | ⏳ PENDIENTE | Re-test 2026-06-11: orden de Déficit es +5, +4, +3, +2 — descendente |
| RN-LST-02 | Déficit = minimumStock − availableStock | Producto con min=10, available=3 | Columna "Déficit" muestra 7 | ⏳ PENDIENTE | Re-test 2026-06-11: fórmula confirmada para las 4 filas en VIS-LST-05 (ej. PINT-BAR5G-049: min=10, available=6, déficit=+4=10-6) |
| RN-LST-03 | Producto con reservas y stock ≥ mínimo → severidad "Por reservas" | Producto con reservedStock>0, currentStock≥min | Etiqueta "Por reservas" en columna severidad | ⏳ PENDIENTE | Re-test 2026-06-11: tras IN +5 en HELEC-SIE-048 (Físico=8=Mínimo=8, Reservado=0, Disponible=8), la fila muestra severidad "Por reservas" y el chip "1 por reservas" aparece. Nota: `getSeverity()` (low-stock-page.component.ts) asigna "reservas" cuando `currentStock >= minimumStock`, sin verificar `reservedStock>0` directamente — el caso real verificado tiene reservedStock=0, condición algo más amplia que la descrita pero consistente con el código fuente (no es un bug, solo observación) |

### 5e. Estado vacío (EMPTY)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| EMPTY-LST-01 | Sin productos con stock bajo | Ícono + "Sin productos con bajo stock" | N/A | Re-test 2026-06-11: hay 4 productos con bajo stock activos; no reproducible sin modificar datos masivamente (anterior: N/A) |

---

## 6. Mensajes de error y éxito (ERR)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| ERR-01 | Snackbar éxito: fondo verde `#2E7D32` | Crear/editar producto o categoría | Color correcto; clase `snackbar-success` | ⏳ PENDIENTE | Re-test 2026-06-11: snackbar verde "Movimiento registrado correctamente." (HELEC-SIE-048) y "Categoría creada/actualizada correctamente." en CRUD-CAT-01/02 |
| ERR-02 | Snackbar error: fondo rojo `#C62828` | Error del backend | Color correcto; clase `snackbar-error` | ⏳ PENDIENTE | Re-test 2026-06-11: snackbar rojo en CRUD-CAT-05 ("No se puede desactivar la categoría...") y VAL-CAT-02 |
| ERR-03 | Mensaje específico del backend en snackbar (no genérico) | Backend rechaza con 409/422 | Texto descriptivo del backend visible | ⏳ PENDIENTE | Re-test 2026-06-11: VAL-CAT-02 mostró "Ya existe otra categoría con el nombre 'Herramientas Manuales'."; CRUD-CAT-05 mostró mensaje específico de productos asignados |
| ERR-04 | Error al registrar movimiento OUT > stock → mensaje en el diálogo (no snackbar) | OUT cantidad > disponible | Mensaje de error inline en el diálogo; diálogo NO se cierra | ⏳ PENDIENTE | Re-test 2026-06-11: en SEGV-NVR16-050 (disponible=1), OUT=100 → error inline "Supera el stock disponible (1 unidades)." bajo el campo Cantidad, botón "Registrar" deshabilitado, diálogo permanece abierto |
| ERR-05 | Error al cargar productos → snackbar con mensaje útil | Backend apagado | "Error al cargar productos." visible | N/A | Re-test 2026-06-11: no reproducible sin apagar backend |
| ERR-06 | Error al cargar categorías → snackbar con mensaje útil | Backend apagado | "Error al cargar categorías." visible | N/A | Re-test 2026-06-11: no reproducible sin apagar backend |
| ERR-07 | Error al cargar stock bajo → snackbar con mensaje útil | Backend apagado | "Error al cargar productos con bajo stock." visible | N/A | Re-test 2026-06-11: no reproducible sin apagar backend |
| ERR-08 | Progress bar visible durante carga inicial en cada pantalla | Navegar a la pantalla | Barra indeterminada mientras carga | N/A | Re-test 2026-06-11: carga demasiado rápida para verificar manualmente con datos locales |

---

## 7. Visual general del módulo (VIS)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| VIS-GEN-01 | Sidebar colapsado al entrar a cualquier pantalla del módulo | Sidebar en modo íconos al navegar | ⏳ PENDIENTE | Re-test 2026-06-11: sidebar en modo íconos (64px) en `/inventory/products`, `/inventory/categories` y `/inventory/low-stock` |
| VIS-GEN-02 | Breadcrumb correcto: "Inventario → Productos" / "→ Categorías" / "→ Stock bajo" | Breadcrumb en topbar correcto | ⏳ PENDIENTE | Re-test 2026-06-11: "Inventario → Productos", "Inventario → Categorías", "Inventario → Bajo stock" — correctos en topbar |
| VIS-GEN-03 | Botones primarios con color de marca `#6B3C6B` | "Nuevo producto", "Nueva categoría", "Guardar" con color correcto | ⏳ PENDIENTE | Re-test 2026-06-11: "Nuevo producto" → `getComputedStyle` confirma `background-color: rgb(107, 60, 107)` (#6B3C6B), texto blanco |
| VIS-GEN-04 | Botones destructivos con color `warn` (rojo) | "Desactivar" en rojo | ⏳ PENDIENTE | Re-test 2026-06-11: botón "Desactivar" en rojo en diálogo "Editar producto" y "Editar categoría" |
| VIS-GEN-05 | Diálogos de confirmación son modales (click fuera no cierra) | Click backdrop → diálogo permanece | ⏳ PENDIENTE | Corregido y re-test 2026-06-12 (BUG-INV-14): añadido `disableClose: true` a `DIALOG_CONFIG` (products-page y categories-page) y a los `ConfirmDialogComponent` de `category-form-dialog.component.ts` y `product-detail-dialog.component.ts`. Verificado en browser: "Editar categoría" → backdrop → permanece abierto; "Desactivar categoría" (ConfirmDialog) → backdrop → permanece abierto; "Editar producto" → backdrop → permanece abierto; "Desactivar producto" (ConfirmDialog) → backdrop → permanece abierto. Los botones "Cancelar" siguen cerrando correctamente ambos niveles de diálogo |
| VIS-GEN-06 | Header de tabla con fondo `#F2E4F2` y texto `#6B3C6B` | Colores de marca correctos en todas las tablas | ⏳ PENDIENTE | Corregido y re-test 2026-06-12 (BUG-INV-07): `getComputedStyle('.mat-mdc-header-cell')` en `/inventory/products` y `/inventory/categories` devuelve `background-color: rgb(242,228,242)` (#F2E4F2), `color: rgb(107,60,107)` (#6B3C6B) en TODAS las celdas de header (incluida la columna de acciones sin texto) |
| VIS-GEN-07 | Texto largo en celdas se trunca con `…` y tooltip con valor completo | Nombre/descripción larga | Truncado + tooltip | ⏳ PENDIENTE | Re-test 2026-06-11: en `/inventory/products`, fila "Barniz marino 5 galones para exteriores" se trunca y al hacer hover muestra tooltip "Barniz marino para exteriores" |

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
| CYBER-01 | El JWT decodificado (jwt.io / `atob`) no contiene contraseña ni datos sensibles en el payload | ADMIN | Sesión activa | Claims limitados a `sub`, `roles`, `iat`, `exp` (sin password/email sensible) | ⏳ PENDIENTE | Re-test 2026-06-11: payload decodificado = `{"sub":"admin","roles":["ROLE_ADMIN","ROLE_WAREHOUSEMAN"],"iat":...,"exp":...}` — sin contraseña ni datos sensibles |
| CYBER-02 | Manipular el JWT en `localStorage` (cambiar rol a `ROLE_ADMIN`) y recargar | SALES | Sesión SALES activa, editar token en Application→LocalStorage | El backend rechaza con 401/403 al primer request; frontend redirige a login (no se otorga acceso elevado por confiar en un JWT alterado) | ⏳ PENDIENTE | Re-test 2026-06-12 (BUG-INV-13 — NO REPRODUCIBLE): login `ventas01`/SALES, se alteró `roles`/`role` del JWT a `["ROLE_ADMIN"]` en `localStorage` (firma queda inválida) y se navegó a `/inventory/products`. `GET /inventory/products`, `/inventory/categories/active` y `/purchases/suppliers/active` → **401** (antes 403, antes de BUG-INV-09). `error.interceptor.ts` detecta el 401, limpia `localStorage` y redirige a `/login?reason=expired` con snackbar rojo "Tu sesión ha expirado. Inicia sesión nuevamente." — sin flash de UI de ADMIN (confirmado con screenshot inmediato, sin esperar). Ver detalle abajo |
| CYBER-03 | Eliminar el JWT de `localStorage` con la sesión activa y navegar/recargar | ADMIN | Sesión activa, borrar `localStorage` clave del token | Redirige a `/login`; próximas peticiones HTTP devuelven 401 | ⏳ PENDIENTE | Re-test 2026-06-11: con sesión ADMIN activa en `/inventory/categories`, se ejecutó `localStorage.removeItem('almacenes_token')` y se navegó a `/inventory/categories` → la app redirigió automáticamente a `/login` |
| CYBER-04 | Inyección SQL en campo de búsqueda de productos: `' OR '1'='1` y `'; DROP TABLE products;--` | ADMIN | Campo de búsqueda de Productos | Sin error 500; backend trata el texto como literal; sin resultados o resultados normales; tabla `products` intacta | ⏳ PENDIENTE | Re-test 2026-06-11: ambos payloads en el campo "Buscar por código o nombre" → "Sin resultados" sin error 500/consola; al limpiar, la tabla de 108 productos vuelve a cargar normalmente (tabla `products` intacta) |
| CYBER-05 | XSS almacenado: crear producto/categoría con nombre `<script>alert(1)</script>` | ADMIN | Formulario Nuevo producto / Nueva categoría | El valor se guarda como texto; al listar/ver el detalle se muestra escapado (`&lt;script&gt;`) sin ejecutar el script | ⏳ PENDIENTE | Re-test 2026-06-11: creada categoría con Nombre=`<script>document.title='XSS-CAT'</script>QA` y Descripción=`<img src=x onerror="this.dataset.xss=1">QA-XSS-test` → se guardó y listó como texto literal en la tabla y en el formulario "Editar categoría"; `document.title` permanece "Almacenes", sin elementos `<script>`/`<img>` creados en el DOM. Categoría de prueba desactivada al finalizar |
| CYBER-06 | XSS reflejado vía query param: navegar a `/inventory/products?search=<img src=x onerror=alert(1)>` | ADMIN | URL manual con payload en `?search=` | El valor se usa como texto en el campo de búsqueda / petición HTTP; ningún script se ejecuta | ⏳ PENDIENTE | Re-test 2026-06-11: navegado a `/inventory/products?search=<img src=x onerror=document.title='XSS-TEST'>` (URL-encoded) — `document.title` permanece "Almacenes" (script NO ejecutado), el componente solo lee `categoryId` de queryParams (no `search`), campo de búsqueda queda vacío, lista de 108 productos carga normalmente |
| CYBER-07 | Respuesta JSON de `GET /inventory/products` NO incluye `unitCost`/`costPrice` para WAREHOUSEMAN/SALES | WAREHOUSEMAN, SALES | DevTools → pestaña Network, inspeccionar response body | Campo `unitCost` ausente del JSON (no solo oculto en UI) | ⏳ PENDIENTE | Corregido y re-test 2026-06-11 (BUG-INV-11): `GET /inventory/products`, `/products/{id}`, `/products/sku/{sku}`, `/products/category/{id}`, `/products/low-stock` con JWT de `almacen01` (WAREHOUSEMAN) y `ventas01` (SALES) → `unitCost: null` en todos los registros. Con JWT de `admin` (ADMIN) → `unitCost` con valor real. Ver detalle de verificación abajo |
| CYBER-08 | Acceso directo a la API sin token: `curl http://localhost:8080/api/v1/inventory/products` | (sin JWT) | Backend corriendo | HTTP 401 Unauthorized; sin datos en el body | ⏳ PENDIENTE | Re-test 2026-06-11 (post fix BUG-INV-09): `curl -s -o /dev/null -w "%{http_code}"` → **401**, body `{"status":401,"error":"Unauthorized","message":"Token JWT ausente, inválido o expirado. Inicia sesión nuevamente."}`, sin datos de negocio expuestos. `JwtAuthenticationEntryPoint` corrige el código. Ver BUG-INV-09 ✅ Corregido |
| CYBER-09 | Acceso a endpoint de escritura con rol sin permiso vía `curl`: `POST /inventory/products` con JWT de SALES | SALES | Token JWT válido de SALES capturado del login | HTTP 403 Forbidden | ⏳ PENDIENTE | Re-test 2026-06-10: `fetch()` con JWT real de `ventas01` → `POST /inventory/products` → 403; `POST /inventory/products/movement` → 403. Ambos correctamente rechazados |
| CYBER-10 | Mensajes de error del backend (4xx/5xx) no exponen stack traces, rutas de archivos ni nombres de tablas/clases internas | ADMIN | Forzar un error (ej. crear producto con SKU duplicado, o payload malformado) | Mensaje de error de negocio legible; sin trazas Java/SQL en el body de la respuesta ni en el snackbar | ⏳ PENDIENTE | Re-test 2026-06-11: `POST /inventory/products` con SKU duplicado (`PINT-BAR5G-049`) → 409 `{"timestamp":...,"status":409,"error":"Conflict","message":"Ya existe un producto con el SKU 'PINT-BAR5G-049'."}` — sin stack trace, rutas de archivo ni nombres de clases/tablas |
| CYBER-11 | Token JWT expirado (simular cambiando `exp` o esperando 2h) → request rechazado | ADMIN | JWT expirado | HTTP 403/401; frontend redirige a `/login` con "Tu sesión ha expirado..."; sin loop infinito de redirects | ⏳ PENDIENTE | Re-test 2026-06-11 (post fix BUG-INV-09): (1) Ruta de navegación (guard client-side): `exp` modificado a 1h en el pasado → `authGuard` detecta `getTokenState()==='expired'` y redirige a `/login?reason=expired` sin request HTTP. (2) Ruta de request a mitad de sesión (escenario antes ⚠️ ABIERTO de BUG-INV-09): JWT con firma manipulada (exp futuro válido) → backend responde **401** (antes 403) con `{"message":"Token JWT ausente, inválido o expirado..."}`; `error.interceptor.ts` detecta el 401, elimina el token de `localStorage` y redirige a `/login?reason=expired` mostrando el mensaje del backend en snackbar rojo — sin loop de redirects, sin errores de consola. Ambos escenarios correctos. Ver BUG-INV-09 ✅ Corregido |
| CYBER-12 | IDOR — acceder a `/inventory/products` y abrir el detalle de un producto cuyo `id` no corresponde a ningún elemento visible en la lista filtrada del rol actual (ID secuencial adivinado) | SALES | Conocer/adivinar un `id` válido | El backend solo permite lo autorizado por rol (lectura general permitida para SALES); para escritura (`PUT/PATCH`) responde 403 si SALES intenta modificar | ⏳ PENDIENTE | Re-test 2026-06-10: `fetch()` con JWT de `ventas01` → `GET /inventory/products/1` → 200 (lectura abierta, esperado); `PUT /inventory/products/1` → 403 (escritura bloqueada correctamente) |
| CYBER-13 | Cabeceras CORS de la API no permiten `Access-Control-Allow-Origin: *` junto con `Access-Control-Allow-Credentials: true` | — | `curl -I` a cualquier endpoint con header `Origin` arbitrario | Configuración CORS restringida a orígenes conocidos (no wildcard + credentials) | ⏳ PENDIENTE | Re-test 2026-06-11 (post fix BUG-INV-15): `curl -X OPTIONS .../inventory/products -H "Origin: http://evil.example.com"` → `HTTP 403`, SIN headers `Access-Control-Allow-*`. Con `Origin: http://localhost:4200` (origen del frontend) → `Access-Control-Allow-Origin: http://localhost:4200` + `Access-Control-Allow-Credentials: true`. `SecurityConfig.java` ahora usa `setAllowedOrigins(...)` con lista explícita configurable vía `CORS_ALLOWED_ORIGINS` (default `http://localhost:4200`). ✅ Corregido — ver BUG-INV-15 |
| CYBER-14 | Login con credenciales incorrectas no revela si el usuario existe | (sin sesión) | Probar `admin`/`pass-incorrecto` vs `usuario-inexistente`/`cualquier-pass` | Mismo mensaje genérico "Usuario o contraseña incorrectos" en ambos casos | ⏳ PENDIENTE | Re-test 2026-06-11 (post fix BUG-INV-16): `POST /auth/login` con `admin`/`wrongpass` y con `usuario_que_no_existe_xyz`/`cualquierpass` → ambos devuelven el MISMO body `{"status":401,"error":"Unauthorized","message":"Credenciales incorrectas."}` — no revela existencia de usuario, y el código HTTP ahora es 401 (correcto). Ver BUG-INV-16 ✅ Corregido |
| CYBER-15 | Campo de contraseña en formularios (login, cambio de contraseña) usa `type="password"` y no se loggea en consola/network como texto plano fuera de HTTPS | (sin sesión) | DevTools → Console + Network durante login | Sin contraseña visible en consola; input enmascarado | ⏳ PENDIENTE | Re-test 2026-06-11: `login.component.html` usa `[type]="hidePassword ? 'password' : 'text'"` con `formControlName="password"` — enmascarado por defecto con toggle de visibilidad explícito (ícono ojo). El body de `POST /auth/login` viaja en texto plano por ser HTTP en `dev` local — limitación ya documentada (ASVS V9.1.1, no aplica en dev, revisar `environment.prod.ts` para HTTPS en producción) |
| CYBER-16 | Búsqueda con caracteres especiales HTML (`"`, `<`, `>`, `&`) en filtros no rompe el layout ni inyecta atributos | ADMIN | Campo de búsqueda con `"><svg onload=alert(1)>` | Caracteres tratados como texto literal; sin alteración del DOM fuera del campo | ⏳ PENDIENTE | Re-test 2026-06-11: tipeado `"><svg onload=document.title='XSS-CYBER16'>` en "Buscar por código o nombre" → `document.title` permanece "Almacenes" (sin ejecución), tabla muestra "Sin resultados" sin romper layout, sin elementos `<svg>` inyectados fuera del campo |
| CYBER-17 | Movimiento de stock (`POST /api/v1/inventory/products/movement`) con `productId` de un producto inactivo/inexistente | ADMIN | `productId` inválido vía request manual (Postman/curl) | HTTP 404/422 con mensaje de negocio; no crea el movimiento ni altera stock | ⏳ PENDIENTE | Re-test 2026-06-11: `POST /inventory/products/movement` con `productId:999999` → 404 `{"status":404,"error":"Not Found","message":"Producto con id 999999 no encontrado."}` — sin crear movimiento |
| CYBER-18 | Cabeceras de seguridad HTTP en las respuestas de la API y del frontend (`X-Content-Type-Options: nosniff`, `X-Frame-Options`, `Content-Security-Policy`, `Strict-Transport-Security` en prod) | — | `curl -I http://localhost:8080/api/v1/inventory/products` y `curl -I http://localhost:4200/` | `SecurityConfig.java` no tiene bloque `.headers(...)` explícito → aplican los defaults de Spring Security 6: `X-Content-Type-Options: nosniff` y `X-Frame-Options: DENY` deberían estar presentes (PASS esperado); `Content-Security-Policy` y `Strict-Transport-Security` NO están configurados → esperar su ausencia y documentarla como hallazgo (ASVS V14.4) | N/A — diferido a checklist de producción | Re-test 2026-06-11: Backend → `X-Content-Type-Options: nosniff` y `X-Frame-Options: DENY` presentes (PASS, defaults de Spring Security); `Content-Security-Policy` y `Strict-Transport-Security` ausentes (esperado en dev, ASVS V14.4). Frontend (`ng serve` dev en :4200) → ninguna cabecera de seguridad (esperado, es el dev-server de Angular CLI). NO es un bug de código — depende del servidor estático/reverse-proxy de producción (aún no elegido) y del dominio HTTPS real. Documentado como checklist obligatorio de pre-despliegue en `memoria_tecnica_global_proyecto.md` §9 — L28 (2026-06-12). Re-ejecutar este caso contra el dominio de producción al desplegar |
| CYBER-19 | Rate limiting / bloqueo tras múltiples intentos fallidos de login | (sin sesión) | `POST /api/v1/auth/login` con credenciales incorrectas 5-10 veces seguidas | El backend bloquea, retrasa o introduce captcha tras N intentos; si no lo hace, documentar como hallazgo (ASVS V2.2.1) | ⏳ PENDIENTE | Corregido y re-test 2026-06-12 (BUG-INV-17): 5 intentos consecutivos con credenciales incorrectas → 401; a partir del 6º → **429 Too Many Requests** `{"message":"Demasiados intentos fallidos. Intenta nuevamente en 15 minuto(s)."}`. Bloqueo por usuario (case-insensitive), 15 min, se reinicia con login exitoso. Ver detalle de verificación abajo |
| CYBER-20 | Logout invalida la sesión: tras cerrar sesión, el botón "atrás" del navegador no muestra datos de Inventario sin re-autenticación | ADMIN | Sesión activa, navegar a `/inventory/products`, cerrar sesión | `localStorage` sin token; redirige a `/login`; botón atrás no expone datos protegidos (o redirige a login) | ⏳ PENDIENTE | Re-test 2026-06-11: con sesión ADMIN en `/inventory/products`, clic en "Cerrar sesión" → redirige a `/login`, `localStorage.getItem('almacenes_token')` retorna `null`. Botón "atrás" del navegador permanece en `/login`, sin exponer datos de Inventario |
| CYBER-21 | Validación server-side independiente del cliente: `POST /api/v1/inventory/products` vía curl con `price: -10` o `sku` de 60 caracteres, evitando los `Validators` de Angular | ADMIN | Token JWT válido de ADMIN, request manual (Postman/curl) con payload inválido | HTTP 400/422 — el backend rechaza el payload aunque el frontend nunca lo hubiera enviado así | ⏳ PENDIENTE | Re-test 2026-06-11: `POST /inventory/products` con `price:-10` → 400 `"Validación fallida: price: El precio debe ser mayor a cero"`; con `sku` de 60 caracteres → 400 `"Validación fallida: sku: el tamaño debe estar entre 0 y 50"`. Ambos rechazados server-side independientemente del frontend |
| CYBER-22 | JWT con algoritmo alterado a `none` o firma inválida es rechazado | ADMIN | Construir manualmente un JWT con `alg: none` (sin firma) o con firma modificada, usarlo en `Authorization` header | HTTP 401 — el backend valida la firma y el algoritmo, no confía en el payload sin verificar | ⏳ PENDIENTE | Re-test 2026-06-11 (post fix BUG-INV-09): JWT con header `{"alg":"none","typ":"JWT"}` y firma vacía → **401** (rechazado); JWT con firma real pero 1er carácter de la firma alterado → **401** (rechazado); firma vacía → **401** (rechazado). En los 3 casos `parseSignedClaims` invalida el token y `JwtAuthenticationEntryPoint` responde 401 (antes 403). Ver BUG-INV-09 ✅ Corregido. NOTA informativa (sin cambios): agregar un carácter extra al final de una firma de 64 chars (65 chars, grupo base64 incompleto) → 200 — esto NO es un bypass: el grupo base64 incompleto de 1 carácter se descarta en la decodificación y los bytes de firma decodificados son IDÉNTICOS a los del token original válido; verificado que alterar un byte real de la firma sí es rechazado (401) |

---

## 9. Historial de bugs encontrados en este módulo

| Bug ID | Descripción | Componente | Estado |
|---|---|---|---|
| BUG-INV-01 | Botón "Guardar cambios" habilitado sin modificaciones en formulario de edición | `product-form.component.html` | ✅ CORREGIDO — `!form.dirty` añadido |
| BUG-INV-02 | Sin mensaje de error visible para stock mínimo negativo | `product-form.component.html` | ✅ CORREGIDO — `<mat-error>` para `min` añadido |
| BUG-INV-03 | Botón "Guardar cambios" habilitado sin modificaciones en categorías | `category-form.component.html` | ✅ CORREGIDO — `!form.dirty` añadido |
| BUG-INV-04 | Vista read-only (WAREHOUSEMAN/SALES) sin título "Ver producto" | `product-detail.component.html` | ✅ CORREGIDO — `<h3>Ver producto</h3>` añadido |
| BUG-INV-05 | Sin mensaje de error visible para motivo > 300 caracteres | `movement-dialog.component.html` | ✅ CORREGIDO — `<mat-error>` para `maxlength` añadido |
| BUG-INV-06 | Búsqueda no normaliza acentos (accent-insensitive no implementado) | Backend `ProductServiceImpl` | ✅ RESUELTO — re-test 2026-06-10: "galon" → 3 resultados con "Galón" |
| BUG-INV-07 | Headers de tabla sin colores de marca en tablas no-sticky (productos, categorías) | `products-page`, `categories-page` SCSS | ✅ CORREGIDO (2026-06-12) — ver detalle de verificación abajo |
| BUG-INV-08 | Mensaje de error "La categoría es obligatorio." — concordancia de género incorrecta (debería ser "obligatoria") | `product-form.component.html` | ✅ NO REPRODUCIBLE (2026-06-11/12) — ver detalle de verificación abajo |
| BUG-INV-09 | El backend respondía **403 Forbidden** (en vez de 401) cuando el JWT estaba ausente, inválido o expirado, y el frontend no detectaba esta condición como "sesión expirada" — mostraba mensajes de error genéricos en su lugar | Backend `SecurityConfig.java` (faltaba `AuthenticationEntryPoint`/`AccessDeniedHandler` propios) + Frontend `error.interceptor.ts` (ya manejaba 401, pero nunca lo recibía) | ✅ CORREGIDO (2026-06-11) — ver detalle de verificación abajo |
| BUG-INV-10 | Cambiar "Items per page" no vuelve a página 0 (mat-paginator preserva el primer índice visible) | `products-page.component` (mat-paginator) | ✅ CORREGIDO (2026-06-12) — ver detalle de verificación abajo |
| BUG-INV-11 | `unitCost` expuesto en el JSON de respuesta de `GET /inventory/products` y `GET /inventory/products/low-stock` para WAREHOUSEMAN/SALES — solo oculto en la UI, no en el backend | Backend `ProductServiceImpl.java` (sin filtrado por rol en los DTO de lectura) | ✅ CORREGIDO (2026-06-11) — ver detalle de verificación abajo |
| BUG-INV-12 | `GET /api/v1/purchases/suppliers/active` responde **403 Forbidden** para SALES; como esta llamada está en el mismo `forkJoin` que `categories/active` en `ProductsPageComponent.ngOnInit()`, el `forkJoin` completo falla y NUNCA se asignan `this.categories` ni `this.suppliers` — los filtros "Categoría" y "Proveedor" quedan vacíos (solo "Todas"/"Todos") para el rol SALES, además de mostrarse un snackbar rojo "No tienes permiso para realizar esta acción." al cargar la página | `products-page.component.ts` (`forkJoin`), `products-page.component.html` (filtro "Proveedor") | ✅ CORREGIDO (2026-06-12) — ver detalle de verificación abajo |
| BUG-INV-13 | Al manipular el rol del JWT en `localStorage` (firma queda inválida) y recargar, el frontend decodificaba el token sin validar la firma y renderizaba la UI del rol falsificado (badge, sidebar, botones de ADMIN) antes de que el backend rechazara las peticiones reales (403) — escalada de privilegios cosmética en la UI | `AuthService`/`error.interceptor.ts` (dependía del código HTTP devuelto por el backend para una sesión inválida) | ✅ NO REPRODUCIBLE (2026-06-12) — ver detalle de verificación abajo |
| BUG-INV-14 | Los diálogos `ConfirmDialog` y `ProductDetailDialogComponent`/`CategoryFormDialog` se cierran al hacer clic en el backdrop (fuera del diálogo), en vez de permanecer abiertos como corresponde a un modal de confirmación | `confirm-dialog.component.ts`, `product-detail-dialog.component.ts`, diálogo "Editar categoría" (ninguno usa `disableClose: true`) | ✅ CORREGIDO (2026-06-12) — ver detalle de verificación abajo |
| BUG-INV-15 | CORS configurado con `setAllowedOriginPatterns(List.of("*"))` + `setAllowCredentials(true)` — Spring refleja CUALQUIER `Origin` recibido en `Access-Control-Allow-Origin` junto con `Access-Control-Allow-Credentials: true`, permitiendo que un sitio malicioso realice requests autenticados (con cookies/JWT) contra la API | Backend `SecurityConfig.java` (configuración CORS) | ✅ CORREGIDO (2026-06-11) — ver detalle de verificación abajo |

### BUG-INV-15 — Análisis, corrección y verificación (2026-06-11)

| Campo | Detalle |
|---|---|
| **Bug ID** | BUG-INV-15 |
| **Severidad** | ALTA |
| **Análisis del bug** | `SecurityConfig.corsConfigurationSource()` usaba `config.setAllowedOriginPatterns(List.of("*"))` combinado con `config.setAllowCredentials(true)`. Cuando `allowCredentials=true`, Spring NO puede devolver el literal `Access-Control-Allow-Origin: *` (prohibido por la spec CORS), así que con `setAllowedOriginPatterns` refleja el header `Origin` recibido tal cual — efectivamente CUALQUIER origen (incluyendo uno malicioso) recibe `Access-Control-Allow-Origin: <su-origen>` + `Access-Control-Allow-Credentials: true`, permitiendo peticiones autenticadas (con el JWT del usuario, si un script de un sitio malicioso logra obtenerlo o si se usa junto con cookies) desde cualquier dominio. OWASP ASVS V14.5. |
| **Código a modificar** | 1) `application.yaml` — nueva propiedad `cors.allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:4200}` (lista separada por comas, configurable por entorno). 2) `SecurityConfig.java` — inyectado `@Value("${cors.allowed-origins}") private String allowedOrigins;`; en `corsConfigurationSource()` se reemplazó `setAllowedOriginPatterns(List.of("*"))` por `setAllowedOrigins(Arrays.stream(allowedOrigins.split(",")).map(String::trim).toList())` — lista explícita de orígenes, sin wildcard. `setAllowCredentials(true)` se mantiene (es válido y necesario con `setAllowedOrigins` explícito, a diferencia de con `*`). Import agregado: `org.springframework.beans.factory.annotation.Value`, `java.util.Arrays`. |
| **Colaterales posibles** | (a) Cualquier frontend desplegado en un origen NO listado en `CORS_ALLOWED_ORIGINS` dejará de poder llamar a la API desde el navegador (esto es el comportamiento DESEADO — antes era la vulnerabilidad). (b) Herramientas como Postman/curl no están sujetas a CORS (CORS es una protección del navegador) — siguen funcionando igual, sin cambios. (c) En producción es OBLIGATORIO definir `CORS_ALLOWED_ORIGINS` con el dominio real del frontend; si no se define, el default `http://localhost:4200` NO funcionará para un dominio de producción (documentado en el comentario de `application.yaml`). (d) `setAllowedHeaders(List.of("*"))` y `setAllowedMethods(...)` no se modificaron — fuera de alcance de este bug. |
| **Reversión** | `git diff` afecta 2 archivos: `application.yaml` (+4 líneas, bloque `cors:`) y `SecurityConfig.java` (2 imports + 1 campo `@Value` + 1 línea en `corsConfigurationSource()`). Revertir con `git checkout -- src/main/resources/application.yaml src/main/java/.../core/security/SecurityConfig.java`. |
| **Criterio de éxito** | Preflight/petición real desde `http://localhost:4200` (origen del frontend) → `Access-Control-Allow-Origin: http://localhost:4200` + `Access-Control-Allow-Credentials: true`, 200 OK. Desde un origen NO listado (`http://evil.example.com`) → sin headers `Access-Control-Allow-*`, `403`. Frontend en `localhost:4200` sigue funcionando (login + navegación) sin errores de CORS en consola. Suite completa sin regresiones nuevas. |
| **Prueba de flujo ejecutada** | (1) `curl -X OPTIONS .../purchases/orders/300 -H "Origin: http://localhost:4200" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: Authorization"` → `HTTP 200`, `Access-Control-Allow-Origin: http://localhost:4200`, `Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS`, `Access-Control-Allow-Headers: Authorization`, `Access-Control-Allow-Credentials: true` ✅. (2) Mismo preflight con `Origin: http://evil.com` → `HTTP 403`, sin ningún header `Access-Control-Allow-*` ✅. (3) GET real con JWT válido + `Origin: http://localhost:4200` → `200`, headers CORS correctos ✅. (4) GET real con JWT válido + `Origin: http://evil.com` → `403` (bloqueado por el filtro CORS de Spring Security antes de procesar la petición, ni siquiera llega al JWT filter) ✅. (5) `mvn test -Djacoco.skip=true` (suite completa) → 396 tests, 4 failures, 9 errors — idéntico al baseline documentado en BUG-M3-23/BUG-INV-16/BUG-M3-24 — sin regresión nueva ✅. (6) UI: login completo como `admin` desde `http://localhost:4200` → 200, sidebar y dashboard cargan correctamente; navegación a `/purchases/orders` → tabs "Recibidas (51)"/"Canceladas (33)" con datos cargados, sin errores de CORS en consola ✅. |
| BUG-INV-16 | `POST /api/v1/auth/login` con credenciales incorrectas responde **HTTP 500 Internal Server Error** en vez de 401 Unauthorized — semánticamente incorrecto aunque el mensaje ("Credenciales incorrectas.") no revela información sensible ni stack traces | Backend `UserServiceImpl.login()` + `GlobalExceptionHandler` | ✅ CORREGIDO (2026-06-11) — ver detalle de verificación abajo |

### BUG-INV-16 — Análisis, corrección y verificación (2026-06-11)

| Campo | Detalle |
|---|---|
| **Bug ID** | BUG-INV-16 |
| **Severidad** | BAJA/MEDIA |
| **Análisis del bug** | `UserServiceImpl.login()` lanzaba `new RuntimeException("Credenciales incorrectas.")` en los 3 casos de fallo de autenticación (usuario no existe, usuario inactivo, password no coincide). `GlobalExceptionHandler` solo tenía un handler genérico `RuntimeException.class` → 500 Internal Server Error. El mensaje de negocio era correcto y no exponía información sensible (CYBER-14 ✅), pero el código HTTP era semánticamente incorrecto — un fallo de login NUNCA debe responder 500 (error de servidor), confunde monitoreo/alertas. |
| **Código a modificar** | 1) `GlobalExceptionHandler.java` — nuevo `@ExceptionHandler(BadCredentialsException.class)` → 401, ubicado antes del catch-all `RuntimeException.class`. 2) `UserServiceImpl.java` — los 3 `throw new RuntimeException("Credenciales incorrectas.")` en `login()` (usuario no encontrado, usuario inactivo, password no coincide) cambiados a `throw new BadCredentialsException("Credenciales incorrectas.")` (`org.springframework.security.authentication.BadCredentialsException`, ya extiende `RuntimeException`). |
| **Colaterales posibles** | (a) Otros métodos de `UserServiceImpl` (`createUser`, `updateUser`, `deactivateUser`, `changePassword`, `resolveRoles`, `findUserOrThrow`, `resolveAuthenticatedUser`) siguen lanzando `RuntimeException` genérico → siguen cayendo en el handler 500 catch-all, SIN CAMBIOS (fuera de alcance, no tocados). (b) Tests existentes con `assertThrows(RuntimeException.class, ...)` sobre `login()` — `BadCredentialsException` extiende `RuntimeException`, por lo que `assertThrows(RuntimeException.class,...)` sigue aceptando la subclase sin romperse. (c) `error.interceptor.ts` del frontend tiene una rama especial para `error.status === 401` que hace logout + redirige a `/login` — pero esa rama excluye explícitamente `req.url.includes('/auth/login')`, por lo que un 401 en el login NO dispara logout/redirect (correcto, ya estaba previsto en el interceptor). |
| **Reversión** | `git diff` de los 2 archivos es mínimo y autocontenido (1 import + 1 handler en `GlobalExceptionHandler.java`; 1 import + 3 cambios de tipo de excepción en `UserServiceImpl.java`). Revertir con `git checkout -- src/main/java/.../core/exception/GlobalExceptionHandler.java src/main/java/.../modules/auth/service/UserServiceImpl.java` restaura el comportamiento 500 sin afectar otros módulos. |
| **Criterio de éxito** | `POST /auth/login` con credenciales incorrectas (password errónea, usuario inexistente, cualquier rol) → HTTP 401 con body `{"status":401,"error":"Unauthorized","message":"Credenciales incorrectas."}`; login correcto sigue en 200; suite `UserServiceImplTest` 0 fallos. |
| **Prueba de flujo ejecutada** | (1) `curl POST /auth/login` admin/password incorrecta → 401 ✅. (2) `curl POST /auth/login` usuario inexistente → 401, mismo mensaje genérico (no revela existencia de cuenta) ✅. (3) `curl POST /auth/login` con `almacen01`, `manager01`, `ventas01` y password incorrecta → 401 en los 4 roles ✅. (4) `curl POST /auth/login` admin/Admin123! (correcto) → 200 con token JWT válido (sin regresión) ✅. (5) UI: formulario de login con password incorrecta → snackbar rojo "Credenciales incorrectas." (panelClass `snackbar-error`, color correcto post BUG-M3-20) ✅. (6) `mvn test -Dtest=UserServiceImplTest` → 20/20, 0 fallos (`assertThrows(RuntimeException.class,...)` acepta `BadCredentialsException` por herencia) ✅. (7) Suite completa backend (`mvn test`) → 13 fallos preexistentes idénticos a baseline sin estos cambios (confirmado con `git stash` + re-run) — sin regresión nueva ✅. |
| BUG-INV-17 | `POST /api/v1/auth/login` no implementa rate limiting / lockout tras múltiples intentos fallidos consecutivos — permite fuerza bruta de credenciales sin restricción | Backend `UserServiceImpl.login()` + nuevo `LoginAttemptService` | ✅ CORREGIDO (2026-06-12) — ver detalle de verificación abajo |
| BUG-INV-18 | Proveedor `id=623` (`companyName: "<script>alert(1)</script>"`, `email: xss@test.com`, `active: true`, creado por `admin` el 2026-06-11) es un registro de datos de prueba (payload XSS) que aparece como primera opción en el `mat-select` "Proveedor*" del formulario de productos y en la tabla de proveedores del módulo Compras | Datos — tabla `suppliers`, registro `id=623` | ✅ RESUELTO (2026-06-12) — desactivado vía `DELETE /api/v1/purchases/suppliers/623` (soft delete, `active: false`), autorizado por el usuario. Ya no aparece en `/active` ni en el `mat-select` de Proveedor. Ver detalle abajo |

### BUG-INV-09 — Análisis, corrección y verificación (2026-06-11)

| Campo | Detalle |
|---|---|
| **Bug ID** | BUG-INV-09 |
| **Severidad** | CRÍTICA |
| **Análisis del bug** | Spring Security usa por defecto `Http403ForbiddenEntryPoint`, que responde **403 Forbidden** tanto para "no autenticado" (sin JWT, JWT inválido/expirado/firma manipulada) como para "autenticado pero sin el rol requerido". Esto impedía distinguir ambos casos: el frontend (`error.interceptor.ts`) solo tiene lógica de "sesión expirada" (limpiar token + redirigir a `/login?reason=expired`) para el código 401, por lo que un JWT expirado a mitad de sesión producía un 403 que el interceptor trataba como "sin permiso" (snackbar "No tienes permiso para realizar esta acción.") en vez de "sesión expirada" — confuso para el usuario y semánticamente incorrecto (RFC 7235: 401 = no autenticado, 403 = autenticado sin autorización). |
| **Código a modificar** | 1) Nueva clase `JwtAuthenticationEntryPoint.java` (`core/security/`) — implementa `AuthenticationEntryPoint`, responde 401 con body `{"timestamp","status":401,"error":"Unauthorized","message":"Token JWT ausente, inválido o expirado. Inicia sesión nuevamente."}` (mismo formato que `GlobalExceptionHandler.buildResponse()`). 2) Nueva clase `JwtAccessDeniedHandler.java` (`core/security/`) — implementa `AccessDeniedHandler`, responde 403 con body `{"timestamp","status":403,"error":"Forbidden","message":"No tienes permiso para realizar esta acción."}`. 3) `SecurityConfig.java` — inyectados ambos como dependencias `final` del constructor (`@RequiredArgsConstructor`) y wireados en `securityFilterChain()` vía `.exceptionHandling(ex -> ex.authenticationEntryPoint(jwtAuthenticationEntryPoint).accessDeniedHandler(jwtAccessDeniedHandler))`, reemplazando el `Http403ForbiddenEntryPoint` por defecto. 4) Tests actualizados para reflejar el nuevo comportamiento (ver Colaterales). |
| **Colaterales posibles** | (a) `@WebMvcTest` + `@Import(SecurityConfig.class)` requiere que TODAS las dependencias del constructor de `SecurityConfig` estén disponibles en el contexto de prueba — se agregó `JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class` a `@Import({...})` en `SecurityFilterTest`, `CategoryControllerSecurityTest` y `ProductControllerSecurityTest` (en `CategoryControllerSecurityTest`/`ProductControllerSecurityTest` se agregaron además los imports de las dos clases nuevas). Sin este cambio: `NoSuchBeanDefinitionException` al cargar el `ApplicationContext` (61 errores nuevos detectados y corregidos). (b) 13 tests de `SecurityFilterTest` que cubrían escenarios "sin token"/"token manipulado"/"token no validado"/"sin JWT" esperaban `isForbidden()` (403, comportamiento ANTERIOR) — renombrados de `*_retorna403` a `*_retorna401` y reasignados a `isUnauthorized()` (401, comportamiento CORRECTO). Los tests de 403 por ROL (ej. `gestionUsuarios_conTokenManager_retorna403`, `crearProducto_conTokenWarehouseman_retorna403`, etc.) NO se modificaron — siguen en 403 vía `JwtAccessDeniedHandler`. (c) `AuditAndConstraintIntegrationTest.sinJwt_crearCategoria_retorna403_noLlegaAHibernate` y `RbacIntegrationTest.tokenConFirmaManipulada_rutaProtegida_retorna403` asertaban 403 para "sin JWT"/"firma manipulada" — renombrados a `*_retorna401` y reasignados a `HttpStatus.UNAUTHORIZED`. (d) El frontend (`error.interceptor.ts`) NO requirió cambios — ya tenía la rama `error.status === 401` correcta; simplemente nunca la alcanzaba porque el backend nunca devolvía 401. |
| **Reversión** | Eliminar los 2 archivos nuevos (`JwtAuthenticationEntryPoint.java`, `JwtAccessDeniedHandler.java`) y revertir `SecurityConfig.java` (quitar los 2 campos inyectados + el bloque `.exceptionHandling(...)`) restaura `Http403ForbiddenEntryPoint` por defecto (403 para todo). Los 4 archivos de test modificados (`SecurityFilterTest`, `CategoryControllerSecurityTest`, `ProductControllerSecurityTest`, `AuditAndConstraintIntegrationTest`, `RbacIntegrationTest`) requerirían revertirse en conjunto para mantener consistencia 403/401 en las aserciones. |
| **Criterio de éxito** | Sin JWT → 401 (no 403). JWT con firma inválida/manipulada/`alg:none` → 401. JWT válido pero rol sin permiso en la ruta → 403 (sin cambios). JWT válido y rol correcto → 200 (sin cambios). Ambos bodies JSON siguen el formato de `GlobalExceptionHandler`. Frontend: ante un 401 a mitad de sesión, `error.interceptor.ts` limpia el token, redirige a `/login?reason=expired` y muestra el mensaje del backend en snackbar rojo. Suite completa backend sin regresiones nuevas respecto al baseline (396 tests, 4 failures, 9 errors). |
| **Prueba de flujo ejecutada** | (1) `curl GET /inventory/products` sin header `Authorization` → **401**, body `{"status":401,"error":"Unauthorized","message":"Token JWT ausente, inválido o expirado. Inicia sesión nuevamente."}` ✅. (2) `curl GET /inventory/products` con `Authorization: Bearer token.invalido.xyz` → **401** ✅. (3) `curl GET /inventory/products` con JWT válido de `admin` (ROLE_ADMIN+ROLE_WAREHOUSEMAN) → **200** ✅ (sin regresión). (4) `curl POST /inventory/products` con JWT válido de `ventas01` (ROLE_SALES, sin permiso) → **403**, body `{"status":403,"error":"Forbidden","message":"No tienes permiso para realizar esta acción."}` ✅ (sin regresión — distingue correctamente de (1)/(2)). (5) Suite completa backend `./mvnw test -Djacoco.skip=true` → **396 tests, 4 failures, 9 errors** — mismas 6 clases/identidades del baseline pre-existente (`RbacIntegrationTest` 1F/2E, `AuditAndConstraintIntegrationTest` 0F/6E, `CategoryControllerTest` 1F, `ClientControllerTest` 1F, `SupplierControllerTest` 1F, `ProductServiceImplTest` 1E — confirmados PRE-EXISTENTES vía `git stash`) — **0 regresiones nuevas** ✅. (6) Browser: con sesión ADMIN activa, JWT con firma manipulada (1 carácter alterado, `exp` futuro válido) inyectado en `localStorage`, reload de `/purchases/orders` → backend responde 401 → `error.interceptor.ts` elimina `almacenes_token` de `localStorage`, redirige a `/login?reason=expired`, snackbar rojo "Token JWT ausente, inválido o expirado. Inicia sesión nuevamente.", sin errores de consola ✅. |

### BUG-INV-08 — Verificación (2026-06-11/12) — NO REPRODUCIBLE

| Campo | Detalle |
|---|---|
| **Bug ID** | BUG-INV-08 |
| **Severidad** | Baja (originalmente reportada) |
| **Análisis del bug** | El hallazgo original (VAL-PDET-14, 2026-06-10) indicaba que el mensaje de error al dejar "Categoría*" sin seleccionar en el formulario "Nuevo producto" era "La categoría es obligatorio." (concordancia de género incorrecta — debería ser "obligatoria"). |
| **Código a modificar** | Ninguno. Revisión de `product-form.component.html` línea 90 muestra `<mat-error>La categoría es obligatoria.</mat-error>` — ya correcto. `git log -p --all -S "categoría es obligatori"` confirma que el texto "obligatoria" (correcto) se introdujo en el commit `9587888c` ("feat(inventory): Módulo 2 — Inventario completo con rediseño UX/UI", 2026-06-06), ANTERIOR a la fecha del hallazgo (2026-06-10). El commit `73c6dd1` (ronda de 5 bugs UI/UX) no tocó esta línea. |
| **Colaterales posibles** | N/A — no se modificó código. |
| **Reversión** | N/A. |
| **Criterio de éxito** | El mensaje mostrado en browser al hacer blur en "Categoría*" sin seleccionar debe ser "La categoría es obligatoria." (femenino, concordando con "la categoría"). |
| **Prueba de flujo ejecutada** | Browser: login `admin`/`Admin123!` → `/inventory/products` → "Nuevo producto" → clic en "Categoría*" (abre el panel de opciones) → clic fuera del panel sin seleccionar (blur) → aparece `<mat-error>` con texto **"La categoría es obligatoria."** (correcto, confirmado por screenshot) ✅. Conclusión: el código ya tenía la corrección desde antes del 2026-06-10; el hallazgo original VAL-PDET-14 parece ser un error de transcripción al documentar (o se probó contra un build/caché desactualizado). No se requiere ningún cambio de código. Sin regresiones — no se modificó ningún archivo. |

**Hallazgo nuevo durante esta verificación (solo identificado, no corregido — pendiente autorización):**

Al abrir el `mat-select` de "Proveedor*" en el mismo diálogo "Nuevo producto", la PRIMERA opción de la lista es literalmente `<script>alert(1)</script>` — corresponde a un proveedor real en la base de datos: `GET /purchases/suppliers/active` (rol admin) devuelve `{"id":623,"rfc":"XXX010101AAA","companyName":"<script>alert(1)</script>","contactName":"Test","email":"xss@test.com","createdAt":"2026-06-11T16:43:29","createdById":605,"createdByUsername":"admin",...}`. Es un registro de datos de prueba (payload XSS) insertado durante una sesión anterior, probablemente al validar `VAL`/`CYBER` de sanitización de inputs en el módulo Compras. **No es una vulnerabilidad de XSS activa**: Angular interpola con `{{ }}` (escapado automático por defecto), por lo que el texto se renderiza literalmente como cadena (no se ejecuta como `<script>`) tanto en la tabla de proveedores como en el `mat-select` de Categoría/Proveedor del formulario de productos. Es, sin embargo, **basura de datos de prueba** visible en producción/demos (proveedor "activo" con nombre `<script>alert(1)</script>`) que conviene eliminar o desactivar. Registrado como **BUG-INV-18** (informativo/limpieza de datos, severidad BAJA) — pendiente de autorización para decidir si se desactiva/elimina el registro `id=623` de `suppliers`.

### BUG-INV-07 — Análisis, corrección y verificación (2026-06-12)

| Campo | Detalle |
|---|---|
| **Bug ID** | BUG-INV-07 |
| **Severidad** | Baja (visual) |
| **Análisis del bug** | `products-page.component.scss` y `categories-page.component.scss` no tenían ninguna regla `.mat-mdc-header-cell`, por lo que los headers de las tablas "Productos" y "Categorías" usaban el estilo por defecto de Angular Material (`background: #FFF`, `color: rgba(0,0,0,0.87)`, `font-weight: 500`), inconsistente con el resto de la app. El módulo Compras (`suppliers-page`, `purchase-orders-page`, `purchase-order-detail-page`) y `low-stock-page` (inventario) sí tenían `.mat-mdc-header-cell { font-weight: 600; color: #6B3C6B; background: #F2E4F2; }` dentro de `.catalog-table`, siguiendo la regla de identidad visual de CLAUDE.md (color de marca `#6B3C6B` sobre superficie `#F2E4F2`). |
| **Código a modificar** | Se agregó el bloque `.mat-mdc-header-cell { font-weight: 600; color: #6B3C6B; background: #F2E4F2; }` dentro de `.catalog-table { width: 100%; ... }` en: (1) `src/app/modules/inventory/components/products-page/products-page.component.scss`, (2) `src/app/modules/inventory/components/categories-page/categories-page.component.scss` — mismo patrón ya usado en `suppliers-page.component.scss` (módulo Compras). |
| **Colaterales posibles** | (a) Cambio puramente visual (CSS), no afecta lógica/TypeScript — sin impacto en tests unitarios. (b) `low-stock-page.component.scss` ya tenía la regla correcta (con `white-space: nowrap` adicional) — no se tocó. (c) La columna de acciones (sin texto) también recibe el fondo `#F2E4F2`/color `#6B3C6B` porque el selector aplica a TODAS las `.mat-mdc-header-cell`, igual que en `suppliers-page` — consistente. |
| **Reversión** | `git diff` afecta 2 archivos SCSS, +6 líneas cada uno (1 regla anidada). Revertir con `git checkout -- src/app/modules/inventory/components/products-page/products-page.component.scss src/app/modules/inventory/components/categories-page/categories-page.component.scss`. |
| **Criterio de éxito** | `getComputedStyle(header).backgroundColor === 'rgb(242, 228, 242)'` y `.color === 'rgb(107, 60, 107)'` para TODAS las `.mat-mdc-header-cell` de `.catalog-table` en `/inventory/products` y `/inventory/categories`. Suite `ng test` sin regresiones. |
| **Prueba de flujo ejecutada** | (1) `npx ng test` → 215/215 specs, 0 fallos (cambio solo CSS, sin regresión) ✅. (2) Browser (admin) `/inventory/products`: `getComputedStyle` de las 9 `.mat-mdc-header-cell` (Código, Nombre, Categoría, Proveedor, Stock, Precio, Costo unit., Estado, Acciones) → todas `background-color: rgb(242, 228, 242)`, `color: rgb(107, 60, 107)` ✅, confirmado también por screenshot. (3) Browser `/inventory/categories`: las 3 `.mat-mdc-header-cell` (Nombre, Descripción, Acciones) → mismos valores ✅, confirmado por screenshot. |

### BUG-INV-10 — Análisis, corrección y verificación (2026-06-12)

| Campo | Detalle |
|---|---|
| **Bug ID** | BUG-INV-10 |
| **Severidad** | Baja |
| **Análisis del bug** | `onPageChange(event: PageEvent)` en `products-page.component.ts` asignaba `this.currentPage = event.pageIndex` directamente con el valor que `mat-paginator` calcula internamente al cambiar `pageSize`. Angular Material recalcula `pageIndex` para "preservar el primer elemento visible" (ej. estando en página 3 con size=20 — elementos 41-60 —, al cambiar a size=10, `mat-paginator` emite `pageIndex=4` para seguir mostrando el elemento 41 como primero). El componente adoptaba ese índice recalculado en vez de volver a la página 0, resultando en un rango como "41-50 of 108" en lugar de "1-10 of 108" tras cambiar el tamaño de página. |
| **Código a modificar** | `src/app/modules/inventory/components/products-page/products-page.component.ts`, método `onPageChange()` (líneas 214-219): se cambia `this.currentPage = event.pageIndex;` por `this.currentPage = event.pageSize !== this.pageSize ? 0 : event.pageIndex;` — si el evento corresponde a un cambio de tamaño de página, fuerza `currentPage = 0`; si es solo cambio de página (mismo tamaño), conserva `event.pageIndex` como antes. |
| **Colaterales posibles** | (a) `[pageIndex]="currentPage"` está enlazado en el template (`products-page.component.html` línea 173), por lo que al fijar `currentPage = 0` el `mat-paginator` también actualiza visualmente su índice a la página 0 — sin necesidad de tocar el template. (b) La navegación normal entre páginas (sin cambiar `pageSize`) usa la rama `event.pageIndex` sin cambios — sin regresión en "Siguiente"/"Anterior". (c) `categories-page.component.ts` (líneas 116-119) tiene el MISMO patrón (`this.currentPage = event.pageIndex` sin distinguir cambio de tamaño) — mismo bug potencial, pero NO fue parte del hallazgo original (UI-PROD-PAG-03 es específico de productos) y no se modificó; queda como posible bug futuro a evaluar si se reporta. (d) No afecta `searchTrigger$` ni los filtros — el flujo sigue siendo `currentPage`/`pageSize` → `searchTrigger$.next()` → `productService.search(...)`. |
| **Reversión** | `git diff` afecta solo `products-page.component.ts`, 1 línea cambiada dentro de `onPageChange()`. Revertir con `git checkout -- src/app/modules/inventory/components/products-page/products-page.component.ts`. |
| **Criterio de éxito** | Estando en cualquier página > 0 con `pageSize=20`, al cambiar "Items per page" a 10 (o 50), la tabla muestra el rango "1-X of 108" (página 0) con los primeros X productos. La navegación "Siguiente"/"Anterior" sin cambiar el tamaño sigue funcionando como antes. Suite `ng test` sin regresiones. |
| **Prueba de flujo ejecutada** | (1) `npx ng test` → 215/215 specs, 0 fallos (sin spec dedicado para `products-page`, sin regresión) ✅. (2) Browser (admin): `/inventory/products`, size=20, clic "Siguiente" x2 → "41-60 of 108" ✅. (3) Cambiar "Items per page" de 20 a 10 estando en "41-60 of 108" → tabla muestra "1-10 of 108" con los primeros 10 productos (HMAN-DES-013 … SEGV-CAM4K-023) ✅ (antes del fix habría mostrado "41-50 of 108"). (4) Clic "Siguiente" desde "1-10 of 108" (size=10) → "11-20 of 108" con productos distintos (SOLD-MAS-041 … COMP-USB2-047) — navegación normal sin cambio de tamaño preserva el índice correctamente ✅. (5) Sin errores en consola del navegador durante la secuencia. |

### BUG-INV-14 — Análisis, corrección y verificación (2026-06-12)

| Campo | Detalle |
|---|---|
| **Bug ID** | BUG-INV-14 |
| **Severidad** | Media |
| **Análisis del bug** | Ninguno de los diálogos `MatDialog` del módulo Inventario usaba `disableClose: true`. Por defecto, `MatDialog` cierra el diálogo al hacer clic en el backdrop o presionar Escape. Esto afectaba: (1) `ProductDetailDialogComponent` y `CategoryFormDialogComponent` (abiertos vía `DIALOG_CONFIG` en `products-page.component.ts` y `categories-page.component.ts`) — un clic accidental fuera del diálogo de edición/creación cerraba todo el formulario sin guardar, con riesgo de pérdida de cambios no guardados; (2) `ConfirmDialogComponent` (abierto desde `onDeactivate()` en `category-form-dialog.component.ts` y `product-detail-dialog.component.ts`) — un clic fuera del diálogo de confirmación "Desactivar..." lo cerraba sin que el usuario confirmara ni cancelara explícitamente, violando el patrón esperado de "modal de confirmación bloqueante" (CLAUDE.md, sección Feedback al usuario: "Confirmación de acciones destructivas: MatDialog con el patrón confirm-dialog... antes de desactivar"). |
| **Código a modificar** | (1) `src/app/modules/inventory/components/products-page/products-page.component.ts` — `DIALOG_CONFIG` (líneas 32-40): se agregó `disableClose: true,`. (2) `src/app/modules/inventory/components/categories-page/categories-page.component.ts` — `DIALOG_CONFIG` (líneas 26-34): se agregó `disableClose: true,`. (3) `src/app/modules/inventory/components/category-form-dialog/category-form-dialog.component.ts` — línea 74, `onDeactivate()`: `this.dialog.open(ConfirmDialogComponent, { data: confirmData, width: '420px', disableClose: true })`. (4) `src/app/modules/inventory/components/product-detail-dialog/product-detail-dialog.component.ts` — línea 88, `onDeactivate()`: misma adición de `disableClose: true`. |
| **Colaterales posibles** | (a) `MovementDialogComponent` (`openMovementDialog()` en `products-page.component.ts`, línea ~262) usa una configuración separada (`{ data: { product: item }, width: '480px' }`, no `DIALOG_CONFIG`) y **NO se modificó** — no estaba en el alcance original del bug (BUG-INV-14/VIS-GEN-05 se reportó sobre los diálogos "Editar producto"/"Editar categoría" y sus `ConfirmDialog` de desactivación, no sobre el diálogo de "Registrar movimiento"). Queda como posible hallazgo futuro si se considera que también debería ser `disableClose`. (b) El botón "Cancelar" de cada diálogo sigue cerrándolo correctamente (`dialogRef.close(false)` / `afterClosed()` con `r !== true`) — `disableClose` solo bloquea backdrop/Escape, no los botones explícitos. (c) Cambio aplicado simétricamente a Productos y Categorías — mismo patrón en ambos módulos, sin asimetría. |
| **Reversión** | `git diff` afecta 4 archivos TS, 1 línea agregada en cada uno (`disableClose: true,` o `disableClose: true`). Revertir con `git checkout -- src/app/modules/inventory/components/products-page/products-page.component.ts src/app/modules/inventory/components/categories-page/categories-page.component.ts src/app/modules/inventory/components/category-form-dialog/category-form-dialog.component.ts src/app/modules/inventory/components/product-detail-dialog/product-detail-dialog.component.ts`. |
| **Criterio de éxito** | Clic en el backdrop (fuera del diálogo) NO cierra ninguno de los 4 diálogos afectados: "Nuevo/Editar producto", "Nuevo/Editar categoría", "Desactivar producto" (ConfirmDialog), "Desactivar categoría" (ConfirmDialog). El botón "Cancelar" de cada uno sigue cerrando correctamente. Suite `ng test` sin regresiones. |
| **Prueba de flujo ejecutada** | (1) `npx ng test` → 215/215 specs, 0 fallos (cambio de configuración de diálogo, sin lógica nueva — sin regresión) ✅. (2) Browser (admin) `/inventory/categories`: abrir "Editar categoría" (Cat-Cy-19571) → clic backdrop → diálogo permanece abierto ✅. (3) Clic "Desactivar" → se abre "Desactivar categoría" (ConfirmDialog) → clic backdrop → permanece abierto ✅ → clic "Cancelar" → vuelve a "Editar categoría" ✅ → clic "Cancelar" → cierra y vuelve a la lista de categorías ✅ (categoría NO desactivada). (4) Browser `/inventory/products`: abrir "Editar producto" (HMAN-DES-013) → clic backdrop → permanece abierto ✅. (5) Clic "Desactivar" → se abre "Desactivar producto" (ConfirmDialog) → clic backdrop → permanece abierto ✅ → clic "Cancelar" → vuelve a "Editar producto" ✅ → clic "Cancelar" → cierra y vuelve a la lista de productos ✅ (producto NO desactivado). (6) Sin errores en consola del navegador durante toda la secuencia. |

### BUG-INV-12 — Análisis, corrección y verificación (2026-06-12)

| Campo | Detalle |
|---|---|
| **Bug ID** | BUG-INV-12 |
| **Severidad** | Media |
| **Análisis del bug** | `ProductsPageComponent.ngOnInit()` ejecutaba `forkJoin({ cats: categoryService.getActive(...), sups: productService.getActiveSuppliers() })`. `getActiveSuppliers()` llama a `GET /api/v1/purchases/suppliers/active`, restringido por `SecurityConfig` a `ADMIN/MANAGER/WAREHOUSEMAN` (regla `GET /api/v1/purchases/**`). Para el rol SALES, esa llamada responde 403; al estar dentro del mismo `forkJoin`, el `error` se propaga y `next` nunca se ejecuta — ni `this.categories` ni `this.suppliers` se asignan, dejando los filtros "Categoría" y "Proveedor" vacíos (solo "Todas"/"Todos"), además de un snackbar rojo "No tienes permiso para realizar esta acción." disparado por el interceptor de errores HTTP. Por RBAC (tabla de CLAUDE.md: "Purchases — SALES: —"), SALES no debe tener acceso a datos de proveedores; la corrección correcta es que el frontend no solicite ese recurso para SALES y oculte el filtro correspondiente, no relajar el backend. |
| **Código a modificar** | `src/app/modules/inventory/components/products-page/products-page.component.ts`: (1) import de `of` desde `rxjs`; (2) nuevo método `canViewSupplierFilter()` (true para ADMIN/MANAGER/WAREHOUSEMAN, false para SALES); (3) en `ngOnInit()`, `sups: this.canViewSupplierFilter() ? this.productService.getActiveSuppliers() : of(null)` y `this.suppliers = sups?.content ?? []`. `src/app/modules/inventory/components/products-page/products-page.component.html`: el `mat-form-field` del filtro "Proveedor" se envuelve en `@if (canViewSupplierFilter())`. |
| **Colaterales posibles** | (a) La columna "Proveedor" de la tabla (`supplierName`) NO se ve afectada — ese dato viene del propio `ProductResponseDTO` (`GET /inventory/products`), no del endpoint de proveedores; sigue visible para SALES. (b) `activeFilterCount` usa `supplierFilter.value`, que para SALES permanece siempre `null` (control deshabilitado implícitamente al no renderizarse) — no infla el contador de filtros activos. (c) ADMIN/MANAGER/WAREHOUSEMAN no cambian de comportamiento — `canViewSupplierFilter()` es `true` para esos tres roles, idéntico a `canRegisterMovement()` en su construcción pero conceptualmente distinto (uno es de escritura de movimientos, otro de lectura de catálogo de proveedores) por lo que se definió como método independiente. (d) `ProductDetailDialogComponent` (formulario "Nuevo/Editar producto") sigue recibiendo `this.suppliers` (vacío para SALES) — sin impacto porque SALES no tiene `canWrite()` y no accede a ese formulario. |
| **Reversión** | `git diff` afecta `products-page.component.ts` (+8/-3 líneas aprox.: import, método nuevo, `forkJoin`) y `products-page.component.html` (+2/-1, envolver el filtro en `@if`). Revertir con `git checkout -- src/app/modules/inventory/components/products-page/products-page.component.ts src/app/modules/inventory/components/products-page/products-page.component.html`. |
| **Criterio de éxito** | Con `ventas01` (SALES): `/inventory/products` carga sin snackbar de error, sin petición a `/purchases/suppliers/active`, filtro "Categoría" poblado con las categorías activas, filtro "Proveedor" no se renderiza. Con `almacen01` (WAREHOUSEMAN) y roles ADMIN/MANAGER: comportamiento sin cambios — filtro "Proveedor" visible y poblado, `GET /purchases/suppliers/active` → 200. Suite `ng test` sin regresiones. |
| **Prueba de flujo ejecutada** | (1) `npx ng test` → 215/215 specs, 0 fallos ✅. (2) `./mvnw test` → 396 tests, 4 failures, 9 errors — idéntico al baseline (sin cambios en backend) ✅. (3) Browser, login `ventas01` (SALES) vía `fetch` a `/auth/login` + `localStorage.almacenes_token`, navegar a `/inventory/products`: screenshot confirma tabla de 108 productos visible, SIN snackbar rojo, filtro "Proveedor" ausente, filtro "Categoría" muestra "Todas" + lista completa de categorías (Cat-Cy-19571, Cat-Cy-21804, ...) ✅. `read_network_requests` confirma solo `GET /inventory/categories/active` (200) y `GET /inventory/products` (200) — ninguna petición a `/purchases/suppliers/active` ✅. `read_console_messages` sin errores ✅. (4) Browser, login `almacen01` (WAREHOUSEMAN), `/inventory/products`: filtro "Proveedor" visible junto a "Categoría" y "Estado"; `read_network_requests` confirma `GET /purchases/suppliers/active` → 200 ✅ (sin regresión para roles con acceso). |

### BUG-INV-11 — Análisis, corrección y verificación (2026-06-11)

| Campo | Detalle |
|---|---|
| **Bug ID** | BUG-INV-11 |
| **Severidad** | Alta |
| **Análisis del bug** | `ProductMapper.toResponseDTO()` mapea `unitCost` (costo de compra) automáticamente por nombre de campo hacia `ProductResponseDTO`, sin ningún filtrado por rol. El frontend oculta la columna "Costo unit." en la tabla mediante `*ngIf`/`@if (canWrite())` (solo ADMIN/MANAGER), pero esto es puramente cosmético: el JSON crudo de TODOS los endpoints de lectura de `/inventory/products/**` incluye `unitCost` con su valor real para CUALQUIER rol autenticado, incluyendo WAREHOUSEMAN y SALES — visible directamente en DevTools→Network o vía `curl`/`fetch`. Por la tabla RBAC de CLAUDE.md, los datos financieros (`unitCost`) deben estar visibles SOLO para ADMIN/MANAGER, "ausentes del DOM para roles no autorizados (no solo display:none)" — y por extensión, ausentes del payload JSON. Las rutas de ESCRITURA (`POST/PUT/DELETE /inventory/**`) están restringidas a ADMIN/MANAGER por `SecurityConfig.java`, por lo que no requieren redacción (un rol no autorizado no puede alcanzarlas). |
| **Código a modificar** | `ProductServiceImpl.java`: (1) nuevo import `org.springframework.security.core.GrantedAuthority`; (2) nuevo método privado `canViewUnitCost()` — `true` si el usuario autenticado tiene `ROLE_ADMIN` o `ROLE_MANAGER` (lee `SecurityContextHolder`); (3) tres sobrecargas privadas `redactUnitCost(...)` para `ProductResponseDTO`, `List<ProductResponseDTO>` y `PageResponseDTO<ProductResponseDTO>` — si `!canViewUnitCost()`, ponen `unitCost = null` en cada elemento; (4) aplicado `redactUnitCost(...)` a los 7 métodos de lectura: `getLowStockProducts()` (List), `getLowStockProducts(page,size)` (Page), `getById(id)`, `getBySku(sku)`, `getByCategoryId(categoryId)` (List), `getByCategoryId(categoryId,page,size)` (Page), `searchProducts(...)` (Page — endpoint principal `GET /inventory/products`). `createProduct`/`updateProduct` NO se modificaron (restringidos a ADMIN/MANAGER por `SecurityConfig`, sin necesidad de redacción). |
| **Colaterales posibles** | (a) `getStockMovementsByProduct(...)` retorna `StockMovementResponseDTO` (DTO distinto, sin campo `unitCost`) — no requiere cambios, confirmado por inspección del controller. (b) `registerStockMovement(...)` retorna `Void` — sin cambios. (c) El frontend NO requiere cambios: ya oculta la columna "Costo unit." vía `@if (canWrite())` para WAREHOUSEMAN/SALES; ahora además el dato ya no llega en el JSON, reforzando la protección sin romper el binding existente (`row.unitCost` simplemente será `null` y no se renderiza por estar fuera de `displayedColumns`). (d) Para ADMIN/MANAGER (`canWrite()===true`), `unitCost` se sigue recibiendo con su valor real — sin regresión en la columna "Costo unit." visible para esos roles. (e) `ProductMapper` no se modificó — el mapeo base sigue siendo automático; la redacción ocurre como post-procesamiento en el service, después del mapeo. |
| **Reversión** | `git diff` afecta un solo archivo: `ProductServiceImpl.java` (+1 import, +4 métodos privados ~25 líneas, +7 líneas modificadas — una por endpoint envolviendo el `return` existente en `redactUnitCost(...)`). Revertir con `git checkout -- src/main/java/com/codigo2enter/almacenes/modules/inventory/service/ProductServiceImpl.java`. |
| **Criterio de éxito** | `GET /inventory/products`, `/products/{id}`, `/products/sku/{sku}`, `/products/category/{id}` (lista y paginada), `/products/low-stock` (lista y paginada) → con JWT de `almacen01` (WAREHOUSEMAN) o `ventas01` (SALES), `unitCost: null` en TODOS los registros del JSON; con JWT de `admin` (ADMIN), `unitCost` con su valor numérico real. Suite `ng test` y `./mvnw test` sin regresiones nuevas respecto al baseline. UI de Productos sigue funcionando sin errores de consola para los 3 roles, columna "Costo unit." visible solo para ADMIN/MANAGER. |
| **Prueba de flujo ejecutada** | (1) `./mvnw test` → 396 tests, 4 failures, 9 errors — idéntico al baseline (sin errores nuevos) ✅. (2) `npx ng test --no-watch --no-progress` → 19 test files, 215/215 specs ✅. (3) Backend reiniciado (`spring-boot:run`) para recargar las clases compiladas. Verificación vía `curl`/`fetch` con JWT real de cada rol: `GET /inventory/products?page=0&size=2` → ADMIN `unitCost: 180.0`/`220.0`; WAREHOUSEMAN y SALES → `unitCost: null` en ambos registros, para el MISMO producto (`HMAN-DES-013`) ✅. `GET /inventory/products/low-stock?page=0&size=2` → ADMIN `unitCost: 7800.0`/`1750.0`; WAREHOUSEMAN → `unitCost: null` ✅. `GET /inventory/products/{id}` y `/products/sku/{sku}` (producto id=13, SKU `HMAN-DES-013`) → ADMIN `unitCost: 180.0`; WAREHOUSEMAN `unitCost: null` ✅. `GET /inventory/products/category/{id}` (categoría 6, 2 productos) → ADMIN `[180.0, 380.0]`; WAREHOUSEMAN `[null, null]` ✅. (4) Browser, login `almacen01` (WAREHOUSEMAN), `/inventory/products`: página carga sin errores de consola, `GET /inventory/products?page=0&size=20` → 200, columnas de la tabla = `["Código","Nombre","Categoría","Proveedor","Stock","Precio","Estado",""]` — sin columna "Costo unit." (esperado para WAREHOUSEMAN) ✅. |

### BUG-INV-17 — Análisis, corrección y verificación (2026-06-12)

| Campo | Detalle |
|---|---|
| **Bug ID** | BUG-INV-17 |
| **Severidad** | Alta |
| **Análisis del bug** | `UserServiceImpl.login()` no llevaba ningún registro de intentos fallidos: tras validar usuario/password incorrectos lanzaba `BadCredentialsException` (401, mensaje genérico desde BUG-INV-16) sin retraso, contador ni bloqueo. Esto permite ataques de fuerza bruta / credential stuffing sin ninguna mitigación — gap real frente a OWASP ASVS V2.2.1 ("Verify that anti-automation controls are effective at mitigating breached credential testing, brute force, and account lockout attacks"). |
| **Código a modificar** | Nuevo `LoginAttemptService` (`modules/auth/service/`) — `@Component` con `ConcurrentHashMap<String, Attempt>` en memoria, clave = username normalizado (`trim().toLowerCase()`). Tras 5 fallos consecutivos (`MAX_ATTEMPTS`), bloquea 15 min (`LOCKOUT_DURATION`); login exitoso reinicia el contador (`loginSucceeded`); el bloqueo expira automáticamente al pasar `lockedUntil`. Nueva excepción `TooManyAttemptsException` (`core/exception/`) → `GlobalExceptionHandler` la mapea a HTTP 429 Too Many Requests. `UserServiceImpl.login()`: (1) si `loginAttemptService.isBlocked(username)` → lanza `TooManyAttemptsException` con minutos restantes ANTES de tocar la BD; (2) el resto de la lógica original queda envuelta en `try/catch(BadCredentialsException)` — en el catch llama `loginAttemptService.loginFailed(username)` y relanza; en éxito llama `loginAttemptService.loginSucceeded(username)`. |
| **Colaterales posibles** | (a) El bloqueo es por username (no por IP) — un atacante podría bloquear deliberadamente la cuenta de otro usuario durante 15 min enviando 5 logins fallidos con su username; riesgo aceptado y documentado en el javadoc de `LoginAttemptService` (ventana corta, sin Redis/infra adicional, adecuado para app de escala media de un solo nodo). (b) El estado es en memoria — se reinicia si el backend se reinicia (aceptable, no requiere persistencia para este caso de uso). (c) `CYBER-14`/`BUG-INV-16` (mensaje genérico "Credenciales incorrectas." con 401) NO se modifican — el flujo de "credenciales incorrectas pero no bloqueado" sigue igual, solo se le agrega el side-effect de `loginFailed()`. (d) El login component del frontend (`login.component.ts`) NO requiere cambios — ya muestra `err.error?.message` en un snackbar rojo para cualquier error HTTP, por lo que el mensaje 429 se muestra automáticamente. |
| **Reversión** | `git diff` afecta 5 archivos: 2 nuevos (`LoginAttemptService.java`, `TooManyAttemptsException.java`) + 3 modificados (`UserServiceImpl.java`: +1 import, +1 campo final, lógica de `login()` envuelta en try/catch con ~10 líneas nuevas; `GlobalExceptionHandler.java`: +1 `@ExceptionHandler` de 4 líneas; `UserServiceImplTest.java`: +1 `@Mock`, +1 stub lenient, +3 tests nuevos) + 1 archivo de test nuevo (`LoginAttemptServiceTest.java`, 6 tests). Revertir con `git checkout -- <los 3 archivos modificados>` + `git clean` o `rm` de los 3 archivos nuevos. |
| **Criterio de éxito** | `POST /auth/login` con credenciales incorrectas: intentos 1-5 → 401 `{"message":"Credenciales incorrectas."}`; intento 6+ → 429 `{"message":"Demasiados intentos fallidos. Intenta nuevamente en 15 minuto(s)."}`. Un login exitoso con OTRO usuario no se ve afectado por el bloqueo de un usuario distinto. El bloqueo es case-insensitive (`RATE_TEST_USER` y `rate_test_user` comparten contador). Suite `ng test` y `./mvnw test` sin regresiones nuevas. |
| **Prueba de flujo ejecutada** | (1) `./mvnw test` → 405 tests (396 + 9 nuevos: 3 en `UserServiceImplTest` + 6 en `LoginAttemptServiceTest`), 4 failures, 9 errors — mismos failures/errors del baseline, sin errores nuevos ✅. (2) `npx ng test --no-watch --no-progress` → 19 archivos, 215/215 specs (sin cambios frontend) ✅. (3) Backend reiniciado para recargar clases. `curl` con `rate_test_user`/`wrongpass` × 7 → intentos 1-5: `401 Credenciales incorrectas.`; intentos 6-7: `429 Demasiados intentos fallidos. Intenta nuevamente en 15 minuto(s).` ✅. (4) `curl` con `admin`/`Admin123!` (usuario distinto, sin intentos previos) inmediatamente después → `200` con token válido — el bloqueo de `rate_test_user` no afecta a `admin` ✅. (5) `curl` con `RATE_TEST_USER` (mayúsculas) → `429` — confirma normalización case-insensitive del bloqueo ✅. (6) Browser: `fetch()` desde la consola de `localhost:4200` con `browser_lockout_test`/`wrong` × 6 → 6º intento devuelve `429` con el mismo mensaje JSON; `login.component.ts` muestra `err.error?.message` en snackbar rojo sin cambios de código (verificado por inspección — lógica genérica ya cubre 429) ✅. |

### BUG-INV-13 — Verificación (2026-06-12) — NO REPRODUCIBLE

| Campo | Detalle |
|---|---|
| **Bug ID** | BUG-INV-13 |
| **Severidad** | Media (originalmente reportada, 2026-06-10) |
| **Análisis del bug** | El hallazgo original (CYBER-02, 2026-06-10) reportaba que, al alterar el claim `roles` de un JWT de SALES a `["ROLE_ADMIN"]` en `localStorage` (firma queda inválida) y recargar, el backend rechazaba correctamente (`403`), pero el frontend NO redirigía a `/login`: decodificaba el JWT alterado sin validar firma y renderizaba la UI completa de ADMIN (badge, sidebar con "Compras"/"Gestión de usuarios", botón "+ Nuevo producto"), mostrando solo "Sin datos" + snackbar de error — escalada de privilegios cosmética en la UI. La causa raíz documentada era que `error.interceptor.ts` solo actuaba sobre `401` (limpiar sesión + redirigir), pero el backend devolvía `403` para token con firma inválida (mismo mecanismo de BUG-INV-09: sin `AuthenticationEntryPoint` propio, Spring trataba "no autenticado" igual que "autenticado sin rol suficiente"). |
| **Código a modificar** | Ninguno. La corrección de **BUG-INV-09** (2026-06-11 — `JwtAuthenticationEntryPoint` + `JwtAccessDeniedHandler` en `SecurityConfig`) ya resuelve esto como efecto colateral: ahora CUALQUIER request con JWT ausente, expirado **o con firma inválida** (token manipulado) recibe `401` (antes solo "ausente/expirado" → 401; "firma inválida" caía a 403 vía usuario anónimo). `error.interceptor.ts` ya maneja `401` desde antes (limpia `localStorage`, redirige a `/login?reason=expired`, snackbar "Tu sesión ha expirado..."), por lo que no requirió ningún cambio adicional. |
| **Colaterales posibles** | Ninguno — no se modificó código en esta verificación. La corrección ya estaba cubierta por BUG-INV-09 (régimen de regresión de esa sección aplica). |
| **Reversión** | N/A — no se modificó ningún archivo. |
| **Criterio de éxito** | Con un JWT cuyo payload fue alterado (`roles`/`role` → `ROLE_ADMIN`) preservando header/firma originales (firma ahora inválida), al navegar a `/inventory/products`: las llamadas `GET /inventory/products`, `/inventory/categories/active` y `/purchases/suppliers/active` deben responder `401` (no `403`), y la app debe limpiar la sesión y redirigir a `/login` con mensaje de sesión expirada — sin mostrar ningún elemento de UI específico de ADMIN. |
| **Prueba de flujo ejecutada** | Browser: login `ventas01`/SALES vía `fetch`, se alteró `roles`/`role` del JWT a `["ROLE_ADMIN"]` en `localStorage` (firma inválida) y se navegó a `/inventory/products`. `read_network_requests` confirmó **`401`** en los 3 endpoints (`/inventory/products`, `/inventory/categories/active`, `/purchases/suppliers/active`) — repetido 2 veces, mismo resultado ✅. La app redirigió automáticamente a `/login?reason=expired`, mostrando el banner naranja "Tu sesión expiró. Vuelve a iniciar sesión para continuar." y snackbar rojo "Tu sesión ha expirado. Inicia sesión nuevamente." ✅. Screenshot tomado INMEDIATAMENTE tras la navegación (sin esperar) — no se observó ningún flash de badge "ADMIN", sidebar de "Compras"/"Gestión de usuarios" ni botón "+ Nuevo producto" ✅. Conclusión: BUG-INV-13 fue corregido como efecto colateral de BUG-INV-09 (2026-06-11); no requiere cambios adicionales. Sin regresiones — no se modificó ningún archivo. |

### BUG-INV-18 — Resolución (2026-06-12) — RESUELTO (datos de prueba)

| Campo | Detalle |
|---|---|
| **Bug ID** | BUG-INV-18 |
| **Severidad** | Baja (informativo) |
| **Análisis del bug** | El proveedor `id=623` (`companyName: "<script>alert(1)</script>"`, `email: xss@test.com`, `active: true`, creado por `admin` el 2026-06-11) era un registro de datos de prueba que quedó visible como primera opción del `mat-select` "Proveedor*" del formulario de productos y en la tabla de proveedores de Compras. No constituía XSS activo (Angular escapa `{{ }}` por defecto), pero era basura de datos visible en listados/demos. |
| **Código a modificar** | Ninguno — es un dato, no código. Se usó el endpoint estándar `DELETE /api/v1/purchases/suppliers/{id}` (soft delete, ya existente, mismo mecanismo que la UI de Compras), autorizado explícitamente por el usuario el 2026-06-12. |
| **Colaterales posibles** | Ninguno — `deactivateSupplier()` es un soft delete (`active = false`), preserva el registro para historial de órdenes. El servicio bloquea la desactivación si el proveedor tiene órdenes PENDING/APPROVED; `id=623` no tenía órdenes asociadas (registro de prueba aislado), por lo que la operación se completó sin bloqueo. |
| **Reversión** | `PUT /api/v1/purchases/suppliers/623` con `active: true` reactiva el registro (mismo mecanismo que cualquier reactivación de proveedor desde la UI). |
| **Criterio de éxito** | `GET /purchases/suppliers/623` → `active: false`; `GET /purchases/suppliers/active` ya no incluye `id=623`; el `mat-select` "Proveedor*" del formulario de productos ya no muestra `<script>alert(1)</script>`. |
| **Prueba de flujo ejecutada** | (1) `curl GET /purchases/suppliers/623` (admin) → `active: true` (estado previo confirmado) ✅. (2) `curl -X DELETE /purchases/suppliers/623` (admin) → **204 No Content** ✅. (3) `curl GET /purchases/suppliers/623` → `active: false`, `updatedAt`/`updatedById`/`updatedByUsername` actualizados a `admin` ✅. Sin cambios de código — no requiere regresión adicional. |

### Resumen de la ronda de corrección de bugs pendientes — 2026-06-11/12

Segunda ronda: los 8 bugs identificados y documentados (sin corregir) durante la ronda
2026-06-11 (ver `project_inventory_pending` en memoria), corregidos en este orden de menos
a más crítico, protocolo "uno a la vez" (verificación individual + regresión completa
backend `./mvnw test` y frontend `npx ng test --no-watch --no-progress` antes de continuar
con el siguiente). BUG-INV-13 quedó explícitamente excluido de esta ronda (acordado
previamente). Regresión final: backend 405 tests, 4 failures, 9 errors (mismo baseline +9
tests nuevos de BUG-INV-17, todos pasando); frontend 215/215 specs, 0 fallos — sin
regresiones nuevas en ninguno de los 8 fixes.

| # | Bug ID | Severidad | Resumen | Casos/documentos afectados |
|---|---|---|---|---|
| 1 | BUG-INV-08 | Baja | Concordancia de género en mensaje de categoría — **NO REPRODUCIBLE**, sin cambios de código | — |
| 2 | BUG-INV-10 | Baja | El paginador de productos no regresaba a la página 0 al cambiar de filtro/búsqueda | — |
| 3 | BUG-INV-07 | Baja | Encabezados de tabla sin los colores de marca (`#6B3C6B`) | VIS-GEN-06 → ✅ PASS |
| 4 | BUG-INV-14 | Media | Los diálogos (movimiento de stock, etc.) se cerraban al click en el backdrop, perdiendo cambios sin confirmación | — |
| 5 | BUG-INV-12 | Media | `403` en `GET /purchases/suppliers/active` para SALES rompía el `forkJoin` del formulario de productos | — |
| 6 | BUG-INV-11 | Alta | `unitCost` expuesto en el JSON de los 7 endpoints de lectura de productos para roles sin permiso (excessive data exposure) | CYBER-07 → ✅ PASS |
| 7 | BUG-INV-17 | Alta | `POST /auth/login` sin rate limiting/lockout ante intentos fallidos repetidos (brute force / credential stuffing) | CYBER-19 → ✅ PASS |
| 8 | CYBER-18 | Info/config | Faltan `Content-Security-Policy` y `Strict-Transport-Security` — **no es bug de código**, es checklist de despliegue a producción | CYBER-18 → documentado vía L28 (no aplica estado PASS/FAIL) |
| 9 | BUG-INV-13 | Media | Excluido de esta ronda; verificado por separado el 2026-06-12 — **NO REPRODUCIBLE** (corregido como efecto colateral de BUG-INV-09) | CYBER-02 → ✅ PASS |

> Cualquier bug NUEVO encontrado durante esta ronda se agrega con estado `⚠️ ABIERTO` y
> referencia al ID del caso que lo detectó. No se corrige sin autorización del usuario.
> BUG-INV-13 fue verificado por separado el 2026-06-12 (ver "BUG-INV-13 — Verificación") y
> resultó NO REPRODUCIBLE — no quedan bugs pendientes de esta ronda ni de la ronda anterior.

---

### Resumen de la ronda de corrección de bugs — 2026-06-11

Bugs corregidos en orden de menos a más crítico (protocolo "uno a la vez", verificación
individual + regresión completa antes de continuar con el siguiente). Todos verificados
sin introducir bugs nuevos (`./mvnw test` → 396 tests, 4 failures, 9 errors, idéntico al
baseline antes de la ronda).

| # | Bug ID | Severidad | Resumen | Casos afectados que cambiaron de estado |
|---|---|---|---|---|
| 1 | TS2345 | Baja (build) | Error de tipos en `category.service.spec.ts` impedía compilar la suite de tests | — (solo build/tests) |
| 2 | BUG-M3-20 | Baja/Media | Colores de `MatSnackBar` de error usaban la paleta de éxito (verde) en vez de roja | — (visual, sin caso CYBER específico) |
| 3 | BUG-M3-23 / BUG-INV-16 | Media | Transiciones de estado inválidas y login con credenciales incorrectas respondían HTTP 500 en vez de 422/401 | CYBER-12 (compras), CYBER-14 → ✅ PASS |
| 4 | BUG-M3-24 | Alta | `unitCost`/`totalAmount`/`unitPrice` expuestos en JSON para roles sin permiso (excessive data exposure) | CYBER-07 (compras) → ✅ PASS |
| 5 | BUG-INV-15 | Alta | CORS con `setAllowedOriginPatterns("*")` + `allowCredentials(true)` permitía requests autenticados desde cualquier origen | CYBER-13 (inventario y compras) → ✅ PASS |
| 6 | BUG-INV-09 | Crítica | Spring Security respondía 403 (no 401) para "no autenticado" (sin JWT/JWT inválido/expirado), impidiendo que el frontend detectara "sesión expirada" | CYBER-08, CYBER-11, CYBER-22 (inventario); CYBER-08, CYBER-11 (compras) → ✅ PASS |

> Cualquier bug NUEVO encontrado durante la re-validación se agrega aquí con estado `⚠️ ABIERTO`
> y referencia al ID del caso que lo detectó. No se corrige sin autorización del usuario.

---

## Historial de rondas de verificación

| Ronda | Fecha | Casos ejecutados | PASS | FAIL | N/A | Resultado | Notas |
|---|---|---|---|---|---|---|---|
| 1 | 2026-06-09 | 176 | 156 | 9 | 0 | ❌ Bugs encontrados | Primera ejecución (sin CYBER). 9 FAIL: BUG-INV-06..14 |
| 2 | 2026-06-11 | 198 | 191 | 0 | 7 | ✅ Certificada (lectura estricta) | +22 casos CYBER; bugs BUG-INV-07..18 corregidos; CYBER-18 → N/A (producción) |
| 3 | 2026-06-23 | ⏳ | — | — | 7 | 🔄 En curso (reset) | Reset completo bajo Protocolo 4 fases; nuevas lecciones L34/L35 integradas |

---

## Checklist de cierre (Propuesta D)

Antes de declarar el módulo **done** en la ronda actual, verificar que se cumplen las 6 condiciones:

```
[ ] 1. Todos los 198 casos tienen estado en columna "Estado" — 0 filas ⏳ PENDIENTE.
       Última ronda certificada (2026-06-11): 191 ✅ PASS · 0 ❌ FAIL · 7 N/A.
[ ] 2. ng build --configuration=production → 0 errores AOT (no opcional — BUG-BUILD-01:
       el runner de tests no aplica strictTemplates AOT).
[ ] 3. ng test --no-watch --coverage → 0 fallos; cobertura statements ≥ 70%.
[ ] 4. Backend mvn test → 0 fallos nuevos respecto al baseline documentado.
[ ] 5. Prueba browser completa re-ejecutada con los 4 roles QA (ADMIN, MANAGER,
       WAREHOUSEMAN, SALES) — lectura estricta: todos los casos en una sola sesión
       sobre código congelado, de principio a fin.
[ ] 6. Actualizar memoria técnica §8/§10 + memoria_tecnica_global_proyecto.md +
       estado_sesion_activa.md. Commit chore(qa) con fecha y resultado.
```

**Checklist L29-L35 (mandatorio desde diseño inicial):**
```
[ ] L29 — Matriz de campos sensibles × roles documentada en §4; redacción aplicada
           server-side (no solo ocultada en frontend)
[ ] L30 — 401 vs 403 correcto (JwtAuthenticationEntryPoint / JwtAccessDeniedHandler);
           rate limiting en endpoints de autenticación
[ ] L31 — Todos los MatDialog con formulario usan disableClose:true; paginador resetea
           a página 0 al cambiar filtro/búsqueda
[ ] L32 — Estilos de headers de tabla definidos en mixin SCSS compartido (no copiados
           manualmente en cada componente)
[ ] L33 — forkJoin con fuentes de RBAC distinto envuelven cada observable con catchError;
           datos de prueba prefijados [QA]/TEST_ eliminados al cerrar
[ ] L34 — Click en mat-row abre detalle/edición; no existe columna actions redundante;
           botones dentro del formulario usan stopPropagation()
[ ] L35 — Usuarios QA permanentes usados (no efímeros): admin, qa_manager,
           qa_warehouse, qa_sales
```
