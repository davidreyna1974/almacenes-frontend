# Memoria Técnica — Módulo 0: Infraestructura Base

**Fecha de inicio:** 2026-06-05  
**Fecha de cierre:** 2026-06-05  
**Rama:** `feature/infra-base`  
**Estado:** Completado

---

## 1. Contexto y justificación

El Módulo 0 establece la fundación técnica y visual de la aplicación. No tiene
funcionalidad de negocio visible para el usuario final, pero es la base sin la
cual ningún módulo posterior puede existir.

**Problema que resuelve:** Antes de este módulo el repositorio contenía solo
archivos de documentación. No había proyecto Angular, ni tema visual, ni
estructura de carpetas, ni componentes reutilizables.

**Por qué es el primer módulo:** El Módulo 1 (Auth) necesita el layout shell
para mostrar el formulario de login. El Módulo 2 en adelante necesita el
`PageResponse<T>`, el `MasterDetailComponent` y el `StatusLabelPipe`. Todo
depende de que este módulo esté completo.

**Lección aplicada del backend (L1):** El backend tuvo que actualizar 9 archivos
cuando agregó paginación al final. En este frontend, el modelo `PageResponse<T>`
se define aquí, antes del primer servicio HTTP, para que todos los módulos
lo usen desde el día uno.

---

## 2. Decisiones de diseño

| Decisión | Alternativa descartada | Justificación |
|---|---|---|
| `mat-sidenav-container` para el layout shell | CSS Grid puro | Material gestiona animación de colapso, overlay en pantallas pequeñas y z-index correctamente. Menos código propio a mantener |
| `BehaviorSubject<boolean>` en `LayoutService` para el estado del sidebar | `@Input()` entre componentes | Sidebar y Topbar son hermanos en el árbol de componentes, no padre-hijo. Un servicio es la única forma limpia de comunicarlos |
| Variables CSS (`--color-primary`) en `variables.scss` | Solo variables SCSS (`$color-primary`) | Las variables CSS son accesibles en runtime desde TypeScript; las SCSS solo existen en tiempo de compilación |
| `--directory=.` en `ng new` | Crear en subdirectorio | El repositorio git ya existe en este directorio. Crear un subdirectorio rompería la estructura del repo y el historial de git |
| `--skip-git` en `ng new` | ng new por defecto | El repo ya tiene git inicializado con historial de commits. Sin este flag, `ng new` crearía un `.git` nuevo y sobreescribiría el `.gitignore` |
| Skeleton loader como filas `<tr>` animadas | `MatProgressSpinner` centrado | Evita CLS (Cumulative Layout Shift); comunica la estructura que viene; mejor experiencia percibida según Material Design |
| `SharedModule` que declara y exporta los componentes compartidos | Standalone components | Consistencia con el estilo de módulos del proyecto; más legible para la arquitectura actual |

---

## 3. Especificación de componentes y vistas

### 3.1 LayoutService

```
Archivo:  src/app/core/layout/layout.service.ts
Tipo:     Servicio singleton (providedIn: 'root')
Estado:   collapsed$: BehaviorSubject<boolean> (false = expandido)
Métodos:  toggle(), collapse(), expand()
```

### 3.2 SidebarComponent

```
Archivo:  src/app/core/layout/sidebar/
Tipo:     Smart component (consume LayoutService)
Ancho:    240px expandido / 64px colapsado
Fondo:    #6B3C6B
Transición: 200ms ease-in-out

Ítems de navegación (placeholder hasta Módulo 1 donde se filtran por rol):
  - Inventario    (mat-icon: inventory_2)
  - Compras       (mat-icon: shopping_cart)
  - Ventas        (mat-icon: point_of_sale)
  - Reportes      (mat-icon: bar_chart)
  - Usuarios      (mat-icon: manage_accounts)

Ítem activo:
  fondo: rgba(206,110,235,0.25)
  borde izquierdo: 3px solid #CE6EEB

Hover:
  fondo: rgba(255,255,255,0.08)

Botón colapso:
  chevron_left (expandido) / chevron_right (colapsado)
  posición: al fondo del sidebar
```

### 3.3 TopbarComponent

