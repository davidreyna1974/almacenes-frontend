# Protocolo de verificación en 4 fases — Sistema Almacenes

**Versión**: 1.0  
**Fecha de creación**: 2026-06-22  
**Aplica a**: toda ronda de verificación en browser (nuevos módulos, re-ejecuciones, post-fix)  
**Referencia en CLAUDE.md**: sección "⚠️ Protocolo obligatorio de verificación en 4 fases"  
**Estado de sesión activa**: `docs/qa/_bitacora/estado_sesion_activa.md`

---

## Por qué existe este protocolo

Durante el desarrollo del sistema se ejecutaron dos rondas de casos de prueba en browser.
La primera ronda encontró bugs que fueron corregidos. La segunda ronda encontró nuevos bugs,
algunos causados por los propios fixes y otros que la primera ronda pasó por alto.

**Causa raíz**: las fases de "probar" y "corregir" estaban mezcladas en la misma sesión.
Cada vez que se corrige un bug se modifica código, lo que invalida parcialmente los casos
ya marcados como PASS, porque el código subyacente cambió. El resultado es un documento
de casos de prueba que no refleja una ejecución coherente sobre una única versión del sistema.

**Consecuencia observada**: bugs que "pasaron" en la primera ronda fallaron en la segunda,
y no era posible saber con certeza si el fallo era pre-existente o una regresión del fix.

---

## Regla fundamental

> Una ronda de pruebas solo es válida si se ejecuta íntegra sobre una versión congelada
> del código, sin modificaciones entre el primer y el último caso ejecutado.

Si durante una ronda se detecta un bug y se decide corregirlo, esa ronda queda
invalidada. Hay que aplicar el fix, verificar que los gateways automatizados pasen,
y reiniciar la ronda desde el primer caso del primer módulo.

---

## Las 4 fases en detalle

### FASE 1 — Inventario (código congelado)

**Objetivo**: conocer el estado real del sistema sin sesgo de correcciones.

**Reglas**:
- Ningún cambio de código mientras dura esta fase (ni frontend ni backend)
- Ejecutar TODOS los casos de prueba de TODOS los módulos en orden
- Para cada bug encontrado: cambiar el estado del caso a `❌ FAIL` o `⚠️ ABIERTO`
  y agregar una fila al historial de bugs (`§9` o `§10` del documento de casos)
- No saltar casos porque "ya se sabe que fallan" — todos deben ejecutarse
- Al terminar: actualizar el resumen de cobertura del documento de cada módulo

**Orden de ejecución recomendado** (de menor a mayor impacto de blast radius):
1. Auth / Usuarios
2. Inventario
3. Compras
4. Ventas
5. Reportes

**Entregable**: documentos de casos con columna Estado completamente llena,
resumen de cobertura actualizado, lista de bugs con estado `⚠️ ABIERTO`.

---

### FASE 2 — Corrección + gatekeeper automatizado

**Objetivo**: corregir todos los bugs del inventario sin introducir regresiones.

**Reglas**:
- Cada fix se aplica en su propia `fix/<nombre>` branch
- Por cada fix, ANTES de mergear, el **gatekeeper automatizado obligatorio** (los tres, en orden):
  - `ng build` → 0 errores (frontend) — **NO omitir** (ver lección BUG-BUILD-01 abajo)
  - `ng test --no-watch` → 0 fallos (frontend)
  - `mvn test -Djacoco.skip=true` → 0 fallos nuevos respecto al baseline (backend)
- Documentar el **blast radius** de cada fix (ver tabla abajo)
- Actualizar el historial de bugs del documento de casos con estado `✅ CORREGIDO`
- No marcar casos individuales como PASS todavía — eso se hace en Fase 3

