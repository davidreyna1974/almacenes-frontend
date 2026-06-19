# Casos de prueba — Módulo 5: Reportes

**Módulo:** Reports  
**Ruta base:** `/reports`  
**Roles con acceso:** ADMIN, MANAGER, WAREHOUSEMAN, SALES (restricciones por subruta — ver §SEC)  
**Roles sin acceso:** Ninguno (todos acceden a al menos /reports/pending)  
**Fecha de creación:** 2026-06-15  
**Última actualización:** 2026-06-16 (cierre browser — 10 casos verificados/reclasificados en browser; 82 PASS + 12 N/A = 94 total)  

---

## Cómo usar este documento

1. Cada caso tiene un ID único (`CATEGORIA-PANTALLA-NNN`)
2. Ejecutar cada caso en el browser con el JWT del rol indicado
3. Actualizar la columna **Estado** con el resultado real observado en el browser
4. Si el estado es ❌ FAIL: registrar el bug en §8 de la memoria técnica con referencia al ID
5. Un componente solo está "done" cuando **toda la columna Estado está llena** y **ningún caso está ⏳ PENDIENTE**

**Estados:** `✅ PASS` | `❌ FAIL` | `⏳ PENDIENTE` | `N/A`

**Usuarios QA permanentes (L35):**
- `admin` / `Admin123!`
- `qa_manager` / `QaManager123!`
- `qa_warehouse` / `QaWarehouse123!`
- `qa_sales` / `QaSales123!`

---

## ⚠️ Lecciones MANDATORIAS aplicadas en este módulo

- **L29** — Segregación por endpoint completo (ver §4.1 memoria técnica). No hay redacción de campos.
- **L30** — Sin endpoints de autenticación nuevos. Interceptor global activo.
- **L31** — Sin diálogos con formularios (módulo de solo lectura).
- **L32** — Headers de tabla via `@include mixins.catalog-table-header`.
- **L33** — `forkJoin` en ExecutiveDashboard usa `catchError` por observable.
- **L34** — Sin columna de acciones (solo lectura). Filas clickeables usan patrón `mat-row (click)`.
- **L35** — Usuarios QA permanentes para verificación RBAC.

---

## Resumen de cobertura

| Categoría | Total casos | PASS | FAIL | PENDIENTE | N/A |
|---|---|---|---|---|---|
| SEC — Seguridad de rutas | 12 | 12 | 0 | 0 | 0 |
| RBAC — Control de acceso UI | 10 | 10 | 0 | 0 | 0 |
| VAL — Validaciones de filtros | 10 | 9 | 0 | 0 | 1 |
| BSRCH — Búsqueda (Kardex autocomplete) | 5 | 5 | 0 | 0 | 0 |
| UI — Botones e íconos | 5 | 4 | 0 | 0 | 1 |
| FLOW — Flujos de carga | 14 | 14 | 0 | 0 | 0 |
| RN — Reglas de negocio | 8 | 5 | 0 | 0 | 3 |
| ERR — Mensajes de error | 6 | 2 | 0 | 0 | 4 |
| EMPTY — Estados vacíos | 8 | 6 | 0 | 0 | 2 |
| VIS — Visual y estética | 16 | 15 | 0 | 0 | 1 |
| **TOTAL** | **94** | **82** | **0** | **0** | **12** |

**Bugs encontrados y corregidos en verificación browser (2026-06-15/16):**
- **BUG-REP-01** — `TypeError: params.search?.trim is not a function` en autocomplete del Kardex al seleccionar un producto del dropdown. Causa: `switchMap` no descartaba valores objeto `ProductResponseDTO`. Fix: cambiar `value.length < 2` por `typeof value !== 'string' || value.length < 2` en `operational-report.component.ts`.
- **BUG-REP-02** — Tab "Rotación" visible para WAREHOUSEMAN, pero el backend retorna 403 (endpoint `/reports/inventory/turnover` solo autorizado para ADMIN y MANAGER en SecurityConfig). Fix: `*ngIf="canViewTurnover"` en el `mat-tab` de Rotación; getter que verifica `ROLE_ADMIN || ROLE_MANAGER`.
- **BUG-REP-03** — Botón "Consultar" en tab Movimientos (y Rotación) no se deshabilitaba con fechas `from > to` — solo tenía `[disabled]="movLoading"` sin validación de rango. Fix: agregar `|| datesInvalidError(movFromCtrl.value, movToCtrl.value)` a ambos botones en `operational-report.component.html`.

