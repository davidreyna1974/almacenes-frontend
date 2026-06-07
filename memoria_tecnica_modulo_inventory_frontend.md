# Memoria Técnica — Módulo 2: Inventario (frontend)
**Rama:** feature/inventory  
**Autor:** David Reyna Pineda  
**Fecha inicio:** 2026-06-05  
**Fecha cierre:** —  
**Estado:** En desarrollo

---

## 1. Contexto y justificación

El módulo de Inventario es la base de todo el sistema: los módulos de Compras y Ventas
dependen del catálogo de Productos y del estado de stock en tiempo real.

Se implementan dos grandes entidades:
- **Categorías**: organización jerárquica de productos (CRUD + soft delete).
- **Productos**: catálogo completo con precio, stock, SKU y estado; incluye registro de
  movimientos de entrada/salida y visualización del Kardex (historial por producto).

El módulo no incluye reportes de inventario (Módulo 5) ni gestión de proveedores (Módulo 3).

**Decisión de dependencia**: `supplierId` es obligatorio en `ProductRequestDTO` pero el módulo
de Proveedores aún no existe en el frontend. Solución: cargar proveedores desde
`GET /api/v1/purchases/suppliers/active`, que ya existe en el backend.

---

## 2. Decisiones de diseño

| # | Decisión | Justificación |
|---|---|---|
| D1 | Sub-navegación en `/inventory` mediante `MatTabsModule` ("Productos" \| "Categorías") | La URL refleja el tab activo sin romper el patrón master-detail existente |
| D2 | Kardex dentro del panel de detalle del producto (sección colapsable), no en ruta separada | Evita pérdida de contexto al navegar |
| D3 | Registro de movimiento mediante `MatDialog` con formulario reactivo | El dialog emite resultado; el componente padre recarga el Kardex |
| D4 | `status` como `MatSelect` con opciones descriptivas | AVAILABLE → "Disponible" / DISCONTINUED → "Descontinuado" / OUT\_OF\_STOCK → "Sin stock" |
| D5 | `StockBadgeComponent` dumb reutilizable para chip visual de stock | Verde > minimumStock / Naranja ≤ minimumStock / Rojo = 0 |
| D6 | Proveedores cargados desde `/api/v1/purchases/suppliers/active` | El endpoint backend existe; evita bloquear desarrollo de productos |
| D7 | `InventoryComponent` como shell con `MatTabGroup`; rutas hijas para productos y categorías | Permite routing tipado y lazy loading por tab |

---

## 3. Especificación de componentes/vistas

### 3.1 Árbol de componentes

```
src/app/modules/inventory/
  inventory.component.ts           (shell con MatTabGroup — smart)
  inventory.routes.ts
  models/
    category.model.ts
    product.model.ts
    stock-movement.model.ts
  services/
    category.service.ts
    product.service.ts
  components/
    categories-page/               (master-detail de categorías — smart)
    category-form/                 (formulario crear/editar — dumb)
    products-page/                 (master-detail de productos — smart)
    product-form/                  (formulario crear/editar — dumb)
    product-detail/                (detalle + Kardex — smart)
    movement-dialog/               (dialog registrar movimiento — smart)
    stock-badge/                   (badge visual de stock — dumb)
```

### 3.2 Rutas

| URL | Componente | Redirect |
|---|---|---|
| `/inventory` | InventoryComponent | → `/inventory/products` |
| `/inventory/products` | ProductsPageComponent | — |
| `/inventory/categories` | CategoriesPageComponent | — |

Todas protegidas con `authGuard`. Acciones de escritura controladas por
`authService.hasRole()` a nivel de componente (ocultar/deshabilitar botones).

### 3.3 Vistas

**CategoriesPageComponent**: panel lista (nombre, descripción, creado por, acciones) +
panel detalle inline con `CategoryFormComponent`. Botón "Nuevo" abre el formulario en blanco.
Desactivar muestra `ConfirmDialogComponent`.

**ProductsPageComponent**: panel lista con cuatro filtros combinables (búsqueda parcial
por código o nombre con debounce 400ms, selector de categoría, selector de estado,
selector de proveedor) + botón "limpiar filtros" cuando hay alguno activo. Carga todos
los productos activos por defecto al entrar. Tabla con columnas: código, nombre, categoría,
proveedor, stock (badge), precio, estado, acciones. Panel detalle con tabs: "Datos"
(`ProductFormComponent`) y "Kardex" (tabla paginada de `StockMovementResponseDTO`).
Botón "Registrar movimiento" abre `MovementDialogComponent`.

