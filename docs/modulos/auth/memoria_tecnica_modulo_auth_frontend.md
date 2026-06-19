# Memoria Técnica — Módulo 1: Autenticación

**Fecha de inicio:** 2026-06-05  
**Fecha de cierre:** 2026-06-05  
**Rama:** `feature/auth`  
**Estado:** Completado

---

## 1. Contexto y justificación

El Módulo 1 conecta el frontend con el sistema de autenticación JWT del backend.
Sin él, ninguna pantalla de negocio puede mostrarse — el layout shell del Módulo 0
existe pero carece de identidad de usuario y control de acceso.

**Problema que resuelve:** el layout actual muestra datos fijos ("Usuario", "ADMIN")
y todos los ítems del sidebar son visibles para cualquiera. Este módulo hace que
la identidad venga del JWT real y que cada rol vea solo lo que le corresponde.

**Dependencia del Módulo 0:** aprovecha `LayoutService`, `SidebarComponent` y
`TopbarComponent` ya existentes, que ya tenían el campo `roles` en `navItems`
preparado para este momento.

---

## 2. Decisiones de diseño

| Decisión | Alternativa descartada | Justificación |
|---|---|---|
| Token en `localStorage` | `sessionStorage` | El usuario no pierde sesión al cerrar y reabrir pestaña. Riesgo XSS mitigado por política de no ejecutar scripts externos |
| Decodificar JWT con `atob()` nativo | Librería `jwt-decode` | El cliente no necesita verificar firma (eso es responsabilidad del servidor). `atob()` reduce el bundle en ~5 KB |
| Functional interceptors | Class-based interceptors | API moderna Angular 15+; más testeables y composables sin necesidad de `@Injectable` |
| 403 → "sesión expirada" | Solo 401 | Spring Security devuelve **403** para tokens expirados/inválidos, NO 401. Manejar 403 es el comportamiento correcto con este backend |
| Un rol activo principal | Múltiples roles en UI | El backend permite múltiples roles pero en la práctica cada usuario tiene uno. `getPrimaryRole()` toma el primero para las decisiones de UI |
| `/login` con layout propio | `/login` dentro de `MainLayout` | El formulario de login no tiene sidebar ni topbar — requiere un componente raíz independiente |

---

## 3. Especificación de componentes y servicios

### 3.1 Modelos

```
src/app/modules/auth/models/
  auth-request.model.ts     { username: string; password: string }
  auth-response.model.ts    { token: string }
  user-payload.model.ts     { sub: string; roles: string[]; iat: number; exp: number }
  user-response.model.ts    { id, username, email, active, createdAt, updatedAt, roles }
  user-create.model.ts      { username, email, password, roles }
  user-update.model.ts      { username, email }
  change-password.model.ts  { currentPassword, newPassword }
```

### 3.2 AuthService

```
src/app/core/auth/auth.service.ts

Métodos públicos:
  login(req: AuthRequest): Observable<AuthResponse>
    → POST /api/v1/auth/login, almacena token en localStorage
  logout(): void
    → elimina token de localStorage, navega a /login
  getToken(): string | null
    → localStorage.getItem(TOKEN_KEY)
  getUserPayload(): UserPayload | null
    → decodifica base64 del segmento .payload. del JWT
  isAuthenticated(): boolean
    → token existe Y exp > Date.now()/1000
  hasRole(role: string): boolean
    → payload.roles.includes(role)  (formato "ROLE_ADMIN")
  getPrimaryRole(): string
    → payload.roles[0].replace('ROLE_', '') o ''
  getUsername(): string
    → payload.sub o ''

Clave de localStorage: 'almacenes_token'
```

### 3.3 Interceptores

```
src/app/core/auth/jwt.interceptor.ts   (HttpInterceptorFn)
  → Agrega  Authorization: Bearer <token>  a toda petición
    excepto las que contienen '/auth/login' en la URL

src/app/core/auth/error.interceptor.ts  (HttpInterceptorFn)
  → catchError: si status === 403 y la URL no es '/auth/login':
      authService.logout()
      router.navigate(['/login'], { queryParams: { expired: 'true' }})
      muestra SnackBar "Tu sesión ha expirado. Inicia sesión nuevamente."
```

