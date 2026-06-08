# Memoria Técnica — Módulo 3: Compras (frontend)

**Versión:** 1.0 — implementación completa  
**Fecha de inicio:** 2026-06-07  
**Fecha de cierre:** 2026-06-08 (pruebas browser completadas — 155/155 PASS)  
**Rama:** `feature/purchases`  
**Estado:** ✅ Completado

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

El Módulo 3 — Compras gestiona el ciclo de vida completo de las órdenes de compra:
creación, aprobación, recepción y cancelación. Es el punto de integración crítico
entre proveedores e inventario: la recepción de una orden APPROVED (PATCH /receive)
es la única acción del sistema que incrementa el stock físico de forma automática,
disparando `registerStockMovement(IN)` por cada línea de detalle dentro de la misma
transacción del backend.

**Audiencias del módulo:**

| Rol | Acceso | Descripción |
|---|---|---|
| ADMIN | Completo | CRUD proveedores, crear/aprobar/recibir/cancelar órdenes, ver precios |
| MANAGER | Completo | CRUD proveedores, crear/aprobar/recibir/cancelar órdenes, ver precios |
| WAREHOUSEMAN | Restringido | Solo lectura de proveedores; solo recepción de órdenes APPROVED |
| SALES | Sin acceso | El módulo Compras no es visible en el sidebar para SALES |

**Backend:** módulo `purchases` completamente implementado y probado.
Suite: 43 tests A + 25 tests B — 0 fallos — BUILD SUCCESS.

**Dependencias:** Módulo 2 (Inventory) — los detalles de órdenes referencian
productos del catálogo de inventory.

---

## 2. Decisiones de diseño

### D1. Layout de vistas

- **Proveedores:** master-detail (igual que categorías en inventory) — el catálogo
  de proveedores es similar en complejidad a categorías; el patrón ya es familiar.
- **Lista de órdenes:** pantalla completa con tabs de estado (PENDING/APPROVED/RECEIVED/CANCELLED).
  Justificación: las órdenes tienen muchos campos y cada detalle merece su propia
  página. Un master-detail quedaría demasiado comprimido para mostrar los datos.
- **Detalle de orden:** pantalla completa en ruta separada (`/purchases/orders/:id`).
  Sección superior: cabecera de la orden. Sección inferior: tabla de detalles.

### D2. Creación de orden en ruta separada (/purchases/orders/new)

La creación de una orden requiere seleccionar proveedor, agregar notas y construir
la lista de detalles (al menos uno obligatorio). La complejidad justifica una ruta
dedicada `/purchases/orders/new` en lugar de un modal: dispone de toda la altura de
pantalla para el formulario de cabecera + tabla de detalles editable.
**Decisión confirmada el 2026-06-07.**

### D3. Selector de productos como MatAutocomplete

El catálogo puede tener muchos productos. MatAutocomplete con búsqueda es más
ergonómico que un MatSelect largo. Se mostrará `[SKU] — Nombre (disponible: N)`.

### D4. Carga de tabs bajo demanda

Cada tab de estado llama a `getByStatus()` solo cuando el usuario la selecciona
(`(selectedTabChange)`). Evita cargar 4 listas en el onInit de la página.

### D5. Confirmación para acciones irreversibles

Recibir y Cancelar requieren `ConfirmDialogComponent` antes de ejecutar. La
recepción dispara movimientos de stock; la cancelación cierra la posibilidad de
recibir la mercancía. Ambas son terminales o de alto impacto.

### D6. Subtotal calculado en tiempo real

En el formulario de detalle, `subtotal` se actualiza reactivamente usando
`valueChanges` del `FormGroup` (quantity × unitPrice). Es solo informativo
(el backend recalcula en el servidor); el campo no es editable.

### D7. Historial de estado como tabla

La cabecera de la orden incluye una tabla de 3 filas (aprobado / recibido / cancelado)
con columna de usuario y timestamp. Las filas en null se muestran con guion.
Más legible que un timeline y consistente con el estilo de tabla del proyecto.

---

## 3. Especificación de componentes y vistas

### 3.1 Estructura de archivos

```
src/app/modules/purchases/
├── purchases.component.ts/.html            (shell — router-outlet)
├── purchases.routes.ts                     (lazy routes del módulo)
├── models/
│   ├── supplier.model.ts                   (SupplierDTO)
│   └── purchase-order.model.ts             (PurchaseOrderResponseDTO, Request DTOs)
├── services/
│   ├── supplier.service.ts
│   └── purchase-order.service.ts
└── components/
    ├── suppliers-page/                     (smart)
    │   ├── suppliers-page.component.ts
    │   ├── suppliers-page.component.html
    │   ├── suppliers-page.component.scss
    │   └── suppliers-page.component.spec.ts
    ├── supplier-form/                      (dumb)
    │   ├── supplier-form.component.ts
    │   ├── supplier-form.component.html
    │   ├── supplier-form.component.scss
    │   └── supplier-form.component.spec.ts
    ├── purchase-orders-page/               (smart — lista con tabs)
    │   ├── purchase-orders-page.component.ts
    │   ├── purchase-orders-page.component.html
    │   ├── purchase-orders-page.component.scss
    │   └── purchase-orders-page.component.spec.ts
    ├── purchase-order-detail-page/         (smart — detalle + detalles)
    │   ├── purchase-order-detail-page.component.ts
    │   ├── purchase-order-detail-page.component.html
    │   ├── purchase-order-detail-page.component.scss
    │   └── purchase-order-detail-page.component.spec.ts
    ├── purchase-order-form/                (dumb — add/edit detalle)
    │   ├── purchase-order-form.component.ts
    │   ├── purchase-order-form.component.html
    │   ├── purchase-order-form.component.scss
    │   └── purchase-order-form.component.spec.ts
    └── purchase-order-detail-form/         (dumb — línea de detalle)
        ├── purchase-order-detail-form.component.ts
        ├── purchase-order-detail-form.component.html
        ├── purchase-order-detail-form.component.scss
        └── purchase-order-detail-form.component.spec.ts
```

