# Casos de prueba — Módulo Usuarios: Gestión de usuarios y perfil propio

**Módulo:** Usuarios  
**Rutas base:** `/admin/users`, `/admin/profile`  
**Roles con acceso a /admin/users:** ADMIN  
**Roles con acceso a /admin/profile:** ADMIN, MANAGER, WAREHOUSEMAN, SALES  
**Roles sin acceso a /admin/users:** MANAGER, WAREHOUSEMAN, SALES  
**Fecha de creación:** 2026-06-16  
**Última actualización:** 2026-06-16  
**Estado del documento:** ⏳ En desarrollo — implementación pendiente

---

## Cómo usar este documento

1. Cada caso tiene un ID único (`CATEGORIA-PANTALLA-NNN`)
2. Ejecutar cada caso en el browser con el JWT del rol indicado
3. Actualizar la columna **Estado** con el resultado real observado en el browser
4. Si el estado es ❌ FAIL: registrar el bug en §8 de la memoria técnica con referencia al ID
5. Un componente solo está "done" cuando **toda la columna Estado está llena** y **ningún caso está ⏳ PENDIENTE**

**Estados:** `✅ PASS` | `❌ FAIL` | `⏳ PENDIENTE` | `N/A`

**Usuarios QA disponibles (L35):**
- `admin` / `Admin123!` → ROLE_ADMIN
- `qa_manager` / `QaManager123!` → ROLE_MANAGER
- `qa_warehouse` / `QaWarehouse123!` → ROLE_WAREHOUSEMAN
- `qa_sales` / `QaSales123!` → ROLE_SALES

---

## ⚠️ Lecciones MANDATORIAS (L29-L35) — aplicar desde el diseño inicial

- **L29** — No hay campos sensibles económicos en este módulo (no hay precios ni costos). Sí aplica la visibilidad del email: en `/admin/users` solo ADMIN puede ver todos los emails; en `/admin/profile` cada usuario solo ve su propio email.
- **L30** — El endpoint `/auth/login` ya implementa rate limiting (`LoginAttemptService`). No se agregan endpoints de autenticación nuevos en este módulo.
- **L31** — `UserFormDialogComponent` y `ChangePasswordDialogComponent` usan `disableClose: true`. La lista de usuarios (si tiene filtro) debe resetear el paginador a página 0 al filtrar.
- **L32** — La tabla de usuarios usa el mixin SCSS compartido para headers (`%catalog-table-header`), no estilos copiados manualmente.
- **L33** — No hay `forkJoin` multi-fuente en este módulo (los endpoints de usuarios son independientes). Si se agrega en el futuro, usar `catchError` por observable.
- **L34** — Clic en fila de la tabla → abre `UserFormDialogComponent` en modo edición. Sin columna de íconos. El botón "Desactivar" vive DENTRO del diálogo.
- **L35** — Usar los usuarios QA permanentes para verificar RBAC, no crear usuarios efímeros de prueba.

---

## Resumen de cobertura

| Categoría | Total casos | PASS | FAIL | PENDIENTE |
|---|---|---|---|---|
| SEC — Seguridad de rutas | 5 | 0 | 0 | 5 |
| RBAC — Control de acceso UI | 9 | 0 | 0 | 9 |
| CRUD — Flujos de datos | 11 | 0 | 0 | 11 |
| VAL — Validaciones de formulario | 13 | 0 | 0 | 13 |
| BSRCH — Búsqueda e inputs | 3 | 0 | 0 | 3 |
| UI — Botones e íconos | 16 | 0 | 0 | 16 |
| FLOW — Flujos de estado/negocio | 7 | 0 | 0 | 7 |
| RN — Reglas de negocio | 7 | 0 | 0 | 7 |
| ERR — Mensajes de error | 8 | 0 | 0 | 8 |
| EMPTY — Estados vacíos | 2 | 0 | 0 | 2 |
| VIS — Visual y estética | 10 | 0 | 0 | 10 |
| **TOTAL** | **91** | **0** | **0** | **91** |

> Actualizar este resumen cada vez que se completa una sección.

---

## 0. Seguridad de rutas (SEC)