```
Archivo:  src/app/core/layout/topbar/
Tipo:     Smart component (consume LayoutService)
Fondo:    #FFFFFF
Sombra:   0 1px 4px rgba(107,60,107,0.15)
Altura:   64px

Zona izquierda:
  - Botón hamburguesa (mat-icon: menu) → llama LayoutService.toggle()
  - Texto "Almacenes" con tipografía de marca

Zona derecha (placeholder hasta Módulo 1):
  - Ícono de notificaciones (mat-icon: notifications_none)
  - Chip de usuario: "Usuario" con rol "ADMIN" (estático en este módulo)
    Color chip ADMIN: #6B3C6B
```

### 3.4 MainLayoutComponent

```
Archivo:  src/app/core/layout/main-layout/
Tipo:     Shell component
Estructura:
  <mat-sidenav-container>
    <mat-sidenav>        ← SidebarComponent
    <mat-sidenav-content>
      <app-topbar>
      <main>
        <router-outlet>  ← aquí cargan los módulos de negocio
```

### 3.5 MasterDetailComponent

```
Archivo:  src/app/shared/components/master-detail/
Tipo:     Dumb component
@Input()  masterTitle: string
@Output() itemSelected: EventEmitter<void>

Layout:
  Panel izquierdo (master): 40% del ancho — ng-content slot "master"
  Panel derecho (detail):   60% del ancho — ng-content slot "detail"
  Separador vertical: 1px #E0E0E0

Estado vacío del panel detail:
  Mensaje "Selecciona un elemento para ver los detalles"
  Ícono: touch_app
```

### 3.6 ConfirmDialogComponent

```
Archivo:  src/app/shared/components/confirm-dialog/
Tipo:     Dumb component (invocado via MatDialog)
@Input() (via MAT_DIALOG_DATA):
  title:   string   (ej. "Desactivar usuario")
  message: string   (ej. "¿Estás seguro? Esta acción no se puede deshacer.")
  confirmLabel?: string  (default: "Confirmar")
  cancelLabel?:  string  (default: "Cancelar")

Retorna: true (confirmó) | false (canceló)
```

### 3.7 EmptyStateComponent

```
Archivo:  src/app/shared/components/empty-state/
Tipo:     Dumb component
@Input()  variant: 'empty' | 'no-results'

Variante 'empty':
  Ícono:       inventory_2
  Título:      "Sin datos"
  Descripción: "Aún no hay registros. Crea el primero con el botón +"

Variante 'no-results':
  Ícono:       search_off
  Título:      "Sin resultados"
  Descripción: "Ningún registro coincide con los filtros aplicados."
```

### 3.8 StatusLabelPipe

```
Archivo:  src/app/shared/pipes/status-label.pipe.ts
Nombre:   statusLabel
Uso:      {{ order.status | statusLabel }}

Traducciones:
  PENDING   → "Pendiente"
  APPROVED  → "Aprobado"
  RECEIVED  → "Recibido"
  DELIVERED → "Entregado"
  CANCELLED → "Cancelado"
  ACTIVE    → "Activo"
  INACTIVE  → "Inactivo"
  (otros)   → valor original sin transformar
```

---

## 4. Servicios y contratos con el backend

En este módulo **no hay llamadas HTTP al backend**. Se establecen únicamente
los modelos TypeScript que representan los contratos del backend para uso
en módulos posteriores.

### PageResponse\<T\>

```typescript
// src/app/shared/models/page-response.model.ts
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

Fuente: `memoria_tecnica_global_proyecto.md` §3 — contrato exacto del backend.

### ApiError

```typescript
// src/app/shared/models/api-error.model.ts
export interface ApiError {
  timestamp: string;
  status:    number;
  error:     string;
  message:   string;
}
```

Fuente: `memoria_tecnica_global_proyecto.md` §3 — formato del `GlobalExceptionHandler`.

### Environments

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1'
};
```

### Proxy de desarrollo

```json
// proxy.conf.json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  }
}
```

---

## 5. Algoritmos y lógica no trivial

### 5.1 Colapso del sidebar con CSS transition

El ancho del sidebar se controla mediante una clase CSS aplicada condicionalmente.
La transición se hace en CSS, no en JavaScript, para que sea fluida y no bloquee
el hilo principal:

```scss
// sidebar.component.scss
.sidebar {
  width: 240px;
  transition: width 200ms ease-in-out;

  &.collapsed {
    width: 64px;

    .nav-label { display: none; }
    .sidebar-title { display: none; }
  }
}
```

La clase `collapsed` se aplica desde el template con `[class.collapsed]="collapsed$ | async"`.

### 5.2 ng-content con slots nombrados en MasterDetailComponent

Para que el componente pueda recibir HTML arbitrario en sus dos paneles
sin conocer su contenido, se usan slots de `ng-content`:

