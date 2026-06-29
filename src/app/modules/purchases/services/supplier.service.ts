import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PageResponse } from '../../../shared/models/page-response.model';
import { SupplierDTO } from '../models/supplier.model';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly api = `${environment.apiUrl}/purchases/suppliers`;
  private http = inject(HttpClient);

  getActive(page = 0, size = 50): Observable<PageResponse<SupplierDTO>> {
    return this.http.get<PageResponse<SupplierDTO>>(`${this.api}/active`, {
      params: { page, size }
    });
  }

  getById(id: number): Observable<SupplierDTO> {
    return this.http.get<SupplierDTO>(`${this.api}/${id}`);
  }

  create(dto: SupplierDTO): Observable<SupplierDTO> {
    return this.http.post<SupplierDTO>(this.api, dto);
  }

  update(id: number, dto: SupplierDTO): Observable<SupplierDTO> {
    return this.http.put<SupplierDTO>(`${this.api}/${id}`, dto);
  }

  deactivate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