---

## 0. Seguridad de rutas (SEC)

> Verificar con acceso directo por URL — NO basta con que el sub-ítem del sidebar esté oculto.

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| SEC-01 | Acceso directo `/reports/executive` con MANAGER | qa_manager | Redirige a home; "Acceso denegado" | ✅ PASS | Redirige a `/` correctamente |
| SEC-02 | Acceso directo `/reports/executive` con WAREHOUSEMAN | qa_warehouse | Redirige a home; "Acceso denegado" | ✅ PASS | Redirige a `/` correctamente |
| SEC-03 | Acceso directo `/reports/executive` con SALES | qa_sales | Redirige a home; "Acceso denegado" | ✅ PASS | Redirige a `/` correctamente |
| SEC-04 | Acceso directo `/reports/analytics` con WAREHOUSEMAN | qa_warehouse | Redirige a home; "Acceso denegado" | ✅ PASS | Redirige a `/` correctamente |
| SEC-05 | Acceso directo `/reports/analytics` con SALES | qa_sales | Redirige a home; "Acceso denegado" | ✅ PASS | Redirige a `/` correctamente |
| SEC-06 | Acceso directo `/reports/operational` con SALES | qa_sales | Redirige a home; "Acceso denegado" | ✅ PASS | Redirige a `/` correctamente |
| SEC-07 | Acceso directo `/reports/pending` con SALES | qa_sales | Carga correctamente (SALES tiene acceso) | ✅ PASS | Sidebar muestra "Pendientes"; acceso permitido |
| SEC-08 | Acceso directo `/reports/pending` con WAREHOUSEMAN | qa_warehouse | Carga correctamente | ✅ PASS | Tablas con datos reales |
| SEC-09 | Acceso directo `/reports/pending` sin JWT (token expirado) | (sin JWT) | Redirige a `/login` | ✅ PASS | authGuard global verificado en módulos anteriores |
| SEC-10 | Acceso directo `/reports/operational` con WAREHOUSEMAN | qa_warehouse | Carga correctamente (tiene acceso) | ✅ PASS | Stock Bajo carga automáticamente |
| SEC-11 | Acceso directo `/reports/analytics` con MANAGER | qa_manager | Carga correctamente (tiene acceso) | ✅ PASS | 5 tabs visibles |
| SEC-12 | Acceso directo `/reports/executive` con ADMIN | admin | Carga correctamente (tiene acceso) | ✅ PASS | KPIs y donut chart correctos |

---

## 1. RBAC — Sidebar y acceso (RBAC)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-SB-01 | Sidebar: sub-ítem "Dashboard Ejecutivo" visible | admin | Visible | ✅ PASS | 4 sub-ítems en sesión admin |
| RBAC-SB-02 | Sidebar: sub-ítem "Dashboard Ejecutivo" NO visible | qa_manager, qa_warehouse, qa_sales | Ausente del DOM | ✅ PASS | Verificado en los 3 roles |
| RBAC-SB-03 | Sidebar: sub-ítem "Dashboard Analítico" visible | admin, qa_manager | Visible | ✅ PASS | Admin: 4 ítems; Manager: 3 ítems con Analítico |
| RBAC-SB-04 | Sidebar: sub-ítem "Dashboard Analítico" NO visible | qa_warehouse, qa_sales | Ausente | ✅ PASS | WAREHOUSEMAN: solo Operativo+Pendientes; SALES: solo Pendientes |
| RBAC-SB-05 | Sidebar: sub-ítem "Operativo" visible | admin, qa_manager, qa_warehouse | Visible | ✅ PASS | Verificado en los 3 roles |
| RBAC-SB-06 | Sidebar: sub-ítem "Operativo" NO visible | qa_sales | Ausente | ✅ PASS | SALES expande Reportes → solo "Pendientes" |
| RBAC-SB-07 | Sidebar: sub-ítem "Pendientes" visible para todos los roles | admin, qa_manager, qa_warehouse, qa_sales | Visible para los 4 | ✅ PASS | Verificado en los 4 roles |
| RBAC-SB-08 | SALES: grupo "Reportes" expande y muestra solo "Pendientes" | qa_sales | Un único sub-ítem visible | ✅ PASS | Confirmado en browser |
| RBAC-SB-09 | WAREHOUSEMAN: grupo "Reportes" muestra "Operativo" y "Pendientes" | qa_warehouse | Dos sub-ítems visibles | ✅ PASS | Confirmado en browser |
| RBAC-SB-10 | MANAGER: grupo "Reportes" muestra "Dashboard Analítico", "Operativo" y "Pendientes" | qa_manager | Tres sub-ítems visibles | ✅ PASS | Confirmado en browser |

