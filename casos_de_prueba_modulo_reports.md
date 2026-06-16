# Casos de prueba — Módulo 5: Reportes

**Módulo:** Reports  
**Ruta base:** `/reports`  
**Roles con acceso:** ADMIN, MANAGER, WAREHOUSEMAN, SALES (restricciones por subruta — ver §SEC)  
**Roles sin acceso:** Ninguno (todos acceden a al menos /reports/pending)  
**Fecha de creación:** 2026-06-15  
**Última actualización:** 2026-06-15  

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

| Categoría | Total casos | PASS | FAIL | PENDIENTE |
|---|---|---|---|---|
| SEC — Seguridad de rutas | 12 | 0 | 0 | 12 |
| RBAC — Control de acceso UI | 10 | 0 | 0 | 10 |
| VAL — Validaciones de filtros | 12 | 0 | 0 | 12 |
| BSRCH — Búsqueda (Kardex autocomplete) | 5 | 0 | 0 | 5 |
| UI — Botones e íconos | 14 | 0 | 0 | 14 |
| FLOW — Flujos de carga | 10 | 0 | 0 | 10 |
| RN — Reglas de negocio | 8 | 0 | 0 | 8 |
| ERR — Mensajes de error | 8 | 0 | 0 | 8 |
| EMPTY — Estados vacíos | 10 | 0 | 0 | 10 |
| VIS — Visual y estética | 14 | 0 | 0 | 14 |
| **TOTAL** | **103** | **0** | **0** | **103** |

---

## 0. Seguridad de rutas (SEC)

> Verificar con acceso directo por URL — NO basta con que el sub-ítem del sidebar esté oculto.

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| SEC-01 | Acceso directo `/reports/executive` con MANAGER | qa_manager | Redirige a home; "Acceso denegado" | ⏳ PENDIENTE | |
| SEC-02 | Acceso directo `/reports/executive` con WAREHOUSEMAN | qa_warehouse | Redirige a home; "Acceso denegado" | ⏳ PENDIENTE | |
| SEC-03 | Acceso directo `/reports/executive` con SALES | qa_sales | Redirige a home; "Acceso denegado" | ⏳ PENDIENTE | |
| SEC-04 | Acceso directo `/reports/analytics` con WAREHOUSEMAN | qa_warehouse | Redirige a home; "Acceso denegado" | ⏳ PENDIENTE | |
| SEC-05 | Acceso directo `/reports/analytics` con SALES | qa_sales | Redirige a home; "Acceso denegado" | ⏳ PENDIENTE | |
| SEC-06 | Acceso directo `/reports/operational` con SALES | qa_sales | Redirige a home; "Acceso denegado" | ⏳ PENDIENTE | |
| SEC-07 | Acceso directo `/reports/pending` con SALES | qa_sales | Carga correctamente (SALES tiene acceso) | ⏳ PENDIENTE | |
| SEC-08 | Acceso directo `/reports/pending` con WAREHOUSEMAN | qa_warehouse | Carga correctamente | ⏳ PENDIENTE | |
| SEC-09 | Acceso directo `/reports/pending` sin JWT (token expirado) | (sin JWT) | Redirige a `/login` | ⏳ PENDIENTE | |
| SEC-10 | Acceso directo `/reports/operational` con WAREHOUSEMAN | qa_warehouse | Carga correctamente (tiene acceso) | ⏳ PENDIENTE | |
| SEC-11 | Acceso directo `/reports/analytics` con MANAGER | qa_manager | Carga correctamente (tiene acceso) | ⏳ PENDIENTE | |
| SEC-12 | Acceso directo `/reports/executive` con ADMIN | admin | Carga correctamente (tiene acceso) | ⏳ PENDIENTE | |

---