> Verificar con acceso directo por URL — NO basta con esconder el ítem del sidebar.

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| SEC-01 | Acceso directo `/admin/users` con rol MANAGER | qa_manager | Sesión activa con JWT de MANAGER | Redirige a home (`/`); no se muestra la lista de usuarios | ⏳ PENDIENTE | |
| SEC-02 | Acceso directo `/admin/users` con rol WAREHOUSEMAN | qa_warehouse | Sesión activa con JWT de WAREHOUSEMAN | Redirige a home (`/`); no se muestra la lista de usuarios | ⏳ PENDIENTE | |
| SEC-03 | Acceso directo `/admin/users` con rol SALES | qa_sales | Sesión activa con JWT de SALES | Redirige a home (`/`); no se muestra la lista de usuarios | ⏳ PENDIENTE | |
| SEC-04 | Acceso directo `/admin/users` sin JWT (sesión caducada) | (sin JWT) | Token eliminado de localStorage | Redirige a `/login` | ⏳ PENDIENTE | |
| SEC-05 | Acceso directo `/admin/profile` sin JWT | (sin JWT) | Token eliminado de localStorage | Redirige a `/login` | ⏳ PENDIENTE | |

---

## 1. Gestión de usuarios (`UsersPageComponent`) — `/admin/users`

### 1a. Visual y estructura (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-USR-01 | Título de la página visible | admin | "Usuarios" o similar visible como encabezado | ⏳ PENDIENTE | |
| VIS-USR-02 | Columnas de la tabla: Usuario, Email, Roles, Alta | admin | Las 4 columnas visibles con headers | ⏳ PENDIENTE | |
| VIS-USR-03 | Roles de cada usuario mostrados como chips de colores | admin | Chips: ADMIN→`#6B3C6B`, MANAGER→`#1565C0`, WAREHOUSEMAN→`#2E7D32`, SALES→`#E65100` | ⏳ PENDIENTE | |
| VIS-USR-04 | Fecha de alta (`createdAt`) formateada como `dd/MM/yyyy` | admin | Fecha legible; no ISO 8601 en bruto | ⏳ PENDIENTE | |
| VIS-USR-05 | Header de tabla con fondo `#F2E4F2` y texto `#6B3C6B` via mixin SCSS (L32) | admin | Colores de marca correctos; CSS viene del mixin compartido | ⏳ PENDIENTE | |
| VIS-USR-06 | `mat-progress-bar` visible durante carga inicial | admin | Barra indeterminada en parte superior mientras carga | ⏳ PENDIENTE | |
| VIS-USR-07 | Cursor `pointer` en filas; hover cambia el fondo | admin | Comportamiento hover correcto | ⏳ PENDIENTE | |

### 1b. RBAC en lista (RBAC)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-USR-01 | Botón "+ Nuevo usuario" visible | admin | Botón visible en la parte superior derecha | ⏳ PENDIENTE | |
| RBAC-USR-02 | Ítem "Usuarios" visible en sidebar | admin | Ítem con ícono `manage_accounts` visible | ⏳ PENDIENTE | |
| RBAC-USR-03 | Ítem "Usuarios" NO visible en sidebar para MANAGER | qa_manager | Ítem ausente del sidebar | ⏳ PENDIENTE | |
| RBAC-USR-04 | Ítem "Usuarios" NO visible en sidebar para SALES | qa_sales | Ítem ausente del sidebar | ⏳ PENDIENTE | |

### 1c. Búsqueda (BSRCH)

> ⚠️ El backend no tiene endpoint de búsqueda de usuarios por texto — `GET /auth/users` solo acepta `page` y `size`. Si se implementa búsqueda, debe ser client-side (filtrado local sobre la página cargada). Verificar cuál es el enfoque implementado.

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| BSRCH-USR-01 | Filtrar por username (client-side) | admin | Lista cargada con varios usuarios | Filtra la lista visible en tiempo real | ⏳ PENDIENTE | N/A si no se implementa filtro |
| BSRCH-USR-02 | Filtrar es case insensitive | admin | Usuario con username en mayúsculas | Buscar en minúsculas lo encuentra | ⏳ PENDIENTE | N/A si no se implementa filtro |
| BSRCH-USR-03 | Limpiar filtro restaura la lista completa | admin | Filtro activo | Al limpiar, todos los usuarios visibles | ⏳ PENDIENTE | N/A si no se implementa filtro |

