import { TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { PurchaseOrderDetailFormComponent } from './purchase-order-detail-form.component';
import { ProductService } from '../../../inventory/services/product.service';
import { ProductResponseDTO } from '../../../inventory/models/product.model';
import { PurchaseOrderDetailResponse } from '../../models/purchase-order.model';

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
];

function makeDetail(overrides: Partial<PurchaseOrderDetailResponse> = {}): PurchaseOrderDetailResponse {
  return {
    id: 1, quantity: 5, unitPrice: 100, subtotal: 500,
    productId: 1, productSku: 'T001', productName: 'Tornillo M8',
    ...overrides,
  };
}

function setup(inputs: {
  detail?: PurchaseOrderDetailResponse | null;
  existingIds?: number[];
  products?: ProductResponseDTO[];
} = {}) {
  const products = inputs.products ?? [];
  const mockProductService = {
    search: () => of({
      content: products, currentPage: 0, totalPages: 1,
      totalElements: products.length, size: 200, first: true, last: true,
    }),
  };
  TestBed.configureTestingModule({
    imports: [PurchaseOrderDetailFormComponent],
    providers: [
      provideAnimations(),
      { provide: ProductService, useValue: mockProductService },
    ],
  });
  const fixture = TestBed.createComponent(PurchaseOrderDetailFormComponent);
  const comp = fixture.componentInstance;
  if (inputs.detail      !== undefined) fixture.componentRef.setInput('detail',             inputs.detail);
  if (inputs.existingIds !== undefined) fixture.componentRef.setInput('existingProductIds', inputs.existingIds);
  fixture.detectChanges();
  return { fixture, comp };
}

