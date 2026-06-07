import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SupplierService } from './supplier.service';
import { SupplierDTO } from '../models/supplier.model';
import { PageResponse } from '../../../shared/models/page-response.model';
import { environment } from '../../../../environments/environment';

function makeSupplier(overrides: Partial<SupplierDTO> = {}): SupplierDTO {
  return {
    id: 1, rfc: 'ABC123456789', companyName: 'Proveedor Test',
    contactName: 'Juan', phone: '5551234567', email: 'test@prov.com',
    address: 'Calle 1', active: true,
    createdAt: null, createdById: null, createdByUsername: null,
    updatedAt: null, updatedById: null, updatedByUsername: null,
    ...overrides,
  };
}

const BASE = `${environment.apiUrl}/purchases/suppliers`;

describe('SupplierService', () => {
  let service: SupplierService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SupplierService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getActive() llama GET /active con params page y size', () => {
    const page: PageResponse<SupplierDTO> = {
      content: [makeSupplier()], currentPage: 0, totalPages: 1,
      totalElements: 1, size: 50, first: true, last: true,
    };
    service.getActive(0, 50).subscribe();
    const req = http.expectOne(r => r.url === `${BASE}/active`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('50');
    req.flush(page);
  });

  it('getById() llama GET /{id}', () => {
    service.getById(5).subscribe();
    const req = http.expectOne(`${BASE}/5`);
    expect(req.request.method).toBe('GET');
    req.flush(makeSupplier({ id: 5 }));
  });

  it('create() llama POST con el body correcto y retorna 201', () => {
    const dto = makeSupplier({ id: null });
    service.create(dto).subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(makeSupplier({ id: 10 }), { status: 201, statusText: 'Created' });
  });

  it('update() llama PUT /{id} con el body correcto', () => {
    const dto = makeSupplier({ companyName: 'Actualizado' });
    service.update(1, dto).subscribe();
    const req = http.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);
    req.flush(dto);
  });

  it('deactivate() llama DELETE /{id} y retorna void (204)', () => {
    let called = false;
    service.deactivate(3).subscribe(() => (called = true));
    const req = http.expectOne(`${BASE}/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(called).toBe(true);
  });
});
