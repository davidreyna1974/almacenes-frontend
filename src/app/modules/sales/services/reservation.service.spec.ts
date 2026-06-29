import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ReservationService } from './reservation.service';
import { ReservationSummary, ReservedProduct, ReservedClient } from '../models/reservation.model';
import { environment } from '../../../../environments/environment';

const BASE = `${environment.apiUrl}/sales/reservations`;

function makeSummary(overrides: Partial<ReservationSummary> = {}): ReservationSummary {
  return {
    totalProductsWithReservations: 3,
    totalReservedUnits: 25,
    totalReservedValue: 1250.5,
    totalApprovedOrders: 2,
    ...overrides,
  };
}

function makeReservedProduct(overrides: Partial<ReservedProduct> = {}): ReservedProduct {
  return {
    productId: 1, productSku: 'SKU-001', productName: 'Producto Test',
    totalReservedQty: 10, unitPrice: 50, totalReservedValue: 500,
    orders: [],
    ...overrides,
  };
}

function makeReservedClient(overrides: Partial<ReservedClient> = {}): ReservedClient {
  return {
    clientId: 1, clientName: 'Distribuidora del Norte',
    totalReservedOrders: 2, totalReservedValue: 800,
    orders: [],
    ...overrides,
  };
}

describe('ReservationService', () => {
  let service: ReservationService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReservationService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getSummary() llama GET /summary', () => {
    service.getSummary().subscribe();
    const req = http.expectOne(`${BASE}/summary`);
    expect(req.request.method).toBe('GET');
    req.flush(makeSummary());
  });

  it('getProducts() llama GET /products y retorna lista', () => {
    service.getProducts().subscribe();
    const req = http.expectOne(`${BASE}/products`);
    expect(req.request.method).toBe('GET');
    req.flush([makeReservedProduct()]);
  });

  it('getProductById() llama GET /products/{id}', () => {
    service.getProductById(1).subscribe();
    const req = http.expectOne(`${BASE}/products/1`);
    expect(req.request.method).toBe('GET');
    req.flush(makeReservedProduct({ productId: 1 }));
  });

  it('getClients() llama GET /clients y retorna lista', () => {
    service.getClients().subscribe();
    const req = http.expectOne(`${BASE}/clients`);
    expect(req.request.method).toBe('GET');
    req.flush([makeReservedClient()]);
  });

  it('getClientById() llama GET /clients/{id}', () => {
    service.getClientById(1).subscribe();
    const req = http.expectOne(`${BASE}/clients/1`);
    expect(req.request.method).toBe('GET');
    req.flush(makeReservedClient({ clientId: 1 }));
  });
});