describe('PurchaseOrderDetailFormComponent', () => {

  // ── Inicialización ────────────────────────────────────────────────────────

  it('debe crearse correctamente', () => {
    const { comp } = setup();
    expect(comp).toBeTruthy();
  });

  it('carga los productos desde el servicio al iniciar', () => {
    const { comp } = setup({ products: MOCK_PRODUCTS });
    expect(comp.products.length).toBe(2);
    expect(comp.filteredProducts.length).toBe(2);
  });

  // ── Cálculo de subtotal ───────────────────────────────────────────────────

  it('subtotal se calcula como quantity × unitPrice', () => {
    const { comp } = setup();
    comp.form.patchValue({ quantity: 3, unitPrice: 50 });
    expect(comp.subtotal).toBe(150);
  });

  it('subtotal se actualiza al cambiar quantity', () => {
    const { comp } = setup();
    comp.form.patchValue({ quantity: 5, unitPrice: 20 });
    expect(comp.subtotal).toBe(100);
    comp.form.patchValue({ quantity: 10 });
    expect(comp.subtotal).toBe(200);
  });

  it('subtotal es 0 cuando unitPrice no está definido', () => {
    const { comp } = setup();
    comp.form.patchValue({ quantity: 5, unitPrice: null });
    expect(comp.subtotal).toBe(0);
  });

  // ── Modo edición ──────────────────────────────────────────────────────────

  it('precarga quantity y unitPrice en modo edición', () => {
    const { comp } = setup({ detail: makeDetail({ quantity: 8, unitPrice: 75 }) });
    expect(comp.form.getRawValue().quantity).toBe(8);
    expect(comp.form.getRawValue().unitPrice).toBe(75);
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
    const { comp } = setup({ detail: makeDetail({ productSku: 'T001', productName: 'Tornillo M8' }) });
    expect(comp.form.getRawValue().productSearch).toContain('T001');
    expect(comp.form.getRawValue().productSearch).toContain('Tornillo M8');
  });

  it('deshabilita productSearch en modo edición', () => {
    const { comp } = setup({ detail: makeDetail() });
    expect(comp.form.get('productSearch')!.disabled).toBe(true);
  });

  // ── Filtrado de productos ─────────────────────────────────────────────────

  it('filtra productos por SKU (case-insensitive)', () => {
    const { comp } = setup({ products: MOCK_PRODUCTS });
    comp.form.get('productSearch')!.setValue('lub');
    expect(comp.filteredProducts.length).toBe(1);
    expect(comp.filteredProducts[0].id).toBe(10);
  });

  it('filtra productos por nombre (case-insensitive)', () => {
    const { comp } = setup({ products: MOCK_PRODUCTS });
    comp.form.get('productSearch')!.setValue('amoladora');
    expect(comp.filteredProducts.length).toBe(1);
    expect(comp.filteredProducts[0].id).toBe(20);
  });

  it('filtra sin resultados cuando no hay coincidencia', () => {
    const { comp } = setup({ products: MOCK_PRODUCTS });
    comp.form.get('productSearch')!.setValue('xyz999');
    expect(comp.filteredProducts.length).toBe(0);
  });

  it('muestra todos los productos cuando el filtro está vacío', () => {
    const { comp } = setup({ products: MOCK_PRODUCTS });
    comp.form.get('productSearch')!.setValue('lub');
    comp.form.get('productSearch')!.setValue('');
    expect(comp.filteredProducts.length).toBe(2);
  });

  // ── Selección de producto ─────────────────────────────────────────────────

  it('onProductSelected asigna el producto y actualiza unitPrice', () => {
    const { comp } = setup({ products: MOCK_PRODUCTS });
    comp.form.patchValue({ quantity: 3 });
    comp.onProductSelected(MOCK_PRODUCTS[0]);
    expect(comp.selectedProduct).toBe(MOCK_PRODUCTS[0]);
    expect(comp.form.getRawValue().unitPrice).toBe(199.50);
    expect(comp.subtotal).toBe(3 * 199.50);
  });

  it('onProductSelected calcula subtotal con la cantidad actual', () => {
    const { comp } = setup({ products: MOCK_PRODUCTS });
    comp.form.patchValue({ quantity: 2 });
    comp.onProductSelected(MOCK_PRODUCTS[1]);
    expect(comp.subtotal).toBe(2 * 850.00);
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

  it('displayProduct formatea correctamente un ProductResponseDTO', () => {
    const { comp } = setup();
    const result = comp.displayProduct(MOCK_PRODUCTS[0]);
    expect(result).toContain('LUB-001');
    expect(result).toContain('Aceite Lubricante 20W-50');
  });

  // ── isProductDisabled ─────────────────────────────────────────────────────

  it('isProductDisabled retorna true si el ID ya está en la orden', () => {
    const { comp } = setup({ existingIds: [10, 20] });
    expect(comp.isProductDisabled(MOCK_PRODUCTS[0])).toBe(true);
  });

  it('isProductDisabled retorna false si el ID no está en la orden', () => {
    const { comp } = setup({ existingIds: [99] });
    expect(comp.isProductDisabled(MOCK_PRODUCTS[0])).toBe(false);
  });

  // ── submit ────────────────────────────────────────────────────────────────

  it('emite save con PurchaseOrderDetailUpdateRequest en modo edición', () => {
    const { comp } = setup({ detail: makeDetail() });
    const emitidos: any[] = [];
    comp.save.subscribe(v => emitidos.push(v));
    comp.form.patchValue({ quantity: 10, unitPrice: 50 });
    comp.submit();
    expect(emitidos.length).toBe(1);
    expect(emitidos[0]).toEqual({ quantity: 10, unitPrice: 50 });
    expect((emitidos[0] as any).productId).toBeUndefined();
  });

  it('no emite save si quantity < 1', () => {
    const { comp } = setup({ detail: makeDetail() });
    const emitidos: any[] = [];
    comp.save.subscribe(v => emitidos.push(v));
    comp.form.patchValue({ quantity: 0, unitPrice: 50 });
    comp.submit();
    expect(emitidos.length).toBe(0);
  });

  it('no emite save en modo creación si no hay producto seleccionado', () => {
    const { comp } = setup({ products: MOCK_PRODUCTS });
    const emitidos: any[] = [];
    comp.save.subscribe(v => emitidos.push(v));
    comp.form.patchValue({ quantity: 2, unitPrice: 100 });
    comp.submit();
    expect(emitidos.length).toBe(0);
  });

  it('emite save con PurchaseOrderDetailRequest en modo creación con producto seleccionado', () => {
    const { comp } = setup({ products: MOCK_PRODUCTS });
    const emitidos: any[] = [];
    comp.save.subscribe(v => emitidos.push(v));
    comp.onProductSelected(MOCK_PRODUCTS[0]);
    comp.form.patchValue({ quantity: 4 });
    comp.submit();
    expect(emitidos.length).toBe(1);
    const emitido = emitidos[0] as any;
    expect(emitido.productId).toBe(10);
    expect(emitido.quantity).toBe(4);
    expect(emitido.unitPrice).toBe(199.50);
    expect(emitido.productSku).toBe('LUB-001');
    expect(emitido.productName).toBe('Aceite Lubricante 20W-50');
    expect(emitido.subtotal).toBe(4 * 199.50);
  });
});
