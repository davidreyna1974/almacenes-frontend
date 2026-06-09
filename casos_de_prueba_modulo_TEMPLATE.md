# Casos de prueba — Módulo [NOMBRE]: [Descripción]

> **INSTRUCCIONES DE USO**
> 1. Copiar este archivo y renombrar: `casos_de_prueba_modulo_<nombre>.md`
> 2. Reemplazar todos los marcadores `[...]` con los valores específicos del módulo
> 3. Agregar/eliminar filas según las pantallas y funcionalidades del módulo
> 4. Ejecutar cada caso en el browser con el JWT del rol indicado **antes de declarar cualquier componente terminado**
> 5. Un componente/módulo está "done" ÚNICAMENTE cuando **toda la columna Estado está llena** y **ningún caso está ⏳ PENDIENTE**

---

**Módulo:** [NOMBRE]
**Ruta base:** `/[ruta]`
**Roles con acceso:** [ADMIN, MANAGER, ...]
**Roles sin acceso:** [SALES, ...]
**Fecha de creación:** [YYYY-MM-DD]
**Última actualización:** [YYYY-MM-DD]

---

## Cómo usar este documento

1. Cada caso tiene un ID único (`CATEGORIA-PANTALLA-NNN`)
2. Ejecutar cada caso en el browser con el JWT del rol indicado
3. Actualizar la columna **Estado** con el resultado real observado en el browser
4. Si el estado es ❌ FAIL: registrar el bug en §8 de la memoria técnica con referencia al ID
5. Un componente solo está "done" cuando **toda la columna Estado está llena** y **ningún caso está ⏳ PENDIENTE**

**Estados:** `✅ PASS` | `❌ FAIL` | `⏳ PENDIENTE` | `N/A`

---

## Resumen de cobertura

| Categoría | Total casos | PASS | FAIL | PENDIENTE |
|---|---|---|---|---|
| SEC — Seguridad de rutas | 0 | 0 | 0 | 0 |
| RBAC — Control de acceso UI | 0 | 0 | 0 | 0 |
| CRUD — Flujos de datos | 0 | 0 | 0 | 0 |
| VAL — Validaciones de formulario | 0 | 0 | 0 | 0 |
| BSRCH — Búsqueda e inputs | 0 | 0 | 0 | 0 |
| UI — Botones e íconos | 0 | 0 | 0 | 0 |
| FLOW — Flujos de estado/negocio | 0 | 0 | 0 | 0 |
| RN — Reglas de negocio | 0 | 0 | 0 | 0 |
| ERR — Mensajes de error | 0 | 0 | 0 | 0 |
| EMPTY — Estados vacíos | 0 | 0 | 0 | 0 |
| VIS — Visual y estética | 0 | 0 | 0 | 0 |
| **TOTAL** | **0** | **0** | **0** | **0** |

> Actualizar este resumen cada vez que se completa una sección.

---

## 0. Seguridad de rutas (SEC)

> Verificar con acceso directo por URL — NO basta con esconder el ítem del sidebar.
> El sidebar ocultar el ítem es cosmético, no es seguridad (L18 — BUG-M3-07).

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| SEC-01 | Acceso directo `[/ruta-principal]` con rol sin permiso | [ROL_SIN_ACCESO] | Sesión activa con JWT del rol | Redirige a home; mensaje "Acceso denegado" | ⏳ PENDIENTE | |
| SEC-02 | Acceso directo `[/ruta/new]` con rol sin permiso de escritura | [ROL_SOLO_LECTURA] | Sesión activa | Redirige a home; acceso denegado | ⏳ PENDIENTE | |
| SEC-03 | Acceso directo `[/ruta/{id}]` con rol sin permiso | [ROL_SIN_ACCESO] | Sesión activa | Redirige a home; acceso denegado | ⏳ PENDIENTE | |
| SEC-04 | Sin sesión activa — acceso a `[/ruta-principal]` | (sin JWT) | Token expirado / sin login | Redirige a `/login` | ⏳ PENDIENTE | |
| SEC-[N] | [Agregar rutas adicionales del módulo] | | | | ⏳ PENDIENTE | |

---

