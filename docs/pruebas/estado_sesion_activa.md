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
| **Fase actual** | FASE 2 — Corrección de bugs |
| **Siguiente acción** | Corregir los 6 bugs de Compras (ver §Bugs pendientes) |

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

## FASE 2 — Corrección de bugs (estado: 🔄 EN CURSO)

### Bugs pendientes de corrección (autorizados por el usuario 2026-06-22)

| Bug ID | Módulo | Descripción | Blast radius | Estado |
|---|---|---|---|---|
| BUG-M3-15 | Compras | Búsqueda client-side en lugar de server-side | Local (purchases) | ⏳ Pendiente |
| BUG-M3-16 | Compras | Sin campo "motivo" al cancelar una OC | Local (purchases) | ⏳ Pendiente |
| BUG-M3-17 | Compras | Historial ausente en detalle al crear OC | Local (purchases) | ⏳ Pendiente |
| BUG-M3-18 | Compras | Subtotal negativo visible en formulario de línea | Local (purchases) | ⏳ Pendiente |
| BUG-INV-15 / CYBER-13 | Global | CORS wildcard → verificar si ya está corregido en backend | Global (todos) | ⚠️ Verificar — puede estar corregido |
| CYBER-02 / BUG-INV-13 | Global | JWT sin validación de firma en cliente | Global (todos) | ⚠️ Verificar — puede ser N/A |

> ⚠️ BUG-INV-15 fue corregido en la rama de Inventario (2026-06-11). Verificar si el fix
> ya está en `develop` antes de re-aplicarlo.
> ⚠️ BUG-INV-13/CYBER-02 fue marcado "NO REPRODUCIBLE" en la ronda de Inventario.
> Verificar estado actual antes de intentar fix.

### Gatekeeper automatizado (ejecutar tras CADA fix)

```bash
# Frontend
cd "/Users/davidreynapineda/Documents/Proyecto desarrollo/codigo/frontend/almacenes"
ng test --no-watch --no-progress

# Backend
cd "/Users/davidreynapineda/Documents/Proyecto desarrollo/codigo/backend/almacenes"
./mvnw test -Djacoco.skip=true
```

### Resultados del gatekeeper

| Fix aplicado | ng test | mvn test | Fecha |
|---|---|---|---|
| (ninguno aún) | — | — | — |

---

## FASE 3 — Re-ejecución completa (estado: ⏳ No iniciada)

> Iniciar solo cuando Fase 2 esté completada (todos los bugs corregidos, gatekeepers OK).

### Blast radius acumulado de los fixes de Fase 2

> Completar cuando Fase 2 esté terminada. Determina qué módulos se re-ejecutan.

| Fix | Blast radius | Módulos afectados |
|---|---|---|
| BUG-M3-15..18 | Local | Compras |
| BUG-INV-15 (si aplica) | Global | Todos |
| CYBER-02 (si aplica) | Global | Todos |

**Módulos a re-ejecutar en Fase 3**: (pendiente de determinar según fixes reales aplicados)

### Progreso de re-ejecución por módulo

| Módulo | Estado | Última categoría completada | Bugs nuevos encontrados |
|---|---|---|---|
| Auth / Usuarios | ⏳ No iniciado | — | — |
| Inventario | ⏳ No iniciado | — | — |
| Compras | ⏳ No iniciado | — | — |
| Ventas | ⏳ No iniciado | — | — |
| Reportes | ⏳ No iniciado | — | — |

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

#### Compras
| Categoría | Total | PASS | FAIL | N/A | Estado |
|---|:---:|:---:|:---:|:---:|:---:|
| SEC | 10 | — | — | — | ⏳ |
| RBAC | 16 | — | — | — | ⏳ |
| CRUD | 19 | — | — | — | ⏳ |
| VAL | 19 | — | — | — | ⏳ |
| BSRCH | 12 | — | — | — | ⏳ |
| UI | 24 | — | — | — | ⏳ |
| FLOW | 12 | — | — | — | ⏳ |
| RN | 8 | — | — | — | ⏳ |
| ERR | 12 | — | — | — | ⏳ |
| EMPTY | 8 | — | — | — | ⏳ |
| VIS | 14 | — | — | — | ⏳ |
| CYBER | 15 | — | — | — | ⏳ |

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

## FASE 4 — Certificación (estado: ⏳ No iniciada)

| Campo | Valor |
|---|---|
| Fecha de certificación | — |
| Commit hash frontend | — |
| Commit hash backend | — |
| ng test resultado | — |
| ng test cobertura | — |
| mvn test resultado | — |

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
