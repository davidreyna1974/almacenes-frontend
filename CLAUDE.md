# CLAUDE.md — Frontend Almacenes

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Descripción del proyecto

Frontend Angular para el sistema de gestión de almacenes.
Consume el backend REST API del repositorio `almacenes-backend` (GitHub: davidreyna1974).

**Stack tecnológico:**
- Framework: Angular (última versión estable disponible al crear el proyecto)
- UI Library: Angular Material (versión que coincide con Angular)
- Lenguaje: TypeScript (strict mode habilitado)
- Estilos: SCSS + Angular Material theming
- HTTP client: Angular HttpClient con interceptores
- Estado: RxJS + Services con BehaviorSubject (sin NgRx — proyecto de escala media)
- Build tool: Angular CLI / npm
- Tests: Jasmine + Karma (unit), Cypress o Playwright (E2E)

**Backend API:**
- Base URL (desarrollo): `http://localhost:8080/api/v1`
- Documentación Swagger: `http://localhost:8080/swagger-ui/index.html`
- Especificación OpenAPI: `http://localhost:8080/v3/api-docs`
- JWT expira en: 2 horas — implementar re-login o refresh

---

## ⚠️ Convenciones de Git — REGLAS CRÍTICAS

**NUNCA commitear directamente en `main` o `develop`.**
Todo trabajo va en una `feature/` o `fix/` branch y llega vía `git merge --no-ff`.

**Instalar el hook de protección al clonar:**
```bash
cp hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

**Flujo obligatorio:**
```bash
git checkout develop
git checkout -b feature/<nombre>
# ... trabajar y commitear ...
git checkout develop
git merge --no-ff feature/<nombre>
git push origin develop
```

| Prefijo | Cuándo |
|---|---|
| `feature/<nombre>` | Módulo nuevo o funcionalidad |
| `fix/<nombre>` | Corrección post-merge |
| `chore/<nombre>` | Infraestructura, configuración, documentación |

---

## Documentación obligatoria por módulo

Todo módulo nuevo requiere dos archivos en la raíz antes de implementar:
- `propuesta_modulo_<nombre>_frontend.txt` — planificación previa al código
- `memoria_tecnica_modulo_<nombre>_frontend.md` — documento vivo con 10 secciones

**Secciones de la memoria técnica** (actualizar al finalizar cada fase):
1. Contexto y justificación
2. Decisiones de diseño
3. Especificación de componentes/vistas
4. Servicios y contratos con el backend
5. Algoritmos y lógica no trivial
6. RBAC — criterio de visibilidad por rol
7. Ejecución de tests y resultados *(ver criterio detallado abajo)*
8. Bugs y retos durante el desarrollo
9. Estándares y buenas prácticas aplicadas
10. Cumplimiento y validación

**Sección 7 — Ejecución de tests (evidencia verificable):**
- Por clase de test: comando `ng test --include=...`, resultado `X specs, 0 failures`
- Suite consolidada: `ng test` → `X specs, 0 failures`
- Cobertura: `ng test --code-coverage` → líneas/statements/branches
- E2E: comando Cypress/Playwright, endpoints verificados, resultado X/Y — 0 fallos
- Regresiones: suite pre-módulo X/X → post-módulo X/X

---

## Identidad visual y paleta de colores

### Nombre del sistema
**Almacenes** — nombre en sidebar, login, título del browser y favicon.

### Paleta principal (triada monocromática púrpura)

| Uso | Hex | Descripción |
|---|---|---|
| Primary / Brand | `#6B3C6B` | Púrpura oscuro — sidebar, headers, botones primarios |
| Accent / Highlight | `#CE6EEB` | Púrpura vibrante — badges, indicadores activos, hover states |
| Surface / Background | `#F2E4F2` | Lavanda claro — fondos de cards, inputs, áreas de contenido |

### Colores complementarios

| Uso | Hex | Descripción |
|---|---|---|
| Background general | `#FAFAFA` | Gris muy claro — fondo base de la app |
| Surface cards | `#FFFFFF` | Blanco — interior de cards y paneles |
| Text primary | `#212121` | Gris muy oscuro — textos principales |
| Text secondary | `#757575` | Gris medio — subtítulos, labels |
| Dividers | `#E0E0E0` | Gris claro — separadores, bordes |
| Success | `#2E7D32` | Verde oscuro — estados DELIVERED, RECEIVED |
| Warning | `#E65100` | Naranja oscuro — estados PENDING |
| Info | `#1565C0` | Azul oscuro — estados APPROVED |
| Error | `#C62828` | Rojo oscuro — errores, estados CANCELLED |

