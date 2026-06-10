# CLAUDE.md — Frontend [NOMBRE_PROYECTO]

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Descripción del proyecto

Frontend Angular para [DESCRIPCIÓN_DEL_SISTEMA].
Consume el backend REST API del repositorio `[REPO_BACKEND]` (GitHub: [GITHUB_USER]).

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
- Base URL (desarrollo): `http://localhost:[PUERTO]/api/v1`
- Documentación Swagger: `http://localhost:[PUERTO]/swagger-ui/index.html`
- Especificación OpenAPI: `http://localhost:[PUERTO]/v3/api-docs`
- JWT expira en: [N] horas — implementar re-login o refresh

---

## Memoria técnica global del proyecto

Para entender el sistema completo (visión, decisiones arquitectónicas, contratos
de integración, RBAC transversal, guía de configuración y roadmap) consultar:

**`memoria_tecnica_global_proyecto.md`** — disponible **localmente en este repositorio** (raíz)

⚠️ **Esta es la fuente de contexto primaria para cualquier sesión de desarrollo.**  
Leer siempre al iniciar trabajo en un nuevo módulo. Actualizar al finalizar cada módulo
si hay nuevas decisiones transversales que apliquen a ambas capas.

---

## ⚠️ Convenciones de Git — REGLAS CRÍTICAS

**NUNCA commitear directamente en `main` o `develop`.**
Todo trabajo va en una `feature/` o `fix/` branch y llega vía `git merge --no-ff`.

**Crear la rama ANTES de empezar a modificar, no al final.**
Para cambios de alcance transversal (más de 3 archivos o más de 1 capa), crear la rama
inmediatamente y hacer un commit de "checkpoint" antes de cualquier modificación.
Sin rama previa no hay un punto de retorno limpio si algo sale mal a mitad.

**Instalar el hook de protección al clonar:**
```bash
cp hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

**Flujo obligatorio:**
```bash
git checkout develop
git checkout -b feature/<nombre>
# ... trabajar y commitear en pasos lógicos ...
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

Todo módulo nuevo requiere **tres archivos** en la raíz antes de implementar:
- `propuesta_modulo_<nombre>_frontend.txt` — planificación previa al código
- `casos_de_prueba_modulo_<nombre>.md` — definición de casos ANTES de codificar *(ver sección Protocolo de pruebas)*
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
- Cobertura: `ng test --coverage` → líneas/statements/branches
- E2E: comando Cypress/Playwright, endpoints verificados, resultado X/Y — 0 fallos
- Regresiones: suite pre-módulo X/X → post-módulo X/X

---

## ⚠️ Protocolo obligatorio de pruebas — Propuestas A–D (permanente, todos los módulos)

> **Origen**: En un módulo previo se declaró completo antes de estar funcionando. Múltiples bugs
> de seguridad, lógica y UX solo se descubrieron porque el usuario pidió pruebas explícitamente.
> Estas cuatro propuestas son la respuesta sistémica y aplican a TODOS los módulos futuros sin excepción.

### Propuesta A — Documento de casos de prueba por módulo (pre-código)

`casos_de_prueba_modulo_<nombre>.md` se crea **antes de escribir una sola línea de
implementación**, junto con la propuesta del módulo.

**Uso obligatorio del template:**
```bash
cp casos_de_prueba_modulo_TEMPLATE.md casos_de_prueba_modulo_<nombre>.md
```
El archivo `casos_de_prueba_modulo_TEMPLATE.md` (raíz del proyecto) contiene la
estructura completa con casos genéricos para todas las categorías y el checklist de cierre.
**No crear el documento de casos desde cero — siempre partir del template.**

**Formato de cada caso:**

| ID | Pantalla | Categoría | Descripción | Rol(es) | Resultado esperado | Estado | Notas |
|---|---|---|---|---|---|---|---|

**Categorías obligatorias — deben existir casos para TODAS en cada pantalla:**