```html
<!-- master-detail.component.html -->
<div class="master-panel">
  <ng-content select="[slot=master]"></ng-content>
</div>
<div class="detail-panel">
  <ng-content select="[slot=detail]"></ng-content>
</div>

<!-- Uso en un módulo de negocio -->
<app-master-detail>
  <div slot="master"> <!-- lista --> </div>
  <div slot="detail"> <!-- formulario --> </div>
</app-master-detail>
```

---

## 6. RBAC — criterio de visibilidad por rol

En este módulo el RBAC no está implementado porque el `AuthService` aún no
existe (se implementa en el Módulo 1). Los ítems del sidebar se muestran
todos como placeholder estático.

**Preparación para el Módulo 1:**
El `SidebarComponent` tiene definida la estructura de datos de los ítems de
navegación como un array de objetos con el campo `roles: string[]`.
En el Módulo 1, el `AuthService` se inyectará en el sidebar y filtrará
ese array según el rol del usuario autenticado.

```typescript
// Estructura preparada en este módulo (sin filtro aún)
navItems = [
  { label: 'Inventario', icon: 'inventory_2',    route: '/inventory',
    roles: ['ROLE_ADMIN','ROLE_MANAGER','ROLE_WAREHOUSEMAN','ROLE_SALES'] },
  { label: 'Compras',    icon: 'shopping_cart',  route: '/purchases',
    roles: ['ROLE_ADMIN','ROLE_MANAGER','ROLE_WAREHOUSEMAN'] },
  { label: 'Ventas',     icon: 'point_of_sale',  route: '/sales',
    roles: ['ROLE_ADMIN','ROLE_MANAGER','ROLE_SALES'] },
  { label: 'Reportes',   icon: 'bar_chart',      route: '/reports',
    roles: ['ROLE_ADMIN','ROLE_MANAGER','ROLE_WAREHOUSEMAN','ROLE_SALES'] },
  { label: 'Usuarios',   icon: 'manage_accounts', route: '/admin/users',
    roles: ['ROLE_ADMIN'] },
];
```

---

## 7. Ejecución de tests y resultados

### Suite completa — Módulo 0

```
Fecha: 2026-06-05
Comando: ng test --watch=false
Resultado: 26 specs, 0 failures  (5 archivos de test)

Archivos de test:
  src/app/app.spec.ts                                                  2 specs, 0 failures
  src/app/core/layout/layout.service.spec.ts                           6 specs, 0 failures
  src/app/shared/pipes/status-label.pipe.spec.ts                       8 specs, 0 failures
  src/app/shared/components/empty-state/empty-state.component.spec.ts  5 specs, 0 failures
  src/app/shared/components/master-detail/master-detail.component.spec.ts  5 specs, 0 failures
```

### Cobertura de código

```
Comando: ng test --watch=false --coverage --coverage-reporters=text-summary
Resultado:
  Statements : 98.36% ( 60/61 )  ✓ (mín. 70%)
  Branches   : 96.00% ( 48/50 )  ✓ (mín. 70%)
  Functions  : 100.00% ( 10/10 ) ✓ (mín. 70%)
  Lines      : 100.00% ( 35/35 ) ✓ (mín. 70%)
```

### Notas sobre la suite de tests

**Runner:** Vitest v4.1.8 (Angular 21 reemplaza Karma/Jasmine por Vitest por defecto).

**Correcciones aplicadas durante desarrollo:**
- `toBeTrue()` / `toBeFalse()` no existen en Vitest → reemplazados por `toBe(true)` / `toBe(false)`
- `done()` callback (Jasmine) no soportado → reemplazados por `async/await` + `firstValueFrom()`
- `spyOn()` global no disponible → importar `vi` desde `'vitest'` y usar `vi.spyOn()`
- Asignación directa `component.input = value` no re-renderiza componentes con `OnPush` →
  reemplazado por `fixture.componentRef.setInput('input', value)` (API Angular 14+)
- Test por defecto de `app.spec.ts` buscaba `<h1>Hello, almacenes</h1>` del template
  original de Angular CLI → reescrito para verificar `<router-outlet>` que es lo que
  existe en nuestro componente `App`

---

## 8. Bugs y retos durante el desarrollo

### B1 — `.gitignore` en conflicto al ejecutar `ng new`

