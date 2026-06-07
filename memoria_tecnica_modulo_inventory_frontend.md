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
Resultado: **5 archivos, 46 specs, 0 fallos**

| Archivo | Tests | Qué verifica |
|---|:---:|---|
| `category.service.spec.ts` | 8 | `getActive()` con params defecto y custom; `create()` verifica body; `update()` verifica URL y body; `delete()` verifica 204 void |
| `product.service.spec.ts` | 15 | `search()` con todos los parámetros incluyendo normalización de búsqueda en blanco; `getById`, `getBySku`, `getByCategory`, `getLowStock`; `create`, `update`, `delete` (204); `registerMovement` (204); `getMovements`; **`getActiveSuppliers()` verifica que `companyName` del backend se mapea a `name` en el modelo frontend** |
| `stock-badge.component.spec.ts` | 8 | `level` getter: stock=0→error, stock≤min→warning, stock>min→success; `tooltipText` getter: los tres mensajes con valores numéricos correctos; renderizado con TestBed |
| `category-form.component.spec.ts` | 8 | `canDeactivate` input: botón "Desactivar" visible solo con `canDeactivate=true` e `isEdit=true`; output `deactivate` emite al hacer clic; output `save` emite `CategoryRequest` correcto cuando el formulario es válido; no emite `save` si `name` está vacío; output `cancel` emite al hacer clic en Cancelar; precarga: formulario inicializado con los valores del `item` recibido. **API**: `fixture.componentRef.setInput()` para triggear `ngOnChanges` correctamente |
| `product-detail.component.spec.ts` | 7 | `getStatusLabel()`: traduce AVAILABLE→"Disponible", DISCONTINUED→"Descontinuado", OUT_OF_STOCK→"Sin stock", fallback→valor original; `getMovementTypeLabel()`: traduce IN→"Entrada", OUT→"Salida", cualquier otro valor→"Salida" (rama else) |

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
