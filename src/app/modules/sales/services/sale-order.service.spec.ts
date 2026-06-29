import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SaleOrderService } from './sale-order.service';
import { SaleOrderResponse, SaleOrderRequest } from '../models/sale-order.model';
import { environment } from '../../../../environments/environment';

const BASE = `${environment.apiUrl}/sales/orders`;

function makeOrder(overrides: Partial<SaleOrderResponse> = {}): SaleOrderResponse {
  return {
    id: 1, orderNumber: 'OV-2026-0001', status: 'PENDING',
    notes: null, totalAmount: 500,
    clientId: 1, clientName: 'Distribuidora del Norte',
    createdById: 1, createdByUsername: 'admin', createdAt: '2026-06-13T10:00:00',
    updatedAt: null, updatedById: null, updatedByUsername: null,
    approvedAt: null, approvedById: null, approvedByUsername: null,
    deliveredAt: null, deliveredById: null, deliveredByUsername: null,
    cancelledAt: null, cancelledById: null, cancelledByUsername: null,
    details: [],
    ...overrides,
  };
}

describe('SaleOrderService', () => {
  let service: SaleOrderService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SaleOrderService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('create() llama POST con el body y retorna 201', () => {
    const req: SaleOrderRequest = {
      clientId: 1, notes: 'Pedido Q2',
      details: [{ productId: 5, quantity: 10, unitPrice: 50 }],
    };
    service.create(req).subscribe();
    const r = http.expectOne(BASE);
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual(req);
    r.flush(makeOrder({ id: 5 }), { status: 201, statusText: 'Created' });
  });

  it('getById() llama GET /{id}', () => {
    service.getById(1).subscribe();
    const r = http.expectOne(`${BASE}/1`);
    expect(r.request.method).toBe('GET');
    r.flush(makeOrder());
  });

  it('getByStatus() llama GET /status/{status} con paginación', () => {
    service.getByStatus('PENDING', 0, 20).subscribe();
    const r = http.expectOne(req => req.url === `${BASE}/status/PENDING`);
    expect(r.request.method).toBe('GET');
    expect(r.request.params.get('page')).toBe('0');
    expect(r.request.params.get('size')).toBe('20');
    r.flush({ content: [], currentPage: 0, totalPages: 0, totalElements: 0, size: 20, first: true, last: true });
  });

  it('getByClientId() llama GET /client/{id} y retorna lista (no paginada)', () => {
    service.getByClientId(2).subscribe();
    const r = http.expectOne(`${BASE}/client/2`);
    expect(r.request.method).toBe('GET');
    r.flush([makeOrder()]);
  });

  it('getByProductId() llama GET /product/{id} y retorna lista (no paginada)', () => {
    service.getByProductId(7).subscribe();
    const r = http.expectOne(`${BASE}/product/7`);
    expect(r.request.method).toBe('GET');
    r.flush([makeOrder()]);
  });

  it('update() llama PUT /{id} con el body correcto', () => {
    const dto = { clientId: 1, notes: 'Notas actualizadas' };
    service.update(1, dto).subscribe();
    const r = http.expectOne(`${BASE}/1`);
    expect(r.request.method).toBe('PUT');
    expect(r.request.body).toEqual(dto);
    r.flush(makeOrder({ notes: 'Notas actualizadas' }));
  });

  it('approve() llama PATCH /{id}/approve sin body', () => {
    service.approve(1).subscribe();
    const r = http.expectOne(`${BASE}/1/approve`);
    expect(r.request.method).toBe('PATCH');
    expect(r.request.body).toBeNull();
    r.flush(makeOrder({ status: 'APPROVED' }));
  });

  it('deliver() llama PATCH /{id}/deliver sin body', () => {
    service.deliver(1).subscribe();
    const r = http.expectOne(`${BASE}/1/deliver`);
    expect(r.request.method).toBe('PATCH');
    expect(r.request.body).toBeNull();
    r.flush(makeOrder({ status: 'DELIVERED' }));
  });

  it('cancel() llama PATCH /{id}/cancel sin body', () => {
    service.cancel(1).subscribe();
    const r = http.expectOne(`${BASE}/1/cancel`);
    expect(r.request.method).toBe('PATCH');
    expect(r.request.body).toBeNull();
    r.flush(makeOrder({ status: 'CANCELLED' }));
  });

  it('addDetail() llama POST /{id}/details y retorna orden completa', () => {
    const detail = { productId: 3, quantity: 5, unitPrice: 100 };
    service.addDetail(1, detail).subscribe();
    const r = http.expectOne(`${BASE}/1/details`);
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual(detail);
    r.flush(makeOrder({ totalAmount: 600 }), { status: 201, statusText: 'Created' });
  });

  it('updateDetail() llama PUT /{id}/details/{detailId}', () => {
    const dto = { quantity: 8, unitPrice: 120 };
    service.updateDetail(1, 2, dto).subscribe();
    const r = http.expectOne(`${BASE}/1/details/2`);
    expect(r.request.method).toBe('PUT');
    expect(r.request.body).toEqual(dto);
    r.flush(makeOrder());
  });

  it('removeDetail() llama DELETE /{id}/details/{detailId} y retorna void (204)', () => {
    let called = false;
    service.removeDetail(1, 2).subscribe(() => (called = true));
    const r = http.expectOne(`${BASE}/1/details/2`);
    expect(r.request.method).toBe('DELETE');
    r.flush(null, { status: 204, statusText: 'No Content' });
    expect(called).toBe(true);
  });
});
