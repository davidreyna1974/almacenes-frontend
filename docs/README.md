# Documentación — Almacenes Frontend

Índice navegable de toda la documentación del repositorio. Para la visión general del proyecto,
ver el [README principal](../README.md).

---

## 🏗️ Arquitectura y decisiones
| Documento | Contenido |
|---|---|
| [Memoria técnica global](arquitectura/memoria_tecnica_global_proyecto.md) | Visión del sistema, stack, decisiones arquitectónicas, contratos de integración, RBAC transversal, estado del proyecto, lecciones globales. |
| [Diagrama de arquitectura](arquitectura/diagrama_arquitectura.md) | Diagramas Mermaid: capas, estructura interna, flujo de auth, máquinas de estado. |
| [Estándares de desarrollo](arquitectura/estandares_referencia_desarrollo.md) | Convenciones y buenas prácticas de referencia. |

## 🧩 Memorias técnicas por módulo
Cada módulo documenta contexto, decisiones de diseño, componentes, contratos, RBAC, tests y bugs.

| Módulo | Documento |
|---|---|
| Infraestructura + Layout | [memoria](modulos/infra_base/memoria_tecnica_modulo_infra_base_frontend.md) |
| Auth + RBAC | [memoria](modulos/auth/memoria_tecnica_modulo_auth_frontend.md) |
| Usuarios | [memoria](modulos/usuarios/memoria_tecnica_modulo_usuarios_frontend.md) |
| Inventory | [memoria](modulos/inventory/memoria_tecnica_modulo_inventory_frontend.md) |
| Purchases | [memoria](modulos/compras/memoria_tecnica_modulo_compras_frontend.md) |
| Sales | [memoria](modulos/sales/memoria_tecnica_modulo_sales_frontend.md) |
| Reports | [memoria](modulos/reports/memoria_tecnica_modulo_reports_frontend.md) |

## ✅ Calidad (QA)
| Documento | Contenido |
|---|---|
| ⭐ [Reporte de QA](qa/REPORTE_QA.md) | **Resultado de la campaña de certificación**: 704 casos, 5 módulos certificados, 0 bugs. |
| [Protocolo de verificación en 4 fases](qa/protocolo_verificacion_4_fases.md) | Metodología de QA (congelamiento → corrección → re-ejecución → certificación). |
| [Casos de prueba por módulo](qa/) | Documentos detallados: [compras](qa/casos_de_prueba_modulo_compras.md) · [inventario](qa/casos_de_prueba_modulo_inventario.md) · [reports](qa/casos_de_prueba_modulo_reports.md) · [sales](qa/casos_de_prueba_modulo_sales.md) · [usuarios](qa/casos_de_prueba_modulo_usuarios.md) |
| [Plantilla de casos](qa/casos_de_prueba_modulo_TEMPLATE.md) | Plantilla reutilizable para nuevos módulos. |
| [Bitácora de sesiones](qa/_bitacora/) | _Artefactos internos del proceso (no esenciales para revisión)._ |

## 🗺️ Planificación
| Documento | Contenido |
|---|---|
| [Propuesta y plan de trabajo](planificacion/propuesta_plan_trabajo_frontend.md) | Planificación previa al desarrollo del frontend. |

## 📖 Guías
| Documento | Contenido |
|---|---|
| [Guía rápida de usuario](guias/guia_rapida_usuario.md) | Uso funcional de la aplicación. |

## 🖼️ Recursos
| Carpeta | Contenido |
|---|---|
| [recursos/](recursos/) | Capturas de pantalla y diagramas. |

---

> **Convención de versionado/QA:** ante cualquier cambio nuevo se aplica el
> [Protocolo de 4 fases](qa/protocolo_verificacion_4_fases.md) y se actualiza la memoria técnica
> del módulo afectado + la global. Ver también [`../CLAUDE.md`](../CLAUDE.md) (convenciones del repo).