### 1d. Botones e íconos en tabla (UI)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-USR-01 | Clic en fila abre `UserFormDialogComponent` en modo edición | admin | Lista cargada | Diálogo abre con datos del usuario precargados | ⏳ PENDIENTE | Patrón L34 |
| UI-USR-02 | Botón "+ Nuevo usuario" abre `UserFormDialogComponent` en modo crear | admin | — | Diálogo abre con todos los campos vacíos | ⏳ PENDIENTE | |
| UI-USR-03 | Paginador visible cuando hay más usuarios que el tamaño de página | admin | Más de 20 usuarios activos en BD | Paginador con total visible | ⏳ PENDIENTE | |
| UI-USR-04 | Cambio de página carga la página correcta del servidor | admin | Paginador con más de 1 página | Filas cambian al ir a página 2 | ⏳ PENDIENTE | |

### 1e. Estados vacíos (EMPTY)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| EMPTY-USR-01 | Lista de usuarios activos vacía (caso extremo) | Ícono + "No hay usuarios registrados" o equivalente | ⏳ PENDIENTE | Difícil de reproducir — al menos existe el usuario `admin` |
| EMPTY-USR-02 | Filtro client-side sin resultados (si se implementa búsqueda) | Ícono + "Sin resultados para el término buscado" | ⏳ PENDIENTE | N/A si no hay filtro |

---

## 2. Formulario de usuario (`UserFormDialogComponent`)

### 2a. Apertura y visual (UI / VIS)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-UFMD-01 | Diálogo crear: título "Nuevo usuario" | admin | Clic en "+ Nuevo usuario" | Título correcto; todos los campos vacíos | ⏳ PENDIENTE | |
| UI-UFMD-02 | Diálogo editar: título "Editar usuario" con el username | admin | Clic en fila de usuario existente | Título con el nombre del usuario; datos precargados | ⏳ PENDIENTE | |
| UI-UFMD-03 | Modo crear: campo Contraseña visible | admin | Diálogo en modo crear | Campo password presente con tipo `password` | ⏳ PENDIENTE | |
| UI-UFMD-04 | Modo editar: campo Contraseña NO visible | admin | Diálogo en modo editar | Campo password ausente del DOM | ⏳ PENDIENTE | La contraseña no es editable por el admin desde aquí |
| UI-UFMD-05 | Click en backdrop/ESC no cierra el diálogo (L31, `disableClose: true`) | admin | Diálogo abierto con cambios | Diálogo permanece abierto | ⏳ PENDIENTE | |
| UI-UFMD-06 | Campos obligatorios tienen `*` (solo uno, no `**`) | admin | Diálogo abierto | Un solo `*` por campo obligatorio | ⏳ PENDIENTE | |
| UI-UFMD-07 | Sección de roles: 4 checkboxes con etiquetas legibles | admin | Diálogo en modo crear | ADMIN, Manager, Almacenista, Ventas como checkboxes | ⏳ PENDIENTE | Etiquetas en español, valores internos ROLE_X |
| UI-UFMD-08 | Botón "Cancelar" cierra el diálogo sin guardar | admin | Diálogo con cambios | Cierra; lista no cambia | ⏳ PENDIENTE | |

### 2b. RBAC en formulario (RBAC)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-UFMD-01 | Botón "Desactivar usuario" visible para usuario distinto al propio | admin | Botón visible si el usuario a editar ≠ `admin` logueado | ⏳ PENDIENTE | |
| RBAC-UFMD-02 | Botón "Desactivar usuario" NO visible al editar la propia cuenta | admin | Admin edita su propio registro → botón ausente del DOM | ⏳ PENDIENTE | RN-USR-04 |

