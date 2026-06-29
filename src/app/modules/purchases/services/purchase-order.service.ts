import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PageResponse } from '../../../shared/models/page-response.model';
import {
  PurchaseOrderResponse,
  PurchaseOrderRequest,
  PurchaseOrderUpdateRequest,
  PurchaseOrderDetailRequest,
  PurchaseOrderDetailUpdateRequest,
} from '../models/purchase-order.model';

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private readonly api = `${environment.apiUrl}/purchases/orders`;
  private http = inject(HttpClient);

  create(dto: PurchaseOrderRequest): Observable<PurchaseOrderResponse> {
    return this.http.post<PurchaseOrderResponse>(this.api, dto);
  }

  getById(id: number): Observable<PurchaseOrderResponse> {
    return this.http.get<PurchaseOrderResponse>(`${this.api}/${id}`);
  }

  getByStatus(status: string, page = 0, size = 20, search = ''): Observable<PageResponse<PurchaseOrderResponse>> {
    const params: Record<string, string | number> = { page, size };
    if (search.trim()) params['search'] = search.trim();
    return this.http.get<PageResponse<PurchaseOrderResponse>>(
      `${this.api}/status/${status}`, { params }
    );
  }

  getBySupplierId(supplierId: number): Observable<PurchaseOrderResponse[]> {
    return this.http.get<PurchaseOrderResponse[]>(`${this.api}/supplier/${supplierId}`);
  }

  update(id: number, dto: PurchaseOrderUpdateRequest): Observable<PurchaseOrderResponse> {
    return this.http.put<PurchaseOrderResponse>(`${this.api}/${id}`, dto);
  }

  approve(id: number): Observable<PurchaseOrderResponse> {
    return this.http.patch<PurchaseOrderResponse>(`${this.api}/${id}/approve`, null);
  }

  receive(id: number): Observable<PurchaseOrderResponse> {
    return this.http.patch<PurchaseOrderResponse>(`${this.api}/${id}/receive`, null);
  }

  cancel(id: number): Observable<PurchaseOrderResponse> {
    return this.http.patch<PurchaseOrderResponse>(`${this.api}/${id}/cancel`, null);
  }

  addDetail(orderId: number, dto: PurchaseOrderDetailRequest): Observable<PurchaseOrderResponse> {
    return this.http.post<PurchaseOrderResponse>(`${this.api}/${orderId}/details`, dto);
  }

  updateDetail(orderId: number, detailId: number, dto: PurchaseOrderDetailUpdateRequest): Observable<PurchaseOrderResponse> {
    return this.http.put<PurchaseOrderResponse>(`${this.api}/${orderId}/details/${detailId}`, dto);
  }

  removeDetail(orderId: number, detailId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${orderId}/details/${detailId}`);
  }
}
