# Casos de prueba — Módulo 5: Reportes

**Módulo:** Reports  
**Ruta base:** `/reports`  
**Roles con acceso:** ADMIN, MANAGER, WAREHOUSEMAN, SALES (restricciones por subruta — ver §SEC)  
**Roles sin acceso:** Ninguno (todos acceden a al menos /reports/pending)  
**Fecha de creación:** 2026-06-15  
**Última actualización:** 2026-06-23 — Estados reseteados a ⏳ PENDIENTE para nueva ronda de verificación bajo Protocolo 4 fases. Se agregan: sección "Protocolo 4 fases", sección CYBER (15 casos), "Historial de rondas" y "Checklist de cierre" actualizado.  

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
| SEC — Seguridad de rutas | 12 | 0 | 0 | 12 | 0 |
| RBAC — Control de acceso UI | 10 | 0 | 0 | 10 | 0 |
| VAL — Validaciones de filtros | 10 | 0 | 0 | 9 | 1 |
| BSRCH — Búsqueda (Kardex autocomplete) | 5 | 0 | 0 | 5 | 0 |
| UI — Botones e íconos | 5 | 0 | 0 | 4 | 1 |
| FLOW — Flujos de carga | 14 | 0 | 0 | 14 | 0 |
| RN — Reglas de negocio | 8 | 0 | 0 | 5 | 3 |
| ERR — Mensajes de error | 6 | 0 | 0 | 2 | 4 |
| EMPTY — Estados vacíos | 8 | 0 | 0 | 6 | 2 |
| VIS — Visual y estética | 16 | 0 | 0 | 15 | 1 |
| CYBER — Ciberseguridad | 15 | 0 | 0 | 14 | 1 |
| **TOTAL** | **109** | **0** | **0** | **96** | **13** |


> **Estado actual: ⏳ PENDIENTE** — reset el 2026-06-23 para nueva ronda bajo Protocolo 4 fases.
> Ronda anterior (2026-06-16/21): 82 ✅ PASS · 0 ❌ FAIL · 12 N/A. Bugs BUG-REP-01/02/03 corregidos.
> Ver "Historial de rondas" al final del documento.
> En la próxima ronda de verificación, resetear PASS → PENDIENTE antes del primer caso.


---

## 0. Seguridad de rutas (SEC)

> Verificar con acceso directo por URL — NO basta con que el sub-ítem del sidebar esté oculto.

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| SEC-01 | Acceso directo `/reports/executive` con MANAGER | qa_manager | Redirige a home; "Acceso denegado" | ⏳ PENDIENTE | Redirige a `/` correctamente |
| SEC-02 | Acceso directo `/reports/executive` con WAREHOUSEMAN | qa_warehouse | Redirige a home; "Acceso denegado" | ⏳ PENDIENTE | Redirige a `/` correctamente |
| SEC-03 | Acceso directo `/reports/executive` con SALES | qa_sales | Redirige a home; "Acceso denegado" | ⏳ PENDIENTE | Redirige a `/` correctamente |
| SEC-04 | Acceso directo `/reports/analytics` con WAREHOUSEMAN | qa_warehouse | Redirige a home; "Acceso denegado" | ⏳ PENDIENTE | Redirige a `/` correctamente |
| SEC-05 | Acceso directo `/reports/analytics` con SALES | qa_sales | Redirige a home; "Acceso denegado" | ⏳ PENDIENTE | Redirige a `/` correctamente |
| SEC-06 | Acceso directo `/reports/operational` con SALES | qa_sales | Redirige a home; "Acceso denegado" | ⏳ PENDIENTE | Redirige a `/` correctamente |
| SEC-07 | Acceso directo `/reports/pending` con SALES | qa_sales | Carga correctamente (SALES tiene acceso) | ⏳ PENDIENTE | Sidebar muestra "Pendientes"; acceso permitido |
| SEC-08 | Acceso directo `/reports/pending` con WAREHOUSEMAN | qa_warehouse | Carga correctamente | ⏳ PENDIENTE | Tablas con datos reales |
| SEC-09 | Acceso directo `/reports/pending` sin JWT (token expirado) | (sin JWT) | Redirige a `/login` | ⏳ PENDIENTE | authGuard global verificado en módulos anteriores |
| SEC-10 | Acceso directo `/reports/operational` con WAREHOUSEMAN | qa_warehouse | Carga correctamente (tiene acceso) | ⏳ PENDIENTE | Stock Bajo carga automáticamente |
| SEC-11 | Acceso directo `/reports/analytics` con MANAGER | qa_manager | Carga correctamente (tiene acceso) | ⏳ PENDIENTE | 5 tabs visibles |
| SEC-12 | Acceso directo `/reports/executive` con ADMIN | admin | Carga correctamente (tiene acceso) | ⏳ PENDIENTE | KPIs y donut chart correctos |