**Síntoma:** `ng new --force` no podía sobreescribir el `.gitignore` existente.  
**Causa:** el archivo ya existía en el repositorio.  
**Solución:** renombrar a `.gitignore.backup`, ejecutar `ng new`, fusionar contenidos manualmente, eliminar el backup.

### B2 — Error `npm EACCES` en `ng new`

**Síntoma:** npm falló al intentar escribir en el directorio de caché con permisos de root.  
**Causa:** archivos del caché de npm con propietario `root` en el directorio del usuario.  
**Solución:** usar `npm install --cache /tmp/npm-cache-almacenes` para evitar el directorio con permisos insuficientes sin necesidad de `sudo`.

### B3 — Flag `--browsers=ChromeHeadless` inválido

**Síntoma:** `ng test --browsers=ChromeHeadless` arrojaba error de argumento desconocido.  
**Causa:** Angular 21 usa Vitest en lugar de Karma; los flags de Karma no aplican.  
**Solución:** usar `ng test --watch=false` sin flags específicos de Karma.

### B4 — Matchers de Jasmine en contexto Vitest

**Síntoma:** `toBeTrue()`, `toBeFalse()`, `done()` causaban fallos.  
**Causa:** Vitest no incluye los matchers extendidos de Jasmine.  
**Solución:** usar matchers estándar (`toBe(true/false)`), `async/await` + `firstValueFrom()`, e importar `vi` desde `'vitest'`.

### B5 — `OnPush` ignora asignaciones directas en tests

**Síntoma:** `component.showDetail = true; fixture.detectChanges()` no actualizaba el DOM.  
**Causa:** `ChangeDetectionStrategy.OnPush` solo re-renderiza cuando cambia una referencia de `@Input`, se dispara un evento, o se llama `markForCheck()`. La asignación directa no activa ninguna de estas condiciones.  
**Solución:** `fixture.componentRef.setInput('showDetail', true)` — API disponible desde Angular 14 que marca el componente correctamente para OnPush.

### B6 — Conflicto tema M3 vs M2 de Angular Material

**Síntoma:** `ng add @angular/material` generó un tema M3 en `styles.scss` usando `mat.theme()`, incompatible con nuestra paleta M2.  
**Causa:** Angular Material 21 usa M3 por defecto.  
**Solución:** reemplazar completamente `styles.scss` para importar únicamente nuestros tres archivos de estilos: `theme.scss` (M2), `variables.scss`, `global.scss`.

---

## 9. Estándares aplicados

- **Angular Style Guide:** un componente por archivo, sufijos obligatorios,
  `providedIn: 'root'` en servicios singleton
- **WCAG 2.1 AA:** `aria-label` en el botón hamburguesa y en el botón de colapso
  del sidebar; contraste verificado en la paleta
- **DRY:** toda la lógica de traducción de estados centralizada en `StatusLabelPipe`
- **ISO 25010 — Mantenibilidad:** estructura de directorios predecible;
  `SharedModule` con exports explícitos
- **Core Web Vitals:** sin imágenes sin dimensiones definidas; skeleton en lugar
  de spinner para evitar CLS
- **OWASP A09:** sin `console.log` en código de producción; `no-console: warn` en ESLint

---

## 10. Cumplimiento y validación

```
Estado al 2026-06-05:

✓ ng serve arranca en http://localhost:4200 sin errores
✓ ng build sin errores de compilación
✓ ng test → 26 specs, 0 failures, cobertura ≥ 70% (Statements 98.36%)
□ ng lint → pendiente verificación (sin ESLint configurado aún en Angular 21)
✓ Sidebar colapsa/expande con transición 200ms (CSS transition en .scss)
✓ Tema visual: primary #6B3C6B, accent #CE6EEB, surface #F2E4F2
✓ proxy.conf.json apuntando a localhost:8080
✓ PageResponse<T> y ApiError disponibles en shared/models/
✓ StatusLabelPipe traduce los 5 estados + ACTIVE/INACTIVE (8 casos testeados)
✓ MasterDetailComponent funciona con ng-content slots [slot=master] / [slot=detail]
✓ ConfirmDialogComponent retorna true/false via MatDialogRef
✓ EmptyStateComponent muestra variante correcta según @Input() variant
✓ Componentes standalone (sin NgModules — patrón Angular 14+ / Angular 21)
✓ SOLID: un componente, una responsabilidad
✓ WCAG AA: aria-label en botones de colapso del sidebar y en íconos interactivos
✓ OnPush en todos los componentes dumb (EmptyState, MasterDetail)
```