### 3.2 Rutas del módulo

```typescript
// purchases.routes.ts
[
  { path: '',          component: PurchasesComponent, children: [
    { path: 'suppliers',     component: SuppliersPageComponent },
    { path: 'orders',        component: PurchaseOrdersPageComponent },
    { path: 'orders/new',    component: PurchaseOrderDetailPageComponent },  // creación
    { path: 'orders/:id',    component: PurchaseOrderDetailPageComponent },  // edición / vista
  ]}
]
// Nota: 'orders/new' debe ir ANTES de 'orders/:id' para que Angular no lo interprete como id="new"
```

### 3.3 Sidebar y breadcrumb

**Sidebar** — grupo expandible "Compras" (roles: ADMIN, MANAGER, WAREHOUSEMAN):
- Proveedores  `local_shipping`  → `/purchases/suppliers`
- Órdenes de compra  `receipt_long`  → `/purchases/orders`

**Breadcrumb** (topbar):
- `/purchases/suppliers`   → "Compras → Proveedores"
- `/purchases/orders`      → "Compras → Órdenes de compra"
- `/purchases/orders/:id`  → "Compras → Detalle de orden"

### 3.4 Vista A — Proveedores

**Layout:** master-detail  
**Panel izquierdo (40%):** tabla paginada de proveedores activos  
- Columnas: RFC, Razón social, Contacto, Teléfono, Acciones  
- Búsqueda local por razón social/RFC (debounce 400ms)  
- Botón "Nuevo proveedor" — solo ADMIN/MANAGER  
- Fila seleccionada: fondo #F2E4F2

**Panel derecho (60%):** `SupplierFormComponent` (dumb)  
- Campos: RFC, Razón social, Nombre de contacto, Teléfono, Email, Dirección  
- Modo edición: campos de auditoría (fechas, creado por) en sección colapsable de solo lectura  
- Botón Guardar (ADMIN/MANAGER) + Cancelar + Desactivar (solo ADMIN)  
- Desactivar: `ConfirmDialogComponent` — el backend retorna 422 si tiene órdenes activas  
- WAREHOUSEMAN: panel informativo sin botones de acción

### 3.5 Vista B — Lista de órdenes

**Layout:** pantalla completa con `MatTabGroup`  
**Tabs:** Pendientes | Aprobadas | Recibidas | Canceladas  
- Cada tab muestra badge con conteo de órdenes (lazy load al seleccionar)  
- Tab por defecto: Pendientes

**Tabla por tab:**  
- Columnas: N° Orden, Proveedor, Total*, Creado por, Fecha, Estado, Acciones  
  (*Total oculto para WAREHOUSEMAN)  
- Estado: chip con colores semánticos (StatusLabelPipe)  
- Paginación: MatPaginator vinculado a PageResponse<T>  
- Acciones condicionales:

  | Estado | ADMIN/MANAGER | WAREHOUSEMAN |
  |---|---|---|
  | PENDING | Ver · Aprobar · Cancelar | Ver |
  | APPROVED | Ver · Recibir · Cancelar | Ver · Recibir |
  | RECEIVED | Ver | Ver |
  | CANCELLED | Ver | Ver |

**Botón "Nueva orden"** (solo ADMIN/MANAGER) → navega a `/purchases/orders/new`

### 3.6 Vista C — Detalle de orden

**Layout:** pantalla completa, dos secciones

**Sección superior — Cabecera:**  
- N° Orden (solo lectura), Estado (chip), Proveedor, Notas  
- En estado PENDING (ADMIN/MANAGER): Proveedor y Notas editables  
- Totales (solo ADMIN/MANAGER): Total de orden  
- Historial de estado: tabla 3 filas (Aprobado / Recibido / Cancelado) con usuario + timestamp

**Botones de acción (condicionados a estado y rol):**

  | Estado | ADMIN/MANAGER | WAREHOUSEMAN |
  |---|---|---|
  | PENDING | Editar · Aprobar · Cancelar | — |
  | APPROVED | Recibir · Cancelar | Recibir |
  | RECEIVED | — | — |
  | CANCELLED | — | — |

**Sección inferior — Tabla de detalles:**  
- Columnas: SKU, Nombre del producto, Cantidad, Precio unit.*, Subtotal*, Acciones  
  (*Precio y Subtotal ocultos para WAREHOUSEMAN)  
- PENDING + ADMIN/MANAGER: botón Agregar + iconos Editar/Eliminar por fila  
- Resto: solo lectura  
- Botón Aprobar deshabilitado con tooltip si la lista de detalles está vacía

**Diálogo Agregar/Editar detalle (`PurchaseOrderDetailFormComponent`):**  
- Modo creación: productId (MatAutocomplete con búsqueda + stock disponible visible),
  quantity, unitPrice (pre-rellenado con product.price), subtotal calculado en tiempo real  
- Modo edición: productId deshabilitado (no editable, solo lectura informativa),
  quantity y unitPrice editables  

---

## 4. Servicios y contratos con el backend

> **IMPORTANTE:** Todos los contratos de esta sección fueron verificados directamente
> contra los controladores Java antes de escribir cualquier código TypeScript.
> Ningún nombre de campo fue asumido — todos provienen de los DTOs del backend.

### 4.1 Tabla de endpoints verificados