## 1. [Pantalla principal — Lista] (`[nombre-componente]`)

### 1a. Visual y estructura (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-[P]-01 | Título de la página visible | [ROL] | "[Título esperado]" | ⏳ PENDIENTE | |
| VIS-[P]-02 | Columnas de la tabla: [col1, col2, col3...] | [ROL] | Todas las columnas visibles | ⏳ PENDIENTE | |
| VIS-[P]-03 | Barra de búsqueda visible en la parte superior | [ROL] | Campo "Buscar" con ícono lupa | ⏳ PENDIENTE | |
| VIS-[P]-04 | Botón de acción principal ("[Nuevo/Agregar X]") visible | [ROL_ESCRITURA] | Botón con ícono `add` visible | ⏳ PENDIENTE | |
| VIS-[P]-05 | Cursor `pointer` en filas; hover cambia el fondo | [ROL] | Comportamiento hover correcto | ⏳ PENDIENTE | |
| VIS-[P]-06 | Texto largo en columnas se trunca con `…` y tooltip | [ROL] | text-overflow:ellipsis activo + tooltip | ⏳ PENDIENTE | |
| VIS-[P]-07 | Header de tabla con fondo `#F2E4F2` y texto `#6B3C6B` | [ROL] | Colores de marca correctos | ⏳ PENDIENTE | |
| VIS-[P]-08 | `mat-progress-bar` visible durante carga (no spinner centrado) | [ROL] | Barra en parte superior | ⏳ PENDIENTE | |
| VIS-[P]-[N] | [Agregar casos visuales específicos del módulo] | | | ⏳ PENDIENTE | |

### 1b. Búsqueda (BSRCH)

> ⚠️ **Requisito obligatorio**: toda búsqueda LIKE del backend DEBE usar `f_unaccent()` con
> `nativeQuery=true`. BUG-INV-06 (2026-06-09) demostró que `LOWER()` en JPQL no elimina diacríticos.
> BSRCH-[P]-03 (accent insensitive) es el caso de prueba de verificación de este requisito.
> Ver §7 de `memoria_tecnica_global_proyecto.md` para el patrón completo de implementación.

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| BSRCH-[P]-01 | Buscar por [campo principal] exacto | [ROL] | Hay registros en BD | Filtra correctamente | ⏳ PENDIENTE | |
| BSRCH-[P]-02 | Buscar en minúsculas (case insensitive) | [ROL] | Registro con mayúsculas | Encuentra el registro | ⏳ PENDIENTE | |
| BSRCH-[P]-03 | Buscar sin acento (accent insensitive) | [ROL] | Registro con acento, ej. buscar "galon" → "Galón" | Encuentra el registro | ⏳ PENDIENTE | Verificar que el backend usa f_unaccent() |
| BSRCH-[P]-04 | Buscar término sin resultados | [ROL] | Término no existe | Estado vacío: ícono + mensaje contextual | ⏳ PENDIENTE | |
| BSRCH-[P]-05 | Limpiar campo de búsqueda | [ROL] | Campo con término activo | Lista restaurada; todos los registros visibles | ⏳ PENDIENTE | |
| BSRCH-[P]-06 | Botón X de limpieza visible SOLO cuando hay texto | [ROL] | Campo vacío vs con texto | Sin texto → sin X; con texto → X visible | ⏳ PENDIENTE | |
| BSRCH-[P]-[N] | [Agregar búsquedas específicas del módulo] | | | | ⏳ PENDIENTE | |

### 1c. RBAC en lista (RBAC)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-[P]-01 | Botón "[Nuevo X]" visible | [ROL_ESCRITURA] | Visible | ⏳ PENDIENTE | |
| RBAC-[P]-02 | Botón "[Nuevo X]" NO visible | [ROL_SOLO_LECTURA] | Ausente del DOM (no solo oculto) | ⏳ PENDIENTE | |
| RBAC-[P]-03 | Columna de datos sensibles ([precio/costo/...]) visible | [ROL_CON_ACCESO] | Columna visible | ⏳ PENDIENTE | |
| RBAC-[P]-04 | Columna de datos sensibles AUSENTE del DOM | [ROL_SIN_ACCESO] | Columna no renderizada | ⏳ PENDIENTE | |
| RBAC-[P]-05 | Íconos de acción en fila visibles según rol | [ROL_ESCRITURA] | Íconos correctos para el rol | ⏳ PENDIENTE | |
| RBAC-[P]-[N] | [Agregar casos RBAC específicos del módulo] | | | ⏳ PENDIENTE | |

