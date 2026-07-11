# Almacenes — Frontend

> Aplicación web para la **gestión de almacenes**: inventario, compras, ventas, reportes y administración de usuarios, con control de acceso por rol (RBAC) de extremo a extremo.

![versión](https://img.shields.io/badge/versión-1.1.1-6B3C6B)
![Angular](https://img.shields.io/badge/Angular-21-DD0031)
![tests](https://img.shields.io/badge/tests-462%20passing-2E7D32)
![CI](https://github.com/davidreyna1974/almacenes-frontend/actions/workflows/ci.yml/badge.svg)
![CD](https://github.com/davidreyna1974/almacenes-frontend/actions/workflows/cd.yml/badge.svg)
![E2E](https://github.com/davidreyna1974/almacenes-frontend/actions/workflows/e2e.yml/badge.svg)
![cobertura](https://img.shields.io/badge/cobertura-88.94%25%20statements-2E7D32)
![QA](https://img.shields.io/badge/QA-certificado%20(4%20fases)-1565C0)
![estado](https://img.shields.io/badge/estado-estable%20·%20mantenimiento-2E7D32)
![licencia](https://img.shields.io/badge/licencia-MIT-757575)

> **Estado:** proyecto **cerrado en v1.1.1** — estable, en **modo mantenimiento**. Acta de cierre en el
> repo paraguas [`almacenes`](https://github.com/davidreyna1974/almacenes/blob/main/docs/cierre_proyecto_almacenes.md).

Este repositorio contiene el **frontend Angular**. Es parte de un sistema de dos capas:

| Capa | Repositorio | Tecnología |
|---|---|---|
| **Frontend** (este repo) | `almacenes-frontend` | Angular 21 + Angular Material |
| Backend (API REST) | [`almacenes-backend`](https://github.com/davidreyna1974/almacenes-backend) | Spring Boot 3 + PostgreSQL |
| Visión del sistema completo | [`almacenes`](https://github.com/davidreyna1974/almacenes) | Documentación / portafolio |

---

## 📋 Tabla de contenidos
- [Descripción](#-descripción)
- [Capturas](#-capturas)
- [Stack tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Características](#-características)
- [Cómo ejecutar](#-cómo-ejecutar)
- [Calidad y QA](#-calidad-y-qa)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Documentación](#-documentación)
- [Licencia](#-licencia)

---

## 🎯 Descripción

**Almacenes** es un sistema de gestión de inventario de escala media diseñado para operar un almacén
real: registra productos y categorías, controla el stock mediante movimientos (Kardex), gestiona
órdenes de compra y de venta con sus máquinas de estado, y ofrece reportes ejecutivos, analíticos
y operativos. El acceso a cada funcionalidad está segregado por **4 roles** (Administrador, Gerente,
Almacenista, Ventas).

El frontend consume la API REST del backend (`http://localhost:8080/api/v1`) con autenticación JWT,
interceptores HTTP y guards de ruta por rol.

---

## 🖼️ Capturas

> _Las capturas se encuentran en [`docs/recursos/`](docs/recursos/). Para añadirlas, ver
> [docs/recursos/README.md](docs/recursos/README.md)._

| Login | Inventario | Dashboard Ejecutivo |
|---|---|---|
| `docs/recursos/login.png` | `docs/recursos/inventario.png` | `docs/recursos/dashboard.png` |

---

## 🛠️ Stack tecnológico

- **Framework:** Angular 21 (standalone components, signals, `inject()`)
- **UI:** Angular Material (tema personalizado púrpura `#6B3C6B`)
- **Lenguaje:** TypeScript (strict mode)
- **Estilos:** SCSS + theming de Angular Material
- **Estado:** RxJS + servicios con `BehaviorSubject` (sin NgRx — escala media)
- **HTTP:** `HttpClient` con interceptores (JWT + manejo global de errores)
- **Gráficas:** ng2-charts + Chart.js
- **Fechas:** `MatDatepicker` con adapter propio (`DdMmYyyyDateAdapter`) → formato `dd/MM/yyyy`
- **Tests:** Vitest (unit) + verificación E2E en navegador
- **Observabilidad:** Sentry (opcional vía env)

---

## 🏗️ Arquitectura

Arquitectura por capas con módulos de negocio, núcleo transversal (auth, layout, interceptores)
y componentes compartidos. Diagrama y decisiones detalladas en
[`docs/arquitectura/`](docs/arquitectura/) — ver el
[diagrama de arquitectura](docs/arquitectura/diagrama_arquitectura.md).

```
src/app/
├── core/        auth (service, guard, interceptores), layout (sidebar/topbar), shared
└── modules/     auth · inventory · purchases · sales · reports
```

---

## ✨ Características

- **Autenticación JWT** con re-login al expirar (2 h) y rate limiting en backend.
- **RBAC de 4 roles** aplicado en rutas (guards), UI (visibilidad) y datos (redacción de campos sensibles).
- **Inventario:** categorías, productos, movimientos de stock (Kardex), alertas de stock bajo.
- **Compras:** proveedores y órdenes con máquina de estados `PENDING → APPROVED → RECEIVED / CANCELLED`.
- **Ventas:** clientes, órdenes y reservaciones, con control de stock disponible y bloqueo optimista.
- **Reportes:** dashboard ejecutivo (KPIs + donut de valuación), analítico (rentabilidad, tendencia,
  top productos, ABC, por proveedor) y operativo (stock bajo, Kardex, movimientos, rotación).
- **Gestión de usuarios y perfil** (solo Administrador para usuarios; perfil propio para todos).
- **UX cuidada:** vista maestro-detalle, validaciones inline, snackbars semánticos, estados vacíos
  diferenciados, búsqueda accent/case-insensitive.
- **Build agnóstico del dominio:** `environment.prod.ts` usa `apiUrl` relativo (`/api/v1`); el mismo
  build sirve para cualquier dominio/cliente/nube (nginx proxea `/api/` en el mismo origen, sin CORS).
- **Gobernanza de dependencias:** [`SECURITY.md`](SECURITY.md) (reporte vía GitHub Private Vulnerability
  Reporting), **Dependabot** y **`npm audit`** en el CI (gate en `critical`).

Matriz RBAC completa en la [memoria técnica global](https://github.com/davidreyna1974/almacenes/blob/main/docs/memoria_tecnica_global_proyecto.md) (repo paraguas `almacenes`).

---

## 🚀 Cómo ejecutar

### Requisitos
- Node.js 20+ y npm
- Angular CLI 21 (`npm install -g @angular/cli`)
- El [backend](https://github.com/davidreyna1974/almacenes-backend) corriendo en `http://localhost:8080`

### Pasos
```bash
# 1. Instalar dependencias
npm install

# 2. Servidor de desarrollo (http://localhost:4200)
ng serve

# 3. Tests unitarios
ng test --no-watch

# 4. Tests con cobertura
ng test --no-watch --coverage

# 5. Build de producción
ng build --configuration=production
```

**Usuarios de prueba** (requieren el backend con datos seed):

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin123!` | Administrador |
| `qa_manager` | `QaManager123!` | Gerente |
| `qa_warehouse` | `QaWarehouse123!` | Almacenista |
| `qa_sales` | `QaSales123!` | Ventas |

---

## ✅ Calidad y QA

Este proyecto se sometió a una **campaña de QA formal bajo un Protocolo de 4 fases** (congelamiento de
código, corrección con gatekeeper, re-ejecución y certificación). Es el principal sello de rigor del proyecto.

- **462 tests unitarios** · 0 fallos · **88.94% statements**
- **704 casos de prueba** documentados (SEC, RBAC, CRUD, VAL, BSRCH, UI, FLOW, RN, ERR, EMPTY, VIS, CYBER)
- **5 módulos CERTIFICADOS** · 0 FAIL · 0 bugs funcionales
- Verificación de regresión cruzada final: 0 regresiones

📄 **Reporte completo:** [`docs/qa/REPORTE_QA.md`](docs/qa/REPORTE_QA.md) ·
**Protocolo:** [`docs/qa/protocolo_verificacion_4_fases.md`](docs/qa/protocolo_verificacion_4_fases.md)

---

## 📁 Estructura del proyecto

```
almacenes-frontend/
├── src/                  código Angular (core + modules)
├── docs/                 documentación propia del frontend (ver docs/README.md)
│   ├── arquitectura/     estándares y diagrama (frontend)
│   ├── modulos/          memoria técnica por módulo
│   ├── qa/               protocolo 4 fases, casos de prueba, reporte de QA
│   ├── planificacion/    propuesta y plan de trabajo del frontend
│   └── recursos/         capturas y diagramas
├── CHANGELOG.md          historial de versiones
└── README.md            este archivo
```

---

## 📚 Documentación

Toda la documentación está indexada en **[`docs/README.md`](docs/README.md)**. Destacados:

- [Reporte de QA (frontend)](docs/qa/REPORTE_QA.md) — resultados de la campaña de certificación.
- [Memorias técnicas por módulo](docs/modulos/) — decisiones de diseño y bugs por módulo.
- [Estándares de desarrollo (frontend)](docs/arquitectura/estandares_referencia_desarrollo.md).

Documentación **general del sistema** (memoria técnica global, guía rápida de usuario, planes de
producción/despliegue) en el repo paraguas
[`almacenes`](https://github.com/davidreyna1974/almacenes/tree/main/docs).

---

## 📄 Licencia

Distribuido bajo licencia **MIT**. Ver [`LICENSE`](LICENSE).

---

<sub>Proyecto de portafolio — David Reyna Pineda · 2026</sub>
