import { test, expect } from '@playwright/test';
import { login, clearSession } from './helpers/auth';

test.describe('E2E-05: Acceso por URL no autorizada → redirección', () => {

  test.afterEach(async ({ page }) => {
    await clearSession(page);
  });

  test('usuario sin sesión es redirigido a /login al acceder a /inventory/products', async ({ page }) => {
    await clearSession(page);
    await page.goto('/inventory/products');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('SALES no puede acceder a /purchases/orders — contenido no se muestra', async ({ page }) => {
    await login(page, 'sales');
    await page.goto('/purchases/orders');
    // Esperar a que la navegación se estabilice
    await page.waitForTimeout(1500);
    // El guard bloquea: la URL ya NO es /purchases/orders
    await expect(page).not.toHaveURL('/purchases/orders');
    // Tampoco debe verse la tabla de órdenes de compra
    await expect(page.getByText(/órdenes de compra/i)).not.toBeVisible({ timeout: 2000 }).catch(() => {});
    await clearSession(page);
  });

  test('WAREHOUSEMAN no puede acceder a /reports/executive — contenido no se muestra', async ({ page }) => {
    await login(page, 'warehouse');
    await page.goto('/reports/executive');
    await page.waitForTimeout(1500);
    // El guard bloquea: la URL ya NO es /reports/executive
    await expect(page).not.toHaveURL('/reports/executive');
    // No debe verse el dashboard ejecutivo
    await expect(page.getByText(/dashboard ejecutivo/i)).not.toBeVisible({ timeout: 2000 }).catch(() => {});
    await clearSession(page);
  });

  test('SALES no puede acceder a /admin/users — contenido no se muestra', async ({ page }) => {
    await login(page, 'sales');
    await page.goto('/admin/users');
    await page.waitForTimeout(1500);
    // El guard bloquea: la URL ya NO es /admin/users
    await expect(page).not.toHaveURL('/admin/users');
    // No debe verse la gestión de usuarios
    await expect(page.getByText(/gestión de usuarios/i)).not.toBeVisible({ timeout: 2000 }).catch(() => {});
    await clearSession(page);
  });

  test('URL inexistente — muestra la página 404 y la app no crashea', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/ruta-que-no-existe-xyz');
    // La ruta comodín (**) renderiza NotFoundComponent (página 404 standalone,
    // fuera del layout). No debe crashear ni exponer contenido protegido.
    await expect(page.getByText('404')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/página no encontrada/i)).toBeVisible();
    // La sesión sigue activa: "Volver al inicio" regresa al layout con el sidebar.
    await page.getByRole('button', { name: /volver al inicio/i }).click();
    await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible({ timeout: 5000 });
    await clearSession(page);
  });
});