| Categoría | Qué cubre |
|---|---|
| `SEC` | Acceso directo por URL con rol no autorizado → debe redirigir |
| `RBAC` | Elementos UI que aparecen/desaparecen según rol (botones, columnas, íconos, títulos) |
| `CRUD` | Crear, leer, editar, eliminar — flujos completos incluyendo recarga de datos |
| `VAL` | Validaciones de formulario: campo vacío, mínimo, máximo, formato, tipo |
| `BSRCH` | Búsquedas y autocompletes: parcial, case insensitive, accent insensitive, sin resultados |
| `UI` | Todos los botones, íconos y acciones verificados uno a uno |
| `FLOW` | Flujos de estado/negocio: máquina de estados, transiciones, bloqueos |
| `RN` | Reglas de negocio del backend: qué rechaza, con qué código y mensaje |
| `ERR` | Mensajes de error: validación, backend (4xx/5xx), red caída |
| `EMPTY` | Estados vacíos: sin datos iniciales vs sin resultados de búsqueda |
| `VIS` | Visual: colores, espaciado, truncado, tooltips, responsive |

**Estados de la columna Estado:**
- `✅ PASS` — verificado en browser y funciona correctamente
- `❌ FAIL` — bug encontrado (documentar en §8 de la memoria técnica)
- `⏳ PENDIENTE` — no ejecutado aún
- `N/A` — no aplica para este módulo/rol

**El documento es el criterio de aceptación.** Un módulo no está "done" si hay casos sin estado PASS.

---

### Propuesta B — Prueba de navegador por componente, no por módulo

**Regla obligatoria:**
> Un componente no está terminado hasta que TODOS sus casos del documento de pruebas
> tienen estado ✅ PASS verificado en el browser con el rol correcto.

**Consecuencia directa:** no avanzar al siguiente componente hasta completar las pruebas
del actual. No acumular deuda de verificación para el final del módulo.

**Por qué:** los bugs de RBAC, validaciones y UX solo se detectan en el browser con datos
reales y el JWT del rol correcto. Los tests unitarios no los detectan.

---

### Propuesta C — Gate de seguridad de rutas (obligatorio en cada ruta nueva)

Al agregar CUALQUIER ruta nueva al router Angular:

```
[ ] La ruta tiene canActivate: [authGuard]
[ ] La ruta tiene data: { roles: ['ROLE_X', ...] } con los roles que SÍ tienen acceso
[ ] Se ejecutó el caso SEC del documento con el rol MENOS privilegiado sin acceso
    (acceso directo por URL en el browser, no solo esconder el enlace en el sidebar)
[ ] El sidebar ocultar el ítem NO cuenta como protección — la ruta necesita su propio guard
```

> **Lección:** Un rol podía acceder a una ruta restringida por URL directa porque
> la ruta no tenía `data.roles`. Esconder el ítem del sidebar es cosmético, no es seguridad.

---

### Propuesta D — Redefinición de "done" para declarar módulo completo

**No ofrecer continuar al siguiente módulo hasta que se cumplan las 4 condiciones:**

```
[ ] 1. Todos los casos del documento de pruebas tienen estado ✅ PASS
[ ] 2. ng test --no-watch → 0 fallos; cobertura ≥ 70% statements
[ ] 3. Las pruebas de navegador de todos los roles están ejecutadas y documentadas
[ ] 4. La columna "Estado" del documento de casos de prueba está completamente llena
         (ninguna fila con ⏳ PENDIENTE)
```

**Si el usuario pide continuar al siguiente módulo y alguna condición no se cumple:**
indicar explícitamente qué condición falta antes de avanzar.

---

### Checklist de apertura de módulo (antes de codificar)

```
[ ] propuesta_modulo_<nombre>_frontend.txt creada
[ ] casos_de_prueba_modulo_<nombre>.md creada COPIANDO el template:
    cp casos_de_prueba_modulo_TEMPLATE.md casos_de_prueba_modulo_<nombre>.md
    (completar todos los marcadores [...] antes de escribir código)
    (categorías obligatorias: SEC, RBAC, CRUD, VAL, BSRCH, UI, FLOW, RN, ERR, EMPTY, VIS)
[ ] memoria_tecnica_modulo_<nombre>_frontend.md iniciada
[ ] Gate de seguridad verificado para todas las rutas del módulo (Propuesta C)
```

