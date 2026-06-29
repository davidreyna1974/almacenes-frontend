# Propuesta de Plan de Trabajo — Frontend Almacenes (v2)

**Versión:** 2.0  
**Fecha:** 2026-06-04  
**Repositorio frontend:** `github.com/davidreyna1974/almacenes-frontend`  
**Repositorio backend:** `github.com/davidreyna1974/almacenes-backend`  
**Referencias base:**
- `memoria_tecnica_global_proyecto.md` — backend/almacenes/
- `propuesta_modulo_sales.txt` (v4) — backend/almacenes/

> **Nota sobre la v2:** Esta versión incorpora los contratos de integración reales
> del backend ya implementado (365 tests — 0 fallos), la matriz RBAC definitiva,
> los endpoints exactos de cada módulo, las lecciones aprendidas del desarrollo
> del backend, y el detalle completo del módulo Sales con su lógica de
> reservas y stock disponible.

---

## Índice

1. [Visión del sistema](#1-visión-del-sistema)
2. [Estado del backend — punto de partida](#2-estado-del-backend--punto-de-partida)
3. [Stack tecnológico y justificación](#3-stack-tecnológico-y-justificación)
4. [Arquitectura de la solución](#4-arquitectura-de-la-solución)
5. [Contratos de integración frontend ↔ backend](#5-contratos-de-integración-frontend--backend)
6. [RBAC transversal — matriz definitiva](#6-rbac-transversal--matriz-definitiva)
7. [Guía de configuración del entorno local](#7-guía-de-configuración-del-entorno-local)
8. [Plan de módulos y fases](#8-plan-de-módulos-y-fases)
9. [Módulo 0 — Infraestructura base](#módulo-0--infraestructura-base)
10. [Módulo 1 — Autenticación y gestión de usuarios](#módulo-1--autenticación-y-gestión-de-usuarios)
11. [Módulo 2 — Inventario](#módulo-2--inventario)
12. [Módulo 3 — Compras](#módulo-3--compras)
13. [Módulo 4 — Ventas](#módulo-4--ventas)
14. [Módulo 5 — Reportes y Dashboard](#módulo-5--reportes-y-dashboard)
15. [Estrategia de testing](#15-estrategia-de-testing)
16. [Convenciones de código y calidad](#16-convenciones-de-código-y-calidad)
17. [Lecciones aprendidas del backend aplicadas al frontend](#17-lecciones-aprendidas-del-backend-aplicadas-al-frontend)
18. [Cronograma estimado](#18-cronograma-estimado)
19. [Criterios de aceptación globales](#19-criterios-de-aceptación-globales)
20. [Riesgos y mitigación](#20-riesgos-y-mitigación)
21. [Roadmap de módulos futuros](#21-roadmap-de-módulos-futuros)

---

## 1. Visión del sistema

### ¿Qué es Almacenes?

Sistema de gestión de almacenes (WMS) que permite a una empresa administrar
inventario, compras, ventas y reportes financieros y operativos. Reemplaza
hojas de cálculo y procesos manuales con una base de datos centralizada,
auditoría completa (quién hizo qué y cuándo), estado de órdenes en tiempo
real y análisis financiero (margen bruto, COGS, ABC).

### Audiencias y frecuencia de uso

| Audiencia | Rol | Frecuencia | Función principal |
|---|---|---|---|
| Dueño / dirección general | ADMIN | Semanal | Reportes ejecutivos, visión global, gestión de usuarios |
| Gerencia operativa | MANAGER | Diario | Catálogos, órdenes, reportes tácticos |
| Personal de almacén | WAREHOUSEMAN | Varias veces al día | Recepciones, entregas, Kardex |
| Personal de ventas | SALES | Diario | Órdenes de venta, seguimiento a clientes |

### Por qué una SPA Angular independiente

El backend ya está terminado y expone 62 endpoints REST documentados en Swagger.
El frontend es una Single Page Application Angular que consume esa API.
La separación de repositorios permite:

- Ciclos de despliegue distintos (el frontend puede actualizarse sin tocar el backend)
- Trabajo independiente sin necesidad de conocer Java
- Frontend servido desde CDN; backend en servidor de aplicaciones
- Tecnologías incompatibles en el mismo proceso (JVM vs. Node.js)

---

## 2. Estado del backend — punto de partida

El backend está **completamente implementado**. El frontend no necesita esperar
ni coordinar su desarrollo con cambios del backend. Los contratos de la API
son estables.

| Módulo | Endpoints | Tests | Estado |
|---|---|---|---|
| `auth` (RBAC 4 roles) | 9 | 45 B* + 20 A + 12 B + 17 C | ✓ Completo |
| `inventory` | incluidos en 62 | 29 A + 16 B + 4 D | ✓ Completo |
| `purchases` | incluidos en 62 | 43 A + 25 B | ✓ Completo |
| `sales` | 24 | 47 A + 25 B + 3 C + 5 D | ✓ Completo |
| `reports` | 12 | 40 A + 14 B + 7 D | ✓ Completo |
| Swagger / OpenAPI | — | — | ✓ 62 paths documentados |
| Paginación | 9 endpoints | — | ✓ Todos los GET de colección |

**Suite total backend:** 365 tests — 0 fallos — BUILD SUCCESS  
**Cobertura backend:** 84.6% líneas · 87.5% métodos · 61.6% ramas

La referencia autoritativa del contrato de la API es siempre:
`http://localhost:8080/swagger-ui/index.html`

---

## 3. Stack tecnológico y justificación

| Tecnología | Elección | Justificación |
|---|---|---|
| Framework | **Angular (última versión estable)** | Estructura de módulos, DI, CLI potente. Ideal para SPAs empresariales complejas con múltiples roles |
| Lenguaje | **TypeScript strict** | El tipado estático detecta en compilación los cambios del contrato de API. Esencial cuando el backend ya está fijo |
| UI Library | **Angular Material** | Componentes accesibles (WCAG), theming con paleta personalizada, integración nativa con Angular |
| Estilos | **SCSS + Angular Material theming** | Variables de color centralizadas; el theming de Material requiere SCSS |
| HTTP | **Angular HttpClient + Interceptores** | JwtInterceptor centraliza autenticación; ErrorInterceptor centraliza el manejo de todos los errores HTTP |
| Estado | **RxJS + Services con BehaviorSubject** | Sin NgRx: apropiado para escala media. Menor boilerplate, menor curva de aprendizaje |
| Formularios | **Reactive Forms** | Validación centralizada, testeables sin DOM, integración natural con RxJS |
| Tests unitarios | **Jasmine + Karma** | Integración nativa con Angular CLI; sin configuración adicional |
| Tests E2E | **Cypress o Playwright** | Flujos end-to-end reales contra backend activo |
| Build | **Angular CLI** | Optimizaciones de producción (tree-shaking, lazy loading) ya configuradas |

---

## 4. Arquitectura de la solución

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
│                    Servicios HTTP         │                  │
│           (HttpClient + JwtInterceptor    │                  │
│            + ErrorInterceptor)           │                  │
└───────────────────────────────┬──────────────────────────────┘
                                │ HTTP/REST + JWT Bearer
                                │ (proxy en dev → localhost:8080)
                                ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND — almacenes-backend                    │
│         Spring Boot 3.5 · Java 17 · PostgreSQL              │
│         Base URL: http://localhost:8080/api/v1              │
│         Swagger: http://localhost:8080/swagger-ui/index.html│
│         62 endpoints documentados — 365 tests — 0 fallos    │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de autenticación (basado en el contrato real del backend)

```
Usuario ingresa credenciales
        │
        ▼
POST /api/v1/auth/login
Body: { "username": "admin", "password": "Admin123!" }
        │
        ▼
Respuesta del backend:
{ "token": "eyJ...", "type": "Bearer", "username": "admin", "role": "ROLE_ADMIN" }
        │
        ▼
AuthService.login() → almacena token en localStorage
        │
        ▼
jwt-decode → extrae rol → BehaviorSubject<UserInfo>
        │
        ▼
Sidebar filtra ítems por rol ← AuthGuard protege rutas por rol
        │
        ▼
JwtInterceptor → Authorization: Bearer <token> en cada petición

────────────────────────────────────────
⚠️ TOKEN EXPIRADO (2 horas):
────────────────────────────────────────
El backend devuelve 403 Forbidden (no 401).
El ErrorInterceptor intercepta 403 → llama AuthService.logout()
→ redirige a /login con mensaje "Tu sesión ha expirado."
```

### Estructura de directorios Angular

```
src/
├── app/
│   ├── core/
│   │   ├── auth/
│   │   │   ├── auth.service.ts           (login, logout, token, rol)
│   │   │   ├── auth.guard.ts             (canActivate por rol)
│   │   │   ├── jwt.interceptor.ts        (agrega Authorization header)
│   │   │   └── error.interceptor.ts      (manejo global de errores HTTP)
│   │   ├── layout/
│   │   │   ├── sidebar/                  (colapsable, filtrado por rol)
│   │   │   ├── topbar/                   (chip de usuario+rol, hamburguesa)
│   │   │   └── main-layout/              (shell con router-outlet)
│   │   └── shared/
│   │       ├── models/
│   │       │   ├── page-response.model.ts
│   │       │   └── api-error.model.ts
│   │       ├── components/
│   │       │   ├── master-detail/
│   │       │   ├── confirm-dialog/
│   │       │   └── empty-state/
│   │       └── pipes/
│   │           └── status-label.pipe.ts
│   └── modules/
│       ├── auth/        (login, perfil, cambio de contraseña, usuarios)
│       ├── inventory/   (categorías, productos, movimientos/Kardex)
│       ├── purchases/   (proveedores, órdenes de compra)
│       ├── sales/       (clientes, órdenes de venta, reservaciones)
│       └── reports/     (dashboard ejecutivo, analíticos, operativos)
├── environments/
│   ├── environment.ts          (apiUrl: 'http://localhost:8080/api/v1')
│   └── environment.prod.ts
├── proxy.conf.json             (redirige /api → backend en desarrollo)
└── styles/
    ├── theme.scss
    ├── variables.scss
    └── global.scss
```

---

## 5. Contratos de integración frontend ↔ backend

Esta sección define los contratos exactos que el frontend debe respetar.
Están extraídos de la `memoria_tecnica_global_proyecto.md` del backend.

### 5.1 Autenticación JWT

```
POST /api/v1/auth/login
Body:     { "username": "...", "password": "..." }
Response: { "token": "eyJ...", "type": "Bearer",
            "username": "...", "role": "ROLE_ADMIN" }
```

El token se almacena en `localStorage`. Expira en **2 horas**.

**Rutas públicas (sin JWT requerido):**
```
POST /api/v1/auth/login
GET  /swagger-ui/**
GET  /swagger-ui.html
GET  /v3/api-docs
GET  /v3/api-docs/**
```
Todo lo demás requiere `Authorization: Bearer <token>`.

### 5.2 Comportamiento de errores HTTP

El backend pasa todos los errores por `GlobalExceptionHandler`. El
`ErrorInterceptor` del frontend debe manejar estos formatos:

```json
// 400 — Error de validación
{
  "timestamp": "2026-06-04T12:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "El SKU es obligatorio"
}

// 500 — Error de negocio (RuntimeException)
{
  "timestamp": "2026-06-04T12:00:00",
  "status": 500,
  "error": "Internal Server Error",
  "message": "El SKU 'TOOL-001' ya está registrado"
}

// 403 — Sin autorización o token expirado
// Spring Security devuelve 403 SIN body JSON.
// El interceptor maneja este caso sin intentar parsear el body.

// 409 — Conflicto de concurrencia (Optimistic Locking en Sales)
// Ocurre cuando dos usuarios aprueban la misma orden simultáneamente.
// Mostrar: "Stock modificado concurrentemente. Intenta nuevamente."
```

**Lógica del `ErrorInterceptor`:**

| HTTP Status | Causa probable | Acción en el frontend |
|---|---|---|
| 400 | Validación fallida | Snackbar con `error.message` del body |
| 403 | Token expirado o sin permiso | Si el usuario estaba autenticado → logout + redirigir a login con mensaje "Sesión expirada". Si no → mensaje de acceso denegado |
| 409 | Conflicto de concurrencia | Snackbar "Stock modificado concurrentemente. Intenta nuevamente." |
| 500 | Error de negocio del backend | Snackbar con `error.message` del body si existe; si no, mensaje genérico |

### 5.3 Formato de paginación

**Todos** los endpoints GET de colección retornan este contrato.
Nunca asumir que un endpoint retorna un array plano `[...]`.

```typescript
// Modelo TypeScript exacto (shared/models/page-response.model.ts)
interface PageResponse<T> {
  content:       T[];
  currentPage:   number;
  totalPages:    number;
  totalElements: number;
  size:          number;
  first:         boolean;
  last:          boolean;
}
```

Parámetros de request: `?page=0&size=20` (defaults del backend).  
El `mat-paginator` de Angular Material se conecta directamente a estos campos.

### 5.4 CORS en desarrollo

El backend tiene CORS configurado en `SecurityConfig` con
`allowedOriginPatterns("*")` para desarrollo. En producción se reemplaza
por el dominio del frontend.

**Configuración del proxy Angular para desarrollo** (`proxy.conf.json`):
```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  }
}
```

Registrar en `angular.json` bajo `serve.options.proxyConfig`.
Esto evita problemas de CORS en el browser durante el desarrollo local.

### 5.5 Magnitudes de stock en productos (módulo Sales)

El backend expone tres magnitudes en `ProductResponseDTO`. El frontend
debe mostrar y utilizar correctamente las tres:

| Campo | Significado | Uso en el frontend |
|---|---|---|
| `currentStock` | Stock físico real | Mostrar en ficha del producto |
| `reservedStock` | Comprometido con órdenes APPROVED no entregadas | Mostrar en ficha del producto |
| `availableStock` | `currentStock - reservedStock` | **Usar este valor** para validar si hay stock suficiente al crear una orden de venta |

Al agregar un ítem a una orden de venta, el frontend valida:
`detail.quantity <= product.availableStock` antes de permitir guardar.

---

## 6. RBAC transversal — matriz definitiva

Extraída de `memoria_tecnica_global_proyecto.md`. Esta es la matriz
autoritativa que el `AuthGuard` y la visibilidad de botones/acciones
en el frontend deben implementar exactamente.

| Módulo / Operación | ADMIN | MANAGER | WAREHOUSEMAN | SALES |
|---|:---:|:---:|:---:|:---:|
| **Auth — Gestión de usuarios** | ✓ | — | — | — |
| **Inventory — escritura** (categorías, crear/editar productos) | ✓ | ✓ | — | — |
| **Inventory — lectura** | ✓ | ✓ | ✓ | ✓ |
| **Inventory — registrar movimiento de stock** (ajuste manual) | ✓ | ✓ | ✓ | — |
| **Inventory — desactivar producto** | ✓ | — | — | — |
| **Purchases — CRUD** proveedores y órdenes | ✓ | ✓ | — | — |
| **Purchases — recibir** orden aprobada | ✓ | ✓ | ✓ | — |
| **Sales — crear y gestionar** órdenes y clientes | ✓ | ✓ | — | ✓ |
| **Sales — aprobar** orden de venta | ✓ | ✓ | — | — |
| **Sales — entregar** orden aprobada | ✓ | ✓ | ✓ | — |
| **Sales — desactivar** cliente | ✓ | ✓ | — | — |
| **Reports — dashboard ejecutivo** | ✓ | — | — | — |
| **Reports — analíticos** (ABC, top products, márgenes) | ✓ | ✓ | — | — |
| **Reports — operativos** (low-stock, Kardex, movimientos) | ✓ | ✓ | ✓ | — |
| **Reports — operaciones pendientes** | ✓ | ✓ | ✓ | ✓ |

**Cómo fluyen los roles del backend al frontend:**

```
1. Backend almacena roles en tabla user_roles (BD)
2. Al login, JwtUtils incluye roles en el claim "roles" del JWT
3. Frontend: jwt-decode extrae el rol del token en AuthService
4. Frontend: AuthGuard verifica rol vs data.roles de la ruta
5. Frontend: Sidebar filtra ítems según rol del usuario activo
6. Frontend: botones de acción (aprobar, cancelar, entregar) se muestran
             solo si el rol tiene permiso — doble verificación en backend
```

**Nota crítica:** RBAC se verifica en **dos puntos**:
- Backend: `SecurityConfig` evalúa `hasRole()` / `hasAnyRole()` por URL
- Frontend: `AuthGuard` + visibilidad condicional de botones

El frontend es la primera capa de defensa (UX). El backend es la última
línea de defensa (seguridad real). Nunca asumir que si el botón no se ve,
el backend no verifica.

### Chip de rol en el Top Bar

| Rol | Color del chip |
|---|---|
| ADMIN | `#6B3C6B` (brand) |
| MANAGER | `#1565C0` (info) |
| WAREHOUSEMAN | `#2E7D32` (success) |
| SALES | `#E65100` (warning) |

---

## 7. Guía de configuración del entorno local

### Requisitos previos

```
Java 17+          java -version
Node.js 18+       node -v
npm               npm -v
Angular CLI       npm install -g @angular/cli
PostgreSQL 14+    corriendo en localhost:5432
```

### Paso 1 — Instalar el hook de protección Git

```bash
cd .../frontend/almacenes
cp hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### Paso 2 — Levantar el backend

```bash
cd .../backend/almacenes
export DB_PASSWORD=tu_contraseña_postgres
export JWT_SECRET=$(openssl rand -hex 32)
./mvnw clean package -DskipTests
java -jar target/almacenes-0.0.1-SNAPSHOT.jar
# Disponible en http://localhost:8080
# Swagger: http://localhost:8080/swagger-ui/index.html
```

### Paso 3 — Crear y levantar el frontend

```bash
cd .../frontend/almacenes
ng new almacenes --style=scss --routing=true --strict
ng add @angular/material
npm install
ng serve
# Disponible en http://localhost:4200
```

### Credenciales por defecto (solo desarrollo)

El backend crea automáticamente el primer usuario admin al arrancar
si la tabla `users` está vacía (`DataInitializer`):

| Usuario | Contraseña | Roles |
|---|---|---|
| `admin` | `Admin123!` | ADMIN + WAREHOUSEMAN |

Usuarios adicionales se crean desde la interfaz de gestión de usuarios
(ruta `/admin/users`, solo ADMIN).

**En producción:** cambiar la contraseña del admin en el primer inicio.

### Verificación de la integración

1. Abrir `http://localhost:4200`
2. Hacer login con `admin` / `Admin123!`
3. Verificar que el sidebar muestra todos los módulos
4. En el Inspector de Red del browser, verificar que cada petición incluye
   el header `Authorization: Bearer eyJ...`

---

## 8. Plan de módulos y fases

El desarrollo se organiza en **6 módulos** secuenciales. El orden respeta
las dependencias: Sales necesita Inventory, Reports necesita todo lo anterior.

```
MÓDULO 0  ──►  Infraestructura base (proyecto + tema + layout + shared)
    │
    ▼
MÓDULO 1  ──►  Autenticación y gestión de usuarios
    │
    ▼
MÓDULO 2  ──►  Inventario (categorías + productos + Kardex)
    │
    ▼
MÓDULO 3  ──►  Compras (proveedores + órdenes de compra)
    │
    ▼
MÓDULO 4  ──►  Ventas (clientes + órdenes de venta + reservaciones)
    │
    ▼
MÓDULO 5  ──►  Reportes y Dashboard
```

**Regla de Git por módulo:**
```bash
git checkout develop
git checkout -b feature/<modulo>
# trabajar y commitear por fases
git checkout develop
git merge --no-ff feature/<modulo>
git push origin develop
```

**Documentación obligatoria antes de codificar cada módulo:**
- `propuesta_modulo_<nombre>_frontend.txt` — planificación previa
- `memoria_tecnica_modulo_<nombre>_frontend.md` — documento vivo (10 secciones)

---

## Módulo 0 — Infraestructura base

### Contexto y justificación

Toda la aplicación depende de tener el proyecto Angular correctamente
inicializado con el tema visual de marca, el layout shell y los componentes
reutilizables. Invertir tiempo aquí elimina deuda técnica en todos los
módulos siguientes. La lección L1 del backend ("implementar Swagger y
paginación desde el primer módulo") aplica al frontend: el `PageResponse<T>`
y el proxy CORS se configuran aquí, antes del primer servicio HTTP.

### Rama: `feature/infra-base`

### Entregables

- Proyecto Angular creado con SCSS, routing y strict mode
- Angular Material con tema personalizado `#6B3C6B / #CE6EEB / #F2E4F2`
- Layout completo: sidebar colapsable + top bar + shell con `<router-outlet>`
- `proxy.conf.json` apuntando a `http://localhost:8080`
- Variables SCSS globales y estilos base
- Environments configurados
- Componentes shared: `MasterDetailComponent`, `ConfirmDialogComponent`, `EmptyStateComponent`
- Modelos TypeScript: `PageResponse<T>`, `ApiError`
- Pipe `StatusLabelPipe`

---

### Fase 0.1 — Creación del proyecto Angular

**Objetivo:** Proyecto Angular base funcional y ejecutándose localmente.

**Tareas:**
1. `npm install -g @angular/cli`
2. `ng new almacenes --style=scss --routing=true --strict`
3. `ng add @angular/material` (seleccionar tema custom)
4. Crear `proxy.conf.json`:
   ```json
   { "/api": { "target": "http://localhost:8080", "secure": false, "changeOrigin": true } }
   ```
5. Registrar el proxy en `angular.json` bajo `serve.options.proxyConfig`
6. Crear estructura de directorios `core/`, `modules/`, `styles/`
7. `environment.ts` → `apiUrl: 'http://localhost:8080/api/v1'`

**Criterio de aceptación:**
- `ng serve` sin errores en `http://localhost:4200`
- `ng build` produce bundle limpio
- `ng test` ejecuta los tests generados por CLI sin fallos

---

### Fase 0.2 — Tema visual Angular Material

**Objetivo:** Paleta corporativa aplicada al tema de Angular Material.

**Tareas:**
1. Crear `src/styles/theme.scss` con la paleta definida:
   - Primary: `#6B3C6B` (púrpura oscuro — sidebar, headers, botones)
   - Accent: `#CE6EEB` (púrpura vibrante — badges, hover states, ítem activo)
   - Surface: `#F2E4F2` (lavanda claro — fondos de cards, inputs)
2. Crear `src/styles/variables.scss` con todas las variables CSS:
   colores semánticos (success, warning, info, error), espaciados, tipografía
3. Crear `src/styles/global.scss` con reset mínimo
4. Importar `theme.scss` como primer estilo en `angular.json`

**Criterio de aceptación:**
- Botones `mat-raised-button color="primary"` muestran `#6B3C6B`
- Botones `color="accent"` muestran `#CE6EEB`
- El tema pasa sin errores de compilación SCSS

---

### Fase 0.3 — Layout principal (Sidebar + Top Bar + Main Layout)

**Objetivo:** Shell visual completo de la aplicación.

**Sidebar** (`core/layout/sidebar/`):
- Ancho: 240px expandido / 64px colapsado, transición 200ms ease-in-out
- Fondo `#6B3C6B`, texto e íconos blancos
- Ítem activo: fondo `rgba(206,110,235,0.25)` + borde izquierdo 3px `#CE6EEB`
- Hover: fondo `rgba(255,255,255,0.08)`
- Botón chevron al fondo para colapsar/expandir
- Ítems de navegación filtrados por rol (conectado a `AuthService`)
- Estructura de ítems:

| Ícono | Texto | Roles que lo ven |
|---|---|---|
| `inventory_2` | Inventario | Todos |
| `shopping_cart` | Compras | ADMIN, MANAGER, WAREHOUSEMAN |
| `point_of_sale` | Ventas | ADMIN, MANAGER, SALES |
| `bar_chart` | Reportes | Todos |
| `manage_accounts` | Usuarios | Solo ADMIN |

**Top Bar** (`core/layout/topbar/`):
- Fondo `#FFFFFF`, sombra `0 1px 4px rgba(107,60,107,0.15)`
- Logo "Almacenes" a la izquierda + botón hamburguesa
- Zona derecha: ícono de notificaciones + chip de usuario con rol (colores por rol)

**Main Layout** (`core/layout/main-layout/`):
- `mat-sidenav-container` + sidebar como `mat-sidenav`
- Área de contenido con `<router-outlet>`

**Criterio de aceptación:**
- Sidebar colapsa/expande con animación fluida
- En estado colapsado solo muestra íconos, en expandido muestra ícono + texto
- El chip de rol en el top bar muestra el color correcto

---

### Fase 0.4 — Componentes shared y modelos base

**Objetivo:** Componentes reutilizables y modelos TypeScript disponibles antes
de los módulos de negocio.

**Tareas:**
1. `PageResponse<T>` en `shared/models/page-response.model.ts`:
   ```typescript
   export interface PageResponse<T> {
     content:       T[];
     currentPage:   number;
     totalPages:    number;
     totalElements: number;
     size:          number;
     first:         boolean;
     last:          boolean;
   }
   ```
2. `ApiError` en `shared/models/api-error.model.ts`:
   ```typescript
   export interface ApiError {
     timestamp: string;
     status:    number;
     error:     string;
     message:   string;
   }
   ```
3. `MasterDetailComponent`: layout 40%/60%, `@Output() itemSelected`
4. `ConfirmDialogComponent`: `MatDialog` con título, mensaje, Cancelar/Confirmar
5. `EmptyStateComponent`: dos variantes con `@Input() variant: 'empty' | 'no-results'`
6. `StatusLabelPipe`: `PENDING → 'Pendiente'`, `APPROVED → 'Aprobado'`,
   `RECEIVED → 'Recibido'`, `DELIVERED → 'Entregado'`, `CANCELLED → 'Cancelado'`

**Criterio de aceptación:**
- Tests unitarios de cada componente: 0 fallos
- `ng test` suite completa: 0 fallos

---

## Módulo 1 — Autenticación y gestión de usuarios

### Contexto y justificación

Sin autenticación no existe ninguna función de negocio. Este módulo establece
el contrato de seguridad: JWT, interceptores, guards de ruta, login y CRUD
de usuarios (solo ADMIN). La diferencia crítica respecto a una implementación
genérica: **el backend devuelve 403 (no 401) cuando el token expira**,
lo que requiere lógica especial en el `ErrorInterceptor`.

### Rama: `feature/modulo-auth`

### Endpoints del backend

```
POST   /api/v1/auth/login              → login
GET    /api/v1/users                   → listar usuarios (ADMIN)
GET    /api/v1/users/{id}              → ver usuario (ADMIN)
POST   /api/v1/users                   → crear usuario (ADMIN)
PUT    /api/v1/users/{id}              → actualizar usuario (ADMIN)
DELETE /api/v1/users/{id}              → desactivar usuario (ADMIN)
GET    /api/v1/users/me                → perfil propio (todos)
PUT    /api/v1/users/me                → actualizar perfil propio (todos)
PATCH  /api/v1/users/me/password       → cambiar contraseña (todos)
```

---

### Fase 1.1 — AuthService y JWT

**Objetivo:** Lógica de autenticación encapsulada y testeada.

**Tareas:**
1. Instalar `jwt-decode`: `npm install jwt-decode`
2. Crear `AuthService` con:
   - `login(username, password): Observable<void>` → `POST /auth/login`, almacena token
   - `logout(): void` → limpia `localStorage`, redirige a `/login`
   - `getToken(): string | null`
   - `getRol(): string | null` → decodifica el JWT para extraer el rol
   - `isAuthenticated(): boolean` → verifica existencia y no-expiración del token
   - `currentUser$: BehaviorSubject<UserInfo | null>`
3. Tests unitarios del `AuthService` (mock de `HttpClient`)

**Criterio de aceptación:**
- Login exitoso almacena el token y expone el rol en `currentUser$`
- `isAuthenticated()` retorna `false` si el token ha expirado
- Tests: 0 fallos

---

### Fase 1.2 — Interceptores HTTP

**Objetivo:** Automatizar JWT y manejo centralizado de errores.

**`JwtInterceptor`:**
- Clona la petición y agrega `Authorization: Bearer <token>`
- No agrega el header para `POST /auth/login`

**`ErrorInterceptor`:**

```typescript
// Lógica exacta del interceptor basada en el comportamiento del backend
intercept(req, next) {
  return next.handle(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 403) {
        // Puede ser token expirado o acceso denegado
        if (this.authService.isAuthenticated()) {
          // Tenía sesión → el token expiró
          this.authService.logout();
          this.snackBar.open('Tu sesión ha expirado. Vuelve a iniciar sesión.', ...);
        } else {
          this.snackBar.open('No tienes permisos para realizar esta acción.', ...);
        }
      } else if (error.status === 409) {
        this.snackBar.open('Stock modificado concurrentemente. Intenta nuevamente.', ...);
      } else if (error.status === 400 || error.status === 500) {
        const msg = error.error?.message || 'Error del servidor. Intenta más tarde.';
        this.snackBar.open(msg, ...);
      }
      return throwError(() => error);
    })
  );
}
```

**Criterio de aceptación:**
- Todas las peticiones incluyen el header JWT en el Inspector de Red
- Un 403 con sesión activa redirige a login con el mensaje correcto
- Tests de ambos interceptores: 0 fallos

---

### Fase 1.3 — AuthGuard y rutas

**Objetivo:** Proteger rutas por autenticación y por rol.

**Tareas:**
1. `AuthGuard` que implementa `canActivate`:
   - Verifica `isAuthenticated()`; si no → redirige a `/login`
   - Verifica rol en `data.roles`; si no → redirige al home con mensaje
2. Configurar `AppRoutingModule`:
   ```typescript
   { path: 'inventory', ...,
     canActivate: [AuthGuard],
     data: { roles: ['ROLE_ADMIN','ROLE_MANAGER','ROLE_WAREHOUSEMAN','ROLE_SALES'] }
   },
   { path: 'admin/users', ...,
     canActivate: [AuthGuard],
     data: { roles: ['ROLE_ADMIN'] }
   }
   // etc.
   ```
3. Lazy loading para cada módulo de negocio

**Criterio de aceptación:**
- Acceder a `/inventory` sin token redirige a `/login`
- SALES navegando a `/admin/users` recibe mensaje de acceso denegado
- Tests del guard: 0 fallos

---

### Fase 1.4 — Pantalla de Login

**Objetivo:** Interfaz de login conectada al backend.

**Tareas:**
1. Reactive Form con `username` y `password` requeridos
2. `MatProgressBar` indeterminado mientras espera respuesta
3. Login exitoso → redirigir a home según rol
4. Login fallido (403 del backend) → snackbar "Credenciales incorrectas."
5. Diseño visual: logo "Almacenes", fondo `#F2E4F2`, card centrada

**Criterio de aceptación:**
- No permite enviar si algún campo está vacío
- Login con `admin`/`Admin123!` redirige al dashboard
- Tests del componente: 0 fallos

---

### Fase 1.5 — Perfil de usuario y cambio de contraseña

**Objetivo:** Cualquier usuario autenticado puede ver y actualizar su perfil.

**Tareas:**
1. `UserProfileService`:
   - `getProfile()` → `GET /users/me`
   - `updateProfile(data)` → `PUT /users/me`
   - `changePassword(data)` → `PATCH /users/me/password`
2. `ProfileComponent`: formulario editable con nombre y datos de contacto
3. `ChangePasswordComponent`: contraseña actual + nueva + confirmación;
   validación de coincidencia antes de enviar

**Criterio de aceptación:**
- El usuario puede actualizar su nombre y ver el cambio sin recargar la página
- Contraseña incorrecta muestra el mensaje de error del backend (en el body 500)

---

### Fase 1.6 — Gestión de usuarios (solo ADMIN)

**Objetivo:** CRUD completo de usuarios desde la interfaz del ADMIN.

**Tareas:**
1. `UserManagementService`:
   - `getAll(page, size): Observable<PageResponse<UserResponse>>` → `GET /users`
   - `getById(id)` → `GET /users/{id}`
   - `create(data)` → `POST /users`
   - `update(id, data)` → `PUT /users/{id}`
   - `deactivate(id)` → `DELETE /users/{id}`
2. `UserListComponent`: tabla con paginación, búsqueda, columna de rol con badge
3. `UserFormComponent`: nombre, username, email, rol, estado (activo/inactivo)
4. Layout master-detail con `MasterDetailComponent`
5. `ConfirmDialogComponent` al desactivar

**Criterio de aceptación:**
- Ruta `/admin/users` solo accesible con ROLE_ADMIN (guard + sidebar)
- CRUD funcional contra el backend: crear, ver en lista, editar, desactivar
- Tests: 0 fallos

---

## Módulo 2 — Inventario

### Contexto y justificación

El inventario es el núcleo del sistema. Sin productos y categorías no existen
órdenes. Este módulo expone tres sub-dominios: categorías (taxonomía),
productos (catálogo con control de stock) y Kardex (historial de movimientos).

**Diferencia importante respecto a una implementación genérica:**  
Desde el módulo Sales en adelante, el frontend debe usar `availableStock`
(no `currentStock`) para mostrar la disponibilidad real al usuario.
El `ProductResponseDTO` expone ambos valores.

### Rama: `feature/modulo-inventario`

### Endpoints del backend

```
// Categorías
GET    /api/v1/inventory/categories          → listar (paginado)
GET    /api/v1/inventory/categories/{id}
POST   /api/v1/inventory/categories
PUT    /api/v1/inventory/categories/{id}
DELETE /api/v1/inventory/categories/{id}

// Productos
GET    /api/v1/inventory/products            → listar (paginado)
GET    /api/v1/inventory/products/{id}       → incluye currentStock, reservedStock,
                                               availableStock, unitCost
GET    /api/v1/inventory/products/low-stock  → productos con availableStock <= minimumStock
POST   /api/v1/inventory/products
PUT    /api/v1/inventory/products/{id}       → puede actualizar unitCost
DELETE /api/v1/inventory/products/{id}       → solo ADMIN

// Movimientos de stock (Kardex)
GET    /api/v1/inventory/products/{id}/movements  → historial del producto
POST   /api/v1/inventory/stock-movements          → ajuste manual
```

---

### Fase 2.1 — Categorías

**Objetivo:** CRUD completo de categorías.

**Tareas:**
1. `CategoryService` con `getAll`, `getById`, `create`, `update`, `delete`
2. `CategoryListComponent`: tabla con búsqueda y paginación (`PageResponse<T>`)
3. `CategoryFormComponent`: nombre y descripción
4. Layout master-detail
5. Al eliminar: si el backend devuelve 500 con mensaje de productos asociados,
   mostrar ese mensaje (no un error genérico)

**RBAC:** Solo ADMIN/MANAGER ven botones de crear/editar/eliminar.
WAREHOUSEMAN y SALES ven la lista en modo lectura.

**Criterio de aceptación:** Tests: 0 fallos

---

### Fase 2.2 — Productos

**Objetivo:** CRUD completo con alertas de stock bajo.

**Tareas:**
1. `ProductService` con `getAll`, `getById`, `getLowStock`, `create`, `update`, `deactivate`
   - Parámetros de filtro: `categoryId`, `active`, `lowStock` (boolean)
2. `ProductListComponent`:
   - Tabla: nombre, categoría, precio, `currentStock`, `availableStock`, stock mínimo, estado
   - Fila con `availableStock <= minimumStock` resaltada en `#FFF3E0` con ícono `warning`
   - Filtros: categoría, estado, "solo stock bajo"
3. `ProductFormComponent`: nombre, SKU, descripción, precio de venta, `unitCost`
   (opcional — para el futuro módulo financiero), stock mínimo, categoría
4. Badge de estado: Activo / Inactivo
5. `desactivar` solo visible para ADMIN

**Nota sobre `unitCost`:** Este campo se captura aquí y el backend lo copia
automáticamente a `SaleOrderDetail.unitCost` al crear órdenes de venta.
Es la base del futuro módulo de análisis financiero (margen bruto).

**Criterio de aceptación:**
- Productos con `availableStock <= minimumStock` se destacan visualmente
- El filtro "solo stock bajo" hace la llamada correcta al endpoint `/low-stock`
- Tests: 0 fallos

---

### Fase 2.3 — Kardex (movimientos de stock)

**Objetivo:** Historial de movimientos por producto y ajustes manuales.

**Tareas:**
1. `StockMovementService`:
   - `getByProduct(productId, page, size)` → `GET /products/{id}/movements`
   - `createMovement(data)` → `POST /stock-movements`
2. `KardexComponent`: tabla cronológica accesible desde el detalle del producto
   - Columnas: fecha, tipo, cantidad, stock resultante, motivo, usuario que registró
   - Badge por tipo: ENTRADA → verde, SALIDA → naranja, AJUSTE → azul

**RBAC para ajuste manual:**
- ADMIN + MANAGER + WAREHOUSEMAN → pueden registrar ajustes
- SALES → solo lectura del Kardex

**Criterio de aceptación:**
- El historial muestra paginación funcional
- Al registrar un ajuste, el `currentStock` del producto se actualiza al recargar
- Tests: 0 fallos

---

## Módulo 3 — Compras

### Contexto y justificación

Gestiona la relación con proveedores y el ciclo de vida de las órdenes de
compra. Al recibir una orden, el backend registra automáticamente el
movimiento de stock IN y actualiza el `currentStock` del producto.
WAREHOUSEMAN puede recepcionar órdenes APPROVED pero no crearlas ni aprobarlas.

### Rama: `feature/modulo-compras`

### Endpoints del backend

```
// Proveedores
GET    /api/v1/purchases/suppliers
GET    /api/v1/purchases/suppliers/{id}
POST   /api/v1/purchases/suppliers
PUT    /api/v1/purchases/suppliers/{id}
DELETE /api/v1/purchases/suppliers/{id}

// Órdenes de compra
GET    /api/v1/purchases/orders
GET    /api/v1/purchases/orders/{id}
POST   /api/v1/purchases/orders
PUT    /api/v1/purchases/orders/{id}
PATCH  /api/v1/purchases/orders/{id}/approve
PATCH  /api/v1/purchases/orders/{id}/receive
PATCH  /api/v1/purchases/orders/{id}/cancel
POST   /api/v1/purchases/orders/{id}/details
PUT    /api/v1/purchases/orders/{id}/details/{detailId}
DELETE /api/v1/purchases/orders/{id}/details/{detailId}
```

### Máquina de estados de Purchase Order

```
PENDING ──► APPROVED ──► RECEIVED
   │
   └──────► CANCELLED
```

---

### Fase 3.1 — Proveedores

**Objetivo:** CRUD completo de proveedores.

**Tareas:**
1. `SupplierService` con `getAll`, `getById`, `create`, `update`, `deactivate`
2. `SupplierListComponent`: tabla con nombre, identificador fiscal, contacto, estado
3. `SupplierFormComponent`: nombre, RFC/NIT, dirección, teléfono, email, persona de contacto
4. Layout master-detail; solo ADMIN/MANAGER pueden crear/editar/desactivar

**Criterio de aceptación:** Tests: 0 fallos

---

### Fase 3.2 — Órdenes de compra

**Objetivo:** Ciclo de vida completo de órdenes de compra.

**Tareas:**
1. `PurchaseOrderService` con todos los métodos (CRUD + transiciones de estado)
2. `PurchaseOrderListComponent`: número, proveedor, fecha, total, badge de estado
   - Filtros: estado, proveedor, rango de fechas
3. `PurchaseOrderDetailComponent`: ítems, totales, botones de acción por rol/estado:
   - PENDING → "Aprobar" y "Cancelar" (ADMIN/MANAGER)
   - APPROVED → "Recibir" (ADMIN, MANAGER, WAREHOUSEMAN)
4. `PurchaseOrderFormComponent`: selector de proveedor, tabla de ítems dinámica
5. Confirmación al cancelar con `ConfirmDialogComponent`

**Criterio de aceptación:**
- "Recibir" solo aparece en APPROVED y para roles con permiso
- Al cancelar PENDING/APPROVED el formulario de confirmación aparece antes
- Tests: 0 fallos

---

## Módulo 4 — Ventas

### Contexto y justificación

Es el módulo más complejo del frontend porque involucra la lógica de reservas
de stock, tres magnitudes de inventario y la captura del costo unitario para
el futuro módulo financiero. Se basa íntegramente en la
`propuesta_modulo_sales.txt` (v4) del backend.

**Conceptos clave que el frontend debe entender y mostrar:**

1. **`availableStock = currentStock - reservedStock`** — es lo que realmente
   está disponible para nuevas ventas. El frontend valida contra este valor.
2. **Reserva automática al aprobar:** al pasar a APPROVED, el backend reserva
   el stock de todos los ítems (`reservedStock += qty`).
3. **Movimiento real al entregar:** al pasar a DELIVERED, el backend libera
   la reserva y registra el movimiento OUT en el Kardex.
4. **`unitCost` en detalles:** el backend captura automáticamente el
   `Product.unitCost` en cada `SaleOrderDetail`. El frontend **nunca lo envía**
   en el request; solo lo muestra en la respuesta.
5. **Detalles editables solo en PENDING.** En APPROVED o DELIVERED, los ítems
   son de solo lectura.
6. **Conflicto de concurrencia (HTTP 409):** si dos usuarios aprueban la misma
   orden simultáneamente, el segundo recibe 409. El `ErrorInterceptor` ya lo
   maneja, pero la UI debe invitar a reintentar.

### Rama: `feature/modulo-ventas`

### Endpoints del backend (24 en total)

```
// Clientes — 5 endpoints
POST   /api/v1/sales/clients
GET    /api/v1/sales/clients/active
GET    /api/v1/sales/clients/{id}
PUT    /api/v1/sales/clients/{id}
DELETE /api/v1/sales/clients/{id}             → solo ADMIN + MANAGER

// Órdenes de venta — 14 endpoints
POST   /api/v1/sales/orders
GET    /api/v1/sales/orders/{id}
GET    /api/v1/sales/orders/status/{status}
GET    /api/v1/sales/orders/client/{clientId}
GET    /api/v1/sales/orders/client/{clientId}/status/{status}
GET    /api/v1/sales/orders/product/{productId}
GET    /api/v1/sales/orders/product/{productId}/status/{status}
PUT    /api/v1/sales/orders/{id}              → solo en PENDING
PATCH  /api/v1/sales/orders/{id}/approve      → ADMIN + MANAGER
PATCH  /api/v1/sales/orders/{id}/deliver      → ADMIN + MANAGER + WAREHOUSEMAN
PATCH  /api/v1/sales/orders/{id}/cancel       → PENDING o APPROVED, con confirmación
POST   /api/v1/sales/orders/{id}/details      → solo en PENDING
PUT    /api/v1/sales/orders/{id}/details/{id} → solo en PENDING
DELETE /api/v1/sales/orders/{id}/details/{id} → solo en PENDING

// Reservaciones — 5 endpoints (todos GET, solo lectura)
GET    /api/v1/sales/reservations/summary
GET    /api/v1/sales/reservations/products
GET    /api/v1/sales/reservations/products/{productId}
GET    /api/v1/sales/reservations/clients
GET    /api/v1/sales/reservations/clients/{clientId}
```

### Máquina de estados de Sale Order

```
         ┌────────────┐
         │  PENDING   │ ← estado inicial
         └─────┬──────┘
               │ approveOrder()  · valida availableStock >= qty (todos primero)
               │                 · reservedStock += qty (todos después)
         ┌─────▼──────┐
         │  APPROVED  │
         └─────┬──────┘
               │ deliverOrder()  · libera reserva + registra movimiento OUT
         ┌─────▼──────┐
         │  DELIVERED │ ← terminal positivo
         └────────────┘

Cancelaciones:
  PENDING  → cancelOrder() → CANCELLED  (sin impacto en stock)
  APPROVED → cancelOrder() → CANCELLED  (libera reservas)
  DELIVERED → NO cancelable
  CANCELLED → NO cancelable
```

---

### Fase 4.1 — Clientes

**Objetivo:** CRUD completo de clientes.

**Tareas:**
1. `CustomerService`:
   - `getAllActive()` → `GET /sales/clients/active`
   - `getById(id)` → `GET /sales/clients/{id}`
   - `create(data)` → `POST /sales/clients`
   - `update(id, data)` → `PUT /sales/clients/{id}`
   - `deactivate(id)` → `DELETE /sales/clients/{id}` (solo ADMIN + MANAGER)
2. `CustomerListComponent`: tabla con nombre, RFC, contacto, estado
3. `CustomerFormComponent`: nombre, RFC, nombre de contacto, teléfono, email, dirección
4. Layout master-detail

**Nota sobre desactivación:** El backend bloquea la desactivación si el cliente
tiene órdenes activas (PENDING o APPROVED). Si devuelve 500 con ese mensaje,
el `ErrorInterceptor` lo mostrará automáticamente.

**Criterio de aceptación:** Tests: 0 fallos

---

### Fase 4.2 — Órdenes de venta

**Objetivo:** Ciclo de vida completo incluyendo validación de `availableStock`
y visibilidad de acciones por rol y estado.

**Tareas:**
1. `SaleOrderService` con todos los métodos del contrato
2. `SaleOrderListComponent`:
   - Tabla con número (`OV-YYYY-NNNN`), cliente, fecha, total, badge de estado
   - Filtros: estado, cliente
   - El rol SALES solo ve sus propias órdenes
     (`GET /sales/orders/client/{clientId}` o filtrado via query params)
3. `SaleOrderDetailComponent`:
   - Tabla de ítems con: producto, cantidad, precio, subtotal, `unitCost` (visible)
   - Nota informativa sobre `unitCost`: "Costo capturado al crear la orden para análisis financiero"
   - Botones de acción según estado y rol:

   | Estado | Botón | Roles que lo ven |
   |---|---|---|
   | PENDING | Aprobar | ADMIN, MANAGER |
   | PENDING | Cancelar | ADMIN, MANAGER, SALES (creador) |
   | PENDING | Editar ítems | ADMIN, MANAGER, SALES (creador) |
   | APPROVED | Entregar | ADMIN, MANAGER, WAREHOUSEMAN |
   | APPROVED | Cancelar | ADMIN, MANAGER |
   | DELIVERED | — | Sin acciones |
   | CANCELLED | — | Sin acciones |

4. `SaleOrderFormComponent`:
   - Selector de cliente
   - Tabla de ítems dinámica: selector de producto, cantidad, precio de venta
   - Al seleccionar un producto, mostrar `availableStock` disponible
   - Validar `quantity <= product.availableStock` antes de permitir guardar
   - El `unitCost` **no se envía** en el request; el backend lo captura solo

5. Confirmación al cancelar (acción destructiva) con `ConfirmDialogComponent`

**Criterio de aceptación:**
- No se puede ingresar una cantidad mayor al `availableStock` del producto
- Al aprobar, si hay 409 (concurrencia), el snackbar invita a reintentar
- En estado APPROVED/DELIVERED, los ítems son de solo lectura (sin botones de editar)
- El `unitCost` de cada ítem es visible en el detalle (dato informativo)
- Tests: 0 fallos

---

### Fase 4.3 — Reservaciones

**Objetivo:** Visibilidad operativa de las reservas de stock activas.

Los endpoints de reservaciones son todos de **solo lectura** y devuelven
vistas agregadas (no paginadas). Son dashboards operativos, no listas
simples.

**Tareas:**
1. `ReservationService`:
   - `getSummary()` → `GET /sales/reservations/summary`
     Respuesta: `ReservationSummaryDTO` con totales de órdenes y productos reservados
   - `getReservedProducts()` → `GET /sales/reservations/products`
     Respuesta: lista de productos con sus órdenes APPROVED que los reservan
   - `getProductDetail(productId)` → `GET /sales/reservations/products/{id}`
   - `getClientsWithReservations()` → `GET /sales/reservations/clients`
     Respuesta: lista de clientes con órdenes APPROVED y sus productos reservados
   - `getClientDetail(clientId)` → `GET /sales/reservations/clients/{id}`
2. `ReservationDashboardComponent`:
   - Tarjetas de resumen (summary): total órdenes aprobadas, total unidades reservadas
   - Tabla de productos reservados: producto, stock reservado, órdenes que lo tienen
   - Tabla de clientes con reservas: cliente, total reservado, valor estimado
3. Acceso: ADMIN, MANAGER, WAREHOUSEMAN (no SALES)

**Criterio de aceptación:**
- Las vistas muestran datos coherentes con el módulo de órdenes de venta
- Cuando no hay reservas activas, muestra `EmptyStateComponent` (sin error)
- Tests: 0 fallos

---

## Módulo 5 — Reportes y Dashboard

### Contexto y justificación

Los reportes dan valor estratégico al sistema. ADMIN ve el dashboard
ejecutivo con KPIs de alto nivel; MANAGER ve reportes analíticos;
WAREHOUSEMAN y SALES acceden a reportes operativos de sus tareas.
Este módulo se construye último porque todos sus datos provienen de
los módulos anteriores. El backend tiene 12 endpoints de reportes.

### Rama: `feature/modulo-reportes`

### Endpoints del backend

```
// Dashboard ejecutivo (solo ADMIN)
GET /api/v1/reports/executive-summary

// Reportes analíticos (ADMIN + MANAGER)
GET /api/v1/reports/inventory
GET /api/v1/reports/purchases
GET /api/v1/reports/sales
GET /api/v1/reports/top-products
GET /api/v1/reports/abc-analysis

// Reportes operativos (ADMIN + MANAGER + WAREHOUSEMAN)
GET /api/v1/reports/low-stock
GET /api/v1/reports/kardex/{productId}
GET /api/v1/reports/stock-movements

// Operaciones pendientes (todos los roles)
GET /api/v1/reports/pending-operations
```

---

### Fase 5.1 — Dashboard ejecutivo (solo ADMIN)

**Objetivo:** Pantalla de inicio del ADMIN con KPIs en tiempo real.

**Tareas:**
1. `DashboardService.getExecutiveSummary()` → `GET /reports/executive-summary`
2. `DashboardComponent` con tarjetas de KPI:
   - Valor total del inventario (monto monetario)
   - Órdenes de compra por estado (PENDING, APPROVED)
   - Órdenes de venta por estado
   - Alertas: cantidad de productos con `availableStock <= minimumStock`
3. Sección "Alertas de stock" con link directo a `/inventory?filter=lowStock`
4. Tarjetas con `MatCard`, valor numérico prominente e ícono representativo

**Criterio de aceptación:**
- Solo accesible con ROLE_ADMIN
- Las alertas de stock bajo muestran el número de productos afectados
- Tests: 0 fallos

---

### Fase 5.2 — Reportes analíticos (ADMIN + MANAGER)

**Objetivo:** Reportes tabulares con filtros de fecha.

**Tareas:**
1. `ReportService` con métodos para cada endpoint analítico
2. `InventoryReportComponent`: valorización del inventario por categoría
3. `PurchasesReportComponent`: compras agrupadas por proveedor en rango de fechas
4. `SalesReportComponent`: ventas agrupadas por cliente o producto
5. `TopProductsComponent`: top N productos por volumen de ventas
6. `AbcAnalysisComponent`: clasificación ABC del inventario
7. Filtros de rango de fechas con `MatDatepicker` en todos los reportes
8. Opción de exportación a CSV si el backend provee el endpoint

**Criterio de aceptación:**
- Los filtros de fecha actualizan el reporte sin recargar la página
- Tests: 0 fallos

---

### Fase 5.3 — Reportes operativos y de operaciones pendientes

**Objetivo:** Vistas simplificadas para roles operativos.

**Tareas:**
1. `LowStockReportComponent` (ADMIN, MANAGER, WAREHOUSEMAN):
   - Lista de productos con `availableStock <= minimumStock`
   - Link directo a la ficha de cada producto
2. `StockMovementsReportComponent` (ADMIN, MANAGER, WAREHOUSEMAN):
   - Historial de movimientos en rango de fechas, con filtro por tipo
3. `PendingOperationsComponent` (todos los roles):
   - WAREHOUSEMAN: órdenes de compra APPROVED pendientes de recepción
   - SALES: sus órdenes PENDING y APPROVED
   - MANAGER: todas las órdenes pendientes de cualquier tipo
   - ADMIN: vista global de pendientes

**Criterio de aceptación:**
- Cada rol solo ve los reportes que le corresponden (AuthGuard por ruta)
- Los ítems de reportes operativos son clickeables y navegan al detalle de la orden
- Tests: 0 fallos

---

## 15. Estrategia de testing

### Niveles

| Nivel | Herramienta | Cobertura mínima | Comando |
|---|---|---|---|
| Unit — Servicios | Jasmine + HttpClientTestingModule | 70% statements | `ng test --include=src/app/core/**` |
| Unit — Componentes | Jasmine + TestBed | 70% statements | `ng test --include=src/app/modules/<mod>/**` |
| Integration | Jasmine + TestBed completo | Flujos críticos | `ng test` |
| E2E | Cypress o Playwright | Golden path por módulo | `npx cypress run` |

### Qué verifica cada nivel

**Tests de servicios HTTP** (con `HttpClientTestingModule`):
- La URL correcta es llamada con los parámetros correctos
- Los parámetros de paginación `?page=0&size=20` se envían
- La respuesta se mapea al tipo TypeScript esperado

**Tests de componentes smart:**
- Se llama al servicio correcto en `ngOnInit`
- Los datos del `PageResponse<T>` se vinculan correctamente al `mat-paginator`
- Las acciones (botón, submit) llaman al método correcto del servicio

**Tests de componentes dumb:**
- Renderizado correcto con `@Input()` dados
- Emisión de `@Output()` al interactuar

### Evidencia por módulo (sección 7 de cada memoria técnica)

```bash
ng test --include=src/app/modules/<nombre>/**
# → X specs, 0 failures

ng test
# → X specs total, 0 failures (regresiones: 0)

ng test --code-coverage
# → Statements: X%, Branches: X%, Lines: X%
```

---

## 16. Convenciones de código y calidad

### Nombrado

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componentes | PascalCase + sufijo | `SaleOrderDetailComponent` |
| Servicios | PascalCase + sufijo | `SaleOrderService` |
| Archivos | kebab-case | `sale-order-detail.component.ts` |
| Variables/métodos | camelCase | `approveOrder()` |
| Interfaces | PascalCase | `SaleOrderResponse`, `PageResponse<T>` |

### Reglas fundamentales

- **Reactive Forms siempre.** Sin Template-driven forms
- **`takeUntilDestroyed()`** en todos los `subscribe()` para evitar memory leaks
- **Async pipe en templates** preferido sobre `subscribe()` manual
- **Sin URLs hardcodeadas.** Todo usa `environment.apiUrl`
- **Un servicio por dominio de negocio.** `SaleOrderService` no llama endpoints de purchases
- **`availableStock` en validaciones de Sales**, nunca `currentStock`
- **No enviar `unitCost`** en los request de Sales. El backend lo captura solo
- **TypeScript strict:** `noImplicitAny`, `strictNullChecks` siempre habilitados
- **Sin comentarios que explican el qué.** Solo el porqué (restricción no obvia)

### Gestión de suscripciones

```typescript
private destroyRef = inject(DestroyRef);

ngOnInit() {
  this.service.getAll().pipe(
    takeUntilDestroyed(this.destroyRef)
  ).subscribe(data => this.items = data);
}
```

---

## 17. Lecciones aprendidas del backend aplicadas al frontend

Las siguientes lecciones fueron extraídas de `memoria_tecnica_global_proyecto.md`
(sección 9). Cada una tiene una implicación directa en cómo se desarrolla el
frontend.

### L1 → Implementar `PageResponse<T>` desde el primer componente de lista

El backend tuvo que actualizar 9 archivos cuando añadió paginación al final.
**Aplicación frontend:** El modelo `PageResponse<T>` y el `mat-paginator`
se configuran en el Módulo 0. Ningún componente de lista puede usar un array
plano `T[]` — todos consumen `PageResponse<T>` desde el día uno.

### L2 → Los mocks ocultan bugs de integración

Los tests con mocks verifican la lógica interna. Para verificar que el
sistema funciona de extremo a extremo son necesarios tests E2E reales.
**Aplicación frontend:** No dar ningún módulo por terminado sin al menos
una sesión de prueba manual contra el backend activo con las credenciales
reales (`admin`/`Admin123!`).

### L3 → El token expirado devuelve 403, no 401

Spring Security devuelve 403 para tokens expirados (no 401).
**Aplicación frontend:** El `ErrorInterceptor` maneja 403 con la lógica
descrita en la Fase 1.2. Usar 401 como trigger del logout no funciona
con este backend.

### L4 → `updatable=false` en el backend puede hacer que la UI muestre datos obsoletos

El backend tuvo campos como `approvedBy` con `updatable=false` que mostraban
el valor correcto inmediatamente después de aprobar (en memoria) pero null
al hacer un GET posterior (de BD). Ese bug ya fue corregido en el backend.
**Aplicación frontend:** Si después de una acción (aprobar, entregar,
cancelar) el GET siguiente retorna campos nulos que deberían tener valor,
reportar como bug del backend, no del frontend.

### L5 → `unitCost` es un campo financiero, no de control de stock

`SaleOrderDetail.unitCost` captura el costo histórico del producto para
calcular margen bruto en el futuro módulo financiero.
**Aplicación frontend:**
- El formulario de creación de órdenes **nunca incluye** `unitCost` en el body
- El detalle de la orden **muestra** `unitCost` como dato informativo (de solo lectura)
- Los detalles solo son editables en estado PENDING; una vez APPROVED, el costo queda congelado

### L6 → Los secretos en el repositorio son permanentes

**Aplicación frontend:** `environment.prod.ts` con URLs de producción o
API keys nunca se commitea. En producción, la URL del backend se configura
en el servidor o mediante CI/CD.

---

## 18. Cronograma estimado

Desarrollo individual a tiempo parcial. Ajustar según disponibilidad real.

| Módulo | Fases principales | Estimación |
|---|---|---|
| Módulo 0 — Infraestructura base | 4 fases | 3–4 días |
| Módulo 1 — Autenticación | 6 fases | 4–5 días |
| Módulo 2 — Inventario | 3 fases | 5–6 días |
| Módulo 3 — Compras | 2 fases | 4–5 días |
| Módulo 4 — Ventas | 3 fases | 5–7 días |
| Módulo 5 — Reportes | 3 fases | 3–4 días |
| **Total estimado** | | **24–31 días hábiles** |

### Hitos

| Hito | Condición de completitud |
|---|---|
| **H0 — Base funcional** | Angular arranca, tema visual aplicado, layout visible, `PageResponse<T>` configurado |
| **H1 — Login operativo** | Login real con `admin`/`Admin123!`, JWT en header, guard de rutas funcionando |
| **H2 — Inventario completo** | CRUD de categorías, productos con alertas de `availableStock`, Kardex |
| **H3 — Compras completo** | Proveedores y ciclo completo de órdenes de compra |
| **H4 — Ventas completo** | Clientes, ciclo de ventas con reservas, dashboard de reservaciones |
| **H5 — MVP completo** | Dashboard ejecutivo + reportes; todos los módulos con ≥70% cobertura |

---

## 19. Criterios de aceptación globales

Para que el frontend se considere MVP entregable:

| Criterio | Descripción |
|---|---|
| **Funcionalidad** | CRUD de los 5 módulos de negocio funciona contra el backend real |
| **RBAC** | Cada rol accede únicamente a las pantallas y acciones de la matriz de la sección 6 |
| **Autenticación** | Login/logout funcionan; 403 con sesión activa redirige a login con mensaje correcto |
| **Stock disponible** | Ventas valida `availableStock`, no `currentStock` |
| **Paginación** | Todos los listados usan `PageResponse<T>` con `mat-paginator` |
| **UX** | Snackbars de éxito/error, confirmaciones destructivas, skeleton loading en tablas |
| **Accesibilidad** | Contraste WCAG AA; íconos interactivos con `aria-label` |
| **Cobertura de tests** | ≥ 70% statements por módulo; 0 fallos en `ng test` |
| **Build limpio** | `ng build --configuration=production` sin errores |
| **Documentación** | Cada módulo tiene `propuesta_*.txt` + `memoria_tecnica_*.md` con 10 secciones |

---

## 20. Riesgos y mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Token expirado tratado como 401 en lugar de 403 | Alta (error de implementación común) | Alto | La Fase 1.2 especifica explícitamente el manejo de 403 |
| Usar `currentStock` en lugar de `availableStock` en Sales | Media | Alto | La Fase 4.2 especifica la validación contra `availableStock`; agregar test unitario que lo verifica |
| `unitCost` enviado en el request de Sales | Media | Bajo | El `SaleOrderDetailRequestDTO` del backend no tiene ese campo — el backend lo ignora; pero es mala práctica documentada en L5 |
| Performance en tablas con muchos registros | Media | Medio | Paginación server-side desde el primer componente (Módulo 0) |
| Concurrencia en `approveOrder` (HTTP 409) | Media | Medio | El `ErrorInterceptor` ya lo maneja; asegurarse de invitar al usuario a reintentar |
| CORS bloqueando peticiones en desarrollo | Alta | Bajo | `proxy.conf.json` configurado en el Módulo 0 elimina el problema en desarrollo |
| `environment.prod.ts` con URL real commiteado | Baja | Alto | Agregar `environment.prod.ts` al `.gitignore` si contiene datos sensibles |

---

## 21. Roadmap de módulos futuros

Extraído de `memoria_tecnica_global_proyecto.md` (sección 10). Estos módulos
no están en el MVP pero el diseño del frontend debe permitir añadirlos.

| Módulo | Descripción | Dependencias |
|---|---|---|
| `returns` | Devoluciones de clientes y a proveedores. Requiere definir el flujo de UX antes del backend | Sales + Purchases |
| `notifications` | Alertas automáticas por stock bajo, órdenes pendientes. Canal: email o websocket | Todos los módulos |
| `locations` | Gestión de ubicaciones físicas: zona → pasillo → estante → posición | Inventory |
| `shipping` | Gestión de transportistas, guías de envío, tracking | Sales |
| `financial` | Análisis de margen bruto usando `unitCost` ya capturado en `SaleOrderDetail` | Sales (ya preparado) |

**Nota sobre `financial`:** El backend ya captura `unitCost` en cada
`SaleOrderDetail`. El frontend ya muestra ese campo (Fase 4.2).
Cuando se implemente el módulo financiero, el dato histórico ya estará
disponible para calcular `margen = unitPrice - unitCost` por orden y por período.

---

*Propuesta v2 — Documento vivo. Actualizar al finalizar cada módulo con
las decisiones tomadas, desvíos del plan y nuevas lecciones aprendidas.*  
*Basado en: `memoria_tecnica_global_proyecto.md` y `propuesta_modulo_sales.txt` (v4)
— backend/almacenes/*
