# Changelog

Todas las modificaciones notables de este proyecto se documentan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto adopta [Versionado Semántico](https://semver.org/lang/es/).

## [No publicado]

## [1.1.1] — 2026-07-10

Documentación, organización de repositorios y gobernanza de seguridad (sin cambios funcionales).

### Añadido
- **Gobernanza de seguridad (Brecha 4):** `SECURITY.md` (canal *GitHub Private Vulnerability
  Reporting*), Dependabot (`npm` + `github-actions`, agrupado minor/patch) y paso `npm audit` en el CI
  (gate bloqueante en `critical`, informativo en `high`).

### Cambiado
- **Organización documental:** los archivos `CLAUDE*.md` dejan de versionarse (gitignorados; la
  plantilla vive solo en el directorio de plantillas). La documentación general del sistema (memoria
  técnica global, guía rápida de usuario y planes) se centraliza en el repo paraguas `almacenes`; este
  repositorio conserva solo su documentación propia. Enlaces de README e índices de `docs/` actualizados.
- Actualización de dependencias minor/patch (Dependabot); `npm audit fix` (sin cambios funcionales).

## [1.1.0] — 2026-07-08

Pipeline de CI/CD (incl. E2E), consistencia documental y repositorio público.

### Añadido
- **CI/CD (GitHub Actions):** `ci.yml` (build AOT de producción + `ng test`, **462 specs**),
  `cd.yml` (publica la imagen Docker en **GHCR**, tag SHA + `latest`) y `e2e.yml` (**15 tests
  Playwright** sobre el stack completo, manual). Badges de CI/CD/E2E en el README.

### Corregido
- E2E: sembrado de datos de negocio (usuarios de auditoría + `seed_data` + clientes), locators de
  autocomplete robustos (`getByRole('combobox')`) y corrección del test de URL inexistente (404).
- Consistencia documental tras la corrección de raíz de roles en el backend y el conteo de tests.

### Cambiado
- Repositorio **público**; branch protection activa (require PR + check de CI).
- Despliegue **agnóstico del dominio**: `environment.prod.ts` con `apiUrl` relativo (`/api/v1`).

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

[No publicado]: https://github.com/davidreyna1974/almacenes-frontend/compare/v1.1.1...HEAD
[1.1.1]: https://github.com/davidreyna1974/almacenes-frontend/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/davidreyna1974/almacenes-frontend/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/davidreyna1974/almacenes-frontend/releases/tag/v1.0.0