### Reglas de uso de color

- El color `#CE6EEB` es de **acento** — usarlo con moderación (máx 10-15% del área visible).
  Puntos de aplicación: badge del rol activo, ítem de sidebar seleccionado, chips de estado, 
  indicadores de progreso, subrayado de links activos.
- El color `#6B3C6B` es el **color de marca** — sidebar, toolbar, botones primarios.
- El color `#F2E4F2` es el **color de superficie** — fondos de formularios, cards de detalle.
- Nunca usar `#CE6EEB` como fondo de texto largo — contraste insuficiente para lectura sostenida.
- Los textos sobre fondos `#6B3C6B` deben ser blancos (`#FFFFFF`) para cumplir WCAG AA.

### Tema Angular Material

Definir en `src/styles/theme.scss`:
```scss
@use '@angular/material' as mat;

$primary-palette: mat.define-palette((
  100: #F2E4F2,
  300: #CE6EEB,
  500: #9B4FAB,
  700: #6B3C6B,
  900: #4A2850,
  contrast: (
    100: #212121,
    300: #212121,
    500: #ffffff,
    700: #ffffff,
    900: #ffffff,
  )
));

$accent-palette: mat.define-palette((
  200: #F2E4F2,
  400: #CE6EEB,
  600: #B850D4,
  contrast: (
    200: #212121,
    400: #212121,
    600: #ffffff,
  )
));

$theme: mat.define-light-theme((
  color: (
    primary: $primary-palette,
    accent: $accent-palette,
    warn: mat.define-palette(mat.$red-palette),
  ),
  typography: mat.define-typography-config(),
  density: 0,
));
```

---

## Layout y navegación

### Estructura general (Desktop — 1280px+)

```
┌──────────────────────────────────────────────────────┐
│                    Top Bar (64px)                    │
│  [≡]  Almacenes                    [🔔] [👤 Admin ▼] │
├────────┬─────────────────────────────────────────────┤
│Sidebar │           Área de contenido                 │
│(240px) │  ┌──────────────────────────────────────┐   │
│        │  │  Breadcrumb  │  Título  │  Actions   │   │
│ [📦]   │  ├──────────────────┬───────────────────┤   │
│ Inv    │  │  Panel Lista     │  Panel Detalle    │   │
│        │  │  (filtros+tabla) │  (formulario/     │   │
│ [🛒]   │  │                  │   vista detalle)  │   │
│ Compras│  │                  │                   │   │
│        │  │                  │                   │   │
│ [💰]   │  │                  │                   │   │
│ Ventas │  │                  │                   │   │
│        │  └──────────────────┴───────────────────┘   │
│ [📊]   │                                             │
│ Reports│                                             │
│        │                                             │
│ ─────  │                                             │
│ [⚙️]   │                                             │
│        │                                             │
│ [◀]    │                                             │
└────────┴─────────────────────────────────────────────┘
```

Sidebar colapsado (64px — solo íconos):
```
┌────┬──────────────────────────────────────────────────┐
│[📦]│                Área de contenido                 │
│[🛒]│                                                  │
│[💰]│                                                  │
│[📊]│                                                  │
│[▶] │                                                  │
└────┴──────────────────────────────────────────────────┘
```

### Sidebar — estructura y comportamiento

- **Ancho expandido**: 240px | **Ancho colapsado**: 64px
- **Fondo**: `#6B3C6B` (púrpura oscuro)
- **Texto e íconos**: `#FFFFFF`
- **Ítem activo**: fondo `rgba(206,110,235,0.25)`, borde izquierdo 3px `#CE6EEB`
- **Hover**: fondo `rgba(255,255,255,0.08)`
- **Transición**: 200ms ease-in-out al colapsar/expandir
- Logo "Almacenes" en la parte superior — al colapsar, solo muestra el ícono
- Botón de colapso (chevron) al fondo del sidebar
- Ítems de navegación incluyen: ícono + texto + badge de notificación cuando aplique
- Los sub-ítems se muestran como indentación dentro del mismo sidebar (no mega-menu)
- El sidebar se adapta dinámicamente según el rol del usuario autenticado

