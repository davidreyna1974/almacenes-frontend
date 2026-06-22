# Memoria Técnica Global — Sistema de Gestión de Almacenes

**Versión**: 1.0  
**Fecha de creación**: 2026-06-04  
**Estado**: Activo — se actualiza al finalizar cada módulo  
**Repositorios**:
- Backend: `github.com/davidreyna1974/almacenes-backend`
- Frontend: `github.com/davidreyna1974/almacenes-frontend`

---

## Índice

1. Visión del sistema
2. Stack tecnológico y decisiones arquitectónicas
3. Contratos de integración frontend ↔ backend
4. RBAC transversal (4 roles de extremo a extremo)
5. Guía de configuración del entorno local
6. Cronología de decisiones importantes
7. Estándares transversales (aplican a ambas capas)
8. Estado actual del proyecto
9. Lecciones aprendidas globales
10. Roadmap

---

## 1. Visión del sistema

### Qué hace

Sistema de gestión de almacenes (WMS — Warehouse Management System) que permite
a una empresa administrar su inventario, compras, ventas y generar reportes
financieros y operativos. El sistema diferencia el acceso y las capacidades
según el rol del usuario dentro de la organización.

### Quiénes lo usan

| Audiencia | Rol en el sistema | Frecuencia de uso |
|---|---|---|
| Dueño / dirección general | ADMIN | Semanal — reportes ejecutivos, visión global |
| Gerencia operativa | MANAGER | Diario — catálogos, órdenes, reportes tácticos |
| Personal de almacén | WAREHOUSEMAN | Varias veces al día — recepciones, entregas, Kardex |
| Personal de ventas | SALES | Diario — órdenes de venta, seguimiento a clientes |

### Por qué existe

El sistema reemplaza el uso de hojas de cálculo y procesos manuales para el
control de inventario, compras y ventas. Centraliza la información en una base
de datos única con auditoría completa (quién hizo qué y cuándo), estado de
órdenes en tiempo real y análisis financiero (margen bruto, COGS, ABC).

---

## 2. Stack tecnológico y decisiones arquitectónicas

### Backend

| Tecnología | Versión | Justificación |
|---|---|---|
| Spring Boot | 3.5.14 | Ecosistema maduro para REST APIs empresariales. Auto-configuración reduce boilerplate. |
| Java | 17 LTS | Versión con soporte extendido hasta 2029. Records, pattern matching, mejores GC. |
| PostgreSQL | (última estable) | ACID completo, soporte nativo de JSON, CHECK constraints, rendimiento en queries analíticas. |
| Hibernate / JPA | (incluido en SB) | ORM estándar. `ddl-auto: validate` — schema-first, no auto-generación de tablas. |
| Spring Security + JWT | JJWT 0.12.6 | Autenticación stateless. Sin sesiones de servidor — escalable horizontalmente. |
| MapStruct | 1.5.5 | Conversión entidad↔DTO en tiempo de compilación. Sin reflection en runtime. |
| Lombok | (incluido en SB) | Eliminación de boilerplate (@Builder, @Data, @RequiredArgsConstructor). |
| springdoc-openapi | 2.7.0 | Generación automática de Swagger UI desde los controladores. Versión ≥ 2.7.0 requerida para Spring Framework 6.2.x. |
| Maven | (incluido en SB) | Build tool estándar del ecosistema Spring. |

### Frontend

| Tecnología | Versión | Justificación |
|---|---|---|
| Angular | Última estable | Framework completo (routing, forms, HTTP, DI). Ideal para SPAs empresariales complejas. |
| Angular Material | Coincide con Angular | Componentes UI que siguen Material Design. Accesibilidad incluida, theming via SCSS. |
| TypeScript | (incluido en Angular) | Tipado estático que previene errores en tiempo de desarrollo y documenta los contratos de la API. |
| SCSS | — | Superconjunto de CSS con variables, nesting y mixins. Necesario para el theming de Angular Material. |
| RxJS | (incluido en Angular) | Manejo de asincronía reactiva. BehaviorSubject para estado en servicios. |

### Por qué arquitectura separada (backend / frontend)

Repositorios y procesos de build independientes porque:
- **Ciclos de despliegue distintos**: el frontend puede actualizarse sin tocar el backend
- **Tecnologías incompatibles en el mismo proceso**: JVM vs. Node.js
- **Equipos separables**: un desarrollador puede trabajar en el frontend sin conocer Java
- **Escalamiento independiente**: frontend en CDN, backend en servidor de aplicaciones

### Por qué no microservicios

El sistema es de escala media (un almacén, < 100 usuarios concurrentes). Los
microservicios añaden complejidad de red, discovery y orquestación que no se
justifica. Un monolito bien estructurado por módulos es más mantenible a esta escala.

---

## 3. Contratos de integración frontend ↔ backend

### Autenticación JWT — flujo completo

```
[Angular] → POST /api/v1/auth/login  { username, password }
         ← { token: "eyJ..." }          200 OK

[Angular] almacena el token en localStorage

[Angular] → GET /api/v1/inventory/products
            Header: Authorization: Bearer eyJ...
[JwtAuthenticationFilter]
  1. Extrae el token del header
  2. Llama jwtUtils.extractUsername(token) → "admin"
  3. Llama jwtUtils.validateToken(token) → true
  4. Llama jwtUtils.extractRoles(token) → ["ROLE_ADMIN","ROLE_WAREHOUSEMAN"]
  5. Carga SimpleGrantedAuthority en el SecurityContext
[SecurityConfig]
  6. Evalúa la regla: hasAnyRole("ADMIN","MANAGER","WAREHOUSEMAN","SALES")
  7. Permite el request
         ← { content: [...], totalPages: 3, ... }  200 OK
```

**Token expirado (2 horas)**:
```
[Angular] → GET /api/v1/inventory/products
            Header: Authorization: Bearer eyJ...expirado
         ← 403 Forbidden
[error.interceptor.ts] detecta 403 → redirige a /login con mensaje
```

### Endpoint de búsqueda de productos (catálogo principal)

```
GET /api/v1/inventory/products
    ?search=taladro        (opcional) búsqueda parcial en sku y name, insensible a mayúsculas y acentos
    &categoryId=1          (opcional) filtra por categoría exacta
    &status=AVAILABLE      (opcional) filtra por estado: AVAILABLE | DISCONTINUED | OUT_OF_STOCK
    &supplierId=2          (opcional) filtra por proveedor exacto
    &page=0 &size=20       (opcional, defaults 0/20)

← 200 OK  PageResponseDTO<ProductResponseDTO>

Comportamiento:
  - Siempre filtra active = true (soft-delete excluido implícitamente).
  - Sin parámetros → todos los productos activos paginados.
  - search busca en SKU (LIKE) y nombre (LIKE) simultáneamente con OR.
  - Búsqueda insensible a MAYÚSCULAS y ACENTOS (ver §7 — estándar de búsqueda).
  - Los demás filtros se combinan con AND entre sí y con search.
  - Ordenado por name ASC.
  - JPQL usa CAST(:search AS string) para evitar el error lower(bytea)
    de PostgreSQL cuando search es null (Hibernate 6 + PostgreSQL 15).

Campos del ProductResponseDTO (campos clave para el frontend):
  id, sku, name, description, price, unitCost
  currentStock, minimumStock, reservedStock, availableStock
  status            → "AVAILABLE" | "DISCONTINUED" | "OUT_OF_STOCK"
  active            → siempre true en este endpoint (filtrado implícito)
  categoryId, categoryName
  supplierId, supplierName   ← supplierName agregado 2026-06-06 (antes solo supplierId)
  createdAt, createdByUsername, updatedAt, updatedByUsername, updatedById

Implementación frontend: ProductService.search(params) en
  src/app/modules/inventory/services/product.service.ts
```

### Endpoint de búsqueda de categorías

```
GET /api/v1/inventory/categories/active
    ?search=herr           (opcional) búsqueda parcial en name, insensible a acentos
    &page=0 &size=20       (opcional, defaults 0/20)

← 200 OK  PageResponseDTO<CategoryDTO>
```

### Endpoint de búsqueda de proveedores

```
GET /api/v1/purchases/suppliers/active
    ?search=ferr           (opcional) búsqueda parcial en company_name o rfc
    &page=0 &size=20       (opcional, defaults 0/20)

← 200 OK  PageResponseDTO<SupplierDTO>
```

### Endpoint de búsqueda de clientes

```
GET /api/v1/sales/clients/active
    ?search=mart           (opcional) búsqueda parcial en name, rfc o contact_name
    &page=0 &size=20       (opcional, defaults 0/20)

← 200 OK  PageResponseDTO<ClientDTO>
```

⚠️ **Nota histórica**: antes de 2026-06-09 el endpoint de productos usaba JPQL con
`LOWER()`, que no normaliza acentos. `GET /products/sku/{sku}` sigue siendo lookup
exacto (1 resultado o 404).

### Formato de errores del backend

Todos los errores pasan por `GlobalExceptionHandler` (`core/exception/`).
Formato JSON unificado para todos los casos:

```json
{
  "timestamp": "2026-06-07T12:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Producto con id 99 no encontrado."
}
```

**Tabla de códigos HTTP por tipo de error** (actualizada 2026-06-07):

| Condición | Clase Java | HTTP |
|---|---|---|
| Entidad no encontrada (ID, SKU, nombre) | `ResourceNotFoundException` | **404** |
| Duplicado (SKU, nombre de categoría) | `DuplicateResourceException` | **409** |
| Regla de negocio violada (stock insuficiente, categoría con productos activos, tipo de movimiento inválido) | `BusinessRuleException` | **422** |
| Validación de campos del DTO (`@Valid`, `@NotBlank`, `@Min`) | `MethodArgumentNotValidException` | **400** |
| Contención de Optimistic Locking | `ObjectOptimisticLockingFailureException` | **409** |
| Error real de infraestructura (BD, usuario JWT inexistente) | `RuntimeException` | **500** |
| Sin autorización (JWT ausente o inválido) | Spring Security | **403** (sin body JSON) |

> ⚠️ **Credenciales incorrectas en login**: el backend devuelve **500** para credenciales
> incorrectas (no 401). El frontend lee `err.error?.message` del body independientemente
> del status code. Esto aplica **solo al endpoint `/auth/login`** — para el resto de los
> errores de negocio el código HTTP es semánticamente correcto desde 2026-06-07.

El frontend **no debe basar ninguna lógica en el status code de errores de negocio**;
debe siempre leer `err.error?.message` del body. El `error.interceptor.ts` solo actúa
sobre 401 (sesión expirada → redirect) y 403 (acceso denegado → snackbar); el resto
pasa al `catchError` del componente.

### Formato de paginación (PageResponseDTO)

Todos los endpoints GET de colección retornan este contrato:

