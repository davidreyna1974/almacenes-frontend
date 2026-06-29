# Memoria Técnica — Módulo 5: Reportes (Frontend)

**Módulo:** Reports  
**Ruta base:** `/reports`  
**Rama:** `feature/reports`  
**Fecha de inicio:** 2026-06-15  
**Última actualización:** 2026-06-16 (Cierre browser — 10 casos verificados en browser; 82 PASS + 12 N/A = 94 total)  
**Estado:** ✅ Completo

---

## 1. Contexto y justificación

El módulo de Reportes es el módulo 5 y último del sistema de gestión de almacenes.
A diferencia de los módulos 1-4 (CRUD transaccional), este módulo es exclusivamente
de lectura: consume los datos generados por Auth, Inventory, Purchases y Sales,
y los presenta como indicadores (KPIs), gráficas y tablas de análisis para los
4 perfiles de usuario.

El backend provee 12 endpoints GET bajo `/api/v1/reports/`, todos sin paginación.
Ningún endpoint requiere cuerpo de solicitud.

Propuesta de desarrollo: `propuesta_modulo_reportes_frontend.txt` (raíz del proyecto).

---

## 2. Decisiones de diseño

### 2.1 Biblioteca de gráficas: ng2-charts + chart.js
**Decisión:** instalada en Fase 0 (`npm install chart.js ng2-charts`).  
**Justificación:** ng2-charts ≥ 5.x es compatible con Angular 17+, licencia MIT,
~200KB, no conflicta con Angular Material. Solo se usan 3 tipos: línea, dona, barra.  
**Alternativa descartada:** CSS-only (eliminaría la gráfica de tendencia de ventas).

### 2.2 Arquitectura de rutas: 4 subrutas hijas
- `/reports/pending`     → todos los roles (ADMIN, MANAGER, WAREHOUSEMAN, SALES)
- `/reports/operational` → ADMIN, MANAGER, WAREHOUSEMAN
- `/reports/analytics`   → ADMIN, MANAGER
- `/reports/executive`   → ADMIN únicamente  
**Patrón:** idéntico al de `sales.routes.ts` con un componente shell `ReportsComponent`.

### 2.3 Servicio único ReportService
Un solo `@Injectable({ providedIn: 'root' })` con 12 métodos Observable.
No se crean servicios por vista — todo es solo lectura, sin estado de escritura.

### 2.4 Filtros de fecha: inline por componente
Los filtros `from`/`to` se implementan inline en cada componente, no como shared component.  
**Justificación (YAGNI):** cada componente tiene sutilezas propias (E3 requiere ambas fechas,
O2 tiene autocomplete de producto). Un shared component añadiría complejidad innecesaria.

### 2.5 Sin exportación CSV/Excel
Fuera del alcance de este módulo. Los datos son accesibles vía Swagger para análisis externo.

---

## 3. Especificación de componentes/vistas

Ver `propuesta_modulo_reportes_frontend.txt` §6 para el detalle completo de cada vista.

| Componente | Ruta | Roles | Endpoints |
|---|---|---|---|
| `PendingReportComponent` | `/reports/pending` | Todos | O3 |
| `OperationalReportComponent` | `/reports/operational` | ADMIN, MANAGER, WAREHOUSEMAN | G3, O1, O2, O4 |
| `AnalyticsDashboardComponent` | `/reports/analytics` | ADMIN, MANAGER | E3, G1, G2, G4, G5 |
| `ExecutiveDashboardComponent` | `/reports/executive` | ADMIN | E1, E2 |

---

## 4. Servicios y contratos con el backend

### 4.1 Matriz de campos sensibles × roles (L29)

En el módulo de Reportes, la segregación de datos es por ENDPOINT COMPLETO, no por campo
dentro del DTO. El backend devuelve 403 si el rol no tiene acceso al endpoint.
No hay campos financieros compartidos en el mismo DTO entre roles con y sin acceso
(a diferencia de Inventory donde `unitCost` debía redactarse por campo).

| Vista | Datos financieros expuestos | Roles con acceso | Backend protege con |
|---|---|---|---|
| V4 — Ejecutivo | Revenue, COGS, Margen, Valuación inventario | ADMIN | SecurityConfig — endpoint completo |
| V3 — Analítico | Revenue, COGS, Margen, Rentabilidad, Top productos, Tendencia | ADMIN, MANAGER | SecurityConfig — endpoint completo |
| V2 — Operativo | Rotación (COGS/valor), solo operativo | ADMIN, MANAGER, WAREHOUSEMAN | SecurityConfig — endpoint completo |
| V1 — Pendientes | Monto de órdenes (totalAmount) | Todos los roles | Sin restricción financiera |

