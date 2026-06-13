import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ClientService } from './client.service';
import { ClientDTO, ClientRequest } from '../models/client.model';
import { PageResponse } from '../../../shared/models/page-response.model';
import { environment } from '../../../../environments/environment';

const BASE = `${environment.apiUrl}/sales/clients`;

function makeClient(overrides: Partial<ClientDTO> = {}): ClientDTO {
  return {
    id: 1, name: 'Distribuidora del Norte', rfc: 'ABC123456789',
    contactName: 'Juan Pérez', phone: '5551234567', email: 'contacto@dn.com',
    address: 'Calle 1', active: true,
    createdAt: null, createdById: null, createdByUsername: null,
    updatedAt: null, updatedById: null, updatedByUsername: null,
    ...overrides,
  };
}

describe('ClientService', () => {
  let service: ClientService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClientService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getActive() llama GET /active con page y size por defecto, sin parámetro search', () => {
    const page: PageResponse<ClientDTO> = {
      content: [makeClient()], currentPage: 0, totalPages: 1,
      totalElements: 1, size: 20, first: true, last: true,
    };
    service.getActive().subscribe();
    const req = http.expectOne(r => r.url === `${BASE}/active`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    expect(req.request.params.has('search')).toBe(false);
    req.flush(page);
  });

  it('getActive() incluye el parámetro search cuando se proporciona texto', () => {
    service.getActive('almacen', 0, 20).subscribe();
    const req = http.expectOne(r => r.url === `${BASE}/active`);
    expect(req.request.params.get('search')).toBe('almacen');
    req.flush({ content: [], currentPage: 0, totalPages: 0, totalElements: 0, size: 20, first: true, last: true });
  });

  it('getById() llama GET /{id}', () => {
    service.getById(5).subscribe();
    const req = http.expectOne(`${BASE}/5`);
    expect(req.request.method).toBe('GET');
    req.flush(makeClient({ id: 5 }));
  });

  it('create() llama POST con el body correcto y retorna 201', () => {
    const dto: ClientRequest = {
      name: 'Cliente Nuevo', rfc: null, contactName: null,
      phone: null, email: null, address: null,
    };
    service.create(dto).subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(makeClient({ id: 10, name: 'Cliente Nuevo' }), { status: 201, statusText: 'Created' });
  });

  it('update() llama PUT /{id} con el body correcto', () => {
    const dto: ClientRequest = {
      name: 'Cliente Actualizado', rfc: 'ABC123456789', contactName: 'Juan Pérez',
      phone: '5551234567', email: 'contacto@dn.com', address: 'Calle 1',
    };
    service.update(1, dto).subscribe();
    const req = http.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);
    req.flush(makeClient({ name: 'Cliente Actualizado' }));
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
