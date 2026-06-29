import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { AuthService } from './auth.service';

@Component({ standalone: true, template: '' })
class DummyComponent {}

// JWT con payload: { sub: 'admin', roles: ['ROLE_ADMIN'], iat: 1, exp: 9999999999 }
const FAKE_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9.' +
  btoa(JSON.stringify({ sub: 'admin', roles: ['ROLE_ADMIN'], iat: 1, exp: 9999999999 })) +
  '.signature';

const EXPIRED_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9.' +
  btoa(JSON.stringify({ sub: 'admin', roles: ['ROLE_ADMIN'], iat: 1, exp: 1 })) +
  '.signature';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', component: DummyComponent }]),
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store token in localStorage after login', () => {
    service.login({ username: 'admin', password: 'Admin123!' }).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/auth/login'));
    req.flush({ token: FAKE_TOKEN });
    expect(localStorage.getItem('almacenes_token')).toBe(FAKE_TOKEN);
  });

  it('should return null when no token', () => {
    expect(service.getToken()).toBeNull();
    expect(service.getUserPayload()).toBeNull();
  });

  it('should decode token payload correctly', () => {
    localStorage.setItem('almacenes_token', FAKE_TOKEN);
    const payload = service.getUserPayload();
    expect(payload?.sub).toBe('admin');
    expect(payload?.roles).toContain('ROLE_ADMIN');
  });

  it('should return true for valid token', () => {
    localStorage.setItem('almacenes_token', FAKE_TOKEN);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should return false for expired token', () => {
    localStorage.setItem('almacenes_token', EXPIRED_TOKEN);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should return false when no token', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should return true for correct role', () => {
    localStorage.setItem('almacenes_token', FAKE_TOKEN);
    expect(service.hasRole('ROLE_ADMIN')).toBe(true);
  });

  it('should return false for incorrect role', () => {
    localStorage.setItem('almacenes_token', FAKE_TOKEN);
    expect(service.hasRole('ROLE_SALES')).toBe(false);
  });

  it('should return primary role without ROLE_ prefix', () => {
    localStorage.setItem('almacenes_token', FAKE_TOKEN);
    expect(service.getPrimaryRole()).toBe('ADMIN');
  });

  it('should return highest-priority role when user has multiple roles', () => {
    const multiRoleToken =
      'eyJhbGciOiJIUzI1NiJ9.' +
      btoa(JSON.stringify({ sub: 'multi', roles: ['ROLE_SALES', 'ROLE_ADMIN'], iat: 1, exp: 9999999999 })) +
      '.signature';
    localStorage.setItem('almacenes_token', multiRoleToken);
    expect(service.getPrimaryRole()).toBe('ADMIN');
  });

  it('should return username from token', () => {
    localStorage.setItem('almacenes_token', FAKE_TOKEN);
    expect(service.getUsername()).toBe('admin');
  });

  it('should remove token on logout', () => {
    localStorage.setItem('almacenes_token', FAKE_TOKEN);
    service.logout();
    expect(localStorage.getItem('almacenes_token')).toBeNull();
  });
});
