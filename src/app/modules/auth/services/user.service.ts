import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PageResponse } from '../../../shared/models/page-response.model';
import { UserResponse } from '../models/user-response.model';
import { UserCreate } from '../models/user-create.model';
import { UserUpdate } from '../models/user-update.model';
import { UserRoleAssign } from '../models/user-role-assign.model';
import { ChangePassword } from '../models/change-password.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = `${environment.apiUrl}/auth`;
  private http = inject(HttpClient);

  // ── Gestión de usuarios (ADMIN) ──────────────────────────────────────────

  getAll(page = 0, size = 20): Observable<PageResponse<UserResponse>> {
    return this.http.get<PageResponse<UserResponse>>(`${this.api}/users`, {
      params: { page, size },
    });
  }

  getById(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.api}/users/${id}`);
  }

  create(dto: UserCreate): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.api}/users`, dto);
  }

  update(id: number, dto: UserUpdate): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.api}/users/${id}`, dto);
  }

  deactivate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/users/${id}`);
  }

  assignRoles(id: number, dto: UserRoleAssign): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.api}/users/${id}/roles`, dto);
  }

  // ── Perfil propio (todos los roles autenticados) ─────────────────────────

  getMyProfile(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.api}/me`);
  }

  changePassword(dto: ChangePassword): Observable<void> {
    return this.http.put<void>(`${this.api}/me/password`, dto);
  }
}