```json
{
  "content":      [...],
  "currentPage":  0,
  "totalPages":   5,
  "totalElements": 96,
  "size":         20,
  "first":        true,
  "last":         false
}
```

Parámetros de request: `?page=0&size=20` (defaults aplicados en el backend).

El frontend usa este contrato desde el primer componente de lista. Nunca
asumir que un endpoint retorna un array plano `[...]`.

### CORS

Configurado en `SecurityConfig.java` con `allowedOriginPatterns("*")` para
desarrollo. En producción se reemplaza por el dominio del frontend.

**Por qué CORS va en SecurityConfig y no en `@CrossOrigin`**: el filtro CORS
debe ejecutarse antes que el filtro JWT. Si se aplica después, el preflight
`OPTIONS` del browser llega sin `Authorization` header, Spring Security lo
rechaza con 403 y el browser nunca envía la petición real.

### Rutas públicas (sin JWT)

```
POST /api/v1/auth/login      → login
GET  /swagger-ui/**          → Swagger UI
GET  /swagger-ui.html
GET  /v3/api-docs
GET  /v3/api-docs/**
```

Todo lo demás requiere `Authorization: Bearer <token>`.

### Documentación de la API

Swagger UI disponible en: `http://localhost:8080/swagger-ui/index.html`  
Especificación OpenAPI 3.0: `http://localhost:8080/v3/api-docs`

El frontend consume esta especificación como contrato de referencia.
Antes de implementar cualquier llamada HTTP en Angular, verificar el
contrato en Swagger.

---

## 4. RBAC transversal (4 roles de extremo a extremo)

### Los 4 roles

| Rol | Descripción | Quién lo tiene |
|---|---|---|
| `ROLE_ADMIN` | Acceso total — gestión de usuarios y todos los módulos | Dueño, administrador del sistema |
| `ROLE_MANAGER` | Todos los módulos excepto gestión de usuarios | Gerencia operativa |
| `ROLE_WAREHOUSEMAN` | Lectura de inventario, recepción de compras, entrega de ventas, reportes operativos | Personal de almacén |
| `ROLE_SALES` | Crear/gestionar órdenes de venta, operaciones pendientes | Personal de ventas |

### Cómo fluyen los roles

```
1. Backend: los roles se almacenan en la tabla user_roles (BD)
2. Backend: al hacer login, UserServiceImpl carga los roles del usuario
3. Backend: JwtUtils.generateToken() incluye los roles en el claim "roles" del JWT
4. Frontend: jwt.interceptor.ts agrega el token a cada request
5. Backend: JwtAuthenticationFilter extrae los roles y crea SimpleGrantedAuthority
6. Backend: SecurityConfig evalúa hasRole() / hasAnyRole() por URL
7. Frontend: AuthGuard lee el rol del token (decodificado en Angular) y
             activa/desactiva rutas y elementos del sidebar
```

### Matriz de acceso por módulo

| Módulo / Operación | ADMIN | MANAGER | WAREHOUSEMAN | SALES |
|---|:---:|:---:|:---:|:---:|
| Gestión de usuarios | ✓ | — | — | — |
| Inventory: escritura (categorías, productos) | ✓ | ✓ | — | — |
| Inventory: lectura | ✓ | ✓ | ✓ | ✓ |
| Inventory: registrar movimiento de stock | ✓ | ✓ | ✓ | — |
| Inventory: eliminar (desactivar) producto | ✓ | — | — | — |
| Purchases: CRUD proveedores y órdenes | ✓ | ✓ | — | — |
| Purchases: recibir orden aprobada | ✓ | ✓ | ✓ | — |
| Sales: crear y gestionar órdenes | ✓ | ✓ | — | ✓ |
| Sales: aprobar orden de venta | ✓ | ✓ | — | — |
| Sales: entregar orden aprobada | ✓ | ✓ | ✓ | — |
| Sales: eliminar (desactivar) cliente | ✓ | ✓ | — | — |
| Reports: dashboard ejecutivo | ✓ | — | — | — |
| Reports: analíticos (ABC, top products, etc.) | ✓ | ✓ | — | — |
| Reports: operativos (low-stock, Kardex, movements) | ✓ | ✓ | ✓ | — |
| Reports: operaciones pendientes | ✓ | ✓ | ✓ | ✓ |

### DataInitializer — bootstrap del primer admin

`core/config/DataInitializer.java` crea el usuario `admin`/`Admin123!` con
`ROLE_ADMIN + ROLE_WAREHOUSEMAN` al arrancar si la tabla `users` está vacía.
Resuelve el problema chicken-and-egg de no poder crear el primer usuario sin
que exista un admin previo.

**En producción**: cambiar la contraseña del admin en el primer inicio de sesión.

---

## 5. Guía de configuración del entorno local

### Requisitos previos

- Java 17+ (`java -version`)
- Maven 3.8+ (o usar el wrapper `./mvnw`)
- Node.js 18+ y npm (`node -v`, `npm -v`)
- Angular CLI (`npm install -g @angular/cli`)
- PostgreSQL 14+ corriendo en `localhost:5432`

### Paso 1 — Configurar la base de datos

```sql
-- Conectar a PostgreSQL como superusuario
CREATE DATABASE almacen_db;
-- El schema se crea con los scripts SQL del proyecto (ddl-auto: validate)
-- Ejecutar los scripts de creación de tablas antes de iniciar la app
```

**Variables de entorno requeridas**:
```bash
export DB_PASSWORD=tu_contraseña_postgres
export JWT_SECRET=$(openssl rand -hex 32)   # o usar el default de desarrollo
```

### Paso 2 — Instalar el hook de protección Git (ambos repos)

```bash
# Backend
cd .../backend/almacenes
cp hooks/pre-commit .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

# Frontend
cd .../frontend/almacenes
cp hooks/pre-commit .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
```

### Paso 3 — Levantar el backend

```bash
cd .../backend/almacenes
./mvnw clean package -DskipTests && java -jar target/almacenes-0.0.1-SNAPSHOT.jar
# App disponible en http://localhost:8080
# Swagger UI: http://localhost:8080/swagger-ui/index.html
```

### Paso 4 — Levantar el frontend

```bash
cd .../frontend/almacenes
npm install
ng serve
# App disponible en http://localhost:4200
```

### Paso 5 — Verificar la integración

1. Abrir `http://localhost:4200`
2. Hacer login con `admin` / `Admin123!`
3. Verificar que el sidebar muestra todos los módulos
4. Verificar que `http://localhost:8080/swagger-ui/index.html` está accesible