---

## ⚠️ Protocolo obligatorio pre-código — Consulta de contratos API

**ANTES de escribir cualquier servicio, modelo o interfaz TypeScript que consuma el backend,
se DEBEN verificar los contratos reales de la API. No hacerlo causa bugs de integración
difíciles de detectar que solo aparecen en el browser con datos reales.**

### Pasos obligatorios

**1. Obtener los contratos de la API** (en orden de preferencia):
   - Leer `memoria_tecnica_global_proyecto.md` — sección 3 (contratos ya documentados)
   - Leer la memoria técnica del módulo — sección 4 (contratos específicos del módulo)
   - Si no están documentados: consultar Swagger UI en `http://localhost:[PUERTO]/swagger-ui/index.html`
   - Alternativa programática: `GET http://localhost:[PUERTO]/v3/api-docs` (OpenAPI JSON)
   - Si el backend no está corriendo: leer el código fuente del controller en la ruta local del backend

**2. Verificar para CADA endpoint:**

| Dato | Por qué verificarlo | Error típico si se omite |
|---|---|---|
| Ruta exacta (método + path) | Puede no existir | 404 o 403 en browser |
| Código de respuesta HTTP | Puede ser 204 (sin body) | `null` al parsear el JSON inexistente |
| Nombres exactos de campos del response | Backend y frontend usan nombres distintos | Campos `undefined` silenciosos |
| Estructura del request body | Campos opcionales vs obligatorios | 400 Bad Request |
| `PageResponse<T>` vs objeto simple vs `void` | Un endpoint de colección NUNCA retorna `[]` | `TypeError: collection[Symbol.iterator] is not a function` |

**3. Antes de escribir código, documentar en la Sección 4** de la memoria técnica del módulo:
   - Tabla de endpoints verificados (método, ruta, request, response, HTTP status)
   - Interfaces TypeScript de TODOS los DTOs con nombres de campo EXACTOS del backend

**4. Nunca asumir nombres de campos** — leer el JSON real o el DTO del backend.

> **Lección (nombre de campo incorrecto):** El backend usaba un nombre de campo en el DTO
> que el frontend asumió diferente. El error pasó desapercibido en tests y solo se detectó
> en el browser al ver un dropdown vacío.

> **Lección (campo proxy en lugar de campo real):** Un campo de negocio crítico estaba en el DTO
> desde el principio, pero el formulario usaba otro campo como proxy. El error no se detectó
> en tests porque los tests no verificaban la trazabilidad regla-de-negocio → componente UI.

> **Lección (búsqueda con acentos):** La búsqueda usaba `LOWER()` en JPQL, que elimina mayúsculas
> pero NO diacríticos. "galon" no encontraba "Galón". Fix: PostgreSQL `unaccent` extension +
> función `f_unaccent(text)` inmutable + nativeQuery en el repositorio.
> Este estándar aplica a TODAS las búsquedas LIKE del sistema.

**5. Verificar trazabilidad regla-de-negocio → componente UI** — para cada validación del backend,
identificar el componente UI responsable y confirmar que:
- muestra los datos relevantes para esa regla (no un campo proxy)
- valida preventivamente antes del submit cuando es posible
- muestra un mensaje de error útil si el backend rechaza

### Checklist de verificación pre-código

```
[ ] Leí memoria_tecnica_global_proyecto.md (sección 3 — contratos de integración)
[ ] Leí la memoria técnica del módulo actual (sección 4 — si ya existe)
[ ] Para cada endpoint: verifiqué ruta exacta, método HTTP y código de respuesta
[ ] Para cada response: verifiqué si es PageResponse<T>, objeto simple o void (204)
[ ] Para cada DTO: verifiqué nombres exactos de campos (no asumí ninguno)
[ ] Documenté contratos verificados en la Sección 4 de la memoria técnica antes de codificar
[ ] Para cada regla de negocio del backend: identifiqué el componente UI que le aplica,
    muestra los datos correctos para esa regla, valida preventivamente, y muestra error útil
[ ] Verifiqué qué campos son de solo lectura en cada operación (ej. stock vía movimientos,
    campos de auditoría) y que el formulario no los exponga como editables
[ ] Verifiqué que cada columna/dato sensible (costos, datos financieros) está oculto
    para los roles que no deben verlo — no solo en el backend sino también en el frontend
[ ] Si el módulo incluye búsqueda LIKE por texto libre: el endpoint de backend usa
    f_unaccent() (nativeQuery=true) y el frontend usa debounceTime(350) + search vacío = omitir parámetro
[ ] Al cambiar la firma de un método de servicio compartido (ej. getActive()),
    buscar TODOS los lugares donde se llama ese método y actualizar las llamadas.
    Un error de TypeScript en un componente distinto puede impedir que todo el módulo compile.
```