### 1d. Botones e íconos de acción en tabla (UI)

> ⚠️ CRÍTICO: Verificar que cada botón en filas clickeables incluye `$event.stopPropagation()`.
> Sin esto, el click burbujea al `mat-row` y la acción no se ejecuta (L27 — BUG-M3-22).
> Para CADA botón de acción: clic → diálogo/acción se ejecuta → resultado confirmado → estado cambia.

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-[P]-01 | Click en fila navega al detalle | [ROL] | Lista cargada | Navegación correcta | ⏳ PENDIENTE | |
| UI-[P]-02 | Ícono [acción 1] — clic abre diálogo/ejecuta acción | [ROL] | [Precondición] | Diálogo abre SIN navegar fuera | ⏳ PENDIENTE | |
| UI-[P]-03 | Confirmar [acción 1] → estado cambia en la lista | [ROL] | Diálogo abierto | Estado actualizado; lista refleja el cambio | ⏳ PENDIENTE | |
| UI-[P]-04 | Cancelar [acción 1] → estado NO cambia | [ROL] | Diálogo abierto | Nada cambia al cancelar | ⏳ PENDIENTE | |
| UI-[P]-05 | Ícono [acción 2] — clic abre diálogo/ejecuta acción | [ROL] | [Precondición] | Diálogo abre SIN navegar fuera | ⏳ PENDIENTE | |
| UI-[P]-06 | Confirmar [acción 2] → estado cambia | [ROL] | Diálogo abierto | Estado actualizado | ⏳ PENDIENTE | |
| UI-[P]-[N] | [Agregar un caso por cada ícono/botón de acción en la tabla] | | | | ⏳ PENDIENTE | |

### 1e. Estados vacíos (EMPTY)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| EMPTY-[P]-01 | Lista sin datos (BD vacía o filtro vacío) | Ícono + "[Mensaje: Sin X registrados]" | ⏳ PENDIENTE | |
| EMPTY-[P]-02 | Búsqueda sin resultados | Ícono + 'Sin resultados para "[término]"' | ⏳ PENDIENTE | |

### 1f. Paginación (UI)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| UI-[P]-PAG-01 | Paginador visible cuando hay > pageSize registros | [N] registros en BD | Paginador con total, opciones 10/20/50 | ⏳ PENDIENTE | |
| UI-[P]-PAG-02 | Cambio de página carga la página correcta | Paginador visible | Filas cambian al ir a página 2 | ⏳ PENDIENTE | |

---

## 2. [Formulario / Diálogo] (`[nombre-componente]`)

### 2a. Apertura y visual (UI / VIS)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-[F]-01 | Click en [fila/botón] abre [diálogo/página] | [ROL] | Lista cargada | [Diálogo/página] abre con datos del registro | ⏳ PENDIENTE | |
| UI-[F]-02 | Botón "Nuevo" abre formulario vacío | [ROL_ESCRITURA] | — | Todos los campos vacíos; sin datos precargados | ⏳ PENDIENTE | |
| UI-[F]-03 | Botón Cancelar cierra sin guardar | [ROL] | Formulario con cambios | Cierra; lista/estado no cambia | ⏳ PENDIENTE | |
| UI-[F]-04 | Campos muestran label visible (no solo placeholder) | [ROL] | Formulario abierto | Labels siempre visibles | ⏳ PENDIENTE | |
| VIS-[F]-01 | Campos obligatorios tienen `*` (Angular Material lo genera; nunca doble `**`) | [ROL] | Formulario abierto | Solo un `*` por campo obligatorio | ⏳ PENDIENTE | |

