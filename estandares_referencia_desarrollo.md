# Estándares de Referencia — Frontend Almacenes

**Versión:** 1.0  
**Fecha:** 2026-06-05  
**Alcance:** Todos los módulos del frontend. Este documento es la referencia
obligatoria antes y durante el desarrollo de cada módulo.

> Este documento consolida los estándares, buenas prácticas, metodologías y
> normas que rigen el desarrollo del frontend del sistema Almacenes, organizados
> en seis dominios: ingeniería de software, frontend web, Angular, UX/UI,
> ciberseguridad y gestión de almacenes. Para cada estándar se indica su
> **aplicación concreta** en este proyecto.

---

## Índice

1. [Ingeniería de software](#1-ingeniería-de-software)
2. [Frontend web](#2-frontend-web)
3. [Angular](#3-angular)
4. [UX/UI y accesibilidad](#4-uxui-y-accesibilidad)
5. [Ciberseguridad](#5-ciberseguridad)
6. [Gestión de almacenes (dominio de negocio)](#6-gestión-de-almacenes-dominio-de-negocio)
7. [Resumen de cumplimiento por módulo](#7-resumen-de-cumplimiento-por-módulo)

---

## 1. Ingeniería de software

### 1.1 SOLID

| Principio | Descripción | Aplicación en este proyecto |
|---|---|---|
| **S** — Single Responsibility | Una clase/componente, una razón para cambiar | Cada componente smart gestiona un solo dominio. Los servicios no mezclan dominios (SaleOrderService no llama a endpoints de compras) |
| **O** — Open/Closed | Abierto a extensión, cerrado a modificación | Usar `@Input()` / `@Output()` en componentes dumb para extender sin modificar. Nuevos estados de orden se agregan al `StatusLabelPipe` sin modificar los que ya funciona |
| **L** — Liskov Substitution | Los subtipos deben ser sustituibles por sus tipos base | Las interfaces TypeScript de los DTOs deben ser compatibles entre sí cuando comparten estructura (ej. `PageResponse<Product>` y `PageResponse<Category>`) |
| **I** — Interface Segregation | Interfaces pequeñas y específicas | Definir interfaces por DTO del backend, no interfaces monolíticas. `ProductResponse` no incluye campos de `CategoryResponse` innecesarios |
| **D** — Dependency Inversion | Depender de abstracciones, no de implementaciones | Los componentes dependen de servicios inyectados (DI de Angular), nunca instancian `new ProductService()` |

### 1.2 Principios de diseño de código

| Principio | Regla | Aplicación |
|---|---|---|
| **DRY** (Don't Repeat Yourself) | No duplicar lógica — extraer en servicio, pipe o componente compartido | La lógica de formateo de estados va en `StatusLabelPipe`. El layout master-detail va en `MasterDetailComponent`. Ningún módulo duplica estos |
| **KISS** (Keep It Simple, Stupid) | La solución más simple que funcione correctamente | Sin NgRx para este proyecto (escala media). BehaviorSubject en el servicio es suficiente |
| **YAGNI** (You Aren't Gonna Need It) | No implementar funcionalidad que no se necesita hoy | No diseñar el módulo `financial` ahora solo porque `unitCost` ya está en el backend. No agregar WebSockets porque "en el futuro habrá notificaciones" |
| **Separation of Concerns** | Separar capas: presentación, lógica de negocio, acceso a datos | Componentes = presentación. Servicios = acceso a datos y transformaciones. Guards/Interceptores = infraestructura transversal |

### 1.3 Clean Code

- **Nombres que revelan intención:** `getAvailableStockWarning()` no `getW()`.
- **Funciones pequeñas:** máximo 20 líneas. Si una función hace más de una cosa, se divide.
- **Sin números mágicos:** constantes nombradas. `MIN_PASSWORD_LENGTH = 8`, no `8` hardcodeado.
- **Sin comentarios que explican el qué** (el código ya lo dice). Solo el porqué:
  - ✓ `// El backend devuelve 403 (no 401) para tokens expirados — ver memoria técnica global §3`
  - ✗ `// Este método obtiene los productos del servidor`
- **Tests como documentación:** el nombre del test describe exactamente qué verifica:
  - ✓ `it('should redirect to login when token is expired (403 response)')`
  - ✗ `it('should work')`

### 1.4 Gestión de versiones — Conventional Commits

Formato obligatorio de mensajes de commit:

```
<tipo>(<alcance>): <descripción en imperativo>

feat(inventory): agregar filtro de stock bajo en lista de productos
fix(auth): corregir redirección cuando token expira con 403
docs(sales): actualizar memoria técnica módulo ventas sección 7
test(purchases): agregar tests unitarios de PurchaseOrderService
refactor(shared): extraer lógica de paginación a mixin reutilizable
chore(infra): configurar proxy.conf.json para desarrollo local
style(sidebar): ajustar color de ítem activo a especificación
```

| Tipo | Cuándo usarlo |
|---|---|
| `feat` | Nueva funcionalidad visible para el usuario |
| `fix` | Corrección de un bug |
| `docs` | Solo documentación (memorias técnicas, propuestas) |
| `test` | Agregar o corregir tests |
| `refactor` | Cambio de código sin nuevo comportamiento |
| `chore` | Configuración, dependencias, infraestructura |
| `style` | Cambios de formato/estilo (no CSS — solo código) |
| `perf` | Mejora de rendimiento |

### 1.5 ISO/IEC 25010 — Calidad del producto de software

Características de calidad aplicadas a este frontend:

| Característica | Subcaracterística | Cómo se cumple |
|---|---|---|
| **Funcionalidad** | Completitud | Todos los CRUD de los 5 módulos conectados al backend |
| **Funcionalidad** | Corrección | Tests unitarios e integración; validación E2E |
| **Mantenibilidad** | Modularidad | Arquitectura de módulos Angular con lazy loading |
| **Mantenibilidad** | Testeabilidad | Separación smart/dumb; servicios inyectables; mocks aislados |
| **Mantenibilidad** | Analizabilidad | Código limpio; estructura de directorios predecible |
| **Seguridad** | Confidencialidad | JWT en header; sin datos sensibles en localStorage salvo el token |
| **Seguridad** | Autenticidad | AuthGuard en todas las rutas protegidas |
| **Usabilidad** | Reconocibilidad | Paleta visual consistente; patrones UX repetibles |
| **Usabilidad** | Accesibilidad | WCAG 2.1 AA (detallado en sección 4) |
| **Rendimiento** | Tiempo de respuesta | Skeleton loading en tablas; lazy loading de módulos |
| **Fiabilidad** | Disponibilidad | Manejo de errores HTTP en `ErrorInterceptor`; sin pantallas en blanco |

---

## 2. Frontend web

### 2.1 W3C — HTML semántico

- Usar elementos semánticos: `<main>`, `<nav>`, `<header>`, `<section>`, `<article>`, `<aside>`
- Angular Material genera HTML semántico automáticamente en la mayoría de sus componentes
- Los `<button>` son para acciones; los `<a>` son para navegación
- Formularios con `<label for="...">` siempre vinculados a su `<input>`
- Las tablas de datos usan `<th scope="col">` para los encabezados

### 2.2 CSS / SCSS

| Estándar | Aplicación |
|---|---|
| **BEM** (Block-Element-Modifier) | Nomenclatura de clases CSS propias: `.sidebar__item--active` |
| **Variables CSS** (Custom Properties) | Definidas en `variables.scss`: `--color-primary: #6B3C6B` |
| **Mobile-first** | El sistema es desktop-first (≥1280px de acuerdo a las especificaciones), pero los estilos no deben romper en pantallas menores |
| **No `!important`** | Usar especificidad CSS o encapsulamiento de componentes Angular en su lugar |
| **Sin px para fuentes** | Usar `rem` para tipografía (base: 16px = 1rem) para respetar las preferencias del sistema |

### 2.3 TypeScript strict

Configuración obligatoria en `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Reglas de TypeScript en este proyecto:**
- Todos los campos de interfaces están tipados — sin `any`
- Los DTOs del backend tienen su interfaz TypeScript correspondiente en `shared/models/`
- Los `Observable<T>` siempre tienen el tipo genérico explícito
- `enum` de TypeScript para estados: `SaleOrderStatus`, `MovementType`

### 2.4 Core Web Vitals (Rendimiento web)

Google define tres métricas clave. El frontend debe cumplirlas en la build de producción:

| Métrica | Qué mide | Umbral bueno | Cómo se cumple |
|---|---|---|---|
| **LCP** (Largest Contentful Paint) | Tiempo hasta que el contenido principal es visible | < 2.5 s | Lazy loading de módulos Angular; imagen de logo optimizada |
| **INP** (Interaction to Next Paint) | Tiempo de respuesta a interacciones | < 200 ms | `OnPush` Change Detection; evitar cálculos pesados en templates |
| **CLS** (Cumulative Layout Shift) | Estabilidad visual (sin saltos de layout) | < 0.1 | Dimensiones definidas en skeleton loaders; no insertar contenido encima de contenido existente |

### 2.5 Rendimiento de la aplicación

- **Lazy loading:** cada módulo de negocio (`inventory`, `purchases`, `sales`, `reports`) se carga bajo demanda con `loadChildren`
- **`OnPush` Change Detection:** en todos los componentes dumb; en los smart donde sea viable
- **`trackBy` en `*ngFor`:** obligatorio en listas de datos del backend para evitar re-renderizado completo
- **Paginación server-side:** nunca cargar toda la colección en memoria; siempre `?page=0&size=20`
- **`async pipe` sobre `subscribe()`:** el pipe se desuscribe automáticamente y activa el árbol de cambios eficientemente
- **`takeUntilDestroyed()`:** en todos los `subscribe()` manuales restantes

---

## 3. Angular

### 3.1 Angular Style Guide oficial (John Papa / Angular Team)

| Regla | Detalle |
|---|---|
| **Arquitectura de módulos** | Un módulo por dominio de negocio con lazy loading |
| **Un componente por archivo** | `product-list.component.ts` contiene solo `ProductListComponent` |
| **Sufijos obligatorios** | `.component.ts`, `.service.ts`, `.guard.ts`, `.interceptor.ts`, `.pipe.ts`, `.model.ts` |
| **`providedIn: 'root'`** | Para servicios singleton (todos los servicios HTTP de este proyecto) |
| **`@Input()` / `@Output()` explícitos** | Siempre con tipo explícito; nunca `@Input() data: any` |
| **Inyección con `inject()`** | Preferido sobre inyección en constructor para Angular 14+ |
| **Orden en el componente** | `@Input` → `@Output` → propiedades → `constructor`/`inject` → lifecycle → métodos públicos → métodos privados |

### 3.2 Patrón Smart / Dumb (Container / Presentational)

```
Smart (Container):                    Dumb (Presentational):
─────────────────                     ──────────────────────
ProductListComponent                  StatusBadgeComponent
SaleOrderDetailComponent              EmptyStateComponent
PurchaseOrderFormComponent            MasterDetailComponent
                                      ConfirmDialogComponent

Características Smart:                Características Dumb:
- Se suscribe a servicios             - Solo @Input() / @Output()
- Maneja estado local                 - Sin inyección de servicios
- Orquesta acciones                   - 100% reutilizable
- Conoce el dominio                   - 100% testeable sin mocks
```

### 3.3 Reactive Forms

Obligatorio para todos los formularios del proyecto.

```typescript
// Patrón estándar
this.form = this.fb.group({
  name:      ['', [Validators.required, Validators.maxLength(150)]],
  unitPrice: [null, [Validators.required, Validators.min(0.01)]],
  quantity:  [1, [Validators.required, Validators.min(1)]],
});

// Validación cruzada (ej: nueva contraseña == confirmación)
this.form = this.fb.group({
  newPassword:     ['', [Validators.required, Validators.minLength(8)]],
  confirmPassword: ['', Validators.required],
}, { validators: passwordMatchValidator });
```

**Reglas de formularios:**
- Validación en `blur` (al salir del campo) + al intentar guardar
- Mensaje de error inline bajo el campo, nunca en alert/toast
- Botón de guardar deshabilitado mientras el form sea inválido o esté cargando
- Labels siempre visibles (no solo placeholder)
- **Campos obligatorios**: Angular Material añade `*` automáticamente via `Validators.required`.
  Nunca añadir `<span class="required">*</span>` manual — produce doble asterisco. Ver L15.
- **Campos de solo lectura contextual** (editables en creación, inmutables en edición):
  usar `control.disable()` en `ngOnChanges` cuando `isEdit=true` + `mat-hint` con icono
  `lock` y color `#1565C0` (info) nombrando la acción alternativa exacta.
  Usar `subscriptSizing="dynamic"` en el `mat-form-field` para evitar solapamiento
  del hint con campos adyacentes en layouts de grid. Ver L14.
- **Datos financieros sensibles** (`unitCost`, márgenes): visibles solo para roles
  con escritura (`canWrite()` = ADMIN + MANAGER). Usar `displayedColumns` condicional
  en tablas y `@if (canWrite())` en formularios.

### 3.4 RxJS — Buenas prácticas

| Práctica | Regla | Razón |
|---|---|---|
| **Sin nested subscribes** | Usar `switchMap`, `concatMap`, `mergeMap` | Los nested subscribes crean memory leaks y son difíciles de cancelar |
| **`takeUntilDestroyed()`** | En cada `subscribe()` manual | Evita memory leaks cuando el componente se destruye |
| **`async pipe`** | Preferido sobre `subscribe()` cuando es posible | Se desuscribe automáticamente; no requiere `takeUntilDestroyed` |
| **`catchError` en el servicio o en el interceptor, no en ambos** | El `ErrorInterceptor` centraliza el manejo; los servicios no capturan errores HTTP |  No duplicar manejo de errores |
| **`shareReplay(1)`** | En observables que múltiples componentes comparten (ej. lista de categorías) | Evita llamadas HTTP duplicadas |
| **Sin `async/await`** | Usar operadores RxJS; mantener el código reactivo | Mezclar async/await con RxJS rompe la cadena reactiva |

### 3.5 Gestión de suscripciones

```typescript
// Patrón 1: inject(DestroyRef) — componentes Angular 16+
private destroyRef = inject(DestroyRef);

ngOnInit(): void {
  this.productService.getAll().pipe(
    takeUntilDestroyed(this.destroyRef)
  ).subscribe(response => this.products = response.content);
}

// Patrón 2: async pipe — preferido para datos que van directo al template
products$ = this.productService.getAll();
// En el template: *ngFor="let p of (products$ | async)?.content"
```

### 3.6 Lazy Loading de módulos

```typescript
// app-routing.module.ts
const routes: Routes = [
  { path: 'inventory', loadChildren: () =>
      import('./modules/inventory/inventory.module').then(m => m.InventoryModule),
    canActivate: [AuthGuard],
    data: { roles: ['ROLE_ADMIN','ROLE_MANAGER','ROLE_WAREHOUSEMAN','ROLE_SALES'] }
  },
  { path: 'sales', loadChildren: () =>
      import('./modules/sales/sales.module').then(m => m.SalesModule),
    canActivate: [AuthGuard],
    data: { roles: ['ROLE_ADMIN','ROLE_MANAGER','ROLE_SALES'] }
  },
  // etc.
];
```

### 3.7 Change Detection OnPush

Aplicar `ChangeDetectionStrategy.OnPush` en todos los componentes dumb y en los
smart que solo reciben datos por `@Input()`:

```typescript
@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`
})
export class StatusBadgeComponent {
  @Input() status!: string;
}
```

**Beneficio:** Reduce dramáticamente el número de ciclos de detección de cambios.
Angular solo verifica el componente cuando su referencia de `@Input()` cambia.

### 3.8 Testing Angular — taxonomía del proyecto

| Tipo | Herramienta | TestBed | Qué verifica |
|---|---|---|---|
| **A — Unit Servicio** | Vitest + `HttpClientTestingModule` | Mínimo | Llamadas HTTP, URLs, parámetros, transformaciones |
| **B — Unit Componente** | Vitest + `TestBed` | Básico | Renderizado, bindings, eventos `@Output()`, visibilidad condicional por `@Input()` |
| **C — Integration** | Vitest + `TestBed` completo | Completo | Interacción real componente ↔ servicio |
| **E — E2E** | Playwright MCP o Cypress | N/A (browser real) | Flujo completo con backend activo |

**Reglas de testing:**
- Cobertura mínima: **70% statements** por módulo (`ng test --code-coverage`)
- Cada servicio HTTP: test para URL correcta + parámetros de paginación + mapeo de respuesta
- Cada componente dumb con `@Input`/`@Output`: test para visibilidad condicional + outputs emitidos
- Ningún módulo se marca completo sin pasar `ng test` con 0 fallos
- Regresiones: la suite completa se ejecuta al terminar cada módulo

**Patrón para testing de `@Input()` con `ngOnChanges` (Angular 21):**

La asignación directa `component.prop = value` NO dispara `ngOnChanges`. Usar siempre:

```typescript
// ✗ Incorrecto — no dispara ngOnChanges
component.item = mockItem;
fixture.detectChanges();

// ✓ Correcto — dispara ngOnChanges con SimpleChange
fixture.componentRef.setInput('item', mockItem);
fixture.detectChanges();
```

Aplicar a todos los componentes dumb que reaccionen a cambios de `@Input` mediante `ngOnChanges`
(formularios que se precargan con datos, componentes que muestran botones según permisos, etc.).

**Patrón para componentes que verifican visibilidad RBAC:**

```typescript
function setup(item: MiDTO | null, canDeactivate: boolean) {
  TestBed.configureTestingModule({
    imports: [MiFormComponent],
    providers: [provideAnimations()],
  });
  const fixture = TestBed.createComponent(MiFormComponent);
  fixture.componentRef.setInput('item', item);
  fixture.componentRef.setInput('canDeactivate', canDeactivate);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

// Verificar visibilidad de botón destructivo
it('botón Desactivar solo visible con canDeactivate=true e isEdit=true', () => {
  const { fixture } = setup(mockItem, true);
  const btn = fixture.nativeElement.querySelector('button[color="warn"]');
  expect(btn).not.toBeNull();
  expect(btn?.textContent?.trim()).toBe('Desactivar');
});
```

**Patrón para traducción de enums a español (UI):**

Todo componente que muestre valores enum del backend al usuario debe incluir un método
de traducción y tener spec que lo cubra:

```typescript
// En el componente
getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    AVAILABLE:    'Disponible',
    DISCONTINUED: 'Descontinuado',
    OUT_OF_STOCK: 'Sin stock',
  };
  return labels[status] ?? status;   // fallback = valor original
}

// En el spec
it('debe retornar el valor original cuando el status no está en el mapa (fallback)', () => {
  expect(component.getStatusLabel('VALOR_DESCONOCIDO')).toBe('VALOR_DESCONOCIDO');
});
```

**Decisión de cobertura — cuándo escribir specs para componentes smart vs dumb:**

| Tipo | ¿Specs unitarios? | Justificación |
|---|---|---|
| Servicios HTTP | Siempre | Verifican contratos HTTP exactos que los tests browser no inspeccionan |
| Componentes dumb con lógica | Siempre | Visibilidad RBAC, traducciones, outputs — 0 mocks necesarios |
| Componentes dumb puramente visuales | Opcional | Si la lógica está en el template, el browser test es suficiente |
| Componentes smart | Cobertura por browser test | Su lógica es orquestación — los tests E2E la cubren mejor |

### 3.9 ESLint — Reglas Angular

Configurar `eslint` con `@angular-eslint/recommended`:

```json
{
  "extends": [
    "plugin:@angular-eslint/recommended",
    "plugin:@angular-eslint/template/recommended"
  ],
  "rules": {
    "@angular-eslint/component-selector": ["error", { "prefix": "app", "style": "kebab-case" }],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "no-console": "warn"
  }
}
```

`ng lint` debe pasar sin errores antes de cada commit.

---

## 4. UX/UI y accesibilidad

### 4.1 WCAG 2.1 — Web Content Accessibility Guidelines (Nivel AA obligatorio)

| Principio | Criterio | Aplicación |
|---|---|---|
| **Perceptible** | Contraste de texto normal ≥ 4.5:1 | Texto `#212121` sobre `#FFFFFF`: 16.1:1 ✓. Texto blanco sobre `#6B3C6B`: 7.1:1 ✓ |
| **Perceptible** | Contraste texto grande ≥ 3:1 | Verificar en encabezados con `#6B3C6B` |
| **Perceptible** | No usar solo color para transmitir información | Los badges de estado tienen ícono además de color |
| **Perceptible** | Alt text en imágenes | Logo "Almacenes" con `alt="Almacenes"` |
| **Operable** | Navegación completa por teclado | Sidebar navegable con Tab; foco visible siempre |
| **Operable** | Sin trampas de teclado | Los diálogos (`MatDialog`) atrapan el foco dentro mientras están abiertos |
| **Operable** | Skip links | `<a class="skip-link" href="#main-content">Ir al contenido principal</a>` |
| **Comprensible** | Labels visibles siempre | No depender solo del placeholder |
| **Comprensible** | Mensajes de error descriptivos | "El campo 'Nombre' es obligatorio", no solo "Error" |
| **Robusto** | Markup válido | `ng build` sin errores; usar componentes Material que generan HTML válido |
| **Robusto** | Compatibilidad con lectores de pantalla | `aria-label` en todos los íconos interactivos |

**Verificación de contraste de la paleta del proyecto:**

| Combinación | Ratio | Cumple AA |
|---|---|---|
| `#212121` sobre `#FFFFFF` | 16.1:1 | ✓ AAA |
| `#FFFFFF` sobre `#6B3C6B` | 7.1:1 | ✓ AAA |
| `#212121` sobre `#F2E4F2` | 11.3:1 | ✓ AAA |
| `#212121` sobre `#CE6EEB` | 3.6:1 | ✓ AA (texto grande) — no usar para texto normal |
| `#FFFFFF` sobre `#CE6EEB` | 2.8:1 | ✗ — **no usar texto blanco sobre `#CE6EEB`** |

**Regla de uso del acento `#CE6EEB`:**  
Solo para badges, íconos e indicadores decorativos. Nunca como fondo de texto de lectura.

### 4.2 ISO 9241 — Ergonomía de la interacción humano-sistema

| Parte | Principio | Aplicación |
|---|---|---|
| 9241-11 | Eficacia, eficiencia, satisfacción | Un WAREHOUSEMAN puede completar una recepción en ≤ 3 pasos desde la lista |
| 9241-110 | Adecuación a la tarea | Solo mostrar los campos y acciones relevantes para el rol del usuario activo |
| 9241-110 | Autodescriptividad | Los botones tienen texto + ícono (no solo ícono); tooltips a 300ms |
| 9241-110 | Controlabilidad | El usuario puede cancelar cualquier acción destructiva (confirmación siempre) |
| 9241-110 | Tolerancia al error | Validación en tiempo real; mensajes claros; sin pérdida de datos al cerrar accidentalmente |

### 4.3 Las 10 heurísticas de Nielsen

| # | Heurística | Implementación |
|---|---|---|
| 1 | Visibilidad del estado del sistema | `MatProgressBar` durante cargas; badges de estado en todas las órdenes |
| 2 | Correspondencia sistema-mundo real | Terminología del negocio: "Orden de compra", "Proveedor", "Stock disponible" |
| 3 | Control y libertad del usuario | Botón "Cancelar" en todos los diálogos y formularios |
| 4 | Consistencia y estándares | Mismos colores y patrones de badge en todos los módulos |
| 5 | Prevención de errores | Botón "Guardar" deshabilitado si el formulario es inválido; confirmación antes de acciones destructivas |
| 6 | Reconocimiento sobre recuerdo | Breadcrumbs de navegación; estado del ítem seleccionado resaltado en `#F2E4F2` |
| 7 | Flexibilidad y eficiencia | Atajos de teclado en formularios; filtros rápidos en tablas |
| 8 | Diseño estético y minimalista | Solo mostrar acciones disponibles para el estado y rol actuales |
| 9 | Ayuda al usuario a reconocer errores | Mensajes de error inline con el campo; lenguaje en español claro |
| 10 | Ayuda y documentación | Tooltips en todos los íconos sin texto; `EmptyStateComponent` con orientación |

### 4.4 Material Design 3 — Principios aplicados con Angular Material

Angular Material implementa Material Design. Las siguientes guías aplican directamente:

- **Elevación:** usar `mat-elevation-z2` en cards; `mat-elevation-z4` en el top bar; sin mezclar elevaciones arbitrarias
- **Movimiento:** usar las duraciones estándar: 150ms (micro), 200ms (pequeño), 300ms (medio); nunca > 500ms
- **Tipografía:** escala de Material Design: Headline 5 para títulos de sección, Body 1 para contenido, Caption para metadatos
- **Espaciado:** múltiplos de 8px. Padding interno de cards: 16px o 24px. Separación entre tarjetas: 16px
- **Estados de interacción:** hover, focus, pressed, disabled — todos manejados automáticamente por Angular Material

### 4.5 Diseño de tablas (MatTable)

- `MatSort` en columnas ordenables; orden por defecto: `createdAt DESC` para órdenes, `name ASC` para catálogos
- `MatPaginator` vinculado a los campos de `PageResponse<T>`: `totalElements`, `size`, `currentPage`
- **Skeleton loading** (filas grises animadas) durante la carga, nunca un spinner centrado en la tabla
- Columna de acciones siempre a la derecha, con íconos `mat-icon-button` + `matTooltip`
- Texto truncado con `text-overflow: ellipsis` + `matTooltip` con el valor completo
- Fila seleccionada con fondo `#F2E4F2`

### 4.6 Feedback al usuario — estándar del proyecto

| Situación | Componente | Posición | Duración | Color |
|---|---|---|---|---|
| Acción exitosa | `MatSnackBar` | Bottom right | 3 s | `#2E7D32` (verde) |
| Error de negocio / validación | `MatSnackBar` | Bottom right | 5 s | `#C62828` (rojo) |
| Carga de datos (inicial) | `MatProgressBar` | Top del panel | Indeterminado | Primary |
| Carga de tabla | Skeleton rows | En lugar de filas | Hasta que carguen | `#E0E0E0` animado |
| Acción destructiva | `MatDialog` + `ConfirmDialogComponent` | Centro | Hasta decisión | — |
| Sin resultados | `EmptyStateComponent` | Centro del área | Permanente | — |

---

## 5. Ciberseguridad

### 5.1 OWASP Top 10 (2021) — aplicación al frontend

| # | Vulnerabilidad | Mitigación en este proyecto |
|---|---|---|
| A01 | Broken Access Control | `AuthGuard` en todas las rutas protegidas; botones de acción visibles solo para el rol que puede ejecutarlos; el backend es la última línea de defensa |
| A02 | Cryptographic Failures | JWT almacenado en `localStorage` (aceptable para este contexto); **nunca** almacenar contraseñas ni datos sensibles en el cliente |
| A03 | Injection | Angular sanitiza automáticamente el HTML interpolado (`{{ }}`). Nunca usar `[innerHTML]` con datos del usuario. Nunca construir URLs concatenando input del usuario |
| A04 | Insecure Design | Confirmación de acciones destructivas; validación en cliente + servidor; sin bypass de guards |
| A05 | Security Misconfiguration | `environment.prod.ts` no commiteado si contiene URLs sensibles; `proxy.conf.json` solo en desarrollo |
| A06 | Vulnerable Components | `npm audit` antes de cada release; actualizar dependencias con vulnerabilidades conocidas |
| A07 | Auth Failures | JWT con expiración de 2h; logout limpia `localStorage`; no exponer token en URLs ni logs |
| A08 | Software Integrity | `npm ci` (no `npm install`) en CI para reproducibilidad exacta; `package-lock.json` commiteado |
| A09 | Logging Failures | Sin `console.log` en producción con datos sensibles; `no-console: warn` en ESLint |
| A10 | SSRF | N/A en frontend (el backend valida las URLs destino) |

### 5.2 Seguridad del JWT

```typescript
// Lo que se almacena en localStorage — solo el token
localStorage.setItem('token', response.token);

// Lo que NUNCA se almacena
// ✗ localStorage.setItem('password', ...)
// ✗ localStorage.setItem('creditCard', ...)
// ✗ localStorage.setItem('userData', JSON.stringify({ ...sensitiveData }))

// El token NUNCA va en la URL
// ✗ this.router.navigate(['/products'], { queryParams: { token: this.token } })

// El token NUNCA va en un console.log
// ✗ console.log('Token:', this.authService.getToken())
```

**Expiración:** el token expira en 2 horas. El `ErrorInterceptor` detecta el 403
resultante y hace logout automático. No es necesario implementar un timer
de expiración en el frontend.

### 5.3 Prevención de XSS (Cross-Site Scripting)

Angular tiene protección XSS integrada. Reglas para no bypassearla:

```typescript
// ✓ Interpolación segura (Angular escapa automáticamente)
<span>{{ product.name }}</span>
<span>{{ product.description }}</span>

// ✗ innerHTML con datos del usuario — NUNCA
<div [innerHTML]="product.description"></div>

// Si se necesita HTML en un campo (excepción justificada):
// usar DomSanitizer.bypassSecurityTrustHtml() SOLO con HTML generado
// por el propio sistema, nunca con input del usuario
```

**Política de seguridad de contenido (CSP):**  
Configurar en el servidor web (Nginx) que sirve el frontend:
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; connect-src 'self' http://localhost:8080
```

### 5.4 Manejo seguro de datos en formularios

```typescript
// ✓ Usar HttpClient de Angular (escapa parámetros automáticamente)
this.http.get('/api/v1/products', { params: { search: userInput } });

// ✗ Construir URLs concatenando (riesgo de injection)
this.http.get(`/api/v1/products?search=${userInput}`);

// ✓ Contraseñas: input type="password" siempre
<input matInput type="password" formControlName="password">

// ✗ Mostrar contraseña en logs o en el estado del componente
console.log(this.form.value.password); // NUNCA
```

### 5.5 Gestión de secretos y configuración

```typescript
// environment.ts — NO contiene secretos
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1'  // URL pública de desarrollo
};

// environment.prod.ts — si contiene URL de producción, agregar al .gitignore
// La URL de producción se inyecta vía CI/CD o variable de entorno del servidor
```

**.gitignore mínimo requerido:**
```
environment.prod.ts    # solo si contiene datos sensibles
.env
*.local
node_modules/
dist/
```

### 5.6 Auditoría de dependencias

```bash
# Antes de cada release
npm audit

# Corrección automática de vulnerabilidades de bajo impacto
npm audit fix

# Vulnerabilidades críticas deben resolverse antes del release
# Si no hay fix disponible, documentar en la memoria técnica del módulo
```

### 5.7 Headers de seguridad HTTP

Configurar en el servidor web (Nginx) que sirve el frontend en producción:

| Header | Valor recomendado | Propósito |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Evita MIME sniffing |
| `X-Frame-Options` | `DENY` | Previene clickjacking |
| `Strict-Transport-Security` | `max-age=31536000` | Fuerza HTTPS |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limita información del referrer |
| `X-XSS-Protection` | `1; mode=block` | Protección básica del browser |

---

## 6. Gestión de almacenes (dominio de negocio)

### 6.1 Trazabilidad de movimientos de stock — Kardex

El Kardex es el registro cronológico de todos los movimientos de un producto.
Es un estándar contable y de auditoría en la gestión de almacenes.

**Principios que el frontend debe respetar:**
- **Inmutabilidad:** ningún movimiento del Kardex puede editarse o eliminarse desde la UI. Son registros de auditoría permanentes
- **Completitud:** todo cambio de stock genera un movimiento (entrada de compra, salida de venta, ajuste manual). La UI deja claro el origen de cada movimiento
- **Saldo acumulado:** el frontend muestra el stock resultante después de cada movimiento, no solo la cantidad del movimiento
- **Auditoría:** cada movimiento muestra quién lo registró y cuándo

### 6.2 Las tres magnitudes de stock

Crítico para el módulo de Ventas. La UI debe mostrar y usar correctamente las tres:

| Magnitud | Definición | Cuándo mostrar |
|---|---|---|
| `currentStock` | Stock físico real en el almacén | Ficha del producto; Kardex |
| `reservedStock` | Comprometido con órdenes APPROVED no entregadas | Ficha del producto; panel de reservaciones |
| `availableStock` | `currentStock - reservedStock` | **Selector de productos en órdenes de venta**; alertas de stock bajo |

**Regla:** Al crear una orden de venta, la validación de cantidad usa `availableStock`, no `currentStock`. Mostrar el `availableStock` al lado del selector de producto para que el vendedor conozca la disponibilidad real.

### 6.3 Análisis ABC de inventario

El Análisis ABC clasifica los productos por su valor económico:

| Clase | Criterio | Tratamiento en la UI |
|---|---|---|
| **A** | Top 80% del revenue total | Destacar visualmente; alertas de stock bajo prioritarias |
| **B** | Siguiente 15% (80–95%) | Atención moderada |
| **C** | Último 5% (95–100%) | Monitoreo periódico |

**Principio de Pareto** (80/20): ~20% de los productos generan ~80% del valor.
La UI del módulo de reportes debe reflejar esta clasificación para que el
MANAGER tome decisiones de reabastecimiento priorizando los productos clase A.

### 6.4 Punto de reorden y stock mínimo

El campo `minimumStock` de cada producto representa el **punto de reorden**:
el nivel de stock en que se debe generar una orden de compra para no quedar
desabastecido.

**Regla de visualización en el frontend:**
- `availableStock <= minimumStock` → alerta visual (fila resaltada en `#FFF3E0`, ícono `warning`)
- Esta condición es prioritaria: siempre visible en la lista de productos sin necesidad de aplicar filtros
- El dashboard ejecutivo muestra el conteo total de productos en esta condición

### 6.5 Máquinas de estado de las órdenes

Ambos tipos de órdenes tienen transiciones de estado estrictas. El frontend
**nunca muestra botones de transición inválida**:

**Purchase Order:**
```
PENDING → APPROVED → RECEIVED   (flujo normal)
PENDING → CANCELLED              (cancelación antes de aprobar)
APPROVED → CANCELLED             (cancelación después de aprobar)
RECEIVED y CANCELLED son terminales — sin más transiciones posibles
```

**Sale Order:**
```
PENDING → APPROVED → DELIVERED  (flujo normal)
PENDING → CANCELLED              (cancelación)
APPROVED → CANCELLED             (cancelación — libera reservas de stock)
DELIVERED y CANCELLED son terminales — sin más transiciones posibles
```

**Regla en la UI:** El botón de cada acción solo es visible cuando la orden
está en el estado desde el que esa transición es válida Y el usuario tiene
el rol con permiso. Combinar ambas condiciones:

```typescript
// Ejemplo: botón "Entregar"
get canDeliver(): boolean {
  return this.order.status === 'APPROVED'
    && this.authService.hasAnyRole(['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN']);
}
```

### 6.6 Identificación de productos — SKU

SKU (Stock Keeping Unit) es el identificador único del producto en el almacén.
**Estándares de la UI:**
- El SKU es visible en todas las listas de productos y en los detalles de órdenes
- El SKU es inmutable una vez creado (el backend lo gestiona; el frontend lo muestra en modo lectura después de la creación)
- El buscador de productos en formularios de órdenes permite buscar por SKU o por nombre

### 6.7 Numeración de órdenes — trazabilidad

El formato de los números de orden es parte del estándar de trazabilidad:

| Tipo de orden | Formato | Ejemplo |
|---|---|---|
| Orden de venta | `OV-YYYY-NNNN` | `OV-2026-0042` |
| Orden de compra | Definida por el backend | Visible en la UI tal como viene |

El número de orden es generado por el backend. El frontend lo muestra,
permite buscar por él y lo incluye en el motivo de los movimientos de stock
("Entrega orden de venta OV-2026-0042").

### 6.8 Auditoría completa de operaciones

Toda operación relevante registra quién la ejecutó y cuándo. La UI expone
este rastro de auditoría en el detalle de cada entidad:

| Campo | Descripción | Visible en |
|---|---|---|
| `createdBy` + `createdAt` | Quién creó el registro | Detalle de orden, producto, cliente |
| `updatedBy` + `updatedAt` | Última modificación | Detalle de orden |
| `approvedBy` + `approvedAt` | Quién aprobó | Detalle de orden de compra y venta |
| `receivedBy` / `deliveredBy` + fecha | Quién recibió/entregó | Detalle de orden |
| `cancelledBy` + `cancelledAt` | Quién canceló | Detalle de orden cancelada |

**Principio:** La UI no oculta la trazabilidad. Estos campos son de solo lectura
y siempre visibles en el panel de detalle.

### 6.9 FIFO en la práctica (First In, First Out)

Aunque el control estricto de FIFO por lote es parte de un WMS avanzado
(fuera del alcance del MVP), el Kardex cronológico facilita la auditoría
FIFO: el primer stock en entrar (primera entrada en el Kardex) debe ser
el primero en salir. El frontend muestra los movimientos en orden cronológico
ascendente para facilitar esta verificación visual.

---

## 7. Resumen de cumplimiento por módulo

Este checklist se completa en la **sección 10** de la memoria técnica de cada módulo.

```
□ SOLID: cada componente y servicio tiene una única responsabilidad
□ DRY: sin código duplicado entre módulos — componentes shared usados
□ Clean Code: sin 'any', sin comentarios redundantes, nombres descriptivos
□ Conventional Commits: todos los commits siguen el formato establecido
□ TypeScript strict: compila sin errores con strict mode
□ ng lint: 0 errores de ESLint
□ ng build: 0 errores en build de producción
□ ng test: 0 fallos, cobertura ≥ 70% statements
□ Componentes dumb con @Input/@Output: specs unitarios escritos (visibilidad, outputs, precarga)
□ Métodos de traducción de enum (getStatusLabel, etc.): specs con fallback incluido
□ Tests RBAC backend: *SecurityTest por controlador con @Import(SecurityConfig.class) + tokenConRol()
□ Excepciones tipadas: servicios usan ResourceNotFoundException / DuplicateResourceException / BusinessRuleException
□ PageResponse<T>: todos los listados usan paginación server-side
□ takeUntilDestroyed / async pipe: sin memory leaks
□ OnPush: aplicado en componentes dumb
□ Lazy loading: el módulo se carga bajo demanda
□ WCAG AA: contraste verificado; aria-label en íconos interactivos
□ Nielsen: confirmación en acciones destructivas; mensajes de error descriptivos
□ OWASP A03: sin [innerHTML] con datos del usuario
□ OWASP A07: JWT sin exponer en URLs ni logs
□ npm audit: sin vulnerabilidades críticas
□ Kardex: movimientos inmutables y con auditoría completa
□ availableStock: usado en validaciones de Sales (no currentStock)
□ Máquina de estados: botones visibles solo para transiciones válidas × rol
□ Trazabilidad: createdBy, approvedBy, etc. visibles en detalle
```

---

*Referencia de estándares v1.1 — Frontend Almacenes — 2026-06-07*  
*v1.1: Sección 3.8 ampliada con patrones de testing establecidos en Módulo 2 (setInput(), RBAC JWT simulado, decisión smart/dumb). Checklist 7 actualizado con nuevos criterios.*  
*Actualizar si se adoptan nuevos estándares o se descubren excepciones justificadas.*