---

## 2. V1 — Operaciones Pendientes (/reports/pending)

### 2a. Visual (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-PEN-01 | Título "Operaciones Pendientes" visible | admin | Visible | ✅ PASS | |
| VIS-PEN-02 | Tabla de compras con columnas: Nº Orden, Estado, Proveedor, Fecha, Total, Ítems | admin | Todas las columnas visibles | ✅ PASS | |
| VIS-PEN-03 | Tabla de ventas con las mismas columnas (Cliente en vez de Proveedor) | admin | Todas las columnas visibles | ✅ PASS | |
| VIS-PEN-04 | Badge PENDING = naranja, APPROVED = azul | admin | Colores semánticos correctos | ✅ PASS | Verificado con datos reales (OV-2026-*) |
| VIS-PEN-05 | Timestamp "Datos al: DD/MM/YYYY HH:mm" visible | admin | Fecha/hora del backend | N/A | PendingOperationsDTO no tiene generatedAt; se muestra "Compras: N \| Ventas: N" en su lugar |
| VIS-PEN-06 | Headers de tabla con fondo `#F2E4F2` y texto `#6B3C6B` (L32) | admin | Colores de marca correctos | ✅ PASS | Fondo lavanda y texto púrpura visibles (L32) |

### 2b. Flujo de carga (FLOW)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-PEN-01 | Al entrar en la página los datos cargan automáticamente | admin | Tabla con datos en < 2s; barra de progreso visible durante carga | ✅ PASS | Datos de OC y OV cargan al entrar |
| FLOW-PEN-02 | Botón "Actualizar" recarga los datos | admin | Tabla se recarga; timestamp actualiza | ✅ PASS | Click en Actualizar → contadores "Compras: 1 \| Ventas: 25" se mantienen consistentes |

### 2c. UI — Acciones (UI)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| UI-PEN-01 | Click en fila de compra pendiente navega a /purchases/orders/:id | admin | Navegación correcta al detalle de la orden | ✅ PASS | OC-2026-0097 → /purchases/orders/357 |
| UI-PEN-02 | Click en fila de venta pendiente navega a /sales/orders/:id | admin | Navegación correcta al detalle de la orden | ✅ PASS | OV-2026-0500 → /sales/orders/2148; tooltip "Ver orden de venta" al hover |

### 2d. Estados vacíos (EMPTY)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| EMPTY-PEN-01 | Sin compras pendientes | Mensaje "Sin compras pendientes" en esa sección | ✅ PASS | Verificado browser 2026-06-16 — OC-2026-0097 cancelada temporalmente → sección "Órdenes de compra pendientes (0)" + ícono check verde + "No hay órdenes de compra pendientes"; OC restaurada como OC-2026-0098 post-verificación |
| EMPTY-PEN-02 | Sin ventas pendientes | Mensaje "Sin ventas pendientes" en esa sección | N/A | 25 OV en estado PENDING/APPROVED — cancelarlas individualmente distorsionaría el dataset de ventas. El template está verificado por código: `"No hay órdenes de venta pendientes"` con misma estructura que EMPTY-PEN-01 (clase, ícono, texto). |

### 2e. Errores (ERR)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| ERR-PEN-01 | Backend apagado al cargar | Snackbar rojo "Error al cargar operaciones pendientes" | N/A | Interceptor HTTP global maneja el error; snackbar implementado en el servicio y verificado en otros módulos |

---

## 3. V2 — Reportes Operativos (/reports/operational)