### 2b. RBAC en formulario (RBAC)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RBAC-[F]-01 | Título del formulario en modo edición | [ROL_ESCRITURA] | "Editar [X]" | ⏳ PENDIENTE | |
| RBAC-[F]-02 | Título del formulario en modo lectura | [ROL_SOLO_LECTURA] | "Ver [X]" | ⏳ PENDIENTE | |
| RBAC-[F]-03 | Formulario editable — todos los campos habilitados | [ROL_ESCRITURA] | Campos editables; botón Guardar visible | ⏳ PENDIENTE | |
| RBAC-[F]-04 | Formulario de solo lectura — campos deshabilitados | [ROL_SOLO_LECTURA] | inputs con `disabled:true`; sin botón Guardar | ⏳ PENDIENTE | |
| RBAC-[F]-05 | Datos sensibles ([precio/costo]) visibles | [ROL_CON_ACCESO] | Campo visible | ⏳ PENDIENTE | |
| RBAC-[F]-06 | Datos sensibles AUSENTES del DOM | [ROL_SIN_ACCESO] | Campo no renderizado | ⏳ PENDIENTE | |
| RBAC-[F]-[N] | [Agregar casos RBAC específicos] | | | ⏳ PENDIENTE | |

### 2c. Validaciones (VAL)

> ⚠️ Verificar que el botón Guardar tenga `form.dirty` en su condición `[disabled]`:
> el botón debe estar inactivo al cargar el formulario de edición, activarse solo
> cuando el usuario modifica algo, y volver a desactivarse tras guardar (L25 — BUG-M3-20).

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VAL-[F]-01 | Campo obligatorio vacío al intentar guardar | Campo vacío | Error inline bajo el campo; botón deshabilitado | ⏳ PENDIENTE | |
| VAL-[F]-02 | Campo con longitud < mínima | Valor corto | Error "Mínimo [N] caracteres" | ⏳ PENDIENTE | |
| VAL-[F]-03 | Campo con longitud > máxima | Valor largo | Campo no acepta más de [N] chars O error visible | ⏳ PENDIENTE | |
| VAL-[F]-04 | Campo numérico con valor 0 o negativo | Valor 0 / -1 | Error "Debe ser mayor a cero" / "Mínimo 1" | ⏳ PENDIENTE | |
| VAL-[F]-05 | Campo email/RFC/formato con valor inválido | Formato incorrecto | Error de formato visible | ⏳ PENDIENTE | |
| VAL-[F]-06 | Botón Guardar deshabilitado con formulario inválido | Campos inválidos | `disabled:true` en el DOM | ⏳ PENDIENTE | |
| VAL-[F]-07 | Botón Guardar deshabilitado al cargar (modo edición, sin cambios) | Formulario recién cargado | `disabled:true` — `form.dirty = false` | ⏳ PENDIENTE | |
| VAL-[F]-08 | Botón Guardar se activa al modificar un campo | Formulario cargado → editar un campo | `disabled:false` después de modificar | ⏳ PENDIENTE | |
| VAL-[F]-09 | Botón Guardar se desactiva después de guardar exitosamente | Guardar exitoso | `disabled:true` — `markAsPristine()` ejecutado | ⏳ PENDIENTE | |
| VAL-[F]-[N] | [Agregar validaciones específicas del módulo] | | | ⏳ PENDIENTE | |

### 2d. CRUD — Crear (CRUD)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-[F]-01 | Crear registro con todos los datos válidos | Formulario completo | Snackbar verde "[X] creado correctamente."; [diálogo cierra / navega al detalle] | ⏳ PENDIENTE | |
| CRUD-[F]-02 | Lista/pantalla refleja el nuevo registro inmediatamente | Crear exitoso | Nuevo registro visible sin recargar | ⏳ PENDIENTE | |
| CRUD-[F]-03 | Crear con dato duplicado (RFC/código/nombre único) | Dato ya existe en BD | Snackbar rojo con mensaje del backend (409/422) | ⏳ PENDIENTE | |

### 2e. CRUD — Editar (CRUD)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-[F]-04 | Editar [campo principal] de un registro | Registro activo | Snackbar verde "[X] actualizado correctamente." | ⏳ PENDIENTE | |
| CRUD-[F]-05 | Lista/pantalla refleja los cambios después de editar | Editar exitoso | Datos actualizados visibles sin recargar | ⏳ PENDIENTE | |