*Actualizado 2026-06-06*: búsqueda cambiada de SKU exacto (Enter) a parcial por SKU+nombre
(debounce). Agregados filtros de estado y proveedor. Columna proveedor visible en tabla.
Estado inicial cambiado de pantalla vacía a carga de todos los productos activos.

---

## 4. Servicios y contratos con el backend

> ⚠️ **Sección auditada el 2026-06-06** — contratos verificados contra el OpenAPI del backend
> y comportamiento observado en browser. Errores de la propuesta original corregidos aquí.

### 4.1 Endpoints consumidos (verificados)

**Categorías** (`/api/v1/inventory/categories`):
| Método | Ruta | Status | Request body | Respuesta |
|---|---|---|---|---|
| GET | `/active?page=0&size=20` | 200 | — | `PageResponse<CategoryDTO>` |
| POST | `/` | 201 | `CategoryRequest` | `CategoryDTO` |
| PUT | `/{id}` | 200 | `CategoryRequest` | `CategoryDTO` |
| DELETE | `/{id}` | 204 | — | void (sin body) |

**Productos** (`/api/v1/inventory/products`):
| Método | Ruta | Status | Request body | Respuesta |
|---|---|---|---|---|
| GET | `/?search=&categoryId=&status=&supplierId=&page=0&size=20` | 200 | — | `PageResponse<ProductResponseDTO>` |
| GET | `/{id}` | 200 | — | `ProductResponseDTO` |
| GET | `/sku/{sku}` | 200 | — | `ProductResponseDTO` |
| GET | `/category/{categoryId}?page=0&size=20` | 200 | — | `PageResponse<ProductResponseDTO>` |
| GET | `/low-stock?page=0&size=20` | 200 | — | `PageResponse<ProductResponseDTO>` |
| POST | `/` | 201 | `ProductRequestDTO` | `ProductResponseDTO` |
| PUT | `/{id}` | 200 | `ProductRequestDTO` | `ProductResponseDTO` |
| DELETE | `/{id}` | 204 | — | void (sin body) |

> ✅ **Implementado 2026-06-06**: `GET /api/v1/inventory/products` con todos los parámetros
> opcionales (search, categoryId, status, supplierId). Todos los filtros son opcionales;
> sin parámetros retorna todos los productos activos paginados, ordenados por name ASC.
> El componente `ProductsPageComponent` usa `ProductService.search(params)` para todos
> los casos — ya no bifurca entre `getBySku()` y `getByCategory()`.

**Movimientos de stock** (`/api/v1/inventory/products`):
| Método | Ruta | Status | Request body | Respuesta |
|---|---|---|---|---|
| POST | `/movement` | **204** | `StockMovementRequestDTO` | **void — sin body** |
| GET | `/{id}/movements?page=0&size=10` | 200 | — | `PageResponse<StockMovementResponseDTO>` |

> ⚠️ `POST /movement` retorna **204 No Content**, no un DTO. El observable debe
> ser `Observable<void>`. Usar `http.post<void>(...)` — si se tipea como `<StockMovementResponseDTO>`,
> Angular parsea `null` silenciosamente y el componente puede crashear.

**Proveedores** (desde módulo Compras — `/api/v1/purchases/suppliers`):
| Método | Ruta | Status | Respuesta |
|---|---|---|---|
| GET | `/active?page=0&size=200` | 200 | `PageResponse<SupplierBackendDTO>` |

> ⚠️ El campo del nombre del proveedor en el backend es **`companyName`** (no `name`).
> El `ProductService.getActiveSuppliers()` aplica un `map()` para transformar:
> `{ id: s.id, name: s.companyName }` → `SupplierOption` usado en el frontend.
> Sin esta transformación, el dropdown de proveedores muestra etiquetas vacías.

### 4.2 Contratos de DTOs (campos exactos del backend)

