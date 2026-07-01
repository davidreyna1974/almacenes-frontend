# Reporte de Aseguramiento de Calidad (QA)

**Proyecto:** Sistema de Gestión de Almacenes — Frontend
**Versión certificada:** 1.0.0
**Fecha de cierre de campaña:** 2026-06-28
**Resultado:** ✅ **SISTEMA CERTIFICADO** — 5 módulos, 0 bugs funcionales, 0 regresiones.

---

## 1. Resumen ejecutivo

El sistema se sometió a una campaña de QA formal bajo un **Protocolo de verificación en 4 fases**
(metodología completa en [`protocolo_verificacion_4_fases.md`](protocolo_verificacion_4_fases.md)).
Se ejecutaron **704 casos de prueba** distribuidos en 12 categorías sobre los 5 módulos del sistema,
con verificación en navegador por los 4 roles, pruebas de seguridad server-side (`curl` + JWT por rol)
y una suite automatizada de **462 tests unitarios** (frontend) + **406 tests** (backend).

| Métrica | Valor |
|---|---|
| Casos de prueba ejecutados | **704** |
| Resultado | **0 FAIL · 0 bugs funcionales sin resolver** |
| Casos N/A (justificados) | 71 |
| Tests unitarios frontend | 462 · 0 fallos · **88.94% statements** |
| Tests backend | 406 · 0 fallos · BUILD SUCCESS |
| Módulos certificados | **5 / 5** (Propuesta D) |
| Regresión cruzada final | **0 regresiones** |

---

## 2. Metodología — Protocolo de 4 fases

> Regla fundamental: *una ronda de pruebas solo es válida si se ejecuta íntegra sobre una versión
> congelada del código, sin modificaciones entre el primer y el último caso.*

| Fase | Qué se hace | Entregable |
|---|---|---|
| **1 — Inventario** | Ejecutar todos los casos sobre código congelado, sin corregir | Lista de bugs (estado ABIERTO) |
| **2 — Corrección** | Aplicar fixes + gatekeeper (`ng build` + `ng test` + `mvn test`) | Código corregido, gatekeeper verde |
| **3 — Re-ejecución** | Re-ejecutar según *blast radius*; la lectura estricta literal habilita certificar | Casos 100% PASS/N/A |
| **4 — Certificación** | Gatekeeper + cobertura ≥70% + commit `chore(qa)` | Módulo certificado |

**Gatekeeper** (barrera no negociable por cada fix): `ng build --configuration=production` (0 errores AOT)
→ `ng test --no-watch` (0 fallos) → `mvn test` (0 fallos). El `ng build` no es opcional: el runner de
tests no aplica el type-check AOT estricto de templates.

---

## 3. Categorías de prueba

Cada módulo se verifica contra 12 categorías:

| Sigla | Categoría | Sigla | Categoría |
|---|---|---|---|
| SEC | Seguridad de rutas | RN | Reglas de negocio |
| RBAC | Control de acceso UI | ERR | Mensajes de error |
| CRUD | Flujos de datos | EMPTY | Estados vacíos |
| VAL | Validaciones de formulario | VIS | Visual y estética |
| BSRCH | Búsqueda e inputs | CYBER | Ciberseguridad (OWASP ASVS L1) |
| UI | Botones e íconos | FLOW | Flujos de estado / negocio |

**Técnicas de verificación:** tecleo real y lectura de `mat-error` (VAL), `getComputedStyle` con RGB
exacto (VIS), inspección del DOM por rol (RBAC), navegación por ruta directa (SEC), `curl` con JWT por
rol para enforcement server-side y redacción de campos (CYBER), apagado controlado del backend (resiliencia).

---

## 4. Resultados por módulo

| Módulo | Ronda | PASS · FAIL · N/A | Notas de cierre |
|---|---|---|---|
| **Compras** | R5 (2026-06-23) | 152 · 0 · 5 | Fase 3 estricta. Fix BUG-M3-23 (`disableClose`). |
| **Inventario** | R6 (2026-06-26) | 152 · 0 · 46 | Fase 1, 0 bugs. Limpieza L33 de datos QA. |
| **Ventas** | R7 (2026-06-27) | 201 · 0 · 4 | Fase 1, 0 bugs. Reconciliaciones CYBER-04/SEC-01. |
| **Reportes** | R10 (2026-06-28) | 96 · 0 · 13 | **Fase 3 estricta** (lectura literal de 109 casos). 2 fixes globales. |
| **Auth/Usuarios** | R2 (2026-06-28) | 103 · 0 · 3 | Fase 1, 0 bugs + cierre de gaps en vivo. |
| **TOTAL** | — | **704 · 0 · 71** | **0 bugs funcionales sin resolver.** |