## 1. RBAC — Sidebar y acceso (RBAC)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-SB-01 | Sidebar: sub-ítem "Dashboard Ejecutivo" visible | admin | Visible | ⏳ PENDIENTE | |
| RBAC-SB-02 | Sidebar: sub-ítem "Dashboard Ejecutivo" NO visible | qa_manager, qa_warehouse, qa_sales | Ausente del DOM | ⏳ PENDIENTE | |
| RBAC-SB-03 | Sidebar: sub-ítem "Dashboard Analítico" visible | admin, qa_manager | Visible | ⏳ PENDIENTE | |
| RBAC-SB-04 | Sidebar: sub-ítem "Dashboard Analítico" NO visible | qa_warehouse, qa_sales | Ausente | ⏳ PENDIENTE | |
| RBAC-SB-05 | Sidebar: sub-ítem "Operativo" visible | admin, qa_manager, qa_warehouse | Visible | ⏳ PENDIENTE | |
| RBAC-SB-06 | Sidebar: sub-ítem "Operativo" NO visible | qa_sales | Ausente | ⏳ PENDIENTE | |
| RBAC-SB-07 | Sidebar: sub-ítem "Pendientes" visible para todos los roles | admin, qa_manager, qa_warehouse, qa_sales | Visible para los 4 | ⏳ PENDIENTE | |
| RBAC-SB-08 | SALES: grupo "Reportes" expande y muestra solo "Pendientes" | qa_sales | Un único sub-ítem visible | ⏳ PENDIENTE | |
| RBAC-SB-09 | WAREHOUSEMAN: grupo "Reportes" muestra "Operativo" y "Pendientes" | qa_warehouse | Dos sub-ítems visibles | ⏳ PENDIENTE | |
| RBAC-SB-10 | MANAGER: grupo "Reportes" muestra "Dashboard Analítico", "Operativo" y "Pendientes" | qa_manager | Tres sub-ítems visibles | ⏳ PENDIENTE | |

---

## 2. V1 — Operaciones Pendientes (/reports/pending)

### 2a. Visual (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-PEN-01 | Título "Operaciones Pendientes" visible | admin | Visible | ⏳ PENDIENTE | |
| VIS-PEN-02 | Tabla de compras con columnas: Nº Orden, Estado, Proveedor, Fecha, Total, Ítems | admin | Todas las columnas visibles | ⏳ PENDIENTE | |
| VIS-PEN-03 | Tabla de ventas con las mismas columnas (Cliente en vez de Proveedor) | admin | Todas las columnas visibles | ⏳ PENDIENTE | |
| VIS-PEN-04 | Badge PENDING = naranja, APPROVED = azul | admin | Colores semánticos correctos | ⏳ PENDIENTE | |
| VIS-PEN-05 | Timestamp "Datos al: DD/MM/YYYY HH:mm" visible | admin | Fecha/hora del backend | ⏳ PENDIENTE | |
| VIS-PEN-06 | Headers de tabla con fondo `#F2E4F2` y texto `#6B3C6B` (L32) | admin | Colores de marca correctos | ⏳ PENDIENTE | |

### 2b. Flujo de carga (FLOW)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-PEN-01 | Al entrar en la página los datos cargan automáticamente | admin | Tabla con datos en < 2s; barra de progreso visible durante carga | ⏳ PENDIENTE | |
| FLOW-PEN-02 | Botón "Actualizar" recarga los datos | admin | Tabla se recarga; timestamp actualiza | ⏳ PENDIENTE | |

### 2c. UI — Acciones (UI)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| UI-PEN-01 | Click en fila de compra pendiente navega a /purchases/orders/:id | admin | Navegación correcta al detalle de la orden | ⏳ PENDIENTE | |
| UI-PEN-02 | Click en fila de venta pendiente navega a /sales/orders/:id | admin | Navegación correcta al detalle de la orden | ⏳ PENDIENTE | |

### 2d. Estados vacíos (EMPTY)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| EMPTY-PEN-01 | Sin compras pendientes | Mensaje "Sin compras pendientes" en esa sección | ⏳ PENDIENTE | |
| EMPTY-PEN-02 | Sin ventas pendientes | Mensaje "Sin ventas pendientes" en esa sección | ⏳ PENDIENTE | |

### 2e. Errores (ERR)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| ERR-PEN-01 | Backend apagado al cargar | Snackbar rojo "Error al cargar operaciones pendientes" | ⏳ PENDIENTE | |

---

## 3. V2 — Reportes Operativos (/reports/operational)

