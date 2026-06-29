import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import { UserResponse } from '../models/user-response.model';
import { PageResponse } from '../../../shared/models/page-response.model';
import { environment } from '../../../../environments/environment';

const BASE = `${environment.apiUrl}/auth`;

function makeUser(overrides: Partial<UserResponse> = {}): UserResponse {
  return {
    id: 1, username: 'testuser', email: 'test@mail.com',
    active: true, roles: ['ROLE_ADMIN'],
    createdAt: '2026-01-01T00:00:00', updatedAt: '2026-01-02T00:00:00',
    ...overrides,
  };
}

describe('UserService', () => {
  let service: UserService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getAll() llama GET /auth/users con params page y size', () => {
    const page: PageResponse<UserResponse> = {
      content: [makeUser()], currentPage: 0, totalPages: 1,
      totalElements: 1, size: 20, first: true, last: true,
    };
    service.getAll(0, 20).subscribe();
    const req = http.expectOne(r => r.url === `${BASE}/users`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    req.flush(page);
  });

  it('getById() llama GET /auth/users/{id}', () => {
    service.getById(5).subscribe();
    const req = http.expectOne(`${BASE}/users/5`);
    expect(req.request.method).toBe('GET');
    req.flush(makeUser({ id: 5 }));
  });

  it('create() llama POST /auth/users con el body y retorna 201', () => {
    const dto = { username: 'nuevo', email: 'nuevo@mail.com', password: 'Pass1234!', roles: ['ROLE_SALES'] };
    service.create(dto).subscribe();
    const req = http.expectOne(`${BASE}/users`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(makeUser({ id: 10 }), { status: 201, statusText: 'Created' });
  });

  it('update() llama PUT /auth/users/{id} con username y email', () => {
    const dto = { username: 'upd', email: 'upd@mail.com' };
    service.update(1, dto).subscribe();
    const req = http.expectOne(`${BASE}/users/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);
    req.flush(makeUser({ ...dto }));
  });

  it('deactivate() llama DELETE /auth/users/{id} y retorna 204', () => {
    let called = false;
    service.deactivate(3).subscribe(() => (called = true));
    const req = http.expectOne(`${BASE}/users/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(called).toBe(true);
  });

  it('assignRoles() llama PUT /auth/users/{id}/roles', () => {
    const dto = { roles: ['ROLE_MANAGER'] };
    service.assignRoles(2, dto).subscribe();
    const req = http.expectOne(`${BASE}/users/2/roles`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);
    req.flush(makeUser({ roles: ['ROLE_MANAGER'] }));
  });

  it('getMyProfile() llama GET /auth/me', () => {
    service.getMyProfile().subscribe();
    const req = http.expectOne(`${BASE}/me`);
    expect(req.request.method).toBe('GET');
    req.flush(makeUser());
  });

  it('changePassword() llama PUT /auth/me/password y retorna 204', () => {
    const dto = { currentPassword: 'OldPass1!', newPassword: 'NewPass1!', confirmPassword: 'NewPass1!' };
    let called = false;
    service.changePassword(dto).subscribe(() => (called = true));
    const req = http.expectOne(`${BASE}/me/password`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(called).toBe(true);
  });
});
