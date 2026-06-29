# Changelog

Todas las modificaciones notables de este proyecto se documentan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto adopta [Versionado Semántico](https://semver.org/lang/es/).

## [1.0.0] — 2026-06-28

Primera versión estable. Sistema completo y certificado bajo el Protocolo de QA de 4 fases.

### Añadido
- **Infraestructura y layout**: shell con sidebar colapsable + topbar, tema Angular Material
  púrpura (`#6B3C6B / #CE6EEB / #F2E4F2`), vista maestro-detalle reutilizable.
- **Autenticación y RBAC**: login con JWT, interceptor JWT, interceptor de errores (401/403),
  `authGuard` por rol, filtrado del sidebar por rol, 4 roles (ADMIN, MANAGER, WAREHOUSEMAN, SALES).
- **Inventario**: categorías, productos, movimientos de stock (Kardex), alertas de stock bajo;
  `availableStock` como criterio de negocio; `unitCost` redactado por rol.
- **Compras**: proveedores y órdenes de compra con máquina de estados
  `PENDING → APPROVED → RECEIVED / CANCELLED`.
- **Ventas**: clientes, órdenes de venta y reservaciones; control de stock disponible;
  manejo de bloqueo optimista.
- **Reportes**: dashboards ejecutivo, analítico y operativo (12 vistas, 3 audiencias) con ng2-charts.
- **Gestión de usuarios y perfil propio**: CRUD de usuarios (solo ADMIN), perfil y cambio de
  contraseña (todos los roles), dropdown de usuario en topbar.

### Corregido
- **BUG-REP-05 / formato de fecha**: los `MatDatepicker` usaban `M/d/yyyy` (locale por defecto en-US)
  en contra del estándar `dd/MM/yyyy`. Se añadió `DdMmYyyyDateAdapter` (parseo y formato coherentes).
- **CYBER-05** (backend): parámetros de query con tipo inválido devolvían HTTP 500 filtrando el tipo
  interno; ahora devuelven HTTP 400 sin filtrar (`GlobalExceptionHandler`).
- Bugs por módulo documentados en las memorias técnicas (`docs/modulos/`).

### Calidad
- **462 tests unitarios**, 0 fallos, 88.94% statements.
- **704 casos de prueba** documentados; **5 módulos certificados** (Compras, Inventario, Ventas,
  Reportes, Auth/Usuarios) bajo Propuesta D del Protocolo de 4 fases.
- Verificación de regresión cruzada final: 0 regresiones.
- Reporte completo en [`docs/qa/REPORTE_QA.md`](docs/qa/REPORTE_QA.md).

[1.0.0]: https://github.com/davidreyna1974/almacenes-frontend/releases/tag/v1.0.0