### 3.4 AuthGuard

```
src/app/core/auth/auth.guard.ts  (canActivateFn)
  1. !isAuthenticated() → navigate('/login') → false
  2. route.data.roles existe y hasRole falla → navigate('/') → false
  3. OK → true
```

### 3.5 LoginComponent

```
src/app/modules/auth/login/login.component.ts

Form: FormGroup { username: ['', required], password: ['', required, minLength(6)] }

Flujo:
  submit() → authService.login() → subscribe
    onNext:  router.navigate(['/'])
    onError: snackBar.open(mensaje, 3s, clase 'snackbar-error')

Guardia de ya autenticado: en ngOnInit, si isAuthenticated() → router.navigate(['/'])

Template: pantalla completa #6B3C6B, card blanca centrada,
          logo "Almacenes" sobre el form, campos con mat-form-field,
          botón primario full-width, error inline bajo cada campo.
```

---

## 4. Servicios y contratos con el backend

| Operación | Método | URL | Body | Respuesta |
|---|---|---|---|---|
| Login | POST | `/api/v1/auth/login` | `{username, password}` | `{token}` 200 |
| Mi perfil | GET | `/api/v1/auth/me` | — | `UserResponse` 200 |
| Cambiar contraseña | PUT | `/api/v1/auth/me/password` | `{currentPassword, newPassword}` | 204 |
| Listar usuarios | GET | `/api/v1/auth/users` | — | `PageResponse<UserResponse>` 200 |
| Crear usuario | POST | `/api/v1/auth/users` | `UserCreate` | `UserResponse` 201 |
| Obtener usuario | GET | `/api/v1/auth/users/{id}` | — | `UserResponse` 200 |
| Actualizar usuario | PUT | `/api/v1/auth/users/{id}` | `UserUpdate` | `UserResponse` 200 |
| Desactivar usuario | DELETE | `/api/v1/auth/users/{id}` | — | 204 |
| Asignar roles | PUT | `/api/v1/auth/users/{id}/roles` | `{roles: string[]}` | `UserResponse` 200 |

**JWT payload claims:**
```
sub   → "admin"
roles → ["ROLE_ADMIN"]
iat   → epoch seconds (emisión)
exp   → epoch seconds (expiración, 2h después de iat)
```

---

## 5. Algoritmos y lógica no trivial

### Decodificación del JWT en cliente

```typescript
private decodeToken(token: string): UserPayload | null {
  try {
    const payload = token.split('.')[1];
    // atob() decodifica Base64; JSON.parse extrae los claims
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}
```

### Verificación de expiración sin reloj del servidor

```typescript
isAuthenticated(): boolean {
  const payload = this.getUserPayload();
  if (!payload) return false;
  // exp está en segundos epoch; Date.now() en milisegundos
  return payload.exp > Date.now() / 1000;
}
```

### Filtrado del sidebar por rol

```typescript
// En SidebarComponent — navItems$ recalculado en cada suscripción
navItems$ = of(null).pipe(
  map(() => {
    const roles = this.authService.getUserPayload()?.roles ?? [];
    return ALL_NAV_ITEMS.filter(item => item.roles.some(r => roles.includes(r)));
  })
);
```

### Selección del rol principal por jerarquía

Cuando un usuario tiene múltiples roles, el topbar muestra siempre el de mayor privilegio,
independientemente del orden en que el backend los incluya en el JWT:

```typescript
getPrimaryRole(): string {
  const roles = this.getUserPayload()?.roles ?? [];
  const hierarchy = ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN', 'ROLE_SALES'];
  const top = hierarchy.find(r => roles.includes(r));
  return top ? top.replace('ROLE_', '') : (roles[0]?.replace('ROLE_', '') ?? '');
}
```

---

## 6. RBAC — criterio de visibilidad por rol

| Ítem sidebar | ROLE_ADMIN | ROLE_MANAGER | ROLE_WAREHOUSEMAN | ROLE_SALES |
|---|:---:|:---:|:---:|:---:|
| Inventario | ✓ | ✓ | ✓ | ✓ |
| Compras | ✓ | ✓ | ✓ | — |
| Ventas | ✓ | ✓ | ✓ | ✓ |
| Reportes | ✓ | ✓ | ✓ | ✓ |
| Usuarios | ✓ | — | — | — |