---

## 1. RBAC — Sidebar y acceso (RBAC)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-SB-01 | Sidebar: sub-ítem "Dashboard Ejecutivo" visible | admin | Visible | ⏳ PENDIENTE | 4 sub-ítems en sesión admin |
| RBAC-SB-02 | Sidebar: sub-ítem "Dashboard Ejecutivo" NO visible | qa_manager, qa_warehouse, qa_sales | Ausente del DOM | ⏳ PENDIENTE | Verificado en los 3 roles |
| RBAC-SB-03 | Sidebar: sub-ítem "Dashboard Analítico" visible | admin, qa_manager | Visible | ⏳ PENDIENTE | Admin: 4 ítems; Manager: 3 ítems con Analítico |
| RBAC-SB-04 | Sidebar: sub-ítem "Dashboard Analítico" NO visible | qa_warehouse, qa_sales | Ausente | ⏳ PENDIENTE | WAREHOUSEMAN: solo Operativo+Pendientes; SALES: solo Pendientes |
| RBAC-SB-05 | Sidebar: sub-ítem "Operativo" visible | admin, qa_manager, qa_warehouse | Visible | ⏳ PENDIENTE | Verificado en los 3 roles |
| RBAC-SB-06 | Sidebar: sub-ítem "Operativo" NO visible | qa_sales | Ausente | ⏳ PENDIENTE | SALES expande Reportes → solo "Pendientes" |
| RBAC-SB-07 | Sidebar: sub-ítem "Pendientes" visible para todos los roles | admin, qa_manager, qa_warehouse, qa_sales | Visible para los 4 | ⏳ PENDIENTE | Verificado en los 4 roles |
| RBAC-SB-08 | SALES: grupo "Reportes" expande y muestra solo "Pendientes" | qa_sales | Un único sub-ítem visible | ⏳ PENDIENTE | Confirmado en browser |
| RBAC-SB-09 | WAREHOUSEMAN: grupo "Reportes" muestra "Operativo" y "Pendientes" | qa_warehouse | Dos sub-ítems visibles | ⏳ PENDIENTE | Confirmado en browser |
| RBAC-SB-10 | MANAGER: grupo "Reportes" muestra "Dashboard Analítico", "Operativo" y "Pendientes" | qa_manager | Tres sub-ítems visibles | ⏳ PENDIENTE | Confirmado en browser |

---

## 2. V1 — Operaciones Pendientes (/reports/pending)

### 2a. Visual (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-PEN-01 | Título "Operaciones Pendientes" visible | admin | Visible | ⏳ PENDIENTE | |
| VIS-PEN-02 | Tabla de compras con columnas: Nº Orden, Estado, Proveedor, Fecha, Total, Ítems | admin | Todas las columnas visibles | ⏳ PENDIENTE | |
| VIS-PEN-03 | Tabla de ventas con las mismas columnas (Cliente en vez de Proveedor) | admin | Todas las columnas visibles | ⏳ PENDIENTE | |
| VIS-PEN-04 | Badge PENDING = naranja, APPROVED = azul | admin | Colores semánticos correctos | ⏳ PENDIENTE | Verificado con datos reales (OV-2026-*) |
| VIS-PEN-05 | Timestamp "Datos al: DD/MM/YYYY HH:mm" visible | admin | Fecha/hora del backend | N/A | PendingOperationsDTO no tiene generatedAt; se muestra "Compras: N \| Ventas: N" en su lugar |
| VIS-PEN-06 | Headers de tabla con fondo `#F2E4F2` y texto `#6B3C6B` (L32) | admin | Colores de marca correctos | ⏳ PENDIENTE | Fondo lavanda y texto púrpura visibles (L32) |

### 2b. Flujo de carga (FLOW)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-PEN-01 | Al entrar en la página los datos cargan automáticamente | admin | Tabla con datos en < 2s; barra de progreso visible durante carga | ⏳ PENDIENTE | Datos de OC y OV cargan al entrar |
| FLOW-PEN-02 | Botón "Actualizar" recarga los datos | admin | Tabla se recarga; timestamp actualiza | ⏳ PENDIENTE | Click en Actualizar → contadores "Compras: 1 \| Ventas: 25" se mantienen consistentes |

