import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PageResponse } from '../../../shared/models/page-response.model';
import {
  SaleOrderResponse,
  SaleOrderRequest,
  SaleOrderUpdateRequest,
  SaleOrderDetailRequest,
  SaleOrderDetailUpdateRequest,
  SaleOrderStatus,
} from '../models/sale-order.model';

@Injectable({ providedIn: 'root' })
export class SaleOrderService {
  private readonly api = `${environment.apiUrl}/sales/orders`;
  private http = inject(HttpClient);

  create(dto: SaleOrderRequest): Observable<SaleOrderResponse> {
    return this.http.post<SaleOrderResponse>(this.api, dto);
  }

  getById(id: number): Observable<SaleOrderResponse> {
    return this.http.get<SaleOrderResponse>(`${this.api}/${id}`);
  }

  getByStatus(status: SaleOrderStatus, page = 0, size = 20): Observable<PageResponse<SaleOrderResponse>> {
    return this.http.get<PageResponse<SaleOrderResponse>>(
      `${this.api}/status/${status}`, { params: { page, size } }
    );
  }

  getByClientId(clientId: number): Observable<SaleOrderResponse[]> {
    return this.http.get<SaleOrderResponse[]>(`${this.api}/client/${clientId}`);
  }

  getByProductId(productId: number): Observable<SaleOrderResponse[]> {
    return this.http.get<SaleOrderResponse[]>(`${this.api}/product/${productId}`);
  }

  update(id: number, dto: SaleOrderUpdateRequest): Observable<SaleOrderResponse> {
    return this.http.put<SaleOrderResponse>(`${this.api}/${id}`, dto);
  }

  approve(id: number): Observable<SaleOrderResponse> {
    return this.http.patch<SaleOrderResponse>(`${this.api}/${id}/approve`, null);
  }

  deliver(id: number): Observable<SaleOrderResponse> {
    return this.http.patch<SaleOrderResponse>(`${this.api}/${id}/deliver`, null);
  }

  cancel(id: number): Observable<SaleOrderResponse> {
    return this.http.patch<SaleOrderResponse>(`${this.api}/${id}/cancel`, null);
  }

  addDetail(orderId: number, dto: SaleOrderDetailRequest): Observable<SaleOrderResponse> {
    return this.http.post<SaleOrderResponse>(`${this.api}/${orderId}/details`, dto);
  }

  updateDetail(orderId: number, detailId: number, dto: SaleOrderDetailUpdateRequest): Observable<SaleOrderResponse> {
    return this.http.put<SaleOrderResponse>(`${this.api}/${orderId}/details/${detailId}`, dto);
  }

  removeDetail(orderId: number, detailId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${orderId}/details/${detailId}`);
  }
}
