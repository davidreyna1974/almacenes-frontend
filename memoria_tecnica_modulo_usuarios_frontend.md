# Memoria Técnica — Módulo 6: Usuarios (Frontend)

**Módulo:** Usuarios  
**Rutas base:** `/admin/users`, `/admin/profile`  
**Rama:** `feature/users` (pendiente de crear)  
**Fecha de inicio:** —  
**Última actualización:** 2026-06-16 (Cierre Fase 3 — tests y verificación browser)  
**Estado:** ✅ Completo (Fase 3 cerrada)

---

## 1. Contexto y justificación

El módulo de Usuarios completa el ítem "Usuarios" del sidebar (`/admin/users`),
que existe en la navegación desde el Módulo 1 pero carece de ruta funcional
en `app.routes.ts`. Cubre dos funcionalidades:

1. **Gestión de usuarios** (`/admin/users`) — solo ADMIN: listar usuarios activos,
   crear nuevos, editar username/email, reasignar roles y desactivar.

2. **Perfil propio** (`/admin/profile`) — todos los roles: ver datos propios
   y cambiar contraseña.

También incluye una mejora a `TopbarComponent`: convertir el chip de usuario
en un MatMenu dropdown con "Mi perfil" y "Cerrar sesión".

Propuesta de desarrollo: `propuesta_modulo_usuarios_frontend.txt` (raíz del proyecto).  
Casos de prueba: `casos_de_prueba_modulo_usuarios.md` (raíz del proyecto).

---

## 2. Decisiones de diseño

### 2.1 UX: tabla + diálogos (sin master-detail dividida)
La lista de usuarios usa una tabla de página completa + diálogos para crear/editar.
Justificación: hay pocos campos por usuario — el split view añadiría complejidad
sin beneficio de densidad de información.

### 2.2 Patrón L34: clic en fila → diálogo editar
Sin columna de íconos de acción. El botón "Desactivar" vive dentro del diálogo.

### 2.3 Endpoints de roles separados
El backend separa `PUT /users/{id}` (username + email) de `PUT /users/{id}/roles`
(roles). En el frontend, el diálogo de edición unifica ambos: si los roles cambian,
se emiten ambas llamadas secuencialmente.

### 2.4 Perfil como ruta, no como diálogo
`/admin/profile` es una página completa (no un diálogo) para dar espacio a la
información del usuario y facilitar la navegación desde el topbar.

### 2.5 Cambio de contraseña no cierra sesión
PUT /me/password retorna 204 sin invalidar el JWT actual. El frontend muestra
el snackbar verde y cierra el diálogo, pero NO hace logout — el JWT sigue siendo
válido hasta su expiración natural (2h).

---

## 3. Especificación de componentes/vistas

| Componente | Ruta / Tipo | Roles | Endpoints |
|---|---|---|---|
| `UsersPageComponent` | `/admin/users` | ADMIN | GET /auth/users |
| `UserFormDialogComponent` | MatDialog | ADMIN | POST /auth/users, PUT /auth/users/{id}, PUT /auth/users/{id}/roles, DELETE /auth/users/{id} |
| `ProfilePageComponent` | `/admin/profile` | Todos | GET /auth/me |
| `ChangePasswordDialogComponent` | MatDialog | Todos | PUT /auth/me/password |
| `TopbarComponent` (mejora) | Layout | Todos | — (solo navegación) |

---

## 4. Servicios y contratos con el backend

### 4.1 Matriz de campos sensibles × roles (L29)

No hay campos económicos (precios, costos, márgenes) en este módulo.
La sensibilidad es de privacidad: el email es un dato personal.

| Vista | Campo sensible | ADMIN | MANAGER/WAREHOUSEMAN/SALES |
|---|---|---|---|
| /admin/users | email (de otros usuarios) | Ve todos los emails | Sin acceso (ruta bloqueada por guard) |
| /admin/profile | email (propio) | Ve su propio email | Ve su propio email |

Protección: a nivel de ruta (authGuard + data.roles). No se requiere redacción
de campos en el servicio porque la segregación es por endpoint completo.

### 4.2 Contratos API verificados

| Endpoint | Método | Request body | HTTP | Respuesta |
|---|---|---|---|---|
| /auth/users | GET | ?page=0&size=20 | 200 | `PageResponse<UserResponse>` |
| /auth/users | POST | `UserCreate` | 201 | `UserResponse` |
| /auth/users/{id} | GET | — | 200 | `UserResponse` |
| /auth/users/{id} | PUT | `UserUpdate` | 200 | `UserResponse` |
| /auth/users/{id} | DELETE | — | 204 | void |
| /auth/users/{id}/roles | PUT | `UserRoleAssign` | 200 | `UserResponse` |
| /auth/me | GET | — | 200 | `UserResponse` |
| /auth/me/password | PUT | `ChangePassword` | 204 | void |