Detalle por caso en los documentos de [casos de prueba](.) de cada módulo.

---

## 5. Fixes globales aplicados (Fase 2)

Ambos surgieron en la verificación de Reportes pero tienen *blast radius global*; se verificaron en los
4 módulos afectados:

1. **Formato de fecha de los `MatDatepicker` → `dd/MM/yyyy`** (estándar del proyecto). El adapter nativo
   con locale `es-PE` solo corregía el formato de salida; la Fase 3 estricta destapó que el adapter
   **parseaba el tecleo ignorando el locale** (desajuste parse/display). Solución definitiva:
   `DdMmYyyyDateAdapter` (override de `parse()`) + 6 specs unitarios.
2. **`MethodArgumentTypeMismatchException` → HTTP 400** (antes 500, filtrando el tipo `LocalDate`).
   Corregido en `GlobalExceptionHandler` del backend.

> **Lección reforzada:** la lectura estricta literal (todos los casos, una sesión continua, código
> congelado) es lo único que habilita declarar CERTIFICADO bajo Propuesta D — fue precisamente esa
> lectura la que reveló que el primer fix de fecha estaba incompleto.

---

## 6. Verificación de regresión cruzada final (2026-06-28)

Tras certificar los 5 módulos, se ejecutó una pasada de regresión cruzada sobre el sistema completo:

- Congelamiento: `git` limpio (0/0 vs origin) en ambos repos.
- Gatekeeper: `ng build` 0 errores AOT · `ng test` 462/462 · `mvn test` 406/406.
- **Matriz RBAC cruzada** por rol intacta en los 5 módulos (endpoints restringidos → 403; sin token → 401).
- Fix global de 400 confirmado en reports/inventory/purchases/sales.
- Render correcto de los 5 módulos (smoke test).
- 0 usuarios de prueba (QA) activos: datos de prueba creados y limpiados (disciplina L33).

**Resultado: 0 regresiones.**

---

## 7. Lecciones de QA destacadas (L29–L35)

- **L29** — Redacción de campos sensibles por rol (precios/costos) aplicada server-side, no solo en UI.
- **L30** — `401` vs `403` correctos; rate limiting de login (`429` al 6.º intento fallido).
- **L31** — Diálogos con formulario usan `disableClose: true`; paginador resetea a página 0 al filtrar.
- **L32** — Headers de tabla vía mixin SCSS compartido (no estilos copiados).
- **L33** — `forkJoin` multi-fuente con `catchError` por observable; datos de prueba prefijados y limpiados.
- **L34** — Patrón de acciones maestro-detalle (clic en fila → diálogo; sin columna de íconos redundante).
- **L35** — Verificación RBAC con usuarios QA permanentes, no efímeros.

---

## 8. Trazabilidad

- **Casos detallados por módulo:** [`docs/qa/casos_de_prueba_modulo_*.md`](.)
- **Protocolo:** [`protocolo_verificacion_4_fases.md`](protocolo_verificacion_4_fases.md)
- **Bitácora del proceso** (interno): [`_bitacora/`](_bitacora/)
- **Decisiones y lecciones globales:** [`../arquitectura/memoria_tecnica_global_proyecto.md`](../arquitectura/memoria_tecnica_global_proyecto.md)

---

> **Nota (mantenimiento post-certificación, 2026-06-30):** las cifras de este reporte reflejan
> la **campaña de QA que certificó el sistema** (462 frontend + 406 backend). Con posterioridad se
> habilitó Spring Boot Actuator, que añadió 2 tests backend → **suite actual: 462 + 408**. Sin
> cambios en el resultado de la campaña (0 FAIL, 0 bugs, 0 regresiones).

---

<sub>Reporte de QA — Sistema de Gestión de Almacenes · David Reyna Pineda · 2026</sub>