### 2c. Validaciones al crear (VAL)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-UFMD-01 | Username vacío → error visible | Campo vacío | Error "El nombre de usuario es obligatorio" bajo el campo | ⏳ PENDIENTE | |
| VAL-UFMD-02 | Username con más de 50 caracteres | 51 chars | Error o campo no acepta más de 50 | ⏳ PENDIENTE | |
| VAL-UFMD-03 | Email vacío → error visible | Campo vacío | Error "El email es obligatorio" | ⏳ PENDIENTE | |
| VAL-UFMD-04 | Email con formato inválido | "noesun@email" o "sinArroba" | Error "El email no tiene un formato válido" | ⏳ PENDIENTE | |
| VAL-UFMD-05 | Contraseña vacía (modo crear) | Campo vacío | Error "La contraseña es obligatoria" | ⏳ PENDIENTE | |
| VAL-UFMD-06 | Contraseña menor a 8 caracteres (modo crear) | 7 chars | Error "La contraseña debe tener al menos 8 caracteres" | ⏳ PENDIENTE | |
| VAL-UFMD-07 | Sin ningún rol seleccionado → botón Guardar deshabilitado | Todos los checkboxes desmarcados | Botón "Crear usuario"/"Guardar" deshabilitado + mensaje de error visible | ⏳ PENDIENTE | |
| VAL-UFMD-08 | Botón Guardar deshabilitado con formulario inválido | Campos inválidos | `disabled:true` en el DOM | ⏳ PENDIENTE | |
| VAL-UFMD-09 | Botón Guardar deshabilitado en modo editar al cargar (sin cambios) (L25) | Diálogo recién abierto | `disabled:true` — `form.dirty = false` | ⏳ PENDIENTE | |
| VAL-UFMD-10 | Botón Guardar se activa al modificar un campo | Formulario cargado → editar username | `disabled:false` después del cambio | ⏳ PENDIENTE | |
| VAL-UFMD-11 | Botón Guardar se desactiva después de guardar exitosamente | Guardar exitoso | `disabled:true` — `markAsPristine()` ejecutado | ⏳ PENDIENTE | |

### 2d. CRUD — Crear usuario (CRUD)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-UFMD-01 | Crear usuario con todos los datos válidos y 1 rol | Formulario completo; username y email únicos | Snackbar verde "Usuario creado correctamente."; diálogo cierra; nuevo usuario visible en la lista | ⏳ PENDIENTE | |
| CRUD-UFMD-02 | Crear usuario con múltiples roles asignados | 2 o más checkboxes marcados | Usuario creado con todos los roles seleccionados; chips visibles en la lista | ⏳ PENDIENTE | |
| CRUD-UFMD-03 | Lista refleja el nuevo usuario sin recargar la página | Crear exitoso | Nuevo usuario aparece en la tabla | ⏳ PENDIENTE | |

### 2e. CRUD — Editar usuario (CRUD)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-UFMD-04 | Editar username de un usuario | Usuario activo | Snackbar verde "Usuario actualizado correctamente."; lista muestra el nuevo username | ⏳ PENDIENTE | |
| CRUD-UFMD-05 | Editar email de un usuario | Usuario activo | Snackbar verde; lista muestra el nuevo email | ⏳ PENDIENTE | |
| CRUD-UFMD-06 | Cambiar roles de un usuario (PUT /users/{id}/roles) | Usuario con rol A → cambiar a rol B | Snackbar verde; chips de roles actualizados en la lista | ⏳ PENDIENTE | Debe llamar al endpoint de roles separado |

### 2f. CRUD — Desactivar usuario (CRUD)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-UFMD-07 | Clic en "Desactivar usuario" → diálogo de confirmación | Usuario activo distinto al propio | Modal de confirmación con botones Confirmar/Cancelar | ⏳ PENDIENTE | |
| CRUD-UFMD-08 | Cancelar desactivación → usuario permanece activo | Diálogo de confirmación abierto | Diálogo cierra; usuario sigue en la lista | ⏳ PENDIENTE | |
| CRUD-UFMD-09 | Confirmar desactivación → usuario desaparece de la lista | Confirmar en el diálogo | Snackbar verde "Usuario desactivado."; usuario ya no aparece en la tabla | ⏳ PENDIENTE | RN-USR-05: GET /users solo devuelve activos |

---

## 3. Perfil propio (`ProfilePageComponent`) — `/admin/profile`

