import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ExecutiveDashboardDTO,
  InventoryValuationDTO,
  SalesProfitabilityDTO,
  TopProductDTO,
  AbcProductDTO,
  InventoryTurnoverItemDTO,
  PurchaseBySupplierDTO,
  SalesTrendItemDTO,
  LowStockReportItemDTO,
  KardexReportDTO,
  PendingOperationsDTO,
  MovementsSummaryDTO,
  TrendGroupBy,
} from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/reports`;

  // E1 — Dashboard ejecutivo (ADMIN)
  getExecutiveDashboard(from?: string, to?: string): Observable<ExecutiveDashboardDTO> {
    return this.http.get<ExecutiveDashboardDTO>(
      `${this.base}/dashboard/executive`,
      { params: this.buildParams({ from, to }) }
    );
  }

  // E2 — Valuación del inventario (ADMIN, MANAGER)
  getInventoryValuation(): Observable<InventoryValuationDTO> {
    return this.http.get<InventoryValuationDTO>(`${this.base}/inventory/valuation`);
  }

  // E3 — Rentabilidad de ventas (ADMIN, MANAGER) — from y to OBLIGATORIOS
  getSalesProfitability(from: string, to: string): Observable<SalesProfitabilityDTO> {
    return this.http.get<SalesProfitabilityDTO>(
      `${this.base}/sales/profitability`,
      { params: this.buildParams({ from, to }) }
    );
  }

  // G1 — Top productos (ADMIN, MANAGER)
  getTopProducts(from?: string, to?: string, limit?: number): Observable<TopProductDTO[]> {
    return this.http.get<TopProductDTO[]>(
      `${this.base}/products/top-performers`,
      { params: this.buildParams({ from, to, limit: limit?.toString() }) }
    );
  }

  // G2 — Análisis ABC (ADMIN, MANAGER)
  getAbcAnalysis(from?: string, to?: string): Observable<AbcProductDTO[]> {
    return this.http.get<AbcProductDTO[]>(
      `${this.base}/inventory/abc`,
      { params: this.buildParams({ from, to }) }
    );
  }

  // G3 — Rotación de inventario (ADMIN, MANAGER, WAREHOUSEMAN)
  getInventoryTurnover(from?: string, to?: string): Observable<InventoryTurnoverItemDTO[]> {
    return this.http.get<InventoryTurnoverItemDTO[]>(
      `${this.base}/inventory/turnover`,
      { params: this.buildParams({ from, to }) }
    );
  }

  // G4 — Compras por proveedor (ADMIN, MANAGER)
  getPurchasesBySupplier(from?: string, to?: string): Observable<PurchaseBySupplierDTO[]> {
    return this.http.get<PurchaseBySupplierDTO[]>(
      `${this.base}/purchases/by-supplier`,
      { params: this.buildParams({ from, to }) }
    );
  }

  // G5 — Tendencia de ventas (ADMIN, MANAGER)
  getSalesTrend(from?: string, to?: string, groupBy?: TrendGroupBy): Observable<SalesTrendItemDTO[]> {
    return this.http.get<SalesTrendItemDTO[]>(
      `${this.base}/sales/trend`,
      { params: this.buildParams({ from, to, groupBy }) }
    );
  }

  // O1 — Stock bajo mínimo (ADMIN, MANAGER, WAREHOUSEMAN)
  getLowStock(): Observable<LowStockReportItemDTO[]> {
    return this.http.get<LowStockReportItemDTO[]>(`${this.base}/inventory/low-stock`);
  }

  // O2 — Kardex por producto (ADMIN, MANAGER, WAREHOUSEMAN)
  getKardex(productId: number, from?: string, to?: string): Observable<KardexReportDTO> {
    return this.http.get<KardexReportDTO>(
      `${this.base}/inventory/kardex/${productId}`,
      { params: this.buildParams({ from, to }) }
    );
  }

  // O3 — Operaciones pendientes (todos los roles)
  getPendingOperations(): Observable<PendingOperationsDTO> {
    return this.http.get<PendingOperationsDTO>(`${this.base}/operations/pending`);
  }

  // O4 — Resumen de movimientos (ADMIN, MANAGER, WAREHOUSEMAN)
  getMovementsSummary(from?: string, to?: string): Observable<MovementsSummaryDTO> {
    return this.http.get<MovementsSummaryDTO>(
      `${this.base}/inventory/movements`,
      { params: this.buildParams({ from, to }) }
    );
  }

  private buildParams(raw: Record<string, string | undefined>): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(raw)) {
      if (value != null && value !== '') {
        params = params.set(key, value);
      }
    }
    return params;
  }
}
