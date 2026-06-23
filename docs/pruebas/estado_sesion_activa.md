# Estado de sesión activa — Verificación 4 fases

> **INSTRUCCIÓN**: Leer este archivo al inicio de cualquier sesión de pruebas para saber
> exactamente dónde continuar. Actualizar al completar cada módulo o categoría.
> Si la sesión se interrumpe (límite de uso de Claude Code, cierre de ventana, etc.),
> el estado queda persistido aquí y la siguiente sesión retoma sin pérdida de contexto.

---

## Estado general

| Campo | Valor |
|---|---|
| **Ronda activa** | Ronda 3 |
| **Protocolo** | 4 fases (ver `protocolo_verificacion_4_fases.md`) |
| **Fecha de inicio** | 2026-06-22 |
| **Fase actual** | FASE 3 COMPLETADA (Compras) → lista para FASE 4 (certificación) |
| **Siguiente acción** | Fase 4 de Compras: `ng test --code-coverage` (≥70%, 0 fallos) + `mvn test` (0 fallos) + commit `chore(qa): verificación completa 4 fases — 2026-06-22`. Pendiente de menor prioridad: merge de `fix/trackby-strict-templates-build` (cf5eefb) a develop con `--no-ff`; limpieza L33 de datos QA residuales (proveedor XSS, AINT*/MGBR*) |

---

## FASE 1 — Inventario (estado: ✅ COMPLETADA en rondas anteriores)

> La Fase 1 de esta ronda usa los resultados de las rondas anteriores como inventario.
> Bugs actualmente abiertos documentados en los documentos de casos.

| Módulo | Casos totales | PASS | FAIL/ABIERTO | N/A | PENDIENTE | Estado Fase 1 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Auth / Usuarios | 91 | 90 | 0 | 1 | 0 | ✅ Inventariado |
| Inventario | 198 | 191 | 0 | 7 | 0 | ✅ Inventariado |
| Compras | 170 | 159 | 6 | 5 | 0 | ✅ Inventariado |
| Ventas | 190 | 186 | 0 | 4 | 0 | ✅ Inventariado |
| Reportes | 94 | 82 | 0 | 12 | 0 | ✅ Inventariado |

---

## FASE 2 — Corrección de bugs (estado: ✅ COMPLETADA 2026-06-22 + reinicio por BUG-M3-15b)

### Bugs corregidos

| Bug ID | Módulo | Descripción | Blast radius | Estado |
|---|---|---|---|---|
| BUG-M3-15 | Compras | Búsqueda client-side → server-side (backend+frontend) | Local (purchases) | ✅ CORREGIDO (incompleto — ver BUG-M3-15b) |
| BUG-M3-16 | Compras | Sin campo "motivo" — DISEÑO CONFIRMADO, caso actualizado | Local (purchases) | ✅ DISEÑO CONFIRMADO |
| BUG-M3-17 | Compras | Historial en creación — DISEÑO CONFIRMADO, caso N/A | Local (purchases) | ✅ DISEÑO CONFIRMADO |
| BUG-M3-18 | Compras | Subtotal negativo → guard `(q>=1 && p>0)` | Local (purchases) | ✅ CORREGIDO |
| BUG-M3-19 | Compras | Subtotal $0 en edición + sin confirm en creación | Local (purchases) | ✅ CORREGIDO |
| BUG-INV-15 / CYBER-13 | Global | CORS ya corregido — confirmado en código | N/A (ya estaba) | ✅ CONFIRMADO |
| CYBER-02 / BUG-INV-13 | Global | JWT firma — resuelto por BUG-INV-09 globalmente | N/A (ya estaba) | ✅ CONFIRMADO |
| BUG-M3-15b | Compras | Regresión: native query ignoraba `:search` sin CAST → fix patrón inventario | Local (purchases) | ✅ CORREGIDO (2026-06-22 reinicio) |
| BUG-BUILD-01 | Global (build) | `ng serve`/`ng build` falla con 2 errores TS2322: `trackById(_, item: { id: number })` no asignable a `TrackByFunction<SupplierDTO>`/`<ClientDTO>` (ambos DTO tienen `id: number \| null`) bajo strictTemplates Angular 21. Enmascarado por bundle stale del dev server. Fix: tipar el parámetro al DTO real y retornar `number \| null` | Local (2 componentes: SuppliersPage, ClientsPage) | ✅ CORREGIDO (2026-06-22 2º reinicio) |