**Conclusión L29:** no requiere redacción de campos en el servicio frontend. La protección
es a nivel de ruta Angular (authGuard + data.roles) y en el backend (SecurityConfig).

### 4.2 Contratos API verificados

Ver `propuesta_modulo_reportes_frontend.txt` §4 para el detalle completo de los 12 endpoints.

**Advertencias críticas verificadas:**
- **E3 (rentabilidad):** `from` y `to` son OBLIGATORIOS — el backend lanza RuntimeException si son null o si `from > to`. El frontend deshabilita el botón hasta que ambas fechas sean válidas.
- **G5 (tendencia):** `groupBy` solo acepta 'DAY', 'WEEK', 'MONTH' — cualquier otro valor produce error 500.
- **O2 (Kardex):** `productId` no encontrado → RuntimeException → HTTP 500 (no 404). Capturar como error genérico con snackbar rojo.
- **O1 (stock bajo):** el criterio usa `availableStock` (= `currentStock - reservedStock`), NO `currentStock` bruto. Mostrar `availableStock` como el dato crítico.
- **Campos null:** `grossMarginPct`, `avgTicket`, `turnoverRate`, `lastOrderDate` pueden ser null — mostrar "—" nunca "0" ni crash.

### 4.3 Interfaces TypeScript

Archivo: `src/app/modules/reports/models/report.model.ts`  
12 interfaces con nombres de campo exactos del backend. Todos los campos nullable
documentados con `| null` en la firma TypeScript.

---

## 5. Algoritmos y lógica no trivial

### 5.1 Construcción de HttpParams — omitir undefined/null
`ReportService.buildParams()` itera el objeto de parámetros y solo añade los
que tienen valor non-null y non-empty. Garantiza que el backend reciba sus defaults
internos cuando el usuario no especifica período.

### 5.2 Formateo del eje X en gráfica de tendencia (G5)
El campo `period` varía según `groupBy`:
- `MONTH`: "2026-01" → "Ene 2026"
- `WEEK`: "2026-03" → "Sem 3/2026"
- `DAY`: "2026-01-15" → "15 Ene"
Se implementa un helper puro (no pipe) para usarlo en la configuración de Chart.js.

### 5.3 forkJoin en V4 (L33)
El dashboard ejecutivo carga E1 y E2 simultáneamente:
```typescript
forkJoin({
  executive: this.reportService.getExecutiveDashboard(from, to).pipe(catchError(() => of(null))),
  valuation: this.reportService.getInventoryValuation().pipe(catchError(() => of(null))),
})
```
Aunque ambos son ADMIN-only, se aplica `catchError` por observable para que un fallo
parcial no bloquee el dashboard completo (L33).

---

## 6. RBAC — criterio de visibilidad por rol

| Sub-ítem sidebar | Ícono | Visible para |
|---|---|---|
| Dashboard Ejecutivo | `dashboard` | ADMIN |
| Dashboard Analítico | `analytics` | ADMIN, MANAGER |
| Operativo | `inventory_2` | ADMIN, MANAGER, WAREHOUSEMAN |
| Pendientes | `pending_actions` | Todos los roles |

**Protección doble (Propuesta C):**
1. Sidebar filtra sub-ítems por rol (cosmético).
2. Cada ruta tiene `canActivate: [authGuard]` con `data.roles` (seguridad real).
3. Acceso directo por URL con rol no autorizado → redirigido a home.

---

## 7. Ejecución de tests y resultados

### Fase 0 — Infraestructura (completada 2026-06-15)

**Suite completa post-Fase 0:**  
`ng test --no-watch` → **401 specs, 0 fallos** (383 previos + 18 nuevos de `report.service.spec.ts`)

**Tests nuevos en Fase 0:**  
`report.service.spec.ts` — 18 specs, 0 fallos  
Cobertura: verificación de los 12 métodos del servicio — rutas HTTP, parámetros opcionales/obligatorios, omisión de undefined.

**Verificación browser Fase 0 — 4 roles (2026-06-15):**

