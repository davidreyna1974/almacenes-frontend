import { TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { MovementDialogComponent, MovementDialogData } from './movement-dialog.component';
import { ProductService } from '../../services/product.service';
import { ProductResponseDTO } from '../../models/product.model';

const mockProduct: ProductResponseDTO = {
  id: 1,
  sku: 'SKU-001',
  name: 'Producto prueba',
  description: '',
  price: 50,
  unitCost: 25,
  currentStock: 30,
  minimumStock: 5,
  status: 'AVAILABLE',
  active: true,
  reservedStock: 5,
  availableStock: 25,
  categoryId: 1,
  categoryName: 'Herramientas',
  supplierId: 1,
  supplierName: 'Proveedor A',
  createdAt: '2026-01-01T00:00:00',
  createdByUsername: 'admin',
  updatedAt: '',
};

function setup(productOverride?: Partial<ProductResponseDTO>) {
  const product = productOverride ? { ...mockProduct, ...productOverride } : mockProduct;

  let registerMovementCalled = false;
  let registerMovementArg: any = null;
  let registerMovementSubject = new Subject<void>();

  const mockProductService = {
    registerMovement: (arg: any) => {
      registerMovementCalled = true;
      registerMovementArg = arg;
      return registerMovementSubject.asObservable();
    },
  };

  let closedWith: any = undefined;
  const mockDialogRef = { close: (val?: any) => { closedWith = val; } };

  let snackBarArgs: any[] = [];
  const mockSnackBar = { open: (...args: any[]) => { snackBarArgs = args; } };

  TestBed.configureTestingModule({
    imports: [MovementDialogComponent],
    providers: [
      provideAnimations(),
      { provide: ProductService, useValue: mockProductService },
      { provide: MatDialogRef, useValue: mockDialogRef },
      { provide: MAT_DIALOG_DATA, useValue: { product } as MovementDialogData },
      { provide: MatSnackBar, useValue: mockSnackBar },
    ],
  });

  const fixture = TestBed.createComponent(MovementDialogComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  return {
    fixture, component,
    mockProductService,
    registerMovementSubject,
    get registerMovementCalled() { return registerMovementCalled; },
    get registerMovementArg() { return registerMovementArg; },
    get closedWith() { return closedWith; },
    get snackBarArgs() { return snackBarArgs; },
  };
}

describe('MovementDialogComponent', () => {

  // ─── availableStock ───────────────────────────────────────────────────────

  describe('getter availableStock', () => {

    it('debe calcular stock disponible como currentStock - reservedStock', () => {
      const { component } = setup();
      expect(component.availableStock).toBe(25); // 30 - 5
    });

    it('debe tratar reservedStock=undefined como 0', () => {
      const { component } = setup({ reservedStock: undefined as unknown as number });
      expect(component.availableStock).toBe(30); // 30 - 0
    });

    it('debe retornar currentStock cuando reservedStock es 0', () => {
      const { component } = setup({ reservedStock: 0 });
      expect(component.availableStock).toBe(30);
    });

  });

  // ─── Validadores según tipo ───────────────────────────────────────────────

  describe('updateQuantityValidators según tipo de movimiento', () => {

    it('OUT agrega validación max con availableStock', () => {
      const { component } = setup();
      component.form.get('type')!.setValue('OUT');
      component.form.get('quantity')!.setValue(999);
      component.form.get('quantity')!.updateValueAndValidity();
      expect(component.form.get('quantity')!.hasError('max')).toBe(true);
    });

    it('IN no tiene validación max', () => {
      const { component } = setup();
      component.form.get('type')!.setValue('IN');
      component.form.get('quantity')!.setValue(999);
      component.form.get('quantity')!.updateValueAndValidity();
      expect(component.form.get('quantity')!.hasError('max')).toBe(false);
    });

    it('OUT acepta cantidad igual al stock disponible (no hasError max)', () => {
      const { component } = setup();
      component.form.get('type')!.setValue('OUT');
      component.form.get('quantity')!.setValue(25); // exactamente availableStock
      component.form.get('quantity')!.updateValueAndValidity();
      expect(component.form.get('quantity')!.hasError('max')).toBe(false);
    });

    it('OUT rechaza cantidad mayor al stock disponible (hasError max)', () => {
      const { component } = setup();
      component.form.get('type')!.setValue('OUT');
      component.form.get('quantity')!.setValue(26); // > 25 disponible
      component.form.get('quantity')!.updateValueAndValidity();
      expect(component.form.get('quantity')!.hasError('max')).toBe(true);
    });

  });

  // ─── Validaciones de formulario ───────────────────────────────────────────

  describe('validaciones del formulario', () => {

    it('formulario inválido cuando quantity es null', () => {
      const { component } = setup();
      component.form.patchValue({ quantity: null, reason: 'Motivo' });
      expect(component.form.invalid).toBe(true);
    });

    it('formulario inválido cuando quantity es 0 (hasError min)', () => {
      const { component } = setup();
      component.form.patchValue({ quantity: 0 });
      expect(component.form.get('quantity')!.hasError('min')).toBe(true);
    });

    it('formulario inválido cuando reason está vacío', () => {
      const { component } = setup();
      component.form.patchValue({ quantity: 5, reason: '' });
      expect(component.form.get('reason')!.hasError('required')).toBe(true);
    });

    it('reason con más de 300 caracteres tiene error maxlength', () => {
      const { component } = setup();
      component.form.patchValue({ reason: 'a'.repeat(301) });
      expect(component.form.get('reason')!.hasError('maxlength')).toBe(true);
    });

    it('formulario válido con tipo IN, cantidad 1 y motivo corto', () => {
      const { component } = setup();
      component.form.patchValue({ type: 'IN', quantity: 1, reason: 'Compra' });
      expect(component.form.valid).toBe(true);
    });

  });

  // ─── submit() — formulario inválido ──────────────────────────────────────

  describe('submit() con formulario inválido', () => {

    it('no debe llamar registerMovement si el formulario es inválido', () => {
      const ctx = setup();
      ctx.component.form.patchValue({ quantity: null, reason: '' });
      ctx.component.submit();
      expect(ctx.registerMovementCalled).toBe(false);
    });

    it('debe marcar todos los controles como touched al submit inválido', () => {
      const { component } = setup();
      component.form.patchValue({ quantity: null, reason: '' });
      component.submit();
      expect(component.form.get('quantity')!.touched).toBe(true);
      expect(component.form.get('reason')!.touched).toBe(true);
    });

  });

  // ─── submit() — éxito ────────────────────────────────────────────────────

  describe('submit() con formulario válido — éxito', () => {

    it('debe llamar registerMovement con los datos correctos', () => {
      const ctx = setup();
      ctx.component.form.patchValue({ type: 'IN', quantity: 5, reason: 'Reposición' });
      ctx.component.submit();
      ctx.registerMovementSubject.next();
      ctx.registerMovementSubject.complete();

      expect(ctx.registerMovementCalled).toBe(true);
      expect(ctx.registerMovementArg).toEqual({
        productId: 1,
        type: 'IN',
        quantity: 5,
        reason: 'Reposición',
      });
    });

    it('debe cerrar el dialog con true tras éxito', () => {
      const ctx = setup();
      ctx.component.form.patchValue({ type: 'IN', quantity: 5, reason: 'Reposición' });
      ctx.component.submit();
      ctx.registerMovementSubject.next();
      ctx.registerMovementSubject.complete();

      expect(ctx.closedWith).toBe(true);
    });

    it('debe mostrar snackbar de éxito con mensaje correcto', () => {
      const ctx = setup();
      ctx.component.form.patchValue({ type: 'IN', quantity: 5, reason: 'Reposición' });
      ctx.component.submit();
      ctx.registerMovementSubject.next();
      ctx.registerMovementSubject.complete();

      expect(ctx.snackBarArgs[0]).toBe('Movimiento registrado correctamente.');
    });

    it('saving debe ser false después del éxito', () => {
      const ctx = setup();
      ctx.component.form.patchValue({ type: 'IN', quantity: 5, reason: 'Reposición' });
      ctx.component.submit();
      expect(ctx.component.saving).toBe(true); // debe estar en true durante la petición
      ctx.registerMovementSubject.next();
      ctx.registerMovementSubject.complete();
      expect(ctx.component.saving).toBe(false);
    });

  });

  // ─── submit() — error del backend ────────────────────────────────────────

  describe('submit() con error del backend', () => {

    it('debe asignar errorMessage con el mensaje del backend', () => {
      const ctx = setup();
      ctx.component.form.patchValue({ type: 'OUT', quantity: 1, reason: 'Error prueba' });
      ctx.component.submit();
      ctx.registerMovementSubject.error({ error: { message: 'Stock insuficiente' } });

      expect(ctx.component.errorMessage).toBe('Stock insuficiente');
    });

    it('debe usar mensaje genérico cuando error no tiene body', () => {
      const ctx = setup();
      ctx.component.form.patchValue({ type: 'OUT', quantity: 1, reason: 'Error prueba' });
      ctx.component.submit();
      ctx.registerMovementSubject.error({});

      expect(ctx.component.errorMessage).toBe('Error al registrar el movimiento.');
    });

    it('saving debe ser false después del error', () => {
      const ctx = setup();
      ctx.component.form.patchValue({ type: 'OUT', quantity: 1, reason: 'Error prueba' });
      ctx.component.submit();
      ctx.registerMovementSubject.error({ error: { message: 'Error' } });

      expect(ctx.component.saving).toBe(false);
    });

    it('no debe cerrar el dialog cuando ocurre un error', () => {
      const ctx = setup();
      ctx.component.form.patchValue({ type: 'OUT', quantity: 1, reason: 'Error prueba' });
      ctx.component.submit();
      ctx.registerMovementSubject.error({ error: { message: 'Error' } });

      expect(ctx.closedWith).toBeUndefined();
    });

  });

  // ─── errorMessage reset al nuevo submit ──────────────────────────────────

  describe('errorMessage se limpia en cada submit', () => {

    it('debe ser null al inicio de un submit válido (antes de recibir respuesta)', () => {
      const ctx = setup();
      ctx.component.errorMessage = 'Error previo';
      ctx.component.form.patchValue({ type: 'IN', quantity: 5, reason: 'Corrección' });
      ctx.component.submit();
      expect(ctx.component.errorMessage).toBeNull();
    });

  });

});