### Resultados del gatekeeper

| Fix aplicado | ng test | ng build | mvn test | Fecha |
|---|---|---|---|---|
| Todos los fixes BUG-M3-15..19 + docs | 456 specs, 0 fallos ✅ | (no ejecutado — brecha) ⚠️ | 405 tests, 0 fallos ✅ | 2026-06-22 |
| BUG-M3-15b (native query CAST fix) | 456 specs, 0 fallos ✅ | (no ejecutado — brecha) ⚠️ | mvn test -q exit code 0 ✅ | 2026-06-22 |
| BUG-BUILD-01 (trackBy strictTemplates) | 456 tests, 0 fallos ✅ | 0 errores ✅ | N/A (frontend-only) | 2026-06-22 |

> **⚠️ Brecha de gatekeeper detectada (BUG-BUILD-01)**: el gatekeeper de Fase 2 usaba solo
> `ng test`, cuya compilación (Vitest) no aplica el type-check AOT estricto de templates de
> `ng build`/`ng serve`. Por eso 456 specs pasaban pero el build de producción estaba roto.
> **A partir de ahora el gatekeeper DEBE incluir `ng build` además de `ng test` y `mvn test`.**

---

## FASE 3 — Re-ejecución completa (estado: ✅ COMPLETADA — Compras, 2026-06-22)

> Fase 2 completada 2026-06-22. Todos los fixes son locales al módulo Compras.
> Alcance de re-ejecución acordado con el usuario: **"Solo zonas tocadas por los fixes"** —
> se re-ejecutó en browser únicamente el blast radius de los fixes de esta ronda (lista de
> órdenes con búsqueda server-side, formulario de línea, lista de proveedores/trackById)
> sobre bundle fresco. El resto de categorías de Compras y los demás módulos (Auth,
> Inventario, Ventas, Reportes) están **fuera del blast radius** → conservan su estado
> PASS/N/A de las verificaciones previas; no se re-probaron.

### Blast radius acumulado de los fixes de Fase 2

| Fix | Blast radius | Módulos afectados |
|---|---|---|
| BUG-M3-15..19 | Local (purchases) | Solo Compras |
| BUG-M3-16/17 (diseño) | Ninguno | N/A |
| BUG-INV-15/CYBER-13/CYBER-02 | N/A (ya estaban corregidos) | N/A |

**Módulos a re-ejecutar en Fase 3**: **solo Compras** (170 casos)

### Progreso de re-ejecución por módulo

| Módulo | Estado | Última categoría completada | Bugs nuevos encontrados |
|---|---|---|---|
| Auth / Usuarios | ⬜ Fuera de blast radius | — (sin fix en esta ronda) | — |
| Inventario | ⬜ Fuera de blast radius | — (sin fix en esta ronda) | — |
| Compras | ✅ COMPLETADA (blast radius) | BSRCH-SUP (lista proveedores / trackById) | 0 — código congelado |
| Ventas | ⬜ Fuera de blast radius | — (sin fix en esta ronda) | — |
| Reportes | ⬜ Fuera de blast radius | — (sin fix en esta ronda) | — |

### Progreso detallado por categoría (actualizar en tiempo real)

#### Auth / Usuarios
| Categoría | Total | PASS | FAIL | N/A | Estado |
|---|:---:|:---:|:---:|:---:|:---:|
| SEC | 5 | — | — | — | ⏳ |
| RBAC | 6 | — | — | — | ⏳ |
| CRUD | 9 | — | — | — | ⏳ |
| VAL | 11 | — | — | — | ⏳ |
| BSRCH | 3 | — | — | — | ⏳ |
| UI | 16 | — | — | — | ⏳ |
| FLOW | 7 | — | — | — | ⏳ |
| RN | 7 | — | — | — | ⏳ |
| ERR | 8 | — | — | — | ⏳ |
| EMPTY | 2 | — | — | — | ⏳ |
| VIS | 17 | — | — | — | ⏳ |

