import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Component({ standalone: true, template: '' })
class DummyComponent {}

const FAKE_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9.' +
  btoa(JSON.stringify({ sub: 'admin', roles: ['ROLE_ADMIN'], iat: 1, exp: 9999999999 })) +
  '.signature';

function runGuard(routeData: Record<string, unknown> = {}) {
  const route = { data: routeData } as unknown as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;
  return TestBed.runInInjectionContext(() => authGuard(route, state));
}

describe('authGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'login', component: DummyComponent },
          { path: '', component: DummyComponent },
        ]),
      ],
    });
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  it('should deny access when not authenticated', () => {
    expect(runGuard()).toBe(false);
  });

  it('should allow access when authenticated', () => {
    localStorage.setItem('almacenes_token', FAKE_TOKEN);
    expect(runGuard()).toBe(true);
  });

  it('should allow access when role matches', () => {
    localStorage.setItem('almacenes_token', FAKE_TOKEN);
    expect(runGuard({ roles: ['ROLE_ADMIN'] })).toBe(true);
  });

  it('should deny access when role does not match', () => {
    localStorage.setItem('almacenes_token', FAKE_TOKEN);
    expect(runGuard({ roles: ['ROLE_SALES'] })).toBe(false);
  });
});