---

## ⚠️ Protocolo obligatorio post-código — Cierre de componente/módulo

**ANTES de declarar cualquier componente o pantalla como terminada**, ejecutar las siguientes
verificaciones. No basta con que el código compile y los tests unitarios pasen.

### Checklist de cierre por componente (Propuesta B)

```
[ ] Todos los casos del documento casos_de_prueba_modulo_<nombre>.md para ESTA
    pantalla/componente tienen estado ✅ PASS — ninguno ⏳ PENDIENTE
[ ] Los casos cubren las categorías: SEC, RBAC, CRUD, VAL, BSRCH, UI, FLOW, RN, ERR, EMPTY
[ ] ng test --no-watch ejecutado → 0 fallos en la suite completa
[ ] ng build ejecutado → 0 errores de TypeScript antes de declarar el componente listo
[ ] Prueba browser para cada rol con acceso a la pantalla:
    [ ] Todos los botones e íconos de acción verificados uno a uno (categoría UI)
    [ ] Todos los campos de búsqueda: case insensitive, accent insensitive, sin resultados
    [ ] Elementos UI aparecen/ocultan según rol (botones, columnas, acciones, títulos)
    [ ] Flujo principal happy path sin errores de consola
    [ ] Todos los mensajes de error del backend son visibles y útiles en la UI
    [ ] Estados vacíos: sin datos iniciales y sin resultados de búsqueda
[ ] Gate de seguridad de rutas verificado (Propuesta C):
    [ ] canActivate: [authGuard] con data.roles configurado
    [ ] Acceso directo por URL con rol no autorizado → redirige correctamente
[ ] Para cada regla de negocio del backend aplicable a esta pantalla:
    [ ] El componente muestra el dato CORRECTO que la regla valida (no un campo proxy)
    [ ] Validación preventiva antes del submit cuando es posible
    [ ] Mensaje de error del backend (4xx/422) visible en la UI como snackbar rojo
[ ] Campos de solo lectura en modo edición:
    [ ] Deshabilitados con disable() — no solo visualmente bloqueados
    [ ] form.getRawValue() usado al emitir si el campo disabled debe enviarse
[ ] Datos sensibles (costos, márgenes, precios):
    [ ] Visibles SOLO para roles autorizados
    [ ] Ausentes del DOM para roles no autorizados (no solo display:none)
[ ] No hay asteriscos dobles — Angular Material genera * con Validators.required
[ ] Revisé las lecciones documentadas en la memoria técnica buscando el mismo patrón
[ ] Verifiqué que otros componentes que usan los mismos servicios no rompieron (regresión mínima)
```

### Checklist de cierre de módulo — Propuesta D (condiciones para declarar "done")

```
[ ] 1. TODOS los casos del documento de pruebas tienen ✅ PASS — columna Estado llena
[ ] 2. Suite completa ng test → X specs, 0 fallos; cobertura ≥ 70% statements
[ ] 3. Regresión: specs de módulos anteriores siguen en 0 fallos
[ ] 4. Prueba browser completa con todos los roles documentada en el documento de casos
[ ] Verificación de seguridad backend (curl) para todos los endpoints del módulo
[ ] Memoria técnica del módulo §10 actualizada (bugs y correcciones con referencia a ID)
[ ] memoria_tecnica_global_proyecto.md actualizada (decisiones y lecciones)
[ ] CLAUDE.md actualizado con bugs del módulo y nuevas lecciones
[ ] Commits y push realizados siguiendo las convenciones git del proyecto
```

