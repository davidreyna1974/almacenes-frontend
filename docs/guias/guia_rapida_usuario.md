# Guía rápida de usuario — Sistema Almacenes
## codigoCodigoEnter · https://almacenes.codigo2enter.com

---

## Índice

1. [Acceso al sistema](#1-acceso-al-sistema)
2. [Roles y permisos](#2-roles-y-permisos)
3. [ADMIN — Guía de uso](#3-admin--guía-de-uso)
4. [MANAGER — Guía de uso](#4-manager--guía-de-uso)
5. [WAREHOUSEMAN — Guía de uso](#5-warehouseman--guía-de-uso)
6. [SALES — Guía de uso](#6-sales--guía-de-uso)
7. [Flujo completo de compra y venta](#7-flujo-completo-de-compra-y-venta)
8. [Workaround de devoluciones](#8-workaround-de-devoluciones)
9. [Solución de problemas comunes](#9-solución-de-problemas-comunes)

---

## 1. Acceso al sistema

**URL de producción:** https://almacenes.codigo2enter.com

### Iniciar sesión
1. Ir a la URL del sistema.
2. Ingresar usuario y contraseña.
3. Presionar **Iniciar sesión**.
4. El sistema redirige automáticamente a la pantalla de inicio según el rol.

### Cerrar sesión
- Clic en el chip de usuario (parte superior derecha de la pantalla).
- Seleccionar **Cerrar sesión**.
- El sistema redirige a la pantalla de login.

### Sesión expirada
- La sesión dura **2 horas**. Al expirar, el sistema muestra el mensaje:  
  *"Tu sesión ha expirado. Vuelve a iniciar sesión."*
- Volver a ingresar las credenciales para continuar.

---

## 2. Roles y permisos

| Módulo | ADMIN | MANAGER | WAREHOUSEMAN | SALES |
|---|:---:|:---:|:---:|:---:|
| Inventario — lectura (productos, categorías, stock bajo) | ✓ | ✓ | ✓ | ✓ |
| Inventario — escritura (crear/editar productos, movimientos manuales) | ✓ | ✓ | — | — |
| Compras — ver órdenes | ✓ | ✓ | ✓ | — |
| Compras — crear/aprobar órdenes | ✓ | ✓ | — | — |
| Compras — recibir mercancía | ✓ | ✓ | ✓ | — |
| Ventas — ver órdenes | ✓ | ✓ | ✓ | ✓ |
| Ventas — crear/aprobar órdenes | ✓ | ✓ | — | ✓ |
| Ventas — entregar mercancía | ✓ | ✓ | ✓ | — |
| Reportes analíticos (ejecutivo, gerencial) | ✓ | ✓ | — | — |
| Reportes operativos (todos los estados) | ✓ | ✓ | ✓ | — |
| Reportes operativos (solo pendientes) | — | — | — | ✓ |
| Gestión de usuarios | ✓ | — | — | — |

---

## 3. ADMIN — Guía de uso

El ADMIN tiene acceso a todos los módulos del sistema.

### Gestión de usuarios (`/admin/users`)
1. **Ver usuarios**: la tabla muestra todos los usuarios con nombre, usuario, rol y estado.
2. **Crear usuario**: clic en **Nuevo usuario**, completar el formulario, seleccionar rol, guardar.
3. **Editar usuario**: clic en la fila del usuario para abrir el formulario de edición.
4. **Desactivar usuario**: dentro del formulario de edición, clic en **Desactivar**.  
   ⚠️ Un usuario desactivado no puede iniciar sesión pero sus registros se conservan.
5. **Cambiar contraseña propia**: clic en el chip de usuario (esquina superior derecha) → **Cambiar contraseña**.

### Acceso completo a todos los módulos
El ADMIN puede realizar cualquier operación de los roles MANAGER, WAREHOUSEMAN y SALES descritos más abajo.

---

## 4. MANAGER — Guía de uso

### Módulo Inventario (`/inventory`)

#### Categorías (`/inventory/categories`)
- **Ver categorías**: tabla con nombre y estado.
- **Crear categoría**: clic en **Nueva categoría**, ingresar nombre, guardar.
- **Editar categoría**: clic en la fila → formulario con campos habilitados → **Guardar**.
- **Desactivar categoría**: dentro del formulario → **Desactivar**.  
  ⚠️ Solo se puede desactivar si no tiene productos activos asociados.

#### Productos (`/inventory/products`)
- **Ver productos**: tabla con código, nombre, categoría, stock disponible y precio de costo.
- **Crear producto**: clic en **Nuevo producto**, completar todos los campos obligatorios, guardar.
- **Editar producto**: clic en la fila → formulario editable.  
  ⚠️ El stock **no se edita directamente** — se gestiona mediante movimientos.
- **Registrar movimiento de stock**:
  1. Seleccionar el producto.
  2. Clic en **Registrar movimiento**.
  3. Seleccionar tipo: **ENTRADA** (aumenta stock) o **SALIDA** (disminuye stock).
  4. Ingresar cantidad y motivo. Guardar.
- **Stock bajo** (`/inventory/low-stock`): lista de productos con stock bajo el mínimo configurado.

#### Movimientos / Kardex
- Cada producto tiene su historial de movimientos accesible desde el formulario del producto.
- El Kardex muestra: fecha, tipo, cantidad, stock resultante y responsable.

### Módulo Compras (`/purchases`)

#### Proveedores (`/purchases/suppliers`)
- **Ver proveedores**: tabla con nombre, contacto y estado.
- **Crear proveedor**: clic en **Nuevo proveedor**, completar formulario, guardar.
- **Editar/desactivar proveedor**: clic en la fila → formulario.

#### Órdenes de compra (`/purchases/orders`)
- **Ver órdenes**: tabla con filtros por estado (PENDING / APPROVED / RECEIVED / CANCELLED).
- **Crear OC**:
  1. Clic en **Nueva OC**.
  2. Seleccionar proveedor.
  3. Agregar líneas (producto + cantidad + precio unitario).
  4. Guardar → la OC queda en estado **PENDING**.
- **Aprobar OC**: abrir la OC → clic en **Aprobar** → estado cambia a **APPROVED**.
- **Cancelar OC**: disponible en estado PENDING o APPROVED → clic en **Cancelar**.

### Módulo Ventas (`/sales`)

#### Clientes (`/sales/clients`)
- **Ver clientes**: tabla con nombre, documento, teléfono y estado.
- **Crear cliente**: clic en **Nuevo cliente**, completar formulario, guardar.
- **Editar/desactivar cliente**: clic en la fila → formulario.

#### Órdenes de venta (`/sales/orders`)
- **Ver órdenes**: tabla con filtros por estado (PENDING / APPROVED / DELIVERED / CANCELLED).
- **Crear OV**:
  1. Clic en **Nueva OV**.
  2. Seleccionar cliente.
  3. Agregar líneas (producto + cantidad).
  4. Guardar → la OV queda en estado **PENDING**.
  ⚠️ Si el stock disponible es insuficiente, el sistema rechaza la OV.
- **Aprobar OV**: abrir la OV → clic en **Aprobar** → estado cambia a **APPROVED**.
- **Cancelar OV**: disponible en estado PENDING o APPROVED → clic en **Cancelar**.

### Módulo Reportes (`/reports`)

#### Dashboard Ejecutivo (`/reports/executive`)
- KPIs del período: total de compras, total de ventas, margen bruto, productos con stock bajo.
- Usar los controles de fecha **Desde / Hasta** para cambiar el período analizado.
- Por defecto muestra los últimos 12 meses.

#### Dashboard Gerencial (`/reports/management`)
- Análisis de rotación de productos (clasificación ABC).
- Proveedores más activos, clientes más activos.

#### Reportes Operativos (`/reports/operational`)
- Listado de OC y OV por estado para seguimiento diario.
- Filtros: tipo (compras / ventas), estado, fecha.

---

## 5. WAREHOUSEMAN — Guía de uso

### Módulo Inventario (solo lectura)
- Puede ver productos, categorías y stock bajo pero **no puede crear ni editar**.
- Útil para consultar disponibilidad antes de atender una solicitud.

### Recibir mercancía (Módulo Compras)

**Flujo de recepción:**
1. Ir a **Compras → Órdenes de compra**.
2. Buscar la OC con estado **APPROVED**.
3. Clic en la fila para abrir el detalle.
4. Verificar físicamente que la mercancía recibida coincide con las cantidades de la OC.
5. Clic en **Marcar como recibida**.
6. El sistema cambia el estado a **RECEIVED** y aumenta el stock de cada producto automáticamente.

⚠️ Si la mercancía recibida es parcial, coordinar con el MANAGER para registrar la diferencia como movimiento manual.

### Entregar mercancía (Módulo Ventas)

**Flujo de entrega:**
1. Ir a **Ventas → Órdenes de venta**.
2. Buscar la OV con estado **APPROVED**.
3. Clic en la fila para abrir el detalle.
4. Verificar físicamente que los productos están disponibles para entregar.
5. Clic en **Marcar como entregada**.
6. El sistema cambia el estado a **DELIVERED** y descuenta el stock de cada producto.

### Reportes Operativos
- Accede a los reportes operativos para ver el estado de OC y OV del día.

---

## 6. SALES — Guía de uso

### Módulo Inventario (solo lectura)
- Puede consultar disponibilidad de productos antes de crear una OV.
- **No puede ver el precio de costo** (solo visible para ADMIN y MANAGER).

### Módulo Ventas

#### Clientes
- Puede ver y gestionar clientes (crear, editar).
- No puede desactivar clientes.

#### Crear una Orden de Venta
1. Ir a **Ventas → Órdenes de venta**.
2. Clic en **Nueva OV**.
3. Seleccionar o buscar el cliente.
4. Agregar los productos:
   - Buscar el producto por nombre o código.
   - Ingresar la cantidad deseada.
   - El sistema muestra el stock disponible en tiempo real.
5. Revisar el resumen de la OV.
6. Clic en **Guardar** → la OV queda en estado **PENDING**.

⚠️ Si el stock disponible es menor que la cantidad solicitada, el sistema rechaza la línea y muestra el error. Coordinar con el WAREHOUSEMAN o MANAGER.

#### Seguimiento de Órdenes de Venta
- Usar los filtros de estado para ver órdenes PENDING, APPROVED, DELIVERED y CANCELLED.
- La entrega física la realiza el WAREHOUSEMAN.

#### Reportes (solo pendientes)
- Accede a la vista de reportes operativos filtrada por estado PENDING.
- Útil para hacer seguimiento de OV pendientes de aprobación o entrega.

---

## 7. Flujo completo de compra y venta

### Flujo de Compra (abastecimiento del almacén)

```
MANAGER crea OC (PENDING)
    ↓
MANAGER aprueba OC (APPROVED)
    ↓
WAREHOUSEMAN recibe la mercancía físicamente
    ↓
WAREHOUSEMAN marca la OC como recibida (RECEIVED)
    ↓
El stock de los productos se incrementa automáticamente
```

**Responsables por paso:**
| Paso | Quién puede hacerlo |
|---|---|
| Crear OC | ADMIN, MANAGER |
| Aprobar OC | ADMIN, MANAGER |
| Recibir OC | ADMIN, MANAGER, WAREHOUSEMAN |

---

### Flujo de Venta (despacho desde el almacén)

```
SALES (o MANAGER) crea OV (PENDING)
    ↓
MANAGER aprueba OV (APPROVED)
    ↓
WAREHOUSEMAN prepara y entrega la mercancía físicamente
    ↓
WAREHOUSEMAN marca la OV como entregada (DELIVERED)
    ↓
El stock de los productos se decrementa automáticamente
```

**Responsables por paso:**
| Paso | Quién puede hacerlo |
|---|---|
| Crear OV | ADMIN, MANAGER, SALES |
| Aprobar OV | ADMIN, MANAGER |
| Entregar OV | ADMIN, MANAGER, WAREHOUSEMAN |

---

## 8. Workaround de devoluciones

El sistema no tiene un módulo de devoluciones en v1.0. El procedimiento acordado es el siguiente:

### Devolución de mercancía a proveedor (stock sale del almacén)
1. Ir a **Inventario → Productos**.
2. Seleccionar el producto devuelto.
3. Clic en **Registrar movimiento** → tipo **SALIDA**.
4. Ingresar la cantidad devuelta.
5. En el campo **Motivo**, escribir: `DEVOLUCIÓN A PROVEEDOR — [nombre proveedor] — [número OC]`.
6. Guardar. El stock disminuye y queda registrado en el Kardex.

### Devolución de cliente (stock vuelve al almacén)
1. Ir a **Inventario → Productos**.
2. Seleccionar el producto devuelto.
3. Clic en **Registrar movimiento** → tipo **ENTRADA**.
4. Ingresar la cantidad devuelta.
5. En el campo **Motivo**, escribir: `DEVOLUCIÓN DE CLIENTE — [nombre cliente] — [número OV]`.
6. Guardar. El stock aumenta y queda registrado en el Kardex.

⚠️ Siempre incluir la referencia a la OC u OV original en el campo **Motivo** para mantener la trazabilidad.

---

## 9. Solución de problemas comunes

| Problema | Causa probable | Solución |
|---|---|---|
| No puedo acceder a un módulo | El rol no tiene permiso | Verificar con el ADMIN qué módulos tiene disponibles |
| La sesión cerró sola | La sesión expiró (2 horas) | Volver a iniciar sesión |
| Al crear OV, dice "stock insuficiente" | No hay suficiente stock disponible | Consultar el Kardex del producto; coordinar reabastecimiento |
| No veo el botón "Aprobar" en una OC/OV | La OC/OV ya no está en estado PENDING | Verificar el estado actual en la tabla |
| Un producto aparece en stock bajo | El stock cayó por debajo del mínimo configurado | Crear una OC para reponer el producto |
| No encuentro un producto en el buscador | El nombre puede tener tilde o mayúsculas | La búsqueda es insensible a mayúsculas y tildes; probar con parte del nombre |
| El login da error "demasiados intentos" | Demasiados intentos fallidos seguidos | Esperar unos minutos y reintentar; si persiste, contactar al ADMIN |

---

*Versión 1.0 — Sistema Almacenes — codigoCodigoEnter*  
*Generado junto con el plan de salida a producción v1.0*