### Credenciales por defecto (solo desarrollo)

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin123!` | ADMIN + WAREHOUSEMAN |
| `qa_manager` | `QaManager123!` | MANAGER |
| `qa_sales` | `QaSales123!` | SALES |
| `qa_warehouse` | `QaWarehouse123!` | WAREHOUSEMAN |

Usuarios adicionales se crean desde la interfaz de gestión de usuarios (solo ADMIN).

> **Usuarios QA permanentes (2026-06-14)**: `qa_manager`, `qa_sales` y `qa_warehouse` se
> crearon vía `POST /api/v1/auth/users` (con el JWT de `admin`) para cubrir la verificación
> manual en browser de los 4 roles sin tener que crear/recordar usuarios nuevos en cada
> ciclo. Mantenerlos activos y reutilizarlos en futuras rondas de pruebas RBAC.
>
> **Módulo 6 — Gestión de usuarios (implementado, 2026-06)**: la ruta `/admin/users`
> está registrada en `app.routes.ts` y es funcional. Permite CRUD completo de usuarios
> (crear, editar rol, desactivar), cambio de contraseña y listado con filtros. Solo
> accesible para el rol ADMIN. Los usuarios QA de la tabla anterior se pueden gestionar
> desde la UI o directamente via `POST /api/v1/auth/users` (JWT de admin).

---

## 6. Cronología de decisiones importantes

| Fecha | Decisión | Justificación |
|---|---|---|
| Inicio | Spring Boot 3.5 + Java 17 | LTS, ecosistema maduro, soporte hasta 2029 |
| Inicio | PostgreSQL sobre MySQL | ACID estricto, mejor soporte de constraints, queries analíticas |
| Inicio | JWT stateless | Sin sesiones de servidor, escalable, estándar de industria |
| Inicio | ddl-auto: validate | Schema-first — la BD es la fuente de verdad, no el ORM |
| Módulo inventory | unitCost NOT NULL | Eliminación de "captura progresiva" antes del módulo reports. Sin NOT NULL, las queries de COGS requieren filtros IS NOT NULL en todas las queries financieras |
| Módulo auth (RBAC) | 4 roles en lugar de permisos granulares | Los roles cubren el 100% de los casos de uso actuales con menor complejidad. Permisos granulares se agregan cuando el negocio lo requiera |
| Módulo auth (RBAC) | DataInitializer para bootstrap de admin | Sin él, el primer usuario no puede crearse (circular dependency: necesitas un admin para crear admins) |
| Post-reports | springdoc 2.7.0 (no 2.5.0) | Versión 2.5.0 incompatible con Spring Framework 6.2.x: NoSuchMethodError en ControllerAdviceBean |
| Post-reports | Swagger + paginación desde el inicio | Agregarlos al final obligó a actualizar 9 archivos de test y cambiar el contrato de respuesta. Lección: implementar desde el primer módulo |
| Post-reports | Hook pre-commit para ramas protegidas | Commits directos a develop ocurrieron en múltiples ocasiones. El hook elimina la dependencia de memoria |
| Frontend Módulo 0 | Angular 21 + Vitest como runner de tests | Angular CLI 21 usa Vitest (no Karma). Invocar siempre via `ng test`, nunca `npx vitest run` directamente |
| Frontend Módulo 0 | `@angular/animations` se instala por separado | `provideAnimationsAsync()` requiere el paquete `@angular/animations` aunque no venga con Angular core |
| Frontend Módulo 1 | Backend devuelve HTTP 500 para credenciales incorrectas | El frontend lee `err.error?.message` del body en vez de verificar el status code. Documentado en sección 3 |
| Frontend Módulo 1 | `getPrimaryRole()` usa jerarquía explícita | `ADMIN > MANAGER > WAREHOUSEMAN > SALES`. Evita que usuarios con múltiples roles muestren el rol equivocado según el orden de inserción del backend |
| Frontend Módulo 1 | Angular 21: callbacks HTTP pueden ejecutarse fuera de zone.js | Tras un error HTTP, los cambios de estado en el `error` callback no actualizan la vista automáticamente. Solución: `ChangeDetectorRef.detectChanges()` inmediatamente después del cambio de estado |
| Frontend Módulo 2 | Protocolo obligatorio pre-código en `CLAUDE.md` | Tres contratos de API incorrectos en la propuesta del módulo causaron bugs detectados solo en browser. Regla: verificar OpenAPI antes de escribir cualquier servicio o modelo. Ver L8 en sección 9. |
| Frontend Módulo 2 | `memoria_tecnica_global_proyecto.md` copiada localmente al frontend | La versión original está en el repo backend (no accesible directamente). Se mantiene una copia en `almacenes-frontend/` raíz. Sincronizar manualmente al finalizar cada módulo. |
| Frontend Módulo 2 — post | Corrección RBAC: botón "Editar" de categorías oculto para WAREHOUSEMAN/SALES | El botón existía sin guard `@if(canWrite())`. Corregido junto con el clic en fila y el cursor pointer. El backend ya rechazaba el guardado con 403 — era un gap de UX, no de seguridad. |
| Frontend Módulo 2 — post | HTTP 500 para errores de negocio reemplazado por 404/409/422 | `GlobalExceptionHandler` + tres clases custom en `core/exception/`. Mejora la observabilidad (logs) y la semántica REST. El frontend no requirió cambios. |
| Frontend Módulo 2 — post | Columna "Creado por" eliminada de tabla de categorías | Decisión de UX: la información está en el DTO pero no aporta valor en la vista de lista. Consistencia con tabla de productos. |
| Frontend Módulo 2 — post | Estado del producto mostrado en español en el panel de detalle | `getStatusLabel()` en `ProductDetailComponent` traduce AVAILABLE/DISCONTINUED/OUT_OF_STOCK. Sin esta traducción, el usuario veía el enum en inglés. Aplica a todos los módulos futuros que muestren valores enum al usuario. |
| Frontend Módulo 2 — post | `@WithMockUser` no funciona en Spring Security 6 + STATELESS para tests de 200/204 | `SecurityContextHolderFilter` sobreescribe el contexto que `@WithMockUser` establece. Solución definitiva: JWT simulado + `@Import(SecurityConfig.class)`. Ver L10. |
| Frontend Módulo 2 — post | `fixture.componentRef.setInput()` es la API correcta para testing de `@Input` | La asignación directa no dispara `ngOnChanges`. Esta API es el estándar para todos los tests de componentes dumb con `@Input` en este proyecto. Ver L11. |
| Frontend Módulo 2 — post | Tests de seguridad RBAC en clase separada (`*SecurityTest`) de tests de controlador (`*ControllerTest`) | `*ControllerTest` usa `addFilters=false`; `*SecurityTest` usa `@Import(SecurityConfig.class)`. Ambas clases son necesarias y complementarias. Ver L12. |
| Frontend Módulo 2 — post | Excepciones tipadas de negocio desde el primer commit de cada módulo | `ResourceNotFoundException`→404, `DuplicateResourceException`→409, `BusinessRuleException`→422 ya están en `core/exception/`. Todo servicio nuevo debe usarlas desde el inicio, no `RuntimeException` genérica. Ver L13. |
| Frontend Módulo 2 — post | `currentStock` es inmutable en PUT — cambios solo vía movimientos registrados | Backend: `@Mapping(target = "currentStock", ignore = true)` en `updateFromDTO`. Frontend: campo deshabilitado + hint con icono lock. Garantiza integridad del Kardex. Ver L14. |
| Frontend Módulo 2 — post | Angular Material añade `*` automáticamente en campos `required` — no duplicar | `mat-form-field` detecta `Validators.required` y agrega el asterisco vía CSS. Un `<span class="required">*</span>` adicional en el label produce doble asterisco visible. Regla: nunca añadir asterisco manual en labels de AM. Ver L15. |
| Frontend Módulo 2 — post | Campos de solo lectura contextual: `disabled` + `mat-hint` con icono + color semántico | Cuando un campo es editable en creación pero inmutable en edición, deshabilitar el control + mostrar `mat-hint` con icono lock azul (#1565C0). El texto debe nombrar exactamente la acción alternativa. `subscriptSizing="dynamic"` evita solapamiento con campos adyacentes en grids. |
| Frontend Módulo 2 — post | Datos financieros sensibles (`unitCost`) visibles solo para roles con escritura | `unitCost` solo aparece en tabla y formulario para ADMIN/MANAGER (`canWrite()`). WAREHOUSEMAN y SALES no necesitan el costo para sus tareas. El patrón de `displayedColumns` condicional aplica a cualquier columna con restricción de rol. |

---

## 7. Estándares transversales

Estos estándares aplican a **ambas capas** (backend y frontend).

### Documentación de código

Explicar el **POR QUÉ**, no el qué. El código ya dice qué hace;
los comentarios documentan por qué se eligió ese enfoque, qué restricción
lo obliga, o qué comportamiento sorprendería a un lector.

### Convenciones de Git

- **Nunca** commitear directamente en `develop` o `main`
- Todo trabajo va en `feature/`, `fix/`, o `chore/` branches
- Merge siempre con `--no-ff` para preservar el historial
- Hook pre-commit instalado en ambos repositorios

### Documentación obligatoria por módulo

Por cada módulo nuevo (backend y frontend):
- `propuesta_modulo_<nombre>[_frontend].txt` — antes de escribir código
- `casos_de_prueba_modulo_<nombre>.md` — **creado copiando el template** antes de escribir código:
  ```bash
  cp casos_de_prueba_modulo_TEMPLATE.md casos_de_prueba_modulo_<nombre>.md
  ```
  El template (`casos_de_prueba_modulo_TEMPLATE.md`, raíz del frontend) contiene
  la estructura completa de casos para todas las categorías (SEC, RBAC, CRUD, VAL,
  BSRCH, UI, FLOW, RN, ERR, EMPTY, VIS), los patrones críticos que han causado bugs
  (L25 form dirty, L26 última línea, L27 stopPropagation) y el checklist de cierre.
  **Nunca crear este documento desde cero. Siempre partir del template.**
- `memoria_tecnica_modulo_<nombre>[_frontend].md` — actualizada por fase

La Sección 7 de cada memoria técnica documenta:
- Resultado de tests por clase (comando + resultado)
- Suite consolidada (antes y después del módulo)
- Cobertura de código (JaCoCo en backend, Istanbul en frontend)
- Validación E2E (curl o Cypress)
- Regresiones en módulos anteriores

### Manejo de errores

- **Backend**: `GlobalExceptionHandler` (`@RestControllerAdvice`) maneja:
  - `ResourceNotFoundException` → **404** (entidad no encontrada)
  - `DuplicateResourceException` → **409** (unicidad violada)
  - `BusinessRuleException` → **422** (regla de negocio violada)
  - `MethodArgumentNotValidException` → **400** (validación de campos)
  - `ObjectOptimisticLockingFailureException` → **409** (concurrencia)
  - `RuntimeException` genérica → **500** (errores reales de infraestructura)
- **Frontend**: `error.interceptor.ts` actúa sobre:
  - **401** → redirige a `/login` con mensaje "sesión expirada"
  - **403** → muestra snackbar "Sin permiso"
  - **Resto** → `throwError()` — el componente lo maneja en su `catchError`
- **Regla**: los componentes siempre leen `err.error?.message` del body,
  independientemente del status code.

### Seguridad

- Contraseñas: BCrypt (backend) — nunca almacenar en texto plano
- Tokens: JWT en `Authorization: Bearer` header — nunca en query params o cookies sin `HttpOnly`
- Secretos: variables de entorno (`JWT_SECRET`, `DB_PASSWORD`) — nunca en código fuente
- RBAC verificado en dos puntos: SecurityConfig (backend) + AuthGuard (frontend)
- Rutas de Swagger y login son las únicas rutas públicas

**Tests de seguridad RBAC — estándar backend (aplica a todos los módulos)**:
- Por cada controlador: dos clases de test separadas:
  - `*ControllerTest` con `@AutoConfigureMockMvc(addFilters=false)` → verifica lógica de controlador
  - `*ControllerSecurityTest` con `@Import(SecurityConfig.class)` → verifica reglas RBAC reales
- **Nunca** usar `@WithMockUser` en este proyecto (falla en Spring Security 6 + STATELESS).
- JWT simulado: mockear `JwtUtils` con el helper `tokenConRol()` + header `Authorization: Bearer`.
- Cubrir: al menos un rol que NO tiene acceso (espera 403) y un rol que SÍ tiene acceso (espera 2xx).
- Cuando una regla específica en `SecurityConfig` prevalece sobre una general, escribir un test
  explícito para ese caso (ej. `DELETE /products/**` → ADMIN only, aunque exista `DELETE /inventory/**`
  → ADMIN+MANAGER como regla general).

**Trazabilidad de enums en la UI (aplica a todos los módulos)**:
- Todo campo enum del backend que se muestre al usuario final debe tener un método de traducción
  (o `StatusLabelPipe` reutilizable) que convierta el valor técnico al texto en español.
- Patrón: `getStatusLabel(status: string): string { return { AVAILABLE: 'Disponible', ... }[status] ?? status; }`
- Nunca mostrar valores como `AVAILABLE`, `PENDING`, `IN`, `OUT` directamente en la UI.

### Estándar de búsqueda de texto — insensible a acentos (aplica a todos los módulos)

**Origen**: BUG-INV-06 (2026-06-09) — "galon" no encontraba "Galón" porque `LOWER()` en JPQL
no elimina diacríticos.

**Regla**: Todo endpoint de búsqueda LIKE sobre texto libre **debe** ser insensible a mayúsculas
Y a acentos/diacríticos. Normalizar solo mayúsculas no es suficiente.

**Implementación backend (PostgreSQL)**:

```sql
-- 1. Instalar extensión (una sola vez por base de datos, ya instalada en almacen_db)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Crear función wrapper IMMUTABLE (necesaria para usarla en índices funcionales)
CREATE OR REPLACE FUNCTION f_unaccent(text)
  RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
$$ SELECT public.unaccent('public.unaccent', $1) $$;

-- 3. Crear índice funcional por cada columna buscable (mejora performance)
CREATE INDEX IF NOT EXISTS idx_<tabla>_unaccent_<col> ON <tabla> (f_unaccent(lower(<col>)));
```

```java
// 4. Query nativa en el repositorio (JPQL no expone funciones PostgreSQL personalizadas)
@Query(value =
    "SELECT t.* FROM tabla t " +
    "WHERE t.active = true " +
    "AND (:search IS NULL OR (" +
    "     f_unaccent(lower(t.col1)) LIKE '%' || f_unaccent(lower(CAST(:search AS text))) || '%' " +
    "  OR f_unaccent(lower(t.col2)) LIKE '%' || f_unaccent(lower(CAST(:search AS text))) || '%'))",
    countQuery = "SELECT COUNT(*) FROM tabla t WHERE ...",
    nativeQuery = true)
Page<T> searchEntidad(@Param("search") String search, Pageable pageable);
// Los paréntesis alrededor del bloque OR son OBLIGATORIOS para evitar bug de precedencia SQL.
```

```java
// 5. Normalización en el servicio (blank → null activa el IS NULL del repositorio)
String normalized = (search != null && !search.isBlank()) ? search.trim() : null;
```

**Tablas con búsqueda implementada** (2026-06-09):
| Tabla | Campos buscables | Índices funcionales |
|---|---|---|
| `products` | `sku`, `name` | `idx_products_unaccent_sku`, `idx_products_unaccent_name` |
| `categories` | `name` | `idx_categories_unaccent_name` |
| `suppliers` | `company_name`, `rfc` | `idx_suppliers_unaccent_company`, `idx_suppliers_unaccent_rfc` |
| `clients` | `name`, `rfc`, `contact_name` | `idx_clients_unaccent_name`, `idx_clients_unaccent_rfc` |

**Al agregar una nueva tabla con búsqueda por texto**:
```
[ ] Instalar unaccent si es una BD nueva (ya instalado en almacen_db)
[ ] Crear f_unaccent() si no existe
[ ] Crear índice funcional: CREATE INDEX IF NOT EXISTS idx_<tabla>_unaccent_<col> ON ...
[ ] Usar nativeQuery=true con f_unaccent() en ambos lados del LIKE
[ ] Envolver el bloque OR en paréntesis dentro del AND
[ ] Normalizar blank → null en el servicio antes de llamar al repositorio
[ ] Añadir parámetro search opcional al controller (required=false)
```

**Implementación frontend**:
- Campo de búsqueda: `FormControl` con `debounceTime(350)` + `distinctUntilChanged()`
- Al cambiar el valor: resetear `currentPage = 0` antes de recargar
- Pasar `search` al servicio HTTP solo si tiene valor (trim; omitir si vacío)
- Estado vacío: distinguir `'empty'` (sin datos) de `'no-results'` (búsqueda sin coincidencias)

**Precaución**: NO usar `?search=` con string vacío `""` — enviar el parámetro ausente en su lugar.
El backend interpreta `search=""` como búsqueda activa; `search IS NULL` solo se activa si
el parámetro está ausente del request.

### Variables de entorno

```bash
# Backend
DB_PASSWORD=...      # contraseña de PostgreSQL
JWT_SECRET=...       # mínimo 64 caracteres hex (openssl rand -hex 32)

# Frontend
# environment.ts / environment.prod.ts
# apiUrl: 'http://localhost:8080/api/v1'  (dev)
# apiUrl: 'https://api.tudominio.com/api/v1'  (prod)
```

---

## 8. Estado actual del proyecto

### Backend (`almacenes-backend`) — Completo

| Módulo | Estado | Tests | Notas |
|---|---|---|---|
| `auth` (RBAC) | ✓ Completo | 45 B* + 20 A + 12 B + 17 C | 4 roles, 9 endpoints, DataInitializer |
| `inventory` | ✓ Completo | 33 A + 19 B + 16 B* + 10 D | unitCost NOT NULL; B*=CategoryControllerSecurityTest(8)+ProductControllerSecurityTest(8); currentStock inmutable en PUT (@Mapping ignore) |
| `purchases` | ✓ Completo | 43 A + 25 B | Máquina de estados PENDING→APPROVED→RECEIVED |
| `sales` | ✓ Completo | 47 A + 25 B + 3 C + 5 D | Optimistic Locking, reservas |
| `reports` | ✓ Completo | 40 A + 14 B + 7 D | 12 endpoints, 3 audiencias |
| Swagger/OpenAPI | ✓ Completo | — | 62 paths documentados |
| Paginación | ✓ Completo | — | 9 endpoints paginados |

**Suite total backend**: 396 tests — 0 fallos — BUILD SUCCESS  
**Cobertura**: 84.6% líneas · 87.5% métodos · 61.6% ramas

### Frontend (`almacenes-frontend`) — En desarrollo

| Módulo | Estado | Tests | Notas |
|---|---|---|---|
| Módulo 0: Infra-base + Layout | ✓ Completo | 26 specs, 0 fallos | Angular 21, Material M2, sidebar+topbar+main-layout, tema #6B3C6B |
| Módulo 1: Auth + RBAC | ✓ Completo | 43 specs, 0 fallos | AuthService, JWT interceptor, error interceptor, authGuard, LoginComponent, filtrado sidebar por rol |
| Módulo 2: Inventory | ✓ Completo | 94 specs, 0 fallos (+46 nuevos en M2 + 5 adicionales post-fix: stock-badge getter availableStock ×2, tooltip con reservedStock ×3) + 15/15 browser + 4 roles RBAC + 17+16 seguridad backend | Mergeado a develop. RBAC 4 roles verificado en browser y backend. HTTP 404/409/422 corregidos. Tests RBAC con Spring Security activo escritos. Business logic gaps cerrados: availableStock en MovementDialog, currentStock inmutable en PUT, unitCost por rol, doble asterisco AM eliminado. |
| Módulo 3: Purchases | ✓ Completo | 143 specs, 0 fallos (32 nuevos) + 155/155 casos browser PASS + validación post-cierre | Mergeado a develop. 155 casos browser PASS. BUG-M3-13 a BUG-M3-22 corregidos en validación post-cierre: desalineación tabla, consistencia visual card, contadores de tabs lazy, mapa counts separado, navegación lista↔detalle con preservación de tab, botón Guardar inactivo hasta dirty, guardia última línea, event bubbling en botones de fila clickeable. Lecciones L21-L27 documentadas. Propuestas A–D en CLAUDE.md. App = solo escritorio 1280px+. |
| Módulo 4: Sales | ✓ Completo | 383 specs, 0 fallos (89.84% statements) + casos browser ✅ PASS (4 roles) | Propuesta D cerrada 2026-06-13. H1 (404/409/422), H2 (redacción unitCost L29), H3/D8 (@Transactional en approveOrder) y H4 (mocks de controller test desactualizados, backend commit `cca468b`) resueltos/verificados. Suite backend completa: 405/405, 0 fallos/0 errores. Limpieza de datos de prueba sin prefijo (19 clientes + 19 productos "Integración", 19 órdenes canceladas) — RBAC-RES-FJ-03. ERR-09 (Optimistic Locking) verificado vía `SaleOrderConcurrencyTest` (3/3, automatizado). |
| Módulo 5: Reports | ✓ Completo | 401 specs, 0 fallos (89.89% statements) + 94 casos browser (82 PASS + 12 N/A, 0 FAIL) + 4 roles RBAC | Propuesta D cerrada 2026-06-16. BUG-REP-01 (autocomplete TypeError), BUG-REP-02 (tab Rotación visible para WAREHOUSEMAN → 403), BUG-REP-03 (botón Consultar no deshabilitado con from > to en Movimientos/Rotación), BUG-REP-04 (currency pipe usaba PEN/USD en lugar de MXN — corregido en 7 templates Reports+Inventory) corregidos. ng2-charts + chart.js para gráficas. `turnoverQueried`/`trendQueried`/`topQueried`/`abcQueried`/`supplierQueried` flags para diferenciar "no consultado" vs "sin resultados". forkJoin con catchError en ExecutiveDashboard (L33). |

**Suite total frontend (Módulos 0-5)**: 401 specs — 0 fallos

---

## 9. Lecciones aprendidas globales

Estas son lecciones que trascienden un módulo específico y aplican al proyecto completo.

### L1: Implementar Swagger y paginación desde el primer módulo

**Problema**: se implementaron al final del backend. Esto obligó a actualizar
9 archivos de test y cambiar el contrato de respuesta de los endpoints paginados.

**Regla**: Swagger + paginación se configuran en el setup inicial del proyecto,
antes del primer módulo de negocio. La paginación cambia el formato de respuesta
de `[...]` a `{content: [...], totalPages: ...}` — si el frontend ya fue diseñado
para el primero, hay que rediseñarlo.

### L2: Los mocks ocultan bugs de integración

**Problema**: varios bugs (supplierId null en BD, approvedById null, regla de
SecurityConfig demasiado permisiva) solo se detectaron en pruebas E2E con datos
reales, no en los tests automatizados con mocks.

**Regla**: los tests con mocks verifican la lógica interna. Para verificar que
el sistema funciona de extremo a extremo, son necesarios los tests `@SpringBootTest`
(Tipo C) y la validación E2E con curl o Cypress. No dar un módulo por terminado
sin al menos uno de los dos.

### L3: El orden de las reglas en SecurityConfig es crítico

**Problema**: una regla general `GET /reports/inventory/**` con
`hasAnyRole("ADMIN","MANAGER","WAREHOUSEMAN")` permitía acceso a WAREHOUSEMAN
a endpoints analíticos que debían ser solo ADMIN+MANAGER.

**Regla**: las reglas más específicas van antes que las generales. Siempre
agregar tests Tipo B* en `SecurityFilterTest` para cada nueva regla de
`SecurityConfig`. Los tests Tipo B con `addFilters=false` no detectan este tipo
de error.

### L4: `updatable=false` solo para campos inmutables desde el INSERT

**Problema**: `PurchaseOrder.approvedBy` tenía `updatable=false`. El valor
se seteaba en memoria pero nunca llegaba a la BD. La respuesta inmediata
mostraba el valor correcto (en memoria); un GET posterior retornaba null (de BD).

**Regla**: `updatable=false` solo para `created_at` y `created_by`.
Campos como `approved_by`, `received_by`, `cancelled_by` — que empiezan
null y se asignan en un UPDATE posterior — **nunca** deben tener `updatable=false`.

### L5: unitCost nullable rompe la integridad financiera

**Problema**: `Product.unitCost` y `SaleOrderDetail.unitCost` eran nullable
por "captura progresiva". Cuando se implementó el módulo `reports`, todas
las queries de COGS requerían `WHERE unitCost IS NOT NULL`.

**Regla**: los campos usados en cálculos financieros deben ser NOT NULL desde
el diseño del schema. Si el dato no está disponible al crear el registro, el
registro no debe crearse hasta que esté.

### L7: Angular 21 — los callbacks de error HTTP no siempre disparan detección de cambios

**Problema**: tras un error de credenciales en el login, el botón "Iniciar sesión" permanecía
en estado spinner hasta que el usuario hacía clic en otro elemento. `this.loading = false`
se ejecutaba correctamente pero Angular no propagaba el cambio a la vista.

**Causa**: en Angular 21, los callbacks del observable en el `error` handler del
`HttpClient` pueden ejecutarse fuera del contexto de zone.js, lo que impide que
el motor de detección de cambios por defecto recoja la mutación de estado.

**Regla**: en componentes que mutan estado dentro de callbacks de error de HTTP,
llamar `ChangeDetectorRef.detectChanges()` inmediatamente después del cambio.
Alternativa más moderna: usar señales Angular (`signal()`) que actualizan la vista
de forma reactiva sin depender de zone.js.

### L8: Verificar contratos de API contra OpenAPI ANTES de escribir código frontend

**Problema (Frontend Módulo 2 — Inventory)**:
- El endpoint `GET /api/v1/inventory/products` fue listado en la propuesta como existente → no existía al implementar el frontend. **Implementado el 2026-06-06** con búsqueda combinada por sku/name y filtros opcionales (categoryId, status, supplierId).
- `POST /movement` fue documentado como retornando `StockMovementResponseDTO` → retorna 204 void.
- El campo del nombre del proveedor fue asumido como `name` → el backend usa `companyName`.
- Los tres errores se propagaron al código y solo se detectaron en el browser con datos reales.

**Regla**: antes de escribir cualquier servicio o interfaz TypeScript que consuma el backend,
verificar contra el OpenAPI real (`http://localhost:8080/v3/api-docs` o Swagger UI):
1. Que el endpoint existe con la ruta y método HTTP exactos.
2. El HTTP status code de la respuesta (200, 201, 204, etc.).
3. Los nombres exactos de los campos en el request body y en el response.
4. Si la respuesta es `PageResponse<T>`, objeto simple o void.

Documentar los contratos verificados en la Sección 4 de la memoria técnica del módulo
ANTES de escribir código. Una propuesta con contratos incorrectos propaga el error al código.

**Impacto**: bugs de integración que pasan desapercibidos en tests (que usan mocks) y
solo se manifiestan en el browser con datos reales, requiriendo debugging costoso.

### L9: Usar excepciones tipadas para errores de negocio — nunca RuntimeException genérica

**Problema (Frontend Módulo 2 — post-desarrollo)**: todos los errores de negocio del backend
(entidad no encontrada, SKU duplicado, stock insuficiente) retornaban HTTP 500, igual que
un crash del servidor. Esto hacía imposible distinguir errores esperados de errores reales
en los logs de producción, y violaba la semántica REST.

**Causa**: `GlobalExceptionHandler` mapeaba toda `RuntimeException` a 500. Los servicios
no diferenciaban tipos de error.

**Regla**: crear una jerarquía mínima de excepciones de negocio desde el inicio de cada
módulo. El patrón estándar para este proyecto:
- `ResourceNotFoundException` → HTTP 404 (no encontrado)
- `DuplicateResourceException` → HTTP 409 (unicidad violada)
- `BusinessRuleException` → HTTP 422 (regla de negocio violada)
- `RuntimeException` genérica → HTTP 500 (solo para errores reales de infraestructura)

Esta jerarquía ya está implementada en `core/exception/` desde el **2026-06-07**.
Todo módulo nuevo debe usar estas clases en sus servicios desde el primer commit.

### L10: Spring Security 6 + STATELESS — `@WithMockUser` no funciona para tests que esperan 200/204

**Problema (Backend Módulo 2 — post-desarrollo)**:
Al escribir `CategoryControllerSecurityTest` y `ProductControllerSecurityTest`, los tests que
esperaban `200 OK` o `204 No Content` fallaban con 403. Los tests que esperaban 403 pasaban.

**Causa**: En Spring Security 6 con `SessionCreationPolicy.STATELESS`, `SecurityContextHolderFilter`
usa `RequestAttributeSecurityContextRepository`, que limpia el `SecurityContext` al inicio de
cada request. `@WithMockUser` funciona colocando un usuario en el `SecurityContextHolder` antes
de la petición, pero el filtro lo sobreescribe. Los tests que esperan 403 pasan "por coincidencia"
porque el usuario anónimo también recibe 403.

**Regla**: Para tests RBAC con filtros de Spring Security activos en este proyecto:
1. `@WebMvcTest(MiController.class)` + **`@Import(SecurityConfig.class)`** (obligatorio — sin esto
   se aplica la seguridad auto-configurada HTTP Basic en lugar del JWT/RBAC real).
2. Mockear `JwtUtils` con el helper `tokenConRol(String roleWithPrefix)`.
3. Agregar header `Authorization: Bearer <token>` a cada request.
4. Nunca usar `@WithMockUser` ni `SecurityMockMvcRequestPostProcessors.user()` en este proyecto.

```java
// Helper estándar — copiar en cada *SecurityTest del proyecto
private String tokenConRol(String roleWithPrefix) {
    String tok = "token." + roleWithPrefix;
    when(jwtUtils.extractUsername(tok)).thenReturn("usuario_test");
    when(jwtUtils.validateToken(tok)).thenReturn(true);
    when(jwtUtils.extractRoles(tok)).thenReturn(List.of(roleWithPrefix));
    return tok;
}
```

### L11: `fixture.componentRef.setInput()` es la API correcta para `@Input` en tests Angular

**Problema (Frontend Módulo 2 — post-desarrollo)**:
El test `precarga al editar` fallaba: `expect(component.form.value).toEqual({name: 'Herramientas', ...})`
recibía `{name: '', description: ''}` aunque `component.item = mockCategory` se ejecutaba correctamente.

**Causa**: La asignación directa `component.item = value` no dispara `ngOnChanges`. El hook `ngOnChanges`
es quien resetea el formulario con los valores del item. Angular solo invoca `ngOnChanges` cuando
el cambio pasa por el mecanismo de input binding de Angular.

**Regla**: Para testear componentes con `@Input()` que tienen `ngOnChanges`:

```typescript
// ✗ No dispara ngOnChanges
component.item = mockCategory;
fixture.detectChanges();

// ✓ Dispara ngOnChanges con SimpleChange correcto
fixture.componentRef.setInput('item', mockCategory);
fixture.detectChanges();
```

Aplicar `setInput()` en todos los specs de componentes dumb que usen `ngOnChanges` para reaccionar
a cambios de `@Input`. Aplica a todos los módulos futuros.

### L12: Tests de seguridad RBAC en clase separada de tests de controlador

**Problema**: Un único `@WebMvcTest` no puede tener `addFilters=false` (para tests de lógica)
y `@Import(SecurityConfig.class)` (para tests de seguridad) al mismo tiempo — son configuraciones
contradictorias.

**Regla**: Crear siempre dos clases por controlador:

| Clase | Configuración | Propósito |
|---|---|---|
| `MiControllerTest` | `@WebMvcTest` + `@AutoConfigureMockMvc(addFilters=false)` | Lógica del controlador (códigos HTTP, serialización, validaciones) |
| `MiControllerSecurityTest` | `@WebMvcTest` + `@Import(SecurityConfig.class)` | Reglas RBAC de `SecurityConfig` (quién puede y quién no) |

Ambas clases son complementarias. Una sin la otra deja una cobertura incompleta.
Aplicar a todos los controladores del backend en módulos futuros (Purchases, Sales, Reports).

### L13: Excepciones tipadas de negocio desde el primer commit de cada módulo

**Problema (Backend Módulo 2 — post-desarrollo)**:
Todos los errores de negocio retornaban 500, igual que un crash real. Imposible distinguir
en logs si fue un error esperado (SKU duplicado) o un error real de infraestructura.

**Regla**: Las tres clases en `core/exception/` ya están implementadas. Todo servicio nuevo
debe usarlas desde el primer commit, nunca `RuntimeException` genérica para condiciones de negocio:

```java
// Para todo módulo nuevo — usar desde el inicio
throw new ResourceNotFoundException("Proveedor con id " + id + " no encontrado.");
throw new DuplicateResourceException("Ya existe un proveedor con RUC: " + ruc);
throw new BusinessRuleException("No se puede cancelar una orden ya recibida.");
// RuntimeException genérica SOLO para errores reales de infraestructura:
throw new RuntimeException("Usuario del JWT no encontrado en BD: " + username);
```

El `GlobalExceptionHandler` ya mapea estas excepciones a 404/409/422 respectivamente.
No se requiere ningún cambio en el handler al agregar nuevos módulos.

### L14: `currentStock` inmutable en PUT — integridad del Kardex

**Problema (Frontend Módulo 2 — post-desarrollo)**:
El formulario de edición de producto exponía `currentStock` como campo editable.
El backend lo actualizaba directamente. La suma de todos los movimientos del Kardex
dejaba de coincidir con el stock real, rompiendo la trazabilidad de auditoría.

**Regla**: El stock físico solo puede cambiar mediante movimientos registrados (POST /movement).

**Backend** — `updateFromDTO` en `ProductMapper.java`:
```java
@Mapping(target = "currentStock", ignore = true)  // solo se modifica via registerStockMovement
void updateFromDTO(ProductRequestDTO dto, @MappingTarget Product product);
```

**Frontend** — `ProductFormComponent.ngOnChanges()`:
```typescript
if (this.isEdit) {
  this.form.get('currentStock')!.disable();
} else {
  this.form.get('currentStock')!.enable();
}
```
Y `submit()` usa `form.getRawValue()` para incluir el valor original del control deshabilitado
(el backend lo ignora de todas formas, pero mantiene la estructura del DTO consistente).

**Aplica a todos los módulos futuros**: cualquier campo que solo pueda modificarse
mediante un flujo específico (no edición directa) debe protegerse en ambas capas.

---

### L15: Angular Material añade `*` automáticamente — no duplicar con span manual

**Problema (Frontend Módulo 2 — post-desarrollo)**:
Todos los formularios tenían `<span class="required">*</span>` en cada label de campo
obligatorio. Angular Material ya añade el asterisco automáticamente via CSS
(`.mat-mdc-form-field-required-marker`) cuando detecta `Validators.required`.
El resultado: doble asterisco visible (uno rojo manual, uno gris de AM).

**Regla**: Nunca añadir asterisco manual en labels de `mat-form-field`.
```html
<!-- ❌ incorrecto — produce doble asterisco -->
<mat-label>Nombre <span class="required">*</span></mat-label>

<!-- ✅ correcto — AM lo gestiona automáticamente -->
<mat-label>Nombre</mat-label>
```
Eliminar también la clase `.required { color: var(--color-error); }` de los SCSS.

---

### L6: Los secretos en el código fuente son permanentes

**Problema**: la clave JWT fue hardcodeada en `JwtUtils.java` en el primer
commit y queda en el historial de git para siempre.

**Regla**: las variables sensibles van en `application.yaml` como
`${VARIABLE_ENTORNO:valor_dev}` desde el primer commit. Una vez que un
secreto entra al historial de git, debe considerarse comprometido.

### L16: Ocultar un ítem del sidebar NO protege la ruta — el guard de rol es obligatorio en el routing

**Problema (Frontend Módulo 3 — Purchases)**:
SALES podía acceder a `/purchases/orders` y `/purchases/suppliers` por URL directa. El sidebar
correctamente no mostraba "Compras" para SALES, pero el `authGuard` solo bloquea cuando
`route.data.roles` está definido. Como `app.routes.ts` no tenía roles en la entrada `purchases`,
cualquier usuario autenticado podía llegar al módulo.

**Regla**: Todo módulo con restricción de rol DEBE tener `data: { roles: [...] }` en su entrada
de ruta en `app.routes.ts`, independientemente de si el sidebar lo oculta o no.

```typescript
// app.routes.ts — patrón correcto para módulos con acceso restringido
{
  path: 'purchases',
  canActivate: [authGuard],
  data: { roles: ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN'] },
  loadChildren: () => import('./modules/purchases/purchases.routes').then(m => m.PURCHASES_ROUTES)
},
```

El sidebar es una guía de navegación, no un mecanismo de seguridad. El guard es la barrera real.

**Extensión (BUG-M3-14 — Módulo 3)**: el guard del módulo padre **NO** se hereda automáticamente
a las rutas child. Cada ruta child que requiera un rol específico debe declarar su propio
`canActivate` + `data.roles`. En Purchases, `orders/new` (solo ADMIN/MANAGER) necesitaba su propio
guard aunque el módulo padre ya restringía el acceso a ADMIN/MANAGER/WAREHOUSEMAN.

```typescript
// purchases.routes.ts — child route con restricción adicional
{
  path: 'orders/new',
  component: PurchaseOrderDetailPageComponent,
  canActivate: [authGuard],
  data: { roles: ['ROLE_ADMIN', 'ROLE_MANAGER'] },  // más restrictivo que el padre
},
```

### L17: Validar título del panel de detalle según permisos — no solo los campos

**Problema (Frontend Módulo 3 — Purchases)**:
El panel de detalle de proveedor mostraba "Editar proveedor" a WAREHOUSEMAN aunque el formulario
era de solo lectura (todos los campos `disabled`, sin botón "Guardar"). El título confundía al
usuario sobre si podía o no modificar el registro.

**Regla**: cuando un componente de formulario se reutiliza para visualización (campos disabled, sin
guardar) y para edición (campos habilitados, con guardar), el título debe reflejar el modo real:

```html
<!-- ✅ correcto — título dinámico según rol -->
{{ isEdit ? (canWrite() ? 'Editar proveedor' : 'Ver proveedor') : 'Nuevo proveedor' }}
```

Aplica a cualquier formulario reutilizable donde el nivel de acceso cambie el modo de la pantalla.

### L21: Truncado de texto en celdas de tabla — nunca `display:block` en `<td>`

**Problema (Frontend Módulo 3 — BUG-M3-15)**:
`.cell-truncate` aplicaba `display: block` directamente sobre el `<td>`, sobreescribiendo
`display: table-cell`. Resultado: desalineación vertical de la columna "Razón social" en Chrome.

**Regla**: para truncar texto con ellipsis en una celda de tabla, usar un elemento wrapper
interno (`<div>` o `<span>`) — nunca aplicar `display: block` sobre el `<td>` directamente:

```html
<!-- ❌ incorrecto — display:block en el <td> rompe la alineación -->
<td mat-cell class="cell-truncate">{{ value }}</td>

<!-- ✅ correcto — wrapper interno -->
<td mat-cell>
  <div class="cell-truncate">{{ value }}</div>
</td>
```

```scss
.cell-truncate {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block; /* válido en un div/span, nunca en el td */
}
```

### L22: Consistencia visual entre páginas del mismo módulo — verificar antes de cerrar

**Problema (Frontend Módulo 3 — BUG-M3-16)**:
La tabla de proveedores no tenía el contenedor con `border-radius`, `border` y `background`
que sí tenía la tabla de productos. El `padding` en `.catalog-page` es necesario para que
el borde redondeado del wrapper sea visible.

**Regla**: al implementar una segunda pantalla con tabla en el mismo módulo, comparar el SCSS
del contenedor con la primera pantalla implementada. La estructura de referencia es:

```scss
.catalog-page {
  padding: var(--space-3);
  gap: var(--space-2);
  // ...
  &__table-wrapper {
    border-radius: 8px;
    border: 1px solid var(--color-divider);
    background: #ffffff;
  }
}
```

### L23: Contadores de tabs — cargar al inicio, no lazy; separar counts de datos completos

**Problema (Frontend Módulo 3 — BUG-M3-17 y BUG-M3-18)**:
Los badges numéricos de las tabs solo mostraban datos al hacer clic en cada tab.
El intento de fix inicial (guardar `size=1` en el mismo mapa de páginas) bloqueaba
la carga completa de datos al hacer clic.

**Regla**: usar dos estructuras separadas:
- `pages: Map<Status, PageResponse<T>>` — solo para datos completos (cargados al activar una tab)
- `counts: Map<Status, number>` — solo para `totalElements`, cargado al inicio con `size=1`

```typescript
// ngOnInit: cargar datos completos del tab activo + conteos del resto
this.loadTab(this.activeTab);
for (const tab of this.tabs) {
  if (tab.status !== this.activeTab) this.loadCount(tab.status);
}