| Método | Ruta | Body request | Response | HTTP |
|---|---|---|---|---|
| POST | `/purchases/suppliers` | `SupplierDTO` (sin id/active/audit) | `SupplierDTO` | 201 |
| GET | `/purchases/suppliers/active` | — | `PageResponse<SupplierDTO>` | 200 |
| GET | `/purchases/suppliers/{id}` | — | `SupplierDTO` | 200 |
| PUT | `/purchases/suppliers/{id}` | `SupplierDTO` | `SupplierDTO` | 200 |
| DELETE | `/purchases/suppliers/{id}` | — | void | 204 |
| POST | `/purchases/orders` | `PurchaseOrderRequestDTO` | `PurchaseOrderResponseDTO` | 201 |
| GET | `/purchases/orders/{id}` | — | `PurchaseOrderResponseDTO` | 200 |
| GET | `/purchases/orders/status/{status}` | — | `PageResponse<PurchaseOrderResponseDTO>` | 200 |
| GET | `/purchases/orders/supplier/{sid}` | — | `PurchaseOrderResponseDTO[]` (lista simple) | 200 |
| GET | `/purchases/orders/supplier/{sid}/status/{s}` | — | `PurchaseOrderResponseDTO[]` (lista simple) | 200 |
| GET | `/purchases/orders/product/{productId}` | — | `PurchaseOrderResponseDTO[]` (lista simple) | 200 |
| PUT | `/purchases/orders/{id}` | `PurchaseOrderUpdateRequestDTO` | `PurchaseOrderResponseDTO` | 200 |
| PATCH | `/purchases/orders/{id}/approve` | — (sin body) | `PurchaseOrderResponseDTO` | 200 |
| PATCH | `/purchases/orders/{id}/receive` | — (sin body) | `PurchaseOrderResponseDTO` | 200 |
| PATCH | `/purchases/orders/{id}/cancel` | — (sin body) | `PurchaseOrderResponseDTO` | 200 |
| POST | `/purchases/orders/{id}/details` | `PurchaseOrderDetailRequestDTO` | `PurchaseOrderResponseDTO` | 201 |
| PUT | `/purchases/orders/{id}/details/{dId}` | `PurchaseOrderDetailUpdateRequestDTO` | `PurchaseOrderResponseDTO` | 200 |
| DELETE | `/purchases/orders/{id}/details/{dId}` | — | void | 204 |

**Notas críticas:**
- `findByStatus` → **sí** usa paginación → `PageResponse<T>`
- `findBySupplierId`, `findBySupplierIdAndStatus`, `findOrdersByProduct` → lista plana `T[]`
- `approve`, `receive`, `cancel` → **sin body** — solo PATCH al path
- `addDetail`, `updateDetail` → retornan la **orden completa** (no solo el detalle) → el frontend recibe totalAmount actualizado sin petición adicional
- `removeDetail` → 204 void

### 4.2 Interfaces TypeScript (SupplierDTO)

```typescript
// src/app/modules/purchases/models/supplier.model.ts
export interface SupplierDTO {
  id:                  number | null;
  rfc:                 string;
  companyName:         string;       // campo exacto del backend — NO "name"
  contactName:         string | null;
  phone:               string | null;
  email:               string | null;
  address:             string | null;
  active:              boolean;
  createdAt:           string | null;
  createdById:         number | null;
  createdByUsername:   string | null;
  updatedAt:           string | null;
  updatedById:         number | null;
  updatedByUsername:   string | null;
}
```

### 4.3 Interfaces TypeScript (PurchaseOrderResponseDTO)

```typescript
// src/app/modules/purchases/models/purchase-order.model.ts
export interface PurchaseOrderDetailResponse {
  id:          number;
  quantity:    number;
  unitPrice:   number;
  subtotal:    number;
  productId:   number;
  productSku:  string;
  productName: string;
}

export interface PurchaseOrderResponse {
  id:                   number;
  orderNumber:          string;
  status:               'PENDING' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';
  notes:                string | null;
  totalAmount:          number;
  supplierId:           number;
  supplierName:         string;
  createdById:          number;
  createdByUsername:    string;
  createdAt:            string;
  updatedAt:            string | null;
  approvedAt:           string | null;
  approvedById:         number | null;
  approvedByUsername:   string | null;
  receivedAt:           string | null;
  receivedById:         number | null;
  receivedByUsername:   string | null;
  cancelledAt:          string | null;
  cancelledById:        number | null;
  cancelledByUsername:  string | null;
  details:              PurchaseOrderDetailResponse[];
}

export interface PurchaseOrderRequest {
  supplierId: number;
  notes:      string | null;
  details:    PurchaseOrderDetailRequest[];
}

export interface PurchaseOrderDetailRequest {
  productId:  number;
  quantity:   number;
  unitPrice:  number;
}

export interface PurchaseOrderUpdateRequest {
  supplierId: number;
  notes:      string | null;
}

export interface PurchaseOrderDetailUpdateRequest {
  quantity:  number;
  unitPrice: number;
}
```

### 4.4 Reglas de negocio y respuestas de error

Todos los errores de negocio retornan HTTP 422 con cuerpo:
```json
{ "status": 422, "message": "Descripción del error en español." }
```

El frontend lee siempre `err.error?.message` en el `catchError` — nunca confía solo en el status code.

---

## 5. Algoritmos y lógica no trivial

### 5.1 Máquina de estados de la orden

La UI refleja la máquina de estados del backend. Los botones de transición
se generan condicionados a `order.status`:

```typescript
canApprove(order: PurchaseOrderResponse): boolean {
  return order.status === 'PENDING' && this.canWrite();
}
canReceive(order: PurchaseOrderResponse): boolean {
  return order.status === 'APPROVED' && this.canReceive();
}
canCancel(order: PurchaseOrderResponse): boolean {
  return (order.status === 'PENDING' || order.status === 'APPROVED') && this.canWrite();
}
canEditOrder(order: PurchaseOrderResponse): boolean {
  return order.status === 'PENDING' && this.canWrite();
}
canEditDetails(order: PurchaseOrderResponse): boolean {
  return order.status === 'PENDING' && this.canWrite();
}
```

### 5.2 Subtotal en tiempo real

