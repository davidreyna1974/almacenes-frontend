import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PageResponse } from '../../../shared/models/page-response.model';
import { ClientDTO, ClientRequest } from '../models/client.model';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly api = `${environment.apiUrl}/sales/clients`;
  private http = inject(HttpClient);

  getActive(search = '', page = 0, size = 20): Observable<PageResponse<ClientDTO>> {
    const params: Record<string, string | number> = { page, size };
    if (search?.trim()) params['search'] = search.trim();
    return this.http.get<PageResponse<ClientDTO>>(`${this.api}/active`, { params });
  }

  getById(id: number): Observable<ClientDTO> {
    return this.http.get<ClientDTO>(`${this.api}/${id}`);
  }

  create(request: ClientRequest): Observable<ClientDTO> {
    return this.http.post<ClientDTO>(this.api, request);
  }

  update(id: number, request: ClientRequest): Observable<ClientDTO> {
    return this.http.put<ClientDTO>(`${this.api}/${id}`, request);
  }

  deactivate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
