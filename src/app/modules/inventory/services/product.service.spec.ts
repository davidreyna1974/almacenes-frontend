import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProductService } from './product.service';
import { ProductResponseDTO, ProductRequestDTO } from '../models/product.model';
import { StockMovementRequestDTO, StockMovementResponseDTO } from '../models/stock-movement.model';
import { PageResponse } from '../../../shared/models/page-response.model';

const mockProduct: ProductResponseDTO = {
  id: 1,
  sku: 'TOOL-001',
  name: 'Taladro percutor',
  description: 'Taladro de alto rendimiento',
  price: 99.99,
  currentStock: 50,
  minimumStock: 10,
  status: 'AVAILABLE',
  active: true,
  reservedStock: 0,
  availableStock: 50,
  unitCost: 50,
  categoryId: 1,
  categoryName: 'Herramientas',
  supplierId: 1,
  supplierName: 'Ferretería SA',
  createdAt: '2026-01-01T00:00:00',
  createdByUsername: 'admin',
  updatedAt: '',
};

const mockPage: PageResponse<ProductResponseDTO> = {
  content: [mockProduct],
  currentPage: 0,
  totalPages: 1,
  totalElements: 1,
  size: 20,
  first: true,
  last: true,
};

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── search ───────────────────────────────────────────────────────────────

  it('search: sin params debe llamar a GET /products con page=0 y size=20', () => {
    service.search().subscribe();

    const req = httpMock.expectOne(r =>
      r.url.includes('/inventory/products') && !r.url.includes('/movement') && !r.url.includes('/sku')
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    req.flush(mockPage);
  });

  it('search: con término válido debe incluir el param search en la petición', () => {
    service.search({ search: 'taladro' }).subscribe();

    const req = httpMock.expectOne(r =>
      r.url.includes('/inventory/products') && !r.url.includes('/sku')
    );
    expect(req.request.params.get('search')).toBe('taladro');
    req.flush(mockPage);
  });

  it('search: término solo con espacios no debe incluir param search (trim → vacío)', () => {
    // Verifica que el servicio no envía strings en blanco al backend —
    // evita que el backend reciba "   " como filtro de búsqueda.
    service.search({ search: '   ' }).subscribe();

    const req = httpMock.expectOne(r =>
      r.url.includes('/inventory/products') && !r.url.includes('/sku')
    );
    expect(req.request.params.has('search')).toBe(false);
    req.flush(mockPage);
  });

  it('search: con categoryId y status debe incluir ambos params', () => {
    service.search({ categoryId: 1, status: 'AVAILABLE' }).subscribe();

    const req = httpMock.expectOne(r =>
      r.url.includes('/inventory/products') && !r.url.includes('/category')
    );
    expect(req.request.params.get('categoryId')).toBe('1');
    expect(req.request.params.get('status')).toBe('AVAILABLE');
    req.flush(mockPage);
  });

  it('search: categoryId=null no debe incluir el param categoryId', () => {
    service.search({ categoryId: undefined }).subscribe();

    const req = httpMock.expectOne(r =>
      r.url.includes('/inventory/products') && !r.url.includes('/sku')
    );
    expect(req.request.params.has('categoryId')).toBe(false);
    req.flush(mockPage);
  });

  // ─── getById ──────────────────────────────────────────────────────────────

  it('getById: debe llamar a GET /products/{id} y retornar el producto', () => {
    let result: ProductResponseDTO | undefined;
    service.getById(1).subscribe(r => (result = r));

    const req = httpMock.expectOne(r => r.url.includes('/inventory/products/1'));
    expect(req.request.method).toBe('GET');
    req.flush(mockProduct);

    expect(result?.sku).toBe('TOOL-001');
  });

  // ─── getBySku ─────────────────────────────────────────────────────────────

  it('getBySku: debe llamar a GET /products/sku/{sku} y retornar el producto', () => {
    let result: ProductResponseDTO | undefined;
    service.getBySku('TOOL-001').subscribe(r => (result = r));

    const req = httpMock.expectOne(r => r.url.includes('/inventory/products/sku/TOOL-001'));
    expect(req.request.method).toBe('GET');
    req.flush(mockProduct);

    expect(result?.id).toBe(1);
  });

  // ─── getByCategory ────────────────────────────────────────────────────────

  it('getByCategory: debe llamar a GET /products/category/{id} con paginación', () => {
    service.getByCategory(1).subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/inventory/products/category/1'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    req.flush(mockPage);
  });

  // ─── getLowStock ──────────────────────────────────────────────────────────

  it('getLowStock: debe llamar a GET /products/low-stock con paginación por defecto', () => {
    service.getLowStock().subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/inventory/products/low-stock'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    req.flush(mockPage);
  });

  // ─── create ───────────────────────────────────────────────────────────────

  it('create: debe llamar a POST /products con el body y retornar el DTO creado', () => {
    const request: ProductRequestDTO = {
      sku: 'TOOL-001',
      name: 'Taladro percutor',
      price: 99.99,
      status: 'AVAILABLE',
      categoryId: 1,
      supplierId: 1,
      unitCost: 50,
    };
    let result: ProductResponseDTO | undefined;
    service.create(request).subscribe(r => (result = r));

    const req = httpMock.expectOne(r =>
      r.url.includes('/inventory/products') && r.method === 'POST' && !r.url.includes('/movement')
    );
    expect(req.request.body).toEqual(request);
    req.flush(mockProduct);

    expect(result?.sku).toBe('TOOL-001');
    expect(result?.categoryName).toBe('Herramientas');
  });

  // ─── update ───────────────────────────────────────────────────────────────

  it('update: debe llamar a PUT /products/{id} con el body correcto', () => {
    const request: ProductRequestDTO = {
      sku: 'TOOL-001',
      name: 'Taladro percutor v2',
      price: 109.99,
      status: 'AVAILABLE',
      categoryId: 1,
      supplierId: 1,
      unitCost: 50,
    };
    service.update(1, request).subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/inventory/products/1') && r.method === 'PUT');
    expect(req.request.body.name).toBe('Taladro percutor v2');
    req.flush({ ...mockProduct, name: 'Taladro percutor v2' });
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  it('delete: debe llamar a DELETE /products/{id} y completar sin body (204)', () => {
    let completed = false;
    service.delete(1).subscribe({ complete: () => (completed = true) });

    const req = httpMock.expectOne(r => r.url.includes('/inventory/products/1') && r.method === 'DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });

  // ─── registerMovement ─────────────────────────────────────────────────────

  it('registerMovement: debe llamar a POST /products/movement y completar sin body (204)', () => {
    const request: StockMovementRequestDTO = {
      productId: 1,
      quantity: 10,
      reason: 'Compra orden #45',
      type: 'IN',
    };
    let completed = false;
    service.registerMovement(request).subscribe({ complete: () => (completed = true) });

    const req = httpMock.expectOne(r => r.url.includes('/inventory/products/movement'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });

  // ─── getMovements ─────────────────────────────────────────────────────────

  it('getMovements: debe llamar a GET /products/{id}/movements con paginación', () => {
    const mockMovPage: PageResponse<StockMovementResponseDTO> = {
      content: [{ id: 1, quantity: 10, reason: 'Compra', createdAt: '', type: 'IN', productId: 1, productName: 'Taladro', createdByUsername: 'admin' }],
      currentPage: 0, totalPages: 1, totalElements: 1, size: 10, first: true, last: true,
    };

    service.getMovements(1).subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/inventory/products/1/movements'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('10');
    req.flush(mockMovPage);
  });

  // ─── getActiveSuppliers ───────────────────────────────────────────────────

  it('getActiveSuppliers: debe mapear companyName del backend a name en el modelo frontend', () => {
    // Verifica la transformación crítica: el backend devuelve companyName pero el
    // frontend necesita name en SupplierOption. Si este mapping falla, el dropdown
    // de proveedor aparece vacío sin ningún mensaje de error.
    const backendResponse = {
      content: [
        { id: 1, companyName: 'Ferretería SA', rfc: 'FERN123', active: true },
        { id: 2, companyName: 'Distribuidora XYZ', rfc: 'DIST456', active: true },
      ],
      currentPage: 0, totalPages: 1, totalElements: 2, size: 20, first: true, last: true,
    };

    let result: PageResponse<{ id: number; name: string }> | undefined;
    service.getActiveSuppliers().subscribe(r => (result = r as any));

    const req = httpMock.expectOne(r => r.url.includes('/purchases/suppliers/active'));
    expect(req.request.method).toBe('GET');
    req.flush(backendResponse);

    expect(result?.content.length).toBe(2);
    expect(result?.content[0].name).toBe('Ferretería SA');
    expect(result?.content[1].name).toBe('Distribuidora XYZ');
    // Confirma que companyName no existe en el resultado mapeado
    expect((result?.content[0] as any).companyName).toBeUndefined();
  });
});
