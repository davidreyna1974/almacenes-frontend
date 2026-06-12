import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CategoryService } from './category.service';
import { CategoryDTO, CategoryRequest } from '../models/category.model';
import { PageResponse } from '../../../shared/models/page-response.model';

const mockCategory: CategoryDTO = {
  id: 1,
  name: 'Herramientas',
  description: 'Herramientas de trabajo',
  active: true,
  createdAt: '2026-01-01T00:00:00',
  createdByUsername: 'admin',
};

const mockPage: PageResponse<CategoryDTO> = {
  content: [mockCategory],
  currentPage: 0,
  totalPages: 1,
  totalElements: 1,
  size: 20,
  first: true,
  last: true,
};

describe('CategoryService', () => {
  let service: CategoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CategoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── getActive ────────────────────────────────────────────────────────────

  it('getActive: debe llamar a GET /categories/active con page=0 y size=20 por defecto', () => {
    service.getActive().subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/inventory/categories/active'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    req.flush(mockPage);
  });

  it('getActive: debe respetar page y size personalizados', () => {
    service.getActive('', 2, 10).subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/inventory/categories/active'));
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('10');
    req.flush(mockPage);
  });

  it('getActive: debe retornar el PageResponse con el contenido del servidor', () => {
    let result: PageResponse<CategoryDTO> | undefined;
    service.getActive().subscribe(r => (result = r));

    const req = httpMock.expectOne(r => r.url.includes('/inventory/categories/active'));
    req.flush(mockPage);

    expect(result?.content.length).toBe(1);
    expect(result?.content[0].name).toBe('Herramientas');
    expect(result?.totalElements).toBe(1);
  });

  // ─── create ───────────────────────────────────────────────────────────────

  it('create: debe llamar a POST /categories con el body correcto y retornar el DTO', () => {
    const request: CategoryRequest = { name: 'Herramientas', description: 'Herramientas de trabajo' };
    let result: CategoryDTO | undefined;

    service.create(request).subscribe(r => (result = r));

    const req = httpMock.expectOne(r => r.url.includes('/inventory/categories') && r.method === 'POST');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockCategory);

    expect(result?.id).toBe(1);
    expect(result?.name).toBe('Herramientas');
  });

  // ─── update ───────────────────────────────────────────────────────────────

  it('update: debe llamar a PUT /categories/{id} con el body correcto', () => {
    const request: CategoryRequest = { name: 'Herramientas Eléctricas' };
    let result: CategoryDTO | undefined;

    service.update(1, request).subscribe(r => (result = r));

    const req = httpMock.expectOne(r => r.url.includes('/inventory/categories/1'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush({ ...mockCategory, name: 'Herramientas Eléctricas' });

    expect(result?.name).toBe('Herramientas Eléctricas');
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  it('delete: debe llamar a DELETE /categories/{id} y completar sin body (204)', () => {
    let completed = false;
    service.delete(1).subscribe({ complete: () => (completed = true) });

    const req = httpMock.expectOne(r => r.url.includes('/inventory/categories/1'));
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });
});
