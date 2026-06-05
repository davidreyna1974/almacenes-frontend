import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthRequest } from '../../modules/auth/models/auth-request.model';
import { AuthResponse } from '../../modules/auth/models/auth-response.model';
import { UserPayload } from '../../modules/auth/models/user-payload.model';

const TOKEN_KEY = 'almacenes_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = `${environment.apiUrl}/auth`;
  private http = inject(HttpClient);
  private router = inject(Router);

  login(credentials: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/login`, credentials).pipe(
      tap(res => localStorage.setItem(TOKEN_KEY, res.token))
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUserPayload(): UserPayload | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const base64Payload = token.split('.')[1];
      return JSON.parse(atob(base64Payload)) as UserPayload;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    const payload = this.getUserPayload();
    if (!payload) return false;
    return payload.exp > Date.now() / 1000;
  }

  hasRole(role: string): boolean {
    return this.getUserPayload()?.roles.includes(role) ?? false;
  }

  getPrimaryRole(): string {
    const roles = this.getUserPayload()?.roles ?? [];
    const hierarchy = ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAREHOUSEMAN', 'ROLE_SALES'];
    const top = hierarchy.find(r => roles.includes(r));
    return top ? top.replace('ROLE_', '') : (roles[0]?.replace('ROLE_', '') ?? '');
  }

  getUsername(): string {
    return this.getUserPayload()?.sub ?? '';
  }
}
