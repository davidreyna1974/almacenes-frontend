# Propuesta de Plan de Trabajo — Frontend Almacenes

**Versión:** 1.0  
**Fecha:** 2026-06-04  
**Repositorio frontend:** `frontend/almacenes`  
**Repositorio backend:** `github.com/davidreyna1974/almacenes-backend`  
**Rama base de desarrollo:** `develop`  
**Metodología de entrega:** ramas `feature/<nombre>` mergeadas con `--no-ff` a `develop`

---

## Índice

1. [Visión general del sistema](#1-visión-general-del-sistema)
2. [Arquitectura de la solución](#2-arquitectura-de-la-solución)
3. [Stack tecnológico y justificación](#3-stack-tecnológico-y-justificación)
4. [Plan de fases globales](#4-plan-de-fases-globales)
5. [Módulo 0 — Infraestructura base](#módulo-0--infraestructura-base)
6. [Módulo 1 — Autenticación y gestión de usuarios](#módulo-1--autenticación-y-gestión-de-usuarios)
7. [Módulo 2 — Inventario](#módulo-2--inventario)
8. [Módulo 3 — Compras](#módulo-3--compras)
9. [Módulo 4 — Ventas](#módulo-4--ventas)
10. [Módulo 5 — Reportes y Dashboard](#módulo-5--reportes-y-dashboard)
11. [Estrategia de testing](#11-estrategia-de-testing)
12. [Convenciones de código y calidad](#12-convenciones-de-código-y-calidad)
13. [Integración continua y despliegue](#13-integración-continua-y-despliegue)
14. [Cronograma estimado](#14-cronograma-estimado)
15. [Criterios de aceptación globales](#15-criterios-de-aceptación-globales)
16. [Riesgos y mitigación](#16-riesgos-y-mitigación)

---

## 1. Visión general del sistema

### ¿Qué es Almacenes?

**Almacenes** es un sistema de información para la gestión integral de almacenes. Permite controlar inventarios, procesar órdenes de compra y venta, gestionar proveedores y clientes, y generar reportes analíticos y operativos. El sistema está orientado a empresas con operaciones de almacén de escala media.

### ¿Por qué se construye este frontend?

El backend (`almacenes-backend`) expone una API REST completa documentada con Swagger/OpenAPI. Este frontend Angular materializa la interfaz de usuario que consume esa API, permitiendo que los distintos roles del negocio (ADMIN, MANAGER, WAREHOUSEMAN, SALES) interactúen con el sistema desde un navegador web sin necesidad de conocer la API directamente.

### Propuesta de valor del frontend

| Beneficio | Descripción |
|---|---|
| Separación de responsabilidades | El frontend es una SPA independiente; el backend puede evolucionar sin romper la UI siempre que el contrato de API se respete |
| Multi-rol | La interfaz se adapta dinámicamente al rol del usuario autenticado (RBAC visual) |
| Experiencia de usuario unificada | Paleta visual coherente, patrones de UX consistentes (master-detail, snackbars, confirmaciones) |
| Mantenibilidad | Código Angular estructurado con módulos de negocio, componentes smart/dumb, reactive forms |
| Testeabilidad | Separación clara de capas permite tests unitarios, de integración y E2E bien definidos |

---

## 2. Arquitectura de la solución

### Diagrama de capas

```
┌─────────────────────────────────────────────────────────────┐
│                    NAVEGADOR (SPA Angular)                  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Módulos de  │  │   Core /     │  │  Shared /        │  │
│  │  Negocio     │  │   Auth       │  │  Componentes     │  │
│  │  (features)  │  │   Guards     │  │  Reutilizables   │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         └─────────────────┴──────────────┬─────┘            │
│                                          │                  │
│                    Servicios HTTP        │                  │
│               (HttpClient + Interceptores)                  │
└───────────────────────────────┬─────────────────────────────┘
                                │ HTTP/REST + JWT
                                ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND — almacenes-backend                    │
│         Spring Boot · REST API · JWT Auth                   │
│         Base URL: http://localhost:8080/api/v1              │
│         Swagger: http://localhost:8080/swagger-ui           │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de autenticación

```
Usuario ingresa credenciales
        │
        ▼
POST /auth/login ──► Backend valida ──► JWT devuelto
        │                                    │
        ▼                                    ▼
AuthService.login()              Almacena en localStorage
        │
        ▼
JWT decodificado ──► Rol extraído ──► Sidebar + rutas filtradas por rol
        │
        ▼
JwtInterceptor ──► Agrega header Authorization en cada petición
        │
        ▼
ErrorInterceptor ──► 401 → redirige a login | 403 → mensaje de acceso denegado
```

### Estructura de directorios Angular

```
src/
├── app/
│   ├── core/
│   │   ├── auth/                    (servicio, guard, interceptores)
│   │   ├── layout/                  (sidebar, topbar, main-layout)
│   │   └── shared/
│   │       ├── models/              (interfaces TypeScript de DTOs)
│   │       ├── components/          (master-detail, confirm-dialog, empty-state)
│   │       └── pipes/               (status-label, currency-format)
│   └── modules/
│       ├── auth/                    (login, perfil, cambio de contraseña)
│       ├── inventory/               (categorías, productos, kardex)
│       ├── purchases/               (proveedores, órdenes de compra)
│       ├── sales/                   (clientes, órdenes de venta, reservaciones)
│       └── reports/                 (dashboard, reportes analíticos y operativos)
├── environments/
└── styles/
    ├── theme.scss                   (Angular Material custom theme)
    ├── variables.scss               (variables CSS globales)
    └── global.scss                  (estilos globales mínimos)
```

---

## 3. Stack tecnológico y justificación

| Tecnología | Elección | Justificación |
|---|---|---|
| Framework | **Angular (última versión estable)** | Estructura de módulos, inyección de dependencias, CLI potente, alineación con el equipo y escala del proyecto |
| Lenguaje | **TypeScript strict** | Tipado fuerte previene errores en tiempo de compilación; mejora la colaboración y el refactoring |
| UI Library | **Angular Material** | Componentes accesibles (WCAG), integración nativa con Angular, theming con paleta personalizada |
| Estilos | **SCSS + Angular Material theming** | Variables de color y mixins permiten mantener la identidad visual de forma centralizada |
| HTTP | **Angular HttpClient + Interceptores** | Interceptor JWT centraliza la autenticación; interceptor de errores centraliza el manejo de fallos |
| Estado | **RxJS + Services con BehaviorSubject** | Sin NgRx: apropiado para escala media; menor boilerplate y curva de aprendizaje |
| Formularios | **Reactive Forms** | Validación centralizada, testeables sin DOM, integración natural con RxJS |
| Tests unitarios | **Jasmine + Karma** | Integración nativa con Angular CLI |
| Tests E2E | **Cypress o Playwright** | Flujos end-to-end reales contra backend activo |
| Build | **Angular CLI** | Optimizaciones de producción (tree-shaking, lazy loading) ya configuradas |

---

## 4. Plan de fases globales

El desarrollo se organiza en **6 módulos** secuenciales. Cada módulo tiene sus propias fases internas. El orden respeta las dependencias: no se puede construir inventario sin autenticación, ni compras sin proveedores.

```
FASE GLOBAL 0  ──►  Infraestructura base (proyecto + layout + tema visual)
      │
      ▼
FASE GLOBAL 1  ──►  Autenticación y gestión de usuarios
      │
      ▼
FASE GLOBAL 2  ──►  Inventario (categorías + productos + Kardex)
      │
      ▼
FASE GLOBAL 3  ──►  Compras (proveedores + órdenes de compra)
      │
      ▼
FASE GLOBAL 4  ──►  Ventas (clientes + órdenes de venta + reservaciones)
      │
      ▼
FASE GLOBAL 5  ──►  Reportes y Dashboard
```

Cada módulo se desarrolla en la rama `feature/<módulo>` y se mergea a `develop` con `--no-ff` al completarse todas sus fases internas.

---

## Módulo 0 — Infraestructura base

### Contexto y justificación

Todo el desarrollo posterior depende de tener el proyecto Angular correctamente inicializado con el tema visual, el layout de la aplicación y la infraestructura de autenticación compartida. Invertir tiempo aquí evita deuda técnica en todos los módulos siguientes.

### Rama de trabajo

```
feature/infra-base
```

### Entregables

- Proyecto Angular creado con SCSS, routing y strict mode habilitado
- Angular Material instalado con tema personalizado `#6B3C6B / #CE6EEB / #F2E4F2`
- Layout completo: sidebar colapsable + top bar + `main-layout` con `<router-outlet>`
- Variables SCSS globales y estilos base
- Environments configurados (dev + prod)
- Estructura de directorios definitiva creada
- Hook git de protección de ramas en `.git/hooks/pre-commit`

---

### Fase 0.1 — Creación del proyecto Angular

**Objetivo:** Tener el proyecto Angular base funcional y ejecutándose localmente.

**Tareas:**
1. Instalar Angular CLI globalmente: `npm install -g @angular/cli`
2. Crear el proyecto: `ng new almacenes --style=scss --routing=true --strict`
3. Instalar Angular Material: `ng add @angular/material` (tema personalizado)
4. Verificar que `ng serve` arranca sin errores en `http://localhost:4200`
5. Crear la estructura de directorios `core/`, `modules/`, `styles/`
6. Configurar `environments/environment.ts` con `apiUrl: 'http://localhost:8080/api/v1'`

**Criterio de aceptación:**
- `ng serve` sin errores ni warnings críticos
- `ng build` produce un bundle limpio
- `ng test` arranca y ejecuta los tests generados por el CLI sin fallos

---

### Fase 0.2 — Tema visual Angular Material

**Objetivo:** Aplicar la paleta corporativa `#6B3C6B / #CE6EEB / #F2E4F2` al tema de Angular Material.

**Tareas:**
1. Crear `src/styles/theme.scss` con la paleta definida en CLAUDE.md
2. Crear `src/styles/variables.scss` con variables CSS para todos los colores, tipografía y espaciados
3. Crear `src/styles/global.scss` con reset mínimo y estilos base
4. Importar `theme.scss` en `angular.json` como primer estilo global
5. Verificar aplicación del tema en un componente de prueba con botones, inputs y cards de Material

**Criterio de aceptación:**
- Los botones `mat-raised-button` de color primario muestran `#6B3C6B`
- Los acentos muestran `#CE6EEB`
- Los fondos de cards muestran `#F2E4F2` cuando se aplica la clase de superficie

---

### Fase 0.3 — Layout principal (Sidebar + Top Bar)

**Objetivo:** Tener el shell de la aplicación con la estructura visual completa.

**Tareas:**

1. **Sidebar** (`core/layout/sidebar/`):
   - Componente Angular con estado `collapsed: boolean`
   - Ancho: 240px expandido / 64px colapsado con transición 200ms ease-in-out
   - Fondo `#6B3C6B`, texto e íconos blancos
   - Ítem activo: fondo `rgba(206,110,235,0.25)` + borde izquierdo 3px `#CE6EEB`
   - Hover: fondo `rgba(255,255,255,0.08)`
   - Botón de colapso (chevron) al fondo
   - Ítems de navegación: Inventario, Compras, Ventas, Reportes
   - Filtrado dinámico de ítems por rol (usando `AuthService` que se implementará en Módulo 1)

2. **Top Bar** (`core/layout/topbar/`):
   - Fondo `#FFFFFF` con sombra `0 1px 4px rgba(107,60,107,0.15)`
   - Logo/nombre "Almacenes" a la izquierda
   - Botón hamburguesa que colapsa/expande el sidebar
   - Zona derecha: ícono de notificaciones + chip de usuario con su rol
   - Colores del chip por rol: ADMIN → `#6B3C6B`, MANAGER → `#1565C0`, WAREHOUSEMAN → `#2E7D32`, SALES → `#E65100`

3. **Main Layout** (`core/layout/main-layout/`):
   - Shell con `mat-sidenav-container`
   - Sidebar como `mat-sidenav`
   - Área de contenido con `<router-outlet>`

**Criterio de aceptación:**
- El sidebar se colapsa y expande con animación fluida
- Los íconos de navegación se ven correctamente en ambos estados
- El chip de rol muestra el color correcto según el tipo de usuario
- El layout responde correctamente en viewport ≥ 1280px

---

### Fase 0.4 — Componentes compartidos base

**Objetivo:** Tener los componentes reutilizables de `shared/` disponibles antes de construir los módulos de negocio.

**Tareas:**
1. **`MasterDetailComponent`**: layout de vista dividida 40%/60% con emisión de evento al seleccionar ítem
2. **`ConfirmDialogComponent`**: modal de confirmación con título, mensaje y botones Cancelar/Confirmar
3. **`EmptyStateComponent`**: ícono + título + descripción; dos variantes: "sin datos" vs "sin resultados de búsqueda"
4. **`StatusBadgePipe`**: convierte `PENDING` → "Pendiente", `APPROVED` → "Aprobado", etc.
5. Modelos TypeScript en `shared/models/`: `PageResponse<T>`, `ApiError`

**Criterio de aceptación:**
- Todos los componentes tienen tests unitarios Jasmine básicos (renderizado, inputs/outputs)
- `ng test` → 0 fallos

---

## Módulo 1 — Autenticación y gestión de usuarios

### Contexto y justificación

Sin autenticación no existe ninguna función de negocio. Este módulo establece el contrato de seguridad entre el frontend y el backend: el JWT, los interceptores, los guards de ruta y la pantalla de login. La gestión de usuarios (CRUD de cuentas) también vive aquí porque es responsabilidad exclusiva del rol ADMIN y comparte el mismo dominio de seguridad.

### Rama de trabajo

```
feature/modulo-auth
```

### Entregables

- Pantalla de login funcional conectada al endpoint `POST /auth/login`
- JWT almacenado en `localStorage`, decodificado para extraer el rol
- `JwtInterceptor` que inyecta el header `Authorization: Bearer <token>` en cada petición
- `ErrorInterceptor` que maneja 401 (expiración → redirige a login) y 403 (acceso denegado)
- `AuthGuard` con verificación de rol por ruta
- Pantalla de perfil de usuario (ver y actualizar datos propios)
- Pantalla de cambio de contraseña
- Gestión de usuarios CRUD (solo ADMIN)
- Documentación: `propuesta_modulo_auth_frontend.txt` + `memoria_tecnica_modulo_auth_frontend.md`

---

### Fase 1.1 — AuthService y JWT

**Objetivo:** Tener la lógica de autenticación encapsulada y testeada.

**Tareas:**
1. Crear `AuthService` con métodos:
   - `login(username, password): Observable<void>` — llama a `POST /auth/login`, almacena el JWT
   - `logout(): void` — limpia `localStorage`, redirige a `/login`
   - `getToken(): string | null`
   - `getRol(): string | null` — decodifica el JWT para extraer el rol
   - `isAuthenticated(): boolean` — verifica que el token existe y no ha expirado
   - `currentUser$: BehaviorSubject<UserInfo | null>` — observable del usuario actual
2. Instalar `jwt-decode` para decodificar el payload del JWT sin verificar firma
3. Tests unitarios del `AuthService` (mock de `HttpClient`)

**Endpoint del backend:**
```
POST /api/v1/auth/login
Body: { "username": "...", "password": "..." }
Response: { "token": "eyJ...", "type": "Bearer", "username": "...", "role": "ROLE_ADMIN" }
```

**Criterio de aceptación:**
- Login exitoso almacena el token y el rol en `localStorage`
- `isAuthenticated()` retorna `false` si el token ha expirado
- Tests unitarios: 0 fallos

---

### Fase 1.2 — Interceptores HTTP

**Objetivo:** Automatizar la inyección del JWT y el manejo centralizado de errores HTTP.

**Tareas:**
1. **`JwtInterceptor`**:
   - Clona la petición y agrega `Authorization: Bearer <token>` si hay token disponible
   - No agrega el header para `POST /auth/login`
2. **`ErrorInterceptor`**:
   - 401 → llama a `AuthService.logout()` + muestra snackbar "Tu sesión ha expirado. Vuelve a iniciar sesión."
   - 403 → muestra snackbar de error "No tienes permisos para realizar esta acción."
   - 400 → muestra mensaje de validación del backend si viene en el body
   - 500 → muestra snackbar genérico "Error del servidor. Intenta más tarde."
3. Registrar ambos interceptores en `AppModule`

**Criterio de aceptación:**
- Todas las peticiones al backend incluyen el header JWT en el Inspector de Red del browser
- Un 401 redirige a `/login` y muestra el mensaje de sesión expirada
- Tests unitarios de ambos interceptores: 0 fallos

---

### Fase 1.3 — AuthGuard y configuración de rutas

**Objetivo:** Proteger las rutas por autenticación y por rol.

**Tareas:**
1. Implementar `AuthGuard` que implementa `canActivate`:
   - Verifica `isAuthenticated()`; si no, redirige a `/login`
   - Verifica que el rol del usuario esté en `data.roles` de la ruta; si no, redirige al home del usuario con mensaje de acceso denegado
2. Configurar el `AppRoutingModule` con rutas protegidas:
   ```typescript
   { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard], data: { roles: ['ROLE_ADMIN'] } }
   { path: 'inventory', ..., data: { roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN', 'ROLE_SALES'] } }
   // etc.
   ```
3. Ruta wildcard `**` → redirige a home o login según estado de autenticación

**Criterio de aceptación:**
- Acceder a `/inventory` sin token redirige a `/login`
- Un usuario con rol SALES que navega a `/admin/users` recibe el mensaje de acceso denegado y es redirigido
- Tests del guard: 0 fallos

---

### Fase 1.4 — Pantalla de Login

**Objetivo:** Tener la interfaz de login completa y conectada al backend.

**Tareas:**
1. Ruta pública: `GET /login` → `LoginComponent`
2. Formulario Reactive con `FormControl` para `username` y `password`
3. Validaciones: ambos campos requeridos; mensajes de error inline
4. Botón de login deshabilitado mientras el formulario sea inválido o esté cargando
5. `MatProgressBar` indeterminado mientras se espera la respuesta
6. Si el login falla (401 del backend): snackbar de error "Credenciales incorrectas."
7. Si el login es exitoso: redirigir a `/` (home según rol)
8. Diseño visual alineado con la paleta corporativa (logo "Almacenes", fondo lavanda)
9. Tests unitarios del componente

**Criterio de aceptación:**
- El formulario no permite enviar si algún campo está vacío
- Login exitoso con credenciales válidas redirige al home del usuario
- Login fallido muestra el snackbar de error sin exponer detalles técnicos

---

### Fase 1.5 — Perfil de usuario y cambio de contraseña

**Objetivo:** Permitir que cualquier usuario autenticado consulte y actualice sus datos y contraseña.

**Tareas:**
1. `UserProfileService` con:
   - `getProfile(): Observable<UserProfile>` → `GET /users/me`
   - `updateProfile(data): Observable<UserProfile>` → `PUT /users/me`
   - `changePassword(data): Observable<void>` → `PATCH /users/me/password`
2. `ProfileComponent`: vista del perfil con formulario editable
3. `ChangePasswordComponent`: formulario con contraseña actual, nueva y confirmación; validación de coincidencia
4. Integración en el menú del chip de usuario del top bar

**Criterio de aceptación:**
- El usuario puede actualizar su nombre y ver los datos actualizados sin recargar la página
- El cambio de contraseña valida que "nueva" y "confirmación" coincidan antes de enviar
- Contraseña incorrecta muestra el mensaje de error del backend

---

### Fase 1.6 — Gestión de usuarios (solo ADMIN)

**Objetivo:** Permitir al ADMIN crear, ver, editar y desactivar cuentas de usuario.

**Tareas:**
1. `UserManagementService`:
   - `getAll(page, size): Observable<PageResponse<UserResponse>>` → `GET /users`
   - `getById(id): Observable<UserResponse>` → `GET /users/{id}`
   - `create(data): Observable<UserResponse>` → `POST /users`
   - `update(id, data): Observable<UserResponse>` → `PUT /users/{id}`
   - `deactivate(id): Observable<void>` → `DELETE /users/{id}` o `PATCH /users/{id}/status`
2. `UserListComponent` (smart): tabla con paginación, búsqueda por nombre/username/rol
3. `UserFormComponent` (dumb): formulario para crear/editar (nombre, username, email, rol, estado)
4. Layout master-detail usando `MasterDetailComponent`
5. Confirmación al desactivar usando `ConfirmDialogComponent`
6. Columna de rol con `StatusBadge` visual por color

**Criterio de aceptación:**
- La ruta `/admin/users` solo es accesible con rol ADMIN
- El ADMIN puede crear un usuario, verlo en la lista inmediatamente y editarlo
- Al intentar desactivar, aparece el diálogo de confirmación
- Tests unitarios del servicio y del componente: 0 fallos

---

## Módulo 2 — Inventario

### Contexto y justificación

El inventario es el núcleo del sistema de almacenes. Sin productos y categorías no existen ni compras ni ventas. Este módulo es el más amplio porque abarca tres sub-dominios: la taxonomía (categorías), el catálogo (productos) y el historial de movimientos (Kardex/stock). Los cuatro roles tienen acceso de lectura; ADMIN y MANAGER tienen acceso de escritura.

### Rama de trabajo

```
feature/modulo-inventario
```

### Entregables

- CRUD de categorías de productos
- CRUD de productos con control de stock mínimo
- Vista Kardex: historial de movimientos de stock por producto
- Ajustes manuales de stock (entrada/salida)
- Alertas visuales de stock bajo el mínimo
- Documentación: `propuesta_modulo_inventario_frontend.txt` + `memoria_tecnica_modulo_inventario_frontend.md`

---

### Fase 2.1 — Categorías

**Objetivo:** CRUD completo de categorías de productos.

**Tareas:**
1. `CategoryService`:
   - `getAll(page, size): Observable<PageResponse<Category>>` → `GET /inventory/categories`
   - `getById(id)` → `GET /inventory/categories/{id}`
   - `create(data)` → `POST /inventory/categories`
   - `update(id, data)` → `PUT /inventory/categories/{id}`
   - `delete(id)` → `DELETE /inventory/categories/{id}`
2. `CategoryListComponent`: tabla con búsqueda y paginación
3. `CategoryFormComponent`: formulario con nombre y descripción
4. Layout master-detail
5. Al eliminar: verificar si tiene productos asociados; si sí, mostrar mensaje de bloqueo
6. Tests unitarios del servicio y del componente

**Criterio de aceptación:**
- Solo ADMIN/MANAGER ven los botones de crear/editar/eliminar
- WAREHOUSEMAN y SALES ven la lista en modo lectura
- Tests: 0 fallos

---

### Fase 2.2 — Productos

**Objetivo:** CRUD completo de productos con manejo de stock mínimo y alertas.

**Tareas:**
1. `ProductService`:
   - `getAll(page, size, filters?)` → `GET /inventory/products` (con filtros por categoría, estado, stock bajo)
   - `getById(id)` → `GET /inventory/products/{id}`
   - `create(data)` → `POST /inventory/products`
   - `update(id, data)` → `PUT /inventory/products/{id}`
   - `deactivate(id)` → `PATCH /inventory/products/{id}/status`
2. `ProductListComponent`: tabla con columnas de nombre, categoría, precio, stock actual, stock mínimo, estado
   - Fila con stock ≤ mínimo resaltada en `#FFF3E0` con ícono de advertencia
   - Filtros: categoría, estado (activo/inactivo), "solo con stock bajo"
3. `ProductFormComponent`: formulario con nombre, descripción, código SKU, precio de venta, costo, stock mínimo, categoría
4. Badge de estado (Activo/Inactivo) con colores semánticos
5. Tests unitarios

**Criterio de aceptación:**
- Los productos con stock ≤ mínimo se destacan visualmente en la tabla
- El filtro "solo con stock bajo" filtra correctamente (llamada al backend con parámetro correspondiente)
- Tests: 0 fallos

---

### Fase 2.3 — Kardex (movimientos de stock)

**Objetivo:** Visualizar el historial completo de movimientos de stock por producto y permitir ajustes manuales.

**Tareas:**
1. `StockMovementService`:
   - `getByProduct(productId, page, size)` → `GET /inventory/products/{id}/movements`
   - `createMovement(data)` → `POST /inventory/stock-movements`
2. `KardexComponent`: tabla cronológica de movimientos para el producto seleccionado
   - Columnas: fecha, tipo (ENTRADA/SALIDA/AJUSTE), cantidad, stock resultante, motivo, usuario que registró
   - Tipos con badge de color: ENTRADA → verde, SALIDA → naranja, AJUSTE → azul
3. `StockAdjustmentFormComponent`: formulario para registrar ajuste manual (tipo, cantidad, motivo)
4. Acceso al Kardex desde el detalle de cada producto (botón "Ver Kardex")
5. Solo ADMIN y MANAGER pueden registrar ajustes; WAREHOUSEMAN y SALES solo visualizan

**Criterio de aceptación:**
- El Kardex muestra el historial con paginación funcional
- Al registrar un ajuste, el stock del producto se actualiza en la vista de detalle sin recargar manualmente
- Tests: 0 fallos

---

## Módulo 3 — Compras

### Contexto y justificación

El módulo de compras gestiona la relación con los proveedores y el ciclo de vida de las órdenes de compra (creación → aprobación → recepción). WAREHOUSEMAN tiene acceso de solo recepción: puede confirmar que la mercancía llegó, pero no crear ni aprobar órdenes.

### Rama de trabajo

```
feature/modulo-compras
```

### Entregables

- CRUD de proveedores
- CRUD de órdenes de compra con flujo de estados
- Recepción de mercancía (WAREHOUSEMAN)
- Integración automática con inventario al recibir
- Documentación: `propuesta_modulo_compras_frontend.txt` + `memoria_tecnica_modulo_compras_frontend.md`

---

### Fase 3.1 — Proveedores

**Objetivo:** CRUD completo de proveedores.

**Tareas:**
1. `SupplierService`:
   - `getAll(page, size)` → `GET /purchases/suppliers`
   - `getById(id)` → `GET /purchases/suppliers/{id}`
   - `create(data)` → `POST /purchases/suppliers`
   - `update(id, data)` → `PUT /purchases/suppliers/{id}`
   - `deactivate(id)` → `PATCH /purchases/suppliers/{id}/status`
2. `SupplierListComponent`: tabla con nombre, RUC/NIT, contacto, estado
3. `SupplierFormComponent`: nombre, identificador fiscal, dirección, teléfono, email, persona de contacto
4. Layout master-detail
5. Acceso solo para ADMIN y MANAGER

**Criterio de aceptación:**
- Solo ADMIN/MANAGER pueden crear/editar/desactivar proveedores
- Tests: 0 fallos

---

### Fase 3.2 — Órdenes de compra

**Objetivo:** Gestionar el ciclo de vida completo de órdenes de compra.

**Tareas:**
1. `PurchaseOrderService`:
   - `getAll(page, size, filters?)` → `GET /purchases/orders`
   - `getById(id)` → `GET /purchases/orders/{id}`
   - `create(data)` → `POST /purchases/orders`
   - `update(id, data)` → `PUT /purchases/orders/{id}`
   - `approve(id)` → `PATCH /purchases/orders/{id}/approve`
   - `cancel(id)` → `PATCH /purchases/orders/{id}/cancel`
   - `receive(id, data)` → `PATCH /purchases/orders/{id}/receive`
2. `PurchaseOrderListComponent`: tabla con número, proveedor, fecha, total, estado (badge semántico)
   - Filtros: estado, proveedor, rango de fechas
3. `PurchaseOrderDetailComponent`: vista completa de la orden con líneas de detalle
   - Tabla de ítems: producto, cantidad pedida, precio unitario, subtotal
   - Total calculado
   - Botones de acción según estado y rol:
     - PENDING → Aprobar (ADMIN/MANAGER), Cancelar (ADMIN/MANAGER)
     - APPROVED → Recibir (WAREHOUSEMAN, ADMIN, MANAGER)
4. `PurchaseOrderFormComponent`: creación de órdenes con selector de proveedor y tabla de ítems dinámica
5. Confirmación al cancelar (acción destructiva)

**Estados y transiciones:**
```
PENDING ──► APPROVED ──► RECEIVED
   │                        
   └──────► CANCELLED
```

**Criterio de aceptación:**
- El botón "Recibir" solo aparece en estado APPROVED y para roles con permiso
- Al recibir una orden, el stock de los productos involucrados se actualiza (el backend lo hace; el frontend refleja el cambio al recargar el producto)
- La cancelación requiere confirmación y solo funciona en estado PENDING o APPROVED
- Tests: 0 fallos

---

## Módulo 4 — Ventas

### Contexto y justificación

El módulo de ventas gestiona la relación con los clientes y el ciclo de vida de las órdenes de venta (creación → aprobación → entrega). WAREHOUSEMAN puede confirmar la entrega física. El rol SALES puede crear y ver sus propias órdenes pero no aprobarlas.

### Rama de trabajo

```
feature/modulo-ventas
```

### Entregables

- CRUD de clientes
- CRUD de órdenes de venta con flujo de estados
- Reservaciones de stock
- Entrega de mercancía (WAREHOUSEMAN)
- Documentación: `propuesta_modulo_ventas_frontend.txt` + `memoria_tecnica_modulo_ventas_frontend.md`

---

### Fase 4.1 — Clientes

**Objetivo:** CRUD completo de clientes.

**Tareas:**
1. `CustomerService`:
   - `getAll(page, size)` → `GET /sales/customers`
   - `getById(id)` → `GET /sales/customers/{id}`
   - `create(data)` → `POST /sales/customers`
   - `update(id, data)` → `PUT /sales/customers/{id}`
   - `deactivate(id)` → `PATCH /sales/customers/{id}/status`
2. `CustomerListComponent`: tabla con nombre, identificador fiscal, contacto, estado
3. `CustomerFormComponent`: nombre, identificador, dirección, teléfono, email

**Criterio de aceptación:**
- ADMIN, MANAGER y SALES pueden crear/editar clientes
- Tests: 0 fallos

---

### Fase 4.2 — Órdenes de venta

**Objetivo:** Gestionar el ciclo de vida completo de órdenes de venta.

**Tareas:**
1. `SaleOrderService`:
   - `getAll(page, size, filters?)` → `GET /sales/orders`
   - `getById(id)` → `GET /sales/orders/{id}`
   - `create(data)` → `POST /sales/orders`
   - `approve(id)` → `PATCH /sales/orders/{id}/approve`
   - `cancel(id)` → `PATCH /sales/orders/{id}/cancel`
   - `deliver(id)` → `PATCH /sales/orders/{id}/deliver`
2. `SaleOrderListComponent`: tabla con número, cliente, fecha, total, estado
   - Filtro de SALES: solo ve sus propias órdenes
3. `SaleOrderDetailComponent`: vista completa con ítems, totales y acciones según estado/rol
4. `SaleOrderFormComponent`: selector de cliente, tabla de ítems con validación de stock disponible

**Estados y transiciones:**
```
PENDING ──► APPROVED ──► DELIVERED
   │
   └──────► CANCELLED
```

**Criterio de aceptación:**
- Un usuario SALES solo ve sus propias órdenes (el backend filtra; el frontend no muestra datos de otros vendedores)
- La entrega solo puede marcarla WAREHOUSEMAN, ADMIN o MANAGER
- Al agregar un ítem, se verifica que el stock sea suficiente antes de permitir guardar
- Tests: 0 fallos

---

### Fase 4.3 — Reservaciones

**Objetivo:** Gestionar reservas de stock para órdenes en estado PENDING o APPROVED.

**Tareas:**
1. `ReservationService`:
   - `getByOrder(orderId)` → `GET /sales/orders/{id}/reservations`
   - `getAll(page, size)` → `GET /sales/reservations`
2. `ReservationListComponent`: tabla de reservaciones activas con producto, cantidad reservada, orden asociada, fecha de expiración
3. Badge visual para reservaciones próximas a vencer (< 24h)

**Criterio de aceptación:**
- Las reservaciones próximas a vencer se resaltan visualmente
- Tests: 0 fallos

---

## Módulo 5 — Reportes y Dashboard

### Contexto y justificación

Los reportes dan valor estratégico al sistema. ADMIN ve el dashboard ejecutivo con KPIs de alto nivel; MANAGER ve reportes de gestión; WAREHOUSEMAN y SALES acceden a reportes operativos relacionados con sus tareas. Este módulo se construye último porque todos sus datos provienen de los módulos anteriores.

### Rama de trabajo

```
feature/modulo-reportes
```

### Entregables

- Dashboard ejecutivo (ADMIN)
- Reportes de gestión de inventario y órdenes (ADMIN/MANAGER)
- Reportes operativos de recepción y entrega (WAREHOUSEMAN)
- Reportes de ventas pendientes (SALES)
- Documentación: `propuesta_modulo_reportes_frontend.txt` + `memoria_tecnica_modulo_reportes_frontend.md`

---

### Fase 5.1 — Dashboard ejecutivo (ADMIN)

**Objetivo:** Pantalla de inicio del ADMIN con KPIs en tiempo real.

**Tareas:**
1. `DashboardService`:
   - `getExecutiveSummary()` → `GET /reports/executive-summary`
2. `DashboardComponent` con tarjetas de KPI:
   - Total de productos en stock (valor monetario total)
   - Órdenes de compra por estado (PENDING, APPROVED)
   - Órdenes de venta por estado
   - Top 5 productos con más movimientos del mes
   - Alertas de stock bajo (número de productos)
3. Tarjetas con `MatCard`, valores numéricos prominentes, ícono representativo y tendencia (si el API la provee)
4. Sección de "Alertas" con lista de los productos bajo stock mínimo como acceso directo a inventario

**Criterio de aceptación:**
- Solo accesible con rol ADMIN
- Los KPIs reflejan datos reales del backend al cargar la página
- Las alertas de stock bajo tienen link directo al producto en inventario

---

### Fase 5.2 — Reportes de gestión (ADMIN/MANAGER)

**Objetivo:** Reportes tabulares de gestión con filtros y exportación.

**Tareas:**
1. `ReportService`:
   - `getInventoryReport(filters)` → `GET /reports/inventory`
   - `getPurchasesReport(filters)` → `GET /reports/purchases`
   - `getSalesReport(filters)` → `GET /reports/sales`
2. `InventoryReportComponent`: tabla de valorización de inventario por categoría
3. `PurchasesReportComponent`: tabla de compras en rango de fechas, agrupadas por proveedor
4. `SalesReportComponent`: tabla de ventas en rango de fechas, agrupadas por cliente o producto
5. Filtros de rango de fechas con `MatDatepicker`
6. Botón de exportación a CSV (si el backend lo provee como endpoint)

**Criterio de aceptación:**
- Los filtros de fecha actualizan el reporte sin recargar la página
- Los totales de cada reporte coinciden con los datos visibles en los módulos de compras y ventas

---

### Fase 5.3 — Reportes operativos

**Objetivo:** Vistas simplificadas para roles operativos (WAREHOUSEMAN y SALES).

**Tareas:**
1. Para **WAREHOUSEMAN**: reporte de recepciones pendientes y entregas programadas del día
2. Para **SALES**: reporte de sus órdenes pendientes de aprobación y próximas a vencer
3. Diseño simplificado: listas con estado de color, acceso rápido a la orden desde el reporte

**Criterio de aceptación:**
- Cada rol solo ve sus reportes correspondientes (AuthGuard por ruta)
- Los ítems del reporte son clickeables y navegan al detalle de la orden

---

## 11. Estrategia de testing

### Niveles de testing

| Nivel | Herramienta | Cobertura mínima | Ejecutar con |
|---|---|---|---|
| Unit — Componentes | Jasmine + TestBed | 70% statements por módulo | `ng test --include=src/app/modules/<módulo>/**` |
| Unit — Servicios | Jasmine + HttpClientTestingModule | 70% statements | `ng test --include=src/app/core/**` |
| Integration | Jasmine + TestBed completo | Flujos críticos | `ng test` |
| E2E | Cypress o Playwright | Golden path por módulo | `npx cypress run` |

### Política de test

- Cada servicio HTTP tiene tests con `HttpClientTestingModule` que verifican:
  - La URL correcta es llamada
  - Los parámetros de paginación se envían correctamente
  - La respuesta se transforma en el tipo TypeScript esperado
- Cada componente smart tiene tests que verifican:
  - Se llama al servicio correcto en `ngOnInit`
  - Los datos se muestran en el template
  - Las acciones (click en botón, submit de formulario) llaman al método correcto del servicio
- Los componentes dumb tienen tests de:
  - Renderizado correcto con `@Input()` dados
  - Emisión de `@Output()` al interactuar

### Evidencia de testing por módulo

Para cada módulo, la `memoria_tecnica_modulo_<nombre>_frontend.md` sección 7 debe incluir:

```
ng test --include=src/app/modules/<módulo>/**
→ X specs, 0 failures

ng test
→ X specs total, 0 failures (regresiones: 0)

ng test --code-coverage
→ Statements: X%, Branches: X%, Lines: X%
```

---

## 12. Convenciones de código y calidad

### Nombrado

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componentes | PascalCase + sufijo | `ProductListComponent` |
| Servicios | PascalCase + sufijo | `ProductService` |
| Archivos | kebab-case | `product-list.component.ts` |
| Variables/métodos | camelCase | `getProductById()` |
| Constantes | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE` |
| Interfaces/Types | PascalCase | `ProductResponse`, `PageResponse<T>` |

### Reglas generales

- **Sin comentarios innecesarios**: el código debe ser autoexplicativo por nombres claros
- **Reactive Forms siempre**: nunca Template-driven forms
- **`takeUntilDestroyed()`**: en todos los `subscribe()` para evitar memory leaks
- **Async pipe en templates**: preferido sobre `subscribe()` manual cuando sea posible
- **Sin URLs hardcodeadas**: todo usa `environment.apiUrl`
- **Un servicio por dominio de negocio**: `ProductService` no llama endpoints de compras
- **Smart vs Dumb**: los componentes de lista/detalle son smart; badges, formularios reutilizables, estados vacíos son dumb
- **TypeScript strict**: `noImplicitAny`, `strictNullChecks` siempre habilitados

### Linting y formateo

- ESLint con reglas de Angular
- Prettier para formateo consistente
- `ng lint` debe pasar sin errores antes de cada commit

---

## 13. Integración continua y despliegue

### Flujo de trabajo Git

```
feature/<nombre>  ──► develop ──► main
                    (--no-ff)   (--no-ff, solo releases)
```

**Nunca** se commitea directamente en `develop` ni en `main`.

### Pipeline CI recomendado (GitHub Actions)

```yaml
on: [push, pull_request]
jobs:
  build-and-test:
    steps:
      - npm ci
      - ng lint
      - ng test --watch=false --browsers=ChromeHeadless
      - ng build --configuration=production
```

### Despliegue

- **Desarrollo**: `ng serve` en `http://localhost:4200`
- **Producción**: `ng build --configuration=production` genera `dist/` para servir con Nginx o similar
- La URL del backend en producción se configura en `environment.prod.ts` o mediante variable de entorno del servidor

---

## 14. Cronograma estimado

El cronograma asume desarrollo individual a tiempo parcial. Ajustar según disponibilidad real.

| Módulo | Fases | Estimación |
|---|---|---|
| Módulo 0 — Infraestructura base | 0.1 → 0.4 | 3–4 días |
| Módulo 1 — Autenticación | 1.1 → 1.6 | 4–5 días |
| Módulo 2 — Inventario | 2.1 → 2.3 | 5–6 días |
| Módulo 3 — Compras | 3.1 → 3.2 | 4–5 días |
| Módulo 4 — Ventas | 4.1 → 4.3 | 4–5 días |
| Módulo 5 — Reportes | 5.1 → 5.3 | 3–4 días |
| **Total estimado** | | **23–29 días hábiles** |

### Hitos principales

| Hito | Condición de completitud |
|---|---|
| **H0 — Base funcional** | App Angular arranca, tema visual aplicado, layout visible |
| **H1 — Login operativo** | Login real con JWT, guard de rutas funcionando |
| **H2 — Inventario completo** | CRUD de categorías, productos y Kardex con tests |
| **H3 — Compras completo** | CRUD de proveedores y ciclo de órdenes de compra |
| **H4 — Ventas completo** | CRUD de clientes, ciclo de ventas y reservaciones |
| **H5 — MVP completo** | Dashboard + reportes; todos los módulos con 70%+ cobertura |

---

## 15. Criterios de aceptación globales

Para que el frontend se considere completo (MVP entregable):

| Criterio | Descripción |
|---|---|
| **Funcionalidad** | Todos los CRUD de los 5 módulos de negocio funcionan contra el backend real |
| **RBAC** | Cada rol solo accede a las pantallas y acciones permitidas en la matriz de RBAC |
| **Autenticación** | Login/logout/expiración de sesión funcionan correctamente |
| **UX** | Snackbars de éxito/error, confirmaciones de acciones destructivas, estados de carga |
| **Responsive** | Layout funcional en viewport ≥ 1280px (escritorio) |
| **Accesibilidad** | Contraste WCAG AA en todos los textos visibles; íconos interactivos con `aria-label` |
| **Cobertura de tests** | ≥ 70% statements por módulo; 0 fallos en `ng test` |
| **Build limpio** | `ng build --configuration=production` sin errores ni warnings críticos |
| **Documentación** | Cada módulo tiene `propuesta_*.txt` + `memoria_tecnica_*.md` completa (10 secciones) |

---

## 16. Riesgos y mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Cambio de contrato API del backend (campos renombrados, endpoints nuevos) | Media | Alto | Leer el Swagger antes de implementar cada módulo; usar interfaces TypeScript estrictas para detectar cambios en compilación |
| JWT expira (2h) durante sesión activa | Alta | Medio | El `ErrorInterceptor` intercepta 401 y redirige a login con mensaje claro; considerar implementar refresh token en una fase posterior |
| Versión de Angular Material incompatible con Angular | Baja | Alto | Usar `ng add @angular/material` que instala la versión compatible automáticamente |
| Stock negativo al crear orden de venta | Media | Alto | Validar disponibilidad de stock en `SaleOrderFormComponent` antes de enviar; el backend es la última línea de defensa |
| Performance en tablas con muchos registros | Media | Medio | Usar paginación server-side desde el primer componente de lista; nunca cargar todos los registros en memoria |
| CORS bloqueando peticiones al backend en desarrollo | Alta | Medio | Configurar `proxy.conf.json` en Angular CLI para redirigir `/api` al backend en desarrollo |

---

*Documento generado el 2026-06-04. Actualizar al finalizar cada módulo con las decisiones tomadas y cualquier desviación del plan original.*