### 3a. Visual y estructura (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-PROF-01 | Datos del propio usuario visibles: username, email, roles, fecha de alta | admin | Todos los campos con datos correctos del JWT / GET /me | ⏳ PENDIENTE | |
| VIS-PROF-02 | Roles mostrados como chips de colores semánticos | qa_manager | Chip MANAGER con color `#1565C0` | ⏳ PENDIENTE | |
| VIS-PROF-03 | `updatedAt` null → muestra "—" (no "null" ni crash) | admin | Si el usuario nunca fue editado, campo muestra "—" | ⏳ PENDIENTE | |
| VIS-PROF-04 | Breadcrumb "Mi perfil" visible en la topbar | admin | "Mi perfil" en el breadcrumb al navegar a /admin/profile | ⏳ PENDIENTE | Requiere agregar entrada al BREADCRUMB_MAP |

### 3b. Botones e íconos en perfil (UI)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-PROF-01 | Botón "Cambiar contraseña" visible para todos los roles | qa_sales | En /admin/profile con sesión de SALES | Botón visible | ⏳ PENDIENTE | |
| UI-PROF-02 | Clic en "Cambiar contraseña" abre `ChangePasswordDialogComponent` | admin | — | Diálogo con 3 campos de contraseña | ⏳ PENDIENTE | |

---

## 4. Diálogo de cambio de contraseña (`ChangePasswordDialogComponent`)

### 4a. Visual y validaciones (UI / VAL)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| UI-CHPWD-01 | Diálogo tiene 3 campos: contraseña actual, nueva, confirmar | Diálogo abierto | Los 3 campos tipo `password` visibles | ⏳ PENDIENTE | |
| UI-CHPWD-02 | Click backdrop/ESC no cierra (L31, `disableClose: true`) | Diálogo abierto con cambios | Diálogo permanece abierto | ⏳ PENDIENTE | |
| VAL-CHPWD-01 | Contraseña actual vacía → error visible | Campo vacío | Error "La contraseña actual es obligatoria" | ⏳ PENDIENTE | |
| VAL-CHPWD-02 | Nueva contraseña < 8 caracteres → error visible | 7 chars | Error "La nueva contraseña debe tener al menos 8 caracteres" | ⏳ PENDIENTE | |
| VAL-CHPWD-03 | Nueva ≠ confirmar → error preventivo visible ANTES de guardar | Valores distintos | Error "Las contraseñas no coinciden" visible en tiempo real | ⏳ PENDIENTE | Validación preventiva client-side (RN-USR-08) |
| VAL-CHPWD-04 | Botón "Cambiar contraseña" deshabilitado si formulario inválido | Campos inválidos | `disabled:true` | ⏳ PENDIENTE | |

---

## 5. TopBar — Dropdown de usuario

### 5a. Botones e íconos (UI / RBAC)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-TOP-01 | Clic en chip de usuario abre dropdown con opciones | admin | Sesión activa | Menú con "Mi perfil" y "Cerrar sesión" visible | ⏳ PENDIENTE | |
| UI-TOP-02 | Dropdown "Mi perfil" navega a `/admin/profile` | admin | Dropdown abierto | Navega a /admin/profile; breadcrumb "Mi perfil" | ⏳ PENDIENTE | |
| UI-TOP-03 | Dropdown "Cerrar sesión" hace logout | admin | Dropdown abierto | Token eliminado; redirige a /login | ⏳ PENDIENTE | |
| UI-TOP-04 | Dropdown visible para todos los roles | qa_sales | Sesión con SALES | Chip clickeable; dropdown con mismas opciones | ⏳ PENDIENTE | |

---

## 6. Flujos de estado/negocio (FLOW)

| ID | Pantalla | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|---|
| FLOW-USR-01 | Gestión usuarios | Ciclo completo: crear → editar → desactivar | admin | — | Usuario creado con un rol, editado con nuevo email, luego desactivado y desaparece de la lista | ⏳ PENDIENTE | |
| FLOW-USR-02 | Gestión usuarios | Crear usuario con rol SALES → verificar que puede iniciar sesión | admin | Usuario creado | Login con las credenciales del nuevo usuario → JWT válido con ROLE_SALES | ⏳ PENDIENTE | |
| FLOW-USR-03 | Gestión usuarios | Cambiar roles de SALES a MANAGER → verificar acceso ampliado | admin | Usuario con ROLE_SALES | Asignar ROLE_MANAGER → usuario puede acceder a /reports/analytics | ⏳ PENDIENTE | |
| FLOW-PROF-01 | Perfil | Cambio de contraseña exitoso → sesión continúa activa | admin | Sesión activa | 204 → snackbar verde → diálogo cierra → token NO se elimina → puede seguir usando la app | ⏳ PENDIENTE | |
| FLOW-PROF-02 | Perfil | Contraseña actual incorrecta → error del backend | admin | Contraseña incorrecta en el campo | Snackbar rojo con mensaje del backend (500 → mensaje "La contraseña actual es incorrecta.") | ⏳ PENDIENTE | Ver RN-USR-07; el error es HTTP 500 hasta que se aplique el fix del backend |
| FLOW-TOP-01 | TopBar | Logout desde dropdown → redirige a login | admin | Sesión activa | Token eliminado de localStorage; redirige a /login | ⏳ PENDIENTE | |
| FLOW-TOP-02 | TopBar | Sesión expirada (JWT caducado) → al hacer cualquier acción redirige a login | (cualquier rol) | JWT expirado | 401 en cualquier petición → interceptor redirige a /login con mensaje "Tu sesión ha expirado." | ⏳ PENDIENTE | |