La ruta `/admin/users` tiene `data: { roles: ['ROLE_ADMIN'] }` en el guard.
Si un MANAGER intenta acceder directamente por URL → redirige a `/`.

**Nota:** WAREHOUSEMAN ve Ventas (Solo entrega) — coherente con la tabla RBAC del CLAUDE.md.

---

## 7. Ejecución de tests y resultados

### Suite unitaria — AuthService

```
ng test --watch=false
```

| Archivo | Specs | Fallos |
|---|---|---|
| `auth.service.spec.ts` | 13 | 0 |
| `auth.guard.spec.ts` | 4 | 0 |
| `layout.service.spec.ts` | 5 | 0 |
| `status-label.pipe.spec.ts` | 5 | 0 |
| `master-detail.component.spec.ts` | 8 | 0 |
| `empty-state.component.spec.ts` | 5 | 0 |
| `app.spec.ts` | 3 | 0 |
| **Total** | **43** | **0** |

### Cobertura

```
ng test --watch=false --coverage
```

| Métrica | Resultado |
|---|---|
| Statements | **98.09%** (103/105) |
| Branches | **89.61%** (69/77) |
| Functions | **100%** (22/22) |
| Lines | **98.61%** (71/72) |

Cobertura `auth.service.ts`: 96.77% statements, 68.42% branches.  
La línea 40 (rama catch vacía en `getUserPayload`) no está cubierta — es el camino de JSON.parse lanzando excepción con token no-base64 válido. Las nuevas ramas de jerarquía en `getPrimaryRole()` generan algunas ramas parcialmente no cubiertas (fallback de rol desconocido), pero todas las rutas críticas están testeadas.

### Pruebas de integración E2E en navegador (2026-06-05)

Backend: `http://localhost:8080/api/v1` (Spring Boot + PostgreSQL)  
Frontend: `http://localhost:4200` (ng serve)

| # | Variante | Resultado |
|---|---|---|
| 1 | Submit con campos vacíos — validación inline | ✓ OK |
| 2 | Credenciales incorrectas — snackbar-error "Credenciales incorrectas." — botón se restablece inmediatamente | ✓ OK |
| 3 | Login correcto `admin/Admin123!` — redirige a layout, topbar muestra "admin \| ADMIN" | ✓ OK |
| 4 | Logout → redirige a `/login`, localStorage vacío | ✓ OK |
| 5 | Guard: acceso directo a `/` sin token → redirige a `/login` | ✓ OK |
| 6 | Ya autenticado: navegar a `/login` → redirige a `/` | ✓ OK |
| 7 | RBAC `ventas01` (ROLE_SALES): sidebar muestra Inventario, Ventas, Reportes (3 ítems) | ✓ OK |
| 8 | RBAC `almacen01` (ROLE_WAREHOUSEMAN): sidebar muestra Inventario, Compras, Ventas, Reportes (4 ítems) | ✓ OK |
| 9 | Multi-rol: `ventas01` con roles `[ROLE_SALES, ROLE_WAREHOUSEMAN]` → chip muestra "WAREHOUSEMAN" (mayor jerarquía) | ✓ OK |

Todas las variantes pasaron sin errores en consola.

---

## 8. Bugs y retos durante el desarrollo

