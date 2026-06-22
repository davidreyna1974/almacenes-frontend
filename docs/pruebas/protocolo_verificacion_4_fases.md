# Protocolo de verificación en 4 fases — Sistema Almacenes

**Versión**: 1.0  
**Fecha de creación**: 2026-06-22  
**Aplica a**: toda ronda de verificación en browser (nuevos módulos, re-ejecuciones, post-fix)  
**Referencia en CLAUDE.md**: sección "⚠️ Protocolo obligatorio de verificación en 4 fases"  
**Estado de sesión activa**: `docs/pruebas/estado_sesion_activa.md`

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
- Por cada fix, ANTES de mergear:
  - `ng test --no-watch` → 0 fallos (frontend)
  - `mvn test -Djacoco.skip=true` → 0 fallos nuevos respecto al baseline (backend)
- Documentar el **blast radius** de cada fix (ver tabla abajo)
- Actualizar el historial de bugs del documento de casos con estado `✅ CORREGIDO`
- No marcar casos individuales como PASS todavía — eso se hace en Fase 3

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
# Frontend
ng test --no-watch --code-coverage
# → Resultado esperado: X specs, 0 failures; statements ≥ 70%

# Backend
cd /Users/davidreynapineda/Documents/Proyecto\ desarrollo/codigo/backend/almacenes
./mvnw test -Djacoco.skip=true
# → Resultado esperado: 0 nuevos fallos (respecto al baseline documentado)
```

**Documentar en `estado_sesion_activa.md`**:
- Fecha de certificación
- Commit hash del frontend y backend en el momento de la certificación
- Resultado de ng test (specs, failures, cobertura)
- Resultado de mvn test (tests, failures)
- Lista de módulos verificados

**Hacer commit**:
```bash
git add docs/pruebas/estado_sesion_activa.md
git commit -m "chore(qa): verificación completa 4 fases — $(date +%Y-%m-%d)

Fase 1 (inventario), Fase 2 (correcciones), Fase 3 (re-ejecución),
Fase 4 (certificación) completadas. X casos verificados, 0 bugs abiertos.
ng test: X specs, 0 fallos. Cobertura: X%.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

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
| Ronda 3 | 2026-06-22 | — | 🔄 En curso | Protocolo 4 fases aplicado por primera vez. Ver `estado_sesion_activa.md` |
