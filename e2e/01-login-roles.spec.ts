import { test, expect } from '@playwright/test';
import { login, clearSession } from './helpers/auth';

test.describe('E2E-01: Login con cada rol → sidebar correcto', () => {

  test.afterEach(async ({ page }) => {
    await clearSession(page);
  });

  test('admin ve Inventario, Compras, Ventas, Reportes y Usuarios', async ({ page }) => {
    await login(page, 'admin');
    const nav = page.getByRole('navigation', { name: 'Navegación principal' });
    await expect(nav.getByText('Inventario')).toBeVisible();
    await expect(nav.getByText('Compras')).toBeVisible();
    await expect(nav.getByText('Ventas')).toBeVisible();
    await expect(nav.getByText('Reportes')).toBeVisible();
    await expect(nav.getByText('Usuarios')).toBeVisible();
  });

  test('manager ve Inventario, Compras, Ventas, Reportes pero NO Usuarios', async ({ page }) => {
    await login(page, 'manager');
    const nav = page.getByRole('navigation', { name: 'Navegación principal' });
    await expect(nav.getByText('Inventario')).toBeVisible();
    await expect(nav.getByText('Compras')).toBeVisible();
    await expect(nav.getByText('Ventas')).toBeVisible();
    await expect(nav.getByText('Reportes')).toBeVisible();
    await expect(nav.getByText('Usuarios')).not.toBeVisible();
  });

  test('sales ve Inventario y Ventas pero NO Compras ni Usuarios', async ({ page }) => {
    await login(page, 'sales');
    const nav = page.getByRole('navigation', { name: 'Navegación principal' });
    await expect(nav.getByText('Inventario')).toBeVisible();
    await expect(nav.getByText('Ventas')).toBeVisible();
    await expect(nav.getByText('Compras')).not.toBeVisible();
    await expect(nav.getByText('Usuarios')).not.toBeVisible();
  });

  test('warehouse ve Inventario pero NO Usuarios', async ({ page }) => {
    await login(page, 'warehouse');
    const nav = page.getByRole('navigation', { name: 'Navegación principal' });
    await expect(nav.getByText('Inventario')).toBeVisible();
    await expect(nav.getByText('Usuarios')).not.toBeVisible();
  });

  test('credenciales incorrectas → mensaje de error en pantalla de login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Usuario').fill('admin');
    await page.getByRole('textbox', { name: 'Contraseña' }).fill('wrongpassword');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page.getByRole('alert').or(page.locator('mat-snack-bar-container'))).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