### 2f. CRUD — Eliminar / Desactivar (CRUD)

> ⚠️ Si la entidad tiene una colección hija con mínimo requerido (ej. al menos 1 línea),
> verificar que el sistema bloquea la eliminación del último elemento con error claro (L26 — BUG-M3-21).

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| CRUD-[F]-06 | Click en [Eliminar/Desactivar] abre diálogo de confirmación | Registro activo | Modal con texto de confirmación y botones Confirmar/Cancelar | ⏳ PENDIENTE | |
| CRUD-[F]-07 | Cancelar en diálogo — registro no cambia | Diálogo abierto | Registro permanece; sin cambios | ⏳ PENDIENTE | |
| CRUD-[F]-08 | Confirmar eliminación/desactivación | Registro sin dependencias activas | Snackbar verde; registro desaparece/cambia estado | ⏳ PENDIENTE | |
| CRUD-[F]-09 | Intentar eliminar registro con dependencias activas | Registro con hijos activos | Snackbar rojo con mensaje del backend (422) | ⏳ PENDIENTE | |
| CRUD-[F]-10 | Intentar eliminar el último elemento de colección requerida | Solo 1 elemento en colección | Snackbar error "No se puede eliminar..."; sin llamada al API | ⏳ PENDIENTE | |

---

## 3. [Pantalla de detalle] (`[nombre-componente]`)

### 3a. Visual (VIS)

| ID | Descripción | Rol | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| VIS-DET-01 | Título muestra identificador del registro | [ROL] | "[Identificador]" visible como título | ⏳ PENDIENTE | |
| VIS-DET-02 | Badge/chip de estado con color semántico correcto | [ROL] | PENDING=naranja, ACTIVE=verde, etc. | ⏳ PENDIENTE | |
| VIS-DET-03 | Botón ← (regresar) navega a la lista | [ROL] | Navega a `[/ruta-lista]` | ⏳ PENDIENTE | |
| VIS-DET-[N] | [Agregar casos visuales específicos] | | | ⏳ PENDIENTE | |

### 3b. Botones de acción en detalle (UI)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| UI-DET-01 | Botón [Acción 1] visible en estado [ESTADO_A] | [ROL] | Registro en [ESTADO_A] | Botón visible y clickeable | ⏳ PENDIENTE | |
| UI-DET-02 | Botón [Acción 1] NO visible en estado [ESTADO_B] | [ROL] | Registro en [ESTADO_B] | Botón ausente del DOM | ⏳ PENDIENTE | |
| UI-DET-[N] | [Un caso por cada botón de acción × cada estado en que aplica] | | | ⏳ PENDIENTE | |

### 3c. Flujos de estado (FLOW)

| ID | Descripción | Rol | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|
| FLOW-DET-01 | [Acción 1]: diálogo → confirmar → estado cambia | [ROL] | Registro en [ESTADO_ORIGEN] | Snackbar verde; badge cambia a [ESTADO_DESTINO] | ⏳ PENDIENTE | |
| FLOW-DET-02 | [Acción 1]: diálogo → cancelar → estado NO cambia | [ROL] | Diálogo abierto | Badge permanece en [ESTADO_ORIGEN] | ⏳ PENDIENTE | |
| FLOW-DET-[N] | [Un caso por cada transición de estado × confirmar y cancelar] | | | ⏳ PENDIENTE | |

### 3d. Reglas de negocio (RN)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| RN-DET-01 | Campos deshabilitados en estado [ESTADO_BLOQUEADO] | Registro en estado bloqueado | Todos los campos del formulario con `disabled:true` | ⏳ PENDIENTE | |
| RN-DET-02 | Campo de solo lectura no expuesto como editable ([stock/auditoría/...]) | Formulario de edición | Campo ausente o `disabled:true` | ⏳ PENDIENTE | |
| RN-DET-[N] | [Agregar reglas de negocio específicas del módulo] | | | ⏳ PENDIENTE | |

---

## 4. Mensajes de error y éxito (ERR)