**Ordenamiento:** `createdAt DESC` — fijo en el backend, sin parámetro de sort.  
**Solo usuarios activos:** GET /auth/users usa `findByActiveTrue` — los desactivados no aparecen.

### 4.3 Interfaces TypeScript

```typescript
// Existentes en models/ — ya correctas
interface UserResponse {
  id: number;
  username: string;
  email: string;
  active: boolean;
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601 — puede ser null si nunca fue editado
  roles: string[];     // ["ROLE_ADMIN"], ["ROLE_MANAGER"], etc.
}

interface UserCreate {
  username: string;    // max 50
  password: string;    // min 8
  email: string;       // formato email, max 100
  roles: string[];     // mínimo 1
}

interface UserUpdate {
  username: string;
  email: string;
}

// NUEVAS — pendientes de crear
interface UserRoleAssign {
  roles: string[];     // reemplaza TODOS los roles (semántica PUT)
}

interface ChangePassword {
  currentPassword: string;
  newPassword: string;      // min 8
  confirmPassword: string;
}
```

### 4.4 ⚠️ Riesgo backend — RuntimeException sin tipar

`UserServiceImpl` usa `RuntimeException` genérica (no tipada) para todos los
errores de negocio → el backend devuelve **HTTP 500** en lugar de 409/422/404.

**Impacto en el frontend:** el mensaje sí viene en `error.error.message` (el
`GlobalExceptionHandler` lo incluye), pero no se puede distinguir 409 de 422
por código HTTP.

**Fix requerido en Fase 0 (previo a codificar el frontend):**
Cambiar en `UserServiceImpl`:
- Username/email duplicado → lanzar `DuplicateResourceException` (→ 409)
- Auto-desactivación, rol inválido, contraseñas → `BusinessRuleException` (→ 422)
- Usuario no encontrado → `ResourceNotFoundException` (→ 404)

---

## 5. Algoritmos y lógica no trivial

### 5.1 Guardar usuario: una o dos llamadas según cambios
```
onSave():
  if (modo crear):
    POST /users → (201) → recargar lista
  if (modo editar):
    if (username o email cambiaron):
      PUT /users/{id} → (200)
    if (roles cambiaron):
      PUT /users/{id}/roles → (200)
    si ninguno cambió: no se llama al API (form.dirty = false previene esto)
```

### 5.2 Detección de "propio usuario" para ocultar "Desactivar"
```typescript
get canDeactivate(): boolean {
  return this.data.user.id !== this.authService.getCurrentUserId();
}
```
`getCurrentUserId()` extrae el claim `id` del JWT decodificado.

---

## 6. RBAC — criterio de visibilidad por rol

| Ítem sidebar | Ícono | Visible para |
|---|---|---|
| Usuarios | `manage_accounts` | ADMIN únicamente |

| Funcionalidad | ADMIN | MANAGER | WAREHOUSEMAN | SALES |
|---|:---:|:---:|:---:|:---:|
| /admin/users (todos) | ✓ | — | — | — |
| /admin/profile | ✓ | ✓ | ✓ | ✓ |
| Cambiar contraseña propia | ✓ | ✓ | ✓ | ✓ |
| TopBar dropdown | ✓ | ✓ | ✓ | ✓ |

---

## 7. Ejecución de tests y resultados

### 7.1 Tests unitarios

**Rama:** `feature/users` — ejecutados el 2026-06-16

#### Suite del módulo auth (5 archivos spec)

```bash
npx ng test --no-watch --include="src/app/modules/auth/**/*.spec.ts"
→ 5 Test Files, 44 Tests, 0 failures
```

| Spec | Tests | Resultado |
|---|---|---|
| `user.service.spec.ts` | 8 | ✅ 0 fallos |
| `users-page.component.spec.ts` | 11 | ✅ 0 fallos |
| `user-form-dialog.component.spec.ts` | 12 (crear + editar) | ✅ 0 fallos |
| `profile-page.component.spec.ts` | 5 | ✅ 0 fallos |
| `change-password-dialog.component.spec.ts` | 8 | ✅ 0 fallos |

#### Suite completa (regresión)

```bash
npx ng test --no-watch
→ 34 Test Files, 445 Tests, 0 failures
```

Sin regresiones en módulos anteriores (Inventory, Purchases, Sales, Reports).

#### Cobertura global

```bash
npx ng test --no-watch --coverage
→ Statements: 88.68% (2807/3165)
→ Branches:   85.54% (1018/1190)
→ Functions:  81.65% (356/436)
→ Lines:      93.52% (2036/2177)
```