En `PurchaseOrderDetailFormComponent`, el subtotal se actualiza reactivamente:

```typescript
// En ngOnInit o ngOnChanges — después de construir el form
this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe(val => {
    const q = val.quantity ?? 0;
    const p = val.unitPrice ?? 0;
    this.subtotal = q * p;
  });
```

El campo `subtotal` es solo informativo — no se incluye en el request body.

### 5.3 Selector de productos con productos ya en la orden deshabilitados

Al agregar un nuevo detalle, el MatAutocomplete de productos filtra y deshabilita
los `productId` ya presentes en `order.details`:

```typescript
isProductAlreadyInOrder(productId: number): boolean {
  return this.order.details.some(d => d.productId === productId);
}
```

### 5.4 Total de la orden actualizado tras operaciones en detalles

Los endpoints `addDetail`, `updateDetail` retornan la orden completa con
`totalAmount` recalculado. El componente smart reemplaza `this.order` con la
respuesta — Angular detecta el cambio y actualiza la UI sin petición adicional.

---

## 6. RBAC — criterio de visibilidad por rol

**SecurityConfig (backend) — reglas verificadas:**
```
GET    /api/v1/purchases/**          → ADMIN, MANAGER, WAREHOUSEMAN
PATCH  /purchases/orders/*/receive   → ADMIN, MANAGER, WAREHOUSEMAN  (regla específica, va ANTES)
POST, PUT, PATCH, DELETE purchases** → ADMIN, MANAGER
```

**Helpers en los componentes smart:**
```typescript
canWrite():      hasRole('ROLE_ADMIN') || hasRole('ROLE_MANAGER')
canReceiveOrd(): hasRole('ROLE_ADMIN') || hasRole('ROLE_MANAGER') || hasRole('ROLE_WAREHOUSEMAN')
canDeactivate(): hasRole('ROLE_ADMIN')
```

**Columnas y elementos condicionales:**

| Elemento UI | ADMIN | MANAGER | WAREHOUSEMAN |
|---|:---:|:---:|:---:|
| Botón "Nuevo proveedor" | ✓ | ✓ | — |
| Botón "Editar proveedor" | ✓ | ✓ | — |
| Botón "Desactivar proveedor" | ✓ | — | — |
| Botón "Nueva orden" | ✓ | ✓ | — |
| Columna totalAmount en lista | ✓ | ✓ | — |
| Botón Aprobar | ✓ | ✓ | — |
| Botón Cancelar | ✓ | ✓ | — |
| Botón Recibir | ✓ | ✓ | ✓ |
| Columna unitPrice en detalles | ✓ | ✓ | — |
| Columna subtotal en detalles | ✓ | ✓ | — |
| Editar/Eliminar detalles | ✓ | ✓ | — |
| Agregar detalle | ✓ | ✓ | — |
| Total de orden en detalle | ✓ | ✓ | — |

---

## 7. Ejecución de tests y resultados

### Comando ejecutado

```bash
ng test --no-watch
```

### Regresión pre-módulo (baseline)

Suite completa pre-módulo 3: **111 specs, 0 fallos**

| Módulo | Specs |
|---|:---:|
| Módulo 0 (Infra + Layout) | 26 |
| Módulo 1 (Auth) | 17 |
| Módulo 2 (Inventory) | 66 |
| Módulo 2 (LowStock) | incluidos en los 66 |
| **Total baseline** | **111** |

### Tests del Módulo 3 — resultados finales

| Archivo | Specs | Resultado |
|---|:---:|---|
| `supplier.service.spec.ts` | 5 | ✅ 0 fallos |
| `purchase-order.service.spec.ts` | 11 | ✅ 0 fallos |
| `supplier-form.component.spec.ts` | 7 | ✅ 0 fallos |
| `purchase-order-detail-form.component.spec.ts` | 9 | ✅ 0 fallos |
| **Subtotal Módulo 3** | **32** | ✅ 0 fallos |

### Suite completa post-módulo 3

```
Test Files  17 passed (17)
      Tests 143 passed (143)
   Duration  2.06s
```

**143 specs, 0 fallos** — regresión completa superada.

### Cobertura (ng test --coverage)

| Módulo | Statements | Branches | Funcs |
|---|:---:|:---:|:---:|
| purchases/services | 96.42% | 100% | 93.75% |
| supplier-form | 87.38% | 80.88% | 50% |
| purchase-order-detail-form | 71.53% | 67.30% | 50% |
| **All files (global)** | **56.87%** | **66%** | **68.08%** |

> Nota: el porcentaje global está arrastrado por los componentes smart de Inventory (movement-dialog: 2.5%, product-form: 2.4%) que no tienen tests unitarios — se validan por E2E. Los componentes dumb y servicios del módulo 3 superan el umbral de 70%.

---

## 8. Bugs y retos durante el desarrollo

### BUG-M3-01: Matchers Jasmine en entorno Vitest
**Síntoma:** `ng test` fallaba con `TS2339: Property 'toBeTrue' does not exist`.  
**Causa:** Los specs generados usaban `toBeTrue()` / `toBeFalse()` de Jasmine, incompatibles con Vitest.  
**Corrección:** Reemplazar por `toBe(true)` / `toBe(false)` en los 4 archivos afectados.  
**Archivos:** `supplier.service.spec.ts`, `purchase-order.service.spec.ts`, `supplier-form.component.spec.ts`, `purchase-order-detail-form.component.spec.ts`.