| Caso | Rol | Resultado | Estado |
|---|---|---|---|
| ADMIN: sidebar muestra 4 sub-ítems | admin | Dashboard Ejecutivo, Dashboard Analítico, Operativo, Pendientes visibles | ✅ PASS |
| ADMIN: breadcrumb "Reportes → Dashboard Ejecutivo" | admin | Breadcrumb correcto al navegar a /reports/executive | ✅ PASS |
| SEC-01: /reports/executive con MANAGER → redirige | qa_manager | URL cambia a / después del guard | ✅ PASS |
| MANAGER: sidebar muestra 3 sub-ítems (sin Ejecutivo) | qa_manager | Dashboard Analítico, Operativo, Pendientes; Dashboard Ejecutivo ausente | ✅ PASS |
| SEC-04: /reports/analytics con WAREHOUSEMAN → redirige | qa_warehouse | URL cambia a / después del guard | ✅ PASS |
| WAREHOUSEMAN: sidebar muestra 2 sub-ítems | qa_warehouse | Solo Operativo y Pendientes visibles | ✅ PASS |
| SEC-06: /reports/operational con SALES → redirige | qa_sales | URL cambia a / después del guard | ✅ PASS |
| SALES: sidebar muestra 1 sub-ítem (solo Pendientes) | qa_sales | Solo "Pendientes" visible; sin "Compras" | ✅ PASS |

### Cierre Propuesta D (2026-06-16)

**Suite completa con cobertura:**  
`ng test --no-watch --coverage` → **401 specs, 0 fallos**

| Métrica | Resultado | Umbral |
|---|---|---|
| Statements | 89.89% (2393/2662) | ≥ 70% ✅ |
| Branches | 87.11% (879/1009) | ≥ 70% ✅ |
| Functions | 84.06% (306/364) | ≥ 70% ✅ |
| Lines | 94.85% (1715/1808) | ≥ 70% ✅ |

**Regresión (módulos anteriores):** 401 specs — 0 nuevos fallos introducidos por el módulo Reports.

**Verificación browser completa — 4 roles (2026-06-15/16):**  
94 casos verificados en `casos_de_prueba_modulo_reports.md` — 82 PASS + 12 N/A + 0 FAIL + 0 PENDIENTE.

**Ronda de verificación browser adicional (2026-06-16) — 10 casos pendientes:**

| Caso | Resultado | Método |
|---|---|---|
| EMPTY-OPE-01 | ✅ PASS browser | +5/+4/+3/+2 IN en 4 productos bajo mínimo → "Todos los productos tienen stock suficiente" |
| EMPTY-OPE-02 | ✅ PASS browser | (ya verificado sesión anterior — LUBR-ACE20-035 + período 2030) |
| EMPTY-ANA-03 | ✅ PASS browser | (ya verificado sesión anterior — Por Proveedor + período 2030) |
| FLOW-EJE-02 | ✅ PASS browser | Backend detenido → "No se pudieron cargar los datos del dashboard" + snackbar rojo; sin pantalla en blanco (L33) |
| EMPTY-PEN-01 | ✅ PASS browser | OC-2026-0097 cancelada → "No hay órdenes de compra pendientes" verificado; restaurado como OC-2026-0098 |
| RN-ANA-04 | N/A | Query GROUP BY sin LEFT JOIN → MAX(receivedAt) nunca null; guarda en template verificada por código |
| RN-OPE-02 | N/A | Productos con COGS son "SKU-SO-*" (datos integración, no accesibles por UI); escenario no reproducible sin BD directa |
| EMPTY-PEN-02 | N/A | 25 OV pendientes/aprobadas — cancelación masiva distorsionaría datos; template verificado por código |
| RN-EJE-01 | ✅ PASS | (ya verificado sesión anterior) |
| EMPTY-OPE-03 | ✅ PASS | (ya verificado sesión anterior) |

Distribución final por pantalla:
- `/reports/pending` (13 casos): 11 PASS, 2 N/A — verificado ADMIN, MANAGER, WAREHOUSEMAN, SALES
- `/reports/operational` (22 casos): 19 PASS, 3 N/A — verificado ADMIN, MANAGER, WAREHOUSEMAN
- `/reports/analytics` (21 casos): 17 PASS, 4 N/A — verificado ADMIN, MANAGER
- `/reports/executive` (13 casos): 12 PASS, 1 N/A — verificado ADMIN
- SEC + RBAC (22 casos): 22 PASS — verificado los 4 roles con acceso directo por URL
- ERR globales (3 casos): 1 PASS, 2 N/A

---

## 8. Bugs y retos durante el desarrollo

