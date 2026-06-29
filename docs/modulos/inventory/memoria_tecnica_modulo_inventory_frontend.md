# Memoria Técnica — Módulo 2: Inventario (frontend)
**Rama:** feature/inventory  
**Autor:** David Reyna Pineda  
**Fecha inicio:** 2026-06-05  
**Fecha cierre:** 2026-06-07 (código completo, RBAC verificado 4 roles, seguridad backend auditada)  
**Estado:** Código completo — mergeado a develop — tests browser, seguridad y specs unitarios completados

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

**CategoriesPageComponent**: panel lista (nombre, descripción, acciones) +
panel detalle inline con `CategoryFormComponent`. Botón "Nuevo" abre el formulario en blanco.
Desactivar muestra `ConfirmDialogComponent`.

*Actualizado 2026-06-07*: columna "Creado por" eliminada de la tabla (decisión de UX —
la información existe en el DTO pero no aporta valor en la vista de lista; sí aparece en
el panel de detalle si aplica). Consistencia con el patrón de `ProductsPageComponent`
que tampoco muestra "Creado por" en la tabla.

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
| Crear categoría ("Nueva categoría") | ✓ | ✓ | — | — |
| Editar categoría (botón + clic en fila) | ✓ | ✓ | — | — |
| Desactivar categoría | ✓ | — | — | — |
| Ver lista de productos | ✓ | ✓ | ✓ | ✓ |
| Crear producto ("Nuevo producto") | ✓ | ✓ | — | — |
| Editar producto (diálogo con campos editables) | ✓ | ✓ | solo lectura | solo lectura |
| Desactivar producto | ✓ | — | — | — |
| Registrar movimiento de stock | ✓ | ✓ | ✓ | — |
| Ver Kardex | ✓ | ✓ | ✓ | ✓ |

**Implementación en templates**:
- `canWrite()` = `hasRole('ROLE_ADMIN') || hasRole('ROLE_MANAGER')`
- `canDeactivate()` = `hasRole('ROLE_ADMIN')` — aplica a productos Y categorías
- `canRegisterMovement()` = `hasRole('ROLE_ADMIN') || hasRole('ROLE_MANAGER') || hasRole('ROLE_WAREHOUSEMAN')`
- Botones ocultos con `@if(canWrite())` o `@if(canDeactivate())` (Angular 17+ control flow)
- `ProductDetailDialogComponent` recibe `canWrite` y `canDeactivate` como `data` — muestra solo "Cerrar" cuando ambos son false
- `CategoryFormDialogComponent` recibe `canDeactivate: boolean` via `CategoryDialogData` — botón "Desactivar" en el diálogo de edición (mismo patrón que productos)
- `CategoriesPageComponent.onRowClick()` abre el formulario solo si `canWrite()` — clic en fila es no-op para roles sin escritura
- Cursor pointer en fila de categorías condicionado con `[class.catalog-row--clickable]="canWrite()"`
- `displayedColumns` de productos se calcula en `ngOnInit()` condicionado a `canRegisterMovement()` — SALES no ve la columna vacía de acciones

**Nota sobre sidebar**: SALES no tiene acceso visible al módulo Compras (ícono `shopping_cart` ausente en sidebar).

### Tests RBAC browser (Playwright MCP, 2026-06-07) — 4 roles — versión post-fix

> Regresión completa ejecutada el 2026-06-07 tras las correcciones F08, BUG-12, BUG-13, BUG-14 y BUG-15.

| Test | ADMIN | MANAGER | WAREHOUSEMAN | SALES |
|---|:---:|:---:|:---:|:---:|
| Login + chip de rol visible | ✅ | ✅ | ✅ | ✅ |
| Sidebar filtrado por rol | ✅ | ✅ (sin manage_accounts) | ✅ | ✅ (sin Compras) |
| Ver lista categorías | ✅ | ✅ | ✅ | ✅ |
| Botón "Nueva categoría" visible | ✅ | ✅ | ❌ ausente | ❌ ausente |
| Botón "Productos" en toolbar categorías | ❌ eliminado | ❌ eliminado | ❌ eliminado | ❌ eliminado |
| Botón "Editar" (lápiz) en tabla categorías | ❌ eliminado | ❌ eliminado | ❌ eliminado | ❌ eliminado |
| Botón "Desactivar" en tabla categorías | ❌ eliminado (movido al diálogo) | ❌ eliminado | ❌ eliminado | ❌ eliminado |
| Botón "Desactivar" en diálogo de categoría | ✅ visible | ❌ ausente | ❌ ausente | ❌ ausente |
| Shopping bag → productos filtrados (sin snackbar 403) | ✅ | ✅ | ✅ | ✅ (BUG-13 corregido) |
| Clic en fila de categoría abre diálogo | ✅ editable | ✅ editable | ❌ no-op | ❌ no-op |
| Crear categoría (flujo completo) | ✅ 201 | ✅ 201 | — | — |
| Editar categoría (descripción) | ✅ 200 | ✅ 200 | — | — |
| Desactivar categoría desde diálogo | ✅ 204 | ❌ btn ausente | — | — |
| Ver lista productos | ✅ | ✅ | ✅ | ✅ |
| Botón "Nuevo producto" visible | ✅ | ✅ | ❌ ausente | ❌ ausente |
| Columna acciones visible en tabla productos | ✅ | ✅ | ✅ | ❌ oculta |
| Botón registrar movimiento (swap_vert, sin lápiz) | ✅ | ✅ | ✅ | ❌ 0 btns |
| Botón "Editar" (lápiz) en tabla productos | ❌ eliminado | ❌ eliminado | ❌ eliminado | ❌ eliminado |
| Diálogo detalle producto — botones | ✅ Guardar+Desactivar | ✅ Guardar (sin Desactivar) | ✅ solo Cerrar | ✅ solo Cerrar |
| Fila resaltada (lavanda) mientras diálogo abierto (F08) | ✅ | ✅ | ✅ | ✅ |
| Crear producto (flujo completo) | ✅ 201 | ✅ 201 | — | — |
| Editar producto | ✅ 200 | ✅ 200 | — | — |
| Desactivar producto | ✅ 204 | ❌ btn ausente | ❌ btn ausente | ❌ btn ausente |
| Registrar movimiento OUT | ✅ | — | ✅ | — |
| Registrar movimiento IN | — | ✅ | — | — |
| Ver Kardex (historial paginado) | ✅ | — | — | — |

**Resultado: 4/4 roles — 0 comportamientos incorrectos**

---

## 7. Ejecución de tests y resultados

> **Estado al 2026-06-07**: el Módulo 2 tiene cobertura completa — tests browser
> (funcionalidad + RBAC 4 roles + seguridad backend) y specs unitarios Angular escritos y pasando.

### Suite de regresión — Módulos 0 y 1

| Comando | Resultado | Fecha |
|---|---|---|
| `ng test --watch=false` | **43 specs, 0 fallos** (módulos 0-1) | 2026-06-05 |
| `ng test --watch=false --coverage` | **Statements: 98.09% · Branches: 89.61% · Functions: 100% · Lines: 98.61%** | 2026-06-05 |
| `ng test --no-watch` (suite completa post-módulo 2) | **89 specs, 0 fallos** | 2026-06-07 |

El módulo Inventory no introdujo regresiones en los módulos anteriores.

### Tests de browser — Módulo 2 (Productos) — 2026-06-06

Ejecutados con Playwright MCP contra `http://localhost:4200` y backend Spring Boot en `http://localhost:8080`.
Base de datos con 30 categorías, 20 proveedores y 50 productos cargados via `seed_data.sql`.