### 3a. Visual tabs (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-OPE-01 | Cuatro tabs visibles: "Stock Bajo (N)", "Kardex", "Movimientos", "Rotación" | admin | Tabs correctos con badge numérico en "Stock Bajo" | ⏳ PENDIENTE | |
| VIS-OPE-02 | Tab "Stock Bajo": columna "Disponible" en rojo cuando ≤ mínimo | admin | Color rojo en la columna availableStock | ⏳ PENDIENTE | |
| VIS-OPE-03 | Tab "Rotación": badge de color por interpretación (Alta=verde, Media=azul, Baja=naranja, Sin datos=gris) | admin | Badges correctos | ⏳ PENDIENTE | |
| VIS-OPE-04 | Tab "Movimientos": icono trending_up verde si netMovement > 0, trending_down rojo si < 0 | admin | Íconos y colores correctos | ⏳ PENDIENTE | |

### 3b. Tab Stock Bajo — O1 (FLOW / RN)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-OPE-01 | Tab Stock Bajo carga automáticamente al entrar | admin | Datos visibles; barra de progreso | ⏳ PENDIENTE | |
| RN-OPE-01 | La columna "Disponible" (availableStock) es el criterio de alerta, no currentStock (L29) | admin | availableStock ≤ minimumStock → fila resaltada; currentStock no es el criterio | ⏳ PENDIENTE | |
| EMPTY-OPE-01 | Sin productos en alerta | Mensaje "Todos los productos tienen stock suficiente" | ⏳ PENDIENTE | |

### 3c. Tab Kardex — O2 (VAL / BSRCH / RN)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| BSRCH-OPE-01 | Autocomplete de producto con texto parcial (min 2 chars) | admin | Lista de sugerencias visible | ⏳ PENDIENTE | |
| BSRCH-OPE-02 | Autocomplete con texto en minúsculas (case insensitive) | admin | Encuentra producto escrito en mayúsculas | ⏳ PENDIENTE | |
| BSRCH-OPE-03 | Autocomplete sin resultados | admin | Mensaje "Sin resultados" | ⏳ PENDIENTE | |
| BSRCH-OPE-04 | Limpiar campo de producto resetea el Kardex | admin | Tabla de movimientos se vacía | ⏳ PENDIENTE | |
| BSRCH-OPE-05 | Menos de 2 caracteres no dispara la búsqueda | admin | Sin llamada al API | ⏳ PENDIENTE | |
| VAL-OPE-01 | Botón "Consultar" deshabilitado sin producto seleccionado | admin | Botón disabled | ⏳ PENDIENTE | |
| VAL-OPE-02 | Consultar con fechas from > to | admin | Error inline "La fecha inicio no puede ser posterior a la de fin" | ⏳ PENDIENTE | |
| FLOW-OPE-02 | Seleccionar producto + Consultar → tabla de movimientos carga | admin | Tabla con movimientos IN/OUT; tarjeta de resumen (apertura, cierre, IN total, OUT total) | ⏳ PENDIENTE | |
| ERR-OPE-01 | Producto eliminado del backend (ID ya no existe) → 500 | admin | Snackbar rojo "Producto no encontrado" | ⏳ PENDIENTE | |
| EMPTY-OPE-02 | Kardex con período sin movimientos | admin | Mensaje "Sin movimientos en el período" | ⏳ PENDIENTE | |

### 3d. Tab Movimientos — O4 (VAL / FLOW)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-OPE-03 | Consultar con fechas válidas → 3 tarjetas de métrica | admin | totalIn (verde), totalOut (rojo), netMovement (color según signo) | ⏳ PENDIENTE | |
| VAL-OPE-03 | From > to bloquea el botón Consultar | admin | Botón disabled + error inline | ⏳ PENDIENTE | |

### 3e. Tab Rotación — G3 (FLOW / RN)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-OPE-04 | Consultar período → tabla con tasas de rotación | admin | Columna turnoverRate con 4 decimales; "—" si null | ⏳ PENDIENTE | |
| RN-OPE-02 | turnoverRate null → se muestra "—" con tooltip "Sin inventario actual" | admin | No se muestra "0.0000" ni crash | ⏳ PENDIENTE | |
| EMPTY-OPE-03 | Sin ventas en el período → lista vacía de rotación | admin | Mensaje "Sin movimientos de ventas en el período" | ⏳ PENDIENTE | |