private loadCount(status: Status): void {
  this.service.getByStatus(status, 0, 1).subscribe(page => {
    this.counts.set(status, page.totalElements);
    this.cdr.markForCheck();
  });
}

countFor(status: Status): number {
  return this.counts.get(status) ?? this.pages.get(status)?.totalElements ?? 0;
}
```

### L24: Navegación lista → detalle → lista debe preservar el estado de la lista

**Problema (Frontend Módulo 3 — BUG-M3-19)**:
Al regresar del detalle de una orden, el usuario siempre volvía a la tab "Pendientes"
sin importar desde qué tab había abierto la orden.

**Regla**: pasar la tab/estado/filtro activo como query param al navegar al detalle,
y restaurarlo al volver. Patrón con Angular Router:

```typescript
// En la lista — pasar origen
viewDetail(item: Item): void {
  this.router.navigate(['/module/detail', item.id], { queryParams: { from: this.activeTab } });
}

// En el detalle — usar origen al volver
goBack(): void {
  const from = this.route.snapshot.queryParamMap.get('from');
  this.router.navigate(['/module/list'], from ? { queryParams: { tab: from } } : {});
}

// En la lista — restaurar tab al cargar
ngOnInit(): void {
  const tabParam = this.route.snapshot.queryParamMap.get('tab') as Status | null;
  if (tabParam && this.tabs.some(t => t.status === tabParam)) {
    this.activeTab = tabParam;
  }
  // ...
}
```

En el template: `<mat-tab-group [selectedIndex]="activeTabIndex">` con getter
`get activeTabIndex(): number { return this.tabs.findIndex(t => t.status === this.activeTab); }`

### L27: Botones de acción en filas clickeables requieren `$event.stopPropagation()`

**Problema (Frontend Módulo 3 — BUG-M3-22)**:
En `purchase-orders-page`, las filas de la tabla tienen `(click)="viewDetail(row)"`.
Al hacer clic en un botón de acción (Aprobar, Recibir, Cancelar) dentro de la fila,
el evento burbujeaba al `mat-row`, disparando la navegación al detalle. El router
destruía el componente y `takeUntilDestroyed()` cancelaba el `afterClosed()` antes
de que el callback pudiera ejecutar la transición de estado.

**Regla**: Cuando `mat-row` tiene `(click)="..."`, TODOS los botones dentro de la
fila deben incluir `$event.stopPropagation()`:

```html
<button mat-icon-button (click)="$event.stopPropagation(); approve(o)">
```

Aplica a cualquier tabla con filas clickeables que contengan botones de acción.

---

### L26: Proteger eliminación del último elemento de una colección requerida

**Problema (Frontend Módulo 3 — BUG-M3-21)**:
Al editar una orden PENDING era posible borrar todas las líneas de detalle hasta
dejarla vacía. El backend tampoco valida este caso en `removeDetail()`.

**Regla**: Antes de llamar al API de eliminación, verificar si el elemento es el
último de una colección con mínimo requerido. Si es el último, mostrar snackbar de
error y retornar sin llamar al API.

```typescript
remove(item: DetailResponse): void {
  if ((this.entity?.items.length ?? 0) <= 1) {
    this.snackBar.open('No se puede eliminar el único elemento. Se requiere al menos uno.',
      'Cerrar', { duration: 4000, panelClass: ['snackbar-error'] });
    return;
  }
  // abrir diálogo de confirmación
}
```

Aplica a cualquier entidad con colección obligatoria: órdenes de compra/venta,
facturas con líneas, etc.

### L25: Botones "Guardar" en edición deben verificar `form.dirty`, no solo `form.valid`

**Problema (Frontend Módulo 3 — BUG-M3-20)**:
El botón "Guardar cambios" en el detalle de una orden estaba siempre habilitado al cargar
la pantalla, incluso sin cambios. Causaba confusión al usuario y habilitaba peticiones HTTP
innecesarias.

**Regla**: En formularios de edición (no de creación), la condición `[disabled]` debe incluir
`!form.dirty`. Llamar `form.markAsPristine()` tras guardar exitosamente para restablecer el estado.

```typescript
// Template
[disabled]="form.invalid || !form.dirty || loading"