```typescript
// category.model.ts
export interface CategoryDTO {
  id:                number;
  name:              string;
  description:       string;
  active:            boolean;
  createdAt:         string;   // ISO 8601
  createdByUsername: string;
}
export interface CategoryRequest {
  name:         string;        // requerido
  description?: string;
}

// product.model.ts
export type ProductStatus = 'AVAILABLE' | 'DISCONTINUED' | 'OUT_OF_STOCK';

export interface ProductResponseDTO {
  id:                number;
  sku:               string;
  name:              string;
  description:       string;
  price:             number;
  currentStock:      number;
  minimumStock:      number;
  status:            ProductStatus;
  active:            boolean;
  reservedStock:     number;
  availableStock:    number;
  unitCost:          number;   // NOT NULL — requerido por módulo reports
  categoryId:        number;
  categoryName:      string;
  supplierId:        number;
  supplierName:      string;   // agregado 2026-06-06 — antes solo existía supplierId
  createdAt:         string;   // ISO 8601
  createdByUsername: string;
  updatedAt:         string;   // ISO 8601
}
export interface ProductRequestDTO {
  sku:           string;       // requerido, único
  name:          string;       // requerido
  description?:  string;
  price:         number;       // requerido, > 0
  currentStock?: number;       // default 0 en backend
  minimumStock?: number;       // default 0 en backend
  status:        ProductStatus; // requerido
  categoryId:    number;       // requerido — FK a categoría activa
  supplierId:    number;       // requerido — FK a proveedor activo
  unitCost:      number;       // requerido, NOT NULL en BD
}

// Interfaz para el dropdown de proveedores (mapeada en el servicio)
export interface SupplierOption {
  id:   number;
  name: string;   // mapeado desde companyName del backend
}
// DTO real del backend (no se expone al componente):
// { id: number, companyName: string, rfc: string, ... }

// stock-movement.model.ts
export type MovementType = 'IN' | 'OUT';

export interface StockMovementRequestDTO {
  productId: number;
  quantity:  number;       // entero positivo
  reason:    string;       // requerido
  type:      MovementType; // 'IN' | 'OUT'
}
export interface StockMovementResponseDTO {
  id:                number;
  quantity:          number;
  reason:            string;
  createdAt:         string;   // ISO 8601
  type:              MovementType;
  productId:         number;
  productName:       string;
  createdByUsername: string;
}
```

---

## 5. Algoritmos y lógica no trivial

### 5.1 Cálculo del color del StockBadge

```typescript
getStockColor(current: number, minimum: number): 'success' | 'warning' | 'error' {
  if (current === 0)            return 'error';
  if (current <= minimum)       return 'warning';
  return 'success';
}
```

Mapeo a variables CSS: `--color-success`, `--color-warning`, `--color-error`.

### 5.2 Recarga de Kardex tras movimiento

El `MovementDialogComponent` cierra con `dialogRef.close(true)` si el movimiento fue exitoso.
`ProductDetailComponent` escucha `afterClosed()` y, si recibe `true`, dispara una nueva
petición al endpoint `/{id}/movements?page=0`.

```typescript
openMovementDialog(product: ProductResponseDTO): void {
  const ref = this.dialog.open(MovementDialogComponent, { data: { product } });
  ref.afterClosed().pipe(
    filter(result => result === true),
    switchMap(() => this.productService.getMovements(product.id, 0, 10))
  ).subscribe(page => this.movements = page);
}
```

---

## 6. RBAC — criterio de visibilidad por rol

| Acción | ADMIN | MANAGER | WAREHOUSEMAN | SALES |
|---|:---:|:---:|:---:|:---:|
| Ver lista de categorías | ✓ | ✓ | ✓ | ✓ |
| Crear / editar categoría | ✓ | ✓ | — | — |
| Desactivar categoría | ✓ | ✓ | — | — |
| Ver lista de productos | ✓ | ✓ | ✓ | ✓ |
| Crear / editar producto | ✓ | ✓ | — | — |
| Desactivar producto | ✓ | — | — | — |
| Registrar movimiento de stock | ✓ | ✓ | ✓ | — |
| Ver Kardex | ✓ | ✓ | ✓ | ✓ |

**Implementación**: los botones se ocultan con `*ngIf="authService.hasRole('ROLE_ADMIN') || authService.hasRole('ROLE_MANAGER')"`.
Las rutas no requieren guard adicional (todos los roles autenticados pueden acceder a `/inventory`).

---

## 7. Ejecución de tests y resultados

> ⚠️ **Estado al 2026-06-05**: el Módulo 2 (Inventory) no tiene specs propios todavía.
> La suite actual cubre únicamente los Módulos 0 y 1 (Infra-base + Auth).
> Los tests del módulo inventory se escribirán en la siguiente fase del proyecto.