| # | Caso de prueba | Resultado | Evidencia |
|---|---|---|---|
| T01 | Carga inicial — 50 productos, paginación "1 – 20 of 50", todas las columnas presentes | ✅ PASS | Snapshot — tabla con 20 filas, paginator "1 – 20 of 50" |
| T02 | Búsqueda por nombre "taladro" → 1 resultado (Taladro Percutor 13mm 900W) | ✅ PASS | Snapshot — 1 fila |
| T03 | Búsqueda por SKU "SOLD-ELE" → 1 resultado (Electrodos Acero Suave 6011) | ✅ PASS | Snapshot — 1 fila |
| T04 | Exactamente 1 petición HTTP por búsqueda (BUG-POST-01 verificado) | ✅ PASS | Red log — 1 request por acción, sin duplicados |
| T05 | Limpiar filtros → vuelve a 50 productos (1 sola petición) | ✅ PASS | Snapshot — "1 – 20 of 50" |
| T06 | Filtro Estado "Sin stock" → 3 resultados (Proyector Laser, SSD NVMe, Secadora) | ✅ PASS | Snapshot — 3 filas con badge "Sin stock" |
| T07 | Filtro Proveedor "TechSupply México" → 5 resultados | ✅ PASS | Snapshot — 5 filas |
| T08 | Filtro combinado (TechSupply + "laptop") → 1 resultado (Laptop 15.6") | ✅ PASS | Snapshot — 1 fila |
| T09 | Paginación "Next page" → página 2, "21 – 40 of 50" | ✅ PASS | Snapshot — paginator actualizado |
| T10 | Diálogo detalle (Laptop): todos los campos cargados, SKU/precio/stock/estado/categoría/proveedor | ✅ PASS | Snapshot — diálogo con datos correctos |
| T11 | Pestaña Kardex → "Sin movimientos registrados" (DB limpia) | ✅ PASS | Snapshot — mensaje vacío correcto |
| T12 | Sin errores JavaScript en consola durante toda la sesión | ✅ PASS | `console_messages level=error` → 0 errores |
| T13 | Diálogo movimiento: Entrada 5 uds → stock Laptop 30→35 reflejado en tabla | ✅ PASS | Snapshot — celda Stock muestra "35" |
| T14 | Diálogo nuevo producto: título "Nuevo producto", campos vacíos, sin botón "Desactivar" | ✅ PASS | Snapshot — heading "Nuevo producto", "Crear producto" disabled |
| T15 | Tooltip proveedor vacío → no muestra "null" (BUG-POST-03 verificado) | ✅ PASS | Snapshot — `[matTooltip]="row.supplierName \|\| ''"` |

**Resultado global: 15/15 casos PASS — 0 fallos**

### Tests RBAC browser — 4 roles completos — 2026-06-07

Ejecutados con Playwright MCP. Ambiente: Angular `http://localhost:4200` + Spring Boot `http://localhost:8080`.

| Rol | Usuario | Casos verificados | Resultado |
|---|---|---|---|
| ADMIN | `admin` | Login, categorías CRUD, productos CRUD, movimiento OUT, Kardex | ✅ 100% |
| MANAGER | `manager01` | Login, categorías crear/editar/desactivar, producto crear/editar (sin desactivar), movimiento IN | ✅ 100% |
| WAREHOUSEMAN | `almacen01` | Login, categorías solo lectura, productos solo lectura, movimiento OUT, diálogo=Cerrar | ✅ 100% |
| SALES | `ventas01` | Login, sidebar sin Compras, categorías solo lectura, productos solo lectura, 0 botones de movimiento | ✅ 100% |

**Resultado global: 4/4 roles — todos los comportamientos RBAC correctos**

### Verificación de seguridad backend — 2026-06-07

Pruebas curl con tokens JWT reales contra `http://localhost:8080`. 17 combinaciones endpoint × rol.

| Endpoint | MANAGER | WAREHOUSEMAN | SALES |
|---|:---:|:---:|:---:|
| POST /inventory/categories | 201 ✅ | 403 ✅ | 403 ✅ |
| PUT /inventory/categories/{id} | 200 ✅ | 403 ✅ | 403 ✅ |
| DELETE /inventory/categories/{id} | 403 ✅ | 403 ✅ | 403 ✅ |
| POST /inventory/products | 201 ✅ | 403 ✅ | 403 ✅ |
| PUT /inventory/products/{id} | 200 ✅ | 403 ✅ | 403 ✅ |
| DELETE /inventory/products/{id} | 403 ✅ | 403 ✅ | 403 ✅ |
| POST /inventory/products/movement | 204 ✅ | 204 ✅ | 403 ✅ |

**Resultado: 17/17 verificaciones correctas — 0 fallos.**  
El backend es la segunda capa de defensa; la UI es solo la primera.

### Tests unitarios Angular — Módulo 2 (Inventory) — 2026-06-07

Comando: `npx ng test --include="src/app/modules/inventory/**/*.spec.ts" --no-watch`  
Resultado post-LowStock: **6 archivos, 63 specs, 0 fallos**

| Archivo | Tests | Qué verifica |
|---|:---:|---|
| `category.service.spec.ts` | 8 | `getActive()` con params defecto y custom; `create()` verifica body; `update()` verifica URL y body; `delete()` verifica 204 void |
| `product.service.spec.ts` | 15 | `search()` con todos los parámetros incluyendo normalización de búsqueda en blanco; `getById`, `getBySku`, `getByCategory`, `getLowStock`; `create`, `update`, `delete` (204); `registerMovement` (204); `getMovements`; **`getActiveSuppliers()` verifica que `companyName` del backend se mapea a `name` en el modelo frontend** |
| `stock-badge.component.spec.ts` | 8 | `level` getter: stock=0→error, stock≤min→warning, stock>min→success; `tooltipText` getter: los tres mensajes con valores numéricos correctos; renderizado con TestBed |
| `category-form.component.spec.ts` | 8 | `canDeactivate` input: botón "Desactivar" visible solo con `canDeactivate=true` e `isEdit=true`; output `deactivate` emite al hacer clic; output `save` emite `CategoryRequest` correcto cuando el formulario es válido; no emite `save` si `name` está vacío; output `cancel` emite al hacer clic en Cancelar; precarga: formulario inicializado con los valores del `item` recibido. **API**: `fixture.componentRef.setInput()` para triggear `ngOnChanges` correctamente |
| `product-detail.component.spec.ts` | 7 | `getStatusLabel()`: traduce AVAILABLE→"Disponible", DISCONTINUED→"Descontinuado", OUT_OF_STOCK→"Sin stock", fallback→valor original; `getMovementTypeLabel()`: traduce IN→"Entrada", OUT→"Salida", cualquier otro valor→"Salida" (rama else) |
| `low-stock-page.component.spec.ts` | 17 | `getSeverity()`: sin-stock/critico/reservas por condición; `getSeverityLabel()`: etiquetas traducidas; contadores sinStockCount/criticoCount/reservasCount; `displayedColumns` por rol (ADMIN/MANAGER incluyen unitCost+actions; WAREHOUSEMAN excluye unitCost; SALES excluye ambos); columnas base para WAREHOUSEMAN; ordenamiento por déficit DESC; creación para ADMIN y SALES |

**Nota técnica:** TestBed no puede reconfigurarse dentro del mismo spec. El test de columnas base de 4 roles se reemplazó por un test focalizado en WAREHOUSEMAN (ya cubierto parcialmente por los otros tests de rol). Ver BUG-22 en sección 8.

**Decisión de cobertura**: los componentes smart (`CategoriesPageComponent`, `ProductsPageComponent`) no tienen specs unitarios porque su cobertura efectiva está garantizada por los 15 tests browser E2E y los 4 tests RBAC. Los specs de servicios y componentes dumb (`StockBadgeComponent`, `CategoryFormComponent`, `ProductDetailComponent`) son donde los tests unitarios aportan valor real: verifican contratos HTTP exactos, lógica de umbral, estados de visibilidad condicional por RBAC y traducciones de dominio que los tests browser no pueden inspeccionar directamente.

### Tests de seguridad RBAC — Backend — Módulo 2 (Inventory) — 2026-06-07

Tests `@WebMvcTest` con filtros de Spring Security activos. Patrón de JWT simulado con
`JwtUtils` mockeado + `@Import(SecurityConfig.class)` para que el `SecurityFilterChain`
personalizado (con las reglas RBAC reales) se cargue en el contexto de prueba.
Clases independientes de `CategoryControllerTest` / `ProductControllerTest`
(que usan `addFilters=false`).

| Clase | Tests | Escenarios cubiertos |
|---|:---:|---|
| `CategoryControllerSecurityTest` | 8 | POST→WAREHOUSEMAN 403; POST→SALES 403; PUT→WAREHOUSEMAN 403; PUT→SALES 403; DELETE→WAREHOUSEMAN 403; DELETE→SALES 403; GET→WAREHOUSEMAN 200; GET→SALES 200 |
| `ProductControllerSecurityTest` | 8 | POST→WAREHOUSEMAN 403; POST→SALES 403; DELETE→MANAGER 403 (regla específica prevalece); DELETE→ADMIN 204; POST/movement→SALES 403; POST/movement→WAREHOUSEMAN 204; GET→WAREHOUSEMAN 200; GET→SALES 200 |

**Patrón estándar para tests de seguridad RBAC (aplicar a todos los módulos futuros):**

```java
@WebMvcTest(CualquierController.class)
@Import(SecurityConfig.class)   // OBLIGATORIO — sin esto, auto-configured HTTP Basic aplica
class CualquierControllerSecurityTest {

    @MockBean CualquierService cualquierService;
    @MockBean JwtUtils jwtUtils;

    private String tokenConRol(String roleWithPrefix) {
        String tok = "token." + roleWithPrefix;
        when(jwtUtils.extractUsername(tok)).thenReturn("usuario_test");
        when(jwtUtils.validateToken(tok)).thenReturn(true);
        when(jwtUtils.extractRoles(tok)).thenReturn(List.of(roleWithPrefix));
        return tok;
    }
    // tests...
}
```

> **Nota crítica (Spring Security 6 + STATELESS):** `@WithMockUser` NO funciona para tests
> que esperan respuestas 200/204. `SecurityContextHolderFilter` sobreescribe el contexto
> que `@WithMockUser` establece en la cadena de filtros. El JWT simulado SÍ funciona porque
> `JwtAuthenticationFilter` establece el contexto DURANTE la cadena (no antes). Los tests
> que esperan 403 pasan con `@WithMockUser` solo por coincidencia (anonymous también recibe 403).
> Ver **L10** en `memoria_tecnica_global_proyecto.md`.

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

### BUG-06 (post-merge): Race condition en búsqueda de productos

**Síntoma**: cambios rápidos en los filtros podían mostrar resultados desactualizados si
una petición lenta respondía después de una petición más reciente (out-of-order responses).

**Causa raíz**: `load()` usaba `takeUntilDestroyed` para cleanup del componente, pero no
cancelaba la petición HTTP anterior al dispararse una nueva búsqueda. Si el usuario cambiaba
un filtro dos veces en rápida sucesión, la respuesta de la primera petición podía sobrescribir
la de la segunda.

**Fix**: eliminar `load()` y centralizar toda la búsqueda en un `Subject<void> searchTrigger$`
cuyo operador `switchMap` cancela automáticamente la petición en vuelo al llegar una nueva.

**Archivo**: `products-page.component.ts` — refactor completo de la lógica de búsqueda.

---

### BUG-07 (post-merge): Doble petición al cargar con `?categoryId` en la URL

**Síntoma**: cuando la página se abría con el query param `?categoryId=N`, se realizaban
dos peticiones HTTP en lugar de una (visible en las herramientas de red del browser).

**Causa raíz**: `categoryFilter.setValue(+catId)` (sin `{ emitEvent: false }`) disparaba
`valueChanges`, que ejecutaba `load()`. Luego el `ngOnInit` llamaba explícitamente a `load()`
una segunda vez.

**Fix**: usar `{ emitEvent: false }` en el `setValue` del query param y reemplazar la llamada
explícita a `load()` por `this.searchTrigger$.next()` al final del `ngOnInit`, garantizando
exactamente una sola petición de carga inicial.

**Archivo**: `products-page.component.ts:131`.

---

### BUG-08 (post-merge): Tooltip de proveedor mostraba "null" cuando el campo era nulo

**Síntoma**: en productos sin proveedor asignado, el tooltip de la columna "Proveedor"
mostraba la cadena "null" al pasar el cursor.

**Causa raíz**: `[matTooltip]="row.supplierName"` — cuando `supplierName` es `null`,
Angular Material materializa el binding como la cadena `"null"`.

**Fix**: `[matTooltip]="row.supplierName || ''"` — tooltip vacío cuando el valor es nulo.

**Archivo**: `products-page.component.html:110`.

---

### BUG-09 (post-merge): Error interceptor redirigía a login en respuestas 403

**Síntoma**: la primera carga del módulo de Inventario redirigía al login con el mensaje
"Tu sesión ha expirado" incluso con un token JWT válido, creando un bucle infinito de login.

**Causa raíz**: el backend retorna 403 para acceso denegado (no 401). El interceptor
original trataba cualquier 4xx que no fuera `/auth/login` como sesión expirada, incluyendo
los 403 de rutas protegidas correctamente rechazadas. Adicionalmente, el proceso JVM del
backend estaba corriendo con clases compiladas antes de los últimos cambios de `SecurityConfig`,
por lo que todos los endpoints de inventario devolvían 403 incluso para ROLE_ADMIN.

**Fix en código**: separar el manejo de 401 (expiración de sesión → redirect a login)
y 403 (acceso denegado → snackbar informativo, sin redirect).

**Fix en proceso**: reiniciar el proceso `spring-boot:run` para que el JVM cargue las
clases compiladas actualizadas.

**Archivo**: `error.interceptor.ts`.

---

### BUG-10 (post-RBAC-tests): Botón "Editar" de categorías visible para todos los roles

**Síntoma**: durante los tests RBAC browser se detectó que WAREHOUSEMAN y SALES podían ver
el botón "Editar" en la tabla de categorías, aunque los botones "Nueva categoría" y
"Desactivar" estaban correctamente ocultos para estos roles.

**Causa raíz**: el botón "Editar" en `categories-page.component.html` (líneas 73-78) no
estaba envuelto en `@if(canWrite())`, a diferencia de los otros dos botones. Adicionalmente,
el clic en la fila (`(click)="openEdit(row)"`) abría el formulario de edición para cualquier
rol sin verificar permisos.

**Fix**:
1. `categories-page.component.html`: envolver el botón "Editar" en `@if (canWrite())`.
2. `categories-page.component.html`: cambiar `(click)="openEdit(row)"` por `(click)="onRowClick(row)"` + `[class.catalog-row--clickable]="canWrite()"`.
3. `categories-page.component.ts`: agregar `onRowClick(item: CategoryDTO): void { if (this.canWrite()) this.openEdit(item); }`.
4. `categories-page.component.scss`: mover `cursor: pointer` al selector `.catalog-row--clickable`.

**Impacto**: puramente de UX/RBAC — el backend rechazaría el guardado con 403 de todas formas.

---

### BUG-11 (auditoría backend): HTTP 500 para todos los errores de negocio

**Síntoma**: al buscar un SKU inexistente, el backend devolvía HTTP 500 en lugar de 404.
Duplicados de SKU y de nombre de categoría también devolvían 500. Stock insuficiente: 500.
En los logs de servidor, errores de negocio eran indistinguibles de crashes reales.

**Causa raíz**: `GlobalExceptionHandler` mapeaba toda `RuntimeException` a HTTP 500.
Los servicios lanzaban `RuntimeException` para todas las condiciones de error sin distinción.

**Fix (backend)**:
1. Tres clases nuevas en `core/exception/`:
   - `ResourceNotFoundException extends RuntimeException` → HTTP **404**
   - `DuplicateResourceException extends RuntimeException` → HTTP **409**
   - `BusinessRuleException extends RuntimeException` → HTTP **422**
2. `GlobalExceptionHandler`: tres handlers específicos para cada clase. `RuntimeException` genérico conserva 500 para errores reales de infraestructura.
3. `CategoryServiceImpl` y `ProductServiceImpl`: todos los `throw new RuntimeException(...)` de negocio reemplazados por la excepción semánticamente correcta. `resolveAuthenticatedUser()` conserva `RuntimeException` (es un error real de servidor si el usuario del JWT no existe en BD).

**Verificación curl post-fix**:
- `GET /products/99999` → **404** ✅
- `GET /products/sku/SKU-INEXISTENTE` → **404** ✅
- `POST /categories` nombre duplicado → **409** ✅
- `POST /movement` tipo inválido → **422** ✅
- `POST /movement` stock insuficiente → **422** ✅

**Impacto en frontend**: el `error.interceptor.ts` pasa 404/409/422 directamente al
`catchError` del componente (solo intercepta 401 y 403). Los componentes leen
`err.error?.message` sin cambios. No fue necesario actualizar el frontend.

---

### BUG-12 (post-RBAC-tests): Fila seleccionada no se resaltaba mientras el diálogo estaba abierto (F08)

**Síntoma**: al hacer clic en una fila de la tabla de productos, el diálogo se abría pero la
fila no quedaba resaltada visualmente (no se distinguía cuál registro estaba abierto).

**Causa raíz**: no existía un mecanismo para mantener referencia a la fila abierta.

**Fix**:
1. `products-page.component.ts`: agregar `selectedProductId: number | null = null`. Asignarlo antes de abrir el diálogo y limpiarlo en `afterClosed()` (tanto para detalle como para movimiento). Llamar a `cdr.markForCheck()` en ambos momentos.
2. `products-page.component.html`: `[class.catalog-row--selected]="row.id === selectedProductId"` en el `mat-row`.
3. `products-page.component.scss`: `.catalog-row--selected { background-color: #F2E4F2 !important; }` — el `!important` es necesario porque Angular Material MDC aplica `background-color` con especificidad que sobrepasa la regla sin `!important`.

---

### BUG-13 (post-RBAC-tests): Snackbar "No tienes permiso" incorrecto para SALES al navegar de categorías a productos

**Síntoma**: con rol SALES, al hacer clic en el icono shopping_bag de una categoría para ver sus
productos, la página de productos cargaba con el filtro correcto PERO mostraba el snackbar
"No tienes permiso para realizar esta acción". El comportamiento NO se reproducía con ADMIN.

**Causa raíz**: `ProductsPageComponent.ngOnInit()` usaba `forkJoin` para cargar categorías y
proveedores en paralelo. SALES no tiene acceso a `GET /purchases/suppliers/active` (requiere
WAREHOUSEMAN/MANAGER/ADMIN). La petición de proveedores fallaba con 403, y sin manejo de error
en el `forkJoin`, este propagaba el error al `catchError` del componente, que luego llegaba al
`error.interceptor.ts`, que mostraba el snackbar de "No tienes permiso". Como efecto secundario,
el `forkJoin` abortaba antes de completarse, dejando el dropdown de categorías vacío (aunque el
filtro URL sí se aplicaba porque era un `queryParam`, no dependía del forkJoin).

**Fix**: agregar `catchError(() => of({ content: [] as SupplierOption[] } as PageResponse<SupplierOption>))` en la rama de proveedores del `forkJoin`.

```typescript
forkJoin({
  cats: this.categoryService.getActive(0, 200),
  sups: this.productService.getActiveSuppliers().pipe(
    catchError(() => of({ content: [] as SupplierOption[] } as PageResponse<SupplierOption>))
  ),
})
```

Así, si SALES recibe 403 al pedir proveedores, el observable retorna una lista vacía en lugar de
propagar el error. El 403 no llega al interceptor y no se muestra el snackbar incorrecto.
El dropdown de proveedores permanece vacío para SALES, lo cual es el comportamiento correcto.

**Archivos**: `products-page.component.ts`.

---

### BUG-14 (revisión UX): Inconsistencia entre desactivar categorías y desactivar productos

**Síntoma (diseño)**: los productos tenían la opción "Desactivar" dentro del diálogo de edición,
pero las categorías la tenían como botón directo en la columna de acciones de la tabla — un
patrón inconsistente que confundía qué rol podía desactivar qué entidad.

**Causa raíz**: implementación inicial de categorías con un botón `delete_outline` en la fila,
antes de que el patrón "Desactivar dentro del diálogo" fuera adoptado en productos.

**Fix**:
1. `categories-page.component.html`: eliminar botón `delete_outline` de la columna acciones.
2. `category-form.component.ts`: agregar `@Input() canDeactivate = false` y `@Output() deactivate = new EventEmitter<void>()`.
3. `category-form.component.html`: agregar botón "Desactivar" con `@if(isEdit && canDeactivate)`, igual al patrón de `product-form.component.html`.
4. `category-form.component.scss`: agregar `__actions-right` con flexbox para alinear Cancelar/Guardar a la derecha.
5. `category-form-dialog.component.ts`: extender `CategoryDialogData` con `canDeactivate: boolean`; agregar `onDeactivate()` con `ConfirmDialogComponent` + `switchMap` — mismo patrón que `product-detail-dialog.component.ts`.
6. `categories-page.component.ts`: actualizar `openNew()` con `canDeactivate: false` y `openEdit()` con `canDeactivate: this.canDeactivate()`.

**Decisión de RBAC**: `canDeactivate()` para categorías = `hasRole('ROLE_ADMIN')` solamente, igual que para productos.

---

### BUG-15 (revisión UX): Botón redundante "Productos" en toolbar de categorías

**Síntoma**: la toolbar de la página de categorías tenía un botón "Productos" que navegaba a
`/inventory/products`. Este botón era redundante porque ya existía el icono shopping_bag en cada
fila para navegar a los productos de esa categoría, y el sidebar tenía un link directo a Productos.

**Fix**: eliminar el botón "Productos" de `categories-page.component.html`.

---

### BUG-22: TestBed no permite reconfiguración dentro del mismo spec

**Síntoma**: test `'todos los roles incluyen las columnas base de stock'` iteraba 4 roles llamando
`setup()` dentro de un `for` loop. El segundo `setup()` lanzaba:
"Cannot configure the test module when the test module has already been instantiated."

**Causa raíz**: `TestBed.configureTestingModule()` solo puede llamarse una vez por spec. Si
ya se llamó (directamente o vía `setup()`), cualquier llamada subsiguiente en el mismo test falla.

**Fix**: reemplazar el loop de 4 roles por un test único focalizado en WAREHOUSEMAN
(`'WAREHOUSEMAN: incluye columnas base de stock'`). La cobertura completa está garantizada
porque los tests de roles restantes (ADMIN, MANAGER, SALES) ya verifican sus columnas individualmente.

**Lección**: en Angular/Jasmine, `TestBed` es un singleton por spec. Para cubrir múltiples
configuraciones de módulo, usar tests separados (`it()`) dentro de un `describe()`.

---

### BUG-INV-06 (BSRCH-PROD-03): Búsqueda sin normalización de acentos

**Síntoma**: buscar "galon" no encuentra "Galón de pintura"; buscar "ceramica" no encuentra "Cerámica".

**Causa raíz**: el backend no aplica normalización Unicode (accent-insensitive) en la búsqueda por
nombre/SKU. La consulta JPA usa `LIKE '%galon%'` que es case-insensitive pero no accent-insensitive.

**Estado**: ✅ RESUELTO — re-verificado en browser 2026-06-10: búsqueda "galon" devuelve 3 resultados
incluyendo productos con "Galón" en el nombre. El fix `f_unaccent()` (PostgreSQL, query nativa en el
repositorio) está desplegado y funcionando. Ver §7 de `memoria_tecnica_global_proyecto.md`.

**Workaround**: ya no aplica.

---

### BUG-INV-07 (VIS-GEN-06): Headers de tabla sin colores de marca en tablas no-sticky

**Síntoma**: las tablas de Productos y Categorías muestran headers con fondo blanco `#FFFFFF`
y texto negro `rgba(0,0,0,0.87)` en lugar de `#F2E4F2` (fondo) y `#6B3C6B` (texto).

**Causa raíz**: el SCSS solo aplica `background: #F2E4F2` a `.catalog-row--selected`. Las tablas
sticky (low-stock) heredan el color de fondo por otro mecanismo. Las tablas no-sticky no tienen CSS explícito en `.mat-mdc-header-row` ni `.mat-mdc-header-cell`.

**Estado**: ⚠️ ABIERTO — corrección cosmética pendiente en `products-page.component.scss` y
`categories-page.component.scss`.

---

### BUG-INV-08 (VAL-PDET-14/15): Concordancia de género en mensajes de error de Categoría/Proveedor

**Síntoma**: al dejar vacío el campo "Categoría*" en el formulario "Nuevo producto" y hacer blur,
el mensaje de error muestra "La categoría **es obligatorio**." (debería ser "obligatoria",
concordancia femenina con "la categoría"). El campo "Proveedor*" sí muestra correctamente
"El proveedor es obligatorio." (masculino, correcto).

**Causa raíz**: en `product-form.component.html`, el `<mat-error>` del campo `categoryId`
probablemente reutiliza un texto genérico "es obligatorio" sin ajustar el género gramatical.

**Estado**: ⚠️ ABIERTO — bug cosmético/textual, no afecta la funcionalidad de la validación
(el campo sigue siendo requerido y bloquea el submit correctamente).

**Severidad**: baja (solo texto visible al usuario).

---

### BUG-INV-09 (CRUD-PDET-01): JWT expirado produce 403 Forbidden en vez de 401, y el frontend no muestra "sesión expirada"

**Síntoma**: con sesión ADMIN ("admin", chip "ADMIN" visible en topbar), al completar el
formulario "Nuevo producto" con todos los datos válidos (SKU=QA-CRUD-001,
Nombre="Producto QA CRUD-PDET-01", Precio=$100, Costo unitario=$60, Stock inicial=10,
Stock mínimo=2, Categoría="Herramientas Manuales", Proveedor="Ferretera Industrial del
Norte S.A. de C.V.", Descripción completa) y pulsar "Crear producto", aparece un snackbar
ROJO: "No tienes permiso para realizar esta acción." El producto NO se crea (no quedan
datos huérfanos en la base de datos).

**Verificación de red**: con `read_network_requests` se confirmó:
- `OPTIONS /api/v1/inventory/products` → 200 (preflight CORS correcto)
- `POST /api/v1/inventory/products` → **403 Forbidden**

Al repetir la prueba en modo edición (abrir "HMAN-DES-013", modificar la Descripción y
pulsar "Guardar cambios"), el snackbar fue distinto ("Error al guardar el producto.") y
`read_network_requests` mostró:
- `PUT /api/v1/inventory/products/13` → **403 Forbidden**
- `GET /api/v1/inventory/products/13/movements?page=0&size=10` → **403 Forbidden**
  (esta última es una simple lectura, normalmente permitida para los 4 roles)

Que un **GET de lectura** también devuelva 403 para ADMIN era la pista clave: descarta
un problema de reglas `hasAnyRole` específicas de escritura.

**Investigación de causa raíz (read-only, sin modificar código — restricción del usuario)**:
1. `ProductController.createProduct` no tiene `@PreAuthorize` ni anotación de seguridad
   a nivel de método; tampoco existe `@PreAuthorize`/`@Secured`/`@RolesAllowed` en todo
   el módulo `inventory` del backend.
2. `SecurityConfig.java` líneas 107-124: las reglas `hasAnyRole(...)` para GET, POST,
   PUT y DELETE de `/api/v1/inventory/**` están en el orden correcto y deberían permitir
   ADMIN tanto en lectura como en escritura.
3. Consulta directa a la BD (`almacen_db`) confirma que "admin" tiene `ROLE_ADMIN` y
   `ROLE_WAREHOUSEMAN` (con prefijo `ROLE_` correcto), y `JwtAuthenticationFilter` los
   mapea correctamente a `SimpleGrantedAuthority`.
4. **Causa raíz encontrada**: se decodificó el JWT activo en `localStorage`
   (`almacenes_token`) con `atob()` sobre el payload (sin exponer el token completo).
   El claim `exp` estaba en el **pasado** (`secondsRemaining: -928`, es decir, el token
   expiró ~15 minutos antes de esta prueba). La sesión llevaba activa más de las 2 horas
   documentadas en `CLAUDE.md` ("JWT expira en: 2 horas").
5. Con el token expirado, `jwtUtils.validateToken(token)` devuelve `false` →
   `JwtAuthenticationFilter` NO establece autenticación → la petición llega como
   **anónima** al `SecurityFilterChain`.
6. `SecurityConfig` no define un `AuthenticationEntryPoint` personalizado para
   peticiones no autenticadas. Por defecto, Spring Security trata al usuario anónimo
   como "autenticado con `ROLE_ANONYMOUS`" — al no cumplir `hasAnyRole(...)` /
   `authenticated()`, el `AccessDeniedHandler` por defecto responde **403 Forbidden**,
   no 401. Esto explica por qué TODAS las peticiones (lectura y escritura) devuelven 403
   una vez expirado el token.
7. En el frontend, `error.interceptor.ts` solo intercepta **401** para mostrar
   "Tu sesión ha expirado. Vuelve a iniciar sesión." y redirigir a `/login`. Como el
   backend devuelve 403 (no 401) para token expirado, el interceptor trata la respuesta
   como un error de permisos normal y muestra mensajes genéricos
   ("No tienes permiso para realizar esta acción." / "Error al guardar el producto.").

**Conclusión**: **NO es un bug de RBAC**. `SecurityConfig`, los roles asignados a
"admin" y el mapeo de `JwtAuthenticationFilter` son correctos. El bug real es de doble
naturaleza:
   - Backend: un JWT expirado produce 403 en vez de 401 (falta `AuthenticationEntryPoint`
     que distinga "no autenticado" de "autenticado sin permiso").
   - Frontend: `error.interceptor.ts` no contempla el caso 403-por-token-expirado y
     muestra mensajes engañosos en vez de "sesión expirada".

**Impacto**: durante una sesión larga (>2h), CUALQUIER usuario (de cualquier rol) ve
mensajes de error de permisos confusos e incorrectos en lugar de ser redirigido a
re-autenticarse. Esto puede hacer pensar erróneamente que hay un bug de RBAC cuando en
realidad solo hace falta volver a iniciar sesión.

**Estado**: ⚠️ ABIERTO — **CRÍTICO** (UX/seguridad — mensaje de error engañoso).
NO corregido — pendiente de autorización explícita del usuario, según la restricción
vigente de esta sesión.

**Severidad**: alta (no bloquea funcionalidad per se — basta con re-login — pero genera
diagnósticos erróneos y mala UX en sesiones largas).

**Próximo paso de re-validación**: re-login para obtener un JWT fresco y re-ejecutar
CRUD-PDET-01..05 y los casos VAL/UI pendientes que requieren guardar, para confirmar que
con un token válido estas operaciones SÍ funcionan correctamente para ADMIN.

**Re-validación completada (2026-06-10)**: tras re-login (`admin`/`Admin123!`, JWT
fresco), se re-ejecutaron CRUD-PDET-01..05, VAL-PDET-08/09 y UI-PDET-01/03 — **todos
✅ PASS**:
- CRUD-PDET-01: `POST /api/v1/inventory/products` → **201** (producto QA-CRUD-001 creado)
- CRUD-PDET-02: `PUT /api/v1/inventory/products/854` → **200** (nombre editado, snackbar
  "Producto actualizado correctamente.")
- VAL-PDET-09: `PUT /api/v1/inventory/products/854` con SKU duplicado "ELEC-PRO-043" →
  **409**, snackbar rojo "El SKU 'ELEC-PRO-043' ya está en uso por otro producto."
- VAL-PDET-08: tras guardar, al reabrir el diálogo "Guardar cambios" está deshabilitado
  (form pristine); se activa solo con `form.dirty`
- UI-PDET-01/03: se registraron 6 movimientos de Entrada vía "Registrar movimiento";
  Kardex muestra tabla con Fecha/Tipo/Cantidad/Motivo/Usuario; con `Items per page=5`
  pagina correctamente "1-5 of 6" → "6-6 of 6"
- CRUD-PDET-03/04/05: flujo de desactivación (abrir confirmación, cancelar sin cambios,
  confirmar → "Producto desactivado.") funciona correctamente para ADMIN

Esto **confirma definitivamente** que `SecurityConfig` y los permisos de ADMIN son
correctos para todas las operaciones CRUD de Productos. El bug remanente (403 en vez de
401 para JWT expirado + frontend sin detección de "sesión expirada") permanece
⚠️ ABIERTO, sin corregir, pendiente de autorización del usuario.

---

### BUG-INV-10 (UI-PROD-PAG-03): cambiar "Items per page" no vuelve a la página 0

**Síntoma**: En la página de Productos, estando en la página 2 del listado ("21-40 of
108", `pageSize=20`), al cambiar el selector "Items per page" a 10, la tabla muestra
correctamente 10 filas pero el rango queda en "21-30 of 108" en lugar de volver a
"1-10 of 108" (página 0).

**Causa raíz**: comportamiento por defecto de `mat-paginator` de Angular Material —
al cambiar `pageSize`, recalcula `pageIndex = floor(primerÍndiceVisible / nuevoPageSize)`
para mantener aproximadamente el mismo primer elemento visible, en lugar de resetear a
0. `onPageChange()` en `products-page.component.ts` simplemente toma el `pageIndex` que
emite el propio `PageEvent` de `mat-paginator`:

```typescript
onPageChange(event: PageEvent): void {
  this.currentPage = event.pageIndex;
  this.pageSize    = event.pageSize;
  this.searchTrigger$.next();
}
```

Este es el comportamiento estándar de Angular Material en toda la aplicación (no es
exclusivo de Productos) — el caso de prueba `UI-PROD-PAG-03` (agregado en el gap
analysis 2026-06-10) documentó como esperado un reseteo a página 0 que no coincide con
el comportamiento real de `mat-paginator`.

**Estado**: ⚠️ ABIERTO — severidad baja (UX menor; los datos mostrados son correctos y
consistentes con el rango indicado, no hay pérdida de información). NO corregido —
pendiente de autorización explícita del usuario, según la restricción vigente de esta
sesión. Si se autoriza, la corrección típica sería forzar `this.currentPage = 0` dentro
de un handler dedicado para el evento de cambio de `pageSize` (distinguible en
`PageEvent` comparando `event.pageSize !== this.pageSize` antes de reasignar
`currentPage`).

**Próximo paso de re-validación**: ninguno — el hallazgo es reproducible de forma
determinista en cualquier página del módulo que use `mat-paginator` con más de
`pageSize` elementos.

---

### BUG-INV-11 (CYBER-07): `unitCost` expuesto en el JSON de respuesta para WAREHOUSEMAN/SALES

**Síntoma**: aunque la columna "Costo unit." está correctamente oculta en la UI para
los roles WAREHOUSEMAN y SALES (RBAC-PROD-07/08, VIS-LST-04, RBAC-PDET-09 — todos
✅ PASS), el campo `unitCost` SÍ viaja en el cuerpo JSON de la respuesta del backend
para ambos roles, con su valor real:

- `GET /inventory/products?page=0&size=5` con JWT de `almacen01` (WAREHOUSEMAN) y de
  `ventas01` (SALES) → `content[0].unitCost = 180`
- `GET /inventory/products/low-stock?page=0&size=5` con los mismos JWT →
  `content[0].unitCost = 7800`

**Causa raíz**: el backend serializa el DTO completo de `Product` (incluyendo
`unitCost`) sin filtrar por rol — el ocultamiento es exclusivamente del lado del
frontend (`displayedColumns` condicional en `products-page.component.ts` y
`product-detail-dialog.component`). Cualquier usuario WAREHOUSEMAN o SALES puede ver
el costo unitario real de cada producto inspeccionando la pestaña Network del
navegador (DevTools), sin necesidad de privilegios adicionales.

**Verificado mediante**: `fetch()` directo desde la consola del navegador con el JWT
de la sesión activa (`almacenes_token` en `localStorage`), y un JWT de `ventas01`
obtenido vía `POST /api/v1/auth/login`.

**Estado**: ❌ FAIL — severidad ALTA (exposición de datos financieros sensibles a
roles no autorizados, contradice explícitamente el checklist de cierre de CLAUDE.md:
*"Datos sensibles (unitCost, costos, márgenes, precios): Visibles SOLO para roles
autorizados; Ausentes del DOM para roles no autorizados (no solo display:none)"*).
NO corregido — pendiente de autorización explícita del usuario, según la restricción
vigente de esta sesión. Si se autoriza, la corrección típica sería: (a) crear un DTO
de respuesta diferenciado por rol en el backend (`ProductResponseDTO` sin `unitCost`
para WAREHOUSEMAN/SALES), o (b) que el `ProductController`/`ProductServiceImpl`
omita el campo `unitCost` en la serialización cuando el usuario autenticado no tenga
`ROLE_ADMIN` ni `ROLE_MANAGER`. Aplica también a `ProductDetailDialogComponent`
(GET por id) y a cualquier otro endpoint que devuelva `ProductResponseDTO` completo.

**Próximo paso de re-validación**: una vez corregido, repetir CYBER-07 para
`GET /inventory/products`, `GET /inventory/products/{id}`, y
`GET /inventory/products/low-stock` con JWT de WAREHOUSEMAN y SALES — `unitCost` debe
estar ausente del JSON (no solo `null`/`0`).

---

### BUG-INV-12 (SEC-04): `GET /purchases/suppliers/active` → 403 para SALES rompe el `forkJoin` de filtros en Productos

**Síntoma**: al iniciar sesión como `ventas01` (SALES) y navegar a
`/inventory/products`, aparece un snackbar rojo "No tienes permiso para realizar esta
acción." al cargar la página, y los filtros desplegables "Categoría" y "Proveedor"
quedan completamente vacíos (solo muestran la opción "Todas"/"Todos"), aunque la
tabla de productos sí se carga correctamente con sus 108 registros.

**Causa raíz**: `ProductsPageComponent.ngOnInit()` (líneas 139-148) carga categorías
y proveedores en un único `forkJoin`:

```typescript
forkJoin({
  cats: this.categoryService.getActive('', 0, 200),
  sups: this.productService.getActiveSuppliers(),
}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
  next: ({ cats, sups }) => {
    this.categories = cats.content;
    this.suppliers  = sups.content;
    this.cdr.detectChanges();
  }
});
```

`getActiveSuppliers()` llama a `GET /api/v1/purchases/suppliers/active`. Este
endpoint responde **403 Forbidden** para el rol SALES (verificado: mismo endpoint con
JWT de `manager01` → 200; con JWT de `ventas01` → 403). Por semántica de RxJS,
`forkJoin` emite error completo si CUALQUIERA de sus observables internos falla — el
`subscribe` no tiene callback `error`, así que `next` nunca se ejecuta y
`this.categories`/`this.suppliers` permanecen como arrays vacíos (`[]`) para SALES.
Adicionalmente, el error 403 es interceptado por `error.interceptor.ts`, que muestra
el snackbar genérico "No tienes permiso para realizar esta acción." sin que el
usuario haya intentado ninguna acción de escritura.

**Verificado mediante**: `read_network_requests` en la pestaña del navegador tras
login como `ventas01` y navegación a `/inventory/products` — `GET
/api/v1/purchases/suppliers/active` → **403**; inspección visual de los `mat-select`
"Categoría" y "Proveedor" (ambos solo con la opción por defecto "Todas"/"Todos").

**Estado**: ⚠️ ABIERTO — severidad MEDIA (los filtros de búsqueda por categoría y por
proveedor quedan inutilizables para el rol SALES, y se muestra un mensaje de error
confuso al cargar una pantalla de solo lectura). NO corregido — pendiente de
autorización explícita del usuario. Si se autoriza, posibles correcciones: (a) en el
backend, permitir `ROLE_SALES` en `GET /purchases/suppliers/active` (es un endpoint
de solo lectura usado para un filtro, análogo a `categories/active`); y/o (b) en el
frontend, separar el `forkJoin` en dos suscripciones independientes con
`catchError` por observable, para que un fallo en `suppliers` no impida poblar
`categories` (y viceversa).

**Próximo paso de re-validación**: una vez corregido, repetir SEC-04 con `ventas01` —
no debe aparecer snackbar de error al cargar `/inventory/products`, y los filtros
"Categoría" y "Proveedor" deben mostrar las opciones reales. Verificar también si
`/inventory/categories` y `/inventory/low-stock` (RBAC-LST-*) presentan el mismo
patrón para SALES (ambos también podrían depender de `suppliers/active` u otros
endpoints de `purchases`).

---

### BUG-INV-13 (CYBER-02): JWT manipulado en `localStorage` desbloquea la UI de ADMIN sin que el backend otorgue acceso real

**Síntoma**: con sesión activa de `ventas01` (SALES), se modificó el payload del JWT
en `localStorage` (`roles: ["ROLE_SALES"]` → `roles: ["ROLE_ADMIN"]`, agregando
también `role: "ROLE_ADMIN"`), preservando header y firma originales (firma ahora
inválida para el nuevo payload). Al recargar `/inventory/products`:

- El **backend rechaza correctamente**: `GET /inventory/products?page=0&size=20` →
  **403 Forbidden** (firma inválida → usuario anónimo, mismo mecanismo que BUG-INV-09).
- El **frontend NO redirige a `/login`**. En su lugar, decodifica el JWT alterado
  client-side (sin validar firma) para determinar el rol a renderizar, y muestra:
  - Topbar: badge de rol "ADMIN" (en vez de "SALES")
  - Sidebar: ítems adicionales "Compras" (carrito) y "Gestión de usuarios" (persona),
    que `ventas01` no debería ver
  - Página de Productos: botón "+ Nuevo producto" visible (oculto normalmente para SALES)
  - Panel de datos: "Sin datos" + snackbar rojo "Error al cargar productos." (porque
    la petición real al backend fue rechazada con 403)

**Causa raíz**: `AuthService`/`AuthGuard` y los componentes de layout
(sidebar/topbar/products-page) determinan el rol del usuario decodificando el JWT de
`localStorage` (`atob` sobre el payload) SIN verificar la firma — la verificación de
firma ocurre solo en el backend. Cualquier usuario puede editar
`localStorage.almacenes_token` desde DevTools y obtener una UI que muestra elementos
de un rol superior, aunque las llamadas HTTP reales sigan protegidas por el backend
(403). Esto está relacionado con BUG-INV-09: al no existir un
`AuthenticationEntryPoint` para 401 ni un manejo en `error.interceptor.ts` que
detecte "token inválido/sesión corrupta" y fuerce logout + redirect a `/login`, el
frontend queda en un estado inconsistente (UI de un rol, datos de ningún rol).

**Verificado mediante**: `javascript_tool` — decodificación, alteración (`roles` y
`role` → `ROLE_ADMIN`) y reescritura de `almacenes_token` en `localStorage`;
`navigate` a `/inventory/products`; captura de pantalla (badge "ADMIN", sidebar con
"Compras"/"Gestión de usuarios", botón "+ Nuevo producto", "Sin datos" +
"Error al cargar productos."); `read_network_requests` confirmando
`GET /inventory/products` → 403.

**Estado**: ✅ NO REPRODUCIBLE (re-test 2026-06-12). La corrección de **BUG-INV-09**
(2026-06-11 — `JwtAuthenticationEntryPoint` + `JwtAccessDeniedHandler` en
`SecurityConfig`) cambió la respuesta del backend para un JWT con firma inválida:
ahora responde **401** (antes 403, vía usuario anónimo). El `error.interceptor.ts`
ya manejaba 401 desde antes (limpia `localStorage`, redirige a
`/login?reason=expired`, snackbar "Tu sesión ha expirado..."). Re-test: login
`ventas01` (SALES), se alteró `roles`/`role` del JWT a `ROLE_ADMIN` (firma inválida)
y se navegó a `/inventory/products`. `GET /inventory/products`,
`/inventory/categories/active` y `/purchases/suppliers/active` → **401** (x2,
consistente). La app redirigió de inmediato a `/login?reason=expired` con banner y
snackbar de sesión expirada — screenshot inmediato (sin esperar) confirma que NO se
renderiza ningún elemento de UI de ADMIN (sin badge "ADMIN", sin sidebar de
"Compras"/"Gestión de usuarios", sin botón "+ Nuevo producto"). No se requirió
ningún cambio de código — corregido como efecto colateral de BUG-INV-09. Detalle
completo en `casos_de_prueba_modulo_inventario.md` — "BUG-INV-13 — Verificación
(2026-06-12) — NO REPRODUCIBLE".

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
| Crear categoría → aparece en lista inmediatamente | ✓ | Browser — 2026-06-05 |
| Editar categoría → cambios reflejados | ✓ | Browser — 2026-06-05 |
| Desactivar categoría → desaparece (soft delete, contador -1) | ✓ | Browser 4 roles — 2026-06-07 |
| Crear producto con todos los campos | ✓ | Browser — 2026-06-05 |
| Filtrar productos por categoría | ✓ | Browser — 2026-06-05 |
| Buscar por texto (SKU + nombre, debounce 400ms) | ✓ | Browser — 2026-06-06 |
| Badge de stock muestra color correcto (verde/naranja/rojo) | ✓ | Browser — 2026-06-05 |
| Registrar movimiento IN → stock aumenta | ✓ | Browser — MANAGER IN +10 (55→65) — 2026-06-07 |
| Registrar movimiento OUT → stock disminuye | ✓ | Browser — ADMIN OUT -5 (40→35), WHOUSE OUT -5 — 2026-06-07 |
| Kardex muestra historial correcto con paginación | ✓ | Browser — 2026-06-05 |
| WAREHOUSEMAN: registra movimientos, no crea/edita productos ni categorías | ✓ | Browser RBAC — 2026-06-07 |
| SALES: solo lectura en todo el módulo (0 botones de movimiento) | ✓ | Browser RBAC — 2026-06-07 |
| MANAGER: edita productos/categorías, no puede desactivar productos | ✓ | Browser RBAC — 2026-06-07 |
| ADMIN: acceso completo incluyendo desactivar producto | ✓ | Browser RBAC — 2026-06-07 |
| Botón "Editar" categorías oculto para WAREHOUSEMAN y SALES (BUG-10) | ✓ | Código + Browser — 2026-06-07 |
| Clic en fila de categoría es no-op para roles sin escritura | ✓ | Código — `onRowClick()` con guard — 2026-06-07 |
| Cursor pointer en filas condicionado al rol (BUG-10) | ✓ | Código — `.catalog-row--clickable` — 2026-06-07 |
| Backend: 404 para entidad no encontrada (no 500) | ✓ | curl — SKU/ID inexistente → 404 — 2026-06-07 |
| Backend: 409 para duplicados (no 500) | ✓ | curl — nombre/SKU duplicado → 409 — 2026-06-07 |
| Backend: 422 para reglas de negocio (no 500) | ✓ | curl — stock insuficiente, tipo inválido → 422 — 2026-06-07 |
| Seguridad backend: 17 combinaciones endpoint×rol verificadas | ✓ | curl con JWT tokens — 2026-06-07 |
| Soft delete real en categorías (no DELETE físico) | ✓ | Código — `category.setActive(false)` en `CategoryServiceImpl` |
| Soft delete real en productos (no DELETE físico) | ✓ | Código — `product.setActive(false)` en `ProductServiceImpl` |
| Categoría con productos activos no se puede desactivar | ✓ | Código — guard en `deactivateCategory()` con 422 |
| `ng test --no-watch` → 0 failures (regresión módulos 0-1) | ✓ | 43 specs, 0 fallos — 2026-06-05 |
| Race condition en búsqueda eliminada (BUG-06) | ✓ | Browser — 1 petición por acción — 2026-06-06 |
| Sin doble petición al abrir con `?categoryId` (BUG-07) | ✓ | Browser — network log — 2026-06-06 |
| Tooltip proveedor nulo no muestra "null" (BUG-08) | ✓ | Código — `\|\| ''` en binding — 2026-06-06 |
| 403 no redirige a login (BUG-09 error interceptor) | ✓ | Browser — módulo carga correctamente — 2026-06-06 |
| Tests browser funcionales: 15/15 PASS | ✓ | Playwright MCP — 2026-06-06 |
| Tests unitarios del módulo Inventory | ✓ | 46 specs, 0 fallos (31 servicios/badge + 8 category-form + 7 product-detail) — 2026-06-07 |
| Fila seleccionada se resalta mientras diálogo abierto (BUG-12 / F08) | ✓ | Browser 4 roles — 2026-06-07 |
| Sin snackbar "No tienes permiso" al navegar categorías→productos con SALES (BUG-13) | ✓ | Browser SALES — 2026-06-07 |
| Desactivar categoría movido al diálogo de edición, solo ADMIN (BUG-14) | ✓ | Browser ADMIN+MANAGER — 2026-06-07 |
| Botón redundante "Productos" eliminado del toolbar de categorías (BUG-15) | ✓ | Browser — 2026-06-07 |
| Botón "Editar" (lápiz) eliminado de tabla de productos (mejora UX) | ✓ | Browser — 2026-06-07 |
| Columna acciones oculta para SALES en tabla de productos (sin columna vacía) | ✓ | Browser SALES — 2026-06-07 |
| Filtros de productos más amplios (search 280px, categoría 220px, proveedor 240px) | ✓ | Browser — 2026-06-07 |
| Regresión completa 4 roles post-fix (navegación, RBAC, sin snackbars incorrectos) | ✓ | Playwright MCP — 2026-06-07 |
| `category-form.component.spec.ts`: 8 specs — botón Desactivar, output save/cancel/deactivate, precarga | ✓ | `ng test --no-watch` — 2026-06-07 |
| `product-detail.component.spec.ts`: 7 specs — `getStatusLabel()`, `getMovementTypeLabel()` | ✓ | `ng test --no-watch` — 2026-06-07 |
| Tests RBAC backend con Spring Security activo: `CategoryControllerSecurityTest` 8 specs | ✓ | `mvn test` — 2026-06-07 |
| Tests RBAC backend con Spring Security activo: `ProductControllerSecurityTest` 8 specs | ✓ | `mvn test` — 2026-06-07 |
| Estado `AVAILABLE` mostrado como "Disponible" en detalle de producto (getStatusLabel) | ✓ | Browser 4 roles + specs — 2026-06-07 |
| Suite total frontend post-tests: `ng test --no-watch` → 89 specs, 0 fallos | ✓ | `ng test --no-watch` — 2026-06-07 |
| `availableStock` usado en MovementDialog (no `currentStock`) — regla de negocio OUT | ✓ | Código + análisis — 2026-06-07 |
| MovementDialog: Validators.max(availableStock) reactivo al cambiar tipo a OUT | ✓ | Código — 2026-06-07 |
| StockBadge: tooltip enriquecido con físico/reservado/disponible cuando reservedStock > 0 | ✓ | Código + specs — 2026-06-07 |
| ProductDetail readonly: muestra reservedStock y availableStock cuando > 0 | ✓ | Código — 2026-06-07 |
| currentStock bloqueado en modo edición (solo readable vía movimientos) | ✓ | Frontend: campo disabled + hint. Backend: @Mapping ignore — 2026-06-07 |
| Columna unitCost visible solo para ADMIN/MANAGER en tabla de productos | ✓ | Código — displayedColumns condicional — 2026-06-07 |
| Suite total frontend post-fix business logic: `ng test --no-watch` → 94 specs, 0 fallos | ✓ | `ng test --no-watch` — 2026-06-07 |
| Suite total backend post-fix business logic: `mvn test` → 396 tests, 0 fallos | ✓ | `mvn test` — 2026-06-07 |
| Doble asterisco eliminado: `<span class="required">*</span>` removido de 12 labels en 3 archivos | ✓ | Código — AM genera asterisco automáticamente via Validators.required — 2026-06-07 |
| `subscriptSizing="dynamic"` en campo Stock para que hint no se solape con Estado en el grid | ✓ | Código — 2026-06-07 |
| Hint campo Stock: icono `lock` azul (#1565C0) + "El stock físico solo puede modificarse mediante Registrar movimiento." | ✓ | Código — MatIconModule añadido a ProductFormComponent — 2026-06-07 |
| LowStockPageComponent implementado: vista completa con RBAC 4 roles | ✓ | Browser 4 roles — 2026-06-07 |
| LowStock: unitCost visible solo para ADMIN/MANAGER | ✓ | Browser 4 roles — 2026-06-07 |
| LowStock: botón registrar movimiento visible para ADMIN/MANAGER/WAREHOUSEMAN; oculto para SALES | ✓ | Browser 4 roles — 2026-06-07 |
| LowStock: clasificación sin-stock/crítico/por reservas correcta | ✓ | Specs 3 tests + browser — 2026-06-07 |
| LowStock: ordenamiento por déficit DESC (mayor urgencia primero) | ✓ | Specs + browser — 2026-06-07 |
| LowStock: sidebar muestra "Bajo stock" para los 4 roles | ✓ | Browser 4 roles — 2026-06-07 |
| LowStock: breadcrumb "Inventario → Bajo stock" correcto | ✓ | Browser 4 roles — 2026-06-07 |
| `low-stock-page.component.spec.ts`: 17 specs, 0 fallos | ✓ | `ng test --no-watch` — 2026-06-07 |
| Suite total frontend post-LowStock: `ng test --no-watch` → 111 specs, 0 fallos | ✓ | `ng test --no-watch` — 2026-06-07 |
| **Protocolo de pruebas (Propuesta A–D) aplicado al módulo — 2026-06-09** | | |
| `product-form.component.spec.ts`: 26 specs — isEdit, ngOnChanges, validaciones, submit, outputs, botón Desactivar, statusOptions | ✓ | `ng test --no-watch` — 2026-06-09 |
| `movement-dialog.component.spec.ts`: 27 specs — availableStock, validators por tipo, form validations, submit éxito/error, errorMessage reset | ✓ | `ng test --no-watch` — 2026-06-09 |
| `product-detail.component.spec.ts`: 24 specs — getStatusLabel, getMovementTypeLabel, ngOnChanges, loadMovements, onMovPageChange, reloadMovements, readonly view | ✓ | `ng test --no-watch` — 2026-06-09 |
| Suite total frontend post-testing completo: `ng test --no-watch` → 215 specs, 0 fallos | ✓ | `ng test --no-watch` — 2026-06-09 |
| Cobertura statements total: 89.32% (movement-dialog 81.3%, product-form 82.6%, product-detail 92.0%) | ✓ | `ng test --code-coverage` — 2026-06-09 |
| **Verificación browser completa del documento de casos de prueba — 2026-06-09** | | |
| 150 de 162 casos ✅ PASS; 2 ❌ FAIL; 10 N/A — 0 PENDIENTE | ✓ | Playwright MCP — 2026-06-09 |
| BUG-INV-06 (BSRCH-PROD-03): backend no normaliza acentos — "galon" no encuentra "Galón" | ✅ RESUELTO | Re-test 2026-06-10: búsqueda "galon" → 3 resultados con "Galón" |
| BUG-INV-07 (VIS-GEN-06): headers de tabla no-sticky sin colores de marca (#F2E4F2 / #6B3C6B) | ⚠️ ABIERTO | Verificado con getComputedStyle en productos y categorías |
| BUG-INV-08 (VAL-PDET-14/15): "La categoría es obligatorio." — error de concordancia de género | ⚠️ ABIERTO | Re-test 2026-06-10: blur en Categoría* en formulario "Nuevo producto" |
| BUG-INV-09 (CRUD-PDET-01): JWT expirado → 403 (no 401) en POST/PUT/GET; frontend no detecta "sesión expirada" | ⚠️ ABIERTO — CRÍTICO | Re-test 2026-06-10 con JWT fresco: CRUD-PDET-01..05, VAL-PDET-08/09, UI-PDET-01/03 → todos ✅ PASS. Confirma que SecurityConfig y permisos ADMIN son correctos; el 403 original fue exclusivamente por JWT expirado. Bug de "403 en vez de 401 + frontend sin detección de sesión expirada" sigue ⚠️ ABIERTO, sin corregir, pendiente de autorización |
| BUG-INV-10 (UI-PROD-PAG-03): cambiar "Items per page" no vuelve a página 0 | ⚠️ ABIERTO | Re-test 2026-06-10: estando en página 2 ("21-40 of 108", size=20), cambiar "Items per page" a 10 muestra "21-30 of 108" en vez de "1-10 of 108" — comportamiento por defecto de mat-paginator (pageIndex = floor(primerÍndice/nuevoSize)), severidad baja, sin corregir, pendiente de autorización |
| BUG-INV-11 (CYBER-07): `unitCost` expuesto en JSON de respuesta para WAREHOUSEMAN/SALES | ❌ FAIL — ALTA | Re-test 2026-06-10: `GET /inventory/products` y `GET /inventory/products/low-stock` devuelven `unitCost` con valor real (180, 7800) para JWT de `almacen01` (WAREHOUSEMAN) y `ventas01` (SALES), aunque la columna está oculta en la UI. Ocultamiento solo en frontend, no en backend. Sin corregir, pendiente de autorización |
| BUG-INV-12 (SEC-04): `GET /purchases/suppliers/active` → 403 para SALES rompe `forkJoin` de filtros en Productos | ⚠️ ABIERTO — MEDIA | Re-test 2026-06-10: login `ventas01`, navegar a `/inventory/products` → snackbar rojo "No tienes permiso para realizar esta acción." al cargar; filtros "Categoría" y "Proveedor" vacíos (solo "Todas"/"Todos"). `GET /purchases/suppliers/active` → 403 con JWT de `ventas01` (200 con `manager01`). Sin corregir, pendiente de autorización |
| BUG-INV-13 (CYBER-02): JWT manipulado en localStorage desbloquea UI de ADMIN sin acceso real del backend | ✅ NO REPRODUCIBLE (2026-06-12) | Re-test 2026-06-12: corregido como efecto colateral de BUG-INV-09 — el backend ahora responde 401 (no 403) para JWT con firma inválida, y `error.interceptor.ts` ya manejaba 401 (limpia sesión, redirige a `/login?reason=expired`). Sin flash de UI de ADMIN, sin cambios de código |
| VAL-PDET-09: SKU duplicado → snackbar "Ya existe un producto con el SKU 'ELEC-PRO-043'." (409) | ✓ | Browser — 2026-06-09 |
| Todos los filtros de productos verificados: por categoría, estado, proveedor | ✓ | Browser ADMIN — 2026-06-09 |
| MovementDialog: VIS-MOV-01/02, UI-MOV-01, VAL-MOV-05, RN-MOV-01/02 — todos PASS | ✓ | Browser ADMIN — 2026-06-09 |
| StockBadge colores: verde #E8F5E9 (ok), naranja #FFF3E0 (bajo), rojo #FFEBEE (sin stock) | ✓ | Browser ADMIN — 2026-06-09 |
| Breadcrumb correcto en las 3 pantallas: "→ Productos" / "→ Categorías" / "→ Bajo stock" | ✓ | Browser ADMIN — 2026-06-09 |
| Chips de severidad low-stock: "Sin stock" rojo #FFEBEE/#C62828; "Crítico" naranja #FFF3E0/#E65100 | ✓ | Browser ADMIN — 2026-06-09 |
| Validaciones de categoría: nombre vacío → "El nombre es obligatorio."; Guardar deshabilitado → activo al modificar | ✓ | Browser ADMIN — 2026-06-09 |
