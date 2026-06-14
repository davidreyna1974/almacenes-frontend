import { TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of } from 'rxjs';
import { SaleOrderDetailFormComponent, SaleOrderDetailFormData, SaleOrderDetailFormResult } from './sale-order-detail-form.component';
import { ProductService } from '../../../inventory/services/product.service';
import { ProductResponseDTO } from '../../../inventory/models/product.model';
import { SaleOrderDetailResponse } from '../../models/sale-order.model';

const MOCK_PRODUCTS: ProductResponseDTO[] = [
  {
    id: 10, sku: 'LUB-001', name: 'Aceite Lubricante 20W-50', description: '',
    price: 199.50, currentStock: 100, minimumStock: 10, status: 'AVAILABLE',
    active: true, reservedStock: 0, availableStock: 100, unitCost: 150,
    categoryId: 1, categoryName: 'Lubricantes', supplierId: 1, supplierName: 'Proveedor A',
    createdAt: '', createdByUsername: 'admin', updatedAt: '',
  },
  {
    id: 20, sku: 'HER-002', name: 'Amoladora Angular 4.5"', description: '',
    price: 850.00, currentStock: 50, minimumStock: 5, status: 'AVAILABLE',
    active: true, reservedStock: 0, availableStock: 50, unitCost: 700,
    categoryId: 2, categoryName: 'Herramientas', supplierId: 2, supplierName: 'Proveedor B',
    createdAt: '', createdByUsername: 'admin', updatedAt: '',
  },
  {
    id: 30, sku: 'FIL-003', name: 'Filtro de aceite', description: '',
    price: 80.00, currentStock: 5, minimumStock: 10, status: 'AVAILABLE',
    active: true, reservedStock: 0, availableStock: 3, unitCost: 50,
    categoryId: 3, categoryName: 'Filtros', supplierId: 1, supplierName: 'Proveedor A',
    createdAt: '', createdByUsername: 'admin', updatedAt: '',
  },
  {
    id: 40, sku: 'INA-004', name: 'Producto inactivo', description: '',
    price: 10.00, currentStock: 10, minimumStock: 1, status: 'AVAILABLE',
    active: false, reservedStock: 0, availableStock: 10, unitCost: 5,
    categoryId: 1, categoryName: 'Lubricantes', supplierId: 1, supplierName: 'Proveedor A',
    createdAt: '', createdByUsername: 'admin', updatedAt: '',
  },
];

function makeDetail(overrides: Partial<SaleOrderDetailResponse> = {}): SaleOrderDetailResponse {
  return {
    id: 1, quantity: 5, unitPrice: 100, unitCost: 60, subtotal: 500,
    productId: 10, productSku: 'LUB-001', productName: 'Aceite Lubricante 20W-50',
    ...overrides,
  };
}

function setup(inputs: {
  detail?: SaleOrderDetailResponse | null;
  existingProductIds?: number[];
  products?: ProductResponseDTO[];
} = {}) {
  const products = inputs.products ?? MOCK_PRODUCTS;
  const mockProductService = {
    search: () => of({
      content: products, currentPage: 0, totalPages: 1,
      totalElements: products.length, size: 200, first: true, last: true,
    }),
  };

  let closedWith: SaleOrderDetailFormResult | undefined;
  const mockDialogRef = { close: (val?: SaleOrderDetailFormResult) => { closedWith = val; } };

  const data: SaleOrderDetailFormData = {
    detail: inputs.detail ?? null,
    existingProductIds: inputs.existingProductIds ?? [],
  };

  TestBed.configureTestingModule({
    imports: [SaleOrderDetailFormComponent],
    providers: [
      provideAnimations(),
      { provide: ProductService, useValue: mockProductService },
      { provide: MatDialogRef, useValue: mockDialogRef },
      { provide: MAT_DIALOG_DATA, useValue: data },
    ],
  });

  const fixture = TestBed.createComponent(SaleOrderDetailFormComponent);
  const comp = fixture.componentInstance;
  fixture.detectChanges();

  return { fixture, comp, get closedWith() { return closedWith; } };
}