### Suite existente (Módulos 0 y 1 — validación de regresión)

| Comando | Resultado | Fecha |
|---|---|---|
| `ng test --watch=false` | **43 specs, 0 fallos** | 2026-06-05 |
| `ng test --watch=false --coverage` | **Statements: 98.09% · Branches: 89.61% · Functions: 100% · Lines: 98.61%** | 2026-06-05 |

**Resultado**: el módulo Inventory no introdujo regresiones en los módulos anteriores.

### Tests pendientes para el Módulo 2 (Inventory)

| Archivo de spec | Tipo | Qué verificar |
|---|---|---|
| `category.service.spec.ts` | B (servicio HTTP) | CRUD de categorías, manejo de errores |
| `product.service.spec.ts` | B (servicio HTTP) | search() con parámetros opcionales, CRUD productos, mapping `companyName`→`name`, 204 en movement |
| `categories-page.component.spec.ts` | A (componente) | Carga de lista, apertura de detalle, flujo de guardado |
| `products-page.component.spec.ts` | A (componente) | Carga por defecto, búsqueda parcial SKU+nombre con debounce, filtros por categoría/estado/proveedor, botón limpiar filtros, paginación |
| `product-detail.component.spec.ts` | A (componente) | Carga de Kardex al cambiar `item`, paginación de movimientos |
| `stock-badge.component.spec.ts` | A (componente dumb) | Colores según umbrales de stock |
| `movement-dialog.component.spec.ts` | A (componente) | Formulario reactivo, emisión de resultado `true`/`false` |

---

## 8. Bugs y retos durante el desarrollo

Todos los bugs de esta sección fueron detectados en el browser con datos reales —
ninguno fue capturado por la suite de tests unitarios existente. Esto motivó la creación
del **Protocolo obligatorio pre-código** documentado en `CLAUDE.md`.

### BUG-01: Panel "Nuevo producto" no se abría

**Síntoma**: al hacer clic en el botón "Nuevo producto", el panel de detalle no aparecía.
Sin mensaje de error visible en la UI.

**Causa raíz**: `getActiveSuppliers()` estaba tipado como `Observable<SupplierOption[]>`,
pero el backend retorna `PageResponse<SupplierOption>` (un objeto con campo `content`).
El componente asignaba `this.suppliers = sups` (el objeto completo), causando que el
`@for` en `ProductFormComponent` lanzara `TypeError: newCollection[Symbol.iterator] is not a function`
silenciosamente al intentar iterar el objeto como si fuera un array.

**Fix**: cambiar el tipo de retorno del servicio a `Observable<PageResponse<SupplierOption>>`
y extraer `.content` en el componente: `this.suppliers = sups.content`.

**Lección**: nunca asumir que un endpoint de colección retorna un array plano.
Todo endpoint de colección del backend retorna `PageResponse<T>`.

---

### BUG-02: Dropdown de proveedores mostraba etiquetas vacías

**Síntoma**: el dropdown de proveedores se abría pero todas las opciones aparecían en blanco.

**Causa raíz**: el template usaba `{{ sup.name }}` pero el backend envía `companyName` (no `name`).
La propiedad `name` era `undefined` para todos los proveedores.

**Fix**: agregar un operador `map` en el servicio para transformar el DTO del backend:
```typescript
map(page => ({ ...page, content: page.content.map((s: any) => ({ id: s.id, name: s.companyName })) }))
```

**Lección**: verificar siempre los nombres exactos de campos del DTO backend antes de mapear
a interfaces del frontend. El nombre intuitivo y el nombre real pueden diferir.

---

### BUG-03: Mensaje de confirmación incorrecto al crear

**Síntoma**: al crear un producto nuevo, el snackbar mostraba "Producto actualizado correctamente."
en lugar de "Producto creado correctamente."

**Causa raíz**: en `onSave()`, la llamada `this.closeDetail()` se hacía ANTES de leer
`this.isNewMode`. `closeDetail()` incluye `this.isNewMode = false`, por lo que el ternario
siempre evaluaba al mensaje de actualización.

**Fix**: capturar `const msg = this.isNewMode ? ... : ...` ANTES de llamar `closeDetail()`.

**El mismo bug existía** en `CategoriesPageComponent` y se corrigió en el mismo commit.

---

### BUG-04: Endpoint `GET /products` sin filtro no existe

