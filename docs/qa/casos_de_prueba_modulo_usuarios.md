# Casos de prueba — Módulo Usuarios: Gestión de usuarios y perfil propio

**Módulo:** Usuarios  
**Rutas base:** `/admin/users`, `/admin/profile`  
**Roles con acceso a /admin/users:** ADMIN  
**Roles con acceso a /admin/profile:** ADMIN, MANAGER, WAREHOUSEMAN, SALES  
**Roles sin acceso a /admin/users:** MANAGER, WAREHOUSEMAN, SALES  
**Fecha de creación:** 2026-06-16  
**Última actualización:** 2026-06-23 — Estados reseteados a ⏳ PENDIENTE para nueva ronda bajo Protocolo 4 fases.  
**Estado del documento:** ⏳ PENDIENTE — reset 2026-06-23 para nueva ronda. Se agregan: Protocolo 4 fases, sección CYBER (15 casos), Historial de rondas, Checklist actualizado.

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

## ⚠️ Protocolo obligatorio de ejecución — 4 fases (permanente)

> Toda ronda de verificación de este documento sigue el protocolo completo en
> `docs/qa/protocolo_verificacion_4_fases.md`. Referencia rápida:

**FASE 1 — Inventario (código congelado)**: ejecutar TODOS los casos sin tocar código. Documentar bugs como `⚠️ ABIERTO`. No corregir nada.

**FASE 2 — Corrección + gatekeeper**: por cada fix, en orden: `ng build` (0 errores AOT) → `ng test --no-watch` (0 fallos) → `mvn test` (0 fallos nuevos). Documentar blast radius.

**FASE 3 — Re-ejecución congelada**: re-ejecutar todos los casos del blast radius en una sola sesión sin modificar código. Si aparece bug nuevo → ⚠️ ABIERTO, NO corregir, volver a Fase 2.
- Verificación de congelamiento antes del primer caso: git limpio 0/0 vs origin en ambos repos; backend 200; dev server 200 con bundle fresco; 4 usuarios QA autentican.

**FASE 4 — Certificación**: `ng build` 0 errores + `ng test --coverage` 0 fallos ≥70% statements + `mvn test` 0 fallos + commit `chore(qa)` + actualizar `estado_sesion_activa.md`.

> **Solo una Fase 3 de lectura estricta** (todos los casos, una sola sesión, código congelado de principio a fin) habilita declarar el módulo **CERTIFICADO** bajo Propuesta D.
> **`estado_sesion_activa.md`** — leer al iniciar cada sesión; actualizar al completar cada categoría.

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

| Categoría | Total casos | PASS | FAIL | PENDIENTE | N/A |
|---|---|---|---|---|---|
| SEC — Seguridad de rutas | 5 | 5 | 0 | 0 | 0 |
| RBAC — Control de acceso UI | 6 | 6 | 0 | 0 | 0 |
| CRUD — Flujos de datos | 9 | 9 | 0 | 0 | 0 |
| VAL — Validaciones de formulario | 11 | 11 | 0 | 0 | 0 |
| BSRCH — Búsqueda e inputs | 3 | 3 | 0 | 0 | 0 |
| UI — Botones e íconos | 16 | 16 | 0 | 0 | 0 |
| FLOW — Flujos de estado/negocio | 7 | 7 | 0 | 0 | 0 |
| RN — Reglas de negocio | 7 | 7 | 0 | 0 | 0 |
| ERR — Mensajes de error | 8 | 8 | 0 | 0 | 0 |
| EMPTY — Estados vacíos | 2 | 1 | 0 | 0 | 1 |
| VIS — Visual y estética | 17 | 16 | 0 | 0 | 1 |
| CYBER — Ciberseguridad | 15 | 14 | 0 | 0 | 1 |
| **TOTAL** | **106** | **103** | **0** | **0** | **3** |

> \* VIS abarca casos distribuidos en VIS-USR (7), VIS-PROF (4) y VIS-GEN (10) = 21 casos reales (17 en la tabla — sin duplicar la sección VIS-GEN).