| ID | Componente | Descripción | Fix |
|---|---|---|---|
| BUG-REP-01 | `operational-report.component.ts` | `TypeError: params.search?.trim is not a function` en autocomplete del Kardex al seleccionar un producto del dropdown. Causa: `switchMap` no descartaba valores objeto `ProductResponseDTO`. | `typeof value !== 'string' \|\| value.length < 2` en el guard del switchMap |
| BUG-REP-02 | `operational-report.component.html` | Tab "Rotación" visible para WAREHOUSEMAN; el backend retorna 403 porque `SecurityConfig` solo autoriza ADMIN y MANAGER en ese endpoint. | `*ngIf="canViewTurnover"` en el `mat-tab`; getter `canViewTurnover` verifica `ROLE_ADMIN \|\| ROLE_MANAGER` |
| BUG-REP-03 | `operational-report.component.html` | Botón "Consultar" en tab Movimientos (y Rotación) no se deshabilitaba cuando `from > to` — solo tenía `[disabled]="movLoading"`, sin validación de rango de fechas. | Agregar `\|\| datesInvalidError(movFromCtrl.value, movToCtrl.value)` a la condición `[disabled]` de ambos botones |
| BUG-REP-05 | `app.config.ts` + `core/date/dd-mm-yyyy-date-adapter.ts` | **(Ronda 8/10, 2026-06-28)** Los MatDatepicker mostraban y parseaban en `M/d/yyyy` (default en-US del adapter nativo), en contra del estándar `dd/MM/yyyy` (CLAUDE.md). Un primer fix con `MAT_DATE_LOCALE='es-PE'` + `MAT_DATE_FORMATS` corrigió solo el **formato de salida**; la Fase 3 estricta destapó que el adapter nativo **parsea el tecleo con `new Date()` ignorando el locale** (desajuste parse/display: teclear "31/12/2026" → rechazado). | `DdMmYyyyDateAdapter extends NativeDateAdapter` (override de `parse()` para dd/MM/yyyy con validación de fecha real) + provisto en `app.config.ts`. **Blast radius global** (todos los datepickers; solo Reportes los usa). 6 specs en `dd-mm-yyyy-date-adapter.spec.ts`. _(El fix complementario backend de CYBER-05 — `MethodArgumentTypeMismatchException`→400 — está en la memoria del módulo reports del backend.)_ |

---

## 9. Estándares y buenas prácticas aplicadas

- L29: matriz de campos sensibles × roles documentada en §4.1 antes de codificar.
- L30: sin endpoints de autenticación nuevos. Interceptor global activo.
- L31: sin diálogos con formularios en este módulo (solo lectura). Si se añade uno en el futuro, usar `disableClose: true`.
- L32: todas las tablas usarán `@include mixins.catalog-table-header` (Fase 2-4).
- L33: `forkJoin` en V4 (Dashboard Ejecutivo) envuelve cada observable con `catchError`.
- L34: sin columnas de acciones en tablas (módulo de solo lectura). Si una fila es clickeable, usar patrón `mat-row` con `(click)`.
- L35: usuarios QA permanentes (`qa_manager`/`qa_sales`/`qa_warehouse`) para verificación RBAC.

---

## 10. Cumplimiento y validación

### Checklist Propuesta D — Condiciones para declarar "done"

- [✓] Todos los casos de `casos_de_prueba_modulo_reports.md` con ✅ PASS o N/A (0 PENDIENTE) — **R10 estricta 2026-06-28: 96 PASS + 13 N/A** (109 casos con CYBER); ronda 1: 82+12 (2026-06-16)
- [✓] `ng test --no-watch --coverage` → **462 specs, 0 fallos; 88.94% statements** (≥ 70%) — 2026-06-28; `mvn test` 406/406
- [✓] Prueba browser con los 4 roles documentada — R10 lectura literal estricta 2026-06-28
- [✓] Columna Estado del documento de casos completamente llena (ningún ⏳ PENDIENTE) — 2026-06-28
- [✓] **Fixes Fase 2 (BUG-REP-05 fecha + CYBER-05 backend 400)** aplicados, gatekeeper verde, Fase 3 estricta re-ejecutada — 2026-06-28

### Estado por fase

| Fase | Descripción | Estado |
|---|---|---|
| 0 | Infraestructura del módulo | ✅ Completa (2026-06-15) |
| 1 | V1: Operaciones Pendientes | ✅ Completa (2026-06-15) |
| 2 | V2: Reportes Operativos | ✅ Completa (2026-06-15/16) |
| 3 | V3: Dashboard Analítico | ✅ Completa (2026-06-15/16) |
| 4 | V4: Dashboard Ejecutivo | ✅ Completa (2026-06-15/16) |
| 5 | Cierre y Propuesta D | ✅ Completa (2026-06-16) |
