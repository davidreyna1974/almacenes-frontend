import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReportService } from './report.service';
import { environment } from '../../../../environments/environment';

describe('ReportService', () => {
  let service: ReportService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/reports`;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ReportService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getExecutiveDashboard', () => {
    it('calls GET /reports/dashboard/executive sin parámetros', () => {
      service.getExecutiveDashboard().subscribe();
      const req = http.expectOne(`${base}/dashboard/executive`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush({});
    });

    it('incluye from y to cuando se proporcionan', () => {
      service.getExecutiveDashboard('2026-01-01', '2026-06-30').subscribe();
      const req = http.expectOne(r => r.url === `${base}/dashboard/executive`);
      expect(req.request.params.get('from')).toBe('2026-01-01');
      expect(req.request.params.get('to')).toBe('2026-06-30');
      req.flush({});
    });

    it('omite parámetros undefined', () => {
      service.getExecutiveDashboard(undefined, '2026-06-30').subscribe();
      const req = http.expectOne(r => r.url === `${base}/dashboard/executive`);
      expect(req.request.params.has('from')).toBe(false);
      expect(req.request.params.get('to')).toBe('2026-06-30');
      req.flush({});
    });
  });

  describe('getInventoryValuation', () => {
    it('calls GET /reports/inventory/valuation sin params', () => {
      service.getInventoryValuation().subscribe();
      const req = http.expectOne(`${base}/inventory/valuation`);
      expect(req.request.method).toBe('GET');
      req.flush({ totalValue: 0, generatedAt: '', categories: [] });
    });
  });

  describe('getSalesProfitability', () => {
    it('envía from y to como parámetros requeridos', () => {
      service.getSalesProfitability('2026-01-01', '2026-06-30').subscribe();
      const req = http.expectOne(r => r.url === `${base}/sales/profitability`);
      expect(req.request.params.get('from')).toBe('2026-01-01');
      expect(req.request.params.get('to')).toBe('2026-06-30');
      req.flush({});
    });
  });

  describe('getTopProducts', () => {
    it('incluye limit cuando se proporciona', () => {
      service.getTopProducts('2026-01-01', '2026-06-30', 20).subscribe();
      const req = http.expectOne(r => r.url === `${base}/products/top-performers`);
      expect(req.request.params.get('limit')).toBe('20');
      req.flush([]);
    });

    it('omite limit cuando no se proporciona', () => {
      service.getTopProducts().subscribe();
      const req = http.expectOne(r => r.url === `${base}/products/top-performers`);
      expect(req.request.params.has('limit')).toBe(false);
      req.flush([]);
    });
  });

  describe('getAbcAnalysis', () => {
    it('calls GET /reports/inventory/abc', () => {
      service.getAbcAnalysis().subscribe();
      const req = http.expectOne(`${base}/inventory/abc`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('getInventoryTurnover', () => {
    it('calls GET /reports/inventory/turnover', () => {
      service.getInventoryTurnover().subscribe();
      const req = http.expectOne(`${base}/inventory/turnover`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('getPurchasesBySupplier', () => {
    it('calls GET /reports/purchases/by-supplier', () => {
      service.getPurchasesBySupplier().subscribe();
      const req = http.expectOne(`${base}/purchases/by-supplier`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('getSalesTrend', () => {
    it('incluye groupBy cuando se proporciona', () => {
      service.getSalesTrend('2026-01-01', '2026-06-30', 'MONTH').subscribe();
      const req = http.expectOne(r => r.url === `${base}/sales/trend`);
      expect(req.request.params.get('groupBy')).toBe('MONTH');
      req.flush([]);
    });
  });

  describe('getLowStock', () => {
    it('calls GET /reports/inventory/low-stock sin params', () => {
      service.getLowStock().subscribe();
      const req = http.expectOne(`${base}/inventory/low-stock`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush([]);
    });
  });

  describe('getKardex', () => {
    it('incluye productId en el path', () => {
      service.getKardex(42).subscribe();
      const req = http.expectOne(r => r.url === `${base}/inventory/kardex/42`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('incluye from y to opcionales', () => {
      service.getKardex(42, '2026-01-01', '2026-06-30').subscribe();
      const req = http.expectOne(r => r.url === `${base}/inventory/kardex/42`);
      expect(req.request.params.get('from')).toBe('2026-01-01');
      req.flush({});
    });
  });

  describe('getPendingOperations', () => {
    it('calls GET /reports/operations/pending sin params', () => {
      service.getPendingOperations().subscribe();
      const req = http.expectOne(`${base}/operations/pending`);
      expect(req.request.method).toBe('GET');
      req.flush({ pendingPurchaseOrders: [], pendingSaleOrders: [], totalPendingPurchases: 0, totalPendingSales: 0 });
    });
  });

  describe('getMovementsSummary', () => {
    it('calls GET /reports/inventory/movements', () => {
      service.getMovementsSummary().subscribe();
      const req = http.expectOne(`${base}/inventory/movements`);
      expect(req.request.method).toBe('GET');
      req.flush({ totalIn: 0, totalOut: 0, netMovement: 0 });
    });

    it('omite parámetros cuando son undefined', () => {
      service.getMovementsSummary().subscribe();
      const req = http.expectOne(`${base}/inventory/movements`);
      expect(req.request.params.keys().length).toBe(0);
      req.flush({});
    });
  });
});
