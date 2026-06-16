import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, throwError } from 'rxjs';
import { ProfilePageComponent } from './profile-page.component';
import { UserService } from '../services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserResponse } from '../models/user-response.model';

const mockProfile: UserResponse = {
  id: 1, username: 'admin', email: 'admin@mail.com', active: true,
  roles: ['ROLE_ADMIN'], createdAt: '2026-01-01T00:00:00', updatedAt: '2026-03-15T00:00:00',
};

describe('ProfilePageComponent', () => {
  let fixture: ComponentFixture<ProfilePageComponent>;
  let component: ProfilePageComponent;
  let getMyProfileFn: ReturnType<typeof vi.fn>;
  let openFn:         ReturnType<typeof vi.fn>;
  let snackOpenFn:    ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    getMyProfileFn = vi.fn().mockReturnValue(of(mockProfile));
    openFn         = vi.fn();
    snackOpenFn    = vi.fn();

    await TestBed.configureTestingModule({
      imports: [ProfilePageComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: UserService, useValue: { getMyProfile: getMyProfileFn } },
        { provide: MatDialog,   useValue: { open: openFn } },
        { provide: MatSnackBar, useValue: { open: snackOpenFn } },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(ProfilePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carga el perfil al inicializar', () => {
    expect(getMyProfileFn).toHaveBeenCalled();
    expect(component.profile).toEqual(mockProfile);
  });

  it('roleColor devuelve el color correcto', () => {
    expect(component.roleColor('ROLE_ADMIN')).toBe('#6B3C6B');
    expect(component.roleColor('ROLE_SALES')).toBe('#E65100');
  });

  it('roleLabel devuelve etiqueta legible', () => {
    expect(component.roleLabel('ROLE_ADMIN')).toBe('Administrador');
    expect(component.roleLabel('ROLE_WAREHOUSEMAN')).toBe('Almacenista');
  });

  it('openChangePassword abre el diálogo', () => {
    component.openChangePassword();
    expect(openFn).toHaveBeenCalled();
  });

  it('muestra snackbar de error si falla la carga del perfil', () => {
    getMyProfileFn.mockReturnValue(throwError(() => ({ error: { message: 'Error perfil' } })));
    component.load();
    expect(snackOpenFn).toHaveBeenCalledWith('Error perfil', 'Cerrar', expect.anything());
  });
});