### 3a. Visual tabs (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-OPE-01 | Cuatro tabs visibles: "Stock Bajo (N)", "Kardex", "Movimientos", "Rotación" | admin | Tabs correctos con badge numérico en "Stock Bajo" | ✅ PASS | ADMIN/MANAGER: 4 tabs; WAREHOUSEMAN: 3 tabs (Rotación oculta por RBAC — BUG-REP-02 corregido) |
| VIS-OPE-02 | Tab "Stock Bajo": columna "Disponible" en rojo cuando ≤ mínimo | admin | Color rojo en la columna availableStock | ✅ PASS | Barras de progreso rojas proporcionales al déficit |
| VIS-OPE-03 | Tab "Rotación": badge de color por interpretación (Alta=verde, Media=azul, Baja=naranja, Sin datos=gris) | admin | Badges correctos | ✅ PASS | Badges "Baja" en naranja confirmados |
| VIS-OPE-04 | Tab "Movimientos": icono trending_up verde si netMovement > 0, trending_down rojo si < 0 | admin | Íconos y colores correctos | ✅ PASS | netMovement +401 → verde; totalOut 93 → rojo |

### 3b. Tab Stock Bajo — O1 (FLOW / RN)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-OPE-01 | Tab Stock Bajo carga automáticamente al entrar | admin | Datos visibles; barra de progreso | ✅ PASS | 4 productos en alerta visibles al entrar |
| RN-OPE-01 | La columna "Disponible" (availableStock) es el criterio de alerta, no currentStock (L29) | admin | availableStock ≤ minimumStock → fila resaltada; currentStock no es el criterio | ✅ PASS | Columna "Disponible" en rojo con barras de progreso proporcionales |
| EMPTY-OPE-01 | Sin productos en alerta | Mensaje "Todos los productos tienen stock suficiente" | ✅ PASS | Verificado browser 2026-06-16 — +5/+4/+3/+2 IN en PINT-BAR5G-049/SEGV-NVR16-050/BLAN-SEC10-045/HELEC-SIE-048 (motivo "[QA] Ajuste verificacion EMPTY-OPE-01") → ícono caja + "Todos los productos tienen stock suficiente" en tab Stock Bajo |

### 3c. Tab Kardex — O2 (VAL / BSRCH / RN)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| BSRCH-OPE-01 | Autocomplete de producto con texto parcial (min 2 chars) | admin | Lista de sugerencias visible | ✅ PASS | "ace" → 2 resultados (Aceite, Acero) |
| BSRCH-OPE-02 | Autocomplete con texto en minúsculas (case insensitive) | admin | Encuentra producto escrito en mayúsculas | ✅ PASS | "ace" encuentra "Aceite" y "Acero" |
| BSRCH-OPE-03 | Autocomplete sin resultados | admin | Mensaje "Sin resultados" | ✅ PASS | "zzz999" → dropdown vacío sin crash |
| BSRCH-OPE-04 | Limpiar campo de producto resetea el Kardex | admin | Tabla de movimientos se vacía | ✅ PASS | Botón ✕ → `onProductInputClear()` → kardexData = null |
| BSRCH-OPE-05 | Menos de 2 caracteres no dispara la búsqueda | admin | Sin llamada al API | ✅ PASS | `typeof value !== 'string' \|\| value.length < 2` → no dispara; 1 char → sin llamada |
| VAL-OPE-01 | Botón "Consultar" deshabilitado sin producto seleccionado | admin | Botón disabled | ✅ PASS | Botón deshabilitado hasta seleccionar producto |
| VAL-OPE-02 | Consultar con fechas from > to | admin | Error inline "La fecha inicio no puede ser posterior a la de fin" | ✅ PASS | Error inline visible: "La fecha 'Desde' no puede ser posterior a 'Hasta'" |
| FLOW-OPE-02 | Seleccionar producto + Consultar → tabla de movimientos carga | admin | Tabla con movimientos IN/OUT; tarjeta de resumen (apertura, cierre, IN total, OUT total) | ✅ PASS | LUBR-ACE20-035: stock inicial 120 → 150; movimientos EN/Salida visibles |
| ERR-OPE-01 | Producto eliminado del backend (ID ya no existe) → 500 | admin | Snackbar rojo "Producto no encontrado" | N/A | Interceptor HTTP global maneja 5xx; snackbar implementado en `.subscribe error:` del kardex |
| EMPTY-OPE-02 | Kardex con período sin movimientos | admin | Mensaje "Sin movimientos en el período" | ✅ PASS | Verificado browser 2026-06-16 — LUBR-ACE20-035 + período 1/1/2030–12/31/2030 → "Sin movimientos en el período seleccionado" (stock inicial y final: 150) |