---

## 7. Reglas de negocio (RN)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RN-USR-01 | Crear usuario con username ya existente → error | Username duplicado en BD | Snackbar rojo "El nombre de usuario '...' ya está registrado." (409 post-fix; 500 pre-fix) | ⏳ PENDIENTE | |
| RN-USR-02 | Crear usuario con email ya existente → error | Email duplicado en BD | Snackbar rojo "El email '...' ya está registrado." | ⏳ PENDIENTE | |
| RN-USR-03 | Editar usuario con username ya usado por otro → error | Username ya existe para otro user | Snackbar rojo con mensaje del backend | ⏳ PENDIENTE | |
| RN-USR-04 | Admin no puede desactivar su propia cuenta | ADMIN edita su propio registro | Botón "Desactivar" ausente del DOM para el propio usuario | ⏳ PENDIENTE | Verificar que la lógica usa `user.id === authService.getCurrentUserId()` |
| RN-USR-05 | Usuarios desactivados no aparecen en la lista | Usuario desactivado en BD | GET /users no los incluye; tabla solo muestra activos | ⏳ PENDIENTE | |
| RN-USR-06 | PUT /roles reemplaza TODOS los roles (semántica PUT) | Usuario con ROLE_ADMIN → cambiar a ROLE_SALES | Usuario pierde ROLE_ADMIN; solo tiene ROLE_SALES | ⏳ PENDIENTE | Riesgo: verificar que no queda con roles adicionales no seleccionados |
| RN-USR-07 | Cambiar contraseña con contraseña actual correcta → éxito | Contraseña actual correcta | 204 → snackbar verde "Contraseña cambiada correctamente." | ⏳ PENDIENTE | |

---

## 8. Mensajes de error y éxito (ERR)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| ERR-USR-01 | Snackbar verde en crear usuario exitoso | Crear exitoso | Fondo `#2E7D32`; mensaje "Usuario creado correctamente." | ⏳ PENDIENTE | |
| ERR-USR-02 | Snackbar verde en editar usuario exitoso | Editar exitoso | Fondo `#2E7D32`; mensaje "Usuario actualizado correctamente." | ⏳ PENDIENTE | |
| ERR-USR-03 | Snackbar verde en desactivar usuario exitoso | Desactivar exitoso | Fondo `#2E7D32`; mensaje "Usuario desactivado." | ⏳ PENDIENTE | |
| ERR-USR-04 | Snackbar verde en cambio de contraseña exitoso | PUT /me/password → 204 | Fondo `#2E7D32`; mensaje "Contraseña cambiada correctamente." | ⏳ PENDIENTE | |
| ERR-USR-05 | Error backend username/email duplicado → snackbar rojo con mensaje específico | Username duplicado al crear | Fondo `#C62828`; texto exacto del backend visible | ⏳ PENDIENTE | |
| ERR-USR-06 | Error backend contraseña actual incorrecta → snackbar rojo | Contraseña incorrecta | Fondo `#C62828`; mensaje "La contraseña actual es incorrecta." | ⏳ PENDIENTE | HTTP 500 pre-fix; el mensaje sí viene en `error.error.message` |
| ERR-USR-07 | Error de red (backend apagado) al cargar lista → mensaje útil | Backend detenido | Snackbar rojo "Error al cargar los usuarios."; sin pantalla en blanco | ⏳ PENDIENTE | |
| ERR-USR-08 | Error HTTP 401 (JWT expirado) → interceptor redirige a login | JWT expirado | Redirect a `/login` con mensaje "Tu sesión ha expirado." | ⏳ PENDIENTE | |