// En el next del subscribe de save
next: result => {
  // ...actualizar estado local...
  this.form.markAsPristine();   // botón vuelve a deshabilitarse
  this.loading = false;
  this.cdr.markForCheck();
}
```

`patchValue()` al cargar un registro existente no marca el formulario como dirty —
permanece pristine hasta que el usuario modifique un campo.

### L18: `panelClass` en MatSnackBar debe ser array — nunca string

**Problema (Frontend Módulo 3 — BUG-M3-13)**:
Tres componentes pasaban `panelClass: 'snackbar-error'` (string) en lugar de
`panelClass: ['snackbar-error']` (array). Angular Material ignora silenciosamente el string —
el CSS de fondo rojo no se aplicaba y el snackbar aparecía gris por defecto.

**Regla**: `panelClass` en `MatSnackBar.open()` siempre como array:

```typescript
// ❌ incorrecto — string ignorado silenciosamente
this.snackBar.open(msg, 'Cerrar', { panelClass: 'snackbar-error' });

// ✅ correcto — array obligatorio
this.snackBar.open(msg, 'Cerrar', { panelClass: ['snackbar-error'] });
```

Este error no genera warning en consola ni falla en tests unitarios — solo se detecta en browser
viendo el color real del snackbar.

### L19: Protocolo obligatorio de pruebas browser — Propuestas A–D (todos los módulos)

**Problema (Frontend Módulo 3 — origen)**:
El Módulo 3 fue declarado completo antes de ejecutar pruebas browser. Múltiples bugs de
seguridad (BUG-M3-13, BUG-M3-14), lógica (BUG-M3-09 a BUG-M3-12) y UX solo se descubrieron
cuando se realizaron pruebas explícitas en browser con los 4 roles.

**Regla (documentada en CLAUDE.md como protocolo permanente)**:

- **Propuesta A**: documento `casos_de_prueba_modulo_<nombre>.md` creado *antes* de codificar,
  con categorías SEC, RBAC, CRUD, VAL, BSRCH, UI, FLOW, RN, ERR, EMPTY, VIS para cada pantalla.
- **Propuesta B**: un componente no está terminado hasta que TODOS sus casos tienen `✅ PASS`
  verificado en browser con el rol correcto. No acumular deuda de verificación.
- **Propuesta C**: al agregar cualquier ruta, verificar `canActivate` + `data.roles` + acceso
  directo por URL con rol no autorizado (no basta con ocultar el ítem del sidebar).
- **Propuesta D**: un módulo no está "done" hasta que: (1) 100% casos PASS, (2) ng test 0 fallos
  ≥ 70% cobertura, (3) pruebas browser 4 roles ejecutadas, (4) columna Estado sin `⏳ PENDIENTE`.

### L20: La aplicación Almacenes es exclusivamente de escritorio (1280px+)

**Decisión (2026-06-08)**: el sistema no será usado en dispositivos móviles ni tablets.

**Regla**: en los documentos de casos de prueba, marcar como `N/A` desde el inicio todos los
casos de viewport < 600px (categoría VIS responsive). No implementar breakpoints para móvil.
No incluir casos de viewport 400×700 en ningún módulo futuro.

---

### L28: Cabeceras de seguridad HTTP — checklist obligatorio para despliegue a producción (CYBER-18)

**Hallazgo (2026-06-11, CYBER-18 / ASVS V14.4)**: en `dev`, el backend (Spring Security 6
defaults) ya envía `X-Content-Type-Options: nosniff` y `X-Frame-Options: DENY` — correcto sin
configuración adicional. Pero `Content-Security-Policy` y `Strict-Transport-Security` están
ausentes en el backend, y el frontend (`ng serve`) no envía NINGUNA cabecera de seguridad
(`curl -I http://localhost:4200/` no devuelve nada relevante) — es el dev-server de Angular
CLI y no debe configurarse para esto.