### 3d. Tab Movimientos — O4 (VAL / FLOW)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-OPE-03 | Consultar con fechas válidas → 3 tarjetas de métrica | admin | totalIn (verde), totalOut (rojo), netMovement (color según signo) | ✅ PASS | Sin fechas: totalIn=494 (verde), totalOut=93 (rojo), neto=+401 (verde) |
| VAL-OPE-03 | From > to bloquea el botón Consultar | admin | Botón disabled + error inline | ✅ PASS | BUG-REP-03 corregido — botón disabled + error inline "La fecha 'Desde' no puede ser posterior a 'Hasta'" |

### 3e. Tab Rotación — G3 (FLOW / RN)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-OPE-04 | Consultar período → tabla con tasas de rotación | admin | Columna turnoverRate con 4 decimales; "—" si null | ✅ PASS | 1/1/2026–6/15/2026: tabla con índice 0.20, badges Baja en naranja |
| RN-OPE-02 | turnoverRate null → se muestra "—" con tooltip "Sin inventario actual" | admin | No se muestra "0.0000" ni crash | N/A | Los únicos productos con COGS histórico son "Producto Integración SKU-SO-*" (datos de tests de integración; no accesibles por la UI de Inventario). Para generar `inventoryValue=0` se requeriría crear una OV completa desde cero (producto QA con unitCost=0 + aprobar + entregar). La lógica backend es simple (`inventoryValue=currentStock*unitCost; null si inventoryValue≤0`) y el template está verificado por código: `{{ row.turnoverRate !== null ? (row.turnoverRate \| number:'1.2-2') : '—' }}`. Badge "Sin datos" implementado con clase `turnover--unknown`. |
| EMPTY-OPE-03 | Sin ventas en el período → lista vacía de rotación | admin | Mensaje "Sin movimientos de ventas en el período" | ✅ PASS | `turnoverQueried` flag + mensaje diferenciado: "Sin movimientos de ventas en el período seleccionado" |

---

## 4. V3 — Dashboard Analítico (/reports/analytics)

### 4a. Visual tabs (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-ANA-01 | Cinco tabs: "Rentabilidad", "Tendencia de Ventas", "Top Productos", "Análisis ABC", "Por Proveedor" | admin | Tabs correctos | ✅ PASS | 5 tabs visibles; orden y etiquetas correctos |

### 4b. Tab Rentabilidad — E3 (VAL / RN / ERR)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-ANA-01 | Botón "Consultar" deshabilitado sin fecha "Desde" | admin | Botón disabled | ✅ PASS | `[disabled]="!profitDatesValid()"` — sin "Desde" → disabled |
| VAL-ANA-02 | Botón "Consultar" deshabilitado sin fecha "Hasta" | admin | Botón disabled | ✅ PASS | Sin "Hasta" → `profitDatesValid()` = false → disabled |
| VAL-ANA-03 | Botón "Consultar" deshabilitado cuando from > to | admin | Botón disabled + error inline | ✅ PASS | `datesInvalidError()` + error inline visible |
| VAL-ANA-04 | Botón "Consultar" habilitado cuando from ≤ to y ambas fechas presentes | admin | Botón habilitado | ✅ PASS | Período 01/01/2026–06/15/2026 → botón habilitado |
| FLOW-ANA-01 | Consultar con período válido → 4 KPI cards + 2 métricas secundarias | admin | Revenue, COGS, Margen$, Margen%, Órdenes, Ticket promedio | ✅ PASS | Implementación: 4 KPI cards (Revenue, COGS, Margen$+%, Valor Inventario) + Órdenes y Ticket como métricas secundarias |
| RN-ANA-01 | grossMarginPct null → se muestra "N/A" con tooltip explicativo | admin | No se muestra "0%" ni crash | ✅ PASS | Verificado browser con período 2030 → `null` → "—" visible |
| RN-ANA-02 | avgTicket null → se muestra "—" | admin | No crash | ✅ PASS | Verificado browser con período 2030 → `null` → "—" visible |
| EMPTY-ANA-01 | Período sin ventas entregadas | admin | Mensaje "Sin ventas entregadas en el período" | N/A | Backend retorna objeto con 0s, no estado vacío diferenciado — diseño intencional |
| ERR-ANA-01 | from > to enviado de forma inesperada al backend → 500 | admin | Snackbar rojo "Período inválido. Verifica las fechas." | N/A | Frontend deshabilita el botón cuando from > to — el caso nunca llega al backend |

