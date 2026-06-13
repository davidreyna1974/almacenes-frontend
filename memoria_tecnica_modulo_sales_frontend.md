# Memoria Técnica — Módulo 4: Ventas (Sales) — frontend

**Versión:** 0.1 — en desarrollo (FASE 0/1)
**Fecha de inicio:** 2026-06-13
**Fecha de cierre:** —
**Rama:** `feature/sales`
**Estado:** 🚧 En progreso

---

## Índice

1. [Contexto y justificación](#1-contexto-y-justificación)
2. [Decisiones de diseño](#2-decisiones-de-diseño)
3. [Especificación de componentes y vistas](#3-especificación-de-componentes-y-vistas)
4. [Servicios y contratos con el backend](#4-servicios-y-contratos-con-el-backend)
5. [Algoritmos y lógica no trivial](#5-algoritmos-y-lógica-no-trivial)
6. [RBAC — criterio de visibilidad por rol](#6-rbac--criterio-de-visibilidad-por-rol)
7. [Ejecución de tests y resultados](#7-ejecución-de-tests-y-resultados)
8. [Bugs y retos durante el desarrollo](#8-bugs-y-retos-durante-el-desarrollo)
9. [Estándares y buenas prácticas aplicadas](#9-estándares-y-buenas-prácticas-aplicadas)
10. [Cumplimiento y validación](#10-cumplimiento-y-validación)

---

## 1. Contexto y justificación

El Módulo 4 — Ventas gestiona el ciclo de vida completo de las órdenes de venta:
creación con líneas de producto, aprobación (que reserva stock), entrega física
(que decrementa el inventario) y cancelación. Es el espejo funcional de Compras
(Módulo 3), pero con una máquina de estados distinta (`PENDING → APPROVED →
DELIVERED`, con `CANCELLED` alcanzable desde `PENDING` o `APPROVED`) y con un
concepto nuevo que Sales es el primer módulo en escribir activamente:
**reservas de stock** (`Product.reservedStock`), introducido en el DTO de
productos desde el Módulo 2 (Inventory) pero sin escritores hasta ahora.

El backend está completamente implementado y probado (0 fallos, 80 tests del
módulo `sales`). El frontend consumirá:

- 5 endpoints de clientes (`/sales/clients/**`)
- 13 endpoints de órdenes de venta (`/sales/orders/**`)
- 5 endpoints de reservas (`/sales/reservations/**`, solo lectura)

**Audiencias del módulo** (matriz de acceso global,
`memoria_tecnica_global_proyecto.md` §4):

| Rol | Acceso |
|---|---|
| ADMIN / MANAGER | Completo — CRUD clientes (incl. desactivar), crear/editar/aprobar/entregar/cancelar órdenes, ver reservas |
| SALES | Crear/editar/cancelar órdenes propias del flujo PENDING/APPROVED, CRUD de clientes excepto desactivar, lectura de reservas |
| WAREHOUSEMAN | Lectura de órdenes y reservas, entrega de órdenes APPROVED (única escritura permitida) |

A diferencia de Compras (donde SALES no tenía acceso alguno), **Sales es el
primer módulo visible y operable por los 4 roles** — el primero donde se aplica
realmente, de extremo a extremo, la matriz L29 de campos sensibles × roles.

**Dependencias:** Módulo 2 (Inventory) — los detalles de órdenes referencian
productos del catálogo (`ProductService`, `StockBadgeComponent`); Módulo 3
(Purchases) — patrones de tabs por estado, master-detail, diálogos de
confirmación con preview de stock.

**Hallazgos pre-código documentados** (no bloquean el inicio, ver D7 en §2):

- **H1** — `SaleOrderServiceImpl`/`ClientServiceImpl` usan `RuntimeException`
  genérica para reglas de negocio → backend responde **500** en vez de
  **404/409/422**. Incluye el caso de `ObjectOptimisticLockingFailureException`
  enmascarado en `approveOrder()` (debería ser 409, llega como 500). El mensaje
  de negocio llega igual en `err.error?.message` — el frontend no se bloquea.
- **H2** — `SaleOrderDetailResponseDTO.unitCost` no tiene redacción por rol
  (continuación de L29/BUG-INV-11). Mitigación 100% frontend desde FASE 4:
  columna `unitCost`/margen excluida de `displayedColumns` para
  WAREHOUSEMAN/SALES. **RESUELTO 2026-06-13** — además se agregó redacción en
  backend (commit `1f3b41e`); ver §8.
- **H3 (potencial, D8)** — verificar en FASE 1 (solo lectura) si
  `SaleOrderServiceImpl.approveOrder()` está anotado `@Transactional`, para
  garantizar rollback de reservas parciales si una línea falla por optimistic
  locking. Se documenta aquí si falta, sin corregir sin autorización.

---

## 2. Decisiones de diseño

### D1. Creación de orden en ruta separada (`/sales/orders/new`)

Igual razonamiento que Compras D1: el formulario de cabecera (cliente, notas) +
gestión de líneas de detalle (agregar/editar/eliminar) requiere toda la altura
de pantalla. `SaleOrderDetailPageComponent` se reutiliza para `/sales/orders/new`
(modo creación) y `/sales/orders/:id` (modo edición/vista) — la ruta `orders/new`
debe registrarse ANTES de `orders/:id` en `sales.routes.ts` para que el router no
interprete `"new"` como un `:id` (gate de seguridad, Propuesta C).

### D2. Tab activa por defecto = Pendientes

Igual razonamiento que Compras D2, reforzado porque SALES es el operador
principal del módulo y necesita actuar de inmediato sobre sus órdenes PENDING
(editar, aprobar si es ADMIN/MANAGER, o cancelar).

### D3. Selector de producto = `MatAutocomplete`

`"[SKU] — Nombre (disponible: N)"` usando `availableStock` (`currentStock -
reservedStock`) del `ProductService` existente — mismo patrón que Compras D3.
Los productos ya presentes en la orden se deshabilitan en el autocomplete (R11).

### D4. Historial de estado como tabla de 3 filas

Tabla "Aprobada por / Entregada por / Cancelada por" + timestamp, con `"—"` en
las filas que no aplican según el estado actual de la orden — igual que Compras
D4. Más legible que un timeline y consistente con el estilo de tabla del proyecto.

### D5. Formulario de cliente = `MatDialog`

`ClientDialogComponent` (análogo a `SupplierDialogComponent` de Compras) en
lugar de panel inline master-detail. Justificación: Cliente ~ Proveedor es la
entidad más análoga ya implementada en el proyecto; reutilizar el patrón reduce
riesgo. `disableClose: true` por defecto (L31).

### D6. Visibilidad de `totalAmount`/`unitPrice`/`subtotal` para WAREHOUSEMAN — RESUELTO ✅

**Opción confirmada: (a) VISIBLE para WAREHOUSEMAN.** No es información de
costo/margen — es contexto operativo del pedido que WAREHOUSEMAN va a entregar.
Esta decisión NO afecta a `unitCost` (H2/L29), que permanece oculto para
WAREHOUSEMAN/SALES en todos los casos (matriz §6.2). Aplica a:

- `SaleOrdersPageComponent`: columna "Total" visible en las 4 tabs para WAREHOUSEMAN
- `SaleOrderDetailPageComponent`: `totalAmount` en cabecera y columnas
  `unitPrice`/`subtotal` en la tabla de detalles visibles para WAREHOUSEMAN
  (solo `unitCost`/margen permanece oculto)
- `ReservationsPageComponent`: `totalReservedValue`/`unitPrice` ya eran visibles
  para todos (sin cambios)

### D7. H1 y H2 — RESUELTO ✅

- **H2** no bloquea el inicio del módulo: es 100% frontend. Desde FASE 4,
  `SaleOrderDetailFormComponent` y la tabla de detalles de
  `SaleOrderDetailPageComponent` nunca leen ni renderizan `unitCost`/margen
  para WAREHOUSEMAN/SALES (excluido de `displayedColumns`, no solo CSS),
  independientemente de si el backend ya redacta. La redacción de backend
  (`redactUnitCost`, análogo a BUG-INV-11) se implementó el 2026-06-13
  (commit `1f3b41e`) como defensa en profundidad — ver §8.
- **H1** se intenta resolver en backend EN PARALELO durante FASE 1, sujeto a
  autorización explícita en el momento (cambios acotados a
  `SaleOrderServiceImpl`/`ClientServiceImpl`: migrar `RuntimeException` →
  `BusinessRuleException`/`ResourceNotFoundException`/`DuplicateResourceException`
  según corresponda, incluyendo el caso de `ObjectOptimisticLockingFailureException`
  enmascarado en `approveOrder()`). Si no se autoriza, los casos `ERR-*` del
  documento de pruebas documentan el código real (500) con nota "pendiente
  backend" — el módulo puede cerrarse igual (el mensaje siempre llega en
  `err.error?.message`, L9).

### D8. Verificación de transaccionalidad de `approveOrder()` — NUEVO

Punto de verificación de solo lectura durante FASE 1: confirmar que
`SaleOrderServiceImpl.approveOrder()` esté anotado `@Transactional`, de forma
que si la reserva de la línea N falla por `ObjectOptimisticLockingFailureException`,
las reservas ya flusheadas de las líneas 1..N-1 (vía `saveAndFlush()`) se
reviertan completas (rollback), evitando reservas parciales/inconsistentes. Si
NO está `@Transactional`, se documenta como **H3** en §8, sin corregir sin
autorización.

---

## 3. Especificación de componentes y vistas

### Estructura de rutas

```
/sales                       → SalesComponent (shell con sidebar activo)
  /sales/clients             → ClientsPageComponent
  /sales/orders              → SaleOrdersPageComponent
  /sales/orders/new          → SaleOrderDetailPageComponent (modo creación)
  /sales/orders/:id          → SaleOrderDetailPageComponent (modo edición/vista)
  /sales/reservations        → ReservationsPageComponent (dashboard de reservas)
```

`app.routes.ts`:

```typescript
{
  path: 'sales',
  canActivate: [authGuard],
  data: { roles: ['ROLE_ADMIN','ROLE_MANAGER','ROLE_WAREHOUSEMAN','ROLE_SALES'] },
  loadChildren: () => import('./modules/sales/sales.routes').then(m => m.SALES_ROUTES)
}
```

`sales.routes.ts` (Propuesta C — gate de seguridad, `orders/new` ANTES de `orders/:id`):

```typescript
{ path: 'clients',       component: ClientsPageComponent }
{ path: 'orders',        component: SaleOrdersPageComponent }
{
  path: 'orders/new', component: SaleOrderDetailPageComponent,
  canActivate: [authGuard],
  data: { roles: ['ROLE_ADMIN','ROLE_MANAGER','ROLE_SALES'] }  // WAREHOUSEMAN no crea
}
{ path: 'orders/:id',     component: SaleOrderDetailPageComponent }
{ path: 'reservations',   component: ReservationsPageComponent }
```

### Estructura de archivos (`src/app/modules/sales/`)

```
sales.component.ts/.html
sales.routes.ts
services/
  client.service.ts          (+ .spec.ts)
  sale-order.service.ts       (+ .spec.ts)
  reservation.service.ts      (+ .spec.ts)
models/
  client.model.ts
  sale-order.model.ts
  reservation.model.ts
components/
  clients-page/                          (smart, master-detail)
  client-dialog/                         (MatDialog, disableClose L31)
  client-form/                           (dumb)
  sale-orders-page/                      (smart, tabs por estado)
  sale-order-detail-page/                (smart, cabecera + detalles)
  sale-order-detail-form/                (dumb, diálogo agregar/editar línea)
  reservations-page/                     (smart, dashboard de reservas)
  reserved-product-row/ (opcional, dumb) (fila expandible producto→órdenes)
  reserved-client-row/  (opcional, dumb) (fila expandible cliente→órdenes)
```

### Sidebar

Ventas se expande como grupo con tres hijos:

- Clientes → `/sales/clients`
- Órdenes de venta → `/sales/orders`
- Reservas → `/sales/reservations`

Ventas visible para los 4 roles — primer módulo visible para todos. Para
WAREHOUSEMAN y SALES, los hijos visibles se filtran según permisos (§6.1).

### Breadcrumb (topbar)

| Ruta | Breadcrumb |
|---|---|
| `/sales/clients` | "Ventas → Clientes" |
| `/sales/orders` | "Ventas → Órdenes de venta" |
| `/sales/orders/:id` (y `/new`) | "Ventas → Detalle de orden" |
| `/sales/reservations` | "Ventas → Reservas de stock" |

### Vista A — Clientes (`/sales/clients`)

Layout: master-detail (mismo patrón que Proveedores en Compras).

**Panel izquierdo (~40%)** — `ClientsPageComponent`: tabla paginada de clientes
activos.
- Columnas: Nombre, RFC, Contacto, Teléfono, Email, Acciones
- Botón "Nuevo cliente" — visible ADMIN/MANAGER/SALES (no WAREHOUSEMAN)
- Búsqueda con debounce 350ms sobre `name`/`rfc`/`contactName`
  (accent-insensitive, `f_unaccent` en backend — confirmado en
  `GET /clients/active?search=`)
- Fila seleccionada: fondo `#F2E4F2`
- Reset de paginador a página 0 al cambiar búsqueda (L31)

**Panel derecho (~60%)** — `ClientFormComponent` (dumb), abierto vía
`ClientDialogComponent` (`MatDialog`, `disableClose: true`, L31 — D5).
- Campos: Nombre, RFC, Nombre de contacto, Teléfono, Email, Dirección
- Modo creación/edición: ADMIN/MANAGER/SALES — todos los campos habilitados
- WAREHOUSEMAN: panel de solo lectura (sin botón Guardar/Nuevo/Desactivar)
- Botón Guardar: requiere `form.dirty` en edición (L25)
- Botón Desactivar: solo ADMIN/MANAGER (`DELETE /clients` excluye SALES) →
  `ConfirmDialogComponent`; el backend puede rechazar si el cliente tiene
  órdenes PENDING/APPROVED (verificar regla exacta en `ClientServiceImpl` al
  implementar)

### Vista B — Lista de órdenes (`/sales/orders`)

Layout: pantalla completa con tabs de estado (igual que Compras).

Tabs: `[Pendientes | Aprobadas | Entregadas | Canceladas]` =
`PENDING | APPROVED | DELIVERED | CANCELLED`. Cada tab muestra el conteo
(`counts: Map<status, number>` separado de `pages: Map<status, PageResponse>`,
L23/L24). Tab activo por defecto: Pendientes (D2). Reset de paginador a página 0
al cambiar de tab/búsqueda (L31).

Tabla por tab — Columnas: N° Orden, Cliente, Total, Creado por, Fecha, Estado,
Acciones. `totalAmount` visible para los 4 roles incluyendo WAREHOUSEMAN (D6).

Acciones por fila (con `$event.stopPropagation()` — L27):

| Rol | PENDING | APPROVED | DELIVERED / CANCELLED |
|---|---|---|---|
| ADMIN / MANAGER | Ver, Editar, Aprobar, Cancelar | Ver, Entregar, Cancelar | Ver |
| SALES | Ver, Editar, Cancelar (NO Aprobar) | Ver, Cancelar (NO Entregar) | Ver |
| WAREHOUSEMAN | Ver | Ver, Entregar (única escritura) | Ver |

Botón "Nueva orden": visible ADMIN/MANAGER/SALES → navega a `/sales/orders/new`.

### Vista C — Detalle de orden (`/sales/orders/:id` y `/sales/orders/new`)

Layout: igual que Compras — cabecera + tabla de detalles, en una sola página
completa (no master-detail).

**Cabecera de la orden:**
- N° Orden (solo lectura, generado `OV-YYYY-NNNN`), Estado (badge), Cliente
  (autocomplete de clientes activos), Notas
- Total de la orden, fecha de creación, usuario creador
- Historial de estado (tabla de 3 filas — D4): Aprobada por / Entregada por /
  Cancelada por + timestamp, `"—"` si no aplica

Campos editables en PENDING: ADMIN/MANAGER/SALES editan Cliente y Notas;
WAREHOUSEMAN nunca edita la cabecera (solo lectura siempre).

**Botones de transición** (según estado y rol — matriz completa en §6.1):

| Estado | ADMIN/MANAGER | SALES | WAREHOUSEMAN |
|---|---|---|---|
| PENDING | Guardar cambios (L25), Aprobar, Cancelar | Guardar cambios (L25), Cancelar | (ninguno) |
| APPROVED | Entregar, Cancelar | Cancelar (NO Entregar) | Entregar (único) |
| DELIVERED / CANCELLED | (ninguno) | (ninguno) | (ninguno) |

**Confirmaciones obligatorias** (irreversibles, impactan stock):

- Aprobar → `ConfirmDialogComponent` con preview de `availableStock` por
  producto vs `quantity` solicitada (R4) ANTES de confirmar
- Entregar → `ConfirmDialogComponent` con preview de `currentStock` por
  producto vs `quantity` (R7)
- Cancelar → `ConfirmDialogComponent` (mensaje distinto si `status=APPROVED`,
  advirtiendo que libera la reserva — R10)

**Tabla de detalles** — Columnas: Producto (SKU + Nombre), Cantidad, Precio
unitario, Subtotal, [Costo unitario/Margen — solo ADMIN/MANAGER, H2/L29],
Acciones.
- PENDING + (ADMIN/MANAGER/SALES): botón "Agregar detalle", iconos
  Editar/Eliminar por fila (protección L26 — no eliminar la última línea)
- Otros estados / WAREHOUSEMAN: solo lectura, sin columna de costo/margen

**Diálogo Agregar/Editar detalle** (`SaleOrderDetailFormComponent`,
`disableClose: true`, L31):

- `productId` → `MatAutocomplete` de productos activos; deshabilita los ya
  presentes en la orden (R11); muestra `"[SKU] — Nombre (disponible: N)"`
  usando `availableStock` (D3)
- `quantity` → number input, min 1; advertencia visual si
  `quantity > availableStock` (preventivo de R4, no bloquea el guardado del
  detalle — el bloqueo real es al Aprobar)
- `unitPrice` → number input (currency), pre-rellenado con `Product.price`,
  editable (R13)
- `subtotal` → texto calculado en tiempo real (`quantity × unitPrice`)

**Badge de estado** (`StatusLabelPipe`):

| Estado | Fondo | Texto | Ícono |
|---|---|---|---|
| PENDING | `#FFF3E0` | `#E65100` | `schedule` |
| APPROVED | `#E3F2FD` | `#1565C0` | `check_circle` |
| DELIVERED | `#E8F5E9` | `#2E7D32` | `done_all` |
| CANCELLED | `#FFEBEE` | `#C62828` | `cancel` |

### Vista D — Reservas (`/sales/reservations`)

Layout: dashboard de una sola columna, sin master-detail. Visible para los 4
roles.

- **Resumen** (`ReservationSummaryDTO`): 4 tarjetas — total de productos con
  reservas, total de unidades reservadas, valor total reservado
  (`totalReservedValue`, precio de venta NO costo — visible para todos según
  L29), total de órdenes APPROVED
- **"Por producto"** (`GET /reservations/products`): tabla expandible — cada
  fila = producto (SKU, nombre, `totalReservedQty`, `unitPrice`,
  `totalReservedValue`); al expandir, sub-tabla `ReservedProductOrderDTO`
  (orderId/orderNumber, quantity, subtotal, clientId/clientName, approvedAt) —
  click en `orderNumber` navega a `/sales/orders/:id?from=reservations`
- **"Por cliente"** (`GET /reservations/clients`): misma estructura,
  `ReservedClientDTO` expandible → `ReservedClientOrderDTO`

(L33) Las 3 llamadas (`summary`, `products`, `clients`) se combinan con
`forkJoin`. Las 3 son accesibles para los 4 roles según `SecurityConfig`, por lo
que no se requiere `catchError` por RBAC — pero se mantiene el patrón
`catchError(() => of(<default vacío>))` por cada observable como defensa ante
404/500 aislados (p.ej. backend con datos inconsistentes), para que un fallo en
una sección no rompa el dashboard completo.

---

## 4. Servicios y contratos con el backend

> Verificado contra el código fuente del backend
> (`SaleOrderServiceImpl`, `ClientServiceImpl`, `GlobalExceptionHandler`,
> `SecurityConfig`) y `propuesta_modulo_sales_frontend.txt` §3.

BASE URL: `http://localhost:8080/api/v1`

### Clientes

| Método | Endpoint | Status | Response | RBAC |
|---|---|---|---|---|
| POST | `/sales/clients` | 201 | `ClientDTO` | ADMIN, MANAGER, SALES |
| GET | `/sales/clients/active?search=&page=0&size=20` | 200 | `PageResponse<ClientDTO>` | ADMIN, MANAGER, WAREHOUSEMAN, SALES |
| GET | `/sales/clients/{id}` | 200 | `ClientDTO` | ADMIN, MANAGER, WAREHOUSEMAN, SALES |
| PUT | `/sales/clients/{id}` | 200 | `ClientDTO` | ADMIN, MANAGER, SALES |
| DELETE | `/sales/clients/{id}` | 204 | `void` (desactivación lógica) | ADMIN, MANAGER (SALES explícitamente excluido) |

`search` es opcional, parcial sobre `name`/`rfc`/`contact_name`, insensible a
mayúsculas/acentos vía `f_unaccent` — omitir el parámetro si está vacío
(estándar §7 memoria global).

### Órdenes de venta

| Método | Endpoint | Status | Response | RBAC |
|---|---|---|---|---|
| POST | `/sales/orders` | 201 | `SaleOrderResponseDTO` | ADMIN, MANAGER, SALES |
| GET | `/sales/orders/{id}` | 200 | `SaleOrderResponseDTO` | ADMIN, MANAGER, WAREHOUSEMAN, SALES |
| GET | `/sales/orders/status/{status}?page=0&size=20` | 200 | `PageResponse<SaleOrderResponseDTO>` (Sort `createdAt DESC`) | ADMIN, MANAGER, WAREHOUSEMAN, SALES |
| GET | `/sales/orders/client/{clientId}` | 200 | `List<SaleOrderResponseDTO>` (NO paginada) | ADMIN, MANAGER, WAREHOUSEMAN, SALES |
| GET | `/sales/orders/client/{clientId}/status/{s}` | 200 | `List<SaleOrderResponseDTO>` (NO paginada) | ADMIN, MANAGER, WAREHOUSEMAN, SALES |
| GET | `/sales/orders/product/{productId}` | 200 | `List<SaleOrderResponseDTO>` (NO paginada) | ADMIN, MANAGER, WAREHOUSEMAN, SALES |
| GET | `/sales/orders/product/{productId}/status/{s}` | 200 | `List<SaleOrderResponseDTO>` (NO paginada) | ADMIN, MANAGER, WAREHOUSEMAN, SALES |
| PUT | `/sales/orders/{id}` | 200 | `SaleOrderResponseDTO` (solo PENDING) | ADMIN, MANAGER, SALES |
| PATCH | `/sales/orders/{id}/approve` | 200 | `SaleOrderResponseDTO` (sin body) | ADMIN, MANAGER |
| PATCH | `/sales/orders/{id}/deliver` | 200 | `SaleOrderResponseDTO` (sin body) | ADMIN, MANAGER, WAREHOUSEMAN |
| PATCH | `/sales/orders/{id}/cancel` | 200 | `SaleOrderResponseDTO` (sin body) | ADMIN, MANAGER, SALES |
| POST | `/sales/orders/{id}/details` | 201 | `SaleOrderResponseDTO` (orden completa) | ADMIN, MANAGER, SALES |
| PUT | `/sales/orders/{id}/details/{detailId}` | 200 | `SaleOrderResponseDTO` (orden completa) | ADMIN, MANAGER, SALES |
| DELETE | `/sales/orders/{id}/details/{detailId}` | 204 | `void` | ADMIN, MANAGER, SALES |

> El orden de los matchers en `SecurityConfig` es significativo: `/approve`,
> `/deliver`, `/cancel` están antes del matcher genérico `PATCH` (ADMIN,
> MANAGER, SALES).

### Reservas (solo lectura)

| Método | Endpoint | Status | Response | RBAC |
|---|---|---|---|---|
| GET | `/sales/reservations/summary` | 200 | `ReservationSummaryDTO` | ADMIN, MANAGER, WAREHOUSEMAN, SALES |
| GET | `/sales/reservations/products` | 200 | `List<ReservedProductDTO>` | ADMIN, MANAGER, WAREHOUSEMAN, SALES |
| GET | `/sales/reservations/products/{id}` | 200 | `ReservedProductDTO` | ADMIN, MANAGER, WAREHOUSEMAN, SALES |
| GET | `/sales/reservations/clients` | 200 | `List<ReservedClientDTO>` | ADMIN, MANAGER, WAREHOUSEMAN, SALES |
| GET | `/sales/reservations/clients/{id}` | 200 | `ReservedClientDTO` | ADMIN, MANAGER, WAREHOUSEMAN, SALES |

### DTOs — interfaces TypeScript (nombres exactos verificados)

```typescript
// client.model.ts
export interface ClientDTO {
  id: number;
  name: string;
  rfc?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  active: boolean;
  createdAt: string;
  createdById: number;
  createdByUsername: string;
  updatedAt?: string;
  updatedById?: number;
  updatedByUsername?: string;
}

export interface ClientRequestDTO {
  name: string;          // NotBlank, max 150
  rfc?: string;           // max 13
  contactName?: string;   // max 100
  phone?: string;         // max 20
  email?: string;         // formato válido
  address?: string;
}
```

```typescript
// sale-order.model.ts
export type SaleOrderStatus = 'PENDING' | 'APPROVED' | 'DELIVERED' | 'CANCELLED';

export interface SaleOrderDetailRequestDTO {
  productId: number;
  quantity: number;       // min 1
  unitPrice: number;       // min 0.01
  // unitCost NO se envía — el backend lo lee de Product.unitCost
}

export interface SaleOrderDetailUpdateRequestDTO {
  quantity: number;        // min 1
  unitPrice: number;        // min 0.01
  // productId NO se incluye (cambio de producto = delete + add)
}

export interface SaleOrderRequestDTO {
  clientId: number;
  notes?: string;
  details: SaleOrderDetailRequestDTO[];  // NotNull, Size(min=1)
}

export interface SaleOrderUpdateRequestDTO {
  clientId: number;
  notes?: string;
}

export interface SaleOrderDetailResponseDTO {
  id: number;
  quantity: number;
  unitPrice: number;
  unitCost: number | null;  // H2 — null para WAREHOUSEMAN/SALES (redactado en backend y oculto en frontend)
  subtotal: number;
  productId: number;
  productSku: string;
  productName: string;
}

export interface SaleOrderResponseDTO {
  id: number;
  orderNumber: string;     // OV-YYYY-NNNN, solo lectura
  status: SaleOrderStatus;
  notes?: string;
  totalAmount: number;     // calculado, solo lectura
  clientId: number;
  clientName: string;
  createdAt: string;
  createdById: number;
  createdByUsername: string;
  updatedAt?: string;
  updatedById?: number;
  updatedByUsername?: string;
  approvedAt?: string;
  approvedById?: number;
  approvedByUsername?: string;
  deliveredAt?: string;
  deliveredById?: number;
  deliveredByUsername?: string;
  cancelledAt?: string;
  cancelledById?: number;
  cancelledByUsername?: string;
  details: SaleOrderDetailResponseDTO[];
}
```

```typescript
// reservation.model.ts
export interface ReservationSummaryDTO {
  totalProductsWithReservations: number;
  totalReservedUnits: number;
  totalReservedValue: number;   // reservedStock × price (precio venta, no costo)
  totalApprovedOrders: number;
}

export interface ReservedProductOrderDTO {
  orderId: number;
  orderNumber: string;
  quantity: number;
  subtotal: number;
  clientId: number;
  clientName: string;
  approvedAt: string;
}

export interface ReservedProductDTO {
  productId: number;
  productSku: string;
  productName: string;
  totalReservedQty: number;
  unitPrice: number;
  totalReservedValue: number;
  orders: ReservedProductOrderDTO[];
}

export interface ReservedClientOrderDTO {
  orderId: number;
  orderNumber: string;
  totalAmount: number;
  approvedAt: string;
  totalItems: number;
}

export interface ReservedClientDTO {
  clientId: number;
  clientName: string;
  totalReservedOrders: number;
  totalReservedValue: number;
  orders: ReservedClientOrderDTO[];
}
```

### Campos de solo lectura (el backend los ignora o los genera)

| Campo | Origen |
|---|---|
| `orderNumber` | generado por el servicio (`OV-YYYY-NNNN`) — nunca editable |
| `totalAmount` | calculado (suma de subtotales) — nunca editable |
| `subtotal` | calculado (`quantity × unitPrice`) — nunca editable |
| `unitCost` | capturado de `Product.unitCost` al crear/actualizar detalle — nunca editable, redactado a `null` para WAREHOUSEMAN/SALES por el backend (H2/L29, RESUELTO) |
| `status` | solo cambia por `PATCH /approve`, `/deliver`, `/cancel` |
| `createdAt`/`updatedAt`/`approvedAt`/`deliveredAt`/`cancelledAt` | auditoría, solo lectura |
| `createdBy*`/`approvedBy*`/`deliveredBy*`/`cancelledBy*` | auditoría, solo lectura |

### Reglas de negocio del backend (`SaleOrderServiceImpl`)

| ID | Regla | Componente UI responsable |
|---|---|---|
| R1 | Edición solo en PENDING: `PUT /{id}`, `POST/PUT/DELETE details` — error si `status != PENDING` (H1: hoy 500, debería ser 422) | Botones Editar cabecera/Agregar/Editar/Eliminar detalle visibles solo si `status=PENDING` y el rol tiene escritura |
| R2 | Aprobación requiere ≥ 1 detalle — error si `details` vacío | Botón Aprobar deshabilitado si `details` vacío |
| R3 | Aprobación solo desde PENDING — error si `status != PENDING` | Botón Aprobar deshabilitado si `status != PENDING` |
| R4 | Aprobación valida disponibilidad en 2 fases (sin escrituras parciales): si `currentStock - reservedStock < quantity` para CUALQUIER detalle, NINGÚN producto se reserva → "Stock disponible insuficiente para 'X'. Disponible: N, solicitado: M." | Preview de `availableStock` por producto vs `quantity` en `ConfirmDialog` antes de confirmar Aprobar (`StockBadgeComponent`) |
| R5 | Aprobación exitosa: `reservedStock += quantity` por detalle (`saveAndFlush` + manejo de `ObjectOptimisticLockingFailureException` → "Stock modificado concurrentemente. Intente nuevamente.") | — (resultado verificable en Inventory tras la acción) |
| R6 | Entrega solo desde APPROVED — error si `status != APPROVED` | Botón Entregar visible solo si `status=APPROVED` |
| R7 | Entrega valida `currentStock >= quantity` (NO `availableStock` — la reserva de ESTA orden ya está en `reservedStock`) → "Stock físico insuficiente para 'X'." | Preview de `currentStock` por producto vs `quantity` en `ConfirmDialog` antes de confirmar Entregar |
| R8 | Entrega exitosa: `reservedStock -= quantity` + `registerStockMovement` tipo OUT con reason "Entrega orden de venta {orderNumber}" por detalle | — (verificable en Kardex de Inventory) |
| R9 | Cancelación bloqueada si `status == DELIVERED` ("ya entregada") o ya `CANCELLED` ("ya está cancelada") | Botón Cancelar oculto en DELIVERED/CANCELLED |
| R10 | Cancelación desde APPROVED libera la reserva: `reservedStock -= quantity` por detalle (cancelación desde PENDING no toca stock) | `ConfirmDialog` de Cancelar con mensaje distinto si `status=APPROVED`, advirtiendo liberación de reserva |
| R11 | `addDetail` rechaza producto duplicado en la misma orden ("ya existe en esta orden... use actualizar detalle") | Selector de producto en `addDetail` deshabilita productos ya presentes en la orden |
| R12 | `addDetail`/`createOrder`: producto debe existir y estar `active` | Selector de producto: solo productos activos |
| R13 | `unitPrice` del detalle es el precio pactado — puede diferir de `Product.price` | Campo `unitPrice` editable, pre-rellenado con `Product.price` |
| R14 | `unitCost` se re-lee de `Product.unitCost` en cada `addDetail`/`updateDetail` mientras PENDING (refleja costo actual, no el costo al momento de creación) | `unitCost`/margen NO se muestra en el formulario (H2/L29) |

### Formato de error del backend

Todas las respuestas de error (4xx/5xx) que pasan por `GlobalExceptionHandler`
devuelven el mismo shape JSON vía `buildResponse(status, message)`:

```json
{
  "timestamp": "2026-06-12T10:15:30.123456",
  "status": 422,
  "error": "Unprocessable Entity",
  "message": "Stock disponible insuficiente para 'Producto X'. Disponible: 3, solicitado: 5."
}
```

Patrón de consumo (L9, igual que Inventory/Purchases):

```typescript
catchError((err: HttpErrorResponse) => {
  const msg = err.error?.message ?? 'Error inesperado. Intente nuevamente.';
  this.snackBar.open(msg, 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
  return EMPTY;
})
```

El frontend NUNCA ramifica lógica de negocio según `err.status` — solo
`err.error?.message`. `err.status` solo se usa para los casos genéricos ya
cubiertos por `error.interceptor.ts` (401/403).

| Excepción | HTTP | Origen en Sales |
|---|---|---|
| `ResourceNotFoundException` | 404 | Ningún lugar actual — "no encontrado" usa `RuntimeException` (H1) |
| `DuplicateResourceException` | 409 | Ningún lugar actual — "producto duplicado en orden" usa `RuntimeException` (H1) |
| `BusinessRuleException` | 422 | Ningún lugar actual — stock insuficiente, transiciones de estado, etc. usan `RuntimeException` (H1) |
| `MethodArgumentNotValidException` | 400 | Validaciones `@Valid` de los DTOs de request (funciona correctamente) |
| `ObjectOptimisticLockingFailureException` (handler dedicado) | 409 | Solo si la excepción llega SIN convertir — en la práctica `approveOrder()` la re-lanza como `RuntimeException` → 500 (H1) |
| `RuntimeException` (genérica) | 500 | Todos los casos de Sales listados arriba (H1) |

El formato 400 de `MethodArgumentNotValidException` concatena los errores de
campo en un solo string: `"Validación fallida: clientId: no debe ser nulo;
details: tamaño debe estar entre 1 y 2147483647"` — el frontend muestra este
string completo en el snackbar, sin parsear campo por campo.

---

## 5. Algoritmos y lógica no trivial

_Pendiente — se documenta durante FASE 2-5._

---

## 6. RBAC — criterio de visibilidad por rol

### 6.1 Matriz de acceso por vista/acción

| Vista / Acción | ADMIN | MANAGER | WAREHOUSEMAN | SALES |
|---|:---:|:---:|:---:|:---:|
| Ver módulo Ventas en sidebar | ✓ | ✓ | ✓ | ✓ |
| Clientes — listar/ver | ✓ | ✓ | ✓ | ✓ |
| Clientes — crear/editar | ✓ | ✓ | — | ✓ |
| Clientes — desactivar | ✓ | ✓ | — | — |
| Órdenes — listar/ver (todas las tabs) | ✓ | ✓ | ✓ | ✓ |
| Órdenes — crear | ✓ | ✓ | — | ✓ |
| Órdenes — editar cabecera/detalles (PENDING) | ✓ | ✓ | — | ✓ |
| Órdenes — Aprobar (PENDING→APPROVED) | ✓ | ✓ | — | — |
| Órdenes — Entregar (APPROVED→DELIVERED) | ✓ | ✓ | ✓ | — |
| Órdenes — Cancelar (PENDING/APPROVED) | ✓ | ✓ | — | ✓ |
| Reservas — ver dashboard | ✓ | ✓ | ✓ | ✓ |

Helpers de componente (consistentes con `canWrite()`/`canReceive()` de Purchases):

```typescript
canManageClients()    → ADMIN | MANAGER | SALES
canDeactivateClient() → ADMIN | MANAGER
canCreateOrder()      → ADMIN | MANAGER | SALES
canEditOrder(order)   → (ADMIN | MANAGER | SALES) && order.status === 'PENDING'
canApprove(order)     → (ADMIN | MANAGER) && order.status === 'PENDING'
canDeliver(order)     → (ADMIN | MANAGER | WAREHOUSEMAN) && order.status === 'APPROVED'
canCancel(order)      → (ADMIN | MANAGER | SALES) && order.status in [PENDING, APPROVED]
canSeeCost()          → ADMIN | MANAGER  (H2/L29 — unitCost/margen)
```

### 6.2 Matriz de campos sensibles × roles (L29)

| Campo / DTO | ADMIN | MANAGER | WAREHOUSEMAN | SALES |
|---|---|---|---|---|
| `SaleOrderDetailResponseDTO.unitCost` | valor real | valor real | `null` (redactado en backend)* | `null` (redactado en backend)* |
| Margen derivado (`unitPrice - unitCost`) | visible | visible | ausente | ausente |
| `SaleOrderResponseDTO.totalAmount` (D6) | visible | visible | visible | visible |
| `SaleOrderDetailResponseDTO.unitPrice`/`subtotal` (D6) | visible | visible | visible | visible |
| `ReservationSummaryDTO.totalReservedValue` (precio venta) | visible | visible | visible | visible |
| `ReservedProductDTO.unitPrice`/`totalReservedValue` | visible | visible | visible | visible |
| `ClientDTO` (todos los campos) | visible | visible | visible | visible |

\* Redacción aplicada centralmente en `SaleOrderServiceImpl.redactUnitCost()`
(commit `1f3b41e`, 2026-06-13) — el backend retorna `unitCost: null` para
WAREHOUSEMAN/SALES en TODOS los endpoints de lectura/escritura. El frontend
además excluye `unitCost`/margen de `displayedColumns` (no solo CSS), como
defensa en profundidad.

### 6.3 Gate de seguridad de rutas (Propuesta C)

```
[ ] /sales              → canActivate: [authGuard], data.roles: [ADMIN, MANAGER, WAREHOUSEMAN, SALES]
[ ] /sales/orders/new   → canActivate: [authGuard], data.roles: [ADMIN, MANAGER, SALES] (no WAREHOUSEMAN)
[ ] Caso SEC: WAREHOUSEMAN navega por URL directa a /sales/orders/new → redirige
[ ] Caso SEC: SALES intenta Aprobar/Entregar vía curl en una orden cualquiera → 403
    (el botón no debe estar visible, pero el guard de ruta por sí solo no cubre
    botones — verificar 403 real a nivel de API)
```

---

## 7. Ejecución de tests y resultados

### FASE 1 — Modelos, servicios y rutas (sin UI)

**Servicios (2026-06-13):**
```
ng test --no-watch --include='**/sales/services/*.spec.ts'
→ 3 archivos, 23 specs, 0 fallos
```
- `client.service.spec.ts` — 6 specs (getActive con/sin search, getById, create,
  update, deactivate 204)
- `sale-order.service.spec.ts` — 11 specs (create, getById, getByStatus paginado,
  getByClientId, getByProductId, update, approve/deliver/cancel PATCH sin body,
  addDetail/updateDetail/removeDetail)
- `reservation.service.spec.ts` — 6 specs (getSummary, getProducts, getProductById,
  getClients, getClientById)

**Regresión completa (2026-06-13):**
```
ng test --no-watch
→ 22 archivos de test, 238 specs, 0 fallos
```
Incluye módulos 0-3 (auth, layout, shared, inventory, purchases) sin regresiones,
más los 23 specs nuevos de Sales (servicios). Las páginas placeholder de Sales
(`ClientsPageComponent`, `SaleOrdersPageComponent`, `SaleOrderDetailPageComponent`,
`ReservationsPageComponent`) no tienen specs propios todavía — se implementan en
FASE 2-5 junto con su lógica real.

**Rutas y navegación (FASE 1, sin prueba de navegador todavía):**
- `sales.routes.ts` creado con gate de seguridad (Propuesta C): `orders/new`
  restringido a `ROLE_ADMIN`/`ROLE_MANAGER`/`ROLE_SALES` (WAREHOUSEMAN no crea
  órdenes), registrado ANTES de `orders/:id`.
- `app.routes.ts`: `loadChildren` de `sales.routes` con
  `data.roles: ['ROLE_ADMIN','ROLE_MANAGER','ROLE_WAREHOUSEMAN','ROLE_SALES']`.
- Sidebar: "Ventas" convertido de ítem plano a grupo con 3 hijos (Clientes,
  Órdenes de venta, Reservas), visibles para los 4 roles (todos tienen acceso
  de lectura a `/sales/**` según RBAC backend).
- Topbar: 5 entradas de breadcrumb agregadas (`/sales/clients`, `/sales/orders/new`,
  `/sales/orders/`, `/sales/orders`, `/sales/reservations`), con el orden cuidado
  para que `/sales/orders/123` resuelva a "Ventas → Detalle de orden" y no a
  "Ventas → Órdenes de venta" (matching por `startsWith`).
- La prueba browser del caso SEC (WAREHOUSEMAN → `/sales/orders/new` redirige) se
  ejecuta en FASE 3-4 cuando `SaleOrdersPageComponent` exponga el botón "Nueva
  orden" y exista contenido real que verificar.

### FASE 2 — Clientes (CRUD completo) — pruebas de navegador (Propuesta B)

**Cobertura del documento de casos** (`casos_de_prueba_modulo_sales.md`,
secciones 1-2): 56 casos en ✅ PASS (incluye VIS-CLF-01 tras la corrección de
BUG-S4-01, ver §8), 2 en N/A con justificación, 0 en ❌ FAIL, 0 en
⏳ PENDIENTE dentro del alcance de esta fase
(VIS-CLI-01..08, BSRCH-CLI-01..06, RBAC-CLI-01..07, UI-CLI-01..04,
UI-CLI-PAG-01..03, EMPTY-CLI-01/02, UI-CLF-01..05, VIS-CLF-01, RBAC-CLF-01..04,
VAL-CLF-01..09, CRUD-CLF-01..09).

**Resumen por categoría:**

- **VIS-CLI-01..08** ✅ — header de tabla vía mixin `catalog-table-header` (L32),
  `.catalog-page`/`__table-wrapper` con `padding`/`gap`/`border-radius` correctos
  (L22), `mat-progress-bar` indeterminado al cargar.
- **BSRCH-CLI-01..06** ✅ — búsqueda parcial, case-insensitive y
  accent-insensitive confirmada con `[QA] Cliente Almacén Acentuado`
  ("almacen" encuentra "Almacén" vía `f_unaccent`).
- **RBAC-CLI-01..07 / RBAC-CLF-01..04** ✅ — verificado con los 4 roles
  (`admin`, `manager01`, `almacen01`, `ventas01`):
  - ADMIN/MANAGER: "Nuevo cliente" visible, ícono `edit`, "Desactivar" visible
    en el diálogo de edición.
  - WAREHOUSEMAN (`almacen01`): sin "Nuevo cliente", sin ícono de desactivar,
    ícono `visibility` ("Ver cliente") abre el diálogo en modo solo lectura
    (todos los campos `disabled`, sin Guardar/Desactivar).
  - SALES (`ventas01`): "Nuevo cliente" visible, ícono `edit`, diálogo editable
    SIN botón "Desactivar" (`DELETE /clients` excluye SALES).
- **UI-CLI-01..04 / UI-CLI-PAG-01..03 / UI-CLF-01..05** ✅ — todos los botones e
  íconos verificados uno a uno; reset de paginador a página 0 al cambiar
  búsqueda confirmado (mismo punto que dispara `load()`).
- **EMPTY-CLI-01** → **N/A** — no reproducible sin desactivar los ~50 clientes
  activos existentes (afectaría datos compartidos); mismo bloque de template y
  mismo `EmptyStateComponent` que EMPTY-CLI-02 (✅ PASS), solo cambia
  `variant`/`titleOverride` vs `descriptionOverride` — verificado por código
  (`clients-page.component.html` líneas 38-46).
- **EMPTY-CLI-02** ✅ — estado "Sin resultados" con búsqueda `"almacen01xyz"`.
- **VAL-CLF-01..09** ✅ — incluye verificación DOM de `maxLength` real:
  `{"name":"name","len":150,"maxLength":150},{"name":"contactName","len":100,"maxLength":100},{"name":"phone","len":20,"maxLength":20}`.
- **VIS-CLF-01** ✅ — **BUG-S4-01** (doble asterisco "Nombre **") corregido, ver §8.
- **CRUD-CLF-01..09** ✅ / N/A — ciclo de vida completo (crear → editar →
  desactivar) ejecutado sobre `[QA] Cliente Almacén Acentuado` (L33: dato
  propio de prueba, prefijado `[QA]`, desactivado al finalizar).
  CRUD-CLF-09 (desactivar cliente con órdenes PENDING/APPROVED) → **N/A**:
  la regla existe y está verificada por código en
  `ClientServiceImpl.deactivateClient()` (lanza `BusinessRuleException` si
  `saleOrderRepository.findActiveOrdersByClient(id)` no está vacío), pero no es
  reproducible en browser hasta que existan Sales Orders (FASE 3-4).

**Suite del módulo (2026-06-13):**
```
ng test --no-watch --include='**/sales/**/*.spec.ts'
→ 4 archivos, 38 specs, 0 fallos
ng test --no-watch --include='**/sales/**/*.spec.ts' --coverage
→ Statements 88.12% (141/160), Branches 91.75%, Functions 96.55%, Lines 92.56%
```
Cobertura ≥ 70% statements cumplida (88.12%).

**Regresión completa (2026-06-13):**
```
ng test --no-watch
→ 23 archivos, 253 specs, 0 fallos
```
Sube de 238 (FASE 1) a 253 specs — los 15 specs nuevos corresponden a
`client-form.component.spec.ts` (FASE 2). Sin regresiones en módulos 0-3.

---

### FASE 3 — Lista de órdenes de venta (`SaleOrdersPageComponent`) — pruebas de navegador (Propuesta B)

**Cobertura del documento de casos** (`casos_de_prueba_modulo_sales.md`,
sección 3): 27 casos en ✅ PASS, 2 en N/A con justificación, 0 en ❌ FAIL,
0 en ⏳ PENDIENTE dentro del alcance de esta fase
(VIS-ORD-01..08, RBAC-ORD-01..11, UI-ORD-01..06, EMPTY-ORD-01/02,
UI-ORD-PAG-01..03, FLOW-ORD-01/02).

**Resumen por categoría:**

- **VIS-ORD-01..08** ✅ — título, 4 tabs con badges (19/19/19/334 inicial),
  6 columnas + columna Acciones, badges de estado con los 4 colores semánticos,
  botón "Nueva orden", hover/cursor en filas, header de tabla vía mixin
  `catalog-table-header` (L32, confirmado por zoom `#F2E4F2`/`#6B3C6B`),
  `mat-progress-bar` indeterminado verificado por código (ligado a
  `pendingRequests` vía `loading` getter) — no capturable en screenshot por su
  brevedad.
- **RBAC-ORD-01..11** ✅ — verificado con los 4 roles
  (`admin`, `manager01`, `almacen01`, `ventas01`):
  - ADMIN/MANAGER: tab PENDING → Editar/Aprobar/Cancelar (Ver y Editar son
    mutuamente excluyentes vía `canEditOrder()`, por lo que para una orden
    PENDING se muestran 3 íconos, no 4 distintos — comportamiento correcto);
    tab APPROVED → Ver/Entregar/Cancelar.
  - SALES (`ventas01`): tab PENDING → Editar/Cancelar (sin Aprobar); tab
    APPROVED → Ver/Cancelar (sin Entregar); "Nueva orden" visible.
  - WAREHOUSEMAN (`almacen01`): tab PENDING → solo Ver; tab APPROVED →
    Ver/Entregar (sin Cancelar); "Nueva orden" ausente; columna "Total"
    visible con valor real (D6, RBAC-ORD-11).
  - Las 4 tabs DELIVERED/CANCELLED → solo Ver para los 4 roles (RBAC-ORD-07/08).
- **UI-ORD-01..06** ✅ — click en fila navega a `/sales/orders/:id?from=<tab>`
  (placeholder FASE 4 visible); diálogos Aprobar/Entregar/Cancelar abren SIN
  navegar (L27 `stopPropagation`, verificado para ADMIN, WAREHOUSEMAN y SALES);
  confirmar Aprobar → snackbar verde, fila pasa de Pendientes (19→18) a
  Aprobadas (19→20); cambio de tab carga datos y conteos correctos.
  Los diálogos de Entregar/Cancelar se cerraron con "Cancelar" sin confirmar
  para no alterar el stock real de productos compartidos (la transición
  Aprobar→Entregar/Cancelar ya quedó cubierta funcionalmente por UI-ORD-03 y
  por los specs unitarios con 100% de cobertura en `confirmAndTransition()`).
- **EMPTY-ORD-01/02** → **N/A** — no reproducible: las 4 tabs tienen datos
  (18/20/19/334) y el entorno tiene cientos de órdenes preexistentes: no hay
  ningún tab vacío ni un módulo "recién creado". Verificado por código
  (mismo bloque `app-empty-state` para ambos casos).
- **UI-ORD-PAG-01..03** ✅ — paginador "1-20 de 334" en Canceladas, "Siguiente"
  → "21-40 de 334", reset a página 0 (L31) al cambiar de tab y volver.
- **FLOW-ORD-01/02** ✅ — tab Pendientes activo por defecto (D2); los 4 badges
  cargan al inicio sin visitar los tabs no activos (L23/L24, `counts: Map`
  separado de `pages: Map`).

**Suite del módulo (2026-06-13):**
```
ng test --no-watch --include='**/sales/**/*.spec.ts'
→ 5 archivos, 66 specs, 0 fallos
ng test --no-watch --include='**/sales/**/*.spec.ts' --coverage
→ sale-orders-page.component.ts: 100% statements; módulo sales: 75.19% statements
```
Cobertura ≥ 70% statements cumplida (75.19%).

**Regresión completa (2026-06-13):**
```
ng test --no-watch
→ 24 archivos, 281 specs, 0 fallos
```
Sube de 253 (FASE 2) a 281 specs — los 28 specs nuevos corresponden a
`sale-orders-page.component.spec.ts` (FASE 3). Sin regresiones en módulos 0-3
ni en FASE 1/2 de Sales.

---

### FASE 4 — Detalle de orden de venta (`SaleOrderDetailPageComponent` + `SaleOrderDetailFormComponent` + `StockPreviewDialogComponent`) — pruebas de navegador (Propuesta B)

**Cobertura del documento de casos** (`casos_de_prueba_modulo_sales.md`, secciones 4 y 5):
todos los casos VIS-DET-01..06, UI-DET-01..14, FLOW-DET-01..10, RN-DET-01..06,
UI-LIN-01..06, VAL-LIN-01..08, CRUD-LIN-01..06, RBAC-LIN-01..04 en ✅ PASS;
FLOW-DET-07 en **N/A** (justificado). RBAC-LIN-04 y CRUD-LIN-06 resueltos/
verificados el 2026-06-13 (ver §8, H2).

**Resumen por categoría:**

- **VIS-DET-01..06** ✅ — título muestra `orderNumber`, badge de estado con los
  4 colores semánticos (PENDING/APPROVED/DELIVERED/CANCELLED) verificados en
  órdenes 1941/1570/1470/1943, botón ← conserva `?from=PENDING`, historial de
  estado (D4) muestra usuario+fecha para Aprobada/Entregada, `totalAmount`
  visible para WAREHOUSEMAN (D6), `mat-progress-bar` visible durante cargas.
- **UI-DET-01..14** ✅ — matriz de botones de transición y edición verificada
  con los 4 roles:
  - ADMIN/MANAGER (orden PENDING): Cliente/Notas editables, "Guardar cambios"
    respeta `form.dirty` (L25), "Aprobar"/"Cancelar orden" visibles,
    "Agregar detalle" + iconos Editar/Eliminar visibles.
  - WAREHOUSEMAN: Cliente/Notas `disabled`, sin botones de transición en
    PENDING, solo "Entregar" en APPROVED, tabla de detalles de solo lectura
    sin iconos de acción (R1).
  - SALES: sin "Aprobar" en PENDING, solo "Cancelar" (sin "Entregar") en
    APPROVED.
  - DELIVERED/CANCELLED: sin botones de transición para los 4 roles (estados
    terminales).
- **FLOW-DET-01..10** ✅ (FLOW-DET-07 = N/A) —
  - Aprobar (R4/R5): `StockPreviewDialog` "Disponible" mostrado antes de
    confirmar; con stock suficiente → PENDING→APPROVED, `reservedStock`
    incrementado, snackbar verde; con stock insuficiente → snackbar rojo
    "Stock disponible insuficiente para 'Barniz marino 5 galones para
    exteriores'. Disponible: 6, solicitado: 10.", orden permanece PENDING
    (R4 todo-o-nada, H1 status 500 confirmado); cancelar el diálogo no
    modifica el estado ni el stock.
  - Entregar (R7/R8): `StockPreviewDialog` "Stock físico" mostrado antes de
    confirmar; con stock suficiente → APPROVED→DELIVERED,
    `reservedStock`/`currentStock` decrementados, movimiento OUT registrado,
    snackbar verde, historial actualizado (D4).
  - **FLOW-DET-07 → N/A**: ver detalle en §8 ("Hallazgo FLOW-DET-07").
  - Cancelar (R9/R10): desde PENDING (SALES, orden propia OV-2026-0394) →
    PENDING→CANCELLED sin impacto en stock, mensaje de `ConfirmDialog`
    específico ("Esta acción es irreversible"); desde APPROVED (ADMIN, orden
    1942) → APPROVED→CANCELLED con liberación de `reservedStock` (R10) y
    mensaje de `ConfirmDialog` distinto advirtiendo la liberación.
  - FLOW-DET-10: cancelar una orden DELIVERED vía curl → HTTP 500 "No se
    puede cancelar una orden ya entregada." (H1 confirmado, botón ya ausente
    en UI).
- **RN-DET-01..06** ✅ — campos de auditoría/totales de solo lectura (L14);
  `unitCost` ausente del formulario de línea para los 3 roles con acceso
  (R14); en APPROVED, edición de detalles deshabilitada (R1); producto
  duplicado rechazado por backend (R11, H1 status 500); selector de producto
  filtra por `active` (R12, cubierto por spec); `unitPrice` pre-rellenado con
  `Product.price` y editable (R13).
- **UI-LIN-01..06 / VAL-LIN-01..08 / CRUD-LIN-01..05** ✅ — diálogo
  `disableClose:true` (L31), precarga en modo edición, validaciones de
  `quantity`/`unitPrice` (mínimos, negativos, vacíos), advertencia VAL-LIN-07
  sin bloquear el guardado, autocomplete con disponibilidad y productos ya
  agregados deshabilitados (R11), CRUD completo de líneas con recálculo de
  `subtotal`/`totalAmount`, protección de última línea (L26), duplicado
  rechazado vía curl (R11/H1).
  - **CRUD-LIN-06 → ✅ PASS**: verificado por revisión de código (2026-06-13);
    ver detalle en §8 (H2).
- **RBAC-LIN-01..04** —
  - RBAC-LIN-01 ✅ MANAGER: columnas "Costo unitario" ($150.00) y "Margen"
    ($149.00) visibles con valores reales.
  - RBAC-LIN-02/03 ✅ WAREHOUSEMAN/SALES: columnas ausentes del DOM.
  - **RBAC-LIN-04 → ✅ PASS**: resuelto en backend (commit `1f3b41e`); ver
    detalle en §8 (H2).

**Suite del módulo (2026-06-13):**
```
ng test --no-watch --include='**/sale-order-detail-*/**/*.spec.ts' --include='**/stock-preview-dialog/**/*.spec.ts'
→ 92/92 specs, 0 fallos (56 specs de sale-order-detail-form + sale-order-detail-page,
  más 36 de stock-preview-dialog y demás specs relacionados)
ng test --no-watch --code-coverage
→ 89.9% statements
```
Cobertura ≥ 70% statements cumplida (89.9%), muy por encima del umbral.

**Regresión completa (2026-06-13):**
```
ng test --no-watch
→ 373/373 specs, 0 fallos
```
Sin regresiones respecto a FASE 3 (281/281) ni a módulos 0-3.

---

### FASE 5 — Reservas de stock (`ReservationsPageComponent`) — pruebas de navegador (Propuesta B)

**Cobertura del documento de casos** (`casos_de_prueba_modulo_sales.md`, sección 6):
VIS-RES-01..05, RBAC-RES-01..02, RBAC-RES-FJ-01..02, EMPTY-RES-01..02 en ✅ PASS.
RBAC-RES-FJ-03 en ⏳ PENDIENTE — verificación de limpieza de datos de prueba,
diferida a FASE 6 (ver hallazgo en §8).

**Diseño e implementación:**

- Componente smart standalone, `OnInit` + `OnPush`, sigue el patrón
  `.catalog-page` / `__table-wrapper` (L22) y el mixin `catalog-table-header`
  (L32) ya usados en `SaleOrdersPageComponent`.
- 4 tarjetas de resumen (`reservations-summary` / `summary-card`) alimentadas
  por `ReservationSummaryDTO` (`totalProductsWithReservations`,
  `totalReservedUnits`, `totalReservedValue`, `totalApprovedOrders`).
- Dos `mat-table` con `multiTemplateDataRows` y animación `detailExpand`
  (`trigger`/`state`/`transition` de `@angular/animations`) — primer uso de
  este patrón en el proyecto. Cada fila principal (`toggleProduct`/
  `toggleClient`) alterna `expandedProductId`/`expandedClientId`; la fila de
  detalle renderiza una tabla HTML simple con `ReservedProductOrderDTO` /
  `ReservedClientOrderDTO`.
- Botón `orderNumber` dentro de la fila expandida usa `$event.stopPropagation()`
  (L27) y navega con `goToOrder()` → `/sales/orders/:id?from=reservations`.
- `forkJoin({ summary, products, clients })` con `catchError` por fuente (L33)
  — cada fuente cae a un valor seguro (`EMPTY_SUMMARY`, `[]`, `[]`) si responde
  error, sin romper las otras secciones.
- Estados vacíos reutilizan `EmptyStateComponent` con `titleOverride`/
  `descriptionOverride` específicos para "Por producto" y "Por cliente".
- `layoutService.collapse()` colapsa el sidebar al entrar, igual que
  `SaleOrdersPageComponent`.

**Resumen de pruebas de navegador (2026-06-13):**

- **VIS-RES-01..05** ✅ — título "Reservas de stock" visible; las 4 tarjetas
  muestran 44 / 155 / $570,798.00 / 20, coincidiendo con
  `GET /sales/reservations/summary`; tabla "Por producto" expandida para
  SKU-SO-12823 muestra la orden OV-2026-0183 (Cliente Int 12823, cantidad 2,
  subtotal $1,600.00, aprobada 07/06/2026 03:50); tabla "Por cliente"
  expandida para "Cliente Int 38661" muestra la orden OV-2026-0092 ($1,600.00,
  1 ítem, aprobada 07/06/2026 03:13); `mat-progress-bar` indeterminada visible
  durante la carga inicial (`@if (loading)`).
- **RBAC-RES-01** ✅ — verificado en browser con JWT real de `admin`
  (ROLE_ADMIN), `manager01` (ROLE_MANAGER), `almacen01` (ROLE_WAREHOUSEMAN) y
  `ventas01` (ROLE_SALES): los 4 roles ven el dashboard completo e idéntico,
  sin redacciones — coincide con `SecurityConfig` (`GET /api/v1/sales/**` →
  los 4 roles) y con la matriz §6.2 (campos son precio de venta, no costo).
- **RBAC-RES-02** ✅ — click en "OV-2026-0183" (fila expandida de
  SKU-SO-12823) navega a `/sales/orders/1492?from=reservations` y carga
  correctamente el detalle de la orden.
- **RBAC-RES-FJ-01** ✅ — sin errores de consola en ninguno de los 4 roles;
  las 3 secciones (resumen, por producto, por cliente) cargan con datos
  reales del backend.
- **RBAC-RES-FJ-02** ✅ — verificado mediante specs unitarios (3 casos:
  `getSummary`/`getProducts`/`getClients` con error aislado vía
  `throwError` + `catchError`); cada fuente cae a su valor por defecto sin
  afectar las otras dos. No se simuló en backend real porque forzar un
  404/500 aislado en un solo endpoint del dashboard requeriría apagar
  selectivamente parte de la API.
- **EMPTY-RES-01 / EMPTY-RES-02** ✅ — verificados mediante specs unitarios
  (`products: []` / `clients: []` → `app-empty-state` con
  `titleOverride="Sin reservas activas"`); el patrón `EmptyStateComponent` ya
  está validado visualmente en otros módulos (Inventory, Purchases, Sales
  FASE 2/3).
- **RBAC-RES-FJ-03** ⏳ PENDIENTE — se detectaron ~20 productos
  "Producto Integración NNNNN" (SKU `SKU-SO-NNNNN`) y ~20 clientes
  "Cliente Int NNNNN" con reservas activas, originados por suites de
  integración del backend (`SaleOrderConcurrencyIT` y similares). No siguen
  el prefijo `[QA]`/`TEST_` de L33. Diferido a FASE 6 — requiere coordinar con
  el cierre de las suites de integración del backend antes de limpiar la BD.

**Suite del módulo (2026-06-13):**
```
ng test --no-watch --include='**/reservations-page.component.spec.ts'
→ 10/10 specs, 0 fallos
ng test --no-watch --coverage --include='**/reservations-page.component.spec.ts'
→ 95.73% statements (reservations-page)
```

**Regresión completa (2026-06-13):**
```
ng test --no-watch
→ 383/383 specs, 0 fallos
```
Sin regresiones respecto a FASE 4 (373/373) ni a módulos 0-3.

---

## 8. Bugs y retos durante el desarrollo

### H1 — `SaleOrderServiceImpl`/`ClientServiceImpl` usan `RuntimeException` genérica (→ 500 en vez de 404/409/422) — RESUELTO ✅

**Origen:** identificado durante la revisión pre-código de `GlobalExceptionHandler`
y `SaleOrderServiceImpl` (FASE 0, 2026-06-13).

**Detalle:** ver tabla "Formato de error del backend" en §4. Incluye el caso de
`ObjectOptimisticLockingFailureException` enmascarado en `approveOrder()`
(debería responder 409, respondía 500). El mensaje de negocio llega correctamente
en `err.error?.message` en todos los casos — el frontend no se bloquea (L9).

**Estado:** **corregido en backend** (2026-06-13, autorizado por el usuario),
rama `fix/sales-h1-typed-exceptions` (commit `0374944`), pendiente de merge a
`develop`. Cambios:
- `ResourceNotFoundException` (404) para entidades no encontradas (orden,
  cliente, producto, detalle).
- `DuplicateResourceException` (409) para RFC/email duplicados al
  crear/actualizar cliente, y para producto duplicado en `addDetail`.
- `BusinessRuleException` (422) para transiciones de estado inválidas, stock
  insuficiente (disponible y físico), producto inactivo, estado inválido en
  `parseStatus`, y cliente con órdenes activas al desactivar.
- `approveOrder()`: se eliminó el `catch` que envolvía
  `ObjectOptimisticLockingFailureException` en un `RuntimeException` genérico;
  ahora propaga sin envolver y `GlobalExceptionHandler.handleOptimisticLocking()`
  la convierte en 409 con el mismo mensaje ("Stock modificado concurrentemente.
  Intente nuevamente.").
- `resolveAuthenticatedUser()` conserva `RuntimeException` (error de
  infraestructura, no de negocio) — consistente con el comentario de
  `GlobalExceptionHandler`.

**Tests:** `SaleOrderConcurrencyTest` actualizado para esperar 409/422 en lugar
de 500 en los rechazos de `approveOrder()`. Suite `sales.**`: 75 tests, 74 pass
— la 1 falla restante (`ClientControllerTest.getAllActiveClients_retorna200`)
es **preexistente y no relacionada** (falla igual en `develop` sin estos
cambios) — ver H4 más abajo.

Los casos `ERR-*` de `casos_de_prueba_modulo_sales.md` deben actualizarse para
reflejar los códigos correctos (404/409/422) en lugar de 500.

### H2 — `SaleOrderDetailResponseDTO.unitCost` sin redacción por rol (L29/BUG-INV-11) — RESUELTO ✅

**Origen:** identificado durante la revisión pre-código de
`SaleOrderServiceImpl`/`SaleOrderDetailResponseDTO` (FASE 0, 2026-06-13).

**Detalle:** `GET /api/v1/sales/orders/**` es accesible para los 4 roles;
`unitCost` se popula siempre desde `Product.getUnitCost()` sin `redactXxx(dto,
role)`. Mismo patrón que causó BUG-INV-11 en `ProductServiceImpl` (corregido
2026-06-12, commit `c3e2206`).

**Confirmación inicial en browser (RBAC-LIN-04, FASE 4, 2026-06-13):** se
ejecutó `fetch('/api/v1/sales/orders/1470', { headers: { Authorization:
'Bearer ' + localStorage.getItem('almacenes_token') } })` con los tokens de
`almacen01` (WAREHOUSEMAN) y `ventas01` (SALES). En ambos casos
`details[].unitCost` llegaba poblado (`unitCost: 150`), confirmando que el
backend NO redactaba el campo. La UI ocultaba correctamente la columna "Costo
unitario"/"Margen" (RBAC-LIN-02/03 en PASS), pero cualquier consumidor de la
API (DevTools/Network, Postman, etc.) podía leer el costo real con un rol que
no debería verlo.

**Corrección (2026-06-13, backend rama `fix/sales-rbac-lin-04-redaction`,
commit `1f3b41e`):** se agregó a `SaleOrderServiceImpl` el mismo patrón
`canViewUnitCost()`/`redactUnitCost(...)` de `ProductServiceImpl`
(BUG-INV-11):

```java
private boolean canViewUnitCost() {
    return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .anyMatch(role -> role.equals("ROLE_ADMIN") || role.equals("ROLE_MANAGER"));
}

private SaleOrderResponseDTO redactUnitCost(SaleOrderResponseDTO dto) {
    if (!canViewUnitCost() && dto.getDetails() != null) {
        dto.getDetails().forEach(detail -> detail.setUnitCost(null));
    }
    return dto;
}
// + overloads para List<SaleOrderResponseDTO> y PageResponseDTO<SaleOrderResponseDTO>
```

Aplicado a **todos** los métodos que retornan `SaleOrderResponseDTO`/lista/
página: `createOrder`, `findById`, `findByStatus` (lista y paginado),
`findByClientId`, `findByClientIdAndStatus`, `findByProductId`,
`findByProductIdAndStatus`, `updateOrder`, `approveOrder`, `deliverOrder`,
`cancelOrder`, `addDetail`, `updateDetail`.

**Re-verificación en browser (2026-06-13, backend reiniciado con el fix):**
mismo `fetch()` contra `GET /api/v1/sales/orders/1470`:
- `almacen01` (WAREHOUSEMAN) → `details[].unitCost: null`
- `ventas01` (SALES) → `details[].unitCost: null`
- token ADMIN → `details[].unitCost: 150` (valor real preservado)

**Suite `sales.**`:** 46 tests, 0 fallos (`SaleOrderRepositoryTest`,
`SaleOrderControllerTest`, `SaleOrderConcurrencyTest`,
`SaleOrderServiceImplTest`). Suite completa del backend: las 13 fallas
preexistentes (`AuditAndConstraintIntegrationTest`, `RbacIntegrationTest`,
`SupplierControllerTest`, `ClientControllerTest`, `CategoryControllerTest`,
`ProductServiceImplTest`) se reproducen igual en `develop` sin este cambio —
no son regresiones introducidas por esta corrección (H4 ampliado, ver checklist
§10).

**RBAC-LIN-04 → ✅ PASS** en `casos_de_prueba_modulo_sales.md`.

### D8 — Verificación de `@Transactional` en `approveOrder()` — RESUELTO ✅ (sin H3)

**Verificación realizada:** 2026-06-13, lectura de
`SaleOrderServiceImpl.java` (sin modificar).

- La clase está anotada `@Transactional` a nivel de clase (línea 35).
  `approveOrder()` (línea 159) no sobreescribe con `readOnly`, por lo que se
  ejecuta dentro de una transacción de escritura completa.
- En la FASE 2, si `productRepository.saveAndFlush(product)` lanza
  `ObjectOptimisticLockingFailureException` para la línea N, ya no se captura
  ni se reenvuelve (H1 resuelto): propaga directamente como
  `ObjectOptimisticLockingFailureException` (no checked).
- Esa excepción propaga fuera del método `@Transactional` → el proxy de
  Spring marca la transacción `rollback-only` por el comportamiento por
  defecto de `@Transactional` (rollback ante cualquier `RuntimeException`).
  Aunque `saveAndFlush()` ya ejecutó los `UPDATE` físicos en la BD para las
  líneas 1..N-1, el `ROLLBACK` al finalizar la transacción revierte esos
  cambios — **no quedan reservas parciales/inconsistentes**. Luego,
  `GlobalExceptionHandler.handleOptimisticLocking()` la convierte en 409 con
  el mensaje "Stock modificado concurrentemente. Intente nuevamente."

**Conclusión:** la garantía de "todo o nada" en `approveOrder()` (R4/R5) es
correcta a nivel de transacción. **No se genera H3.** H1 (código HTTP 500 en
vez de 409 para el mensaje de "Stock modificado concurrentemente") fue
**resuelto** (ver arriba) — el código HTTP ahora es correcto y la integridad
de los datos siempre estuvo garantizada.

### H4 — `ClientControllerTest.getAllActiveClients_retorna200` falla (preexistente, NO relacionada con Sales/H1)

**Origen:** detectado al ejecutar la suite `sales.**` tras el fix de H1
(2026-06-13). Error: `No value at JSON path "$.content[0].name"`.

**Detalle:** se verificó con `git stash` que la falla ocurre de forma
idéntica en `develop` sin ninguno de los cambios de H1 — mismo test, mismo
mensaje de error, 6 tests / 1 falla. Por lo tanto **no es una regresión** del
fix de H1, sino un bug preexistente en el test (o en el endpoint
`GET /api/v1/sales/clients/active`) no relacionado con esta tarea.

**Estado:** documentado, NO corregido — pendiente de autorización explícita
del usuario, según la instrucción permanente "si identificas errores o bugs,
solo identifícalos y documéntalos, no los corrijas hasta que lo autorices".

### Hallazgo FLOW-DET-07 — escenario "stock físico insuficiente al entregar" inalcanzable (N/A)

**Origen:** durante las pruebas de navegador de FASE 4 (2026-06-13), al
intentar reproducir FLOW-DET-07 ("Confirmar Entregar con stock físico
insuficiente").

**Detalle:** se leyó `ProductServiceImpl` (líneas 195-230) y
`SaleOrderServiceImpl.deliverOrder()` (líneas 195-250). La validación de
movimientos OUT en `ProductServiceImpl` garantiza el invariante
`currentStock >= reservedStock` en todo momento: `available = currentStock -
reservedStock`, y un OUT que deje `available < 0` se rechaza con 422. Como
`approveOrder()` (R4/R5) solo reserva `quantity <= availableStock`, al llegar
a `deliverOrder()` siempre se cumple `currentStock >= quantity` para esa
línea. El check `if (product.getCurrentStock() < detail.getQuantity())` en
`deliverOrder()` es código defensivo que nunca puede evaluarse `true` en el
flujo normal.

**Verificación:** se intentó forzar el escenario reduciendo `currentStock`
del producto 702 vía `POST /api/v1/inventory/products/movement`
(`{"productId":702,"type":"OUT","quantity":5,...}`) sobre una orden APPROVED
con `quantity=8` reservada. El backend rechazó el movimiento con HTTP 422
"No se puede registrar la salida: solo hay 2 unidades disponibles (stock
físico 10 − 8 reservadas para órdenes de venta). Solicitado: 5." — es decir,
la propia validación que hace inalcanzable FLOW-DET-07 impidió incluso el
setup del escenario.

**Estado:** marcado **N/A** en `casos_de_prueba_modulo_sales.md` con esta
justificación. No requiere corrección — es la prueba de que la protección
funciona. **Limpieza realizada:** la orden de prueba OV-2026-0393 (id 1942)
se canceló (`PATCH .../cancel`, APPROVED→CANCELLED) y se confirmó que el
producto 702 volvió a `currentStock=10, reservedStock=0, availableStock=10`
(L33, sin movimiento de inventario adicional que revertir porque el OUT fue
rechazado y nunca se aplicó).

### Hallazgo informativo — productos "Descontinuado" siguen seleccionables en el autocomplete de líneas de orden

**Origen:** observado durante las pruebas de navegador de FASE 4
(2026-06-13) al revisar el catálogo de productos en el diálogo "Agregar
detalle".

**Detalle:** productos con `status: 'DISCONTINUED'` pero `active: true` (ej.
`ELEC-TV32-046`) siguen apareciendo y son seleccionables en el autocomplete
de `SaleOrderDetailFormComponent`. Esto **no es una violación de RN-DET-05**
(que exige filtrar por el booleano `active`, no por `status`) — el filtro
actual (`p.active`) es correcto según la especificación. Se documenta como
información para una futura decisión de negocio: si "Descontinuado" debe
impedir nuevas ventas, se necesitaría un criterio adicional explícito
(`status !== 'DISCONTINUED'`).

**Estado:** informativo, NO requiere acción — no bloquea FASE 4.

### Hallazgo L33 — artefactos de prueba FASE 4 (órdenes 1941/1943, estado terminal CANCELLED)

**Origen:** dos órdenes fueron creadas durante FASE 4 para reproducir
FLOW-DET-03/04/07/09 y FLOW-DET-08:

- **OV-2026-0392 (id 1941)**, "[QA] Prueba FASE4 - stock insuficiente" —
  creada para FLOW-DET-03/04/09, terminó en estado **CANCELLED** tras
  FLOW-DET-09 (cancelación desde APPROVED, con liberación de `reservedStock`
  verificada).
- **OV-2026-0394 (id 1943)**, "[QA] FASE4 - FLOW-DET-08 cancelar PENDING como
  SALES" — creada y cancelada por `ventas01` para FLOW-DET-08, terminó en
  estado **CANCELLED**.

**Estado:** ambas órdenes cumplen L33 (prefijo `[QA]`, estado terminal
CANCELLED sin impacto en stock — confirmado para 1941 que `reservedStock`
del producto 702 volvió a 0). Se conservan como artefactos de prueba
documentados; no requieren limpieza adicional. La orden OV-2026-0393 (id
1942) se canceló y su stock se restauró completamente (ver hallazgo
FLOW-DET-07 arriba).

### BUG-S4-01 — Doble asterisco "Nombre **" en el formulario de cliente — RESUELTO ✅

**Origen:** detectado en VIS-CLF-01 durante las pruebas de navegador de FASE 2
(2026-06-13), visible para ADMIN, MANAGER y también para `almacen01` en modo
solo lectura (el `*` extra se renderiza incluso con el campo `disabled`).

**Detalle:** `client-form.component.html` línea 13 tenía
`<mat-label>Nombre *</mat-label>` con un asterisco manual. Angular Material
agrega automáticamente un `*` adicional cuando el `FormControl` asociado tiene
`Validators.required` (regla "No hay asteriscos dobles" de CLAUDE.md). El
resultado visible era "Nombre **".

**Fix aplicado (2026-06-13, autorizado por el usuario):** se quitó el ` *`
manual de la línea 13, dejando `<mat-label>Nombre</mat-label>` — Angular
Material añade el asterisco automáticamente por el validador. Verificado en
browser: el campo ahora muestra "Nombre*" (un solo asterisco). Suite del
módulo re-ejecutada: 38 specs, 0 fallos (sin impacto en tests, el cambio es
solo de texto del label).

### Hallazgo L33 — datos de prueba preexistentes no conformes (~50 registros "Cliente Int XXXXX")

**Origen:** detectado durante BSRCH-CLI-01..06 (FASE 2, 2026-06-13) al revisar
la lista completa de clientes activos para verificar la búsqueda.

**Detalle:** la tabla `/sales/clients/active` contiene aproximadamente 50
registros con nombres del tipo `Cliente Int XXXXX` (datos de prueba de
integración generados en sesiones anteriores, probablemente del backend
`SaleOrderConcurrencyTest` u otras suites de integración), que **no siguen el
estándar L33** de prefijo `[QA]`/`TEST_` ni están desactivados.

**Impacto:** ninguno sobre la funcionalidad — son datos visibles para todos los
roles (campos de `ClientDTO` no son sensibles, §6.2) y no interfieren con los
casos de prueba de FASE 2 (de hecho EMPTY-CLI-01 se marcó N/A precisamente
porque desactivar estos ~50 registros afectaría datos compartidos).

**Estado:** documentado como **hallazgo de higiene de datos para limpieza
futura**, NO corregido en esta sesión — requiere autorización explícita y
coordinación (podrían ser usados por tests de integración del backend en
ejecución). No bloquea el cierre de FASE 2.

**Actualización FASE 5 (2026-06-13):** los mismos registros "Cliente Int
XXXXX" aparecen en `GET /sales/reservations/clients` (RBAC-RES-FJ-03), y sus
órdenes asociadas (OV-2026-XXXX, productos "Producto Integración NNNNN" /
SKU `SKU-SO-NNNNN`) aparecen en `GET /sales/reservations/products` — ~20
productos y ~20 clientes con reservas activas. Es el mismo hallazgo de
higiene de datos, ahora visible también desde el dashboard de reservas.
RBAC-RES-FJ-03 queda ⏳ PENDIENTE hasta que se resuelva esta limpieza en
FASE 6.

---

### Hallazgo L33 — volúmenes grandes de datos de prueba preexistentes en `/sales/orders` (FASE 3, 2026-06-13)

**Origen:** detectado durante las pruebas de navegador de FASE 3
(`casos_de_prueba_modulo_sales.md`, sección 3) al recorrer las 4 tabs de
`/sales/orders` con los 4 roles.

**Detalle:** además de los ~50 "Cliente Int XXXXX" ya documentados arriba
(visibles también en Aprobadas/Entregadas, creados por `admin`), se observan:

- **Tabs Pendientes/Aprobadas:** órdenes para `Cliente RBAC RXXXXX` creadas por
  usuarios `salesRXXXXX` (p.ej. OV-2026-0238 "Cliente RBAC R44964" /
  `salesR44964`) — parecen datos remanentes de pruebas de seguridad RBAC.
- **Tab Canceladas:** **334 registros** para `Cliente Concurrencia
  17813...XXXX` / `Cliente Concurrencia 17812...XXXX` (nombres con timestamps
  numéricos), creados por `admin` — consistentes con pruebas de concurrencia/
  carga del backend (`SaleOrderConcurrencyTest`).

**Impacto:** ninguno sobre la funcionalidad de FASE 3 — todos los casos de
prueba se ejecutaron correctamente sobre estos datos (de hecho permitieron
verificar UI-ORD-PAG-01..03 con paginación real de 334 registros). Sin
embargo, infla artificialmente los conteos de los tabs y dificulta distinguir
datos reales de datos de prueba.

**Estado:** documentado como **hallazgo de higiene de datos para limpieza
futura (L33)**, NO corregido en esta sesión — requiere autorización explícita,
ya que estos registros probablemente provienen de suites de integración del
backend (`SaleOrderConcurrencyTest` y pruebas de seguridad RBAC) y su limpieza
debe coordinarse para no romper esas suites. No bloquea el cierre de FASE 3.

---

## 9. Estándares y buenas prácticas aplicadas

_Pendiente — se completa al cierre del módulo, listando L1-L33 efectivamente
aplicadas con referencia a archivos/componentes concretos._

---

## 10. Cumplimiento y validación

_Pendiente — checklist de cierre (Propuesta D) se completa al final del módulo,
referenciando `casos_de_prueba_modulo_sales.md`._