#### Inventario
| Categoría | Total | PASS | FAIL | N/A | Estado |
|---|:---:|:---:|:---:|:---:|:---:|
| SEC | 5 | — | — | — | ⏳ |
| RBAC | 28 | — | — | — | ⏳ |
| CRUD | 18 | — | — | — | ⏳ |
| VAL | 27 | — | — | — | ⏳ |
| BSRCH | 20 | — | — | — | ⏳ |
| UI | 28 | — | — | — | ⏳ |
| FLOW | 8 | — | — | — | ⏳ |
| RN | 10 | — | — | — | ⏳ |
| ERR | 10 | — | — | — | ⏳ |
| EMPTY | 7 | — | — | — | ⏳ |
| VIS | 15 | — | — | — | ⏳ |
| CYBER | 22 | — | — | — | ⏳ |

#### Compras (re-ejecución scoped al blast radius — 2026-06-22)
> Solo se re-ejecutaron en browser las categorías dentro del blast radius de los fixes de
> esta ronda. Las demás conservan su estado de 2026-06-11/12/21 (✅ fuera de blast radius).

| Categoría | Total | Re-ejecutado en Fase 3 (blast radius) | Estado |
|---|:---:|---|:---:|
| SEC | 10 | — (fuera de blast radius) | ✅ conservado |
| RBAC | 16 | — (fuera de blast radius) | ✅ conservado |
| CRUD | 19 | CRUD-LIN: eliminar línea con confirmación (BUG-M3-19 p2) | ✅ PASS |
| VAL | 19 | VAL-LIN-05 (subtotal no negativo, BUG-M3-18) | ✅ PASS |
| BSRCH | 12 | BSRCH-ORD-01..05 (búsqueda órdenes server-side) + BSRCH-SUP-03/04/05 (proveedores) | ✅ PASS |
| UI | 24 | — (fuera de blast radius) | ✅ conservado |
| FLOW | 12 | — (fuera de blast radius) | ✅ conservado |
| RN | 8 | — (fuera de blast radius) | ✅ conservado |
| ERR | 12 | — (fuera de blast radius) | ✅ conservado |
| EMPTY | 8 | EMPTY-ORD/EMPTY-SUP (estados vacíos de búsqueda) | ✅ PASS |
| VIS | 14 | VIS-SUP (render lista proveedores tras fix trackById) | ✅ PASS |
| CYBER | 15 | — (fuera de blast radius) | ✅ conservado |

#### Ventas
| Categoría | Total | PASS | FAIL | N/A | Estado |
|---|:---:|:---:|:---:|:---:|:---:|
| SEC | 10 | — | — | — | ⏳ |
| RBAC | 31 | — | — | — | ⏳ |
| CRUD | 15 | — | — | — | ⏳ |
| VAL | 17 | — | — | — | ⏳ |
| BSRCH | 6 | — | — | — | ⏳ |
| UI | 41 | — | — | — | ⏳ |
| FLOW | 12 | — | — | — | ⏳ |
| RN | 6 | — | — | — | ⏳ |
| ERR | 10 | — | — | — | ⏳ |
| EMPTY | 6 | — | — | — | ⏳ |
| VIS | 36 | — | — | — | ⏳ |

#### Reportes
| Categoría | Total | PASS | FAIL | N/A | Estado |
|---|:---:|:---:|:---:|:---:|:---:|
| (categorías pendientes de mapear del doc) | 94 | — | — | — | ⏳ |

---

## FASE 4 — Certificación (estado: ✅ CERTIFICADA — 2026-06-22)

| Campo | Valor |
|---|---|
| Fecha de certificación | 2026-06-22 |
| Commit hash frontend | `cf5eefb` (fix trackById/BUG-BUILD-01) mergeado a develop + commit `chore(qa)` de esta certificación |
| Commit hash backend | `c82a868` (fix BUG-M3-15b) → merge `d231270` en develop |
| ng test resultado | **37 test files · 456 specs · 0 fallos** (`ng test --no-watch`) |
| ng test cobertura | **88.94% statements** · 85.66% branches · 81.69% functions · 93.78% lines (≥70% ✅) |
| mvn test resultado | **405 tests · 0 fallos · 0 errores · BUILD SUCCESS** (`mvn clean test`) |

> **Nota:** durante la Fase 4 se detectó que dos fixes de Fase 2 estaban sin integrar a
> develop: el fix backend BUG-M3-15b (`PurchaseOrderRepository.java`) estaba modificado pero
> sin commitear en develop, y el fix frontend BUG-BUILD-01 (`cf5eefb`) vivía en la rama
> `fix/trackby-strict-templates-build` sin mergear. Ambos se integraron a develop vía
> `git merge --no-ff` antes de cerrar la certificación, de modo que el estado certificado
> coincide con el estado commiteado en develop. El backend requirió `mvn clean test` por una
> corrupción de instrumentación JaCoCo en `target/` (clean la resolvió).

