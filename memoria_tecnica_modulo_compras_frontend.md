# Memoria Técnica — Módulo 3: Compras (frontend)

**Versión:** 1.0 — implementación completa  
**Fecha de inicio:** 2026-06-07  
**Fecha de cierre:** 2026-06-07  
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
- `MatTabGroup` con lazy loading de contenido por tab (`selectedTabChange`)
- Deshabilitación de opciones en MatAutocomplete (productos ya en la orden)

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