**No es un bug de código** — es una tarea de configuración de infraestructura que solo aplica
al desplegar a producción. Checklist obligatorio antes de cualquier despliegue a producción:

```
[ ] Servidor estático del frontend (nginx/Apache/CDN) configurado para enviar:
    [ ] Content-Security-Policy (al menos default-src 'self'; ajustar para
        fonts.googleapis.com/fonts.gstatic.com usados en index.html)
    [ ] Strict-Transport-Security: max-age=31536000; includeSubDomains (solo si HTTPS)
    [ ] X-Content-Type-Options: nosniff
    [ ] X-Frame-Options: DENY (o configurarlo vía CSP frame-ancestors)
[ ] Backend: agregar Strict-Transport-Security vía SecurityConfig.headers(...) si se
    sirve directamente sobre HTTPS (sin reverse proxy que ya lo agregue)
[ ] Backend: agregar Content-Security-Policy vía SecurityConfig.headers(...) si las
    respuestas de error (HTML de /error, Swagger UI) se exponen en producción
[ ] CORS_ALLOWED_ORIGINS (ver L15/BUG-INV-15) actualizado al dominio real de producción
[ ] Re-ejecutar CYBER-13/CYBER-18 contra el dominio de producción tras el despliegue
```

**Por qué no se implementó ahora**: requiere decidir el servidor estático de producción
(nginx/CDN/etc., aún no elegido) y el dominio HTTPS real — configurarlo prematuramente en
`environment.prod.ts` o en código sin esos datos generaría una configuración incorrecta o
rota. Revisar este checklist al definir la infraestructura de despliegue.