| ID | Descripción | Precondición | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|
| ERR-01 | Snackbar de éxito: fondo verde `#2E7D32`, clase `snackbar-success` | Operación exitosa | Color correcto; no es gris por defecto | ⏳ PENDIENTE | |
| ERR-02 | Snackbar de error: fondo rojo `#C62828`, clase `snackbar-error` | Error del backend | Color correcto; `panelClass` como array `['snackbar-error']` | ⏳ PENDIENTE | |
| ERR-03 | Mensaje de error específico del backend visible (no mensaje genérico) | Backend rechaza con 409/422 | Texto del backend en el snackbar | ⏳ PENDIENTE | |
| ERR-04 | Error 422 por regla de negocio → mensaje específico | Violar regla de negocio | Mensaje descriptivo; no "Error desconocido" | ⏳ PENDIENTE | |
| ERR-05 | Error de red → mensaje útil (no "undefined" ni stack trace) | Backend apagado | Snackbar con "Error al [cargar/guardar] [X]" | ⏳ PENDIENTE | |
| ERR-06 | Progress bar visible durante carga de datos | Navegar a la pantalla | Barra indeterminada en parte superior mientras carga | ⏳ PENDIENTE | |
| ERR-07 | Error HTTP 401 → redirige a login con mensaje "sesión expirada" | JWT expirado durante uso | Redirect a `/login` con mensaje | ⏳ PENDIENTE | |
| ERR-08 | Error HTTP 403 → mensaje "Acceso denegado" | Rol sin permiso intenta operación | Snackbar de error visible | ⏳ PENDIENTE | |
| ERR-[N] | [Agregar mensajes de error específicos del módulo] | | | ⏳ PENDIENTE | |

---

## 5. Visual general del módulo (VIS)

| ID | Descripción | Resultado esperado | Estado | Notas |
|---|---|---|---|---|
| VIS-GEN-01 | Sidebar colapsado al entrar al módulo (`layoutService.collapse()`) | Sidebar en modo íconos al navegar | ⏳ PENDIENTE | |
| VIS-GEN-02 | Breadcrumb correcto en todas las pantallas | "Módulo → Pantalla" en topbar | ⏳ PENDIENTE | |
| VIS-GEN-03 | Botón primario con color de marca `#6B3C6B` | Botones "Nuevo/Crear/Guardar" con color correcto | ⏳ PENDIENTE | |
| VIS-GEN-04 | Botones destructivos con color `warn` (rojo) | "Eliminar/Cancelar/Desactivar" en rojo | ⏳ PENDIENTE | |
| VIS-GEN-05 | Diálogos de confirmación son modales (click fuera no cierra) | Click backdrop no cierra el diálogo | ⏳ PENDIENTE | |
| VIS-GEN-06 | Campo de búsqueda tiene ícono lupa | Ícono `search` visible | ⏳ PENDIENTE | |
| VIS-GEN-07 | Header de tabla con color `#F2E4F2` / `#6B3C6B` | Fondo lavanda, texto morado | ⏳ PENDIENTE | |
| VIS-GEN-[N] | [Agregar casos visuales generales del módulo] | | ⏳ PENDIENTE | |

---

## Historial de bugs encontrados en este módulo

| Bug ID | Descripción | Dónde se encontró | Estado |
|---|---|---|---|
| BUG-[M]-01 | [Descripción] | [componente] | ⏳ Pendiente |

> Agregar una fila por cada bug encontrado durante las pruebas.
> Referenciar el ID del bug en la columna "Notas" del caso de prueba que lo detectó.
> Documentar el bug completo en §8 de la memoria técnica del módulo.

---

## Checklist de cierre (Propuesta D)

Antes de declarar el módulo **done**, verificar que se cumplen las 4 condiciones:

```
[ ] 1. Todos los casos de este documento tienen estado ✅ PASS — ninguna fila ⏳ PENDIENTE
[ ] 2. ng test --no-watch → 0 fallos; cobertura ≥ 70% statements
[ ] 3. Prueba browser completada con CADA ROL que tiene acceso al módulo
[ ] 4. Memoria técnica §10 actualizada con resultado final
```
