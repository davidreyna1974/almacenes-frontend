import { TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ProductFormComponent } from './product-form.component';
import { ProductResponseDTO, ProductRequestDTO, SupplierOption } from '../../models/product.model';
import { CategoryDTO } from '../../models/category.model';

const mockCategories: CategoryDTO[] = [
  { id: 1, name: 'Herramientas', description: '', active: true, createdAt: '2026-01-01T00:00:00', createdByUsername: 'admin' },
];

const mockSuppliers: SupplierOption[] = [{ id: 10, name: 'Proveedor A' }];

const mockProduct: ProductResponseDTO = {
  id: 5,
  sku: 'SKU-001',
  name: 'Producto de prueba',
  description: 'Descripción',
  price: 99.99,
  unitCost: 50.00,
  currentStock: 20,
  minimumStock: 5,
  status: 'AVAILABLE',
  active: true,
  reservedStock: 2,
  availableStock: 18,
  categoryId: 1,
  categoryName: 'Herramientas',
  supplierId: 10,
  supplierName: 'Proveedor A',
  createdAt: '2026-01-01T00:00:00',
  createdByUsername: 'admin',
  updatedAt: '2026-01-02T00:00:00',
};

function setup(item: ProductResponseDTO | null = null, canDeactivate = false) {
  TestBed.configureTestingModule({
    imports: [ProductFormComponent],
    providers: [provideAnimations()],
  });
  const fixture = TestBed.createComponent(ProductFormComponent);
  fixture.componentRef.setInput('item', item);
  fixture.componentRef.setInput('categories', mockCategories);
  fixture.componentRef.setInput('suppliers', mockSuppliers);
  fixture.componentRef.setInput('canDeactivate', canDeactivate);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

describe('ProductFormComponent', () => {

  // ─── isEdit ───────────────────────────────────────────────────────────────

  describe('getter isEdit', () => {

    it('debe ser false cuando item es null (modo creación)', () => {
      const { component } = setup(null);
      expect(component.isEdit).toBe(false);
    });

    it('debe ser true cuando item tiene un producto (modo edición)', () => {
      const { component } = setup(mockProduct);
      expect(component.isEdit).toBe(true);
    });

  });

  // ─── ngOnChanges — precarga de datos ─────────────────────────────────────

  describe('ngOnChanges — precarga al editar', () => {

    it('debe inicializar el formulario con los datos del producto', () => {
      const { component } = setup(mockProduct);
      expect(component.form.get('sku')?.value).toBe('SKU-001');
      expect(component.form.get('name')?.value).toBe('Producto de prueba');
      expect(component.form.get('price')?.value).toBe(99.99);
      expect(component.form.get('unitCost')?.value).toBe(50.00);
      expect(component.form.get('minimumStock')?.value).toBe(5);
      expect(component.form.get('status')?.value).toBe('AVAILABLE');
      expect(component.form.get('categoryId')?.value).toBe(1);
      expect(component.form.get('supplierId')?.value).toBe(10);
    });

    it('debe deshabilitar currentStock en modo edición', () => {
      const { component } = setup(mockProduct);
      expect(component.form.get('currentStock')?.disabled).toBe(true);
    });

    it('debe habilitar currentStock en modo creación', () => {
      const { component } = setup(null);
      expect(component.form.get('currentStock')?.disabled).toBe(false);
    });

    it('debe inicializar con valores por defecto cuando item es null', () => {
      const { component } = setup(null);
      expect(component.form.get('sku')?.value).toBe('');
      expect(component.form.get('name')?.value).toBe('');
      expect(component.form.get('status')?.value).toBe('AVAILABLE');
      expect(component.form.get('currentStock')?.value).toBe(0);
      expect(component.form.get('minimumStock')?.value).toBe(0);
    });

  });

  // ─── Validaciones ─────────────────────────────────────────────────────────

  describe('validaciones del formulario', () => {

    it('el formulario debe ser inválido cuando sku está vacío', () => {
      const { component } = setup(null);
      component.form.patchValue({ sku: '' });
      expect(component.form.get('sku')?.hasError('required')).toBe(true);
      expect(component.form.invalid).toBe(true);
    });

    it('el formulario debe ser inválido cuando name está vacío', () => {
      const { component } = setup(null);
      component.form.patchValue({ name: '' });
      expect(component.form.get('name')?.hasError('required')).toBe(true);
    });

    it('el formulario debe ser inválido cuando price es negativo', () => {
      const { component } = setup(null);
      component.form.patchValue({ price: -1 });
      expect(component.form.get('price')?.hasError('min')).toBe(true);
    });

    it('el formulario debe ser inválido cuando minimumStock es negativo', () => {
      const { component } = setup(null);
      component.form.patchValue({ minimumStock: -1 });
      expect(component.form.get('minimumStock')?.hasError('min')).toBe(true);
    });

    it('el formulario debe ser válido con todos los campos requeridos', () => {
      const { component } = setup(null);
      component.form.patchValue({
        sku: 'SKU-NEW', name: 'Nuevo', price: 10, unitCost: 5,
        currentStock: 0, minimumStock: 0, status: 'AVAILABLE',
        categoryId: 1, supplierId: 10,
      });
      expect(component.form.valid).toBe(true);
    });

  });

  // ─── submit ───────────────────────────────────────────────────────────────

  describe('submit()', () => {

    it('debe emitir save con los datos del formulario cuando es válido', () => {
      const { component } = setup(null);
      let emittedValue: ProductRequestDTO | undefined;
      component.save.subscribe(v => (emittedValue = v));

      component.form.patchValue({
        sku: 'SKU-NEW', name: 'Nuevo', description: 'Desc', price: 10.00, unitCost: 5.00,
        currentStock: 3, minimumStock: 1, status: 'AVAILABLE', categoryId: 1, supplierId: 10,
      });
      component.submit();

      expect(emittedValue).toBeTruthy();
      expect(emittedValue?.sku).toBe('SKU-NEW');
      expect(emittedValue?.name).toBe('Nuevo');
    });

    it('no debe emitir save cuando el formulario es inválido', () => {
      const { component } = setup(null);
      let emitted = false;
      component.save.subscribe(() => (emitted = true));

      component.form.patchValue({ sku: '', name: '' });
      component.submit();

      expect(emitted).toBe(false);
    });

    it('debe marcar todos los controles como touched al intentar submit inválido', () => {
      const { component } = setup(null);
      component.submit();
      expect(component.form.get('sku')?.touched).toBe(true);
      expect(component.form.get('name')?.touched).toBe(true);
    });

    it('debe incluir currentStock deshabilitado en el valor emitido (getRawValue)', () => {
      const { component } = setup(mockProduct);
      let emittedValue: ProductRequestDTO | undefined;
      component.save.subscribe(v => (emittedValue = v));

      component.form.markAsDirty();
      component.submit();

      expect((emittedValue as any)?.currentStock).toBe(mockProduct.currentStock);
    });

  });

  // ─── Outputs cancel y deactivate ─────────────────────────────────────────

  describe('outputs cancel y deactivate', () => {

    it('debe emitir cancel al llamar cancel.emit()', () => {
      const { component } = setup(null);
      let emitted = false;
      component.cancel.subscribe(() => (emitted = true));
      component.cancel.emit();
      expect(emitted).toBe(true);
    });

    it('debe emitir deactivate al llamar deactivate.emit()', () => {
      const { component } = setup(mockProduct, true);
      let emitted = false;
      component.deactivate.subscribe(() => (emitted = true));
      component.deactivate.emit();
      expect(emitted).toBe(true);
    });

  });

  // ─── Botón Desactivar ─────────────────────────────────────────────────────

  describe('visibilidad del botón Desactivar', () => {

    it('debe mostrarse cuando canDeactivate=true e isEdit=true', () => {
      const { fixture } = setup(mockProduct, true);
      const btn: HTMLElement | null = fixture.nativeElement.querySelector('button[color="warn"]');
      expect(btn).not.toBeNull();
    });

    it('NO debe mostrarse cuando canDeactivate=false', () => {
      const { fixture } = setup(mockProduct, false);
      const btn: HTMLElement | null = fixture.nativeElement.querySelector('button[color="warn"]');
      expect(btn).toBeNull();
    });

    it('NO debe mostrarse en modo creación aunque canDeactivate=true', () => {
      const { fixture } = setup(null, true);
      const btn: HTMLElement | null = fixture.nativeElement.querySelector('button[color="warn"]');
      expect(btn).toBeNull();
    });

  });

  // ─── statusOptions ────────────────────────────────────────────────────────

  describe('statusOptions', () => {

    it('debe tener 3 opciones de estado', () => {
      const { component } = setup(null);
      expect(component.statusOptions.length).toBe(3);
    });

    it('debe incluir AVAILABLE, DISCONTINUED y OUT_OF_STOCK', () => {
      const { component } = setup(null);
      const values = component.statusOptions.map(o => o.value);
      expect(values).toContain('AVAILABLE');
      expect(values).toContain('DISCONTINUED');
      expect(values).toContain('OUT_OF_STOCK');
    });

  });

});