---

### L29: Matriz de campos sensibles × roles — diseñar la redacción ANTES de implementar el endpoint (BUG-INV-11)

**Hallazgo (2026-06-12)**: `unitCost` estuvo expuesto en el JSON de los 7 endpoints de
lectura de `ProductServiceImpl` para roles (WAREHOUSEMAN, SALES) que no deben verlo —
excessive data exposure (CYBER-07). Se corrigió retroactivamente con
`redactUnitCost(...)`, pero pudo evitarse si la matriz de visibilidad se hubiera definido
antes de codificar.

**Regla obligatoria — MANDATORIA para TODOS los módulos futuros (Sales incluido)**:

Antes de implementar cualquier servicio de lectura, documentar en la Sección 4 de la
memoria técnica del módulo una **matriz de campos sensibles × roles** por DTO:

| Campo | ADMIN | MANAGER | WAREHOUSEMAN | SALES |
|---|---|---|---|---|
| `unitCost` | valor real | valor real | `null` | `null` |
| `marginPercent` | valor real | valor real | `null` | `null` |
| `creditLimit`, `discountPercent` (ejemplo Sales) | valor real | valor real | `null`/N/A | según RBAC del módulo |

Para cada campo marcado `null`/redactado en algún rol:
1. Escribir el test de redacción por rol PRIMERO (`@Test shouldRedactXxxForRole...`),
   antes de implementar el campo en el DTO/mapper.
2. Implementar la redacción centralizada (ej. `redactXxx(dto, role)`) aplicada en
   TODOS los endpoints de lectura que devuelvan ese DTO — no solo en el endpoint
   "principal".
3. Verificar en el frontend que el campo está AUSENTE del DOM para los roles sin
   acceso (no solo oculto con CSS) — caso `RBAC-[F]-06` del template de casos de
   prueba.

**Por qué**: detectar esto en el browser (como ocurrió con BUG-INV-11) significa que ya
se filtró el dato en al menos un endpoint durante el desarrollo. Diseñar la matriz
primero convierte la redacción en un requisito explícito desde el día 1, no en un
parche posterior.

---

### L30: 401 vs 403 explícitos + rate limiting de login — definir desde el diseño inicial de cualquier módulo con autenticación/autorización (BUG-INV-09, BUG-INV-17, BUG-INV-13)

**Hallazgo (2026-06-11/12)**: Spring Security usa por defecto `Http403ForbiddenEntryPoint`
para "no autenticado" Y "sin permiso", rompiendo la semántica RFC 7235 y la lógica de
`error.interceptor.ts` (BUG-INV-09). Además, `POST /auth/login` no tenía rate
limiting/lockout, permitiendo fuerza bruta (BUG-INV-17, CYBER-19). Como efecto colateral
de corregir BUG-INV-09, también se resolvió BUG-INV-13 (escalada cosmética de UI con JWT
manipulado).

**Regla obligatoria — MANDATORIA, checklist de apertura para CUALQUIER módulo con
autenticación/autorización**:

```
[ ] JwtAuthenticationEntryPoint (401 — "no autenticado": sin token, token inválido/
    expirado/firma manipulada) y JwtAccessDeniedHandler (403 — "autenticado sin el
    rol/permiso requerido") YA configurados en SecurityConfig desde el primer commit
    — NUNCA depender de Http403ForbiddenEntryPoint por defecto. (Ya implementado
    globalmente desde BUG-INV-09 — verificar que sigue activo, no revertir.)
[ ] error.interceptor.ts del frontend maneja 401 (limpiar sesión + redirect a
    /login?reason=expired) y 403 (snackbar "No tienes permiso...") de forma
    diferenciada. (Ya implementado globalmente — verificar que sigue activo.)
[ ] CUALQUIER endpoint de autenticación nuevo (login, recuperación de contraseña,
    cambio de PIN, etc.) implementa rate limiting/lockout (ej. patrón
    LoginAttemptService: 5 intentos fallidos → bloqueo temporal, por usuario,
    case-insensitive) → 429 Too Many Requests, desde el primer commit — no como
    corrección posterior.
[ ] CYBER-02 (JWT manipulado en localStorage) y CYBER-19 (rate limiting de login,
    cuando aplique) se ejecutan como parte del cierre de CUALQUIER pantalla con
    login/sesión, no solo del módulo Auth.
```

**Por qué**: ambos bugs fueron severidad ALTA y se originaron por confiar en
comportamientos por defecto de Spring Security. Definirlo en el diseño inicial evita
horas de corrección retroactiva (incluyendo actualización de clases de test de
seguridad).

---

### L31: Diálogos con `disableClose: true` por defecto + reset de paginador centralizado en filtros (BUG-INV-14, BUG-INV-10)

**Hallazgo (2026-06-12)**: los diálogos de movimiento de stock (y otros) se cerraban al
hacer click en el backdrop, perdiendo cambios sin confirmación (BUG-INV-14). Por
separado, el paginador de productos no regresaba a la página 0 al cambiar de filtro o
término de búsqueda, mostrando una página vacía o resultados incoherentes (BUG-INV-10).
Ambos patrones se repiten en cualquier módulo con diálogos de edición y listas con
filtros — Sales los tendrá desde el primer componente.

**Regla obligatoria — MANDATORIA desde el primer diálogo/lista de cada módulo futuro**:

```
[ ] TODO MatDialog.open(...) que contenga un formulario o cambios de estado usa
    disableClose: true por defecto (opt-out, no opt-in). Si se requiere permitir
    cerrar con backdrop/ESC para un diálogo puramente informativo (sin formulario),
    documentar la excepción explícitamente en la memoria técnica del módulo.
[ ] TODA lista paginada con filtros/búsqueda resetea el paginador a la página 0
    (paginator.firstPage() o equivalente) en el mismo punto centralizado donde se
    aplica el filtro — no duplicar esta lógica por componente. Si existe un servicio/
    componente base de lista compartido, implementar el reset ahí una sola vez.
```

**Por qué**: ambos bugs son fáciles de pasar por alto porque el comportamiento "roto"
(cerrar con backdrop, página vacía tras filtrar) no genera errores de consola ni falla
tests unitarios — solo se detecta en uso real. Hacerlos el comportamiento por defecto
(no una corrección caso por caso) evita que se repitan en módulos futuros.

---

### L32: Mixin SCSS compartido para headers de tabla — consistencia visual desde el primer componente (BUG-INV-07)

**Hallazgo (2026-06-12)**: `products-page` y `categories-page` no tenían la regla
`.mat-mdc-header-cell { font-weight: 600; color: #6B3C6B; background: #F2E4F2; }` que sí
tenía `suppliers-page` (Compras) — inconsistencia visual entre módulos por copiar/pegar
incompleto del estilo de tabla.

**Regla obligatoria — MANDATORIA**: extraer la regla de header de tabla a un
**mixin/placeholder SCSS compartido** (ej. `%catalog-table-header` o
`@mixin catalog-table-header` en `src/styles/_mixins.scss` o equivalente) e incluirlo
(`@include`/`@extend`) en CADA `.catalog-table` desde el primer componente de tabla del
módulo — no copiar la regla manualmente componente por componente. `VIS-GEN-07` del
template de casos de prueba verifica esto.