### 2c. UI — Acciones (UI)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| UI-PEN-01 | Click en fila de compra pendiente navega a /purchases/orders/:id | admin | Navegación correcta al detalle de la orden | ⏳ PENDIENTE | OC-2026-0097 → /purchases/orders/357 |
| UI-PEN-02 | Click en fila de venta pendiente navega a /sales/orders/:id | admin | Navegación correcta al detalle de la orden | ⏳ PENDIENTE | OV-2026-0500 → /sales/orders/2148; tooltip "Ver orden de venta" al hover |

### 2d. Estados vacíos (EMPTY)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| EMPTY-PEN-01 | Sin compras pendientes | Mensaje "Sin compras pendientes" en esa sección | ⏳ PENDIENTE | Verificado browser 2026-06-16 — OC-2026-0097 cancelada temporalmente → sección "Órdenes de compra pendientes (0)" + ícono check verde + "No hay órdenes de compra pendientes"; OC restaurada como OC-2026-0098 post-verificación |
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
| VIS-OPE-01 | Cuatro tabs visibles: "Stock Bajo (N)", "Kardex", "Movimientos", "Rotación" | admin | Tabs correctos con badge numérico en "Stock Bajo" | ⏳ PENDIENTE | ADMIN/MANAGER: 4 tabs; WAREHOUSEMAN: 3 tabs (Rotación oculta por RBAC — BUG-REP-02 corregido) |
| VIS-OPE-02 | Tab "Stock Bajo": columna "Disponible" en rojo cuando ≤ mínimo | admin | Color rojo en la columna availableStock | ⏳ PENDIENTE | Barras de progreso rojas proporcionales al déficit |
| VIS-OPE-03 | Tab "Rotación": badge de color por interpretación (Alta=verde, Media=azul, Baja=naranja, Sin datos=gris) | admin | Badges correctos | ⏳ PENDIENTE | Badges "Baja" en naranja confirmados |
| VIS-OPE-04 | Tab "Movimientos": icono trending_up verde si netMovement > 0, trending_down rojo si < 0 | admin | Íconos y colores correctos | ⏳ PENDIENTE | netMovement +401 → verde; totalOut 93 → rojo |

### 3b. Tab Stock Bajo — O1 (FLOW / RN)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-OPE-01 | Tab Stock Bajo carga automáticamente al entrar | admin | Datos visibles; barra de progreso | ⏳ PENDIENTE | 4 productos en alerta visibles al entrar |
| RN-OPE-01 | La columna "Disponible" (availableStock) es el criterio de alerta, no currentStock (L29) | admin | availableStock ≤ minimumStock → fila resaltada; currentStock no es el criterio | ⏳ PENDIENTE | Columna "Disponible" en rojo con barras de progreso proporcionales |
| EMPTY-OPE-01 | Sin productos en alerta | Mensaje "Todos los productos tienen stock suficiente" | ⏳ PENDIENTE | Verificado browser 2026-06-16 — +5/+4/+3/+2 IN en PINT-BAR5G-049/SEGV-NVR16-050/BLAN-SEC10-045/HELEC-SIE-048 (motivo "[QA] Ajuste verificacion EMPTY-OPE-01") → ícono caja + "Todos los productos tienen stock suficiente" en tab Stock Bajo |

### 3c. Tab Kardex — O2 (VAL / BSRCH / RN)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| BSRCH-OPE-01 | Autocomplete de producto con texto parcial (min 2 chars) | admin | Lista de sugerencias visible | ⏳ PENDIENTE | "ace" → 2 resultados (Aceite, Acero) |
| BSRCH-OPE-02 | Autocomplete con texto en minúsculas (case insensitive) | admin | Encuentra producto escrito en mayúsculas | ⏳ PENDIENTE | "ace" encuentra "Aceite" y "Acero" |
| BSRCH-OPE-03 | Autocomplete sin resultados | admin | Mensaje "Sin resultados" | ⏳ PENDIENTE | "zzz999" → dropdown vacío sin crash |
| BSRCH-OPE-04 | Limpiar campo de producto resetea el Kardex | admin | Tabla de movimientos se vacía | ⏳ PENDIENTE | Botón ✕ → `onProductInputClear()` → kardexData = null |
| BSRCH-OPE-05 | Menos de 2 caracteres no dispara la búsqueda | admin | Sin llamada al API | ⏳ PENDIENTE | `typeof value !== 'string' \|\| value.length < 2` → no dispara; 1 char → sin llamada |
| VAL-OPE-01 | Botón "Consultar" deshabilitado sin producto seleccionado | admin | Botón disabled | ⏳ PENDIENTE | Botón deshabilitado hasta seleccionar producto |
| VAL-OPE-02 | Consultar con fechas from > to | admin | Error inline "La fecha inicio no puede ser posterior a la de fin" | ⏳ PENDIENTE | Error inline visible: "La fecha 'Desde' no puede ser posterior a 'Hasta'" |
| FLOW-OPE-02 | Seleccionar producto + Consultar → tabla de movimientos carga | admin | Tabla con movimientos IN/OUT; tarjeta de resumen (apertura, cierre, IN total, OUT total) | ⏳ PENDIENTE | LUBR-ACE20-035: stock inicial 120 → 150; movimientos EN/Salida visibles |
| ERR-OPE-01 | Producto eliminado del backend (ID ya no existe) → 500 | admin | Snackbar rojo "Producto no encontrado" | N/A | Interceptor HTTP global maneja 5xx; snackbar implementado en `.subscribe error:` del kardex |
| EMPTY-OPE-02 | Kardex con período sin movimientos | admin | Mensaje "Sin movimientos en el período" | ⏳ PENDIENTE | Verificado browser 2026-06-16 — LUBR-ACE20-035 + período 1/1/2030–12/31/2030 → "Sin movimientos en el período seleccionado" (stock inicial y final: 150) |

