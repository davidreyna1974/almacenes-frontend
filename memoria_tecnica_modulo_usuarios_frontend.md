# Memoria Técnica — Módulo 6: Usuarios (Frontend)

**Módulo:** Usuarios  
**Rutas base:** `/admin/users`, `/admin/profile`  
**Rama:** `feature/users` (pendiente de crear)  
**Fecha de inicio:** —  
**Última actualización:** 2026-06-16 (Apertura — documentación pre-código)  
**Estado:** ⏳ En desarrollo

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

*(Sección pendiente — completar al finalizar cada fase)*

---

## 8. Bugs y retos durante el desarrollo

*(Sección pendiente — completar conforme se encuentren bugs)*

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

*(Sección pendiente — completar al cerrar el módulo con Propuesta D)*

### Estado por fase

| Fase | Descripción | Estado |
|---|---|---|
| 0 | Backend fix + infraestructura + UserService + rutas | ⏳ Pendiente |
| 1 | Gestión de usuarios (/admin/users) | ⏳ Pendiente |
| 2 | Perfil propio + TopBar dropdown | ⏳ Pendiente |
| 3 | Tests + cierre Propuesta D | ⏳ Pendiente |