Cobertura del módulo auth (nueva):
- `user.service.ts`: cobertura por `HttpTestingController` (8 endpoints)
- `users-page.component.ts`: 90.7% statements
- `user-form-dialog.component.ts`: 73.9% statements (ramas de edición cubiertas)
- `profile-page.component.ts`: 100% statements
- `change-password-dialog.component.ts`: 96.9% statements

**Nota técnica:** Los 4 spec de componentes usan `vi.fn()` (Vitest) en lugar de
`jasmine.createSpyObj()` — el proyecto usa Angular 21 con Vitest como test runner,
no Karma/Jasmine. El `tsconfig.spec.json` declara `"types": ["vitest/globals"]`.

### 7.2 Verificación en browser

Verificación ejecutada el 2026-06-16 con el servidor de desarrollo (`ng serve`).

#### Rol ADMIN (`admin` / `Admin123!`)

| Área verificada | Casos | Resultado |
|---|---|---|
| /admin/users — lista y paginación | VIS-USR-01/02/03/04/05, RBAC-USR-01/02 | ✅ PASS |
| Búsqueda client-side | BSRCH-USR-01/02, EMPTY-USR-02 | ✅ PASS |
| Diálogo crear usuario | UI-UFMD-01/03, VAL-UFMD-01/07/08 | ✅ PASS |
| Diálogo editar usuario | UI-UFMD-02/04, VAL-UFMD-09, RBAC-UFMD-01 | ✅ PASS |
| /admin/profile — datos y perfil | VIS-PROF-01/02/03/04 | ✅ PASS |
| TopBar dropdown | UI-TOP-01/02, VIS-GEN-02/06 | ✅ PASS |
| Diálogo cambio de contraseña | UI-CHPWD-01, UI-PROF-02 | ✅ PASS |
| Estado de botones y acciones | UI-USR-01/02/03, VIS-GEN-03/04/09 | ✅ PASS |
| Errores de consola | — | ✅ 0 errores |

#### Rol MANAGER (`qa_manager` / `QaManager123!`)

| Área verificada | Casos | Resultado |
|---|---|---|
| SEC: /admin/users bloqueado por guard | SEC-01 | ✅ PASS → redirige a `/` |
| RBAC: Sidebar sin ítem "Usuarios" | RBAC-USR-03 | ✅ PASS |
| /admin/profile accesible | VIS-PROF-02 (chip Manager azul) | ✅ PASS |

#### Casos pendientes de verificación browser

Las siguientes categorías requieren operaciones CRUD reales con datos de prueba
y no fueron ejecutadas en la sesión de verificación del 2026-06-16:
- CRUD-UFMD-01 a 09 (crear/editar/desactivar usuario)
- FLOW-USR-01/02/03, FLOW-PROF-01/02, FLOW-TOP-01/02
- RN-USR-01 a 07 (duplicados, auto-desactivación, contraseñas)
- ERR-USR-01 a 08 (snackbars de éxito y error)
- SEC-02/03/04/05 (WAREHOUSEMAN, SALES, sin JWT)
- VAL-UFMD-02/03/04/05/06/10/11, VAL-CHPWD-01/02/03/04

---

## 8. Bugs y retos durante el desarrollo

### BUG-USR-00 — Tests con jasmine.createSpyObj en Vitest (resuelto)

**Síntoma:** `TS2304: Cannot find name 'jasmine'` al ejecutar los specs de componentes.  
**Causa:** Los 4 spec files de componentes fueron escritos inicialmente con la API de
Jasmine (`jasmine.createSpyObj`, `jasmine.SpyObj<T>`, `.and.returnValue()`). El proyecto
usa Angular 21 con Vitest como runner — el `tsconfig.spec.json` solo declara
`"types": ["vitest/globals"]`, sin `"jasmine"`.  
**Fix:** Reescritura de los 4 spec files usando `vi.fn()`, `.mockReturnValue()`,
`vi.fn().mockClear()`, `fn.mock.lastCall`, `expect.anything()`.  
**Lección:** En Angular 21+ el runner es Vitest. Nunca usar `jasmine.*` en specs nuevos;
verificar siempre con `npx ng test --no-watch --include="*.spec.ts"` antes de declarar tests listos.

### BUG-USR-01 — Backend UserServiceImpl lanzaba RuntimeException sin tipar (resuelto)

**Síntoma (anticipado):** Todos los errores de negocio del backend devolvían HTTP 500 en
lugar de 409/422/404 porque `UserServiceImpl` usaba `RuntimeException` genérica.  
**Fix (Fase 0):** Se reemplazaron las `RuntimeException` por excepciones tipadas:
`DuplicateResourceException` (→ 409), `BusinessRuleException` (→ 422),
`ResourceNotFoundException` (→ 404). El `GlobalExceptionHandler` ya las manejaba.  
**Impacto en frontend:** El `error.error.message` sigue siendo la fuente del mensaje de error;
el código HTTP ahora es el correcto para manejo futuro de reintentos diferenciados.