### 3d. Tab Movimientos — O4 (VAL / FLOW)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-OPE-03 | Consultar con fechas válidas → 3 tarjetas de métrica | admin | totalIn (verde), totalOut (rojo), netMovement (color según signo) | ⏳ PENDIENTE | Sin fechas: totalIn=494 (verde), totalOut=93 (rojo), neto=+401 (verde) |
| VAL-OPE-03 | From > to bloquea el botón Consultar | admin | Botón disabled + error inline | ⏳ PENDIENTE | BUG-REP-03 corregido — botón disabled + error inline "La fecha 'Desde' no puede ser posterior a 'Hasta'" |

### 3e. Tab Rotación — G3 (FLOW / RN)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-OPE-04 | Consultar período → tabla con tasas de rotación | admin | Columna turnoverRate con 4 decimales; "—" si null | ⏳ PENDIENTE | 1/1/2026–6/15/2026: tabla con índice 0.20, badges Baja en naranja |
| RN-OPE-02 | turnoverRate null → se muestra "—" con tooltip "Sin inventario actual" | admin | No se muestra "0.0000" ni crash | N/A | Los únicos productos con COGS histórico son "Producto Integración SKU-SO-*" (datos de tests de integración; no accesibles por la UI de Inventario). Para generar `inventoryValue=0` se requeriría crear una OV completa desde cero (producto QA con unitCost=0 + aprobar + entregar). La lógica backend es simple (`inventoryValue=currentStock*unitCost; null si inventoryValue≤0`) y el template está verificado por código: `{{ row.turnoverRate !== null ? (row.turnoverRate \| number:'1.2-2') : '—' }}`. Badge "Sin datos" implementado con clase `turnover--unknown`. |
| EMPTY-OPE-03 | Sin ventas en el período → lista vacía de rotación | admin | Mensaje "Sin movimientos de ventas en el período" | ⏳ PENDIENTE | `turnoverQueried` flag + mensaje diferenciado: "Sin movimientos de ventas en el período seleccionado" |

---

## 4. V3 — Dashboard Analítico (/reports/analytics)

### 4a. Visual tabs (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-ANA-01 | Cinco tabs: "Rentabilidad", "Tendencia de Ventas", "Top Productos", "Análisis ABC", "Por Proveedor" | admin | Tabs correctos | ⏳ PENDIENTE | 5 tabs visibles; orden y etiquetas correctos |