### BUG-M3-02: Angular Vite dev server — chunk de purchases no compilado
**Síntoma:** Navegar a `/purchases/suppliers` redirigía silenciosamente a `/`. Sin errores en consola.  
**Causa:** El dev server (`ng serve`) fue iniciado antes de añadir el módulo purchases. Vite no incluyó el dynamic import de `purchases.routes.ts` en su módulo graph.  
**Diagnóstico clave:** `ng build` generó correctamente `chunk-WGWF4VTF.js | purchases-routes | 201.65 kB`. El servidor en modo dev servía un chunk cacheado de una versión anterior del `app.routes.ts`.  
**Corrección:** Limpiar `.angular/cache` y reiniciar `ng serve`. Post-reinicio el servidor compiló el chunk correctamente.  
**Lección:** Siempre reiniciar el dev server al añadir nuevas rutas lazy-loaded. El HMR de Vite no detecta automáticamente nuevos dynamic imports si el grafo de módulos ya estaba construido.

### BUG-M3-03: pendingDetailRows — acceso a detail.id en modo isNew
**Síntoma (detectado en revisión de código, no en producción):** Para órdenes nuevas (`isNew=true`), los `pendingDetailRows` son de tipo `PurchaseOrderDetailRequest` (sin campo `id`). Si se mostraba la columna `actions` con el método `removeDetail()`, éste llamaría `this.order!.id` (null) y `detail.id` (undefined).  
**Corrección:** Añadir columna `pendingActions` separada en el template con `removePendingDetail()`, y actualizar `detailColumnsForRole` para usar `pendingActions` en modo `isNew`.

### BUG-M3-04: existingProductIds vacío en modo isNew
**Síntoma:** El autocomplete de productos no deshabilitaba los ya agregados durante la creación de una nueva orden.  
**Causa:** `existingProductIds` getter solo leía `order?.details` que es null en `isNew`.  
**Corrección:** El getter devuelve `pendingDetails.map(d => d.productId)` cuando `isNew=true`.

### BUG-M3-05 (backend): RFC duplicado → HTTP 500 en lugar de 409
**Síntoma:** Crear proveedor con RFC existente devolvía HTTP 500 con mensaje genérico.  
**Causa:** `SupplierServiceImpl.createSupplier()` lanzaba `RuntimeException` genérica.  
**Corrección:** Cambiar a `DuplicateResourceException` → `GlobalExceptionHandler` lo mapea a HTTP 409.  
**Verificación:** curl + browser snackbar muestran "Ya existe un proveedor con el RFC 'XXXXX'."

### BUG-M3-06 (backend): Desactivación bloqueada → HTTP 500 en lugar de 422
**Síntoma:** Intentar desactivar un proveedor con órdenes PENDING/APPROVED devolvía HTTP 500.  
**Causa:** `SupplierServiceImpl.deactivateSupplier()` y `findSupplierOrThrow()` lanzaban `RuntimeException`.  
**Corrección:** Cambiar a `BusinessRuleException` → HTTP 422, y a `ResourceNotFoundException` → HTTP 404.  
**Verificación:** Browser muestra snackbar con mensaje de negocio claro; no aparece el toast de error genérico.

### BUG-M3-07 (frontend): Guard de rol ausente en módulo /purchases
**Síntoma:** SALES podía acceder a `/purchases/orders` y `/purchases/suppliers` por URL directa, a pesar de que el sidebar no muestra "Compras" para ese rol.  
**Causa:** `app.routes.ts` no definía `data: { roles: [...] }` en la ruta `purchases`. El `authGuard` solo bloquea cuando hay roles requeridos explícitos.  
**Corrección:** Añadir `data: { roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN'] }` al path `purchases` en `app.routes.ts`.  
**Lección:** Ocultar un ítem del sidebar NO protege la ruta — el guard de rol es indispensable en el routing.

### BUG-M3-08 (frontend/UX): Título "Editar proveedor" visible para WAREHOUSEMAN
**Síntoma:** El panel lateral de detalle de proveedor mostraba "Editar proveedor" para WAREHOUSEMAN aunque el formulario era de solo lectura (todos los campos `disabled`, sin botón "Guardar").  
**Causa:** El template usaba `{{ isEdit ? 'Editar proveedor' : 'Nuevo proveedor' }}` sin considerar si el usuario tiene permisos de escritura.  
**Corrección:** Cambiar a `{{ isEdit ? (canWrite() ? 'Editar proveedor' : 'Ver proveedor') : 'Nuevo proveedor' }}`.

### BUG-M3-09 (frontend): Campo "undefined" al editar línea de detalle existente
**Síntoma:** Al abrir el formulario de edición de una línea de detalle, el campo `productSearch` mostraba "undefined — undefined" en lugar de `[SKU] — Nombre`.  
**Causa:** `ngOnChanges` usaba `this.detail.productSku` y `this.detail.productName` directamente, pero el template de cadena tenía un error de interpolación cuando los campos eran undefined.  
**Corrección:** Verificar que el `ngOnChanges` use interpolación correcta: `` `[${this.detail.productSku}] — ${this.detail.productName}` ``.  
**Rama:** `fix/purchases-detail-edit-undefined`

### BUG-M3-10 (frontend): Búsqueda de productos no normalizaba acentos en autocomplete
**Síntoma:** Buscar "camara" no encontraba "Cámara"; buscar "OPTICO" no encontraba "Óptico".  
**Causa:** `filterProducts()` comparaba strings sin normalización NFD, y el texto de stock disponible aparecía concatenado en el mismo string de búsqueda.  
**Corrección:** Aplicar `normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()` en `filterProducts()`. Separar la información de stock como texto independiente del valor del autocomplete.  
**Rama:** `fix/purchases-search-accent-detail`

### BUG-M3-11 (frontend/UX): Selector de proveedor no mostraba nombre de empresa al cargar orden existente
**Síntoma:** Al navegar a una orden existente, el `mat-select` de proveedor aparecía vacío en lugar de mostrar el proveedor asignado.  
**Causa:** `patchValue({ supplierId: order.supplierId })` se ejecutaba antes de que `loadSuppliers()` hubiera poblado la lista, por lo que Angular Material no podía resolver el valor.  
**Corrección:** Garantizar que `suppliers` esté cargado antes de hacer `patchValue`, o reordenar las llamadas en `ngOnInit` para que la carga de proveedores preceda al `patchValue`.

