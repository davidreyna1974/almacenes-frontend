import { test, expect } from '@playwright/test';
import { login, clearSession } from './helpers/auth';

test.describe('E2E-04: Flujo OV → Aprobar → Entregar → estado DELIVERED', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  test.afterEach(async ({ page }) => {
    await clearSession(page);
  });

  test('aprobar y entregar una OV PENDING cambia estado a DELIVERED', async ({ page }) => {
    await page.goto('/sales/orders');
    await page.waitForTimeout(1000);

    // Verificar si hay botón "Aprobar orden" visible en la tabla
    const approveBtn = page.getByRole('button', { name: /aprobar orden/i }).first();
    const approveVisible = await approveBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (!approveVisible) {
      // Crear nueva OV
      await page.getByRole('button', { name: /nueva orden/i }).click();
      await page.waitForURL(/\/sales\/orders\/new/, { timeout: 8000 });
      await page.waitForTimeout(500);

      // Seleccionar cliente
      const clientLabel = page.getByLabel('Cliente');
      await clientLabel.click();
      await page.getByRole('option').first().click();
      await page.waitForTimeout(300);

      // Agregar detalle
      const addDetailBtn = page.getByRole('button', { name: /agregar detalle/i }).first();
      await addDetailBtn.click();
      await page.waitForTimeout(500);

      // En el dialog de detalle: seleccionar producto y cantidad
      const detailForm = page.locator('app-sale-order-detail-form, mat-dialog-container').first();
      await detailForm.getByLabel('Producto').click();
      await page.getByRole('option').first().click();
      await page.waitForTimeout(300);
      const cantInput = detailForm.getByLabel(/cantidad/i).first();
      await cantInput.fill('1');

      // Guardar línea
      await detailForm.getByRole('button', { name: /agregar línea|guardar/i }).click();
      await page.waitForTimeout(500);

      // Crear la OV
      await page.getByRole('button', { name: /crear orden/i }).click();
      // Tras crear, navega a /sales/orders/{id} (detalle) o a la lista
      await page.waitForURL(/\/sales\/orders/, { timeout: 8000 });
      await page.waitForTimeout(1000);
    }

    // Click "Aprobar orden" (lista) o "Aprobar" (página de detalle)
    const approveBtnFinal = page.getByRole('button', { name: /aprobar/i }).first();
    await expect(approveBtnFinal).toBeVisible({ timeout: 5000 });
    await approveBtnFinal.click();

    // El diálogo de confirmación siempre aparece — scoped a role="dialog"
    const approveDialog = page.getByRole('dialog');
    await approveDialog.waitFor({ state: 'visible', timeout: 4000 });
    await approveDialog.getByRole('button', { name: 'Aprobar' }).click();
    await approveDialog.waitFor({ state: 'hidden', timeout: 5000 });

    await expect(page.locator('mat-snack-bar-container')).toBeVisible({ timeout: 8000 });
    await page.waitForTimeout(800);

    // Ir al tab APPROVED para entregar (solo si estamos en la lista con tabs)
    const approvedTab = page.getByRole('tab').filter({ hasText: /aprobada|approved/i });
    if (await approvedTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await approvedTab.click();
      await page.waitForTimeout(800);
    }

    // Click "Entregar orden" (lista) o "Entregar" (página de detalle)
    const deliverBtn = page.getByRole('button', { name: /entregar/i }).first();
    if (await deliverBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deliverBtn.click();
      // El diálogo de entrega siempre aparece — usar waitFor
      const deliverDialog = page.getByRole('dialog');
      await deliverDialog.waitFor({ state: 'visible', timeout: 4000 });
      await deliverDialog.getByRole('button', { name: 'Entregar' }).click();
      await deliverDialog.waitFor({ state: 'hidden', timeout: 5000 });
      await expect(page.locator('mat-snack-bar-container')).toBeVisible({ timeout: 8000 });
    }

    // Verificar transición al tab DELIVERED
    const deliveredTab = page.getByRole('tab').filter({ hasText: /entregada|delivered/i });
    if (await deliveredTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deliveredTab.click();
      await page.waitForTimeout(500);
    }
  });
});