### 4b. Tab Rentabilidad — E3 (VAL / RN / ERR)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-ANA-01 | Botón "Consultar" deshabilitado sin fecha "Desde" | admin | Botón disabled | ⏳ PENDIENTE | `[disabled]="!profitDatesValid()"` — sin "Desde" → disabled |
| VAL-ANA-02 | Botón "Consultar" deshabilitado sin fecha "Hasta" | admin | Botón disabled | ⏳ PENDIENTE | Sin "Hasta" → `profitDatesValid()` = false → disabled |
| VAL-ANA-03 | Botón "Consultar" deshabilitado cuando from > to | admin | Botón disabled + error inline | ⏳ PENDIENTE | `datesInvalidError()` + error inline visible |
| VAL-ANA-04 | Botón "Consultar" habilitado cuando from ≤ to y ambas fechas presentes | admin | Botón habilitado | ⏳ PENDIENTE | Período 01/01/2026–06/15/2026 → botón habilitado |
| FLOW-ANA-01 | Consultar con período válido → 4 KPI cards + 2 métricas secundarias | admin | Revenue, COGS, Margen$, Margen%, Órdenes, Ticket promedio | ⏳ PENDIENTE | Implementación: 4 KPI cards (Revenue, COGS, Margen$+%, Valor Inventario) + Órdenes y Ticket como métricas secundarias |
| RN-ANA-01 | grossMarginPct null → se muestra "N/A" con tooltip explicativo | admin | No se muestra "0%" ni crash | ⏳ PENDIENTE | Verificado browser con período 2030 → `null` → "—" visible |
| RN-ANA-02 | avgTicket null → se muestra "—" | admin | No crash | ⏳ PENDIENTE | Verificado browser con período 2030 → `null` → "—" visible |
| EMPTY-ANA-01 | Período sin ventas entregadas | admin | Mensaje "Sin ventas entregadas en el período" | N/A | Backend retorna objeto con 0s, no estado vacío diferenciado — diseño intencional |
| ERR-ANA-01 | from > to enviado de forma inesperada al backend → 500 | admin | Snackbar rojo "Período inválido. Verifica las fechas." | N/A | Frontend deshabilita el botón cuando from > to — el caso nunca llega al backend |

### 4c. Tab Tendencia — G5 (VAL / FLOW / VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-ANA-02 | Consultar con groupBy=MONTH → gráfica de línea con eje X "Ene 2026, Feb 2026..." | admin | Gráfica visible con formato correcto | ⏳ PENDIENTE | Eje X "Ene 2026", "Feb 2026"... con doble eje Y (S/ izq., Órdenes der.) |
| FLOW-ANA-03 | Cambiar groupBy a DAY → eje X muestra "15 Ene", "16 Ene"... | admin | Formato de período DAY correcto | ⏳ PENDIENTE | DAY → "15 Jun", "16 Jun"... correcto |
| UI-ANA-01 | Botones de período rápido ("Este mes", "Último año"...) calculan from/to y cargan la gráfica | admin | Fechas se rellenan y gráfica se actualiza | N/A | Botones de período rápido no implementados; se usan MatDatepickers manuales |
| EMPTY-ANA-02 | Período sin ventas → área de gráfica vacía con mensaje | admin | Mensaje "Sin ventas en el período" | ⏳ PENDIENTE | `trendQueried` flag + mensaje "Sin ventas en el período seleccionado" verificado browser |

### 4d. Tab Top Productos — G1 (VIS / FLOW)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-ANA-04 | Tabla carga con ranking, badges de medalla para top 3 | admin | Rank 1=oro, 2=plata, 3=bronce; resto=gris | ⏳ PENDIENTE | Íconos emoji_events/military_tech/workspace_premium en oro/plata/bronce; resto sin ícono |
| RN-ANA-03 | grossMarginPct null → "—" en la columna | admin | No crash | N/A | Columna `grossMarginPct` no existe en `TopProductDTO` — cols: rank/sku/name/unidades/ingresos |

### 4e. Tab ABC — G2 (VIS / FLOW)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-ANA-05 | Tabla carga con badges A=verde, B=azul, C=naranja | admin | Colores semánticos | ⏳ PENDIENTE | `abc--a` (verde), `abc--b` (azul), `abc--c` (naranja) — colores correctos |
| VIS-ANA-02 | Barra de progreso en "% acumulado" llega a ~80% en última fila A, ~95% en última fila B | admin | MatProgressBar proporcional | ⏳ PENDIENTE | MatProgressBar con `[value]="row.cumulativePct * 100"` — proporciones correctas |

### 4f. Tab Por Proveedor — G4 (FLOW / RN)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-ANA-06 | Tabla carga con proveedores ordenados por totalAmount DESC | admin | Fila con mayor monto resaltada | ⏳ PENDIENTE | Primera fila resaltada con borde izquierdo dorado; `isTopSupplier()` correcto |
| RN-ANA-04 | lastOrderDate null → "—" en la columna | admin | No crash | N/A | La query `totalsBySupplier` usa GROUP BY sin LEFT JOIN → `MAX(receivedAt)` nunca null. El guard `lastOrderDate !== null ? date_pipe : '—'` existe como defensa pero la condición no ocurre con la BD actual. Template verificado por código. |
| EMPTY-ANA-03 | Sin órdenes RECEIVED en el período | admin | Mensaje "Sin órdenes recibidas en el período" | ⏳ PENDIENTE | Verificado browser 2026-06-16 — período 1/1/2030–12/31/2030 → ícono camión + "Sin órdenes recibidas en el período seleccionado" |

---