---

## Identidad visual y paleta de colores

### Nombre del sistema
**[NOMBRE_PROYECTO]** — nombre en sidebar, login, título del browser y favicon.

### Paleta principal

| Uso | Hex | Descripción |
|---|---|---|
| Primary / Brand | `[COLOR_PRIMARY]` | Color principal — sidebar, headers, botones primarios |
| Accent / Highlight | `[COLOR_ACCENT]` | Color de acento — badges, indicadores activos, hover states |
| Surface / Background | `[COLOR_SURFACE]` | Color de superficie — fondos de cards, inputs, áreas de contenido |

### Colores complementarios

| Uso | Hex | Descripción |
|---|---|---|
| Background general | `#FAFAFA` | Gris muy claro — fondo base de la app |
| Surface cards | `#FFFFFF` | Blanco — interior de cards y paneles |
| Text primary | `#212121` | Gris muy oscuro — textos principales |
| Text secondary | `#757575` | Gris medio — subtítulos, labels |
| Dividers | `#E0E0E0` | Gris claro — separadores, bordes |
| Success | `#2E7D32` | Verde oscuro — estados positivos/completados |
| Warning | `#E65100` | Naranja oscuro — estados pendientes/advertencia |
| Info | `#1565C0` | Azul oscuro — estados informativos/aprobados |
| Error | `#C62828` | Rojo oscuro — errores, estados cancelados |

### Reglas de uso de color

- El color de acento es de uso moderado (máx 10-15% del área visible).
  Puntos de aplicación: badge del rol activo, ítem de sidebar seleccionado, chips de estado,
  indicadores de progreso, subrayado de links activos.
- El color primary es el color de marca — sidebar, toolbar, botones primarios.
- El color surface es para fondos de formularios y cards de detalle.
- Los textos sobre fondos oscuros deben ser blancos (`#FFFFFF`) para cumplir WCAG AA.

### Tema Angular Material

Definir en `src/styles/theme.scss`:
```scss
@use '@angular/material' as mat;

$primary-palette: mat.define-palette((
  100: [COLOR_SURFACE],
  300: [COLOR_ACCENT],
  500: [COLOR_PRIMARY_MID],
  700: [COLOR_PRIMARY],
  900: [COLOR_PRIMARY_DARK],
  contrast: (
    100: #212121,
    300: #212121,
    500: #ffffff,
    700: #ffffff,
    900: #ffffff,
  )
));

$theme: mat.define-light-theme((
  color: (
    primary: $primary-palette,
    accent:  $primary-palette,
    warn:    mat.define-palette(mat.$red-palette),
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
│  [≡]  [NOMBRE_PROYECTO]            [🔔] [👤 Admin ▼] │
├────────┬─────────────────────────────────────────────┤
│Sidebar │           Área de contenido                 │
│(240px) │  ┌──────────────────────────────────────┐   │
│        │  │  Breadcrumb  │  Título  │  Actions   │   │
│ [🔲]   │  ├──────────────────┬───────────────────┤   │
│ Mod 1  │  │  Panel Lista     │  Panel Detalle    │   │
│        │  │  (filtros+tabla) │  (formulario/     │   │
│ [🔲]   │  │                  │   vista detalle)  │   │
│ Mod 2  │  │                  │                   │   │
│        │  └──────────────────┴───────────────────┘   │
│ ─────  │                                             │
│ [⚙️]   │                                             │
│ [◀]    │                                             │
└────────┴─────────────────────────────────────────────┘
```

### Sidebar — estructura y comportamiento

- **Ancho expandido**: 240px | **Ancho colapsado**: 64px
- **Fondo**: `[COLOR_PRIMARY]`
- **Texto e íconos**: `#FFFFFF`
- **Ítem activo**: fondo con color de acento al 25% de opacidad, borde izquierdo 3px `[COLOR_ACCENT]`
- **Hover**: fondo `rgba(255,255,255,0.08)`
- **Transición**: 200ms ease-in-out al colapsar/expandir
- Botón de colapso (chevron) al fondo del sidebar
- El sidebar se adapta dinámicamente según el rol del usuario autenticado

