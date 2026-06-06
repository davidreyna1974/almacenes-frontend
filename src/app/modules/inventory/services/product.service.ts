import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { PageResponse } from '../../../shared/models/page-response.model';
import { ProductResponseDTO, ProductRequestDTO, SupplierOption } from '../models/product.model';
import { StockMovementRequestDTO, StockMovementResponseDTO } from '../models/stock-movement.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly api = `${environment.apiUrl}/inventory/products`;
  private readonly suppliersApi = `${environment.apiUrl}/purchases/suppliers`;
  private http = inject(HttpClient);

  getById(id: number): Observable<ProductResponseDTO> {
    return this.http.get<ProductResponseDTO>(`${this.api}/${id}`);
  }

  getBySku(sku: string): Observable<ProductResponseDTO> {
    return this.http.get<ProductResponseDTO>(`${this.api}/sku/${sku}`);
  }

  getByCategory(categoryId: number, page = 0, size = 20): Observable<PageResponse<ProductResponseDTO>> {
    return this.http.get<PageResponse<ProductResponseDTO>>(`${this.api}/category/${categoryId}`, {
      params: { page, size }
    });
  }

  getLowStock(page = 0, size = 20): Observable<PageResponse<ProductResponseDTO>> {
    return this.http.get<PageResponse<ProductResponseDTO>>(`${this.api}/low-stock`, {
      params: { page, size }
    });
  }

  create(request: ProductRequestDTO): Observable<ProductResponseDTO> {
    return this.http.post<ProductResponseDTO>(this.api, request);
  }

  update(id: number, request: ProductRequestDTO): Observable<ProductResponseDTO> {
    return this.http.put<ProductResponseDTO>(`${this.api}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  registerMovement(request: StockMovementRequestDTO): Observable<void> {
    return this.http.post<void>(`${this.api}/movement`, request);
  }

  getMovements(productId: number, page = 0, size = 10): Observable<PageResponse<StockMovementResponseDTO>> {
    return this.http.get<PageResponse<StockMovementResponseDTO>>(`${this.api}/${productId}/movements`, {
      params: { page, size }
    });
  }

  getActiveSuppliers(): Observable<PageResponse<SupplierOption>> {
    return this.http.get<PageResponse<any>>(`${this.suppliersApi}/active`).pipe(
      map(page => ({ ...page, content: page.content.map((s: any) => ({ id: s.id, name: s.companyName })) }))
    );
  }
}