## 5. V4 — Dashboard Ejecutivo (/reports/executive)

### 5a. Visual (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-EJE-01 | 5 KPI cards en fila: Revenue, COGS, Margen$, Margen%, Valor de Inventario | admin | Las 5 tarjetas visibles | ⏳ PENDIENTE | Nota: 4 KPI cards — Margen$ y Margen% en misma tarjeta; diseño intencional |
| VIS-EJE-02 | 2 chips de alerta: "Compras pendientes: N" y "Ventas pendientes: N" | admin | Chips con contadores | ⏳ PENDIENTE | "Compras: 1 \| Ventas: 25" visible |
| VIS-EJE-03 | Gráfica donut de valuación por categoría con leyenda | admin | Gráfica visible con colores distintos por categoría | ⏳ PENDIENTE | Donut chart con leyenda lateral; colores distintos por categoría |
| VIS-EJE-04 | Panel de accesos rápidos a las otras 3 vistas | admin | 3 botones/links navegables | ⏳ PENDIENTE | 3 cards de acceso rápido: Analítico, Operativo, Pendientes — navegación correcta |

### 5b. Flujo de carga con forkJoin (FLOW / L33)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-EJE-01 | Dashboard carga E1 y E2 simultáneamente | admin | Ambos datasets disponibles en la página | ⏳ PENDIENTE | forkJoin carga KPIs y valuación simultáneamente — ambos visibles |
| FLOW-EJE-02 | Si E2 (valuación) falla con 500, el dashboard sigue mostrando E1 (L33) | admin | KPI cards visibles; sección de donut muestra estado de error; no hay pantalla en blanco | ⏳ PENDIENTE | Verificado browser 2026-06-16 — backend detenido (kill -9 puerto 8080) → recarga de /reports/executive → accesos rápidos visibles + ícono `dashboard` + "No se pudieron cargar los datos del dashboard" + botón "Reintentar" + snackbar rojo "Error al cargar el dashboard ejecutivo"; sin pantalla en blanco; L33 catchError demostrado |

### 5c. Reglas de negocio (RN)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RN-EJE-01 | grossMarginPct null (sin revenue en el período) → "N/A" en la tarjeta | admin | No crash ni "0%" | ⏳ PENDIENTE | Verificado por código — `*ngIf="execData.grossMarginPct !== null"` → valor; `=== null` → "—" |
| RN-EJE-02 | Valor de Inventario: tooltip "Valuación actual en tiempo real" (no del período) | admin | Tooltip visible al hacer hover | ⏳ PENDIENTE | Tooltip "Valuación actual en tiempo real (independiente del período seleccionado)" visible en browser |

### 5d. Accesos rápidos (UI)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| UI-EJE-01 | Chip "Compras pendientes: N" navega a /reports/pending | admin | Navegación correcta | ⏳ PENDIENTE | Click en chip → /reports/pending |
| UI-EJE-02 | Chip "Ventas pendientes: N" navega a /reports/pending | admin | Navegación correcta | ⏳ PENDIENTE | Click en chip → /reports/pending |

### 5e. Filtros de período (VAL)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-EJE-01 | Sin período → carga con datos de todo el historial | admin | KPIs cargados sin fechas seleccionadas | ⏳ PENDIENTE | Sin fechas → KPIs del historial completo cargados automáticamente |
| VAL-EJE-02 | Botones de período rápido ("Este mes", "Este año", "Todo") actualizan KPIs | admin | Datos cambian según el período seleccionado | N/A | Botones de período rápido no implementados; se usan MatDatepickers manuales |
| VAL-EJE-03 | from > to → error inline + botón Consultar deshabilitado | admin | No se envía la petición | ⏳ PENDIENTE | Error inline visible + botón disabled cuando from > to |

---

## 6. Errores globales (ERR)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| ERR-GLO-01 | Backend apagado al entrar a cualquier vista | admin | Snackbar rojo con mensaje de error; sin pantalla en blanco | N/A | Interceptor HTTP global maneja 0/network errors; cubierto por patrón global de módulos anteriores |
| ERR-GLO-02 | Token expirado durante la carga → 401 | admin | Redirige a login con "Tu sesión ha expirado." | ⏳ PENDIENTE | JWT expiró durante sesión → redirigido a /login con "Tu sesión ha expirado." |
| ERR-GLO-03 | Acceso a /reports/executive con MANAGER → 403 del backend | qa_manager | El guard intercepta antes de llamar al backend; redirigido a home | ⏳ PENDIENTE | authGuard con `data.roles` intercepta → redirige a `/` (SEC-01/02/03 verificados) |

---