### Vista dividida lista + detalle (Master-Detail)

- **Panel lista**: ~40% del ancho disponible — tabla con paginación, filtros, búsqueda
- **Panel detalle**: ~60% del ancho disponible — formulario o vista de detalle
- **Estado vacío del panel detalle**: mensaje amigable "Selecciona un elemento para ver los detalles"
- **Animación**: fade-in suave al cargar el detalle (150ms)
- En operaciones de creación, el panel detalle muestra el formulario en blanco
- El ítem seleccionado en la lista tiene fondo `#F2E4F2` (lavanda)

### Top Bar

- **Fondo**: `#FFFFFF` con sombra `box-shadow: 0 1px 4px rgba(107,60,107,0.15)`
- **Logo/nombre**: a la izquierda, con botón hamburguesa para colapsar sidebar
- **Zona derecha**: ícono de notificaciones + chip del nombre de usuario con su rol
- El chip del rol usa colores semánticos:
  - ADMIN → `#6B3C6B` (brand)
  - MANAGER → `#1565C0` (info)
  - WAREHOUSEMAN → `#2E7D32` (success)
  - SALES → `#E65100` (warning)

---

## Estructura del proyecto Angular

```
src/
├── app/
│   ├── core/
│   │   ├── auth/
│   │   │   ├── auth.service.ts          (login, logout, token management)
│   │   │   ├── auth.guard.ts            (canActivate por rol)
│   │   │   ├── jwt.interceptor.ts       (agrega Authorization header)
│   │   │   └── error.interceptor.ts     (manejo global de errores HTTP)
│   │   ├── layout/
│   │   │   ├── sidebar/                 (componente sidebar colapsable)
│   │   │   ├── topbar/                  (componente top bar)
│   │   │   └── main-layout/             (shell con sidebar + router-outlet)
│   │   └── shared/
│   │       ├── models/
│   │       │   └── page-response.model.ts   (PageResponseDTO<T>)
│   │       ├── components/
│   │       │   ├── master-detail/       (componente reutilizable split view)
│   │       │   ├── confirm-dialog/      (modal de confirmación)
│   │       │   └── empty-state/         (estado vacío reutilizable)
│   │       └── pipes/
│   │           └── status-label.pipe.ts (PENDING → "Pendiente", etc.)
│   └── modules/
│       ├── auth/       (login, perfil, cambio de contraseña, gestión de usuarios)
│       ├── inventory/  (categorías, productos, movimientos de stock/Kardex)
│       ├── purchases/  (proveedores, órdenes de compra)
│       ├── sales/      (clientes, órdenes de venta, reservaciones)
│       └── reports/    (dashboard ejecutivo, gestión, operativos)
├── environments/
│   ├── environment.ts          (dev — apiUrl: 'http://localhost:8080/api/v1')
│   └── environment.prod.ts     (prod — apiUrl desde variable de entorno)
└── styles/
    ├── theme.scss              (Angular Material custom theme)
    ├── variables.scss          (colores, espaciados, tipografía como variables CSS)
    └── global.scss             (estilos globales mínimos)
```

---

## Estándares de código Angular

### Componentes — Smart vs Dumb

- **Smart components** (containers): se suscriben a servicios, manejan estado, orquestan acciones.
  Ejemplo: `ProductListComponent`, `PurchaseOrderDetailComponent`.
- **Dumb components** (presentacionales): reciben `@Input()`, emiten `@Output()`, sin lógica de negocio.
  Ejemplo: `StatusBadgeComponent`, `PaginationComponent`, `EmptyStateComponent`.

**Por qué separar**: los dumb components son 100% reutilizables y testeables sin mocks de servicios.

### Formularios

Usar siempre **Reactive Forms** (`FormGroup`, `FormControl`, `Validators`).
Nunca Template-driven forms — son más difíciles de testear y tienden a dispersar la validación.

```typescript
// Patrón estándar
this.form = this.fb.group({
  name:  ['', [Validators.required, Validators.maxLength(120)]],
  price: [null, [Validators.required, Validators.min(0.01)]],
});
```

### Servicios HTTP

