import { test, expect } from '@playwright/test';
import { login, clearSession } from './helpers/auth';
import { testName } from './helpers/api';

test.describe('E2E-02: Crear producto → aparece en lista', () => {

  let productName: string;

  test.beforeEach(async ({ page }) => {
    productName = testName('Producto');
    await login(page, 'admin');
  });

  test.afterEach(async ({ page }) => {
    await clearSession(page);
  });

  test('crear producto con datos válidos aparece en la tabla', async ({ page }) => {
    await page.goto('/inventory/products');
    await page.waitForTimeout(1000);

    // Abrir formulario de nuevo producto
    await page.getByRole('button', { name: /nuevo producto/i }).click();

    // Esperar a que aparezca el formulario de producto (panel detalle)
    await page.waitForTimeout(800);

    // Usar los inputs por formControlName a través de sus labels específicos dentro del formulario
    const form = page.locator('app-product-form').first();
    await expect(form).toBeVisible({ timeout: 5000 });

    await form.getByLabel('SKU').fill(`SKU-${Date.now()}`);
    await form.getByRole('textbox', { name: 'Nombre', exact: true }).fill(productName);
    await form.getByLabel('Precio').fill('10.00');
    await form.getByLabel(/costo unitario/i).fill('5.00');
    await form.getByLabel(/stock/i).first().fill('5');
    await form.getByLabel(/mínimo/i).fill('1');

    // Seleccionar categoría (primera disponible)
    await form.getByLabel('Categoría').click();
    await page.getByRole('option').first().click();

    // Seleccionar proveedor (primero disponible)
    await form.getByLabel('Proveedor').click();
    await page.getByRole('option').first().click();

    // Guardar
    await form.getByRole('button', { name: /crear producto/i }).click();

    // Confirmar snackbar de éxito
    await expect(page.locator('mat-snack-bar-container')).toBeVisible({ timeout: 8000 });

    // Buscar el producto en la tabla
    await page.getByLabel(/buscar/i).fill(productName);
    await page.waitForTimeout(600);
    await expect(page.getByRole('row').filter({ hasText: productName })).toBeVisible({ timeout: 8000 });
  });
});