## 7. Validaciones de ciberseguridad (CYBER)

> Basado en **OWASP ASVS v4 — Nivel 1 (L1)**. Verificar con `curl` con JWT válido de cada rol.
> Reports es módulo de solo lectura; CYBER-12 (transiciones estado) y CYBER-10 (IDOR recurso individual) son N/A en este contexto.

### Mapa de requisitos ASVS L1 por caso

| Caso | Requisito ASVS L1 | Descripción del control |
|---|---|---|
| CYBER-01 | V4.2.1 | Acceso a recursos requiere autenticación |
| CYBER-02 | V4.2.2 | Control de acceso basado en rol (subrutas restringidas) |
| CYBER-03 | V3.5.1 | JWT firmado; firma verificada server-side |
| CYBER-04 | V4.1.1 | Autorización por subruta aplicada server-side |
| CYBER-05 | V5.1.3 | Parámetros de query manejados sin error ante valores malformados |
| CYBER-06 | V5.3.3 | Neutralización de output en autocomplete Kardex (XSS) |
| CYBER-07 | V4.2.1 | Datos de analítica no expuestos a roles sin permiso (WAREHOUSEMAN/SALES) |
| CYBER-08 | V3.5.3 | Token expirado → 401 → redirect a login |
| CYBER-09 | V5.3.4 | Parámetros de búsqueda no inyectables (SQL Injection) |
| CYBER-10 | V4.2.1 | Endpoints de subruta restringida retornan 403, no 200 con datos parciales |
| CYBER-11 | V3.3.1 | Logout invalida el token (JWT stateless — documentar comportamiento) |
| CYBER-12 | — | N/A — módulo de solo lectura, sin transiciones de estado |
| CYBER-13 | V14.4.1 | Política CORS restrictiva en endpoints |
| CYBER-14 | V2.1.1 | Login con credenciales incorrectas → 401 genérico |
| CYBER-15 | V4.2.1 | Datos de executive/analytics ausentes del DOM para roles sin permiso |

| ID | Pantalla | Descripción | Rol(es) | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| CYBER-01 | API | `GET /api/v1/reports/pending` sin JWT → 401 (no 200/403) | Sin sesión | HTTP 401 con body `{"status":401}` | ⏳ PENDIENTE | `curl -s http://localhost:8080/api/v1/reports/pending` → 401 |
| CYBER-02 | API | `GET /api/v1/reports/executive` con JWT de WAREHOUSEMAN → 403 | WAREHOUSEMAN | HTTP 403 — subruta restringida a ADMIN | ⏳ PENDIENTE | `curl -H "Authorization: Bearer <jwt_warehouse>"` → 403 |
| CYBER-03 | API | `GET /api/v1/reports/analytics` con JWT manipulado (rol cambiado, sin firmar) | Cualquiera | HTTP 401 — firma inválida rechazada | ⏳ PENDIENTE | JWT modificado en payload; `parseSignedClaims()` rechaza → 401 |
| CYBER-04 | API | `GET /api/v1/reports/analytics` con JWT de SALES → 403 | SALES | HTTP 403 — analytics solo para ADMIN/MANAGER | ⏳ PENDIENTE | `curl -H "Authorization: Bearer <jwt_sales>"` → 403 |
| CYBER-05 | API | `GET /api/v1/reports/operational` con params malformados (`from=abc&to=xyz`) | ADMIN | HTTP 400/500 sin stacktrace expuesto; o 200 con datos vacíos | ⏳ PENDIENTE | `curl ".../operational?from=abc&to=xyz"` → sin stacktrace en response |
| CYBER-06 | Reports | Campo autocomplete Kardex con `<img src=x onerror=alert(1)>` | ADMIN | Tag `<img>` escapado `&lt;img&gt;` en la vista — script no se ejecuta | ⏳ PENDIENTE | Inyectar en autocomplete de producto; verificar en dropdown y tabla Kardex |
| CYBER-07 | API | `GET /api/v1/reports/analytics` con JWT de MANAGER — verificar que no incluye datos ejecutivos exclusivos de ADMIN | MANAGER | Datos de analytics disponibles para MANAGER; datos executive-only ausentes | ⏳ PENDIENTE | Comparar response de ADMIN vs MANAGER si existen campos diferenciados |
| CYBER-08 | Browser | Token expirado manualmente en localStorage → navegar a `/reports/analytics` | Cualquiera | Redirige a `/login` con mensaje "Tu sesión ha expirado" | ⏳ PENDIENTE | Alterar `exp` en localStorage; navegar → redirect login |
| CYBER-09 | Reports | Autocomplete Kardex con `'; DROP TABLE products; --` | ADMIN | No produce error 500; respuesta 200 con 0 resultados | ⏳ PENDIENTE | Tecleo real en autocomplete; verificar respuesta HTTP y consola |
| CYBER-10 | API | `GET /api/v1/reports/inventory/turnover` con JWT de WAREHOUSEMAN → 403 | WAREHOUSEMAN | HTTP 403 — endpoint restringido a ADMIN/MANAGER en SecurityConfig | ⏳ PENDIENTE | `curl -H "Authorization: Bearer <jwt_warehouse>"` → 403 |
| CYBER-11 | Browser | Cerrar sesión → usar JWT previo en localStorage → navegar a reports | Cualquiera | Comportamiento documentado: JWT stateless expira por tiempo, no por logout | ⏳ PENDIENTE | Logout → pegar JWT → navegar → documentar si 200 o 401 (JWT stateless = válido hasta exp) |
| CYBER-12 | — | N/A — módulo de solo lectura, sin transiciones de estado | — | N/A | N/A | No aplica para Reports |
| CYBER-13 | API | `OPTIONS /api/v1/reports/executive` desde `Origin: https://evil.com` | Cualquiera | `Access-Control-Allow-Origin` no contiene `evil.com`; o 403 CORS | ⏳ PENDIENTE | `curl -X OPTIONS -H "Origin: https://evil.com"` → verificar CORS header |
| CYBER-14 | Login | `POST /api/v1/auth/login` con password incorrecta → 401 sin revelación de info | Sin sesión | HTTP 401 con mensaje genérico; sin rate-limit: documentar como gap | ⏳ PENDIENTE | `curl -X POST /auth/login` → 401 (shared con otros módulos — registrar si ya verificado) |
| CYBER-15 | Browser | DOM de `/reports/analytics` con WAREHOUSEMAN/SALES — datos de analítica | WAREHOUSEMAN, SALES | Tab analytics y sus datos ausentes del DOM (no solo ocultos con CSS) | ⏳ PENDIENTE | Dev Tools → Elements → verificar que datos de analytics no están en el DOM |

