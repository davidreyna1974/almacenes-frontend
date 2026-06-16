import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { UserFormDialogComponent } from './user-form-dialog.component';
import { UserService } from '../services/user.service';
import { AuthService } from '../../../core/auth/auth.service';
import { UserResponse } from '../models/user-response.model';

function makeUser(overrides: Partial<UserResponse> = {}): UserResponse {
  return { id: 1, username: 'testuser', email: 'test@mail.com', active: true,
           roles: ['ROLE_SALES'], createdAt: '2026-01-01T00:00:00', updatedAt: null as unknown as string, ...overrides };
}

// ─── Modo crear ──────────────────────────────────────────────────────────────

describe('UserFormDialogComponent — modo crear', () => {
  let fixture: ComponentFixture<UserFormDialogComponent>;
  let component: UserFormDialogComponent;
  let createFn:  ReturnType<typeof vi.fn>;
  let snackFn:   ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    createFn   = vi.fn();
    snackFn    = vi.fn();

    await TestBed.configureTestingModule({
      imports: [UserFormDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: MAT_DIALOG_DATA, useValue: { user: null } },
        { provide: MatDialogRef,    useValue: { close: vi.fn() } },
        { provide: UserService,     useValue: { create: createFn, update: vi.fn(), assignRoles: vi.fn(), deactivate: vi.fn() } },
        { provide: AuthService,     useValue: { getUsername: vi.fn().mockReturnValue('admin'), hasRole: vi.fn().mockReturnValue(true) } },
        { provide: MatDialog,       useValue: { open: vi.fn() } },
        { provide: MatSnackBar,     useValue: { open: snackFn } },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(UserFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('modo crear: isEdit = false', () => {
    expect(component.isEdit).toBe(false);
  });

  it('modo crear: formulario vacío al inicializar', () => {
    expect(component.form.get('username')?.value).toBe('');
    expect(component.form.get('email')?.value).toBe('');
  });

  it('sin rol seleccionado: rolesInvalid = true', () => {
    component.form.get('roles')?.setValue([]);
    expect(component.rolesInvalid).toBe(true);
  });

  it('con al menos 1 rol: rolesInvalid = false', () => {
    component.form.get('roles')?.setValue(['ROLE_ADMIN']);
    expect(component.rolesInvalid).toBe(false);
  });

  it('toggleRole agrega y quita roles correctamente', () => {
    component.form.get('roles')?.setValue([]);
    component.toggleRole('ROLE_ADMIN');
    expect(component.rolesValue).toContain('ROLE_ADMIN');
    component.toggleRole('ROLE_ADMIN');
    expect(component.rolesValue).not.toContain('ROLE_ADMIN');
  });

  it('saveDisabled = true con formulario vacío', () => {
    expect(component.saveDisabled).toBe(true);
  });

  it('onSave llama create() con datos correctos', () => {
    createFn.mockReturnValue(of(makeUser({ id: 5 })));
    component.form.setValue({ username: 'nuevo', email: 'nuevo@mail.com', password: 'Pass1234!', roles: ['ROLE_SALES'] });
    component.form.markAsDirty();
    component.onSave();
    expect(createFn).toHaveBeenCalledWith({
      username: 'nuevo', email: 'nuevo@mail.com', password: 'Pass1234!', roles: ['ROLE_SALES'],
    });
  });

  it('onSave con error del backend muestra snackbar rojo', () => {
    createFn.mockReturnValue(throwError(() => ({ error: { message: 'Username duplicado' } })));
    component.form.setValue({ username: 'dup', email: 'dup@mail.com', password: 'Pass1234!', roles: ['ROLE_SALES'] });
    component.form.markAsDirty();
    component.onSave();
    expect(snackFn).toHaveBeenCalledWith('Username duplicado', 'Cerrar', expect.anything());
  });
});

// ─── Modo editar ─────────────────────────────────────────────────────────────

describe('UserFormDialogComponent — modo editar', () => {
  let fixture: ComponentFixture<UserFormDialogComponent>;
  let component: UserFormDialogComponent;
  let getUsernameFn: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    getUsernameFn = vi.fn().mockReturnValue('admin');

    await TestBed.configureTestingModule({
      imports: [UserFormDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: MAT_DIALOG_DATA, useValue: { user: makeUser({ username: 'qa_sales', roles: ['ROLE_SALES'] }) } },
        { provide: MatDialogRef,    useValue: { close: vi.fn() } },
        { provide: UserService,     useValue: { create: vi.fn(), update: vi.fn(), assignRoles: vi.fn(), deactivate: vi.fn() } },
        { provide: AuthService,     useValue: { getUsername: getUsernameFn, hasRole: vi.fn().mockReturnValue(true) } },
        { provide: MatDialog,       useValue: { open: vi.fn() } },
        { provide: MatSnackBar,     useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(UserFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('modo editar: isEdit = true', () => {
    expect(component.isEdit).toBe(true);
  });

  it('modo editar: formulario precargado con datos del usuario', () => {
    expect(component.form.get('username')?.value).toBe('qa_sales');
    expect(component.form.get('email')?.value).toBe('test@mail.com');
  });

  it('modo editar: canDeactivate = true si el usuario no es el propio', () => {
    expect(component.canDeactivate).toBe(true);
  });

  it('modo editar: canDeactivate = false si el usuario ES el propio', () => {
    getUsernameFn.mockReturnValue('qa_sales');
    expect(component.canDeactivate).toBe(false);
  });

  it('saveDisabled = true si el formulario no está dirty', () => {
    expect(component.saveDisabled).toBe(true);
  });
});