> **⚠️ Lección BUG-BUILD-01 (gatekeeper DEBE incluir `ng build`):** el runner de tests
> de Angular 21 es **Vitest** (`@angular/build:unit-test`), cuya compilación **NO aplica el
> type-check AOT estricto de templates (`strictTemplates`)** que sí aplican `ng build` y
> `ng serve`. Resultado real observado: 456 specs pasaban (`ng test` verde) pero el build de
> producción estaba **roto** (errores TS2322 en `trackById` por DTOs con `id: number | null`).
> Un gatekeeper que solo corre `ng test` deja pasar código que no compila en producción.
> Por eso `ng build` es obligatorio y va **primero**.

**Blast radius — qué determina qué módulos hay que re-probar en Fase 3**:

| Tipo de cambio | Blast radius | Módulos a re-probar en Fase 3 |
|---|---|---|
| CSS/SCSS de un componente específico | Local | Solo el módulo del componente |
| Lógica de un componente/servicio del módulo | Local | Solo el módulo afectado |
| Interceptor HTTP (`error.interceptor`, `jwt.interceptor`) | Global | Todos los módulos |
| AuthGuard / AuthService | Global | Todos los módulos |
| Layout / sidebar / topbar | Global | Todos los módulos |
| SecurityConfig backend | Global | Todos los módulos |
| JWT parsing / token handling | Global | Todos los módulos |
| GlobalExceptionHandler backend | Global | Todos los módulos |
| Servicio compartido (CategoryService, ProductService usado desde múltiples módulos) | Parcial | Módulos que consumen ese servicio |
| CORS / cabeceras de seguridad HTTP | Global | Todos los módulos |
| Configuración de base de datos (índices, funciones SQL) | Parcial | Módulos que usan esas queries |

**Entregable**: código corregido mergeado a `develop`, 0 fallos en gatekeepers,
blast radius documentado por bug.

---

### FASE 3 — Re-ejecución completa desde cero

**Objetivo**: confirmar en browser que todas las correcciones funcionan y no introdujeron
regresiones, en una única sesión sin tocar código.

**Reglas**:
- Re-ejecutar TODOS los módulos cuyo blast radius fue alcanzado (si algún fix fue global,
  re-ejecutar los 5 módulos)
- Misma sesión continua: no dejar casos a medias entre una sesión y la siguiente
  (si la sesión se interrumpe, usar `estado_sesion_activa.md` para retomar exactamente
  donde se quedó — ver sección "Continuidad de sesión" más abajo)
- Para cada caso: verificar en browser con el rol correcto, actualizar el Estado del caso
- Si se encuentra un bug nuevo → estado `❌ FAIL`, documentar, **NO corregir**, terminar
  la fase → volver a Fase 2
- La fase solo está completa cuando todos los casos del módulo terminan en ✅ PASS o N/A

**Continuidad de sesión** (manejo de interrupciones por límite de Claude Code):
- Al iniciar cada módulo: actualizar `estado_sesion_activa.md` con el módulo activo
- Al completar cada categoría de casos (SEC, RBAC, CRUD...): actualizar el archivo
- Al reanudar una sesión interrumpida: leer `estado_sesion_activa.md` primero y
  continuar exactamente desde el último módulo/categoría registrado
- Los tokens JWT de los 4 usuarios QA se re-obtienen siempre al inicio de cada módulo
  (duración 2h, pueden expirar entre sesiones)

**Entregable**: documentos de casos con todos los estados actualizados, sin ningún
caso en ⏳ PENDIENTE.

---

### FASE 4 — Certificación

**Objetivo**: registrar formalmente que el sistema está verificado en esta versión del código.

**Pasos**:

```bash
# Frontend — el builder @angular/build:unit-test usa --coverage (NO --code-coverage)
ng build                       # primero: 0 errores AOT (strictTemplates) — gatekeeper de build
ng test --no-watch --coverage
# → Resultado esperado: X specs, 0 failures; statements ≥ 70%

# Backend
cd /Users/davidreynapineda/Documents/Proyecto\ desarrollo/codigo/backend/almacenes
./mvnw test -Djacoco.skip=true   # o `mvn clean test` si target/ quedó corrupto (ver nota JaCoCo)
# → Resultado esperado: 0 nuevos fallos (respecto al baseline documentado)
```

