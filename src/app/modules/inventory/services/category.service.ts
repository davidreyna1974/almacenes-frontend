import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PageResponse } from '../../../shared/models/page-response.model';
import { CategoryDTO, CategoryRequest } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly api = `${environment.apiUrl}/inventory/categories`;
  private http = inject(HttpClient);

  getActive(page = 0, size = 20): Observable<PageResponse<CategoryDTO>> {
    return this.http.get<PageResponse<CategoryDTO>>(`${this.api}/active`, {
      params: { page, size }
    });
  }

  create(request: CategoryRequest): Observable<CategoryDTO> {
    return this.http.post<CategoryDTO>(this.api, request);
  }

  update(id: number, request: CategoryRequest): Observable<CategoryDTO> {
    return this.http.put<CategoryDTO>(`${this.api}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