**Por qué**: una regla compartida no puede "olvidarse" en un componente nuevo — se
incluye una vez y hereda el estándar automáticamente. La duplicación manual es la causa
raíz de BUG-INV-07 y de futuras inconsistencias visuales similares (ver también L22).

---

### L33: `forkJoin` con `catchError` por observable dependiente de rol + convención de datos de prueba (BUG-INV-12, BUG-INV-18)

**Hallazgo (2026-06-12)**: el formulario de productos usaba `forkJoin` para cargar
categorías + proveedores activos en paralelo. `GET /purchases/suppliers/active`
devolvía 403 para SALES, lo que hacía fallar el `forkJoin` COMPLETO (incluyendo
categorías, que SALES sí puede leer) — BUG-INV-12. Por separado, un proveedor de prueba
con payload XSS (`<script>alert(1)</script>`, `id=623`) quedó visible en listados/demos
tras una sesión de pruebas de seguridad — BUG-INV-18 (desactivado el 2026-06-12, ya
resuelto).

**Reglas obligatorias — MANDATORIAS**:

```
[ ] Cualquier forkJoin (u operador equivalente que falla si UNA fuente falla) que
    combine observables cuya disponibilidad depende del ROL del usuario autenticado
    DEBE envolver cada observable dependiente de rol con
    catchError(() => of(<valor por defecto seguro, ej. página vacía>)) — un 403/404
    en una fuente no debe romper las demás. Probar el formulario/pantalla completa
    con CADA rol que tiene acceso, no solo con ADMIN (Propuesta B, checklist de
    cierre de componente).
[ ] Datos creados durante sesiones de pruebas de seguridad (payloads XSS/SQLi/etc.)
    se identifican con un prefijo reconocible, ej. "[QA] " o "TEST_" en el campo de
    nombre/razón social — y se desactivan/eliminan (soft delete) al cerrar la ronda
    de pruebas, ANTES de declarar el módulo "done". El checklist de cierre de módulo
    (Propuesta D) incluye verificar que no existan registros activos con ese prefijo
    o con payloads de prueba evidentes (`<script>`, `' OR 1=1`, etc.) en las tablas
    afectadas por el módulo.
```

**Por qué**: BUG-INV-12 es severidad MEDIA pero afecta a TODOS los roles con acceso
parcial a un formulario (cualquier combinación de fuentes con RBAC distinto). BUG-INV-18
no es una vulnerabilidad activa, pero deja basura visible en demos/producción si no se
limpia sistemáticamente.

---

## 10. Roadmap

### Backend — pendiente

| Item | Prioridad | Notas |
|---|---|---|
| Módulo `returns` (devoluciones) | Media | Depende del flujo de UX del frontend para definir estados |
| Tests B* en `SecurityFilterTest` para Swagger | Baja | Swagger usa sus propios endpoints — requiere `@SpringBootTest` |
| Paginación en endpoints de `reports` | Baja | Reports son analíticos — datos ya agregados, volumen bajo |

### Frontend — en curso

| Módulo | Estado | Dependencias |
|---|---|---|
| ~~Módulo 0: Setup + Layout~~ | ✓ Completo | — |
| ~~Módulo 1: Auth + RBAC~~ | ✓ Completo | Módulo 0 |
| ~~Módulo 2: Inventory~~ | ✓ Completo | Módulo 1 |
| Módulo 3: Purchases | ✓ Completo | Módulo 2 |
| Módulo 4: Sales | ✓ Completo | Módulo 3 |
| ~~Módulo 5: Reports~~ | ✓ Completo | Módulo 4 |

### Módulos de negocio futuros (ambas capas)

| Módulo | Descripción |
|---|---|
| `returns` | Devoluciones de clientes y a proveedores. Requiere definir UX primero |
| `notifications` | Alertas automáticas por stock bajo, órdenes pendientes. Canal: email / websocket |
| `locations` | Gestión de ubicaciones físicas (zona → pasillo → estante → posición) |
| `shipping` | Gestión de transportistas, guías de envío, tracking |

---

## 11. Puesta en producción

### Arquitectura de despliegue

3 servicios Docker en un único servidor Ubuntu 24.04 LTS:

| Servicio | Imagen | Exposición |
|---|---|---|
| `db` | postgres:16 | Solo red interna Docker (`expose`, sin `ports`) |
| `backend` | Spring Boot JAR | Solo red interna Docker (`expose`, sin `ports`) |
| `frontend` | nginx + Angular build | Puertos 80 y 443 al exterior |

nginx (en el contenedor `frontend`) termina TLS, sirve la SPA Angular y proxea `/api/` al backend.

**Empresa**: codigoCodigoEnter  
**Dominio**: `almacenes.codigo2enter.com`  
**Servidor**: Ubuntu 24.04 LTS con acceso SSH y Docker instalado

### Secuencia de despliegue a producción

Documentada en detalle en `almacenes-backend/scripts/INSTRUCTIVO_puesta_produccion_almacenes.md`.

| Script | Qué hace | Cuándo ejecutar |
|---|---|---|
| `01-prepare-server.sh` | Instala Docker, git, dependencias del SO | Una sola vez al configurar el servidor |
| `02-ssl.sh` | Obtiene certificado Let's Encrypt (certbot standalone) | Una sola vez; renovación automática vía cron |
| `03-deploy.sh` | Clona repos, genera `.env` y `docker-compose.yml`, construye imágenes, inicializa BD (extensión unaccent + schema.sql + roles + f_unaccent + 10 índices), levanta los 3 servicios | Primer despliegue y cada re-despliegue |
| `04-firewall.sh` | Configura ufw: permite 22/80/443, deniega 8080/5432 | Una sola vez tras el primer despliegue |
| `05-verify.sh` | 8 smoke tests: contenedores, actuator/health, HTTP→301, HTTPS→200, SSL, API, SPA routing, puerto 8080 bloqueado | Tras cada despliegue |
| `maint-db.sh` | Utilidad opcional: re-crear índices, re-instalar f_unaccent, cargar dump en staging | Solo en mantenimiento puntual |

**Prerequisito externo**: registro DNS del dominio `almacenes.codigo2enter.com` apuntando a la IP del servidor (requerido por Let's Encrypt y por `03-deploy.sh`).

### Despliegue beta local (sin DNS ni Let's Encrypt)

Para validar el despliegue completo en una VM Ubuntu local antes de tocar el servidor de producción. Documentado en `almacenes-backend/scripts_beta/instructivo_beta.md`.

| Componente | Detalle |
|---|---|
| Hipervisor | Lima (macOS, usa Apple Virtualization.framework) |
| VM | Ubuntu 24.04 LTS, 4 GiB RAM, 2 CPU, 30 GiB disco |
| Dominio simulado | `almacenes.codigo2enter.com` vía `/etc/hosts` |
| Certificado | Autofirmado (openssl req -x509) en mismo path que Let's Encrypt |
| Puertos en Mac | `127.0.0.1:10080` → VM:80 · `127.0.0.1:10443` → VM:443 |
| Scripts exclusivos beta | `02-ssl-local.sh` (reemplaza `02-ssl.sh`) · `05-verify-local.sh` (reemplaza `05-verify.sh`) |
| Scripts idénticos a producción | `01-prepare-server.sh`, `03-deploy.sh`, `04-firewall.sh` |

El directorio `scripts_beta/` es autocontenido: contiene todos los scripts necesarios.

### Checklist pre-producción (L28)

Antes de cualquier despliegue al servidor real, verificar las cabeceras de seguridad HTTP:

```
[ ] CSP (Content-Security-Policy) configurada en nginx.conf del contenedor frontend
[ ] HSTS (Strict-Transport-Security) habilitado en nginx.conf
[ ] X-Frame-Options: DENY en nginx.conf
[ ] X-Content-Type-Options: nosniff en nginx.conf
[ ] Swagger UI deshabilitado en perfil prod (springdoc.api-docs.enabled=false)
[ ] CORS_ALLOWED_ORIGINS apunta al dominio real (no localhost)
[ ] Re-ejecutar pruebas de seguridad (CYBER-13/CYBER-18) contra el dominio de producción
```

Ver L28 en §9 para el detalle completo de cada cabecera.

---

---

## 11. Protocolo de verificación en 4 fases (establecido 2026-06-22)

> Ver documento completo: `docs/pruebas/protocolo_verificacion_4_fases.md` (frontend)
> Estado de sesión activa: `docs/pruebas/estado_sesion_activa.md` (frontend)

### Por qué existe

Durante el desarrollo se ejecutaron dos rondas de casos de prueba. La primera ronda encontró
bugs que se corrigieron. La segunda ronda encontró nuevos bugs — algunos causados por los
propios fixes, otros que la primera ronda pasó por alto. Causa raíz: las fases de "probar"
y "corregir" se mezclaron en la misma sesión, invalidando los PASS anteriores al fix.

### Regla fundamental

Una ronda de pruebas solo es válida si se ejecuta íntegra sobre una versión congelada del
código, sin modificaciones entre el primer y el último caso. Si se corrige un bug durante
la ronda, la ronda se invalida y debe reiniciarse.

### Las 4 fases (resumen)

| Fase | Nombre | Qué se hace | Entregable |
|---|---|---|---|
| 1 | Inventario | Ejecutar TODOS los casos de TODOS los módulos sin tocar código | Lista de bugs con estado ABIERTO |
| 2 | Corrección | Aplicar fixes + `ng test` + `mvn test` como gatekeeper | Código corregido, 0 fallos en gatekeepers |
| 3 | Re-ejecución | Re-ejecutar los módulos afectados por el blast radius de los fixes | Documentos de casos 100% PASS/N/A |
| 4 | Certificación | `ng test --coverage` + `mvn test` + commit de certificación | Sistema certificado en esa versión |

### Concepto de blast radius

Cada fix tiene un blast radius que determina qué módulos hay que re-probar en Fase 3:
- Fix local (un componente/servicio de un módulo) → solo ese módulo
- Fix global (interceptor, guard, SecurityConfig, GlobalExceptionHandler, CORS) → todos los módulos

### Manejo de interrupciones de sesión

El archivo `docs/pruebas/estado_sesion_activa.md` actúa como "punto de guardado" para
las sesiones de prueba. Se actualiza al completar cada módulo/categoría. Si Claude Code
se interrumpe por límite de uso, la siguiente sesión lee ese archivo y retoma exactamente
donde se quedó, sin pérdida de contexto.

---

*Memoria técnica global — Sistema de Gestión de Almacenes*  
*Actualizar al finalizar cada módulo del frontend si hay nuevas decisiones transversales*