> **Nota — flag de cobertura**: el builder `@angular/build:unit-test` (Angular 21, Vitest)
> usa `--coverage`, **no** `--code-coverage` (este último lanza `Unknown argument: code-coverage`).
> **Nota — JaCoCo corrupto**: si `mvn test` falla con `wrong name: com 2/codigo2enter...`, las
> clases en `target/` quedaron corruptas; resolver con `mvn clean test`.

**Documentar en `estado_sesion_activa.md`**:
- Fecha de certificación
- Commit hash del frontend y backend en el momento de la certificación
- Resultado de ng test (specs, failures, cobertura)
- Resultado de mvn test (tests, failures)
- Lista de módulos verificados

**Hacer commit**:
```bash
git add docs/qa/_bitacora/estado_sesion_activa.md
git commit -m "chore(qa): verificación completa 4 fases — $(date +%Y-%m-%d)

Fase 1 (inventario), Fase 2 (correcciones), Fase 3 (re-ejecución),
Fase 4 (certificación) completadas. X casos verificados, 0 bugs abiertos.
ng test: X specs, 0 fallos. Cobertura: X%.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Verificación de congelamiento — precondiciones de TODA ronda (Fase 1 y Fase 3)

Antes de ejecutar el **primer** caso de una ronda, confirmar que el código está congelado
y que el browser ejecuta exactamente ese código (no un bundle stale). Si cualquiera falla,
la ronda no debe iniciarse.

```
[ ] 1. git status en ambos repos (frontend + backend) → working tree limpio en `develop`,
       nada por delante de origin (todo el código bajo prueba está mergeado y empujado)