---

## Contexto de recuperación rápida

> Si la sesión se interrumpe, iniciar la siguiente con estos pasos:

```
1. Leer este archivo (estado_sesion_activa.md)
2. Verificar qué fase está activa y cuál es la "Siguiente acción"
3. Si Fase 2: continuar con el primer bug ⏳ Pendiente de la tabla de bugs
4. Si Fase 3: continuar con el primer módulo/categoría que tenga ⏳ en la tabla
5. Re-obtener tokens JWT al inicio del primer módulo que se vaya a probar:
   Login con admin/Admin123!, qa_manager/QaManager123!, qa_warehouse/QaWarehouse123!, qa_sales/QaSales123!
6. Frontend en: http://localhost:4200
7. Backend en: http://localhost:8080/api/v1
```

---

## Notas de sesión

| Fecha | Nota |
|---|---|
| 2026-06-22 | Inicio de Ronda 3. Protocolo 4 fases establecido. 6 bugs de Compras autorizados para corrección. |
| 2026-06-22 | Fase 2 completada. Backend: 405 tests 0 fallos. Frontend: 456 tests 0 fallos. Todos los fixes mergeados a develop. |
| 2026-06-22 | Fase 3 iniciada. Blast radius: solo Compras (170 casos). Pendiente re-ejecución completa en browser. |
| 2026-06-22 | Fase 3 interrumpida: BUG-M3-15b encontrado en BSRCH-ORD-01 — native query ignoraba :search sin CAST(:search AS text). Fase 2 reiniciada. Fix aplicado. Gatekeeper: 456 specs 0 fallos + mvn exit 0. Fase 3 reiniciada. |
| 2026-06-22 | **Fase 3 INVALIDADA — bundle stale del dev server.** Al verificar BUG-M3-15b en browser, el paginador de órdenes mostraba "1–2 of 2" con 1 fila. Investigación (intercepción XHR + `getByStatus.toString()` en runtime) reveló que el navegador ejecutaba un **bundle compilado ANTERIOR al fix frontend de BUG-M3-15**: el `getByStatus` en runtime no enviaba el parámetro `search` y filtraba client-side (el código fuente sí lo envía). Conclusión: todos los casos "verificados" de esta Fase 3 corrieron contra código obsoleto → **inválidos**. Acción: kill ng serve + `rm -rf .angular/cache` + reinicio limpio. |
| 2026-06-22 | **Build roto descubierto (BUG-BUILD-01).** El reinicio limpio del dev server falló a compilar: 2 errores TS2322 en `trackById` de SuppliersPage y ClientsPage (strictTemplates). El bundle stale los enmascaraba. Vuelta a Fase 2. Fix aplicado (tipar param al DTO). Gatekeeper endurecido: `ng build` 0 errores ✅ + `ng test` 456 tests 0 fallos ✅. Dev server reiniciado y sirviendo HTTP 200 con código actual. **Pendiente: reconectar extensión de navegador para reiniciar Fase 3 desde cero sobre el bundle correcto.** |
| 2026-06-22 | **Fase 3 reinicio COMPLETADA (Compras, blast radius).** Navegador reconectado sobre bundle fresco. Alcance acordado con el usuario: "Solo zonas tocadas por los fixes". Re-ejecutado en browser: BSRCH-ORD-01..05 (búsqueda server-side `f_unaccent`, BUG-M3-15/15b) ✅; VAL-LIN-05 (subtotal $0.00 con cantidad -1, BUG-M3-18) ✅; BUG-M3-19 p1 (subtotal $960 al editar) + p2 (confirm dialog al eliminar línea en creación) ✅; lista proveedores tras fix trackById (BUG-BUILD-01): 116 filas sin errores de consola, búsqueda "logistica"→1 fila (accent-insensitive, tecleo real), "zzznoexiste"→empty-state, limpiar→restaura lista ✅. **0 bugs nuevos, código congelado de principio a fin.** Resultado Compras: 165 PASS · 5 N/A · 0 FAIL · 0 ABIERTO · 0 PENDIENTE. → Listo para Fase 4. |