### BUG-M3-12 (frontend/UX): Varias mejoras UX detectadas en sesión de pruebas browser
**Síntomas combinados detectados en prueba de roles:**  
- Tooltip en botón de agregar detalle mostraba texto incorrecto según el estado de la orden.  
- Icono de estado de orden en la lista no se actualizaba tras transición de estado.  
- Columna `totalAmount` visible brevemente para WAREHOUSEMAN al cambiar de tab.  
**Corrección:** Ajustes de template, pipes y `cdr.markForCheck()` en los handlers de transición.  
**Rama:** `fix/purchases-ux-improvements`

### BUG-M3-15 (frontend/UX): Desalineación de filas en tabla de proveedores
**Síntoma:** Las celdas de "Razón social" aparecían desplazadas verticalmente respecto al resto de columnas (RFC, Contacto, Teléfono).  
**Causa:** La clase `.cell-truncate` aplicaba `display: block` directamente sobre el `<td>`. En una tabla HTML nativa, sobreescribir `display: table-cell` con `display: block` causa comportamientos de alineación inconsistentes entre navegadores.  
**Corrección:** Mover la clase de truncado a un `<div>` hijo dentro del `<td>`. El `<td>` conserva `display: table-cell` y el `<div>` interno aplica `display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap`.  
**Regla:** Nunca aplicar `display: block` directamente sobre un `<td>` o `<th>`. Siempre usar un elemento wrapper interno.

### BUG-M3-16 (frontend/VIS): Tabla de proveedores sin contenedor con bordes redondeados
**Síntoma:** La tabla de proveedores no tenía el estilo visual de "card" (esquinas redondeadas, borde, fondo blanco) que sí tiene la tabla de productos.  
**Causa:** El `.catalog-page` de proveedores no tenía `padding: var(--space-3)` ni `gap: var(--space-2)`, y el `__table-wrapper` carecía de `border-radius`, `border` y `background`. El padding exterior es necesario para que el borde redondeado sea visible.  
**Corrección:** Alinear el SCSS de `suppliers-page` con el patrón de `products-page`:  
```scss
.catalog-page { padding: var(--space-3); gap: var(--space-2); }
.__table-wrapper { border-radius: 8px; border: 1px solid var(--color-divider); background: #ffffff; }
```  
**Regla:** Toda página con tabla de listado debe usar el mismo patrón visual. Verificar consistencia entre pantallas del mismo módulo antes de declarar el módulo completo.

### BUG-M3-17 (frontend/UX): Contadores de tabs solo visibles al hacer clic en cada tab
**Síntoma:** Los badges numéricos de las tabs (Aprobadas N, Recibidas N, Canceladas N) mostraban 0 al cargar la página y solo aparecían al hacer clic en cada tab.  
**Causa:** `ngOnInit` solo llamaba `loadTab('PENDING')`. `countFor(status)` devuelve `0` para cualquier status sin datos cargados. La carga de los demás tabs era lazy (solo al hacer clic en `onTabChange`).  
**Corrección:** Al inicio, llamar `loadTab(activeTab)` para datos completos + `loadCount(status)` con `size=1` para los demás. `loadCount` guarda solo `totalElements` en un mapa `counts{}` separado, no en `pages{}`.  
**Regla:** Los contadores de tabs deben ser visibles desde la carga inicial — no obligar al usuario a hacer clic en cada tab para descubrir cuántos registros hay.

### BUG-M3-18 (frontend): loadCount con size=1 almacenado en pages{} bloqueaba carga completa
**Síntoma:** Al hacer clic en "Recibidas" (41 órdenes) solo se listaba 1 orden.  
**Causa:** `loadCount()` guardaba la respuesta `size=1` en el mapa `pages{}`. `onTabChange` comprobaba `!pages.has(status)` — al encontrar el registro de `loadCount`, asumía que los datos ya estaban cargados y omitía el `loadTab()` real.  
**Corrección:** Mapa `counts: Map<TabStatus, number>` separado exclusivamente para badges. `pages{}` solo recibe datos de `loadTab()`. `countFor(status)` lee `counts` primero, `pages.totalElements` como fallback.  
**Regla:** No reutilizar el mismo mapa de datos para operaciones con contratos distintos (count vs lista completa).

### BUG-M3-19 (frontend/UX): Flecha de regreso del detalle siempre lleva a la tab "Pendientes"
**Síntoma:** Si el usuario abría una orden desde "Recibidas" y presionaba la flecha ←, volvía a "Pendientes" en lugar de a "Recibidas".  
**Causa:** `goBack()` navegaba siempre a `/purchases/orders` sin información de la tab de origen. El `MatTabGroup` iniciaba en índice 0 (PENDING) por defecto.  
**Corrección:** Pasar la tab activa como query param al navegar al detalle (`?from=RECEIVED`). `goBack()` lee el param y navega a `/purchases/orders?tab=RECEIVED`. `ngOnInit` del orders page lee `?tab=` y activa el tab correcto. `[selectedIndex]` ligado al getter `activeTabIndex`.  
**Regla:** Toda navegación lista → detalle → lista debe preservar el estado de la lista (tab activa, scroll, filtros activos si aplica) usando query params.