**Síntoma**: al cargar la página de productos sin ningún filtro activo, el browser recibía
un 403 Forbidden (el endpoint no existe — Spring Security rechaza rutas no mapeadas).

**Causa raíz**: la propuesta del módulo listaba `GET /api/v1/inventory/products?page&size`
como un endpoint válido. Este endpoint **no existe en el backend**. Solo existen los endpoints
filtrados: `/category/{id}`, `/sku/{sku}`, `/low-stock`.

**Fix**: implementar un early-return en `load()` cuando no hay filtro activo, mostrando
el estado vacío del componente. La UI guía al usuario a seleccionar un filtro.

**Lección**: verificar TODOS los endpoints contra la especificación OpenAPI antes de codificar.
Una propuesta de módulo con endpoints incorrectos propaga el error al código.

---

### BUG-05: `POST /movement` retorna 204, no un DTO

**Síntoma**: (detectado en revisión de código — no llegó al browser) el servicio estaba tipado
como `Observable<StockMovementResponseDTO>`, pero el backend retorna 204 No Content sin body.

**Causa raíz**: la propuesta del módulo documentaba `POST /movement → StockMovementResponseDTO`.
El backend en realidad retorna 204 con body vacío.

**Fix**: cambiar el tipo a `Observable<void>` y usar `http.post<void>(...)`.

**Lección**: verificar siempre el HTTP status code real del endpoint, no solo el tipo de dato.
204 significa ausencia de body; parsear `null` como DTO causa errores en runtime.

---

## 9. Estándares y buenas prácticas aplicadas

- Reactive Forms para todos los formularios del módulo.
- Separación smart/dumb: `CategoryFormComponent` y `ProductFormComponent` son dumb (solo `@Input`/`@Output`).
- `takeUntilDestroyed()` en todas las suscripciones manuales.
- `async pipe` en templates donde sea posible.
- `MatSnackBar` para feedback de éxito (verde) y error (rojo).
- `ConfirmDialogComponent` reutilizable antes de soft-delete.
- `MatProgressBar` indeterminado en la parte superior de los paneles durante carga.
- `MatPaginator` vinculado a `PageResponse<T>` del backend.
- Sin `console.log` en código de producción.
- Sin hardcodeo de URLs — todo via `environment.apiUrl`.

---

## 10. Cumplimiento y validación

| Criterio | Estado | Método de verificación |
|---|---|---|
| Crear categoría → aparece en lista inmediatamente | ✓ | Browser — probado 2026-06-05 |
| Editar categoría → cambios reflejados | ✓ | Browser — probado 2026-06-05 |
| Desactivar categoría → desaparece (soft delete) | ✓ | Browser — probado 2026-06-05 |
| Crear producto con todos los campos | ✓ | Browser — probado 2026-06-05 |
| Filtrar productos por categoría | ✓ | Browser — probado 2026-06-05 |
| Buscar por SKU | ✓ | Browser — probado 2026-06-05 |
| Badge de stock muestra color correcto (verde/naranja/rojo) | ✓ | Browser — probado 2026-06-05 |
| Registrar movimiento IN → stock aumenta | ✓ | Browser — stock 50→60 verificado en Kardex |
| Registrar movimiento OUT → stock disminuye | ✓ | Browser — probado 2026-06-05 |
| Kardex muestra historial correcto con paginación | ✓ | Browser — probado 2026-06-05 |
| WAREHOUSEMAN puede registrar movimientos pero no crear/editar productos | ✓ | Código — `canWrite()` y `canRegisterMovement()` verificados |
| SALES solo puede leer (sin botones de escritura) | ✓ | Código — `canWrite()` retorna false para SALES |
| ADMIN puede desactivar productos; MANAGER no puede | ✓ | Código — `canDeactivate()` solo `ROLE_ADMIN` |
| Estado vacío cuando no hay filtro activo | ✓ | Browser — early-return muestra `EmptyStateComponent` |
| Mensaje correcto al crear vs editar | ✓ | Bug-03 corregido — captura `isNewMode` antes de `closeDetail()` |
| `ng test --watch=false` → 0 failures (regresión módulos 0-1) | ✓ | `43 specs, 0 fallos` — 2026-06-05 |
| Tests unitarios del módulo Inventory | ⬜ Pendiente | Specs no escritos aún |
| Cobertura ≥ 70% incluyendo módulo Inventory | ⬜ Pendiente | Depende de specs pendientes |