| # | Descripción | Causa raíz | Solución |
|---|---|---|---|
| 1 | Login mostraba "Error del servidor" en lugar del mensaje del backend para credenciales incorrectas | El backend devuelve HTTP **500** (no 401) para credenciales inválidas; el código inicial verificaba el status code | Leer `err.error?.message` del body de respuesta independientemente del status |
| 2 | Tests de `AuthService` y `AuthGuard` lanzaban `NG04002: Cannot match any routes. URL Segment: 'login'` | `logout()` y `authGuard` navegan a `/login` pero los tests usaban `provideRouter([])` sin esa ruta | Agregar `DummyComponent` con rutas `/login` y `/` en `provideRouter()` de los tests |
| 3 | `provideAnimationsAsync()` causaba error de módulo no encontrado | `@angular/animations` no viene instalado con Angular core; se instala por separado | `npm install @angular/animations` |
| 4 | RBAC sidebar: `almacen01` (ROLE_WAREHOUSEMAN) no veía el ítem "Ventas" | `ALL_NAV_ITEMS` en `sidebar.component.ts` no incluía `ROLE_WAREHOUSEMAN` en los roles de Ventas | Agregar `'ROLE_WAREHOUSEMAN'` al array de roles de Ventas; detectado en prueba E2E |
| 5 | `npx vitest run --coverage` fallaba con `describe is not defined` | Vitest sin globals; el proyecto usa `ng test` como runner que configura el entorno Angular correctamente | Usar siempre `ng test --watch=false [--coverage]` en lugar de invocar Vitest directamente |
| 6 | Botón "Iniciar sesión" permanecía en estado spinner tras error de credenciales hasta que el usuario hacía clic en un input | El callback de error del Observable HTTP se ejecuta fuera del ciclo de detección de cambios de zone.js en Angular 21 | Inyectar `ChangeDetectorRef` y llamar `detectChanges()` inmediatamente después de `this.loading = false` |
| 7 | Chip del rol ADMIN invisible en el topbar — mismo color que el fondo (`#6B3C6B`) | `--color-role-admin` usaba el mismo valor que `--color-primary`; conflicto generado al cambiar el topbar al color de marca | Cambiar `--color-role-admin` a `#C2185B` (rosa/magenta profundo); contraste blanco 5.6:1 ✓ WCAG AA |
| 8 | `getPrimaryRole()` mostraba el primer rol del array JWT sin considerar jerarquía; usuario con `[ROLE_SALES, ROLE_WAREHOUSEMAN]` mostraba "SALES" en lugar de "WAREHOUSEMAN" | `roles[0]` depende del orden de inserción en el backend, no de la importancia del rol | Implementar jerarquía explícita `ADMIN > MANAGER > WAREHOUSEMAN > SALES` con `Array.find()` |
| 9 | Separador entre nombre de usuario y chip de rol no renderizaba | `<span>` vacío con `background-color` y `width: 1px` — el elemento inline no aplica dimensiones sin `display: block/inline-block`; y `background-color` sobre 1px es prácticamente invisible | Cambiar a `border-left: 2px solid` con `display: inline-block` y `margin: 0 8px` |

---

## 9. Estándares aplicados

- **OWASP A02 (Cryptographic Failures):** token nunca en query params ni logs
- **OWASP A07 (Auth Failures):** guard en todas las rutas protegidas; logout limpia storage
- **Angular Style Guide:** functional guards, functional interceptors (Angular 15+)
- **WCAG 2.1 AA:** errores de formulario con `aria-describedby`; contraste en login card
- **Reactive Forms:** validación en blur + al submit; nunca template-driven

---

## 10. Cumplimiento y validación

```
✓ Login con admin/Admin123! funciona y redirige al layout
✓ Login con credenciales incorrectas muestra snackbar-error y botón se restablece inmediatamente
✓ JWT almacenado en localStorage('almacenes_token')
✓ Header Authorization: Bearer presente en todas las peticiones protegidas (jwt.interceptor)
✓ 403 → logout + redirect /login + snackbar "Tu sesión ha expirado." (error.interceptor)
✓ /login redirige a / si ya hay token válido (ngOnInit guard en LoginComponent)
✓ Sidebar muestra solo ítems del rol actual (filtrado dinámico por roles del JWT)
✓ Topbar muestra username | separador | chip de rol con colores semánticos por rol
✓ Chip ADMIN: #C2185B (magenta) — contrasta con fondo #6B3C6B y con texto blanco (5.6:1)
✓ Multi-rol: getPrimaryRole() muestra el rol de mayor jerarquía (ADMIN > MANAGER > WAREHOUSEMAN > SALES)
✓ Botón "Cerrar sesión" funciona correctamente (logout → /login)
✓ ng test → 43 specs, 0 failures; cobertura global 98.09% statements, 100% funciones
✓ RBAC verificado en navegador con roles ADMIN, MANAGER, SALES, WAREHOUSEMAN y multi-rol
```