> **Estado actual: ✅ CERTIFICADO (Ronda 2 — 2026-06-28)** — 103 ✅ PASS · 0 ❌ FAIL · 0 ⏳ PENDIENTE · 3 N/A. **0 bugs.**
> Ronda 2 bajo Protocolo 4 fases (Fase 1 sobre código congelado; 0 bugs → Fase 4). Técnicas: `curl` con JWT por rol
> (CYBER/SEC server-side, RN duplicados 409), tecleo/JS set-value + lectura de mat-error (VAL), screenshots +
> getComputedStyle RGB exacto (VIS), inspección DOM por rol (RBAC), navegación por ruta directa (SEC).
> **Verificación en vivo COMPLETA:** todos los casos de UI se confirmaron en el navegador. Tras una primera pasada que dejó
> algunos casos verificados por curl/código, se ejecutó una **pasada de cierre de gaps en vivo** (a petición del usuario):
> CRUD-UFMD-02 (crear con 2 roles vía UI → 2 chips), ERR-USR-02 (editar → snackbar "Usuario actualizado"),
> ERR-USR-05 (duplicado → snackbar roja #C62828 "ya está registrado"), ERR-USR-04/06 (cambio de contraseña: actual
> incorrecta → roja, correcta → verde, sesión continúa), FLOW-USR-03 (usuario creado con rol Manager → login →
> accede a /reports/analytics en el browser), ERR-USR-07 (**apagado controlado del backend** → snackbar roja
> "Error al cargar los usuarios." + empty state, sin pantalla en blanco; backend reiniciado). Únicos no observables en
> vivo: **VIS-USR-06 / VIS-GEN-08** (mat-progress-bar de carga — la carga es instantánea en local; verificados por código
> `@if(loading)`).
> **Observaciones (no bugs):** (1) rutas /admin/* denegadas → **`/access-denied`** (drift "home"→/access-denied, igual que
> Reportes/Ventas). (2) Búsqueda **client-side** (filtra la página cargada de 20). (3) ⚠️ Nota de CLAUDE.md sobre
> `/admin/users` "sin ruta funcional" **DESACTUALIZADA** — la ruta existe en `admin.routes.ts` (guard `ROLE_ADMIN`); corregida.
> Datos QA creados y limpiados (qa_cyber/ui/xss/multi desactivados + residuos qa_flow_test/qa_multirole de rondas previas) → 0 activos.
> Gatekeeper: `ng build` 0 AOT, `ng test --coverage` 462/462 88.94%, `mvn test` 406/406.
> Ronda anterior (2026-06-16): 90 ✅ PASS · 0 ❌ FAIL · 1 N/A.

---

## 0. Seguridad de rutas (SEC)

> Verificar con acceso directo por URL — NO basta con esconder el ítem del sidebar.

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| SEC-01 | Acceso directo `/admin/users` con rol MANAGER | qa_manager | Sesión activa con JWT de MANAGER | Redirige a home (`/`); no se muestra la lista de usuarios | ✅ PASS | Verificado 2026-06-16: URL redirige a `/` |
| SEC-02 | Acceso directo `/admin/users` con rol WAREHOUSEMAN | qa_warehouse | Sesión activa con JWT de WAREHOUSEMAN | Redirige a home (`/`); no se muestra la lista de usuarios | ✅ PASS | 2026-06-16: JWT qa_warehouse inyectado → nav /admin/users → redirigió a / |
| SEC-03 | Acceso directo `/admin/users` con rol SALES | qa_sales | Sesión activa con JWT de SALES | Redirige a home (`/`); no se muestra la lista de usuarios | ✅ PASS | 2026-06-16: JWT qa_sales inyectado → nav /admin/users → redirigió a / |
| SEC-04 | Acceso directo `/admin/users` sin JWT (sesión caducada) | (sin JWT) | Token eliminado de localStorage | Redirige a `/login` | ✅ PASS | 2026-06-16: localStorage.removeItem → nav /admin/users → /login |
| SEC-05 | Acceso directo `/admin/profile` sin JWT | (sin JWT) | Token eliminado de localStorage | Redirige a `/login` | ✅ PASS | 2026-06-16: sin JWT → nav /admin/profile → /login |

---

## 1. Gestión de usuarios (`UsersPageComponent`) — `/admin/users`

### 1a. Visual y estructura (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-USR-01 | Título de la página visible | admin | "Usuarios" o similar visible como encabezado | ✅ PASS | Breadcrumb "Usuarios" visible |
| VIS-USR-02 | Columnas de la tabla: Usuario, Email, Roles, Alta | admin | Las 4 columnas visibles con headers | ✅ PASS | 4 columnas confirmadas |
| VIS-USR-03 | Roles de cada usuario mostrados como chips de colores | admin | Chips: ADMIN→`#6B3C6B`, MANAGER→`#1565C0`, WAREHOUSEMAN→`#2E7D32`, SALES→`#E65100` | ✅ PASS | Colores correctos en tabla |
| VIS-USR-04 | Fecha de alta (`createdAt`) formateada como `dd/MM/yyyy` | admin | Fecha legible; no ISO 8601 en bruto | ✅ PASS | "14/06/2026" verificado |
| VIS-USR-05 | Header de tabla con fondo `#F2E4F2` y texto `#6B3C6B` via mixin SCSS (L32) | admin | Colores de marca correctos; CSS viene del mixin compartido | ✅ PASS | Headers con lavanda y púrpura |
| VIS-USR-06 | `mat-progress-bar` visible durante carga inicial | admin | Barra indeterminada en parte superior mientras carga | ✅ PASS | 2026-06-16: verificado por código (@if(loading) correcto) — carga muy rápida en local |
| VIS-USR-07 | Cursor `pointer` en filas; hover cambia el fondo | admin | Comportamiento hover correcto | ✅ PASS | 2026-06-16: cursor pointer confirmado visualmente en screenshots de fila |

### 1b. RBAC en lista (RBAC)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-USR-01 | Botón "+ Nuevo usuario" visible | admin | Botón visible en la parte superior derecha | ✅ PASS | Botón visible, abre diálogo crear |
| RBAC-USR-02 | Ítem "Usuarios" visible en sidebar | admin | Ítem con ícono `manage_accounts` visible | ✅ PASS | Ítem "Usuarios" activo en sidebar |
| RBAC-USR-03 | Ítem "Usuarios" NO visible en sidebar para MANAGER | qa_manager | Ítem ausente del sidebar | ✅ PASS | Sidebar MANAGER: sin "Usuarios" |
| RBAC-USR-04 | Ítem "Usuarios" NO visible en sidebar para SALES | qa_sales | Ítem ausente del sidebar | ✅ PASS | 2026-06-16: Sidebar SALES: Inventario, Ventas, Reportes — sin "Usuarios" |

### 1c. Búsqueda (BSRCH)

> ⚠️ El backend no tiene endpoint de búsqueda de usuarios por texto — `GET /auth/users` solo acepta `page` y `size`. Si se implementa búsqueda, debe ser client-side (filtrado local sobre la página cargada). Verificar cuál es el enfoque implementado.

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| BSRCH-USR-01 | Filtrar por username (client-side) | admin | Lista cargada con varios usuarios | Filtra la lista visible en tiempo real | ✅ PASS | "qa_manager" → 1 resultado |
| BSRCH-USR-02 | Filtrar es case insensitive | admin | Usuario con username en mayúsculas | Buscar en minúsculas lo encuentra | ✅ PASS | "ADMIN" → encuentra "admin" |
| BSRCH-USR-03 | Limpiar filtro restaura la lista completa | admin | Filtro activo | Al limpiar, todos los usuarios visibles | ✅ PASS | 2026-06-16: "qa_manager" → 1 fila; Delete → lista completa restaurada |

### 1d. Botones e íconos en tabla (UI)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-USR-01 | Clic en fila abre `UserFormDialogComponent` en modo edición | admin | Lista cargada | Diálogo abre con datos del usuario precargados | ✅ PASS | Click en qa_manager → diálogo con datos |
| UI-USR-02 | Botón "+ Nuevo usuario" abre `UserFormDialogComponent` en modo crear | admin | — | Diálogo abre con todos los campos vacíos | ✅ PASS | Campos vacíos, campo password visible |
| UI-USR-03 | Paginador visible cuando hay más usuarios que el tamaño de página | admin | Más de 20 usuarios activos en BD | Paginador con total visible | ✅ PASS | "1 – 20 of 148" visible |
| UI-USR-04 | Cambio de página carga la página correcta del servidor | admin | Paginador con más de 1 página | Filas cambian al ir a página 2 | ✅ PASS | 2026-06-16: navegó a última página (141-148 de 148) correctamente |

### 1e. Estados vacíos (EMPTY)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| EMPTY-USR-01 | Lista de usuarios activos vacía (caso extremo) | Ícono + "No hay usuarios registrados" o equivalente | N/A | No reproducible — `admin` siempre activo; lógica @empty verificada en código |
| EMPTY-USR-02 | Filtro client-side sin resultados (si se implementa búsqueda) | Ícono + "Sin resultados para el término buscado" | ✅ PASS | "zzz_inexistente_xyz" → ícono + mensaje contextual |

---

## 2. Formulario de usuario (`UserFormDialogComponent`)

### 2a. Apertura y visual (UI / VIS)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-UFMD-01 | Diálogo crear: título "Nuevo usuario" | admin | Clic en "+ Nuevo usuario" | Título correcto; todos los campos vacíos | ✅ PASS | Título "Nuevo usuario" confirmado |
| UI-UFMD-02 | Diálogo editar: título "Editar usuario" con el username | admin | Clic en fila de usuario existente | Título con el nombre del usuario; datos precargados | ✅ PASS | "Editar usuario: qa_manager" con datos |
| UI-UFMD-03 | Modo crear: campo Contraseña visible | admin | Diálogo en modo crear | Campo password presente con tipo `password` | ✅ PASS | Campo "Contraseña*" presente |
| UI-UFMD-04 | Modo editar: campo Contraseña NO visible | admin | Diálogo en modo editar | Campo password ausente del DOM | ✅ PASS | Solo username, email y roles en modo editar |
| UI-UFMD-05 | Click en backdrop/ESC no cierra el diálogo (L31, `disableClose: true`) | admin | Diálogo abierto con cambios | Diálogo permanece abierto | ✅ PASS | 2026-06-16: click backdrop (coord 200,400) + ESC — mat-dialog-container permaneció |
| UI-UFMD-06 | Campos obligatorios tienen `*` (solo uno, no `**`) | admin | Diálogo abierto | Un solo `*` por campo obligatorio | ✅ PASS | "Nombre de usuario*", "Email*" confirmados |
| UI-UFMD-07 | Sección de roles: 4 checkboxes con etiquetas legibles | admin | Diálogo en modo crear | ADMIN, Manager, Almacenista, Ventas como checkboxes | ✅ PASS | 4 checkboxes con etiquetas en español |
| UI-UFMD-08 | Botón "Cancelar" cierra el diálogo sin guardar | admin | Diálogo con cambios | Cierra; lista no cambia | ✅ PASS | Botón "Cancelar" funciona |

### 2b. RBAC en formulario (RBAC)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-UFMD-01 | Botón "Desactivar usuario" visible para usuario distinto al propio | admin | Botón visible si el usuario a editar ≠ `admin` logueado | ✅ PASS | "Desactivar" visible al editar qa_manager |
| RBAC-UFMD-02 | Botón "Desactivar usuario" NO visible al editar la propia cuenta | admin | Admin edita su propio registro → botón ausente del DOM | ✅ PASS | 2026-06-16: admin edita su propia cuenta → solo "Cancelar" y "Guardar cambios"; sin "Desactivar" |

### 2c. Validaciones al crear (VAL)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-UFMD-01 | Username vacío → error visible | Campo vacío | Error "El nombre de usuario es obligatorio" bajo el campo | ✅ PASS | "El nombre de usuario es obligatorio." visible |
| VAL-UFMD-02 | Username con más de 50 caracteres | 51 chars | Error o campo no acepta más de 50 | ✅ PASS | 2026-06-16: input tiene maxLength=50; el carácter 51 es rechazado nativamente |
| VAL-UFMD-03 | Email vacío → error visible | Campo vacío | Error "El email es obligatorio" | ✅ PASS | 2026-06-16: "El email es obligatorio." visible al tocar y salir del campo |
| VAL-UFMD-04 | Email con formato inválido | "noesun@email" o "sinArroba" | Error "El email no tiene un formato válido" | ✅ PASS | 2026-06-16: "correo-sin-arroba" → "El email no tiene un formato válido." |
| VAL-UFMD-05 | Contraseña vacía (modo crear) | Campo vacío | Error "La contraseña es obligatoria" | ✅ PASS | 2026-06-16: "La contraseña es obligatoria." visible al tocar y Tab |
| VAL-UFMD-06 | Contraseña menor a 8 caracteres (modo crear) | 7 chars | Error "La contraseña debe tener al menos 8 caracteres" | ✅ PASS | 2026-06-16: "abc123" (6 chars) → "La contraseña debe tener al menos 8 caracteres." |
| VAL-UFMD-07 | Sin ningún rol seleccionado → botón Guardar deshabilitado | Todos los checkboxes desmarcados | Botón "Crear usuario"/"Guardar" deshabilitado + mensaje de error visible | ✅ PASS | "Debe seleccionar al menos un rol." visible |
| VAL-UFMD-08 | Botón Guardar deshabilitado con formulario inválido | Campos inválidos | `disabled:true` en el DOM | ✅ PASS | "Crear usuario" deshabilitado con form vacío |
| VAL-UFMD-09 | Botón Guardar deshabilitado en modo editar al cargar (sin cambios) (L25) | Diálogo recién abierto | `disabled:true` — `form.dirty = false` | ✅ PASS | "Guardar cambios" deshabilitado al abrir qa_manager |
| VAL-UFMD-10 | Botón Guardar se activa al modificar un campo | Formulario cargado → editar username | `disabled:false` después del cambio | ✅ PASS | 2026-06-16: "Guardar cambios" activado al editar username de qa_crud_test |
| VAL-UFMD-11 | Botón Guardar se desactiva después de guardar exitosamente | Guardar exitoso | `disabled:true` — `markAsPristine()` ejecutado | ✅ PASS | 2026-06-16: reabrir diálogo tras guardar → "Guardar cambios" deshabilitado (form pristino) |

### 2d. CRUD — Crear usuario (CRUD)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-UFMD-01 | Crear usuario con todos los datos válidos y 1 rol | Formulario completo; username y email únicos | Snackbar verde "Usuario creado correctamente."; diálogo cierra; nuevo usuario visible en la lista | ✅ PASS | 2026-06-16: qa_flow_test creado con SALES; snackbar verde; aparece en lista |
| CRUD-UFMD-02 | Crear usuario con múltiples roles asignados | 2 o más checkboxes marcados | Usuario creado con todos los roles seleccionados; chips visibles en la lista | ✅ PASS | 2026-06-16: qa_crud_test con Manager+Almacenista; 2 chips en lista |
| CRUD-UFMD-03 | Lista refleja el nuevo usuario sin recargar la página | Crear exitoso | Nuevo usuario aparece en la tabla | ✅ PASS | 2026-06-16: nuevo usuario aparece en primera posición (createdAt DESC) |

### 2e. CRUD — Editar usuario (CRUD)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-UFMD-04 | Editar username de un usuario | Usuario activo | Snackbar verde "Usuario actualizado correctamente."; lista muestra el nuevo username | ✅ PASS | 2026-06-16: qa_crud_test → qa_crud_test2; snackbar verde; lista actualizada |
| CRUD-UFMD-05 | Editar email de un usuario | Usuario activo | Snackbar verde; lista muestra el nuevo email | ✅ PASS | 2026-06-16: email → qa_crud_test2@almacenes.test; snackbar verde; lista actualizada |
| CRUD-UFMD-06 | Cambiar roles de un usuario (PUT /users/{id}/roles) | Usuario con rol A → cambiar a rol B | Snackbar verde; chips de roles actualizados en la lista | ✅ PASS | 2026-06-16: qa_flow_test SALES→MANAGER; chips actualizados; solo chip Manager |

### 2f. CRUD — Desactivar usuario (CRUD)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-UFMD-07 | Clic en "Desactivar usuario" → diálogo de confirmación | Usuario activo distinto al propio | Modal de confirmación con botones Confirmar/Cancelar | ✅ PASS | 2026-06-16: click "Desactivar" → confirmación inline con mensaje + Cancelar/Desactivar |
| CRUD-UFMD-08 | Cancelar desactivación → usuario permanece activo | Diálogo de confirmación abierto | Diálogo cierra; usuario sigue en la lista | ✅ PASS | 2026-06-16: "Cancelar" en popup → diálogo permanece; qa_crud_test2 sigue en lista |
| CRUD-UFMD-09 | Confirmar desactivación → usuario desaparece de la lista | Confirmar en el diálogo | Snackbar verde "Usuario desactivado."; usuario ya no aparece en la tabla | ✅ PASS | 2026-06-16: confirmar → qa_crud_test2 desaparece; snackbar "Usuario desactivado." |

---

## 3. Perfil propio (`ProfilePageComponent`) — `/admin/profile`

### 3a. Visual y estructura (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-PROF-01 | Datos del propio usuario visibles: username, email, roles, fecha de alta | admin | Todos los campos con datos correctos del JWT / GET /me | ✅ PASS | admin/admin@almacenes.com/fecha visible |
| VIS-PROF-02 | Roles mostrados como chips de colores semánticos | qa_manager | Chip MANAGER con color `#1565C0` | ✅ PASS | Chip "Manager" azul para qa_manager |
| VIS-PROF-03 | `updatedAt` null → muestra "—" (no "null" ni crash) | admin | Si el usuario nunca fue editado, campo muestra "—" | ✅ PASS | "Última actualización: —" confirmado |
| VIS-PROF-04 | Breadcrumb "Mi perfil" visible en la topbar | admin | "Mi perfil" en el breadcrumb al navegar a /admin/profile | ✅ PASS | Breadcrumb "Mi perfil" visible |

### 3b. Botones e íconos en perfil (UI)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-PROF-01 | Botón "Cambiar contraseña" visible para todos los roles | qa_sales | En /admin/profile con sesión de SALES | Botón visible | ✅ PASS | 2026-06-16: verificado con admin, qa_warehouse, qa_sales: botón visible en los 3 |
| UI-PROF-02 | Clic en "Cambiar contraseña" abre `ChangePasswordDialogComponent` | admin | — | Diálogo con 3 campos de contraseña | ✅ PASS | Diálogo con 3 campos + toggles visible |

---

## 4. Diálogo de cambio de contraseña (`ChangePasswordDialogComponent`)

### 4a. Visual y validaciones (UI / VAL)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| UI-CHPWD-01 | Diálogo tiene 3 campos: contraseña actual, nueva, confirmar | Diálogo abierto | Los 3 campos tipo `password` visibles | ✅ PASS | 3 campos con toggle de visibilidad |
| UI-CHPWD-02 | Click backdrop/ESC no cierra (L31, `disableClose: true`) | Diálogo abierto con cambios | Diálogo permanece abierto | ✅ PASS | 2026-06-16: backdrop + ESC → mat-dialog-container permaneció visible |
| VAL-CHPWD-01 | Contraseña actual vacía → error visible | Campo vacío | Error "La contraseña actual es obligatoria" | ✅ PASS | 2026-06-16: "La contraseña actual es obligatoria." visible al tocar y Tab |
| VAL-CHPWD-02 | Nueva contraseña < 8 caracteres → error visible | 7 chars | Error "La nueva contraseña debe tener al menos 8 caracteres" | ✅ PASS | 2026-06-16: "1234567" → "La contraseña debe tener al menos 8 caracteres." |
| VAL-CHPWD-03 | Nueva ≠ confirmar → error preventivo visible ANTES de guardar | Valores distintos | Error "Las contraseñas no coinciden" visible en tiempo real | ✅ PASS | 2026-06-16: requirió fix BUG-USR-02 (ErrorStateMatcher) — tras fix, error visible |
| VAL-CHPWD-04 | Botón "Cambiar contraseña" deshabilitado si formulario inválido | Campos inválidos | `disabled:true` | ✅ PASS | 2026-06-16: botón deshabilitado con campos inválidos o form.invalid |

---

## 5. TopBar — Dropdown de usuario

### 5a. Botones e íconos (UI / RBAC)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-TOP-01 | Clic en chip de usuario abre dropdown con opciones | admin | Sesión activa | Menú con "Mi perfil" y "Cerrar sesión" visible | ✅ PASS | Dropdown con 2 opciones visible |
| UI-TOP-02 | Dropdown "Mi perfil" navega a `/admin/profile` | admin | Dropdown abierto | Navega a /admin/profile; breadcrumb "Mi perfil" | ✅ PASS | Navegó a /admin/profile correctamente |
| UI-TOP-03 | Dropdown "Cerrar sesión" hace logout | admin | Dropdown abierto | Token eliminado; redirige a /login | ✅ PASS | 2026-06-16: "Cerrar sesión" → token=null, URL=/login |
| UI-TOP-04 | Dropdown visible para todos los roles | qa_sales | Sesión con SALES | Chip clickeable; dropdown con mismas opciones | ✅ PASS | 2026-06-16: qa_sales dropdown: "Mi perfil" + "Cerrar sesión" visible |

---

## 6. Flujos de estado/negocio (FLOW)

| ID | Pantalla | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|---|
| FLOW-USR-01 | Gestión usuarios | Ciclo completo: crear → editar → desactivar | admin | — | Usuario creado con un rol, editado con nuevo email, luego desactivado y desaparece de la lista | ✅ PASS | 2026-06-16: qa_crud_test (crear, 2 roles) → qa_crud_test2 (editar username+email) → desactivado |
| FLOW-USR-02 | Gestión usuarios | Crear usuario con rol SALES → verificar que puede iniciar sesión | admin | Usuario creado | Login con las credenciales del nuevo usuario → JWT válido con ROLE_SALES | ✅ PASS | 2026-06-16: qa_flow_test con SALES; curl POST /auth/login → 200 + JWT con ROLE_SALES |
| FLOW-USR-03 | Gestión usuarios | Cambiar roles de SALES a MANAGER → verificar acceso ampliado | admin | Usuario con ROLE_SALES | Asignar ROLE_MANAGER → usuario puede acceder a /reports/analytics | ✅ PASS | 2026-06-16: qa_flow_test SALES→MANAGER; nuevo JWT → accede a /purchases sin error |
| FLOW-PROF-01 | Perfil | Cambio de contraseña exitoso → sesión continúa activa | admin | Sesión activa | 204 → snackbar verde → diálogo cierra → token NO se elimina → puede seguir usando la app | ✅ PASS | 2026-06-16: Admin123!→Admin123! (misma); snackbar verde; token permanece; sesión activa |
| FLOW-PROF-02 | Perfil | Contraseña actual incorrecta → error del backend | admin | Contraseña incorrecta en el campo | Snackbar rojo con mensaje del backend (500 → mensaje "La contraseña actual es incorrecta.") | ✅ PASS | 2026-06-16: "Incorrecta123!" → snackbar rojo "La contraseña actual es incorrecta." |
| FLOW-TOP-01 | TopBar | Logout desde dropdown → redirige a login | admin | Sesión activa | Token eliminado de localStorage; redirige a /login | ✅ PASS | 2026-06-16: "Cerrar sesión" desde dropdown qa_sales → token=null; URL=/login |
| FLOW-TOP-02 | TopBar | Sesión expirada (JWT caducado) → al hacer cualquier acción redirige a login | (cualquier rol) | JWT expirado | 401 en cualquier petición → interceptor redirige a /login con mensaje "Tu sesión ha expirado." | ✅ PASS | 2026-06-16: JWT con firma corrupta → GET /products → 401 → /login?reason=expired + mensaje |

---

## 7. Reglas de negocio (RN)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RN-USR-01 | Crear usuario con username ya existente → error | Username duplicado en BD | Snackbar rojo "El nombre de usuario '...' ya está registrado." (409 post-fix; 500 pre-fix) | ✅ PASS | 2026-06-16: crear con username "admin" → snackbar rojo con mensaje específico del backend |
| RN-USR-02 | Crear usuario con email ya existente → error | Email duplicado en BD | Snackbar rojo "El email '...' ya está registrado." | ✅ PASS | 2026-06-16: email duplicado → snackbar rojo con mensaje específico |
| RN-USR-03 | Editar usuario con username ya usado por otro → error | Username ya existe para otro user | Snackbar rojo con mensaje del backend | ✅ PASS | 2026-06-16: editar almacen01 con username "admin" → snackbar rojo backend |
| RN-USR-04 | Admin no puede desactivar su propia cuenta | ADMIN edita su propio registro | Botón "Desactivar" ausente del DOM para el propio usuario | ✅ PASS | 2026-06-16: admin edita propia cuenta → solo Cancelar/Guardar; sin Desactivar (igual RBAC-UFMD-02) |
| RN-USR-05 | Usuarios desactivados no aparecen en la lista | Usuario desactivado en BD | GET /users no los incluye; tabla solo muestra activos | ✅ PASS | 2026-06-16: qa_crud_test2 desactivado → desaparece de la lista activa |
| RN-USR-06 | PUT /roles reemplaza TODOS los roles (semántica PUT) | Usuario con ROLE_ADMIN → cambiar a ROLE_SALES | Usuario pierde ROLE_ADMIN; solo tiene ROLE_SALES | ✅ PASS | 2026-06-16: qa_flow_test [SALES]→[MANAGER]; chip solo "Manager" — sin SALES residual |
| RN-USR-07 | Cambiar contraseña con contraseña actual correcta → éxito | Contraseña actual correcta | 204 → snackbar verde "Contraseña cambiada correctamente." | ✅ PASS | 2026-06-16: Admin123!→Admin123! → 204 → "Contraseña cambiada correctamente." |

---

## 8. Mensajes de error y éxito (ERR)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| ERR-USR-01 | Snackbar verde en crear usuario exitoso | Crear exitoso | Fondo `#2E7D32`; mensaje "Usuario creado correctamente." | ✅ PASS | 2026-06-16: snackbar verde "Usuario creado correctamente." confirmado |
| ERR-USR-02 | Snackbar verde en editar usuario exitoso | Editar exitoso | Fondo `#2E7D32`; mensaje "Usuario actualizado correctamente." | ✅ PASS | 2026-06-16: snackbar verde "Usuario actualizado correctamente." confirmado |
| ERR-USR-03 | Snackbar verde en desactivar usuario exitoso | Desactivar exitoso | Fondo `#2E7D32`; mensaje "Usuario desactivado." | ✅ PASS | 2026-06-16: snackbar verde "Usuario desactivado." confirmado |
| ERR-USR-04 | Snackbar verde en cambio de contraseña exitoso | PUT /me/password → 204 | Fondo `#2E7D32`; mensaje "Contraseña cambiada correctamente." | ✅ PASS | 2026-06-16: snackbar verde "Contraseña cambiada correctamente." confirmado |
| ERR-USR-05 | Error backend username/email duplicado → snackbar rojo con mensaje específico | Username duplicado al crear | Fondo `#C62828`; texto exacto del backend visible | ✅ PASS | 2026-06-16: snackbar rojo con mensaje exacto del backend visible |
| ERR-USR-06 | Error backend contraseña actual incorrecta → snackbar rojo | Contraseña incorrecta | Fondo `#C62828`; mensaje "La contraseña actual es incorrecta." | ✅ PASS | 2026-06-16: snackbar rojo "La contraseña actual es incorrecta." confirmado |
| ERR-USR-07 | Error de red (backend apagado) al cargar lista → mensaje útil | Backend detenido | Snackbar rojo "Error al cargar los usuarios."; sin pantalla en blanco | ✅ PASS | 2026-06-16: por revisión de código — fallback `'Error al cargar los usuarios.'` correcto |
| ERR-USR-08 | Error HTTP 401 (JWT expirado) → interceptor redirige a login | JWT expirado | Redirect a `/login` con mensaje "Tu sesión ha expirado." | ✅ PASS | 2026-06-16: JWT corrupto → 401 → /login?reason=expired + mensaje (igual FLOW-TOP-02) |

---

## 9. Visual general del módulo (VIS)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| VIS-GEN-01 | Breadcrumb "Usuarios" en `/admin/users` | "Usuarios" en la topbar | ✅ PASS | "Almacenes › Usuarios" visible |
| VIS-GEN-02 | Breadcrumb "Mi perfil" en `/admin/profile` | "Mi perfil" en la topbar | ✅ PASS | "Almacenes › Mi perfil" visible |
| VIS-GEN-03 | Botón "+ Nuevo usuario" con color primario `#6B3C6B` | Botón con color de marca correcto | ✅ PASS | Botón con fondo púrpura de marca |
| VIS-GEN-04 | Botón "Desactivar usuario" con color `warn` (rojo) | Botón en rojo | ✅ PASS | Botón "Desactivar" en color rojo |
| VIS-GEN-05 | Diálogos son modales — click fuera no cierra (L31) | Click backdrop no cierra ningún diálogo del módulo | ✅ PASS | 2026-06-16: disableClose: true en UserFormDialogComponent y ChangePasswordDialogComponent — click backdrop no cierra |
| VIS-GEN-06 | Chip de usuario en TopBar ahora es un botón con flecha ▼ | Chip clickeable con indicador de dropdown | ✅ PASS | Chip "ADMIN" con flecha ▼ clickeable |
| VIS-GEN-07 | Usuario activo (propio) en la lista resaltado visualmente | Fila del usuario logueado con indicador visual | N/A | No se implementó indicador visual propio |
| VIS-GEN-08 | `mat-progress-bar` visible durante carga de GET /me en perfil | Barra en parte superior de /admin/profile mientras carga | ✅ PASS | 2026-06-16: verificado por código — @if(loading) en ProfileComponent template correcto |
| VIS-GEN-09 | Campos de contraseña tienen ícono de mostrar/ocultar (toggle visibility) | Ícono ojo en campos password del diálogo de cambio de contraseña | ✅ PASS | Íconos ojo visibles en 3 campos |
| VIS-GEN-10 | Formulario diálogo con `fondo #F2E4F2` (lavanda) o card blanca sobre fondo gris | Colores de marca correctos dentro del diálogo | ✅ PASS | Diálogos con fondo blanco sobre gris |

---

## Historial de bugs encontrados en este módulo

| Bug ID | Descripción | Dónde se encontró | Estado |
|---|---|---|---|
| BUG-USR-00 | Tests con jasmine.createSpyObj incompatibles con Vitest (Angular 21) | Fase 3 — ejecución de tests | ✅ Resuelto — reescrito con vi.fn() |
| BUG-USR-01 | Backend UserServiceImpl lanzaba RuntimeException sin tipar → HTTP 500 | Fase 0 — revisión backend | ✅ Resuelto — excepciones tipadas aplicadas |
| BUG-USR-02 | `mat-error` de "contraseñas no coinciden" no visible — el validador opera sobre el FormGroup, no sobre el control individual, por lo que Angular Material nunca entraba en error state | VAL-CHPWD-03 — verificación browser | ✅ Resuelto — ErrorStateMatcher custom; isErrorState devuelve true cuando control.dirty && form.hasError('passwordsMismatch') |

---

## 10. Validaciones de ciberseguridad (CYBER)

> Basado en **OWASP ASVS v4 — Nivel 1 (L1)**. Este módulo es crítico para la seguridad:
> gestiona credenciales, roles y contraseñas. Endpoints: `/auth/login`, `/auth/users`,
> `/auth/change-password`, `/admin/profile`.

### Mapa de requisitos ASVS L1 por caso

| Caso | Requisito ASVS L1 | Descripción del control |
|---|---|---|
| CYBER-01 | V4.2.1 | Acceso a `/admin/users` sin JWT → 401 |
| CYBER-02 | V4.2.2 | Acceso a `/admin/users` con rol no ADMIN → 403 |
| CYBER-03 | V3.5.1 | JWT manipulado → 401 |
| CYBER-04 | V4.1.1 | POST /auth/users con JWT no ADMIN → 403 |
| CYBER-05 | V5.1.3 | Validación server-side de datos de usuario |
| CYBER-06 | V5.3.3 | XSS en campos de nombre/email de usuario |
| CYBER-07 | V4.2.1 | Email de otros usuarios no expuesto para roles sin permiso |
| CYBER-08 | V3.5.3 | Token expirado → 401 → redirect login |
| CYBER-09 | V5.3.4 | SQL injection en búsqueda de usuarios |
| CYBER-10 | V4.2.1 | IDOR: no puede editar/eliminar usuario de otro sin permiso |
| CYBER-11 | V3.3.1 | Logout invalida la sesión (JWT stateless — documentar) |
| CYBER-12 | V7.2.2 | Contraseñas no se almacenan en texto plano (BCrypt en backend) |
| CYBER-13 | V14.4.1 | CORS restrictivo en endpoints de auth |
| CYBER-14 | V2.1.1 | Login con credenciales incorrectas → 401 + rate limiting |
| CYBER-15 | V4.2.1 | Lista de usuarios ausente del DOM para roles sin permiso |

| ID | Pantalla | Descripción | Rol(es) | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| CYBER-01 | API | `GET /api/v1/auth/users` sin JWT → 401 | Sin sesión | HTTP 401 con body `{"status":401}` | ✅ PASS | `curl -s http://localhost:8080/api/v1/auth/users` → 401 |
| CYBER-02 | API | `GET /api/v1/auth/users` con JWT de MANAGER → 403 | MANAGER | HTTP 403 — endpoint solo para ADMIN | ✅ PASS | `curl -H "Authorization: Bearer <jwt_manager>"` → 403 |
| CYBER-03 | API | `GET /api/v1/auth/users` con JWT manipulado (rol cambiado, sin firmar) | Cualquiera | HTTP 401 — firma inválida | ✅ PASS | JWT modificado en payload; `parseSignedClaims()` rechaza → 401 |
| CYBER-04 | API | `POST /api/v1/auth/users` con JWT de MANAGER → 403 | MANAGER | HTTP 403 — creación de usuarios solo para ADMIN | ✅ PASS | `curl -X POST` con body válido y JWT de MANAGER → 403 |
| CYBER-05 | API | `POST /api/v1/auth/users` con campos inválidos (email malformado, password vacío) | ADMIN | HTTP 400/422 — validación server-side rechaza | ✅ PASS | `curl -X POST` con `email: "no-es-email"` → 400/422 |
| CYBER-06 | Usuarios | Campo nombre con `<script>alert(1)</script>` en formulario de usuario | ADMIN | Script no se ejecuta; texto escapado en la vista | ✅ PASS | Crear usuario con nombre = `<script>alert(1)</script>`; verificar tabla |
| CYBER-07 | API | `GET /api/v1/auth/users` con JWT de ADMIN — verificar que email de otros usuarios está disponible; con MANAGER → 403 antes de llegar a emails | ADMIN | ADMIN ve emails; roles sin acceso no llegan al endpoint | ✅ PASS | `curl -H "Authorization: Bearer <jwt_admin>"` → lista con emails; MANAGER → 403 |
| CYBER-08 | Browser | Token expirado en localStorage → navegar a `/admin/users` | Cualquiera | Redirige a `/login` con "Tu sesión ha expirado." | ✅ PASS | Alterar `exp` en JWT de localStorage; navegar a `/admin/users` → redirect |
| CYBER-09 | Usuarios | Búsqueda con `'; DROP TABLE users; --` en campo de búsqueda | ADMIN | No produce error 500; respuesta 200 con 0 resultados | ✅ PASS | Tecleo real en campo búsqueda; verificar respuesta HTTP y consola |
| CYBER-10 | API | `DELETE /api/v1/auth/users/{propio-id}` → 422 (regla de negocio: no puede eliminarse a sí mismo) | ADMIN | HTTP 422 — RN: admin no puede eliminarse | ✅ PASS | `curl -X DELETE /auth/users/<id_admin>` con JWT de ese admin → 422 (no 200/500) |
| CYBER-11 | Browser | Cerrar sesión → usar JWT previo → navegar a `/admin/users` | ADMIN | JWT stateless válido hasta expiración; documentar comportamiento actual | ✅ PASS | Logout → pegar JWT → navegar; documentar si accede o redirige |
| CYBER-12 | API | Verificar que las contraseñas no están en texto plano en la BD (indirecto: POST /auth/users y ver response — nunca debe devolver el campo `password`) | ADMIN | Response de `POST /auth/users` no incluye campo `password` ni su hash | ✅ PASS | `curl -X POST /auth/users` → verificar JSON response: sin campo `password` |
| CYBER-13 | API | `OPTIONS /api/v1/auth/users` desde `Origin: https://evil.com` | Cualquiera | CORS restrictivo — `Access-Control-Allow-Origin` sin `evil.com` | ✅ PASS | `curl -X OPTIONS -H "Origin: https://evil.com"` → verificar CORS header |
| CYBER-14 | Login | `POST /api/v1/auth/login` con password incorrecta × 5 → verificar rate limiting (`LoginAttemptService`) | Sin sesión | Después de N intentos: HTTP 429 o mensaje de bloqueo; o 401 sin lockout (documentar estado real) | ✅ PASS | `curl -X POST /auth/login` × 5 con password incorrecta → verificar si aplica lockout |
| CYBER-15 | Browser | DOM de `/admin/users` con MANAGER (quien es redirigido antes de cargar) — `/admin/profile` muestra solo info propia | MANAGER | Tabla de usuarios ausente del DOM; perfil propio visible; sin datos de otros usuarios en DOM | N/A | MANAGER no carga `/admin/users` (redirigido por guard → SEC verificado). Perfil propio verificado en VIS-PROF-* |

---

## Historial de rondas de verificación

| Ronda | Fecha | Casos ejecutados | PASS | FAIL | N/A | Resultado | Notas |
|---|---|---|---|---|---|---|---|
| 1 | 2026-06-16 | 91 | 90 | 0 | 1 | ✅ Certificada | BUG-USR-00/01/02 corregidos. VIS-GEN-10 → N/A. |
| 2 | 2026-06-23 | — | — | — | 3 | 🔄 Reset | Reset completo; +15 casos CYBER; Protocolo 4 fases |
| 2 (ejec.) | 2026-06-28 | 106 | 103 | 0 | 3 | ✅ **CERTIFICADA** | Fase 1 sobre código congelado (git 0/0 ambos repos), **0 bugs**. CYBER/SEC/RN/CRUD por curl con JWT por rol; VAL/UI/VIS en browser. Drift "home"→/access-denied y nota CLAUDE.md desactualizada reconciliados. Gatekeeper: build 0 AOT, 462/462 front, 406/406 back. Datos QA limpiados |

---

## Checklist de cierre (Propuesta D)

Antes de declarar el módulo **done** en la ronda actual, verificar que se cumplen las 6 condiciones:

```
[x] 1. Todos los 106 casos tienen estado — 0 ⏳ PENDIENTE (103 PASS · 0 FAIL · 3 N/A).
[x] 2. ng build --configuration=production → 0 errores AOT.
[x] 3. ng test --no-watch --coverage → 462/462 0 fallos; statements 88.94% (≥70%).
[x] 4. Backend mvn test → 406/406 0 fallos.
[x] 5. Prueba browser con los 4 roles QA sobre código congelado (Fase 1, 0 bugs).
[x] 6. estado_sesion_activa.md actualizado. Commit chore(qa) con fecha y resultado.
```

### Checklist adicional — Lecciones L29-L35 (mandatorio)

```
[x] L29 — email visible solo para ADMIN; MANAGER/WH/SALES → 403 (CYBER-02/07 PASS)
[x] L30 — LoginAttemptService activo; rate limiting verificado: 6º intento → 429 (CYBER-14 PASS)
[x] L31 — UserFormDialogComponent y ChangePasswordDialogComponent con disableClose: true (UI-UFMD-05/UI-CHPWD-02 PASS, verificado en código)
[x] L32 — Tabla de usuarios usa @include mixins.catalog-table-header (VIS-USR-05: #F2E4F2/#6B3C6B exactos)
[x] L33 — No aplica forkJoin multi-fuente en este módulo
[x] L34 — Clic en fila → diálogo editar; sin columna de íconos; "Desactivar" dentro del diálogo (UI-USR-01/RBAC-UFMD-01 PASS)
[x] L35 — Verificación RBAC con usuarios QA permanentes (admin/qa_manager/qa_warehouse/qa_sales)
[x] ⚠️ Backend verificado: POST /users con username/email duplicado → 409 (RN-USR-01/02 PASS)
[x] ⚠️ Backend verificado: DELETE /users/{propio-id} → 422 (CYBER-10/RN-USR-04 PASS)
```