[ ] 2. Backend arriba: POST /api/v1/auth/login admin/Admin123! → HTTP 200 con token
[ ] 3. Dev server arriba: GET http://localhost:4200 → HTTP 200
[ ] 4. Los 4 usuarios QA autentican: admin / qa_manager / qa_warehouse / qa_sales → HTTP 200
[ ] 5. El dev server sirve el código ACTUAL, no un bundle stale (ver lección abajo)
```

> **⚠️ Lección bundle stale (invalida toda la ronda):** un `ng serve` viejo cuyo HMR no
> recompiló sirve código obsoleto — el navegador prueba código que ya no existe en `develop`,
> y todos los PASS de la ronda son falsos. Ante cualquier duda sobre la frescura del bundle:
> - **Verificación de runtime**: inspeccionar en consola que una función del bundle coincide
>   con la fuente (p.ej. `componenteInstancia.getByStatus.toString()` contiene el fix esperado), **o**
> - **Reinicio limpio (recomendado para certificación estricta)**: `kill` del proceso `ng serve`
>   + `rm -rf .angular/cache` + `ng serve` desde cero, y reiniciar la extensión del navegador.
>
> El reinicio limpio es la opción más segura cuando hubo fixes en la fase previa.

---

## Lectura estricta vs. alcance por blast radius de la Fase 3

La Fase 3 admite dos lecturas, y debe declararse explícitamente cuál se está aplicando, porque
cambia el significado de la certificación:

| Lectura | Qué re-ejecuta | Cuándo es suficiente | Riesgo |
|---|---|---|---|
| **Por blast radius** (pragmática) | Solo las zonas alcanzadas por los fixes de la ronda (fix local → solo ese módulo; fix global → los 5 módulos) | Iteración rápida post-fix; el resto del módulo no fue tocado y ya tenía PASS reciente | Un cambio de comportamiento fuera de la zona del fix no se detecta |
| **Estricta** (literal del protocolo) | TODOS los casos del módulo (o de todos los módulos del blast radius) de principio a fin, en una sola sesión continua, sobre el mismo bundle congelado | Certificación formal de cierre de módulo; auditoría; "done" según Propuesta D | Costosa en tiempo y sesiones — usar `estado_sesion_activa.md` para sobrevivir interrupciones |

> **Regla de declaración**: en el documento de casos, la nota de cierre de la ronda DEBE
> indicar cuál lectura se aplicó. Una ronda "por blast radius" **no** puede declararse como
> certificación estricta. Para declarar un módulo CERTIFICADO bajo Propuesta D se requiere
> una Fase 3 de **lectura estricta**.

---

## Catálogo de técnicas de verificación en browser (reutilizable en todos los módulos)

Estas técnicas se destilaron de la certificación del módulo Compras y aplican a Inventario,
Reports, Sales y Usuarios. Cada categoría de caso (SEC, RBAC, CRUD, VAL, BSRCH, UI, FLOW, RN,
ERR, EMPTY, VIS, CYBER) tiene una técnica de verificación preferida:

| Categoría | Técnica de verificación preferida | Herramienta |
|---|---|---|
| `SEC` | Navegación directa por URL con el rol MENOS privilegiado → confirmar redirect (no basta ocultar el item del sidebar) | `navigate` + observar URL final |
| `RBAC` (UI) | Login con cada rol; verificar presencia/ausencia en el **DOM** (no `display:none`) de botones/columnas/títulos | `read_page` / `javascript_tool` querySelector |
| `RBAC` (campos sensibles) | `curl` del endpoint con el JWT de cada rol → confirmar campo `null`/redactado en el JSON (no solo oculto en UI) — patrón L29 | `Bash` + curl |
| `CRUD` | Flujo completo en browser: crear/editar/desactivar + confirmar recarga de lista y snackbar | `computer` (tecleo real) |
| `VAL` | Validación inline bajo el campo tras `blur`; estado `[disabled]` del botón guardar | `read_page` + `javascript_tool` |
| `BSRCH` | **Tecleo real** (no inyección JS de eventos `input`): parcial, case-insensitive, accent-insensitive (`f_unaccent`), sin resultados, limpiar | `computer` typing |
| `UI` | Cada botón/ícono uno a uno; en filas clickeables confirmar `$event.stopPropagation()` | `computer` click + observar |
| `FLOW` | Máquina de estados completa: cada transición y su bloqueo; confirmar badge + historial | `computer` + `read_page` |
| `RN` | Para cada regla del `*ServiceImpl`: el componente muestra el dato correcto, valida preventivo, y muestra el error del backend | browser + `curl` para forzar el rechazo |
| `ERR` | Snackbar visible con color correcto (verde #2E7D32 / rojo #C62828) y mensaje del backend | `javascript_tool` getComputedStyle |
| `EMPTY` | Distinguir "sin datos" vs "sin resultados de búsqueda" (mensajes distintos) | `read_page` |
| `VIS` | Colores/espaciado/truncado vía `getComputedStyle()` con valores RGB exactos, no inspección visual | `javascript_tool` getComputedStyle |
| `CYBER` | `curl` directo a la API (SQLi, XSS almacenado, bypass de rol, transición inválida, JWT manipulado, CORS); mapear a OWASP ASVS L1 | `Bash` + curl + DevTools |

### Técnicas transversales (lecciones de ejecución)

1. **Tecleo real vs. inyección JS** — disparar eventos `input` por JS sobre inputs de
   Angular Material reactive-forms da lecturas del DOM engañosas (carrera con `debounceTime`).
   El **tecleo real** con la herramienta `computer` es fiable para búsquedas y formularios.
2. **`getComputedStyle()` con RGB exacto** — para casos VIS, comparar el valor RGB real
   (`rgb(107,60,107)` = `#6B3C6B`) en vez de "se ve morado". Documentar el RGB en la nota del caso.
3. **Ausencia en el DOM, no `display:none`** — para datos sensibles por rol, confirmar que
   el elemento **no está en el DOM** (`querySelector(...) === null`), no solo oculto por CSS.