---

## 9. Visual general del módulo (VIS)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| VIS-GEN-01 | Breadcrumb "Usuarios" en `/admin/users` | "Usuarios" en la topbar | ⏳ PENDIENTE | Ya registrado en BREADCRUMB_MAP línea 30 |
| VIS-GEN-02 | Breadcrumb "Mi perfil" en `/admin/profile` | "Mi perfil" en la topbar | ⏳ PENDIENTE | Requiere agregar al BREADCRUMB_MAP |
| VIS-GEN-03 | Botón "+ Nuevo usuario" con color primario `#6B3C6B` | Botón con color de marca correcto | ⏳ PENDIENTE | |
| VIS-GEN-04 | Botón "Desactivar usuario" con color `warn` (rojo) | Botón en rojo | ⏳ PENDIENTE | |
| VIS-GEN-05 | Diálogos son modales — click fuera no cierra (L31) | Click backdrop no cierra ningún diálogo del módulo | ⏳ PENDIENTE | |
| VIS-GEN-06 | Chip de usuario en TopBar ahora es un botón con flecha ▼ | Chip clickeable con indicador de dropdown | ⏳ PENDIENTE | |
| VIS-GEN-07 | Usuario activo (propio) en la lista resaltado visualmente | Fila del usuario logueado con indicador visual | ⏳ PENDIENTE | N/A si no se implementa este indicador |
| VIS-GEN-08 | `mat-progress-bar` visible durante carga de GET /me en perfil | Barra en parte superior de /admin/profile mientras carga | ⏳ PENDIENTE | |
| VIS-GEN-09 | Campos de contraseña tienen ícono de mostrar/ocultar (toggle visibility) | Ícono ojo en campos password del diálogo de cambio de contraseña | ⏳ PENDIENTE | N/A si no se implementa |
| VIS-GEN-10 | Formulario diálogo con `fondo #F2E4F2` (lavanda) o card blanca sobre fondo gris | Colores de marca correctos dentro del diálogo | ⏳ PENDIENTE | |

---

## Historial de bugs encontrados en este módulo

| Bug ID | Descripción | Dónde se encontró | Estado |
|---|---|---|---|
| — | (sin bugs aún — implementación pendiente) | — | — |

---

## Checklist de cierre (Propuesta D)

Antes de declarar el módulo **done**, verificar que se cumplen las 4 condiciones:

```
[ ] 1. Todos los 91 casos de este documento tienen estado ✅ PASS o N/A — ninguna fila ⏳ PENDIENTE
[ ] 2. ng test --no-watch → 0 fallos; cobertura ≥ 70% statements
[ ] 3. Prueba browser completada con los 4 roles (admin, qa_manager, qa_warehouse, qa_sales)
[ ] 4. Memoria técnica §10 actualizada con resultado final
```

### Checklist adicional — Lecciones L29-L35 (mandatorio)

```
[ ] L29 — No hay campos económicos sensibles. Documentado en §4 de la memoria técnica.
[ ] L30 — No hay endpoints de autenticación nuevos. LoginAttemptService ya activo.
[ ] L31 — UserFormDialogComponent y ChangePasswordDialogComponent usan disableClose: true
[ ] L31 — Paginador de lista de usuarios resetea a página 0 al filtrar (si se implementa filtro)
[ ] L32 — Tabla de usuarios usa mixin SCSS compartido para headers (no copia manual)
[ ] L33 — No aplica forkJoin multi-fuente en este módulo (documentado en §9 de la memoria)
[ ] L34 — Clic en fila → diálogo editar; sin columna de íconos de acción; "Desactivar" dentro del diálogo
[ ] L35 — Verificación RBAC con usuarios QA permanentes (admin, qa_manager, qa_warehouse, qa_sales)
[ ] ⚠️ Backend fix verificado: POST /users con username duplicado → 409 (no 500)
[ ] ⚠️ Backend fix verificado: DELETE /users/{propio-id} → 422 (no 500)
```