### Vista dividida lista + detalle (Master-Detail)

- **Panel lista**: ~40% del ancho disponible — tabla con paginación, filtros, búsqueda
- **Panel detalle**: ~60% del ancho disponible — formulario o vista de detalle
- **Estado vacío del panel detalle**: mensaje amigable "Selecciona un elemento para ver los detalles"
- **Animación**: fade-in suave al cargar el detalle (150ms)
- El ítem seleccionado en la lista tiene fondo `[COLOR_SURFACE]`

### Top Bar

- **Fondo**: `#FFFFFF` con sombra sutil
- **Logo/nombre**: a la izquierda, con botón hamburguesa para colapsar sidebar
- **Zona derecha**: ícono de notificaciones + chip del nombre de usuario con su rol
- El chip del rol usa colores semánticos por rol

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
│   │           └── status-label.pipe.ts (enum → label legible)
│   └── modules/
│       ├── auth/       (login, perfil, cambio de contraseña, gestión de usuarios)
│       ├── [MODULO_1]/ ([descripción])
│       ├── [MODULO_2]/ ([descripción])
│       └── [MODULO_N]/ ([descripción])
├── environments/
│   ├── environment.ts          (dev — apiUrl: 'http://localhost:[PUERTO]/api/v1')
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
- **Dumb components** (presentacionales): reciben `@Input()`, emiten `@Output()`, sin lógica de negocio.

**Por qué separar**: los dumb components son 100% reutilizables y testeables sin mocks de servicios.

### Formularios

Usar siempre **Reactive Forms** (`FormGroup`, `FormControl`, `Validators`).
Nunca Template-driven forms — son más difíciles de testear y tienden a dispersar la validación.

```typescript
this.form = this.fb.group({
  name:  ['', [Validators.required, Validators.maxLength(120)]],
  price: [null, [Validators.required, Validators.min(0.01)]],
});
```

### Servicios HTTP

- Un servicio por módulo de negocio.
- Todos los métodos retornan `Observable<T>` — nunca suscribirse dentro del servicio.
- El interceptor JWT agrega el header automáticamente — los servicios no manejan tokens.
- El interceptor de errores maneja 401 (redirigir a login) y 403 (mostrar acceso denegado).

```typescript
@Injectable({ providedIn: 'root' })
export class [Entidad]Service {
  private readonly api = `${environment.apiUrl}/[ruta]`;
  private http = inject(HttpClient);

  getAll(page = 0, size = 20): Observable<PageResponse<[Entidad]Response>> {
    return this.http.get<PageResponse<[Entidad]Response>>(this.api, {
      params: { page, size }
    });
  }
}
```

**Importante:** Al agregar o cambiar parámetros en un método de servicio compartido,
buscar TODOS los componentes que llaman ese método y actualizar las llamadas.
Un error de TypeScript en un componente distinto puede impedir que todo el módulo compile
y producir comportamiento inesperado en componentes aparentemente no relacionados.

### Consumo de paginación

El backend retorna `PageResponseDTO<T>`. Diseñar todos los componentes de lista
para consumir este formato desde el primer componente:

```typescript
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

### Gestión de suscripciones

Usar `takeUntilDestroyed()` (Angular 16+) para evitar memory leaks.

```typescript
private destroyRef = inject(DestroyRef);

ngOnInit() {
  this.service.getAll().pipe(
    takeUntilDestroyed(this.destroyRef)
  ).subscribe(data => this.items = data);
}
```

### Autenticación y guards

- El token JWT se almacena en `localStorage` (persiste entre sesiones).
- Al cerrar sesión: eliminar el token y redirigir a `/login`.
- `AuthGuard` implementa `canActivate` verificando token + rol requerido.
- Las rutas se configuran con `data: { roles: ['ROLE_X', 'ROLE_Y'] }`.
- Si el token expira, el interceptor detecta 401 y redirige a login con mensaje.

### Búsqueda de texto insensible a acentos (estándar del proyecto)

**Backend (PostgreSQL):**
```sql
-- Una sola vez en la base de datos:
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE OR REPLACE FUNCTION f_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
  $$ SELECT public.unaccent('public.unaccent', $1) $$;