---

## 4. V3 — Dashboard Analítico (/reports/analytics)

### 4a. Visual tabs (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-ANA-01 | Cinco tabs: "Rentabilidad", "Tendencia de Ventas", "Top Productos", "Análisis ABC", "Por Proveedor" | admin | Tabs correctos | ⏳ PENDIENTE | |

### 4b. Tab Rentabilidad — E3 (VAL / RN / ERR)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-ANA-01 | Botón "Consultar" deshabilitado sin fecha "Desde" | admin | Botón disabled | ⏳ PENDIENTE | |
| VAL-ANA-02 | Botón "Consultar" deshabilitado sin fecha "Hasta" | admin | Botón disabled | ⏳ PENDIENTE | |
| VAL-ANA-03 | Botón "Consultar" deshabilitado cuando from > to | admin | Botón disabled + error inline | ⏳ PENDIENTE | |
| VAL-ANA-04 | Botón "Consultar" habilitado cuando from ≤ to y ambas fechas presentes | admin | Botón habilitado | ⏳ PENDIENTE | |
| FLOW-ANA-01 | Consultar con período válido → 4 KPI cards + 2 métricas secundarias | admin | Revenue, COGS, Margen$, Margen%, Órdenes, Ticket promedio | ⏳ PENDIENTE | |
| RN-ANA-01 | grossMarginPct null → se muestra "N/A" con tooltip explicativo | admin | No se muestra "0%" ni crash | ⏳ PENDIENTE | |
| RN-ANA-02 | avgTicket null → se muestra "—" | admin | No crash | ⏳ PENDIENTE | |
| EMPTY-ANA-01 | Período sin ventas entregadas | admin | Mensaje "Sin ventas entregadas en el período" | ⏳ PENDIENTE | |
| ERR-ANA-01 | from > to enviado de forma inesperada al backend → 500 | admin | Snackbar rojo "Período inválido. Verifica las fechas." | ⏳ PENDIENTE | |

### 4c. Tab Tendencia — G5 (VAL / FLOW / VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-ANA-02 | Consultar con groupBy=MONTH → gráfica de línea con eje X "Ene 2026, Feb 2026..." | admin | Gráfica visible con formato correcto | ⏳ PENDIENTE | |
| FLOW-ANA-03 | Cambiar groupBy a DAY → eje X muestra "15 Ene", "16 Ene"... | admin | Formato de período DAY correcto | ⏳ PENDIENTE | |
| UI-ANA-01 | Botones de período rápido ("Este mes", "Último año"...) calculan from/to y cargan la gráfica | admin | Fechas se rellenan y gráfica se actualiza | ⏳ PENDIENTE | |
| EMPTY-ANA-02 | Período sin ventas → área de gráfica vacía con mensaje | admin | Mensaje "Sin ventas en el período" | ⏳ PENDIENTE | |

### 4d. Tab Top Productos — G1 (VIS / FLOW)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-ANA-04 | Tabla carga con ranking, badges de medalla para top 3 | admin | Rank 1=oro, 2=plata, 3=bronce; resto=gris | ⏳ PENDIENTE | |
| RN-ANA-03 | grossMarginPct null → "—" en la columna | admin | No crash | ⏳ PENDIENTE | |

### 4e. Tab ABC — G2 (VIS / FLOW)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-ANA-05 | Tabla carga con badges A=verde, B=azul, C=naranja | admin | Colores semánticos | ⏳ PENDIENTE | |
| VIS-ANA-02 | Barra de progreso en "% acumulado" llega a ~80% en última fila A, ~95% en última fila B | admin | MatProgressBar proporcional | ⏳ PENDIENTE | |

### 4f. Tab Por Proveedor — G4 (FLOW / RN)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-ANA-06 | Tabla carga con proveedores ordenados por totalAmount DESC | admin | Fila con mayor monto resaltada | ⏳ PENDIENTE | |
| RN-ANA-04 | lastOrderDate null → "—" en la columna | admin | No crash | ⏳ PENDIENTE | |
| EMPTY-ANA-03 | Sin órdenes RECEIVED en el período | admin | Mensaje "Sin órdenes recibidas en el período" | ⏳ PENDIENTE | |

