# Recursos (capturas y diagramas)

Esta carpeta contiene los recursos visuales referenciados por el `README.md` y la documentación.

## Capturas pendientes de añadir

Para que el portafolio luzca completo, agrega aquí las siguientes capturas (PNG, ~1280px de ancho):

| Archivo | Pantalla a capturar | Rol sugerido |
|---|---|---|
| `login.png` | Pantalla de login (`/login`) | — |
| `inventario.png` | Lista de productos (`/inventory/products`) | admin |
| `dashboard.png` | Dashboard Ejecutivo (`/reports/executive`) | admin |
| `compras.png` | Órdenes de compra (`/purchases/orders`) | admin |
| `ventas.png` | Órdenes de venta (`/sales/orders`) | admin |
| `usuarios.png` | Gestión de usuarios (`/admin/users`) | admin |

### Cómo capturarlas
1. Levanta backend (`:8080`) y frontend (`:4200`).
2. Inicia sesión con `admin / Admin123!`.
3. Navega a cada pantalla y toma la captura (en macOS: `Cmd+Shift+4`).
4. Guarda los archivos con los nombres exactos de la tabla, en esta carpeta.

Una vez añadidas, las referencias del `README.md` (sección «Capturas») las mostrarán automáticamente.

## Diagramas

Los diagramas se mantienen como **Mermaid** dentro de la documentación (se renderizan en GitHub),
por lo que no requieren archivos de imagen. Ver
[`../arquitectura/diagrama_arquitectura.md`](../arquitectura/diagrama_arquitectura.md).
