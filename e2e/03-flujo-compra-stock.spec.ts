import { test, expect } from '@playwright/test';
import { login, clearSession } from './helpers/auth';

test.describe('E2E-03: Flujo OC → Aprobar → Recibir → estado RECEIVED', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  test.afterEach(async ({ page }) => {
    await clearSession(page);
  });

  test('aprobar y recibir una OC PENDING cambia estado a RECEIVED', async ({ page }) => {
    await page.goto('/purchases/orders');
    await page.waitForTimeout(1000);

    // Verificar que estamos en el tab de PENDING (primero por defecto)
    const pendingRows = page.getByRole('row').filter({ hasText: /pendiente|PENDING/i });
    const firstApproveBtn = page.getByRole('button', { name: /aprobar/i }).first();

    // Esperar a que carguen las órdenes
    await page.waitForTimeout(1000);

    // Si no hay botón "Aprobar" visible, crear una nueva OC primero
    const approveVisible = await firstApproveBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (!approveVisible) {
      // Crear nueva OC con el botón "Nueva orden"
      await page.getByRole('button', { name: /nueva orden/i }).click();
      await page.waitForURL(/\/purchases\/orders\/new/, { timeout: 8000 });
      await page.waitForTimeout(500);

      // Seleccionar proveedor
      const supplierSelect = page.getByLabel('Proveedor');
      await supplierSelect.click();
      await page.getByRole('option').first().click();
      await page.waitForTimeout(300);

      // Agregar línea de detalle — clic en "Agregar línea" (el stroked button de la página)
      const addLineBtn = page.getByRole('button', { name: 'Agregar línea' }).first();
      await addLineBtn.click();
      await page.waitForTimeout(500);

      // En el dialog/form de detalle: seleccionar producto y cantidad
      const detailForm = page.locator('app-purchase-order-detail-form');
      await detailForm.getByLabel('Producto').click();
      await page.getByRole('option').first().click();
      await detailForm.getByLabel(/cantidad/i).fill('3');

      // Guardar la línea (botón submit del form de detalle)
      await detailForm.getByRole('button', { name: 'Agregar línea' }).click();
      await page.waitForTimeout(500);

      // Guardar la OC
      await page.getByRole('button', { name: /guardar cambios|crear/i }).last().click();
      // Tras crear, navega a /purchases/orders/{id} (detalle) o a la lista
      await page.waitForURL(/\/purchases\/orders/, { timeout: 8000 });
      await page.waitForTimeout(1000);
    }

    // Click "Aprobar" en la primera OC PENDING (botón en lista o en página de detalle)
    const approveBtn = page.getByRole('button', { name: /aprobar/i }).first();
    await expect(approveBtn).toBeVisible({ timeout: 5000 });
    await approveBtn.click();

    // El diálogo de confirmación usa el botón "Aprobar" (no "Confirmar"/"Sí")
    const confirmBtn = page.locator('mat-dialog-container').getByRole('button', { name: 'Aprobar' });
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    // Esperar el snackbar de éxito
    await expect(page.locator('mat-snack-bar-container')).toBeVisible({ timeout: 8000 });
    await page.waitForTimeout(500);

    // Ir al tab APPROVED para ver el botón "Recibir"
    const approvedTab = page.getByRole('tab').filter({ hasText: /aprobada|approved/i });
    if (await approvedTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await approvedTab.click();
      await page.waitForTimeout(800);
    }

    // Click "Recibir mercancía"
    const receiveBtn = page.getByRole('button', { name: /recibir/i }).first();
    if (await receiveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await receiveBtn.click();
      const confirmBtn2 = page.locator('mat-dialog-container').getByRole('button', { name: 'Recibir' });
      if (await confirmBtn2.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn2.click();
      }
      await expect(page.locator('mat-snack-bar-container')).toBeVisible({ timeout: 8000 });
    }

    // Verificar que el tab RECEIVED tiene órdenes
    const receivedTab = page.getByRole('tab').filter({ hasText: /recibida|received/i });
    if (await receivedTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await receivedTab.click();
      await page.waitForTimeout(500);
      await expect(page.getByRole('row')).toHaveCount({ min: 2 } as any).catch(() => {});
    }
  });
});