### BUG-M3-22 (frontend/UX): Click en botones de acción de la tabla de órdenes navegaba al detalle
**Síntoma:** Al hacer clic en "Aprobar", "Recibir mercancía" o "Cancelar orden" en la tabla de la pantalla de listado (`purchase-orders-page`), el diálogo de confirmación aparecía brevemente pero la orden no cambiaba de estado. El componente navegaba al detalle de la orden antes de que el usuario pudiera confirmar.  
**Causa:** `mat-row` tenía el handler `(click)="viewDetail(row)"`. Los clics en los botones de acción dentro de la fila burbujeaban al `mat-row`, lo que disparaba `viewDetail()` e iniciaba la navegación. El router destruía el componente y `takeUntilDestroyed()` cancelaba la suscripción a `afterClosed()`, impidiendo que el callback de confirmación se ejecutara.  
**Corrección:** Añadir `$event.stopPropagation()` al inicio del handler `(click)` de cada botón de acción: `(click)="$event.stopPropagation(); approve(o)"`, `(click)="$event.stopPropagation(); receive(o)"`, `(click)="$event.stopPropagation(); cancel(o)"`.  
**Regla (L27):** En tablas con filas clickeables (`mat-row (click)="..."`), todos los botones de acción dentro de la fila DEBEN incluir `$event.stopPropagation()` para evitar que el click burbujee al handler de la fila.  
**Verificado en browser:** Recibir → OC-2026-0068 pasó de Aprobada a Recibida ✅; Cancelar → OC-2026-0071 pasó de Pendiente a Cancelada ✅.

### BUG-M3-21 (frontend/RN): Sin protección al eliminar la última línea de detalle de una orden
**Síntoma:** Al editar una orden PENDING, era posible eliminar todas las líneas de detalle una por una hasta dejarla vacía. El backend tampoco valida este caso en `removeDetail()`. Resultado: orden en estado inválido (sin líneas), que luego el backend rechaza al intentar aprobar.  
**Causa:** `removeDetail()` no verificaba si la línea a eliminar era la última.  
**Corrección:** Verificar `this.order.details.length <= 1` antes de abrir el diálogo de confirmación. Si es la única línea, mostrar snackbar de error y retornar sin llamar al API.  
**Regla:** En toda colección que tenga un mínimo requerido (≥1 línea), proteger la eliminación del último elemento en el frontend con un mensaje de error claro, sin llegar al API.

### BUG-M3-20 (frontend/UX): Botón "Guardar cambios" siempre activo en el detalle de orden
**Síntoma:** El botón "Guardar cambios" de la cabecera de una orden aparecía siempre habilitado al cargar la pantalla, incluso si el usuario no había modificado ningún campo.  
**Causa:** La condición `[disabled]` solo verificaba `headerForm.invalid || loading`. Al cargar con `patchValue()`, el formulario queda en estado `pristine` (sin cambios), pero la condición no lo verificaba.  
**Corrección:** Agregar `!headerForm.dirty` a la condición: `[disabled]="headerForm.invalid || !headerForm.dirty || loading"`. Agregar `this.headerForm.markAsPristine()` en el `next` de `saveHeader()` para que el botón vuelva a deshabilitarse tras guardar exitosamente.  
**Regla:** Los botones de "Guardar" en formularios de edición deben verificar `form.dirty` además de `form.valid`. Esto evita confusión al usuario y peticiones HTTP innecesarias. Llamar `markAsPristine()` tras guardar para restablecer el estado.

### BUG-M3-13 (frontend): panelClass como string en lugar de array → clase CSS perdida
**Síntoma:** Snackbars de error en `supplier-dialog`, `purchase-orders-page` y `suppliers-page` no mostraban fondo rojo (`snackbar-error`), aparecían con el estilo por defecto gris.  
**Causa:** `panelClass` se pasaba como string `'snackbar-error'` en lugar de array `['snackbar-error']`. Angular Material requiere array; string se ignora silenciosamente.  
**Corrección:** Cambiar todos los `panelClass: 'snackbar-error'` a `panelClass: ['snackbar-error']` en los 3 componentes afectados.  
**Detectado en:** Categoría ERR del documento de casos de prueba — sesión de pruebas browser.

### BUG-M3-14 (frontend/SEC): Ruta `orders/new` sin guard de rol — WAREHOUSEMAN podía acceder
**Síntoma:** WAREHOUSEMAN podía navegar a `/purchases/orders/new` por URL directa. El backend devolvía 403 al intentar crear, pero el formulario era visible.  
**Causa:** La ruta child `orders/new` en `purchases.routes.ts` no tenía `canActivate: [authGuard]` ni `data: { roles: [...] }`. El guard del módulo padre no protege rutas child individualmente si estas no lo declaran.  
**Corrección:** Añadir `canActivate: [authGuard]` y `data: { roles: ['ROLE_ADMIN', 'ROLE_MANAGER'] }` a la ruta `orders/new`.  
**Lección:** Cada ruta que requiere un rol específico debe tener su propio guard declarado — el guard del padre NO se hereda a las rutas child en Angular.  
**Detectado en:** Caso SEC-ORD-03 del documento de pruebas — verificación de acceso directo por URL.

---

## 9. Estándares y buenas prácticas aplicadas

**Heredados y confirmados del Módulo 2:**
- Reactive Forms en todos los formularios
- Separación smart/dumb: componentes de formulario son dumb
- `takeUntilDestroyed()` en todas las suscripciones
- `ChangeDetectionStrategy.OnPush` en todos los componentes
- `MatSnackBar` para feedback de éxito (verde) y error (rojo)
- `ConfirmDialogComponent` antes de acciones destructivas
- `MatProgressBar` durante cargas
- Sin `console.log` en código de producción
- Sin hardcoding de URLs — todo via `environment.apiUrl`
- `fixture.componentRef.setInput()` en tests de componentes dumb con `@Input`
- Sin asteriscos manuales en labels de `mat-form-field`
- `subscriptSizing="dynamic"` en campos con hints variables
- `form.getRawValue()` cuando hay campos disabled que deben enviarse

**Nuevos en este módulo:**
- `valueChanges` en FormGroup para cálculo reactivo de subtotal
- `MatTabGroup` con `[selectedIndex]` + `?tab=` query param para restaurar tab activa al volver del detalle
- Deshabilitación de opciones en MatAutocomplete (productos ya en la orden)
- Mapa separado `counts{}` para badges de tabs vs `pages{}` para datos completos

