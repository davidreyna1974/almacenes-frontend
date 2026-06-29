import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, throwError } from 'rxjs';
import { UsersPageComponent } from './users-page.component';
import { UserService } from '../services/user.service';
import { LayoutService } from '../../../core/layout/layout.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserResponse } from '../models/user-response.model';
import { PageResponse } from '../../../shared/models/page-response.model';

function makeUser(id: number, username: string, roles = ['ROLE_ADMIN']): UserResponse {
  return { id, username, email: `${username}@mail.com`, active: true, roles,
           createdAt: '2026-01-01T00:00:00', updatedAt: null as unknown as string };
}

function makePage(users: UserResponse[]): PageResponse<UserResponse> {
  return { content: users, currentPage: 0, totalPages: 1,
           totalElements: users.length, size: 20, first: true, last: true };
}

describe('UsersPageComponent', () => {
  let fixture: ComponentFixture<UsersPageComponent>;
  let component: UsersPageComponent;
  let getAllFn:    ReturnType<typeof vi.fn>;
  let openFn:     ReturnType<typeof vi.fn>;
  let snackOpenFn: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    getAllFn     = vi.fn().mockReturnValue(of(makePage([makeUser(1, 'admin'), makeUser(2, 'qa_sales', ['ROLE_SALES'])])));
    openFn      = vi.fn();
    snackOpenFn = vi.fn();

    await TestBed.configureTestingModule({
      imports: [UsersPageComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: UserService,   useValue: { getAll: getAllFn } },
        { provide: MatDialog,     useValue: { open: openFn } },
        { provide: MatSnackBar,   useValue: { open: snackOpenFn } },
        { provide: LayoutService, useValue: { collapse: vi.fn() } },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(UsersPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carga los usuarios al inicializar', () => {
    expect(getAllFn).toHaveBeenCalledWith(0, 20);
    expect(component.allUsers.length).toBe(2);
    expect(component.filtered.length).toBe(2);
  });

  it('roleColor devuelve el color correcto por rol', () => {
    expect(component.roleColor('ROLE_ADMIN')).toBe('#6B3C6B');
    expect(component.roleColor('ROLE_MANAGER')).toBe('#1565C0');
    expect(component.roleColor('ROLE_WAREHOUSEMAN')).toBe('#2E7D32');
    expect(component.roleColor('ROLE_SALES')).toBe('#E65100');
  });

  it('roleLabel devuelve la etiqueta legible por rol', () => {
    expect(component.roleLabel('ROLE_ADMIN')).toBe('Admin');
    expect(component.roleLabel('ROLE_MANAGER')).toBe('Manager');
    expect(component.roleLabel('ROLE_WAREHOUSEMAN')).toBe('Almacenista');
    expect(component.roleLabel('ROLE_SALES')).toBe('Ventas');
  });

  it('filtra usuarios por username (client-side, case insensitive)', () => {
    component.searchCtrl.setValue('ADMIN');
    component['applyFilter']('ADMIN');
    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].username).toBe('admin');
  });

  it('filtra usuarios por email (client-side)', () => {
    component['applyFilter']('qa_sales');
    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].username).toBe('qa_sales');
  });

  it('sin resultados devuelve array vacío', () => {
    component['applyFilter']('zzz_no_existe');
    expect(component.filtered.length).toBe(0);
  });

  it('onRowClick abre el diálogo con el usuario', () => {
    openFn.mockReturnValue({ afterClosed: () => of(false) });
    component.onRowClick(makeUser(1, 'admin'));
    expect(openFn).toHaveBeenCalled();
  });

  it('openNew abre el diálogo con user=null', () => {
    openFn.mockReturnValue({ afterClosed: () => of(false) });
    component.openNew();
    const args = openFn.mock.lastCall!;
    expect((args[1] as { data: { user: null } }).data.user).toBeNull();
  });

  it('cuando el diálogo retorna true, recarga la lista', () => {
    openFn.mockReturnValue({ afterClosed: () => of(true) });
    getAllFn.mockClear();
    component.openNew();
    expect(getAllFn).toHaveBeenCalled();
  });

  it('muestra snackbar de error si falla la carga', () => {
    getAllFn.mockReturnValue(throwError(() => ({ error: { message: 'Error carga' } })));
    component.load();
    expect(snackOpenFn).toHaveBeenCalledWith('Error carga', 'Cerrar', expect.anything());
  });
});