4. **`curl` con JWT por rol para redacción de campos** — la única forma de probar que el
   **backend** redacta (no solo el frontend oculta) es pedir el endpoint con cada JWT y leer el JSON.
5. **Arquitectura de búsqueda: server-side vs. client-side** — identificar cuál usa cada lista
   antes de probar BSRCH. Server-side (`?search=` → native query `f_unaccent`) se prueba con
   términos que excedan la página actual; client-side filtra solo lo ya cargado.
6. **Agrupar por rol para minimizar re-logins** — ejecutar todos los casos de un rol antes de
   cambiar de usuario (ADMIN → MANAGER → WAREHOUSEMAN → SALES). Re-obtener tokens al inicio de cada módulo.
7. **Datos de prueba prefijados y limpiados (L33)** — todo dato creado durante la ronda se
   prefija (`[QA] `/`TEST_`) y se desactiva/elimina antes de cerrar el módulo.
8. **Evitar diálogos nativos del navegador** — no disparar `alert/confirm/prompt`; bloquean
   la extensión. Usar `console.log` + `read_console_messages` para depurar.

---

## Usuarios QA permanentes

| Usuario | Contraseña | Rol | Notas |
|---|---|---|---|
| `admin` | `Admin123!` | ADMIN | Usuario principal del sistema |
| `qa_manager` | `QaManager123!` | MANAGER | QA permanente |
| `qa_warehouse` | `QaWarehouse123!` | WAREHOUSEMAN | QA permanente |
| `qa_sales` | `QaSales123!` | SALES | QA permanente |

Obtener tokens al inicio de cada módulo:
```javascript
// Ejecutar en consola del browser (http://localhost:4200)
const login = (u, p) => fetch('http://localhost:8080/api/v1/auth/login',
  {method:'POST', headers:{'Content-Type':'application/json'},
   body: JSON.stringify({username:u, password:p})})
  .then(r=>r.json()).then(d=>d.token);

window._T = {};
Promise.all([
  login('admin','Admin123!').then(t => window._T.admin = t),
  login('qa_manager','QaManager123!').then(t => window._T.manager = t),
  login('qa_warehouse','QaWarehouse123!').then(t => window._T.warehouse = t),
  login('qa_sales','QaSales123!').then(t => window._T.sales = t)
]).then(() => console.log('Tokens listos:', Object.keys(window._T)));
```

---

## Criterio de "módulo certificado"

Un módulo está certificado cuando:
1. Todos sus casos tienen ✅ PASS o N/A (0 en ⏳ PENDIENTE y 0 en ❌ FAIL)
2. La tabla de resumen del documento de casos está actualizada
3. La Fase 4 (ng test + mvn test) pasó sin fallos nuevos
4. El commit de certificación existe en `develop`

---

## Historial de rondas de verificación

| Ronda | Fecha inicio | Fecha fin | Resultado | Observaciones |
|---|---|---|---|---|
| Ronda 1 | 2026-06-08 | 2026-06-13 | ⚠️ Incompleta | Fases mezcladas; bugs corregidos durante testing — invalida los PASS previos al fix |
| Ronda 2 | 2026-06-21 | 2026-06-21 | ⚠️ Parcial | Re-ejecución de módulos seleccionados; 6 bugs abiertos en Compras sin corregir |
| Ronda 3 | 2026-06-22 | 2026-06-22 | ✅ Compras (alcance por blast radius) | Protocolo 4 fases aplicado por primera vez. Fase 3 **por blast radius** de los fixes BUG-M3-15b/BUG-BUILD-01 (no estricta). Frontend 456 specs/88.94%, backend 405 tests. |
| Ronda 4 | 2026-06-22 | — | 🔄 En curso | Compras — Fase 3 de **lectura estricta**: re-ejecución de los 170 casos en una sola sesión continua sobre código congelado. Ver `estado_sesion_activa.md` |