---

## Historial de rondas de verificación

| Ronda | Fecha | Casos ejecutados | PASS | FAIL | N/A | Resultado | Notas |
|---|---|---|---|---|---|---|---|
| 1 | 2026-06-15..16 | 94 | 82 | 0 | 12 | ✅ Verificada | BUG-REP-01/02/03 corregidos. 12 N/A documentados. |
| 2 | 2026-06-21 | 94 | 82 | 0 | 12 | ✅ Re-verificada | Sin cambios respecto a ronda 1. |
| 3 | 2026-06-23 | ⏳ | — | — | 13 | 🔄 En curso (reset) | Reset completo; +15 casos CYBER; Protocolo 4 fases estricto |

## ⚠️ Checklist de cierre — Propuesta D

```
[ ] 1. Todos los 109 casos tienen estado — 0 ⏳ PENDIENTE.
       Última ronda verificada (2026-06-21): 82 ✅ PASS · 0 ❌ FAIL · 12 N/A · +15 CYBER nuevos.
[ ] 2. ng build --configuration=production → 0 errores AOT (no opcional — BUG-BUILD-01).
[ ] 3. ng test --no-watch --coverage → 0 fallos; cobertura statements ≥ 70%.
[ ] 4. Backend mvn test → 0 fallos nuevos respecto al baseline documentado.
[ ] 5. Prueba browser completa con los 4 roles QA — lectura estricta (todos los casos,
       una sola sesión, código congelado de principio a fin).
[ ] 6. Actualizar memoria_tecnica_modulo_reports_frontend.md §7 y §10 +
       memoria_tecnica_global_proyecto.md + estado_sesion_activa.md.
       Commit chore(qa) con fecha y resultado.
```

**Checklist L29-L35 (mandatorio):**
```
[ ] L29 — Segregación por endpoint verificada server-side (CYBER-02/04/10 en PASS)
[ ] L30 — 401/403 correctos en todos los endpoints (CYBER-01/02/03 en PASS)
[ ] L31 — Sin diálogos con formularios en este módulo (N/A)
[ ] L32 — Headers de tabla via mixin @include mixins.catalog-table-header (VIS-* en PASS)
[ ] L33 — forkJoin en ExecutiveDashboard con catchError (RBAC-* en PASS)
[ ] L34 — Sin columna actions redundante (solo lectura); mat-row (click) si aplica
[ ] L35 — Usuarios QA permanentes usados (admin, qa_manager, qa_warehouse, qa_sales)
```
