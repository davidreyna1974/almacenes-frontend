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
  WAREHOUSEMAN/SALES.
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
  (`redactUnitCost`, análogo a BUG-INV-11) queda como mejora de defensa en
  profundidad a aplicar cuando se autorice.
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
  unitCost: number | null;  // ⚠️ H2 — null/oculto para WAREHOUSEMAN/SALES (frontend)
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
| `unitCost` | capturado de `Product.unitCost` al crear/actualizar detalle — nunca editable, ⚠️ sujeto a redacción por rol (H2/L29) |
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
| `SaleOrderDetailResponseDTO.unitCost` | valor real | valor real | `null`/oculto* | `null`/oculto* |
| Margen derivado (`unitPrice - unitCost`) | visible | visible | ausente | ausente |
| `SaleOrderResponseDTO.totalAmount` (D6) | visible | visible | visible | visible |
| `SaleOrderDetailResponseDTO.unitPrice`/`subtotal` (D6) | visible | visible | visible | visible |
| `ReservationSummaryDTO.totalReservedValue` (precio venta) | visible | visible | visible | visible |
| `ReservedProductDTO.unitPrice`/`totalReservedValue` | visible | visible | visible | visible |
| `ClientDTO` (todos los campos) | visible | visible | visible | visible |

\* Hasta que el backend aplique `redactUnitCost` (H2), el campo puede llegar
poblado en el JSON para WAREHOUSEMAN/SALES — el frontend NO debe leerlo ni
renderizarlo: excluido de `displayedColumns` (no solo CSS), documentado como
gap temporal en §8 hasta que el backend redacte.

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

_Pendiente — se documenta en FASE 1-6 conforme se implementan modelos, servicios
y componentes._

---

## 8. Bugs y retos durante el desarrollo

### H1 — `SaleOrderServiceImpl`/`ClientServiceImpl` usan `RuntimeException` genérica (→ 500 en vez de 404/409/422)

**Origen:** identificado durante la revisión pre-código de `GlobalExceptionHandler`
y `SaleOrderServiceImpl` (FASE 0, 2026-06-13).

**Detalle:** ver tabla "Formato de error del backend" en §4. Incluye el caso de
`ObjectOptimisticLockingFailureException` enmascarado en `approveOrder()`
(debería responder 409, responde 500). El mensaje de negocio llega correctamente
en `err.error?.message` en todos los casos — el frontend no se bloquea (L9).

**Estado:** documentado, NO corregido. Posible fix en backend durante FASE 1
sujeto a autorización explícita (D7). Si no se autoriza, los casos `ERR-*` de
`casos_de_prueba_modulo_sales.md` documentan el código real (500) con nota
"pendiente backend".

### H2 — `SaleOrderDetailResponseDTO.unitCost` sin redacción por rol (L29/BUG-INV-11)

**Origen:** identificado durante la revisión pre-código de
`SaleOrderServiceImpl`/`SaleOrderDetailResponseDTO` (FASE 0, 2026-06-13).

**Detalle:** `GET /api/v1/sales/orders/**` es accesible para los 4 roles;
`unitCost` se popula siempre desde `Product.getUnitCost()` sin `redactXxx(dto,
role)`. Mismo patrón que causó BUG-INV-11 en `ProductServiceImpl` (corregido
2026-06-12, commit `c3e2206`).

**Estado:** documentado, NO corregido en backend. Mitigación 100% frontend
desde FASE 4 (D7): `unitCost`/margen excluido de `displayedColumns` para
WAREHOUSEMAN/SALES independientemente del estado de redacción del backend.

### D8 — Verificación de `@Transactional` en `approveOrder()` — RESUELTO ✅ (sin H3)

**Verificación realizada:** 2026-06-13, lectura de
`SaleOrderServiceImpl.java` (sin modificar).

- La clase está anotada `@Transactional` a nivel de clase (línea 35).
  `approveOrder()` (línea 159) no sobreescribe con `readOnly`, por lo que se
  ejecuta dentro de una transacción de escritura completa.
- En la FASE 2 (líneas 187-196), si `productRepository.saveAndFlush(product)`
  lanza `ObjectOptimisticLockingFailureException` para la línea N, el método
  la captura y relanza como `RuntimeException("Stock modificado
  concurrentemente. Intente nuevamente.")` (esto es H1 — código HTTP 500 en
  vez de 409, ver arriba).
- Esa `RuntimeException` (no checked) propaga fuera del método
  `@Transactional` → el proxy de Spring marca la transacción
  `rollback-only` por el comportamiento por defecto de `@Transactional`
  (rollback ante cualquier `RuntimeException`). Aunque
  `saveAndFlush()` ya ejecutó los `UPDATE` físicos en la BD para las líneas
  1..N-1, el `ROLLBACK` al finalizar la transacción revierte esos cambios —
  **no quedan reservas parciales/inconsistentes**.

**Conclusión:** la garantía de "todo o nada" en `approveOrder()` (R4/R5) es
correcta a nivel de transacción. **No se genera H3** — el único hallazgo
pendiente relacionado es H1 (código HTTP 500 en vez de 409 para el mensaje de
"Stock modificado concurrentemente"), que no afecta la integridad de los datos.

---

## 9. Estándares y buenas prácticas aplicadas

_Pendiente — se completa al cierre del módulo, listando L1-L33 efectivamente
aplicadas con referencia a archivos/componentes concretos._

---

## 10. Cumplimiento y validación

_Pendiente — checklist de cierre (Propuesta D) se completa al final del módulo,
referenciando `casos_de_prueba_modulo_sales.md`._