-- Índice funcional por tabla/columna buscable:
CREATE INDEX IF NOT EXISTS idx_<tabla>_unaccent_<col>
  ON <tabla> (f_unaccent(lower(<col>)));
```

**Backend (Repository) — nativeQuery obligatorio:**
```java
@Query(value =
  "SELECT t.* FROM tabla t WHERE t.active = true " +
  "AND (:search IS NULL OR (" +
  "     f_unaccent(lower(t.columna)) LIKE '%' || f_unaccent(lower(CAST(:search AS text))) || '%')) " +
  "ORDER BY t.columna ASC",
  countQuery = "SELECT COUNT(*) FROM tabla t WHERE t.active = true " +
               "AND (:search IS NULL OR (" +
               "     f_unaccent(lower(t.columna)) LIKE '%' || f_unaccent(lower(CAST(:search AS text))) || '%'))",
  nativeQuery = true)
Page<Entidad> search(@Param("search") String search, Pageable pageable);
```

**Backend (Service) — normalizar blank a null:**
```java
String normalized = (search != null && !search.isBlank()) ? search.trim() : null;
return repo.search(normalized, PageRequest.of(page, size)); // sin Sort en nativeQuery
```

**Frontend (Service) — omitir parámetro si vacío:**
```typescript
getActive(search = '', page = 0, size = 20): Observable<PageResponse<T>> {
  const params: Record<string, string | number> = { page, size };
  if (search?.trim()) params['search'] = search.trim();
  return this.http.get<PageResponse<T>>(`${this.api}/active`, { params });
}
```

**Frontend (Componente) — debounce:**
```typescript
searchCtrl.valueChanges.pipe(
  debounceTime(350),
  distinctUntilChanged(),
  takeUntilDestroyed(this.destroyRef),
).subscribe(() => { this.currentPage = 0; this.load(); });
```

---

## Estándares de UX/UI

### Tooltips y popovers

- **Tooltips** (`matTooltip`): en todos los botones de íconos sin texto visible,
  en columnas de tabla con texto truncado, en badges de estado.
- **Delay de tooltip**: 300ms para no mostrarlos al pasar el cursor rápidamente.
- Los formularios muestran mensajes de error inline bajo cada campo (no en toast ni alert).

### Feedback al usuario

- **Acciones exitosas**: `MatSnackBar` en la parte inferior derecha, duración 3 segundos,
  fondo `#2E7D32` (verde). Mensaje conciso.
- **Errores de negocio**: `MatSnackBar` con fondo `#C62828` (rojo). Mensaje del backend si disponible.
- **Carga de datos**: `MatProgressBar` en la parte superior del panel (indeterminado).
- **Confirmación de acciones destructivas**: `MatDialog` con el patrón confirm-dialog
  antes de desactivar, cancelar órdenes, o cualquier acción irreversible.
- **Estado vacío**: componente `EmptyStateComponent` con ícono, título y descripción.
  Diferente mensaje para "sin datos" vs "sin resultados de búsqueda".

### Tablas

- Usar `MatTable` con `MatPaginator` y barra de búsqueda.
- Columnas con texto largo usan truncado con `text-overflow: ellipsis` + tooltip con el valor completo.
- La fila seleccionada se resalta con fondo `[COLOR_SURFACE]`.
- Columna de acciones (editar, ver, desactivar) siempre a la derecha, íconos con tooltip.
- **Truncado de celdas**: nunca aplicar `display: block` sobre un `<td>`. Usar un `<div>` wrapper interno.
- **Contenedor de tabla**: `border-radius: 8px; border: 1px solid var(--color-divider); background: #fff`.
- **Botones en filas clickeables**: cuando `mat-row` tiene `(click)`, TODOS los botones de acción
  dentro de la fila DEBEN incluir `$event.stopPropagation()` para evitar que el click burbujee.
