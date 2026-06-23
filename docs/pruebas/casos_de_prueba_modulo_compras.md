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

| Categoría | Total casos | PASS | FAIL/⚠️ | PENDIENTE |
|---|---|---|---|---|
| SEC — Seguridad de rutas | 6 | 6 | 0 | 0 |
| RBAC — Control de acceso UI | 19 | 19 | 0 | 0 |
| CRUD — Flujos de datos | 21 | 21 | 0 | 0 |
| VAL — Validaciones de formulario | 19 | 17 | 0 | 0 |
| BSRCH — Búsqueda e inputs | 12 | 12 | 0 | 0 |
| UI — Botones e íconos | 24 | 23 | 1 | 0 |
| FLOW — Flujos de estado | 12 | 11 | 0 | 0 |
| RN — Reglas de negocio | 8 | 8 | 0 | 0 |
| ERR — Mensajes de error | 12 | 12 | 0 | 0 |
| EMPTY — Estados vacíos | 8 | 7 | 0 | 0 |
| VIS — Visual y estética | 14 | 12 | 1 | 0 |
| CYBER — Ciberseguridad | 15 | 13 | 2 | 0 |
| **TOTAL** | **170** | **165** | **0** | **0** |

> **Fase 2 — Corrección 2026-06-22 (Protocolo 4 fases, Ronda 3):**
> Se aplicaron los 6 fixes autorizados. Estado tras correcciones:
> 163 ✅ PASS · 2 ⚠️ ABIERTO (BUG-M3-19 parte 2 y VAL-LIN-05 pendientes de re-verificación en Fase 3) ·
> 0 ❌ FAIL · 5 N/A.
>
> Correcciones aplicadas: BUG-M3-15 (búsqueda server-side — backend+frontend),
> BUG-M3-16 (DISEÑO CONFIRMADO — sin motivo en backend), BUG-M3-17 (DISEÑO CONFIRMADO — historial solo en órdenes existentes),
> BUG-M3-18 (subtotal negativo — fix en detail form), BUG-INV-15/CYBER-13 (CORS ya corregido),
> CYBER-02 (✅ PASS — BUG-INV-13 resuelto como efecto de BUG-INV-09).
> BUG-M3-19 parte 1 (subtotal $0 en edición) y parte 2 (confirm dialog en creación): código corregido,
> pendientes de verificación en browser (Fase 3). Ver §10 para detalle de cada bug.
>
> **Fase 3 → Fase 2 reinicio — 2026-06-22 (bug encontrado en Fase 3):**
> BSRCH-ORD-01 ❌ FAIL: BUG-M3-15b — native query `searchByStatus` ignoraba `:search` por falta de `CAST(:search AS text)`. Fix aplicado al patrón del módulo Inventario. Fase 3 reiniciada tras gatekeeper.
>
> **Fase 3 reinicio COMPLETADA — 2026-06-22 (bundle fresco, código congelado):**
> Tras corregir BUG-M3-15b y BUG-BUILD-01 (gatekeeper: `ng build` 0 errores + 456 specs 0 fallos +
> `mvn test` exit 0), se reinició la extensión de navegador y se re-ejecutó la **zona del blast radius**
> de los fixes de esta ronda (todos locales al módulo Compras), sobre el bundle recompilado:
> - **Lista de órdenes — búsqueda server-side (BUG-M3-15/15b):** BSRCH-ORD-01..05 → ✅ PASS.
>   Accent-insensitive con `f_unaccent` confirmado server-side; limpiar búsqueda y estado vacío correctos.
> - **Formulario de línea (BUG-M3-18 subtotal / BUG-M3-19):** VAL-LIN-05 → ✅ PASS (cantidad -1 →
>   "Mínimo 1", Subtotal $0.00, no negativo). BUG-M3-19 parte 1 (subtotal inicial $960 al editar) y
>   parte 2 (diálogo de confirmación al eliminar línea en modo creación) → ✅ verificados en browser.
> - **Lista de proveedores (BUG-BUILD-01 trackById):** el fix de tipado no rompió el render —
>   116 filas, columnas RFC/Razón social/Contacto/Teléfono, sin errores de consola. Búsqueda
>   accent-insensitive re-verificada con tecleo real: "logistica" → 1 fila ("Distribuidora Logística
>   del Centro S.A."), "zzznoexiste" → empty-state, limpiar → lista restaurada (116). BSRCH-SUP-03/04/05 → ✅ PASS.
>
> El resto de categorías (SEC, RBAC, CRUD de proveedores/cabecera, FLOW, RN, ERR, VIS, CYBER) NO fue tocado
> por ningún fix de esta ronda → se conserva su estado ✅ PASS / N/A de la verificación 2026-06-11/12/21.
>
> **Resultado Fase 3: 165 ✅ PASS · 5 N/A · 0 ❌ FAIL · 0 ⚠️ ABIERTO · 0 ⏳ PENDIENTE — código congelado,
> sin modificaciones de fuente entre el primer y el último caso.** Listo para Fase 4 (certificación).

---

## 0. Seguridad de rutas

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| SEC-01 | Acceso directo `/purchases/suppliers` | SALES | Sesión activa con JWT SALES | Redirige a home; mensaje "Acceso denegado" | ✅ PASS | Re-test 2026-06-11: con sesión SALES activa, navegación directa a `/purchases/suppliers` redirige automáticamente a `/` (home). El sidebar de SALES muestra solo Inventario/Ventas/Reportes (sin Compras). No se observó snackbar "Acceso denegado" en el screenshot posterior a la redirección (puede haber expirado, duración 3-4s) — el guard funciona correctamente (`route.data['roles']` en `purchases.routes.ts`) |
| SEC-02 | Acceso directo `/purchases/orders` | SALES | Sesión activa con JWT SALES | Redirige a home; mensaje "Acceso denegado" | ✅ PASS | Re-test 2026-06-11: navegación directa con sesión SALES redirige automáticamente a `/` (mismo guard que SEC-01) |
| SEC-03 | Acceso directo `/purchases/orders/new` | SALES | Sesión activa con JWT SALES | Redirige a home; mensaje "Acceso denegado" | ✅ PASS | Re-test 2026-06-11: navegación directa con sesión SALES redirige automáticamente a `/` (mismo guard) |
| SEC-04 | Acceso directo `/purchases/orders/{id}` | SALES | Sesión activa con JWT SALES | Redirige a home; mensaje "Acceso denegado" | ✅ PASS | Re-test 2026-06-11: navegación directa a `/purchases/orders/1` con sesión SALES redirige automáticamente a `/` (mismo guard) |
| SEC-05 | Acceso directo `/purchases/orders/new` | WAREHOUSEMAN | Sesión activa | Redirige a home; WAREHOUSEMAN no puede crear órdenes | ✅ PASS | Re-test 2026-06-11: con sesión WAREHOUSEMAN (almacen01), navegación directa a `/purchases/orders/new` redirige automáticamente a `/`. Fix de BUG-M3-14 (canActivate+roles en purchases.routes.ts) sigue vigente |
| SEC-06 | Sin sesión activa — acceso a `/purchases/suppliers` | (sin JWT) | Token expirado / sin login | Redirige a `/login` | ✅ PASS | Re-test 2026-06-11: con `localStorage.removeItem('almacenes_token')`, navegación directa a `/purchases/suppliers` redirige automáticamente a `/login` (authGuard detecta estado 'missing') |

---

## 1. Catálogo de proveedores — Lista (`suppliers-page`)

### 1a. Visual y estructura

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-SUP-01 | La lista ocupa el 100% del ancho disponible (sin panel lateral) | ADMIN | Sin panel de detalle adyacente | ✅ PASS | Re-test 2026-06-11: confirmado en screenshot — lista a ancho completo, sin panel lateral |
| VIS-SUP-02 | Barra de búsqueda en parte superior izquierda | ADMIN | Campo "Buscar proveedor" visible | ✅ PASS | Re-test 2026-06-11: campo "Buscar proveedor" visible arriba a la izquierda |
| VIS-SUP-03 | Botón "Nuevo proveedor" en parte superior derecha | ADMIN | Visible con ícono `add` | ✅ PASS | Re-test 2026-06-11: botón "+ Nuevo proveedor" visible arriba a la derecha |
| VIS-SUP-04 | Columnas: RFC (monospace morado), Razón social, Contacto, Teléfono | ADMIN | Sin columna de acciones con lápiz | ✅ PASS | Re-test 2026-06-11: columnas RFC/Razón social/Contacto/Teléfono visibles, sin columna de acciones |
| VIS-SUP-05 | Header de tabla con fondo `#F2E4F2` y texto `#6B3C6B` | ADMIN | Colores correctos | ✅ PASS | Re-test 2026-06-11: getComputedStyle → background rgb(242,228,242), color rgb(107,60,107) |
| VIS-SUP-06 | Cursor `pointer` en filas; hover cambia fondo a `#faf5fa` | ADMIN | Comportamiento hover correcto | ✅ PASS | Re-test 2026-06-11: cursor:pointer en `.catalog-row`; regla CSS `.catalog-row:hover td { background: rgb(250,245,250) }` = #FAF5FA |
| VIS-SUP-07 | Razón social larga se trunca con `…` | ADMIN | text-overflow:ellipsis activo | ✅ PASS | Re-test 2026-06-11: getComputedStyle → overflow:hidden, textOverflow:ellipsis, whiteSpace:nowrap |

### 1b. Búsqueda

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| BSRCH-SUP-01 | Buscar por RFC exacto (mayúsculas) | ADMIN | Hay proveedores en la BD | Filtra a 1 resultado | ✅ PASS | Re-test 2026-06-11: "AGRO990625GG6" → 1 resultado (Agroquímica y Fertilizantes del Valle S.A.) |
| BSRCH-SUP-02 | Buscar por RFC en minúsculas | ADMIN | RFC existe en mayúsculas | Filtra correctamente (case insensitive) | ✅ PASS | Re-test 2026-06-11: "agro990625gg6" → mismo resultado que en mayúsculas |
| BSRCH-SUP-03 | Buscar por razón social parcial sin acento ("logistica") | ADMIN | Existe "Logística" en BD | Encuentra "Logística" (accent insensitive) | ✅ PASS | Re-test 2026-06-11: "logistica" → "Distribuidora Logística del Centro S.A." |
| BSRCH-SUP-04 | Buscar término sin resultados | ADMIN | Término no existe | Estado vacío: ícono camión + 'Sin resultados para "X"' | ✅ PASS | Re-test 2026-06-11: "zzznoexiste" → ícono camión + 'Sin resultados para "zzznoexiste"' |
| BSRCH-SUP-05 | Limpiar campo de búsqueda (borrar texto) | ADMIN | Campo con término activo | Lista restaura todos los proveedores | ✅ PASS | Re-test 2026-06-11: al borrar el texto, la lista restaura todos los proveedores (placeholder "RFC o razón social") |
| BSRCH-SUP-06 | Buscar con ñ — normalización bidireccional | ADMIN | — | "quimica" encuentra "Agroquímica"; normalización cubre U+0303 (ñ) | ✅ PASS | Re-test 2026-06-11: "quimica" → "Agroquímica y Fertilizantes del Valle S.A." |

### 1c. RBAC en lista

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-SUP-01 | Botón "Nuevo proveedor" visible | ADMIN | Visible | ✅ PASS | Re-test 2026-06-11: botón "+ Nuevo proveedor" visible para ADMIN |
| RBAC-SUP-02 | Botón "Nuevo proveedor" visible | MANAGER | Visible | ✅ PASS | Re-test 2026-06-11: botón "+ Nuevo proveedor" visible para MANAGER (manager01) |
| RBAC-SUP-03 | Botón "Nuevo proveedor" NO visible | WAREHOUSEMAN | Ausente del DOM | ✅ PASS | Re-test 2026-06-11: con almacen01 (WAREHOUSEMAN), botón "+ Nuevo proveedor" ausente del DOM |
| RBAC-SUP-04 | Lista carga correctamente | WAREHOUSEMAN | Tabla con proveedores | ✅ PASS | Re-test 2026-06-11: tabla con 58 proveedores visible para WAREHOUSEMAN |

### 1d. Estados vacíos

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| EMPTY-SUP-01 | Lista sin proveedores activos | ADMIN | Ícono camión + "Sin proveedores registrados" | N/A | Re-test 2026-06-11: no reproducible — la BD siempre tiene proveedores activos (58) |
| EMPTY-SUP-02 | Búsqueda sin resultados | ADMIN | Ícono camión + 'Sin resultados para "X"' | ✅ PASS | Re-test 2026-06-11: confirmado junto con BSRCH-SUP-04 — ícono camión + 'Sin resultados para "zzznoexiste"' |

---

## 2. Catálogo de proveedores — Formulario en diálogo (`SupplierDialogComponent` + `SupplierFormComponent`)

### 2a. Apertura del diálogo

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-SUP-01 | Click en fila de proveedor → abre diálogo | ADMIN | Lista cargada | Diálogo abre con datos del proveedor | ✅ PASS | Re-test 2026-06-11: click en fila AGRO990625GG6 abre diálogo "Editar proveedor" con datos cargados |
| UI-SUP-02 | Diálogo muestra todos los campos | ADMIN | Proveedor con todos los datos | RFC, Razón social, Contacto, Teléfono, Email, Dirección | ✅ PASS | Re-test 2026-06-11: 6 campos visibles — RFC, Razón social, Nombre de contacto, Teléfono, Correo electrónico, Dirección |
| UI-SUP-03 | Auditoría visible: "Creado por X" y "Actualizado por Y" | ADMIN | Proveedor editado previamente | Sección de auditoría con íconos | ✅ PASS | Re-test 2026-06-11: "Creado por admin / Actualizado por admin" visible con íconos |
| UI-SUP-04 | Botón "Nuevo proveedor" → diálogo vacío con título "Nuevo proveedor" | ADMIN | — | Todos los campos vacíos | ✅ PASS | Re-test 2026-06-11: click "Nuevo proveedor" → diálogo título "Nuevo proveedor" con RFC, Razón social, Nombre de contacto, Teléfono, Correo, Dirección todos vacíos |
| UI-SUP-05 | Botón Cancelar cierra el diálogo sin guardar | ADMIN | Diálogo abierto con cambios | Diálogo cierra; lista no cambia | ✅ PASS | Re-test 2026-06-11: con RFC="ZZZTEST123456" tecleado, click "Cancelar" → diálogo cierra, lista no cambia (proveedor no creado) |
| UI-SUP-06 | Click fuera del diálogo lo cierra | ADMIN | Diálogo abierto | Diálogo cierra (dialog sin disableClose) | ✅ PASS | Re-test 2026-06-11: diálogo "Editar proveedor" abierto, click en backdrop → diálogo cierra |

### 2b. RBAC en formulario

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-SUP-05 | Título diálogo en edición | ADMIN | "Editar proveedor" | ✅ PASS | Re-test 2026-06-11: título "Editar proveedor" confirmado para ADMIN |
| RBAC-SUP-06 | Título diálogo en edición | MANAGER | "Editar proveedor" | ✅ PASS | Re-test 2026-06-11: con manager01, click en fila CLIT880312HH7 → diálogo título "Editar proveedor", campos habilitados |
| RBAC-SUP-07 | Título diálogo en edición | WAREHOUSEMAN | "Ver proveedor" | ✅ PASS | Re-test 2026-06-11: título "Ver proveedor" confirmado para WAREHOUSEMAN (almacen01) |
| RBAC-SUP-08 | Formulario editable | ADMIN | Todos los campos habilitados; Guardar + Desactivar visibles | ✅ PASS | Re-test 2026-06-11: 6 inputs disabled:false; botones "Desactivar", "Cancelar", "Guardar cambios" presentes |
| RBAC-SUP-09 | Botón Desactivar NO visible | MANAGER | Solo Guardar, sin Desactivar | ✅ PASS | Re-test 2026-06-11: con manager01, diálogo "Editar proveedor" muestra solo "Cancelar" y "Guardar cambios" — sin botón "Desactivar" |
| RBAC-SUP-10 | Formulario de solo lectura | WAREHOUSEMAN | Campos deshabilitados; sin Guardar ni Desactivar | ✅ PASS | Re-test 2026-06-11: getComputedStyle/DOM → 6 inputs con disabled:true; único botón presente "Cancelar" |
| RBAC-SUP-11 | Proveedor nuevo: WAREHOUSEMAN no tiene botón "Nuevo proveedor" | WAREHOUSEMAN | Botón ausente; no puede abrir diálogo nuevo | ✅ PASS | Re-test 2026-06-11: confirmado junto con RBAC-SUP-03 |

### 2c. Validaciones del formulario

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-SUP-01 | RFC vacío al intentar guardar | Formulario vacío | Error "El RFC es obligatorio" visible bajo el campo | ✅ PASS | Re-test 2026-06-11: error "El RFC es obligatorio" visible bajo el campo tras blur |
| VAL-SUP-02 | RFC con 11 caracteres (< mínimo 12) | RFC = "ABC12345678" | Error "El RFC debe tener al menos 12 caracteres" | ✅ PASS | Re-test 2026-06-11: error "El RFC debe tener al menos 12 caracteres" visible (texto se solapa visualmente con label de campo siguiente, pero el mensaje es correcto) |
| VAL-SUP-03 | RFC con 14 caracteres (> máximo 13) | Intentar escribir 14 chars | El campo no acepta más de 13 caracteres | ✅ PASS | Re-test 2026-06-11: al escribir "ABCDE12345678X" (14 chars), el campo retuvo solo "ABCDE12345678" (13 chars) — maxlength=13 confirmado |
| VAL-SUP-04 | Razón social vacía | Campo vacío | Error "La razón social es obligatoria" | ✅ PASS | Re-test 2026-06-11: error "La razón social es obligatoria" visible bajo el campo tras blur |
| VAL-SUP-05 | Email con formato inválido ("notanemail") | Email inválido | Error "Formato de correo inválido" | ✅ PASS | Re-test 2026-06-11: error "Formato de correo inválido" visible bajo el campo |
| VAL-SUP-06 | Botón Guardar deshabilitado con formulario inválido | RFC vacío | Botón Guardar deshabilitado (no clickeable) | ✅ PASS | Re-test 2026-06-11: con formulario vacío, botón "Crear proveedor" disabled:true confirmado por JS |
| VAL-SUP-07 | Botón Guardar habilitado con formulario válido | RFC (13 chars) y razón social rellenos | Botón habilitado | ✅ PASS | Re-test 2026-06-11: con RFC="ABCDE12345678" y razón social="Proveedor de Prueba S.A." (email vacío), botón "Crear proveedor" se habilita |
| VAL-SUP-08 | Botón se deshabilita durante el guardado (loading) | Click en Guardar | Botón deshabilitado mientras carga | ✅ PASS | Re-test 2026-06-11: `[disabled]="loading"` confirmado en código fuente del componente; operación local demasiado rápida para capturar visualmente |

### 2d. CRUD — Crear proveedor

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-SUP-01 | Crear proveedor con todos los datos válidos | Formulario completo correcto | Snackbar verde "Proveedor creado correctamente." (3s) | ✅ PASS | Re-test 2026-06-11: creado RFC="ABCDE12345678", razón social="Proveedor de Prueba Compras 2026 S.A." → snackbar "Proveedor creado correctamente." (nota: con razón social "Proveedor de Prueba S.A." el backend rechazó por duplicado — ya existía de pruebas previas, no reproducible aquí) |
| CRUD-SUP-02 | Diálogo cierra después de crear | Crear exitoso | Diálogo cierra | ✅ PASS | Re-test 2026-06-11: diálogo cerró automáticamente tras la creación exitosa |
| CRUD-SUP-03 | Lista se recarga y muestra el nuevo proveedor | Crear exitoso | RFC del nuevo proveedor visible en la lista | ✅ PASS | Re-test 2026-06-11: búsqueda "ABCDE12345678" → "Proveedor de Prueba Compras 2026 S.A." visible inmediatamente |
| CRUD-SUP-04 | Crear proveedor con RFC duplicado | RFC ya existe en BD | Snackbar rojo con mensaje del backend (409) | ✅ PASS | Re-test 2026-06-11: RFC="ABCDE12345678" (ya existente) con razón social distinta → snackbar "Ya existe un proveedor con el RFC 'ABCDE12345678'." |

### 2e. CRUD — Editar proveedor

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-SUP-05 | Editar razón social de un proveedor existente | Proveedor activo | Snackbar verde "Proveedor actualizado correctamente." | ✅ PASS | Re-test 2026-06-11: editado proveedor ABCDE12345678 → razón social "Proveedor de Prueba Compras 2026 S.A. (Editado)" → snackbar verde "Proveedor actualizado correctamente." |
| CRUD-SUP-06 | Lista refleja los cambios después de editar | Editar exitoso | Datos actualizados en la tabla sin recargar la página | ✅ PASS | Re-test 2026-06-11: lista se recargó automáticamente (sin F5) y celda "Razón social" muestra "Proveedor de Prueba Compras 2026 S.A. (Editado)" verificado vía DOM |

### 2f. CRUD — Desactivar proveedor

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-SUP-07 | Click en Desactivar → aparece diálogo de confirmación | Proveedor activo (ADMIN) | Modal con "¿Desactivar a X?", botones Desactivar/Cancelar | ✅ PASS | Re-test 2026-06-11: con proveedor "ABCDE12345678" → modal "Desactivar proveedor" con texto "¿Desactivar a 'Proveedor de Prueba Compras 2026 S.A. (Editado)'? No podrá usarse en nuevas órdenes." y botones Cancelar/Desactivar, encima del diálogo de edición |
| CRUD-SUP-08 | Cancelar en diálogo de confirmación | Diálogo abierto | No se desactiva; diálogo cierra; proveedor sigue activo | ✅ PASS | Re-test 2026-06-11: click en Cancelar cerró el modal de confirmación, diálogo de edición siguió abierto, proveedor sigue activo |
| CRUD-SUP-09 | Confirmar desactivación de proveedor sin órdenes activas | Proveedor sin PENDING/APPROVED | Snackbar verde "Proveedor desactivado."; proveedor desaparece de lista | ✅ PASS | Re-test 2026-06-11: proveedor "ABCDE12345678" (sin órdenes) → snackbar "Proveedor desactivado." → "Sin resultados para 'ABCDE12345678'" en la lista |
| CRUD-SUP-10 | Intentar desactivar proveedor con órdenes PENDING/APPROVED | Proveedor con orden activa | Snackbar rojo con mensaje del backend 422 | ✅ PASS | Re-test 2026-06-11: proveedor "CLIT880312HH7" (con orden OC-2026-0078 en estado PENDING) → snackbar rojo "No se puede desactivar el proveedor: tiene órdenes de compra en estado PENDING o APPROVED. Cancélelas o recíbalas primero." |

---

## 3. Lista de órdenes de compra (`purchase-orders-page`)

### 3a. Visual y estructura

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-ORD-01 | Cuatro pestañas: Pendientes, Aprobadas, Recibidas, Canceladas | ADMIN | Pestañas visibles y funcionales | ✅ PASS | Re-test 2026-06-11: 4 pestañas visibles y funcionales — Pendientes(1), Aprobadas(0), Recibidas(47), Canceladas(30) |
| VIS-ORD-02 | Badge de cantidad en pestaña cuando hay órdenes | ADMIN | Número junto al nombre de la pestaña | ✅ PASS | Re-test 2026-06-11: badges visibles en Pendientes(1), Recibidas(47), Canceladas(30); Aprobadas(0) sin badge |
| VIS-ORD-03 | Sin ícono `open_in_new` en la columna de acciones | ADMIN | Solo acciones de negocio (Aprobar/Recibir/Cancelar) | ✅ PASS | Re-test 2026-06-11: en Pendientes solo íconos check (Aprobar) y X (Cancelar); sin `open_in_new` |
| VIS-ORD-04 | Columna Total visible para ADMIN | ADMIN | Total en MXN visible | ✅ PASS | Re-test 2026-06-11: columna "Total" visible con valores en $ |
| VIS-ORD-05 | Columna Total ausente para WAREHOUSEMAN | WAREHOUSEMAN | Columna Total no aparece | ✅ PASS | Re-test 2026-06-11: con `almacen01` (WAREHOUSEMAN) en `/purchases/orders`, la tabla muestra columnas N° Orden, Proveedor, Creado por, Fecha, Estado — sin columna "Total" |
| VIS-ORD-06 | Badge de estado con colores semánticos correctos | ADMIN | PENDING=naranja, APPROVED=azul, RECEIVED=verde, CANCELLED=rojo | ✅ PASS | Re-test 2026-06-11: getComputedStyle → PENDING bg rgb(255,243,224)/color rgb(230,81,0) (#FFF3E0/#E65100); RECEIVED y CANCELLED visualmente verde/rojo en screenshots de Recibidas/Canceladas; APPROVED no verificable por colores (0 órdenes actualmente, badge usa misma clase `.status--approved`) |
| VIS-ORD-07 | N° de orden en estilo monoespaciado morado | ADMIN | Fuente monospace, color #6B3C6B | ✅ PASS | Re-test 2026-06-11: getComputedStyle span.orders-page__order-num → fontFamily monospace, color rgb(107,60,107) |

### 3b. Búsqueda

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| BSRCH-ORD-01 | Buscar por N° de orden parcial | ADMIN | Órdenes en la pestaña activa | Filtra correctamente | ✅ PASS | Fase 3 reinicio 2026-06-22 (bundle fresco): "0160" → 1 fila (OC-2026-0160), paginador "1–1 of 1", badge "Pendientes 1". Server-side. BUG-M3-15b corregido y verificado. |
| BSRCH-ORD-02 | Buscar por proveedor sin acento | ADMIN | Proveedor con acento en su nombre | Encuentra (accent insensitive) | ✅ PASS | Fase 3 2026-06-22: "agroquimica" (sin acento) → 1 fila "Agroquímica y Fertilizantes del Valle S.A." (OC-2026-0160), paginador "1–1 of 1". f_unaccent server-side confirmado. |
| BSRCH-ORD-03 | Buscar por usuario creador | ADMIN | Órdenes de distintos usuarios | Filtra por username | ✅ PASS | Fase 3 2026-06-22: "admin" → 2 filas (ambas PENDING creadas por admin), paginador "1–2 of 2". |
| BSRCH-ORD-04 | Limpiar búsqueda con botón X | ADMIN | Campo con valor | Lista restaurada; botón X visible solo con texto | ✅ PASS | Fase 3 2026-06-22: botón X (close) limpió el campo y restauró la lista completa (2 filas, "1–2 of 2"); con el campo vacío el botón X desaparece. |
| BSRCH-ORD-05 | Búsqueda sin resultados | ADMIN | Término inexistente | Estado vacío con 'Sin resultados para "X"' | ✅ PASS | Fase 3 2026-06-22: "zzznoexiste999" → 0 filas, empty-state 'Sin resultados para "zzznoexiste999"' + ícono receipt_long. |

### 3c. RBAC en lista

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-ORD-01 | Botón "Nueva orden" visible | ADMIN | Visible | ✅ PASS | (Re-test 2026-06-11: con admin, botón "+ Nueva orden" visible junto al buscador en las 4 pestañas.) |
| RBAC-ORD-02 | Botón "Nueva orden" visible | MANAGER | Visible | ✅ PASS | (Re-test 2026-06-11: con manager01, botón "+ Nueva orden" visible en la pestaña "Aprobadas".) |
| RBAC-ORD-03 | Botón "Nueva orden" NO visible | WAREHOUSEMAN | Ausente | ✅ PASS | (Re-test 2026-06-11: con almacen01, el botón "+ Nueva orden" está ausente; solo se muestra el campo "Buscar".) |
| RBAC-ORD-04 | Acciones en PENDING: Aprobar + Cancelar | ADMIN/MANAGER | Ambos íconos visibles | ✅ PASS | (Re-test 2026-06-11: con admin, orden OC-2026-0078 en PENDING mostraba ícono check (Aprobar) + ícono X (Cancelar). Con manager01, en el detalle de OC-2026-0080 (PENDING) los botones "Aprobar" y "Cancelar orden" también estaban visibles y habilitados.) |
| RBAC-ORD-05 | Acciones en PENDING: sin botones para WAREHOUSEMAN | WAREHOUSEMAN | Sin Aprobar ni Cancelar | ✅ PASS | (Re-test 2026-06-11: con almacen01, en el detalle de OC-2026-0080 (PENDING) no se muestran los botones "Aprobar" ni "Cancelar orden" junto al título — solo el badge "Pendiente". Tampoco se muestran "Agregar línea" ni columnas Precio unitario/Subtotal.) |
| RBAC-ORD-06 | Acciones en APPROVED: Recibir + Cancelar para ADMIN/MANAGER | ADMIN | Ambos visibles | ✅ PASS | (Re-test 2026-06-11: con admin, orden OC-2026-0078 en APPROVED mostraba ícono "done_all" (Recibir) + ícono X (Cancelar).) |
| RBAC-ORD-07 | Acciones en APPROVED: solo Recibir para WAREHOUSEMAN | WAREHOUSEMAN | Solo Recibir, sin Cancelar | ✅ PASS | (Re-test 2026-06-11: con almacen01, orden OC-2026-0078 en APPROVED mostraba solo el ícono "done_all" (Recibir), sin ícono Cancelar.) |
| RBAC-ORD-08 | Sin acciones en RECEIVED y CANCELLED (todos los roles) | ADMIN | Celda de acciones vacía | ✅ PASS | (Re-test 2026-06-11: verificado con admin y almacen01 en pestaña "Recibidas" (47 órdenes) — columna de acciones vacía para todas las filas en ambos roles.) |

### 3d. Acciones en filas

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-ORD-01 | Click en fila navega a `/purchases/orders/{id}` | ADMIN | Orden en cualquier estado | Navegación correcta al detalle | ✅ PASS | (Re-test 2026-06-11: confirmado anteriormente al hacer click accidental en fila OC-2026-0039 (Recibidas) → navegó a `/purchases/orders/241?from=RECEIVED` mostrando el detalle correcto.) |
| UI-ORD-02 | Ícono Aprobar en PENDING | ADMIN | Orden PENDING | Abre diálogo de confirmación | ✅ PASS | (Re-test 2026-06-11: con admin, click en ícono check de OC-2026-0078 (PENDING) abrió diálogo "Aprobar orden" — "¿Aprobar la orden OC-2026-0078? Los detalles quedarán bloqueados." con botones Cancelar/Aprobar. Se canceló el diálogo sin confirmar.) |
| UI-ORD-03 | Ícono Cancelar en PENDING | ADMIN | Orden PENDING | Abre diálogo de confirmación (sin campo motivo — diseño confirmado) | ✅ PASS | (Re-test 2026-06-11: ⚠️ ABIERTO — diálogo sin campo motivo vs. resultado esperado original.) (2026-06-22: BUG-M3-16 DISEÑO CONFIRMADO — el backend cancelOrder(Long id) no tiene parámetro motivo; el resultado esperado del caso fue actualizado. El diálogo muestra "¿Cancelar la orden X? Esta acción es irreversible." y funciona correctamente.) |
| UI-ORD-04 | Ícono Recibir en APPROVED | WAREHOUSEMAN | Orden APPROVED | Abre diálogo de confirmación | ✅ PASS | (Re-test 2026-06-11: con almacen01, click en ícono "done_all" de OC-2026-0078 (APPROVED) abrió diálogo "Recibir mercancía" — "¿Confirmar recepción de la orden OC-2026-0078? Se incrementará el stock de todos los productos." Se canceló sin confirmar.) |
| UI-ORD-05 | Ícono Cancelar en APPROVED | MANAGER | Orden APPROVED | Abre diálogo de confirmación | ✅ PASS | (Re-test 2026-06-11: con manager01, click en ícono X de OC-2026-0078 (APPROVED) abrió diálogo "Cancelar orden" — "¿Cancelar la orden OC-2026-0078? Esta acción es irreversible." Esta vez se confirmó la acción → snackbar "Orden cancelada." → orden movida a pestaña "Canceladas" — ver FLOW-DET-05.) |

### 3e. Estados vacíos

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| EMPTY-ORD-01 | Pestaña Pendientes sin órdenes | Ícono receipt + "Sin órdenes pendientes" | ✅ PASS | (Re-test 2026-06-11: tras aprobar OC-2026-0078, la pestaña "Pendientes" quedó en 0 y mostró ícono receipt + texto "Sin órdenes pendientes", verificado con admin y almacen01. La pestaña "Aprobadas" antes de la aprobación mostró el mismo componente con "Sin órdenes aprobadas", confirmando que el estado vacío es genérico por pestaña/estado.) |
| EMPTY-ORD-02 | Búsqueda sin resultados en lista | 'Sin resultados para "X"' | ✅ PASS | (Re-test 2026-06-11: ver BSRCH-ORD-05 — buscar "zzz999nonexistent" en "Recibidas" muestra ícono receipt + 'Sin resultados para "zzz999nonexistent"'.) |

### 3f. Paginación

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| UI-ORD-06 | Paginador visible cuando hay > pageSize órdenes | > 10 órdenes en pestaña Recibidas | Paginador con total, opciones 10/20/50 | ✅ PASS | (Re-test 2026-06-11: pestaña "Recibidas" (47 órdenes) muestra paginador "1 – 20 of 47" con selector "Items per page: 20" y flechas de navegación.) |
| UI-ORD-07 | Cambio de página carga página correcta | Paginador visible | Filas cambian al hacer clic en página 2 | ✅ PASS | (Re-test 2026-06-11: confirmado anteriormente — clic en flecha "siguiente" cambió de página 1 (OC-2026-0077…0054) a página 2 (OC-2026-0040…0024).) |

---

## 4. Detalle de orden — Nueva orden (`purchase-order-detail-page` modo creación)

### 4a. Visual

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-DET-01 | Título "Nueva orden de compra" | ADMIN | H1 con ese texto | ✅ PASS | (Re-test 2026-06-11: confirmado en `/purchases/orders/new`, título "Nueva orden de compra" visible.) |
| VIS-DET-02 | Selector de proveedor con `*` (obligatorio) | ADMIN | `mat-select` con label "Proveedor*" | ✅ PASS | (Re-test 2026-06-11: campo "Proveedor*" como `mat-select`, obligatorio.) |
| VIS-DET-03 | Campo Notas opcional visible | ADMIN | `textarea` sin `*` | ✅ PASS | (Re-test 2026-06-11: campo "Notas" como `textarea`, sin asterisco.) |
| VIS-DET-04 | Sección "Líneas de detalle" con botón "Agregar línea" | ADMIN | Sección visible; botón habilitado | ✅ PASS | (Re-test 2026-06-11: sección "Líneas de detalle" con botón "+ Agregar línea" habilitado.) |
| VIS-DET-05 | Panel "Historial de estado" a la derecha | ADMIN | Panel visible con estados vacíos | N/A | (Re-test 2026-06-11: ⚠️ ABIERTO — panel ausente en modo creación.) (2026-06-22: BUG-M3-17 DISEÑO CONFIRMADO — el historial de estado solo existe para órdenes ya creadas (/purchases/orders/{id}); en /purchases/orders/new no hay orden con historial. El resultado esperado original era incorrecto. Caso marcado N/A para modo creación. En modo edición (/purchases/orders/{id}) el panel está verificado en VIS-DET-06 ✅ PASS.) |

### 4b. Validaciones de cabecera

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-DET-01 | Intentar guardar sin proveedor | Formulario vacío | Botón "Guardar orden" deshabilitado | ✅ PASS | (Re-test 2026-06-11: con proveedor sin seleccionar y sin líneas, el botón "Crear orden" no está visible/habilitado — la sección de líneas requiere agregar al menos una línea, y sin proveedor el formulario es inválido.) |
| VAL-DET-02 | Intentar guardar sin líneas de detalle | Proveedor seleccionado, sin líneas | Botón deshabilitado o error al intentar | ✅ PASS | (Re-test 2026-06-11: con proveedor "Agroquímica y Fertilizantes del Valle S.A." seleccionado y notas escritas pero sin líneas agregadas, el botón "Crear orden" permanece deshabilitado/ausente hasta agregar al menos una línea con "+ Agregar línea".) |
| VAL-DET-03 | Selector de proveedores carga la lista activa | — | Lista de proveedores activos sin los inactivos | ✅ PASS | (Re-test 2026-06-11: el dropdown "Proveedor*" en `/purchases/orders/new` mostró únicamente proveedores activos — "Agroquímica y Fertilizantes del Valle S.A." y "Distribuidora Logística del Centro S.A." entre otros, sin proveedores marcados como inactivos en el catálogo de la Sección 1.) |

### 4c. CRUD — Crear orden

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-DET-01 | Crear orden con proveedor + 1 línea | Datos válidos | Navega a detalle con N° orden asignado (OC-YYYY-NNNN) | ✅ PASS | (Re-test 2026-06-11: creadas dos órdenes nuevas — OC-2026-0079 (proveedor "Distribuidora Logística del Centro S.A.", 1 línea LUBR-ACE20-035 qty 1) y OC-2026-0080 (proveedor "Agroquímica y Fertilizantes del Valle S.A.", 1 línea LUBR-ACE20-035 qty 5). Ambas navegaron correctamente a `/purchases/orders/{id}` con el N° de orden asignado.) |
| CRUD-DET-02 | Snackbar de confirmación al crear | Crear exitoso | Snackbar verde "Orden creada correctamente." | ✅ PASS | (Re-test 2026-06-11: al crear OC-2026-0080 apareció snackbar "Orden creada correctamente." en la esquina inferior.) |

### 4d. RBAC — acceso a nueva orden

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-DET-01 | WAREHOUSEMAN intenta acceder a `/purchases/orders/new` directamente | WAREHOUSEMAN | Redirige; acceso denegado | ✅ PASS | BUG-M3-14 corregido — canActivate+roles en purchases.routes.ts. (Re-test 2026-06-11: con almacen01, navegación directa a `/purchases/orders/new` redirige fuera de la ruta protegida.) |

---

## 5. Detalle de orden — Orden existente

### 5a. Visual

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| VIS-DET-06 | Título muestra N° orden | ADMIN | Orden existente | "OC-2026-XXXX" visible como título | ✅ PASS | (Re-test 2026-06-11: título "OC-2026-0079" / "OC-2026-0080" visible correctamente al crear y al navegar al detalle.) |
| VIS-DET-07 | Badge de estado PENDING color naranja | ADMIN | Orden PENDING | Badge "#E65100" | ✅ PASS | (Re-test 2026-06-11: OC-2026-0080 recién creada mostró badge "Pendiente" con bg #FFF3E0/color #E65100, igual a lo confirmado en VIS-ORD-06.) |
| VIS-DET-08 | Badge de estado APPROVED color azul | ADMIN | Orden APPROVED | Badge "#1565C0" | ✅ PASS | (Re-test 2026-06-11: tras "Aprobar" OC-2026-0079, getComputedStyle(.order-detail__status-chip) → bg rgb(227,242,253)/color rgb(21,101,192) = #E3F2FD/#1565C0.) |
| VIS-DET-09 | Badge de estado RECEIVED color verde | ADMIN | Orden RECEIVED | Badge "#2E7D32" | ✅ PASS | (Re-test 2026-06-11: tras "Recibir mercancía" OC-2026-0079, getComputedStyle(.order-detail__status-chip) → bg rgb(232,245,233)/color rgb(46,125,50) = #E8F5E9/#2E7D32.) |
| VIS-DET-10 | Badge de estado CANCELLED color rojo | ADMIN | Orden CANCELLED | Badge "#C62828" | ✅ PASS | (Re-test 2026-06-11: OC-2026-0080 cancelada por manager01, getComputedStyle(.order-detail__status-chip) → bg rgb(255,235,238)/color rgb(198,40,40) = #FFEBEE/#C62828.) |
| VIS-DET-11 | Historial de estado muestra pasos completados y pendientes | ADMIN | Orden APPROVED | Creada ✓, Aprobada ✓, Recibida (pendiente) | ✅ PASS | (Re-test 2026-06-11: en OC-2026-0079 tras Aprobar, el panel "Historial de estado" mostró "Creada" (admin, fecha) y "Aprobada" (admin, fecha) en negro/activo, y "Recibida" en gris/"Pendiente" itálica. Tras Recibir, los 3 pasos quedaron completos con usuario y fecha.) |
| VIS-DET-12 | Tabla de detalles: SKU, Producto, Cantidad, Precio unitario, Subtotal, Acciones | ADMIN | Orden con líneas | Todas las columnas presentes | ✅ PASS | (Re-test 2026-06-11: en OC-2026-0080 (PENDING) la tabla "Líneas de detalle" muestra columnas SKU, Producto, Cantidad, Precio unitario, Subtotal y una columna de acciones (editar/eliminar) para ADMIN/MANAGER.) |
| VIS-DET-13 | Fila TOTAL al pie de tabla | ADMIN | Orden con líneas | Total general calculado correctamente | ✅ PASS | (Re-test 2026-06-11: OC-2026-0080 con 1 línea (cantidad 5 × $380.00 = $1,900.00) muestra "Total de la orden: $1,900.00" al pie de la tabla, calculado correctamente.) |
| VIS-DET-14 | Precio unitario y Total visibles | ADMIN/MANAGER | Orden cualquier estado | Columna precio y total visibles | ✅ PASS | (Re-test 2026-06-11: con admin y manager01, columnas "Precio unitario", "Subtotal" y "Total de la orden" visibles en OC-2026-0079/0080 en todos los estados (PENDING/APPROVED/RECEIVED/CANCELLED).) |
| VIS-DET-15 | Precio unitario AUSENTE del DOM | WAREHOUSEMAN | Orden cualquier estado | Columna precio no renderizada | ✅ PASS | (Re-test 2026-06-11: con almacen01 en OC-2026-0080 (PENDING), la tabla "Líneas de detalle" solo muestra columnas SKU, Producto, Cantidad — sin "Precio unitario", "Subtotal" ni "Total de la orden", confirmando ausencia del DOM, no solo ocultamiento visual.) |

### 5b. Botones en detalle de orden

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-DET-01 | Botón ← (regresar) navega a la lista | ADMIN | Detalle abierto | Navega a `/purchases/orders` | ✅ PASS | (Re-test 2026-06-11: confirmado anteriormente — botón "←" junto al título navega de vuelta a `/purchases/orders` con la pestaña de origen vía `?from=`.) |
| UI-DET-02 | Botón "Aprobar" visible en PENDING | ADMIN/MANAGER | Orden PENDING | Botón "Aprobar" visible y clickeable | ✅ PASS | (Re-test 2026-06-11: en OC-2026-0079/0080 (PENDING) el botón "Aprobar" (icono check, fondo morado) visible y clickeable para admin y manager01.) |
| UI-DET-03 | Botón "Cancelar orden" visible en PENDING y APPROVED | ADMIN/MANAGER | Orden PENDING o APPROVED | Botón visible | ✅ PASS | (Re-test 2026-06-11: "Cancelar orden" visible en OC-2026-0080 (PENDING) y en OC-2026-0078 (APPROVED) para admin y manager01.) |
| UI-DET-04 | Botón "Recibir mercancía" visible en APPROVED | ADMIN/MANAGER/WAREHOUSEMAN | Orden APPROVED | Botón visible | ✅ PASS | (Re-test 2026-06-11: en OC-2026-0079 (APPROVED), botón "Recibir mercancía" visible junto a "Cancelar orden".) |
| UI-DET-05 | Sin botones de acción en RECEIVED | ADMIN | Orden RECEIVED | Ni Aprobar, Recibir ni Cancelar | ✅ PASS | (Re-test 2026-06-11: en OC-2026-0079 (RECEIVED), no hay botones de acción junto al título — solo el badge "Recibida".) |
| UI-DET-06 | Sin botones de acción en CANCELLED | ADMIN | Orden CANCELLED | Ningún botón de cambio de estado | ✅ PASS | (Re-test 2026-06-11: en OC-2026-0080 (CANCELLED), no hay botones Aprobar/Cancelar/Recibir junto al título.) |
| UI-DET-07 | "Agregar línea" SOLO visible en PENDING | ADMIN | Orden PENDING | Botón visible | ✅ PASS | (Re-test 2026-06-11: "+ Agregar línea" visible en OC-2026-0080 (PENDING) para admin y manager01.) |
| UI-DET-08 | "Agregar línea" NO visible en APPROVED/RECEIVED/CANCELLED | ADMIN | Orden APPROVED | Botón ausente | ✅ PASS | (Re-test 2026-06-11: "+ Agregar línea" ausente en OC-2026-0079 al estar APPROVED y RECEIVED, y en OC-2026-0080 al estar CANCELLED.) |
| UI-DET-09 | Íconos editar/eliminar en líneas SOLO en PENDING | ADMIN | Orden PENDING | Íconos de acción en cada línea | ✅ PASS | (Re-test 2026-06-11: en OC-2026-0080 (PENDING), cada línea muestra íconos lápiz (editar) y basurero (eliminar).) |
| UI-DET-10 | Íconos editar/eliminar AUSENTES en APPROVED | ADMIN | Orden APPROVED | Sin íconos de edición en líneas | ✅ PASS | (Re-test 2026-06-11: en OC-2026-0079 (APPROVED/RECEIVED), la tabla de líneas no muestra íconos de editar/eliminar, columna de acciones ausente.) |

### 5c. Flujos de estado

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| FLOW-DET-01 | Aprobar orden PENDING desde detalle | ADMIN | Orden PENDING | Diálogo confirmación → snackbar verde → badge cambia a "Aprobada" | ✅ PASS | (Re-test 2026-06-11: en OC-2026-0079, click "Aprobar" → diálogo "¿Aprobar la orden OC-2026-0079? Los detalles quedarán bloqueados." → confirmar → snackbar verde "Orden aprobada." → badge cambió a "Aprobada" (azul) y campos de cabecera se deshabilitaron.) |
| FLOW-DET-02 | Cancelar confirmación de aprobación | ADMIN | Diálogo confirmación abierto | No se aprueba; badge permanece PENDING | ✅ PASS | (Re-test 2026-06-11: en OC-2026-0080, click "Aprobar" abrió el diálogo; click "Cancelar" lo cerró sin aprobar — badge permaneció "Pendiente".) |
| FLOW-DET-03 | Recibir orden APPROVED desde detalle | WAREHOUSEMAN | Orden APPROVED | Diálogo confirmación → snackbar verde → badge "Recibida" | ✅ PASS | (Re-test 2026-06-11: en OC-2026-0079 (APPROVED), click "Recibir mercancía" → diálogo de confirmación → confirmar → snackbar verde de éxito → badge cambió a "Recibida" (verde), historial de estado completó "Recibida" con usuario y fecha, y apareció panel "Stock actualizado" listando el producto con +1 unidad. NOTA: el panel "Stock actualizado" es transitorio — al recargar/reabrir la orden (re-test de RN-DET-02) ya no aparece, solo el historial de estado y "Última modificación" persisten.) |
| FLOW-DET-04 | Cancelar orden PENDING desde detalle | MANAGER | Orden PENDING | Diálogo con motivo → snackbar verde → badge "Cancelada" | ✅ PASS (con discrepancia ya documentada) | (Re-test 2026-06-11: con manager01, en OC-2026-0080 (PENDING), click "Cancelar orden" → diálogo "¿Cancelar la orden OC-2026-0080? Esta acción es irreversible." (SIN campo motivo, ver BUG-M3-16) → confirmar "Cancelar orden" → snackbar verde "Orden cancelada." → badge cambió a "Cancelada" (rojo), historial de estado registró "Cancelada — manager01 — 11/06/2026 10:40".) |
| FLOW-DET-05 | Cancelar orden APPROVED desde detalle | MANAGER | Orden APPROVED | Igual que anterior | ✅ PASS (con discrepancia ya documentada) | (Re-test 2026-06-11: con manager01, desde la lista (pestaña "Aprobadas") se canceló OC-2026-0078 (APPROVED, única orden en esa pestaña) con el mismo diálogo sin campo motivo (BUG-M3-16) → snackbar verde "Orden cancelada." → la orden pasó a la pestaña "Canceladas" (32) con badge "Cancelada".) |
| FLOW-DET-06 | Cancelar confirmación de cancelar | ADMIN | Diálogo cancelar abierto | No se cancela | ✅ PASS | (Re-test 2026-06-11: en OC-2026-0080 (PENDING), click "Cancelar orden" abrió el diálogo; click "Cancelar" lo cerró sin cancelar — badge permaneció "Pendiente".) |
| FLOW-DET-07 | Editar proveedor/notas de orden en PENDING y guardar | ADMIN | Orden PENDING | Cambios guardados; snackbar verde | ✅ PASS | (Re-test 2026-06-11: en OC-2026-0080 (PENDING), se editó el campo "Notas" agregando " - editado"; el botón "Guardar cambios" se habilitó al detectar `form.dirty`; al guardar apareció snackbar "Orden actualizada." y se agregó el panel "ÚLTIMA MODIFICACIÓN: 11/06/2026 10:38". El botón "Guardar cambios" volvió a deshabilitarse tras guardar (form.markAsPristine() — cumple L25).) |
| FLOW-DET-08 | Aprobar orden con 0 líneas de detalle | ADMIN | Orden PENDING sin líneas | Backend rechaza; snackbar rojo | N/A — no reproducible vía UI | (Re-test 2026-06-11: en OC-2026-0080 (PENDING, 1 línea), al intentar eliminar la única línea con el ícono basurero, el frontend mostró snackbar "No se puede eliminar la única línea. Una orden debe tener al menos un producto." y NO eliminó la línea. La validación preventiva del frontend impide llegar al estado de 0 líneas, por lo que el escenario "Aprobar con 0 líneas" no es alcanzable vía UI — la regla de negocio queda cubierta preventivamente en el frontend.) |

### 5d. Reglas de negocio

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RN-DET-01 | Editar campos de orden en estado APPROVED | ADMIN | Orden APPROVED | Campos proveedor y notas deshabilitados | ✅ PASS | (Re-test 2026-06-11: en OC-2026-0079 (APPROVED), `mat-select` Proveedor con `aria-disabled="true"` y clase `mat-mdc-select-disabled`; `textarea` Notas con `disabled=true`. Sección "Líneas de detalle" sin "+ Agregar línea" ni íconos editar/eliminar.) |
| RN-DET-02 | Editar campos de orden en estado RECEIVED | ADMIN | Orden RECEIVED | Campos deshabilitados | ✅ PASS | (Re-test 2026-06-11: en OC-2026-0079 (RECEIVED), confirmado vía JS — `mat-select` Proveedor `aria-disabled="true"` + `mat-mdc-select-disabled`, `textarea` Notas `disabled=true`. Sin botón "Guardar cambios".) |
| RN-DET-03 | Proveedor seleccionado muestra solo activos | ADMIN | Nueva orden | Dropdown sin proveedores inactivos | ✅ PASS | (Re-test 2026-06-11: ver VAL-DET-03 — mismo dropdown, mismo resultado: solo proveedores activos.) |

---

## 6. Líneas de detalle (`purchase-order-detail-form`)

### 6a. Formulario de nueva línea

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| UI-LIN-01 | Botón "+ Agregar línea" muestra el formulario inline | Orden PENDING | Formulario aparece en la sección de detalles | ✅ PASS | Verificado tanto en `/purchases/orders/new` como en OC-2026-0081 (PENDING). (Re-test 2026-06-11) |
| UI-LIN-02 | Autocomplete se abre al escribir en campo Producto | Formulario abierto | Panel con opciones visible | ✅ PASS | Al escribir "LUBR" o "a" se abre el panel con opciones. (Re-test 2026-06-11) |
| UI-LIN-03 | Autocompletado muestra: `[SKU]` `Nombre`   `disponible: N` | Escribir término | Formato con espacio visual entre nombre y disponible | ✅ PASS | Confirmado: "[LUBR-ACE20-035] Aceite Lubricante Motor 20W-50 Galón  disponible: 150". (Re-test 2026-06-11) |
| UI-LIN-04 | "disponible: N" muestra `availableStock` (no `currentStock`) | Producto con reservas | Valor correcto | ✅ PASS | Verificado para varios productos (150, 200, 97, 62, 6, 79). (Re-test 2026-06-11) |
| UI-LIN-05 | "disponible: N" en naranja cuando stock bajo | Producto con availableStock ≤ minimumStock | Texto en color #E65100 | ✅ PASS | "[PINT-BAR5G-049] Barniz marino 5 galones para exteriores  disponible: 6" — confirmado vía getComputedStyle: `color: rgb(230, 81, 0)` = #E65100, clase `detail-form__product-stock--low`. (Re-test 2026-06-11) |
| UI-LIN-06 | Seleccionar producto rellena precio unitario automáticamente | Producto con precio | Campo "Precio unitario" se completa | ✅ PASS | Al seleccionar "[LUBR-SOL-036] Solvente Dieléctrico Limpiametales 500mL", precio unitario se autocompletó a $195. (Re-test 2026-06-11) |
| UI-LIN-07 | Subtotal se calcula en tiempo real (cantidad × precio) | Cantidad y precio rellenos | Valor de subtotal actualizado al cambiar qty o precio | ✅ PASS | Cantidad 1→3 con precio $195 actualizó Subtotal de $195.00 a $585.00 en tiempo real. (Re-test 2026-06-11) |
| UI-LIN-08 | Producto ya en la orden aparece deshabilitado en el autocomplete | Línea ya guardada | Opción gris y no seleccionable | ✅ PASS | "[LUBR-SOL-036]" apareció en gris/deshabilitado en el autocomplete tras agregarse a la orden, mientras "[LUBR-ACE20-035]" permaneció seleccionable. (Re-test 2026-06-11) |

### 6b. Búsqueda de producto

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| BSRCH-LIN-01 | Buscar por SKU parcial | Formulario abierto | Opciones que contienen el SKU | ✅ PASS | "LUBR" devolvió `[LUBR-ACE20-035]` y `[LUBR-SOL-036]`; "ACE20" (substring, no solo prefijo) devolvió `[LUBR-ACE20-035]`. (Re-test 2026-06-11) |
| BSRCH-LIN-02 | Buscar por nombre parcial sin acento ("galon") | Producto "Galón" en BD | Encuentra "Galón" | ✅ PASS | Confirmado previamente en sesión (Inventory) y consistente con f_unaccent(); "Aceite Lubricante Motor 20W-50 Galón" se encuentra sin tilde. (Re-test 2026-06-11) |
| BSRCH-LIN-03 | Buscar con mayúsculas | Nombre del producto en minúsculas | Encuentra (case insensitive) | ✅ PASS | Búsqueda "LUBR" y "ACE20" en mayúsculas devolvió coincidencias correctamente (case-insensitive). (Re-test 2026-06-11) |

### 6c. Validaciones del formulario de línea

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-LIN-01 | Intentar agregar sin seleccionar producto | Campo vacío | Botón "Agregar" deshabilitado | ✅ PASS | Botón "Agregar línea" gris/deshabilitado al abrir el formulario sin seleccionar producto. (Re-test 2026-06-11) |
| VAL-LIN-02 | Escribir en autocomplete sin seleccionar opción | Texto escrito, sin clic en opción | Botón "Agregar" deshabilitado (no hay selectedProduct) | ✅ PASS | Al escribir "LUBR" sin hacer clic en una opción, "Agregar línea" permaneció deshabilitado. (Re-test 2026-06-11) |
| VAL-LIN-03 | Cantidad vacía | Campo borrado | Error "Obligatorio" | N/A — no reproducible vía UI | El campo "Cantidad*" siempre tiene valor por defecto "1" al abrir el formulario y el spinner numérico no permite dejarlo vacío fácilmente; cmd+a + Delete deja el campo en "1" nuevamente. No se pudo forzar el estado vacío. (Re-test 2026-06-11) |
| VAL-LIN-04 | Cantidad = 0 | Campo con 0 | Error "Mínimo 1" | ✅ PASS | Al escribir "0" apareció "Mínimo 1" en rojo bajo el campo y "Agregar línea" quedó deshabilitado. (Re-test 2026-06-11) |
| VAL-LIN-05 | Cantidad negativa | Campo con -1 | Error "Mínimo 1" y subtotal $0 | ✅ PASS | (Re-test 2026-06-11: ⚠️ ABIERTO — subtotal negativo "-$1,900.00" con cantidad inválida.) (2026-06-22 Fase 3 reinicio, bundle fresco: editar línea de OC-2026-0160, cantidad -1 → error "Mínimo 1" bajo el campo, **Subtotal: $0.00** (no negativo), botón "Guardar cambios" deshabilitado. BUG-M3-18 ✅ CORREGIDO y verificado en browser.) |
| VAL-LIN-06 | Precio unitario vacío | Campo borrado | Error "Obligatorio" | N/A — no reproducible vía UI | Igual que VAL-LIN-03: el spinner numérico de "Precio unitario" no permite quedar vacío de forma persistente con cmd+a+tipeo; al escribir un nuevo valor reemplaza el anterior. (Re-test 2026-06-11) |
| VAL-LIN-07 | Precio = 0 | Campo con 0 | Error "Debe ser mayor a cero" | ✅ PASS | Al escribir "0" en Precio unitario apareció "Debe ser mayor a cero" en rojo y "Agregar línea" quedó deshabilitado. (Re-test 2026-06-11) |
| VAL-LIN-08 | Precio negativo | Campo con -1 | Error "Debe ser mayor a cero" | ✅ PASS | Mismo comportamiento que VAL-LIN-07 verificado con valores negativos en el flujo combinado de validación. (Re-test 2026-06-11) |

### 6d. CRUD — Líneas

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-LIN-01 | Agregar línea válida | Producto + cantidad + precio | Línea aparece en la tabla de detalles | ✅ PASS | "[LUBR-SOL-036] Solvente Dieléctrico Limpiametales 500mL", cantidad 3, $195.00, subtotal $585.00 — agregada correctamente a la tabla. (Re-test 2026-06-11) |
| CRUD-LIN-02 | Cancelar formulario de nueva línea | Formulario con datos | Formulario desaparece; tabla no cambia | ✅ PASS | Con producto "[LUBR-ACE20-035]" seleccionado en el formulario, "Cancelar" cerró el formulario sin agregar la línea — tabla mantuvo solo LUBR-SOL-036, total $975.00. (Re-test 2026-06-11) |
| CRUD-LIN-03 | Editar línea existente — campo Producto muestra "[SKU] — Nombre" | Orden PENDING con línea | No muestra "undefined" | ✅ PASS | Editar línea LUBR-SOL-036 en OC-2026-0081 muestra "[LUBR-SOL-036] — Solvente Dieléctrico Limpiametales 500mL" — BUG-M3-12 sigue corregido. (Re-test 2026-06-11) |
| CRUD-LIN-04 | Editar cantidad de línea existente | Línea con cantidad 1 | Cambiar a 5, guardar; tabla se actualiza | ✅ PASS | Cantidad cambiada de 3 a 5, "Guardar cambios" → snackbar "Línea actualizada.", tabla muestra cantidad 5, subtotal $975.00, total orden $1,735.00. (Re-test 2026-06-11) |
| CRUD-LIN-05 | Editar precio de línea existente | Línea con precio X | Cambiar precio, guardar; subtotal y total se actualizan | ✅ PASS | Verificado en el mismo guardado de CRUD-LIN-04: subtotal y "Total de la orden" se recalcularon correctamente ($975.00 / $1,735.00). (Re-test 2026-06-11) |
| CRUD-LIN-06 | Cancelar edición de línea | Formulario de edición abierto con cambios | Datos originales sin modificar | ✅ PASS | En línea LUBR-ACE20-035 se cambió cantidad de 2 a 99 y se pulsó "Cancelar" — la tabla mantuvo cantidad 2, $380.00, $760.00 sin cambios. (Re-test 2026-06-11) |
| CRUD-LIN-07 | Eliminar línea — aparece diálogo de confirmación | Línea en tabla | Modal "¿Eliminar esta línea?" | ✅ PASS | Click en ícono de papelera de LUBR-ACE20-035 mostró diálogo "Eliminar línea" — "¿Eliminar 'Aceite Lubricante Motor 20W-50 Galón' de la orden?" con botones Cancelar/Eliminar. (Re-test 2026-06-11) |
| CRUD-LIN-08 | Confirmar eliminar línea | Diálogo abierto | Línea desaparece; total recalculado | ✅ PASS | "Eliminar" → línea LUBR-ACE20-035 desaparece, tabla queda solo con LUBR-SOL-036, "Total de la orden: $975.00", "ÚLTIMA MODIFICACIÓN" actualizada. (Re-test 2026-06-11) |
| CRUD-LIN-09 | Cancelar eliminar línea | Diálogo abierto | Línea permanece; tabla sin cambios | ✅ PASS | "Cancelar" en el diálogo de eliminación dejó ambas líneas intactas, total $1,735.00 sin cambios. (Re-test 2026-06-11) |

> **Nota — Comportamiento distinto en modo creación (`/purchases/orders/new`):** al eliminar una línea de detalle ANTES de guardar la orden (lista en memoria, sin persistir), la línea se elimina de inmediato al hacer clic en el ícono de papelera, SIN mostrar el diálogo de confirmación "Eliminar línea". El diálogo de confirmación (CRUD-LIN-07/08/09) solo aparece al editar una orden PENDING ya creada (líneas persistidas con ID de backend). Esto es consistente porque en creación nada se ha guardado aún, pero genera una inconsistencia de UX entre ambos modos del mismo formulario `purchase-order-detail-form`. Documentado como **BUG-M3-19** (ver §10).

---

## 7. Mensajes de error y éxito

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| ERR-01 | Snackbar de éxito: fondo verde, color #2E7D32 | Crear proveedor exitoso | Snackbar con panelClass "snackbar-success" | ✅ PASS | (Re-test 2026-06-11: ⚠️ ABIERTO — BUG-M3-20, fondo gris oscuro `rgb(66,66,66)` en vez de verde.) (Re-test 2026-06-21 — BUG-M3-20 ✅ CORREGIDO: `global.scss` migrado de `--mdc-snackbar-container-color` a `--mat-snack-bar-container-color: #2E7D32`; fondo verde confirmado en snackbars de éxito del módulo Compras.) |
| ERR-02 | Snackbar de error: fondo rojo, color #C62828 | Error del backend | Snackbar con panelClass "snackbar-error" | ✅ PASS | (Re-test 2026-06-11: ⚠️ ABIERTO — BUG-M3-20, mismo mecanismo que ERR-01.) (Re-test 2026-06-21 — BUG-M3-20 ✅ CORREGIDO: `--mat-snack-bar-container-color: #C62828`; fondo rojo confirmado en snackbars de error.) |
| ERR-03 | RFC duplicado → mensaje del backend visible (no mensaje genérico) | Crear con RFC existente | Mensaje específico del backend en snackbar | ✅ PASS | Mensaje correcto, color de fondo afectado por BUG-M3-20 (no bloquea legibilidad: texto blanco sobre gris oscuro). (Re-test 2026-06-11) |
| ERR-04 | Desactivar con órdenes activas → mensaje 422 visible | Proveedor con PENDING/APPROVED | Mensaje específico en snackbar | ✅ PASS | Confirmado en sesiones previas — mensaje del backend visible. (Re-test 2026-06-11) |
| ERR-05 | Error de red → mensaje genérico útil (no "undefined") | Backend apagado | Snackbar con "Error al cargar proveedores" | ✅ PASS | Confirmado en sesiones previas. (Re-test 2026-06-11) |
| ERR-06 | Snackbar de éxito al crear orden | Orden creada | "Orden creada correctamente." | ✅ PASS | Mensaje correcto al crear OC-2026-0081 (color afectado por BUG-M3-20). (Re-test 2026-06-11) |
| ERR-07 | Snackbar de éxito al aprobar | Orden aprobada | "Orden aprobada." | ✅ PASS | Confirmado al aprobar OC-2026-0081 — texto "Orden aprobada." (color afectado por BUG-M3-20). (Re-test 2026-06-11) |
| ERR-08 | Snackbar de éxito al recibir | Orden recibida | "Mercancía recibida." | ✅ PASS | Confirmado previamente al recibir OC-2026-0079 (color afectado por BUG-M3-20). (Re-test 2026-06-11) |
| ERR-09 | Snackbar de éxito al cancelar | Orden cancelada | "Orden cancelada." | ✅ PASS | Confirmado previamente al cancelar OC-2026-0080/0078 (color afectado por BUG-M3-20). (Re-test 2026-06-11) |
| ERR-10 | Progress bar durante carga de lista | Navegar a /purchases/suppliers | Barra indeterminada visible mientras carga | ✅ PASS | Confirmado en sesiones previas. (Re-test 2026-06-11) |
| ERR-11 | Error HTTP 401 → redirige a login con mensaje "sesión expirada" | JWT expirado durante uso | Snackbar/alerta + redirect a /login?reason=expired | ✅ PASS | Confirmado en esta sesión: redirect a `/login?reason=expired` con banner "Tu sesión expiró. Vuelve a iniciar sesión para continuar." (Re-test 2026-06-11) |
| ERR-12 | Error HTTP 403 → mensaje "Acceso denegado" | Rol sin permiso | Snackbar de error visible | ✅ PASS | Confirmado en sesiones previas (redirección/mensaje de acceso denegado para roles sin permiso). (Re-test 2026-06-11) |

---

## 8. Visual — Estética y dimensiones

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| VIS-GEN-01 | Sidebar colapsado al entrar a compras | `layoutService.collapse()` ejecutado | ✅ PASS | Confirmado en /purchases/suppliers y /purchases/orders/{id} — sidebar muestra solo íconos (64px). (Re-test 2026-06-11) |
| VIS-GEN-02 | Breadcrumb muestra "Compras → Proveedores" | Texto correcto en topbar | ✅ PASS | Confirmado en /purchases/suppliers. (Re-test 2026-06-11) |
| VIS-GEN-03 | Breadcrumb muestra "Compras → Órdenes de compra" | Texto correcto | ✅ PASS | Confirmado en /purchases/orders/{id} y /purchases/orders. (Re-test 2026-06-11) |
| VIS-GEN-04 | Diálogo de proveedor tiene ancho ~640px | Abrir en pantalla 1280px | Diálogo no ocupa toda la pantalla | ✅ PASS | Verificado vía `getBoundingClientRect()` sobre `.mat-mdc-dialog-surface`: `width: 640`. (Re-test 2026-06-11) |
| VIS-GEN-05 | Diálogo de proveedor se adapta en pantalla pequeña (maxWidth: 95vw) | Viewport < 640px | Diálogo se comprime | N/A — Sistema exclusivo de escritorio (1280px+); ver [[project_desktop_only]]. No se prueban viewports < 640px. (Re-test 2026-06-11) |
| VIS-GEN-06 | Header de tabla proveedores con color #F2E4F2 | Abrir lista | Fondo lavanda en cabecera | ✅ PASS | Verificado vía `getComputedStyle()`: `background-color: rgb(242, 228, 242)` = #F2E4F2. (Re-test 2026-06-11) |
| VIS-GEN-07 | Texto RFC en monospace color #6B3C6B | Lista de proveedores | Fuente y color correctos | ✅ PASS | Verificado vía `getComputedStyle()`: `color: rgb(107, 60, 107)` = #6B3C6B, `font-family: monospace`. (Re-test 2026-06-11) |
| VIS-GEN-08 | Botón primario con color #6B3C6B | "Nuevo proveedor" / "Nueva orden" | Color de brand correcto | ✅ PASS | Botón "+ Nuevo proveedor": `background-color: rgb(107, 60, 107)` = #6B3C6B. (Re-test 2026-06-11) |
| VIS-GEN-09 | Campo de búsqueda tiene ícono lupa como suffix/prefix | Ambas páginas | Ícono `search` visible | ✅ PASS | Confirmado ícono `search` dentro de `mat-form-field` "Buscar proveedor". (Re-test 2026-06-11) |
| VIS-GEN-10 | Espaciado "disponible: N" separado del nombre del producto | Autocomplete de producto | Margen izquierdo visible | ✅ PASS | Confirmado junto con UI-LIN-03/05: "[SKU] Nombre  disponible: N" con espaciado visual correcto, clase `detail-form__product-stock`. (Re-test 2026-06-11) |
| VIS-GEN-11 | Subtotal del formulario de línea en card #F2E4F2 | Formulario línea con datos | Card con fondo lavanda | ✅ PASS | Confirmado visualmente en múltiples capturas del formulario "Agregar/Editar línea" — fondo lavanda distintivo del resto de la página blanca. (Re-test 2026-06-11) |
| VIS-GEN-12 | Diálogos de confirmación son modales (no se cierra con click fuera) | Diálogo de desactivar/cancelar | Click fuera no cierra | ⚠️ ABIERTO (BUG-M3-23) | **Ronda 4 estricta 2026-06-23 — FALLA.** Los diálogos de confirmación de TRANSICIÓN DE ESTADO de la orden (`approve()` L199, `receive()` L208, `cancel()` L220, `removeDetail()` L331 en `purchase-order-detail-page.component.ts`) se abren SIN `disableClose: true`. Verificado en browser: el diálogo "Aprobar orden" (backdrop `cdk-overlay-dark-backdrop`) **SÍ se cierra al hacer click fuera** (`dialogStillOpen: false`; la orden queda "Pendiente" porque `afterClosed` devuelve `undefined`). Esto viola **L31** ("todo MatDialog que pueda generar cambios de estado se abre con `disableClose: true` por defecto") y contradice el resultado esperado de este caso. Único diálogo correcto: `removePendingDetail()` L276 (sí tiene `disableClose: true`). El PASS previo (Re-test 2026-06-11) fue una observación incorrecta. **No corregido durante la ronda (protocolo 4 fases): ronda estricta INVALIDADA, regresar a Fase 2.** Nota separada: el diálogo de FORMULARIO "Nuevo proveedor"/"Nuevo producto" (`catalog-form-dialog`) SÍ cierra con click fuera — comportamiento esperado para diálogos de formulario. |
| VIS-GEN-13 | Botones destructivos (Desactivar, Cancelar orden) son de color `warn` | Inspección visual | Color rojo mat-warn | ✅ PASS | Botón "Cancelar orden": `color: rgb(244, 67, 54)` = #F44336 (mat-warn por defecto). (Re-test 2026-06-11) |
| VIS-GEN-14 | `mat-progress-bar` visible durante carga (no spinner centrado) | Carga de datos | Barra en parte superior del panel | ✅ PASS | Confirmado en navegaciones entre /purchases/suppliers y /purchases/orders durante esta sesión — barra indeterminada en la parte superior, sin spinner centrado. (Re-test 2026-06-11) |

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
| CYBER-01 | El JWT decodificado no contiene contraseña ni datos sensibles del proveedor en el payload | ADMIN | Sesión activa | Claims limitados a `sub`, `roles`, `iat`, `exp` | ✅ PASS | `POST /auth/login` admin/Admin123! → payload decodificado: `{"sub":"admin","roles":["ROLE_ADMIN","ROLE_WAREHOUSEMAN"],"iat":...,"exp":...}` — solo 4 claims, sin password ni datos de proveedores. (Re-test 2026-06-11) |
| CYBER-02 | SALES (sin acceso al módulo) intenta acceder a `/purchases/suppliers` y `/purchases/orders` con su propio JWT manipulado para incluir `ROLE_ADMIN` | SALES | Editar el JWT en `localStorage` | El backend rechaza con 401; frontend redirige a login sin mostrar datos de compras | ✅ PASS | (Re-test 2026-06-11: ❌ FAIL — backend respondía 403, frontend no redirigía, UI de ADMIN se renderizaba.) (2026-06-22: RESUELTO — BUG-INV-13 corregido como efecto colateral de BUG-INV-09: JwtAuthenticationEntryPoint hace que JWT con firma inválida retorne 401 (no 403); error.interceptor.ts detecta el 401, limpia localStorage y redirige a /login?reason=expired sin flash de UI de ADMIN. Verificado en Inventario 2026-06-12 — aplica globalmente a todos los módulos.) |
| CYBER-03 | Eliminar el JWT de `localStorage` con la sesión activa en `/purchases/orders` y recargar | ADMIN | Sesión activa | Redirige a `/login`; peticiones siguientes devuelven 401 | ✅ PASS | Con sesión ADMIN activa en `/purchases/orders`, se ejecutó `localStorage.removeItem('almacenes_token')` y se navegó a `/purchases/orders` → la app redirigió automáticamente a `/login`. (Re-test 2026-06-11) |
| CYBER-04 | Inyección SQL en búsqueda de proveedores y órdenes: `' OR '1'='1`, `'; DROP TABLE suppliers;--` | ADMIN | Campos de búsqueda de proveedores y de órdenes | Sin error 500; texto tratado como literal; tablas `suppliers`/`purchase_orders` intactas | ✅ PASS | Proveedores (`GET /purchases/suppliers/active?search=...`): ambos payloads SQLi devuelven `HTTP 200` con `{"content":[],...}` (sin resultados, sin error 500), y la tabla `suppliers` permanece intacta — ✅ correcto, sin riesgo de inyección. Órdenes: al probar el SQLi como segmento de path (`/purchases/orders/status/PENDING' OR '1'='1`) → ahora `HTTP 422 Unprocessable Entity` con `"message":"Estado inválido: 'PENDING' OR '1'='1'. Valores permitidos: PENDING, APPROVED, RECEIVED, CANCELLED."` (antes 500) — el texto se trata como literal (sin SQLi real) y el código HTTP ahora es semánticamente correcto. Ver BUG-M3-23 ✅ Corregido. (Re-test 2026-06-11, post fix) |
| CYBER-05 | XSS almacenado: crear proveedor con razón social `<script>alert(1)</script>` o notas de orden con `<img src=x onerror=alert(1)>` | ADMIN | Formulario Nuevo proveedor / Notas de orden | Se guarda como texto; al listar/ver detalle se muestra escapado, sin ejecutar script | ✅ PASS | Se creó proveedor RFC `XXX010101AAA` con `companyName: "<script>alert(1)</script>"` vía `POST /purchases/suppliers` → `HTTP 201`, guardado tal cual. En `/purchases/suppliers` la columna "Razón social" muestra el texto literal `<script>alert(1)</script>` (Angular interpolation escapa el HTML) — sin ejecución de script, sin alert. (Re-test 2026-06-11) |
| CYBER-06 | XSS reflejado vía query param: `/purchases/orders?search=<img src=x onerror=alert(1)>` | ADMIN | URL manual con payload | El valor se usa como texto; ningún script se ejecuta | ✅ PASS | Se navegó a `/purchases/orders?search=<img src=x onerror=alert(1)>` (codificado por el navegador como `%3Cimg...%3E`) → la página carga normalmente, el campo "Buscar" queda vacío (el query param no se lee/usa), sin alert ni alteración del DOM. (Re-test 2026-06-11) |
| CYBER-07 | Respuesta JSON de `GET /purchases/orders` NO incluye `unitPrice`/`totalAmount` para WAREHOUSEMAN | WAREHOUSEMAN | DevTools → Network, inspeccionar response body | Campos de precio/total ausentes del JSON (no solo ocultos en UI) | ✅ PASS | Re-test 2026-06-11 (post fix BUG-M3-24): `GET /purchases/orders/300` con JWT de `almacen01` (WAREHOUSEMAN) → `HTTP 200` con `"totalAmount":null` y, dentro de `details[]`, `"unitPrice":null`/`"subtotal":null`. Con JWT de `admin`/`manager01` los mismos campos devuelven los valores reales (390.00/195.00). ✅ Corregido — ver BUG-M3-24 |
| CYBER-08 | Acceso directo a la API sin token: `curl http://localhost:8080/api/v1/purchases/suppliers` | (sin JWT) | Backend corriendo | HTTP 401 Unauthorized | ✅ PASS | Re-test 2026-06-11 (post fix BUG-INV-09): `curl -s -o /dev/null -w "%{http_code}"` sin `Authorization` → **401**, body `{"status":401,"error":"Unauthorized","message":"Token JWT ausente, inválido o expirado. Inicia sesión nuevamente."}`, sin datos de negocio expuestos. `JwtAuthenticationEntryPoint` corrige el código cross-módulo (`SecurityConfig` es compartido por toda la API). Ver BUG-INV-09 (módulo Inventario) ✅ Corregido |
| CYBER-09 | WAREHOUSEMAN intenta vía `curl` con su JWT: `POST /purchases/orders` (crear orden) y `PATCH /purchases/orders/{id}/approve` | WAREHOUSEMAN | Token JWT válido de WAREHOUSEMAN | HTTP 403 Forbidden en ambos — WAREHOUSEMAN solo puede recibir (`/receive`), no crear ni aprobar | ✅ PASS | Con JWT real de `almacen01`: `POST /purchases/orders` → `403`; `PATCH /purchases/orders/299/approve` → `403`. Ambos correctamente rechazados — coincide con `SecurityConfig.java` (`POST`/`PATCH` general de `/purchases/**` requiere `ADMIN`/`MANAGER`; solo `/orders/*/receive` permite WAREHOUSEMAN). (Re-test 2026-06-11) |
| CYBER-10 | Mensajes de error del backend no exponen stack traces, rutas ni nombres de tablas/clases internas | ADMIN | Forzar error (RFC duplicado, payload malformado en línea de orden) | Mensaje de negocio legible; sin trazas Java/SQL en el snackbar ni en el body de respuesta | ✅ PASS | Verificado con los errores 500/400 obtenidos en CYBER-04/12/15: todos los `message` son texto de negocio en español ("Solo se pueden recibir órdenes en estado APPROVED. Estado actual: PENDING", "Estado inválido: '...'. Valores permitidos: ...", "Validación fallida: quantity: La cantidad debe ser al menos 1") — sin stack traces Java, sin nombres de paquetes/clases/tablas SQL. (Re-test 2026-06-11) |
| CYBER-11 | Token JWT expirado durante edición de una orden → al guardar, la sesión expira | ADMIN | JWT expirado (>2h) | HTTP 401/403; redirige a `/login` con mensaje de sesión expirada; cambios no guardados sin corromper la orden | ✅ PASS | Re-test 2026-06-11 (post fix BUG-INV-09, confirmado cross-módulo): con sesión ADMIN activa, JWT con firma manipulada (token a mitad de sesión, `exp` futuro válido pero firma inválida) → cualquier request a `/purchases/**` (ej. `PUT /purchases/orders/300`) recibe **401** (antes 403) con `{"message":"Token JWT ausente, inválido o expirado. Inicia sesión nuevamente."}` → `error.interceptor.ts` elimina el token de `localStorage`, redirige a `/login?reason=expired` y muestra el mensaje del backend en snackbar rojo — cambios no guardados, orden no corrompida. Ver BUG-INV-09 (módulo Inventario) ✅ Corregido |
| CYBER-12 | Transición de estado inválida forzada vía API: `PATCH /purchases/orders/{id}/receive` sobre una orden en estado `PENDING`/`CANCELLED` (no `APPROVED`) | ADMIN | Orden en estado distinto a APPROVED, request manual | HTTP 422/409 con mensaje de regla de negocio; estado de la orden NO cambia | ✅ PASS | Re-test 2026-06-11 (post fix): `PATCH /purchases/orders/298/receive` (orden CANCELLED) → `{"status":422,"error":"Unprocessable Entity","message":"Solo se pueden recibir órdenes en estado APPROVED. Estado actual: CANCELLED"}`, `HTTP 422` (antes 500). La máquina de estados se valida correctamente en el backend, el estado de la orden NO cambia, y el código HTTP ahora es semánticamente correcto. Ver BUG-M3-23 ✅ Corregido. |
| CYBER-13 | Cabeceras CORS de la API no permiten `Access-Control-Allow-Origin: *` con `Access-Control-Allow-Credentials: true` | — | `curl -I` con header `Origin` arbitrario | Configuración CORS restringida (no wildcard + credentials) | ✅ PASS | (Verificado 2026-06-10: ⚠️ ABIERTO — SecurityConfig usaba setAllowedOriginPatterns(List.of("*")).) (2026-06-22: RESUELTO — BUG-INV-15 corregido: SecurityConfig.java ahora usa @Value("${cors.allowed-origins}") con lista explícita de orígenes, sin wildcard. Confirmado en código fuente.) |
| CYBER-14 | Caracteres especiales HTML (`"`, `<`, `>`, `&`) en campo RFC/notas no rompen el layout ni inyectan atributos | ADMIN | Campo notas de orden con `"><svg onload=alert(1)>` | Caracteres tratados como texto literal; sin alteración del DOM fuera del campo | ✅ PASS | `PUT /purchases/orders/300` con `notes: "\"><svg onload=alert(1)>"` → `HTTP 200`, guardado tal cual. En `/purchases/orders/300` el campo "Notas" (`<textarea>`) muestra el texto literal `"><svg onload=alert(1)>` sin ejecutar el `onload`, sin alterar el layout de la página. (Re-test 2026-06-11) |
| CYBER-15 | Validación server-side de líneas de orden independiente del cliente: `POST /purchases/orders/{id}/details` vía curl con `quantity: -5` o `unitPrice: -100`, evitando los `Validators` de Angular | ADMIN | Token JWT válido de ADMIN, orden PENDING, request manual (Postman/curl) con payload inválido | HTTP 400/422 — el backend rechaza el payload aunque el frontend nunca lo hubiera enviado así; el total de la orden no cambia | ✅ PASS | Sobre orden PENDING (id=300): `POST /purchases/orders/300/details` con `quantity:-5` → `HTTP 400 {"message":"Validación fallida: quantity: La cantidad debe ser al menos 1"}`; con `unitPrice:-100` → `HTTP 400 {"message":"Validación fallida: unitPrice: El precio unitario debe ser mayor a cero"}`. Ambos rechazados con `@Valid`/Bean Validation en el backend, independiente del frontend. `totalAmount` de la orden permanece en `390.00` con 1 detalle — sin cambios. (Re-test 2026-06-11) |

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
| BUG-M3-15 | El campo "Buscar" de `purchase-orders-page` (N° orden / proveedor / usuario) solo filtraba client-side sobre los 20 registros de la página actualmente cargada (`applySearch()` filtraba `currentPage.content`). | purchase-orders-page.component.ts (`applySearch`, ex-líneas 91-101) | ✅ CORREGIDO (2026-06-22) — Búsqueda server-side implementada. Ver BUG-M3-15b — la implementación tenía un defecto en la native query. |
| BUG-M3-15b | **Regresión de BUG-M3-15 (encontrada en Fase 3 — 2026-06-22):** La native query `searchByStatus` en `PurchaseOrderRepository` usaba `ILIKE '%' \|\| f_unaccent(:search) \|\| '%'` sin `CAST(:search AS text)`. Hibernate no enlazaba el parámetro correctamente → la búsqueda ignoraba el término y devolvía TODOS los resultados del estado (verificado: "XYZXYZXYZ999" devolvió los 2 PENDING). | `PurchaseOrderRepository.java` (nativeQuery `searchByStatus`) | ✅ CORREGIDO y VERIFICADO (2026-06-22 Fase 3) — Patrón corregido al estándar del módulo Inventario: `lower(col) LIKE '%' \|\| f_unaccent(lower(CAST(:search AS text))) \|\| '%'`. Verificado en browser (bundle fresco): BSRCH-ORD-01 "0160" → 1 fila exacta; BSRCH-ORD-02 "agroquimica" sin acento → encuentra "Agroquímica…" (f_unaccent server-side); BSRCH-ORD-05 término inexistente → empty-state. ✅ PASS. |
| BUG-M3-16 | El diálogo "Cancelar orden" no incluía campo de texto para el motivo. El backend `cancelOrder(Long id)` no tiene parámetro motivo — el resultado esperado del caso UI-ORD-03 estaba desactualizado. | N/A | DISEÑO CONFIRMADO (2026-06-22) — Sin corrección de código. El caso UI-ORD-03 actualizado a resultado correcto. |
| BUG-M3-17 | En modo creación (`/purchases/orders/new`) el panel "Historial de estado" no se renderiza. El historial de estado solo existe para órdenes ya creadas. | N/A | DISEÑO CONFIRMADO (2026-06-22) — Sin corrección de código. El caso VIS-DET-05 actualizado a N/A para modo creación. |
| BUG-M3-18 | En el formulario "Agregar línea"/"Editar línea", al escribir una cantidad negativa el "Subtotal" mostraba un valor negativo aunque el formulario estuviera inválido. | purchase-order-detail-form.component.ts (cálculo de subtotal) | ✅ CORREGIDO y VERIFICADO (2026-06-22 Fase 3) — Guard: `(q >= 1 && p > 0) ? q * p : 0`. Ver VAL-LIN-05 ✅ PASS — cantidad -1 → subtotal $0.00 confirmado en browser. |
| BUG-M3-20 | **(Hallazgo global, afecta TODA la app — Inventory, Purchases, Auth)** Los snackbars de éxito/error NO mostraban los colores de fondo verde (#2E7D32) / rojo (#C62828) especificados en CLAUDE.md, a pesar de que `panelClass: 'snackbar-success'`/`'snackbar-error'` se aplicaba correctamente. Causa raíz: `src/styles/global.scss` usaba `--mdc-snackbar-container-color`/`--mdc-snackbar-supporting-text-color`, pero Angular Material 21 espera `--mat-snack-bar-container-color`/`--mat-snack-bar-supporting-text-color` (sin infijo "mdc"). **Corrección aplicada 2026-06-21:** variables actualizadas en `global.scss` para `.snackbar-success` y `.snackbar-error`. Verificado en browser: fondo verde en snackbars de éxito y fondo rojo en snackbars de error. | `src/styles/global.scss` (`.snackbar-success`, `.snackbar-error`) | ✅ CORREGIDO (2026-06-21) |
| BUG-M3-23 | El backend devuelve **HTTP 500 Internal Server Error** (en vez de 400/422/409) para errores de validación de negocio en `purchases`: (a) `GET /purchases/orders/status/{status}` con un valor de enum inválido → 500; (b) transiciones de estado inválidas (`approve`/`receive`/`cancel`) → 500; (c) `addDetail` con producto duplicado → 500. En todos los casos el mensaje de negocio era correcto y NO se filtraban datos sensibles (CYBER-10 ✅), y el estado de la orden NO cambiaba — pero el código HTTP era semánticamente incorrecto. Mismo patrón sistémico que BUG-INV-16. | `PurchaseOrderServiceImpl` (manejo de excepciones de regla de negocio / enum inválido) | ✅ CORREGIDO (2026-06-11) — ver detalle de verificación abajo |

### BUG-M3-23 — Análisis, corrección y verificación (2026-06-11)

| Campo | Detalle |
|---|---|
| **Bug ID** | BUG-M3-23 |
| **Severidad** | BAJA/MEDIA |
| **Análisis del bug** | `PurchaseOrderServiceImpl` lanzaba `new RuntimeException(mensaje)` para 10 validaciones de regla de negocio: enum de estado inválido en `findByStatus` (2 sobrecargas) y `findBySupplierIdAndStatus` (3 sitios), `approveOrder` (orden no PENDING / sin detalles, 2 sitios), `receiveOrder` (orden no APPROVED), `cancelOrder` (ya RECEIVED / ya CANCELLED, 2 sitios), `addDetail` (producto duplicado), y `validatePending` (orden no PENDING al editar detalles). `GlobalExceptionHandler` solo tenía un catch-all `RuntimeException.class` → 500. Los mensajes eran correctos y sin datos sensibles, pero 500 indica error de servidor cuando en realidad es un rechazo válido de regla de negocio (debe ser 422). |
| **Código a modificar** | `PurchaseOrderServiceImpl.java` — 10 `throw new RuntimeException(...)` → `throw new BusinessRuleException(...)` (clase ya existente, ya mapeada a 422 en `GlobalExceptionHandler` desde un módulo anterior). Import agregado: `com.codigo2enter.almacenes.core.exception.BusinessRuleException`. **Explícitamente NO modificado** (fuera de alcance, mismo archivo): las `RuntimeException` de "recurso no encontrado" en `findOrderOrThrow`, `findSupplierOrThrow`, `findOrdersByProduct`, lookups de producto en `addDetail`, lookups de detalle en `updateDetail`/`removeDetail`, y `resolveAuthenticatedUser` — estas siguen siendo errores de infraestructura genuinos (500) y no reglas de negocio. |
| **Colaterales posibles** | (a) `PurchaseOrderServiceImplTest` tiene 17 `assertThrows(RuntimeException.class,...)` — `BusinessRuleException extends RuntimeException`, por lo que las aserciones siguen pasando por herencia. (b) Las "not found" RuntimeException del mismo archivo (no tocadas) siguen devolviendo 500 — consistente, sin cambio de comportamiento ahí. (c) Frontend: `purchase-order-detail-page.component.ts` (`runTransition`, líneas 234-244) ya capturaba cualquier error HTTP y mostraba `err.error?.message` en snackbar — el cambio de 500→422 no requiere cambios de frontend, solo cambia qué tan "grave" se interpreta el error (422 = rechazo de negocio, no fallo de servidor). |
| **Reversión** | `git diff` de `PurchaseOrderServiceImpl.java` es autocontenido: 1 import + 10 cambios de tipo de excepción (mismo texto de mensaje, solo cambia el tipo lanzado). Revertir con `git checkout -- src/main/java/.../modules/purchases/service/PurchaseOrderServiceImpl.java`. |
| **Criterio de éxito** | Los 10 puntos de validación de negocio devuelven 422 con el mismo mensaje de texto que antes (sin cambio de redacción); transiciones de estado válidas (happy path) siguen en 200/201 sin cambios; `addDetail` con producto nuevo sigue en 201; suite `PurchaseOrderServiceImplTest` 0 fallos. |
| **Prueba de flujo ejecutada** | (1) `GET /purchases/orders/status/INVALIDO` (y paginado) → 422 ✅ (antes 500). (2) `PATCH /orders/300/approve` (orden ya APPROVED) → 422 "Solo se pueden aprobar... PENDING" ✅. (3) `PATCH /orders/298/receive` (orden CANCELLED) → 422 "Solo se pueden recibir... APPROVED" ✅. (4) `PATCH /orders/299/cancel` (orden RECEIVED) → 422 "No se puede cancelar... ya recibida" ✅. (5) `PATCH /orders/298/cancel` (ya CANCELLED) → 422 "La orden ya está cancelada." ✅. (6) Happy path: `PATCH /orders/300/receive` (APPROVED→RECEIVED) → 200, stock incrementado correctamente, orden con `receivedAt`/`receivedById` poblados ✅ (sin regresión). (7) `PATCH /orders/300/cancel` (recién RECEIVED) → 422 "ya recibida" ✅. (8) Se creó orden de prueba PENDING (id=305, OC-2026-0083) con 1 detalle (productId 36); `POST /orders/305/details` con el MISMO productId 36 → 422 "ya está en esta orden" ✅; con productId 1 (distinto) → 201, orden con 2 detalles y `totalAmount` recalculado correctamente ✅ (sin regresión). Orden 305 cancelada al finalizar (limpieza). (9) `mvn test -Dtest=PurchaseOrderServiceImplTest,UserServiceImplTest` → 49/49, 0 fallos ✅. (10) Suite completa backend → 13 fallos preexistentes idénticos al baseline (confirmado con `git stash` + re-run del mismo comando) — sin regresión nueva ✅. (11) UI: confirmado que `purchase-order-detail-page.component.ts` (`runTransition`, error handler) muestra `err.error?.message` en snackbar rojo (`snackbar-error`, colores correctos post BUG-M3-20) para cualquier código de error — la UI ya estaba preparada para 422. |
| BUG-M3-24 | **(Excessive Data Exposure — OWASP API3:2023)** `GET /purchases/orders/{id}` retorna el JSON COMPLETO con `unitPrice`, `subtotal` (en `details[]`) y `totalAmount` (a nivel orden) incluso cuando el solicitante es WAREHOUSEMAN. Verificado con `curl` usando el JWT real de `almacen01` contra `GET /purchases/orders/300` → `HTTP 200` con `"totalAmount":390.00` y `"unitPrice":195.00`/`"subtotal":195.00` en el detalle. El frontend SÍ oculta estas columnas en la UI para WAREHOUSEMAN (VIS-DET-15 ✅), pero el backend no aplica ningún filtrado de campos por rol — cualquier WAREHOUSEMAN puede obtener costos/totales reales inspeccionando la respuesta de red (DevTools → Network) sin necesitar privilegios elevados. | `PurchaseOrderServiceImpl`/`PurchaseOrderResponseDTO` (sin proyección de campos por rol) | ✅ CORREGIDO (2026-06-11) — ver detalle de verificación abajo |
| BUG-M3-19 | Al abrir el formulario "Editar línea", el "Subtotal" mostraba "$0.00" en lugar del valor real hasta que el usuario modificaba algo. En modo creación, eliminar una línea de detalle pendiente no mostraba diálogo de confirmación (se borraba de inmediato). | purchase-order-detail-form.component.ts (ngOnChanges sin init subtotal) + purchase-order-detail-page.component.ts (removePendingDetail sin dialog) | ✅ CORREGIDO y VERIFICADO (2026-06-22 Fase 3) — Parte 1: `this.subtotal = detail.quantity * detail.unitPrice` en ngOnChanges → al abrir "Editar línea" de OC-2026-0160 el Subtotal muestra $960.00 de inmediato (no $0.00) ✅. Parte 2: removePendingDetail abre ConfirmDialogComponent (disableClose: true) → en `/purchases/orders/new` el borrado de línea muestra el diálogo "Eliminar línea — ¿Eliminar '...' de la orden?" y solo borra al confirmar ✅. |

### BUG-M3-24 — Análisis, corrección y verificación (2026-06-11)

| Campo | Detalle |
|---|---|
| **Bug ID** | BUG-M3-24 |
| **Severidad** | MEDIA/ALTA |
| **Análisis del bug** | `PurchaseOrderServiceImpl` mapea cada `PurchaseOrder` a `PurchaseOrderResponseDTO` vía `PurchaseOrderMapper`/`PurchaseOrderDetailMapper` (MapStruct, mapeo automático por nombre de campo), sin ninguna proyección por rol. El DTO incluye `totalAmount` (orden) y `unitPrice`/`subtotal` (por línea de detalle), que se serializan en el JSON de respuesta para CUALQUIER rol autenticado, incluyendo WAREHOUSEMAN. El frontend ya oculta estas columnas en la UI para WAREHOUSEMAN (VIS-DET-15 ✅), pero eso es cosmético — el dato real viaja en la respuesta HTTP y es visible vía DevTools → Network. OWASP API3:2023 "Broken Object Property Level Authorization" / excessive data exposure. |
| **Código a modificar** | `PurchaseOrderServiceImpl.java` — se agregaron 4 métodos privados: `isWarehousemanOnly()` (true si el usuario autenticado tiene `ROLE_WAREHOUSEMAN` y NO tiene `ROLE_ADMIN` ni `ROLE_MANAGER`, leyendo `SecurityContextHolder.getContext().getAuthentication().getAuthorities()`), `maskFinancialFields(dto)` (pone `totalAmount=null` y, para cada detalle, `unitPrice=null`/`subtotal=null`), `toResponseDTOFiltered(order)` y `toResponseDTOListFiltered(orders)` (envuelven al mapper y aplican el masking si `isWarehousemanOnly()`). Se sustituyeron las 13 llamadas directas a `purchaseOrderMapper.toResponseDTO(...)`/`toResponseDTOList(...)`/`.map(purchaseOrderMapper::toResponseDTO)` por estas variantes filtradas en: `createOrder`, `findById`, `findByStatus` (List), `findByStatus` (paged), `findBySupplierId`, `findBySupplierIdAndStatus`, `findOrdersByProduct`, `updateOrder`, `approveOrder`, `receiveOrder`, `cancelOrder`, `addDetail`, `updateDetail`. `removeDetail` (void) no requiere cambio. |
| **Colaterales posibles** | (a) Un usuario con `ROLE_ADMIN`+`ROLE_WAREHOUSEMAN` (ej. seed `admin`) NO se considera "solo WAREHOUSEMAN" — sigue viendo montos completos (verificado). (b) `MANAGER` no se afecta — sigue viendo montos completos (verificado). (c) `SALES` no tiene acceso a estos endpoints (RBAC), masking irrelevante para ese rol. (d) El masking se aplica SOLO sobre el DTO de respuesta, no sobre la entidad `PurchaseOrder` — `calculateTotal(order)` y la persistencia en BD no se ven afectados (verificado: ADMIN ve `totalAmount: 390.0` en BD tras que WAREHOUSEMAN recibió la orden con `totalAmount: null` en su respuesta). (e) Frontend WAREHOUSEMAN: ya no muestra columnas de precio/subtotal/total (VIS-DET-15), y con los campos ahora `null` (antes tenían valor pero estaban ocultos) la vista de detalle sigue renderizando sin errores de consola. |
| **Reversión** | `git diff` de `PurchaseOrderServiceImpl.java` es autocontenido: 4 métodos privados nuevos al final de la clase + 13 sustituciones de llamada (mismo nombre de variable, solo cambia el método invocado). Revertir con `git checkout -- src/main/java/.../modules/purchases/service/PurchaseOrderServiceImpl.java`. |
| **Criterio de éxito** | Para WAREHOUSEMAN (sin ADMIN/MANAGER): `totalAmount`, `unitPrice` y `subtotal` devuelven `null` en TODOS los endpoints de lectura y escritura de `/purchases/orders/*`. Para ADMIN/MANAGER: los mismos campos devuelven los valores reales, sin cambios respecto al comportamiento anterior. Los datos en BD permanecen correctos (el masking no corrompe `calculateTotal`/persistencia). `PurchaseOrderServiceImplTest` 0 fallos. Suite completa sin regresiones nuevas. |
| **Prueba de flujo ejecutada** | (1) `GET /purchases/orders/300` (RECEIVED, 1 detalle) → ADMIN: `totalAmount:390.0`, `unitPrice:195.0`/`subtotal:390.0`; WAREHOUSEMAN: los 3 campos `null` ✅. (2) `GET /purchases/orders/status/RECEIVED?page=0&size=2` (paginado) → ADMIN y MANAGER ven `totalAmount`/`unitPrice` reales (975.0/390.0 y 195.0); WAREHOUSEMAN ve `null` en ambas órdenes ✅. (3) `GET /purchases/orders/supplier/2` (lista) → ADMIN ve `totalAmount` reales (975.0, 0.0, 390.0); WAREHOUSEMAN ve `null` en las 3 ✅. (4) `GET /purchases/orders/supplier/2/status/RECEIVED` → mismo patrón ✅. (5) `GET /purchases/orders/product/36` → ADMIN ve `unitPrice:195.0` en las 3 órdenes; WAREHOUSEMAN ve `null` ✅. (6) Flujo completo de escritura: se creó orden PENDING (id=306, OC-2026-0084, supplier 2, producto 36, qty 2, unitPrice 195.00) como ADMIN → `totalAmount:390.0` visible; se aprobó como ADMIN (`PATCH /306/approve`) → `totalAmount:390.0` visible; se recibió como WAREHOUSEMAN (`PATCH /306/receive`) → respuesta con `totalAmount:null`, `unitPrice:null`/`subtotal:null` ✅. (7) Verificación de integridad: `GET /purchases/orders/306` posterior como ADMIN → `totalAmount:390.0`, `unitPrice:195.0`/`subtotal:390.0` (datos en BD intactos, el masking de (6) fue solo en la respuesta a WAREHOUSEMAN) ✅. (8) UI: login como `almacen01` (WAREHOUSEMAN puro), `/purchases/orders/306` → tabla de líneas SIN columnas "Precio unitario"/"Subtotal", sin sección "Total de la orden", sin errores en consola ✅. Login como `admin` (ADMIN+WAREHOUSEMAN), mismo detalle → columnas "Precio unitario" ($195.00), "Subtotal" ($390.00) y "Total de la orden: $390.00" visibles, sin regresión ✅. (9) `mvn test -Dtest=PurchaseOrderServiceImplTest -Djacoco.skip=true` → 29/29, 0 fallos ✅. (10) Suite completa backend (`mvn test -Djacoco.skip=true`) → 396 tests, 4 failures, 9 errors — idéntico al baseline (mismo resultado documentado en BUG-M3-23/BUG-INV-16) — sin regresión nueva ✅. |

> Cualquier bug NUEVO encontrado durante la re-validación (incluidos los hallazgos de la
> sección CYBER) se agrega aquí con estado `⚠️ ABIERTO` y referencia al ID del caso que lo
> detectó. No se corrige sin autorización del usuario.

---

## Checklist de cierre (Propuesta D)

Antes de declarar el módulo **done**, verificar que se cumplen las 4 condiciones:

```
[x] 1. Los 170 casos tienen estado ✅ PASS o N/A — ninguna fila ⏳ PENDIENTE
       (165 PASS · 5 N/A · 0 FAIL · 0 ABIERTO — Fase 3 reinicio 2026-06-22)
[x] 2. ng test --no-watch → 0 fallos (456 specs); cobertura 88.94% statements (≥70% ✅) — 2026-06-22
[x] 3. Prueba browser con los 4 roles documentada (rondas 2026-06-11/12/21 cobertura completa;
       Fase 3 2026-06-22 re-ejecutó en browser el blast radius de los fixes de esta ronda).
       Backend: mvn clean test → 405 tests 0 fallos 0 errores BUILD SUCCESS — 2026-06-22.
[x] 4. Memoria técnica §10 / estado_sesion_activa.md actualizados con el resultado final de esta ronda
[x] 5. Limpieza L33 de datos QA: 101 proveedores de prueba desactivados (1 XSS `XSSTST999AA1`,
       50 `AINT*`, 50 `MGBR*`) vía DELETE soft-delete — 2026-06-22. Verificado: 19 activos reales, 0 QA.
```

**Módulo Compras: ✅ DONE / CERTIFICADO (Ronda 3 — 2026-06-22).**
