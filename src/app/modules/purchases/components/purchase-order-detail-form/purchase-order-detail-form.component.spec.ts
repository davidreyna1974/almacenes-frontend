import { TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { PurchaseOrderDetailFormComponent } from './purchase-order-detail-form.component';
import { ProductService } from '../../../inventory/services/product.service';
import { PurchaseOrderDetailResponse } from '../../models/purchase-order.model';

function makeDetail(overrides: Partial<PurchaseOrderDetailResponse> = {}): PurchaseOrderDetailResponse {
  return {
    id: 1, quantity: 5, unitPrice: 100, subtotal: 500,
    productId: 1, productSku: 'T001', productName: 'Tornillo M8',
    ...overrides,
  };
}

function setup(inputs: { detail?: PurchaseOrderDetailResponse | null; existingIds?: number[] } = {}) {
  const mockProductService = {
    search: () => of({ content: [], currentPage: 0, totalPages: 0, totalElements: 0, size: 200, first: true, last: true }),
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
  if (inputs.detail       !== undefined) fixture.componentRef.setInput('detail',             inputs.detail);
  if (inputs.existingIds  !== undefined) fixture.componentRef.setInput('existingProductIds', inputs.existingIds);
  fixture.detectChanges();
  return { fixture, comp };
}

describe('PurchaseOrderDetailFormComponent', () => {

  it('debe crearse correctamente', () => {
    const { comp } = setup();
    expect(comp).toBeTruthy();
  });

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
});