- **Layout del toolbar de lista**: usar `__filters` (izquierda, flex con los campos de búsqueda/filtro)
  y `__actions` (derecha, solo botones de creación). No mezclar campos de búsqueda con botones de acción.

### Navegación lista ↔ detalle con tabs

- Al navegar al detalle: `router.navigate(['/path/id'], { queryParams: { from: this.activeTab } })`
- En `goBack()` del detalle: leer `route.snapshot.queryParamMap.get('from')` y navegar con `{ queryParams: { tab: from } }`
- En `ngOnInit()` de la lista: leer `?tab=` y setear `activeTab` antes de cargar datos
- `counts: Map<Status, number>` separado de `pages: Map<Status, PageResponse<T>>` — nunca mezclarlos

### Formularios

- Labels siempre visibles (no solo placeholder que desaparece al escribir).
- Campos obligatorios marcados con asterisco — Angular Material lo genera con `Validators.required`.
- El botón de guardar se deshabilita mientras el formulario sea inválido o esté cargando.
- **Formularios de edición**: agregar `!form.dirty` a la condición de disable — el botón solo se
  activa cuando el usuario ha modificado algo. Usar `form.markAsPristine()` tras guardar.
- Campos de fecha usan `MatDatepicker`.
- Los selectores de rol/estado/tipo usan `MatSelect` con opciones descriptivas.

### Badges de estado

Los estados tienen colores semánticos consistentes en toda la app:

| Estado | Color fondo | Color texto | Ícono |
|---|---|---|---|
| PENDING / pendiente | `#FFF3E0` | `#E65100` | `schedule` |
| APPROVED / aprobado | `#E3F2FD` | `#1565C0` | `check_circle` |
| COMPLETED / completado | `#E8F5E9` | `#2E7D32` | `done_all` |
| CANCELLED / cancelado | `#FFEBEE` | `#C62828` | `cancel` |

### Accesibilidad mínima

- Contraste de texto: mínimo WCAG AA (4.5:1 para texto normal, 3:1 para texto grande).
- Todos los íconos interactivos tienen `aria-label`.
- El sidebar y el foco del teclado deben ser navegables con Tab.
- Los diálogos atrapan el foco mientras están abiertos.

---

## RBAC en el frontend

El sidebar y las rutas se adaptan al rol del usuario extraído del JWT.

| Módulo / Sección | [ROL_1] | [ROL_2] | [ROL_3] | [ROL_4] |
|---|:---:|:---:|:---:|:---:|
| [MÓDULO_1] (escritura) | ✓ | ✓ | — | — |
| [MÓDULO_1] (lectura) | ✓ | ✓ | ✓ | ✓ |
| [MÓDULO_2] | ✓ | ✓ | — | — |
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

Cobertura mínima: **70% statements** por módulo.

---

## Comandos comunes

```bash
# Instalar Angular CLI globalmente
npm install -g @angular/cli

# Crear proyecto
ng new [nombre-proyecto] --style=scss --routing=true --strict

# Agregar Angular Material
ng add @angular/material

# Ejecutar en desarrollo
ng serve

# Verificar que compila sin errores TypeScript
ng build --configuration=development

# Ejecutar tests unitarios
ng test

# Ejecutar tests con cobertura
ng test --code-coverage

# Build de producción
ng build --configuration=production
```

---

## Referencia al backend

| Recurso | URL |
|---|---|
| Swagger UI | `http://localhost:[PUERTO]/swagger-ui/index.html` |
| OpenAPI spec | `http://localhost:[PUERTO]/v3/api-docs` |
| Login | `POST http://localhost:[PUERTO]/api/v1/auth/login` |
| Repositorio backend | [GITHUB_REPO_BACKEND] |

---

## Estado inicial

**Fase**: inicialización — pendiente de implementación.

**Próximos pasos:**
1. Instalar Angular CLI y crear el proyecto base con Angular Material
2. Configurar tema personalizado con la paleta definida
3. Implementar estructura de layout (sidebar + top bar + main-layout)
4. Implementar módulo de autenticación (login, JWT interceptor, guards)
5. Implementar módulos de negocio por audiencia según RBAC