- Un servicio por módulo de negocio: `ProductService`, `PurchaseOrderService`, etc.
- Todos los métodos retornan `Observable<T>` — nunca suscribirse dentro del servicio.
- El interceptor JWT agrega el header automáticamente — los servicios no manejan tokens.
- El interceptor de errores maneja 401 (redirigir a login) y 403 (mostrar mensaje de acceso denegado).

```typescript
// Patrón estándar de servicio
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly api = `${environment.apiUrl}/inventory/products`;

  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 20): Observable<PageResponse<ProductResponse>> {
    return this.http.get<PageResponse<ProductResponse>>(this.api, {
      params: { page, size }
    });
  }
}
```

### Consumo de paginación

El backend retorna `PageResponseDTO<T>`. Diseñar todos los componentes de lista
para consumir este formato desde el primer componente:

```typescript
interface PageResponse<T> {
  content:      T[];
  currentPage:  number;
  totalPages:   number;
  totalElements: number;
  size:         number;
  first:        boolean;
  last:         boolean;
}
```

El componente de tabla usa `mat-paginator` de Angular Material vinculado a estos campos.

### Gestión de suscripciones

Usar `takeUntilDestroyed()` (Angular 16+) para evitar memory leaks.
Nunca suscribirse sin cleanup.

```typescript
// Patrón correcto
private destroyRef = inject(DestroyRef);

ngOnInit() {
  this.service.getAll().pipe(
    takeUntilDestroyed(this.destroyRef)
  ).subscribe(data => this.items = data);
}
```

Preferir el **async pipe** en templates sobre suscripciones manuales cuando sea posible.

### Autenticación y guards

- El token JWT se almacena en `localStorage` (persiste entre sesiones).
- Al cerrar sesión: eliminar el token y redirigir a `/login`.
- `AuthGuard` implementa `canActivate` verificando token + rol requerido.
- Las rutas se configuran con `data: { roles: ['ROLE_ADMIN', 'ROLE_MANAGER'] }`.
- Si el token expira (2h), el interceptor de errores detecta 401 y redirige a login
  mostrando mensaje "Tu sesión ha expirado. Vuelve a iniciar sesión."

### Variables de entorno

Nunca hardcodear URLs ni configuración sensible en componentes o servicios.

```typescript
// environment.ts (desarrollo)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1'
};
```

En producción, la URL viene de la configuración del servidor o de un archivo
`environment.prod.ts` que NO se commitea si contiene datos sensibles.

---

## Estándares de UX/UI

### Tooltips y popovers

- **Tooltips** (`matTooltip`): en todos los botones de íconos sin texto visible,
  en columnas de tabla con texto truncado, en badges de estado.
- **Popovers** (MatMenu o componente custom): para mostrar información adicional
  de un registro sin navegar — ej. historial resumido de movimientos, detalles del proveedor.
- **Delay de tooltip**: 300ms para no mostrarlos al pasar el cursor rápidamente.
- Los formularios muestran mensajes de error inline bajo cada campo (no en toast ni alert).

### Feedback al usuario

- **Acciones exitosas**: `MatSnackBar` en la parte inferior derecha, duración 3 segundos,
  fondo `#2E7D32` (verde). Mensaje conciso: "Producto creado correctamente."
- **Errores de negocio**: `MatSnackBar` con fondo `#C62828` (rojo). Mensaje del backend si disponible.
- **Carga de datos**: `MatProgressBar` en la parte superior del panel (indeterminado).
  En tablas: skeleton loading (filas grises animadas) en lugar de spinner centrado.
- **Confirmación de acciones destructivas**: `MatDialog` con el patrón confirm-dialog
  antes de desactivar, cancelar órdenes, o cualquier acción irreversible.
- **Estado vacío**: componente `EmptyStateComponent` con ícono, título y descripción
  cuando una lista no tiene resultados. Diferente mensaje para "sin datos" vs "sin resultados de búsqueda".

### Tablas

- Usar `MatTable` con `MatSort`, `MatPaginator` y barra de búsqueda.
- Columnas con texto largo usan truncado con `text-overflow: ellipsis` + tooltip con el valor completo.
- La fila seleccionada se resalta con fondo `#F2E4F2`.
- Columna de acciones (editar, ver, desactivar) siempre a la derecha, íconos con tooltip.
- Ordenamiento por defecto: `createdAt DESC` para listas de órdenes; `name ASC` para catálogos.

### Formularios