describe('SaleOrderDetailFormComponent', () => {

  // ── Inicialización ────────────────────────────────────────────────────────

  it('debe crearse correctamente', () => {
    const { comp } = setup();
    expect(comp).toBeTruthy();
  });

  it('carga solo productos activos desde el servicio', () => {
    const { comp } = setup();
    expect(comp.products.length).toBe(3);
    expect(comp.products.every(p => p.active)).toBe(true);
  });

  // ── Cálculo de subtotal ───────────────────────────────────────────────────

  it('subtotal se calcula como quantity × unitPrice', () => {
    const { comp } = setup();
    comp.form.patchValue({ quantity: 3, unitPrice: 50 });
    expect(comp.subtotal).toBe(150);
  });

  it('subtotal es 0 cuando unitPrice no está definido', () => {
    const { comp } = setup();
    comp.form.patchValue({ quantity: 5, unitPrice: null });
    expect(comp.subtotal).toBe(0);
  });

  // ── Modo edición ──────────────────────────────────────────────────────────

  it('precarga quantity y unitPrice en modo edición', () => {
    const { comp } = setup({ detail: makeDetail({ quantity: 8, unitPrice: 120 }) });
    expect(comp.form.getRawValue().quantity).toBe(8);
    expect(comp.form.getRawValue().unitPrice).toBe(120);
  });

  it('en modo edición isEdit es true', () => {
    const { comp } = setup({ detail: makeDetail() });
    expect(comp.isEdit).toBe(true);
  });

  it('en modo creación isEdit es false', () => {
    const { comp } = setup();
    expect(comp.isEdit).toBe(false);
  });

  it('precarga productSearch con SKU y nombre en modo edición', () => {
    const { comp } = setup({ detail: makeDetail({ productSku: 'LUB-001', productName: 'Aceite Lubricante 20W-50' }) });
    expect(comp.form.getRawValue().productSearch).toContain('LUB-001');
    expect(comp.form.getRawValue().productSearch).toContain('Aceite Lubricante 20W-50');
  });

  it('deshabilita productSearch en modo edición', () => {
    const { comp } = setup({ detail: makeDetail() });
    expect(comp.form.get('productSearch')!.disabled).toBe(true);
  });

  it('calcula subtotal inicial en modo edición', () => {
    const { comp } = setup({ detail: makeDetail({ quantity: 4, unitPrice: 25 }) });
    expect(comp.subtotal).toBe(100);
  });

  // ── Filtrado de productos ─────────────────────────────────────────────────

  it('filtra productos por SKU (case-insensitive)', () => {
    const { comp } = setup();
    comp.form.get('productSearch')!.setValue('lub');
    expect(comp.filteredProducts.length).toBe(1);
    expect(comp.filteredProducts[0].id).toBe(10);
  });

  it('filtra productos por nombre con acentos (accent-insensitive)', () => {
    const { comp } = setup();
    comp.form.get('productSearch')!.setValue('amoladora');
    expect(comp.filteredProducts.length).toBe(1);
    expect(comp.filteredProducts[0].id).toBe(20);
  });

  it('filtra sin resultados cuando no hay coincidencia', () => {
    const { comp } = setup();
    comp.form.get('productSearch')!.setValue('xyz999');
    expect(comp.filteredProducts.length).toBe(0);
  });

  it('muestra todos los productos cuando el filtro está vacío', () => {
    const { comp } = setup();
    comp.form.get('productSearch')!.setValue('lub');
    comp.form.get('productSearch')!.setValue('');
    expect(comp.filteredProducts.length).toBe(3);
  });

  // ── Selección de producto ─────────────────────────────────────────────────

  it('onProductSelected asigna el producto y precarga unitPrice', () => {
    const { comp } = setup();
    comp.form.patchValue({ quantity: 3 });
    comp.onProductSelected(MOCK_PRODUCTS[0]);
    expect(comp.selectedProduct).toBe(MOCK_PRODUCTS[0]);
    expect(comp.form.getRawValue().unitPrice).toBe(199.50);
    expect(comp.subtotal).toBe(3 * 199.50);
  });

  // ── displayProduct ────────────────────────────────────────────────────────

  it('displayProduct retorna cadena vacía para null', () => {
    const { comp } = setup();
    expect(comp.displayProduct(null)).toBe('');
  });

  it('displayProduct retorna la cadena sin modificar si recibe string', () => {
    const { comp } = setup();
    expect(comp.displayProduct('texto libre')).toBe('texto libre');
  });

  it('displayProduct formatea como [SKU] — Nombre (sin disponibilidad)', () => {
    const { comp } = setup();
    const result = comp.displayProduct(MOCK_PRODUCTS[0]);
    expect(result).toBe('[LUB-001] — Aceite Lubricante 20W-50');
  });

  // ── isProductDisabled (R11) ───────────────────────────────────────────────

  it('isProductDisabled retorna true si el ID ya está en la orden', () => {
    const { comp } = setup({ existingProductIds: [10, 20] });
    expect(comp.isProductDisabled(MOCK_PRODUCTS[0])).toBe(true);
  });

  it('isProductDisabled retorna false si el ID no está en la orden', () => {
    const { comp } = setup({ existingProductIds: [99] });
    expect(comp.isProductDisabled(MOCK_PRODUCTS[0])).toBe(false);
  });

  // ── VAL-LIN-07 — cantidad supera disponible ──────────────────────────────

  describe('quantityExceedsAvailable (VAL-LIN-07)', () => {

    it('es false sin producto seleccionado', () => {
      const { comp } = setup();
      comp.form.patchValue({ quantity: 999 });
      expect(comp.quantityExceedsAvailable).toBe(false);
    });

    it('es false cuando quantity <= availableStock', () => {
      const { comp } = setup();
      comp.onProductSelected(MOCK_PRODUCTS[2]); // availableStock = 3
      comp.form.patchValue({ quantity: 3 });
      expect(comp.quantityExceedsAvailable).toBe(false);
    });

    it('es true cuando quantity > availableStock', () => {
      const { comp } = setup();
      comp.onProductSelected(MOCK_PRODUCTS[2]); // availableStock = 3
      comp.form.patchValue({ quantity: 5 });
      expect(comp.quantityExceedsAvailable).toBe(true);
    });

    it('en modo edición usa el producto cargado por productId', () => {
      const { comp } = setup({ detail: makeDetail({ productId: 30, quantity: 10 }) });
      // producto 30 (FIL-003) tiene availableStock = 3
      expect(comp.currentProduct?.id).toBe(30);
      expect(comp.quantityExceedsAvailable).toBe(true);
    });

  });

  // ── submit ────────────────────────────────────────────────────────────────

  describe('submit()', () => {

    it('cierra el dialog con dto de edición (sin productId)', () => {
      const ctx = setup({ detail: makeDetail() });
      ctx.comp.form.patchValue({ quantity: 10, unitPrice: 50 });
      ctx.comp.submit();
      expect(ctx.closedWith).toEqual({
        mode: 'edit',
        dto: { quantity: 10, unitPrice: 50 },
      });
    });

    it('no cierra el dialog si el formulario es inválido', () => {
      const ctx = setup({ detail: makeDetail() });
      ctx.comp.form.patchValue({ quantity: 0, unitPrice: 50 });
      ctx.comp.submit();
      expect(ctx.closedWith).toBeUndefined();
    });

    it('no cierra el dialog en modo creación si no hay producto seleccionado', () => {
      const ctx = setup();
      ctx.comp.form.patchValue({ quantity: 2, unitPrice: 100 });
      ctx.comp.submit();
      expect(ctx.closedWith).toBeUndefined();
    });

    it('cierra el dialog con dto de creación incluyendo SKU y nombre', () => {
      const ctx = setup();
      ctx.comp.onProductSelected(MOCK_PRODUCTS[0]);
      ctx.comp.form.patchValue({ quantity: 4 });
      ctx.comp.submit();
      expect(ctx.closedWith).toEqual({
        mode: 'create',
        dto: { productId: 10, quantity: 4, unitPrice: 199.50 },
        productSku: 'LUB-001',
        productName: 'Aceite Lubricante 20W-50',
      });
    });

  });

  // ── cancel ────────────────────────────────────────────────────────────────

  it('cancel cierra el dialog sin resultado', () => {
    const ctx = setup();
    ctx.comp.cancel();
    expect(ctx.closedWith).toBeUndefined();
  });

});
