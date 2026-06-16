import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { ChangePasswordDialogComponent } from './change-password-dialog.component';
import { UserService } from '../services/user.service';

describe('ChangePasswordDialogComponent', () => {
  let fixture: ComponentFixture<ChangePasswordDialogComponent>;
  let component: ChangePasswordDialogComponent;
  let changePasswordFn: ReturnType<typeof vi.fn>;
  let snackOpenFn:      ReturnType<typeof vi.fn>;
  let closeFn:          ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    changePasswordFn = vi.fn();
    snackOpenFn      = vi.fn();
    closeFn          = vi.fn();

    await TestBed.configureTestingModule({
      imports: [ChangePasswordDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: UserService,  useValue: { changePassword: changePasswordFn } },
        { provide: MatSnackBar,  useValue: { open: snackOpenFn } },
        { provide: MatDialogRef, useValue: { close: closeFn } },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(ChangePasswordDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('formulario inválido al inicializar (campos vacíos)', () => {
    expect(component.form.invalid).toBe(true);
  });

  it('saveDisabled = true con formulario vacío', () => {
    expect(component.saveDisabled).toBe(true);
  });

  it('mismatch = true cuando nuevas contraseñas no coinciden', () => {
    component.form.patchValue({ newPassword: 'NewPass1!', confirmPassword: 'Diferente1!' });
    component.form.get('confirmPassword')?.markAsDirty();
    expect(component.mismatch).toBe(true);
  });

  it('mismatch = false cuando contraseñas coinciden', () => {
    component.form.patchValue({ newPassword: 'NewPass1!', confirmPassword: 'NewPass1!' });
    component.form.get('confirmPassword')?.markAsDirty();
    expect(component.mismatch).toBe(false);
  });

  it('onSave llama changePassword con los 3 campos', () => {
    changePasswordFn.mockReturnValue(of(undefined));
    component.form.setValue({ currentPassword: 'Old1!', newPassword: 'New1Pass!', confirmPassword: 'New1Pass!' });
    component.onSave();
    expect(changePasswordFn).toHaveBeenCalledWith({
      currentPassword: 'Old1!', newPassword: 'New1Pass!', confirmPassword: 'New1Pass!',
    });
  });

  it('onSave exitoso muestra snackbar verde y cierra el diálogo', () => {
    changePasswordFn.mockReturnValue(of(undefined));
    component.form.setValue({ currentPassword: 'Old1!', newPassword: 'New1Pass!', confirmPassword: 'New1Pass!' });
    component.onSave();
    expect(snackOpenFn).toHaveBeenCalledWith('Contraseña cambiada correctamente.', 'Cerrar', expect.anything());
    expect(closeFn).toHaveBeenCalled();
  });

  it('onSave con error del backend muestra snackbar rojo con mensaje', () => {
    changePasswordFn.mockReturnValue(throwError(() => ({ error: { message: 'La contraseña actual es incorrecta.' } })));
    component.form.setValue({ currentPassword: 'Wrong!', newPassword: 'New1Pass!', confirmPassword: 'New1Pass!' });
    component.onSave();
    expect(snackOpenFn).toHaveBeenCalledWith('La contraseña actual es incorrecta.', 'Cerrar', expect.anything());
  });

  it('nueva contraseña < 8 chars hace formulario inválido', () => {
    component.form.patchValue({ newPassword: 'short' });
    expect(component.form.get('newPassword')?.hasError('minlength')).toBe(true);
  });
});