- Labels siempre visibles (no solo placeholder que desaparece al escribir).
- Campos obligatorios marcados con asterisco rojo `*`.
- Validación en tiempo real (al salir del campo — `blur`) y al intentar guardar.
- El botón de guardar se deshabilita mientras el formulario sea inválido o esté cargando.
- Campos de fecha usan `MatDatepicker` con formato `dd/MM/yyyy`.
- Campos numéricos monetarios muestran símbolo de moneda como prefix.
- Los selectores de rol/estado/tipo usan `MatSelect` con opciones descriptivas.

### Badges de estado de órdenes

Los estados de las órdenes tienen colores semánticos consistentes en toda la app:

| Estado | Color fondo | Color texto | Ícono |
|---|---|---|---|
| PENDING | `#FFF3E0` | `#E65100` | `schedule` |
| APPROVED | `#E3F2FD` | `#1565C0` | `check_circle` |
| RECEIVED / DELIVERED | `#E8F5E9` | `#2E7D32` | `done_all` |
| CANCELLED | `#FFEBEE` | `#C62828` | `cancel` |

### Accesibilidad mínima

- Contraste de texto: mínimo WCAG AA (4.5:1 para texto normal, 3:1 para texto grande).
- Todos los íconos interactivos tienen `aria-label`.
- El sidebar y el foco del teclado deben ser navegables con Tab.
- Los diálogos atrapa el foco mientras están abiertos.

---

## RBAC en el frontend

El sidebar y las rutas se adaptan al rol del usuario extraído del JWT.

| Módulo / Sección | ADMIN | MANAGER | WAREHOUSEMAN | SALES |
|---|:---:|:---:|:---:|:---:|
| Dashboard ejecutivo | ✓ | — | — | — |
| Inventory (escritura) | ✓ | ✓ | — | — |
| Inventory (lectura) | ✓ | ✓ | ✓ | ✓ |
| Purchases | ✓ | ✓ | Solo recepción | — |
| Sales | ✓ | ✓ | Solo entrega | ✓ |
| Reports analíticos | ✓ | ✓ | — | — |
| Reports operativos | ✓ | ✓ | ✓ | Solo pendientes |
| Gestión de usuarios | ✓ | — | — | — |

Las rutas protegidas por rol usan `AuthGuard`. Si el usuario intenta acceder
a una ruta no autorizada, se redirige a su pantalla de inicio con mensaje de acceso denegado.

---

## Taxonomía de tests (Angular)

| Tipo | Herramienta | Qué verifica |
|---|---|---|
| **A — Unit (componente)** | Jasmine + TestBed | Lógica del componente, binding de datos, eventos |
| **B — Unit (servicio)** | Jasmine + HttpClientTestingModule | Llamadas HTTP, transformaciones de datos |
| **C — Integration** | Jasmine + TestBed completo | Interacción entre componente y servicio real |
| **E — E2E** | Cypress / Playwright | Flujo completo en browser real con backend activo |

Cobertura mínima: **70% statements** por módulo (equivalente a JaCoCo en el backend).

---

## Comandos comunes

```bash
# Instalar Angular CLI globalmente
npm install -g @angular/cli

# Crear proyecto
ng new almacenes --style=scss --routing=true --strict

# Agregar Angular Material
ng add @angular/material

# Ejecutar en desarrollo
ng serve

# Ejecutar tests unitarios
ng test

# Ejecutar tests con cobertura
ng test --code-coverage

# Build de producción
ng build --configuration=production
```

---

## Estado actual

**Fase**: inicialización — directorio y repositorio creados, pendiente de implementación.

**Próximos pasos:**
1. Instalar Angular CLI y crear el proyecto base con Angular Material
2. Configurar tema personalizado con la paleta `#6B3C6B / #CE6EEB / #F2E4F2`
3. Implementar estructura de layout (sidebar + top bar + main-layout)
4. Implementar módulo de autenticación (login, JWT interceptor, guards)
5. Implementar módulos de negocio por audiencia según RBAC

---

## Referencia al backend

| Recurso | URL |
|---|---|
| Swagger UI | `http://localhost:8080/swagger-ui/index.html` |
| OpenAPI spec | `http://localhost:8080/v3/api-docs` |
| Login | `POST http://localhost:8080/api/v1/auth/login` |
| Repositorio | github.com/davidreyna1974/almacenes-backend |