---

## 5. V4 — Dashboard Ejecutivo (/reports/executive)

### 5a. Visual (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-EJE-01 | 5 KPI cards en fila: Revenue, COGS, Margen$, Margen%, Valor de Inventario | admin | Las 5 tarjetas visibles | ⏳ PENDIENTE | |
| VIS-EJE-02 | 2 chips de alerta: "Compras pendientes: N" y "Ventas pendientes: N" | admin | Chips con contadores | ⏳ PENDIENTE | |
| VIS-EJE-03 | Gráfica donut de valuación por categoría con leyenda | admin | Gráfica visible con colores distintos por categoría | ⏳ PENDIENTE | |
| VIS-EJE-04 | Panel de accesos rápidos a las otras 3 vistas | admin | 3 botones/links navegables | ⏳ PENDIENTE | |

### 5b. Flujo de carga con forkJoin (FLOW / L33)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| FLOW-EJE-01 | Dashboard carga E1 y E2 simultáneamente | admin | Ambos datasets disponibles en la página | ⏳ PENDIENTE | |
| FLOW-EJE-02 | Si E2 (valuación) falla con 500, el dashboard sigue mostrando E1 (L33) | admin | KPI cards visibles; sección de donut muestra estado de error; no hay pantalla en blanco | ⏳ PENDIENTE | |

### 5c. Reglas de negocio (RN)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RN-EJE-01 | grossMarginPct null (sin revenue en el período) → "N/A" en la tarjeta | admin | No crash ni "0%" | ⏳ PENDIENTE | |
| RN-EJE-02 | Valor de Inventario: tooltip "Valuación actual en tiempo real" (no del período) | admin | Tooltip visible al hacer hover | ⏳ PENDIENTE | |

### 5d. Accesos rápidos (UI)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| UI-EJE-01 | Chip "Compras pendientes: N" navega a /reports/pending | admin | Navegación correcta | ⏳ PENDIENTE | |
| UI-EJE-02 | Chip "Ventas pendientes: N" navega a /reports/pending | admin | Navegación correcta | ⏳ PENDIENTE | |

### 5e. Filtros de período (VAL)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-EJE-01 | Sin período → carga con datos de todo el historial | admin | KPIs cargados sin fechas seleccionadas | ⏳ PENDIENTE | |
| VAL-EJE-02 | Botones de período rápido ("Este mes", "Este año", "Todo") actualizan KPIs | admin | Datos cambian según el período seleccionado | ⏳ PENDIENTE | |
| VAL-EJE-03 | from > to → error inline + botón Consultar deshabilitado | admin | No se envía la petición | ⏳ PENDIENTE | |

---

## 6. Errores globales (ERR)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| ERR-GLO-01 | Backend apagado al entrar a cualquier vista | admin | Snackbar rojo con mensaje de error; sin pantalla en blanco | ⏳ PENDIENTE | |
| ERR-GLO-02 | Token expirado durante la carga → 401 | admin | Redirige a login con "Tu sesión ha expirado." | ⏳ PENDIENTE | |
| ERR-GLO-03 | Acceso a /reports/executive con MANAGER → 403 del backend | qa_manager | El guard intercepta antes de llamar al backend; redirigido a home | ⏳ PENDIENTE | |

---

## ⚠️ Checklist de cierre — Propuesta D

```
[ ] 1. Todos los 103 casos de este documento tienen estado ✅ PASS o N/A — ninguno ⏳ PENDIENTE
[ ] 2. ng test --no-watch → 0 fallos; cobertura ≥ 70% statements
[ ] 3. Prueba browser completa con 4 roles (admin, qa_manager, qa_warehouse, qa_sales) documentada
[ ] 4. Limpieza de datos de prueba prefijados [QA]/TEST_ antes de cerrar
[ ] 5. memoria_tecnica_modulo_reports_frontend.md §7 (tests) y §10 (cumplimiento) actualizados
[ ] 6. memoria_tecnica_global_proyecto.md actualizada
[ ] 7. CLAUDE.md actualizado con bugs y nuevas lecciones transversales del módulo
[ ] 8. feature/reports mergeada a develop con --no-ff y push
```