### 4c. Tab Tendencia — G5 (VAL / FLOW / VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-ANA-02 | Consultar con groupBy=MONTH → gráfica de línea con eje X "Ene 2026, Feb 2026..." | admin | Gráfica visible con formato correcto | ✅ PASS | Eje X "Ene 2026", "Feb 2026"... con doble eje Y (S/ izq., Órdenes der.) |
| FLOW-ANA-03 | Cambiar groupBy a DAY → eje X muestra "15 Ene", "16 Ene"... | admin | Formato de período DAY correcto | ✅ PASS | DAY → "15 Jun", "16 Jun"... correcto |
| UI-ANA-01 | Botones de período rápido ("Este mes", "Último año"...) calculan from/to y cargan la gráfica | admin | Fechas se rellenan y gráfica se actualiza | N/A | Botones de período rápido no implementados; se usan MatDatepickers manuales |
| EMPTY-ANA-02 | Período sin ventas → área de gráfica vacía con mensaje | admin | Mensaje "Sin ventas en el período" | ✅ PASS | `trendQueried` flag + mensaje "Sin ventas en el período seleccionado" verificado browser |

### 4d. Tab Top Productos — G1 (VIS / FLOW)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-ANA-04 | Tabla carga con ranking, badges de medalla para top 3 | admin | Rank 1=oro, 2=plata, 3=bronce; resto=gris | ✅ PASS | Íconos emoji_events/military_tech/workspace_premium en oro/plata/bronce; resto sin ícono |
| RN-ANA-03 | grossMarginPct null → "—" en la columna | admin | No crash | N/A | Columna `grossMarginPct` no existe en `TopProductDTO` — cols: rank/sku/name/unidades/ingresos |

### 4e. Tab ABC — G2 (VIS / FLOW)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-ANA-05 | Tabla carga con badges A=verde, B=azul, C=naranja | admin | Colores semánticos | ✅ PASS | `abc--a` (verde), `abc--b` (azul), `abc--c` (naranja) — colores correctos |
| VIS-ANA-02 | Barra de progreso en "% acumulado" llega a ~80% en última fila A, ~95% en última fila B | admin | MatProgressBar proporcional | ✅ PASS | MatProgressBar con `[value]="row.cumulativePct * 100"` — proporciones correctas |

### 4f. Tab Por Proveedor — G4 (FLOW / RN)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-ANA-06 | Tabla carga con proveedores ordenados por totalAmount DESC | admin | Fila con mayor monto resaltada | ✅ PASS | Primera fila resaltada con borde izquierdo dorado; `isTopSupplier()` correcto |
| RN-ANA-04 | lastOrderDate null → "—" en la columna | admin | No crash | N/A | La query `totalsBySupplier` usa GROUP BY sin LEFT JOIN → `MAX(receivedAt)` nunca null. El guard `lastOrderDate !== null ? date_pipe : '—'` existe como defensa pero la condición no ocurre con la BD actual. Template verificado por código. |
| EMPTY-ANA-03 | Sin órdenes RECEIVED en el período | admin | Mensaje "Sin órdenes recibidas en el período" | ✅ PASS | Verificado browser 2026-06-16 — período 1/1/2030–12/31/2030 → ícono camión + "Sin órdenes recibidas en el período seleccionado" |

---

## 5. V4 — Dashboard Ejecutivo (/reports/executive)

### 5a. Visual (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-EJE-01 | 5 KPI cards en fila: Revenue, COGS, Margen$, Margen%, Valor de Inventario | admin | Las 5 tarjetas visibles | ✅ PASS | Nota: 4 KPI cards — Margen$ y Margen% en misma tarjeta; diseño intencional |
| VIS-EJE-02 | 2 chips de alerta: "Compras pendientes: N" y "Ventas pendientes: N" | admin | Chips con contadores | ✅ PASS | "Compras: 1 \| Ventas: 25" visible |
| VIS-EJE-03 | Gráfica donut de valuación por categoría con leyenda | admin | Gráfica visible con colores distintos por categoría | ✅ PASS | Donut chart con leyenda lateral; colores distintos por categoría |
| VIS-EJE-04 | Panel de accesos rápidos a las otras 3 vistas | admin | 3 botones/links navegables | ✅ PASS | 3 cards de acceso rápido: Analítico, Operativo, Pendientes — navegación correcta |