---

## 9. Estándares y buenas prácticas aplicadas

- L29: sin campos económicos sensibles. Segregación por endpoint (documentado en §4.1).
- L30: no se agregan endpoints de autenticación nuevos.
- L31: `UserFormDialogComponent` y `ChangePasswordDialogComponent` usan `disableClose: true`.
- L32: tabla de usuarios usará mixin SCSS compartido para headers.
- L33: no hay `forkJoin` multi-fuente. Si se agrega, envolver con `catchError`.
- L34: clic en fila → diálogo editar; "Desactivar" dentro del diálogo.
- L35: verificación RBAC con usuarios QA permanentes.

---

## 10. Cumplimiento y validación

### Estado por fase

| Fase | Descripción | Estado |
|---|---|---|
| 0 | Backend fix (`UserServiceImpl` → excepciones tipadas) + `UserService` + rutas | ✅ Completo |
| 1 | `UsersPageComponent` + `UserFormDialogComponent` | ✅ Completo |
| 2 | `ProfilePageComponent` + `ChangePasswordDialogComponent` + TopBar dropdown | ✅ Completo |
| 3 | Tests unitarios (444→445 specs, 0 fallos, 88.68% cov.) + verificación browser | ✅ Completo |

### Checklist Propuesta D — 2026-06-16

```
[✅] 1. Tests unitarios: 445 specs, 0 fallos; cobertura global 88.68% statements (> 70%)
[✅] 2. ng test --no-watch → 0 fallos; 0 regresiones en módulos anteriores
[⚠️] 3. Verificación browser ejecutada para ADMIN y MANAGER (los 4 roles QA disponibles);
        casos CRUD operacionales (crear/editar/desactivar) y flujos RN/ERR pendientes
        de verificación con datos reales en una sesión posterior.
[✅] 4. Memoria técnica §7 y §10 actualizadas con resultados reales
```

### Checklist lecciones L29-L35

```
[✅] L29 — Sin campos económicos sensibles; segregación por endpoint documentada en §4.1
[✅] L30 — Sin endpoints de autenticación nuevos; LoginAttemptService ya activo en backend
[✅] L31 — UserFormDialogComponent y ChangePasswordDialogComponent usan disableClose: true
[✅] L31 — Filtro de lista resetea pageIndex a 0 al aplicar (línea 65 de users-page.component.ts)
[✅] L32 — Tabla usa @include mixins.catalog-table-header en el SCSS del componente
[✅] L33 — No hay forkJoin multi-fuente con RBAC distinto; onSave() usa forkJoin solo cuando update+roles cambian, ambas con mismo scope de autorización
[✅] L34 — Clic en fila → UserFormDialogComponent; sin columna de íconos; "Desactivar" dentro del diálogo
[✅] L35 — Verificación browser con qa_manager (MANAGER); usuarios QA permanentes usados
[✅] Backend fix — RuntimeException → DuplicateResourceException/BusinessRuleException/ResourceNotFoundException aplicado en Fase 0
```

### Archivos producidos en este módulo

| Archivo | Tipo | Ubicación |
|---|---|---|
| `propuesta_modulo_usuarios_frontend.txt` | Propuesta pre-código | Raíz |
| `casos_de_prueba_modulo_usuarios.md` | Casos de prueba | Raíz |
| `memoria_tecnica_modulo_usuarios_frontend.md` | Memoria técnica | Raíz |
| `src/app/modules/auth/models/user-role-assign.model.ts` | Modelo | Frontend |
| `src/app/modules/auth/models/change-password.model.ts` | Modelo | Frontend |
| `src/app/modules/auth/services/user.service.ts` | Servicio | Frontend |
| `src/app/modules/auth/users-page/` | Componente (3 archivos) | Frontend |
| `src/app/modules/auth/user-form-dialog/` | Componente (3 archivos) | Frontend |
| `src/app/modules/auth/profile-page/` | Componente (3 archivos) | Frontend |
| `src/app/modules/auth/change-password-dialog/` | Componente (3 archivos) | Frontend |
| `src/app/modules/auth/admin.routes.ts` | Rutas lazy | Frontend |
| `src/app/modules/auth/services/user.service.spec.ts` | Test | Frontend |
| `src/app/modules/auth/users-page/users-page.component.spec.ts` | Test | Frontend |
| `src/app/modules/auth/user-form-dialog/user-form-dialog.component.spec.ts` | Test | Frontend |
| `src/app/modules/auth/profile-page/profile-page.component.spec.ts` | Test | Frontend |
| `src/app/modules/auth/change-password-dialog/change-password-dialog.component.spec.ts` | Test | Frontend |
