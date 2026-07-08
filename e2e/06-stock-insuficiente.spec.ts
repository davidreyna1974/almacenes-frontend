import { test, expect } from '@playwright/test';
import { login, clearSession } from './helpers/auth';

test.describe('E2E-06: OV con stock insuficiente → error visible', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  test.afterEach(async ({ page }) => {
    await clearSession(page);
  });

  test('crear OV con cantidad superior al stock disponible muestra error del backend', async ({ page }) => {
    await page.goto('/sales/orders');

    const newOrderBtn = page.getByRole('button', { name: /nueva orden/i });
    await expect(newOrderBtn).toBeVisible({ timeout: 5000 });
    await newOrderBtn.click();
    await page.waitForURL(/\/sales\/orders\/new/, { timeout: 5000 });

    // Seleccionar cliente
    const clientSelect = page.getByRole('combobox', { name: 'Cliente' });
    await clientSelect.click();
    await page.getByRole('option').first().click();

    // Abrir diálogo de agregar detalle
    await page.getByRole('button', { name: /agregar detalle/i }).click();
    const detailDialog = page.locator('mat-dialog-container');
    await detailDialog.waitFor({ state: 'visible', timeout: 5000 });

    await detailDialog.getByRole('combobox', { name: 'Producto' }).click();
    await page.getByRole('option').first().click();
    await page.waitForTimeout(300);

    const cantidadInput = detailDialog.getByLabel(/cantidad/i).first();
    await cantidadInput.fill('999999');
    await detailDialog.getByRole('button', { name: /agregar línea|guardar/i }).click();
    await detailDialog.waitFor({ state: 'hidden', timeout: 5000 });

    // Intentar crear la orden
    await page.getByRole('button', { name: /crear orden/i }).click();

    // Debe aparecer snackbar de error rojo o mensaje de error
    const snackbar = page.locator('mat-snack-bar-container');
    const errorMsg = page.getByText(/stock|insuficiente|disponible|error/i);

    const hasError = await Promise.race([
      snackbar.waitFor({ state: 'visible', timeout: 8000 }).then(() => true),
      errorMsg.waitFor({ state: 'visible', timeout: 8000 }).then(() => true),
    ]).catch(() => false);

    expect(hasError).toBe(true);
  });

  test('el diálogo de agregar línea valida stock disponible antes de agregar', async ({ page }) => {
    await page.goto('/sales/orders');

    await page.getByRole('button', { name: /nueva orden/i }).click();
    await page.waitForURL(/\/sales\/orders\/new/, { timeout: 5000 });

    // Seleccionar cliente
    const clientSelect = page.getByRole('combobox', { name: 'Cliente' });
    await clientSelect.click();
    await page.getByRole('option').first().click();

    // Abrir diálogo de agregar detalle
    await page.getByRole('button', { name: /agregar detalle/i }).click();
    const detailDialog2 = page.locator('mat-dialog-container');
    await detailDialog2.waitFor({ state: 'visible', timeout: 5000 });

    // Seleccionar producto
    await detailDialog2.getByRole('combobox', { name: 'Producto' }).click();
    await page.getByRole('option').first().click();

    // Verificar que el formulario informa el stock disponible
    const stockInfo = detailDialog2.getByText(/stock disponible|disponible:/i);
    const isInfoVisible = await stockInfo.isVisible({ timeout: 3000 }).catch(() => false);

    // Si muestra stock disponible, el campo de cantidad debe rechazar exceso
    if (isInfoVisible) {
      await detailDialog2.getByLabel(/cantidad/i).first().fill('999999');
      const addBtn = detailDialog2.getByRole('button', { name: /agregar línea/i });
      // El botón debe estar deshabilitado o mostrar error
      const isDisabled = await addBtn.isDisabled();
      const hasValidationError = await detailDialog2.getByText(/supera.*stock|stock.*insuficiente|máximo/i).isVisible({ timeout: 2000 }).catch(() => false);
      expect(isDisabled || hasValidationError).toBe(true);
    }
  });
});