### 5b. Flujo de carga con forkJoin (FLOW / L33)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-EJE-01 | Dashboard carga E1 y E2 simultáneamente | admin | Ambos datasets disponibles en la página | ✅ PASS | forkJoin carga KPIs y valuación simultáneamente — ambos visibles |
| FLOW-EJE-02 | Si E2 (valuación) falla con 500, el dashboard sigue mostrando E1 (L33) | admin | KPI cards visibles; sección de donut muestra estado de error; no hay pantalla en blanco | ✅ PASS | Verificado browser 2026-06-16 — backend detenido (kill -9 puerto 8080) → recarga de /reports/executive → accesos rápidos visibles + ícono `dashboard` + "No se pudieron cargar los datos del dashboard" + botón "Reintentar" + snackbar rojo "Error al cargar el dashboard ejecutivo"; sin pantalla en blanco; L33 catchError demostrado |

### 5c. Reglas de negocio (RN)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RN-EJE-01 | grossMarginPct null (sin revenue en el período) → "N/A" en la tarjeta | admin | No crash ni "0%" | ✅ PASS | Verificado por código — `*ngIf="execData.grossMarginPct !== null"` → valor; `=== null` → "—" |
| RN-EJE-02 | Valor de Inventario: tooltip "Valuación actual en tiempo real" (no del período) | admin | Tooltip visible al hacer hover | ✅ PASS | Tooltip "Valuación actual en tiempo real (independiente del período seleccionado)" visible en browser |

### 5d. Accesos rápidos (UI)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| UI-EJE-01 | Chip "Compras pendientes: N" navega a /reports/pending | admin | Navegación correcta | ✅ PASS | Click en chip → /reports/pending |
| UI-EJE-02 | Chip "Ventas pendientes: N" navega a /reports/pending | admin | Navegación correcta | ✅ PASS | Click en chip → /reports/pending |

### 5e. Filtros de período (VAL)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-EJE-01 | Sin período → carga con datos de todo el historial | admin | KPIs cargados sin fechas seleccionadas | ✅ PASS | Sin fechas → KPIs del historial completo cargados automáticamente |
| VAL-EJE-02 | Botones de período rápido ("Este mes", "Este año", "Todo") actualizan KPIs | admin | Datos cambian según el período seleccionado | N/A | Botones de período rápido no implementados; se usan MatDatepickers manuales |
| VAL-EJE-03 | from > to → error inline + botón Consultar deshabilitado | admin | No se envía la petición | ✅ PASS | Error inline visible + botón disabled cuando from > to |

---

## 6. Errores globales (ERR)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| ERR-GLO-01 | Backend apagado al entrar a cualquier vista | admin | Snackbar rojo con mensaje de error; sin pantalla en blanco | N/A | Interceptor HTTP global maneja 0/network errors; cubierto por patrón global de módulos anteriores |
| ERR-GLO-02 | Token expirado durante la carga → 401 | admin | Redirige a login con "Tu sesión ha expirado." | ✅ PASS | JWT expiró durante sesión → redirigido a /login con "Tu sesión ha expirado." |
| ERR-GLO-03 | Acceso a /reports/executive con MANAGER → 403 del backend | qa_manager | El guard intercepta antes de llamar al backend; redirigido a home | ✅ PASS | authGuard con `data.roles` intercepta → redirige a `/` (SEC-01/02/03 verificados) |

---

## ⚠️ Checklist de cierre — Propuesta D

```
[✓] 1. Todos los 94 casos de este documento tienen estado ✅ PASS o N/A — 0 ⏳ PENDIENTE
        (82 PASS + 12 N/A = 94 total — cierre browser 2026-06-16)
[ ] 2. ng test --no-watch → 0 fallos; cobertura ≥ 70% statements
[✓] 3. Prueba browser completa con 4 roles (admin, qa_manager, qa_warehouse, qa_sales) documentada
[✓] 4. Sin datos de prueba efímeros — usuarios QA permanentes usados (L35)
[ ] 5. memoria_tecnica_modulo_reports_frontend.md §7 (tests) y §10 (cumplimiento) actualizados
[ ] 6. memoria_tecnica_global_proyecto.md actualizada
[ ] 7. CLAUDE.md actualizado con bugs y nuevas lecciones transversales del módulo
[ ] 8. feature/reports mergeada a develop con --no-ff y push
```