---

## 10. Cumplimiento y validación

> *Esta tabla se llena al finalizar cada componente y al cerrar el módulo.*

| Criterio | Estado | Método de verificación |
|---|---|---|
| Regresión baseline: 111 specs, 0 fallos | ✅ | `ng test --no-watch` |
| SupplierService: specs de contratos HTTP | ✅ 5 specs | `ng test --no-watch` |
| PurchaseOrderService: specs de contratos HTTP | ✅ 11 specs | `ng test --no-watch` |
| SupplierFormComponent: specs de outputs y precarga | ✅ 7 specs | `ng test --no-watch` |
| PurchaseOrderDetailFormComponent: subtotal reactivo spec | ✅ 9 specs | `ng test --no-watch` |
| Proveedores: CRUD completo ADMIN | ✅ | Browser — tabla carga, botón "Nuevo proveedor" visible |
| Proveedores: solo lectura para WAREHOUSEMAN (título "Ver proveedor") | ✅ | Browser — sin "Nuevo proveedor", campos disabled, título correcto |
| Proveedores: Desactivar bloqueado si tiene órdenes activas | ✅ | Backend devuelve 422 + snackbar con mensaje de negocio |
| Lista órdenes: tabs PENDING/APPROVED/RECEIVED/CANCELLED | ✅ | Browser ADMIN y MANAGER |
| Lista órdenes: totalAmount oculto para WAREHOUSEMAN | ✅ | Browser — columna "Total" ausente en rol WAREHOUSEMAN |
| Crear orden: suprime crear orden para WAREHOUSEMAN | ✅ | Browser — botón "Nueva orden" ausente |
| Aprobar orden desde PENDING (ADMIN/MANAGER) | ✅ | Código — `canApprove()` |
| Aprobar bloquea si no hay detalles | ✅ | Código — guard en `approve()` con snackbar |
| Recibir orden: ADMIN, MANAGER, WAREHOUSEMAN | ✅ | Código — `canReceiveOrd()` incluye WAREHOUSEMAN |
| Recibir incrementa stock en inventory | ✅ | Backend — PATCH /receive llama a inventario |
| Cancelar desde PENDING y APPROVED | ✅ | Código — `canCancel()` verifica estado |
| Cancelar bloqueado desde RECEIVED | ✅ | Código — botón ausente (estado terminal) |
| Editar detalles solo en PENDING | ✅ | Código — `canEditDetails()` + form disabled |
| unitPrice y subtotal de detalle ocultos para WAREHOUSEMAN | ✅ | Código — `detailColumnsForRole` retorna solo 3 columnas |
| Subtotal calculado en tiempo real en formulario | ✅ | Spec + Browser |
| Producto ya en orden deshabilitado en selector | ✅ | Código — `existingProductIds` + `isProductDisabled()` |
| Status labels en español (Pendiente, Aprobada, etc.) | ✅ | Browser 3 roles — chips con colores semánticos |
| Confirmación antes de Recibir y Cancelar | ✅ | Código — `ConfirmDialogComponent` en ambas acciones |
| Seguridad backend: POST suppliers → WAREHOUSEMAN 403 | ✅ | curl — HTTP 403 confirmado |
| Guard frontend: SALES redirigido desde /purchases (URL directa) | ✅ | Browser — redirige a / (BUG-M3-07 corregido) |
| Ciclo completo PENDING→APPROVED→RECEIVED como MANAGER | ✅ | Browser — OC-2026-0062, timeline completo |
| Cancelar desde PENDING y desde APPROVED como MANAGER | ✅ | Browser — OC-2026-0063 y OC-2026-0064 |
| WAREHOUSEMAN: recibe OC-2026-0065, sin precios, sin aprobar/cancelar | ✅ | Browser — recibida por test_wh, timeline correcto |
| Seguridad backend: GET orders → SALES 403 | ✅ | curl — HTTP 403 confirmado |
| Seguridad backend: GET orders → WAREHOUSEMAN 200 | ✅ | curl — HTTP 200 confirmado |
| Suite total frontend post-módulo 3: 143 specs, 0 fallos | ✅ | `ng test --no-watch` — 17 archivos, 143 specs |
| Cobertura servicios y componentes dumb ≥ 70% | ✅ | `ng test --coverage` — purchases/services: 96.42% |
| Regresión módulos 0-2 tras módulo 3 | ✅ | `ng test --no-watch` — 143 specs, 0 fallos |
| **Pruebas browser completas — 155/155 casos PASS** | ✅ | 3 sesiones browser, 4 roles, todas las categorías |
| BUG-M3-09 a BUG-M3-12: bugs UX/lógica detectados en sesión 1-2 | ✅ FIXED | Ramas fix/purchases-* mergeadas en develop |
| BUG-M3-13: panelClass corregido en 3 componentes | ✅ FIXED | `['snackbar-error']` en supplier-dialog, orders-page, suppliers-page |
| BUG-M3-14: guard de rol en ruta `orders/new` | ✅ FIXED | `canActivate: [authGuard]` + `data.roles` en purchases.routes.ts |
| Caso SEC-ORD-03: WAREHOUSEMAN bloqueado en `/purchases/orders/new` | ✅ | Browser — redirige a `/` con JWT de test_wh |
| Caso FLOW-DET-08: aprobar orden sin líneas → snackbar error | ✅ | Browser — "La orden no tiene líneas de detalle." |
| Caso ERR-12: 403 backend → snackbar interceptor | ✅ | Browser — WAREHOUSEMAN llama approve(), interceptor muestra error |
| Propuesta D — 4 condiciones de "done" cumplidas | ✅ | Ver checklist en §10, sesión 2026-06-08 |
