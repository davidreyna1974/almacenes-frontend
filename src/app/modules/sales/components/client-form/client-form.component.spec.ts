import { TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ClientFormComponent } from './client-form.component';
import { ClientDTO } from '../../models/client.model';

const mockClient: ClientDTO = {
  id: 1,
  name: 'Distribuidora del Norte',
  rfc: 'ABC123456789',
  contactName: 'Juan Pérez',
  phone: '5551234567',
  email: 'contacto@dn.com',
  address: 'Calle 1',
  active: true,
  createdAt: '2026-01-01T00:00:00',
  createdById: 1,
  createdByUsername: 'admin',
  updatedAt: null,
  updatedById: null,
  updatedByUsername: null,
};

/**
 * ClientFormComponent es un dumb component — no inyecta servicios.
 * setInput() dispara ngOnChanges para precarga del form y habilitar/deshabilitar (canWrite).
 */
describe('ClientFormComponent', () => {
  function setup(item: ClientDTO | null, canWrite: boolean, canDeactivate = false) {
    TestBed.configureTestingModule({
      imports: [ClientFormComponent],
      providers: [provideAnimations()],
    });
    const fixture = TestBed.createComponent(ClientFormComponent);
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('item', item);
    fixture.componentRef.setInput('canWrite', canWrite);
    fixture.componentRef.setInput('canDeactivate', canDeactivate);
    fixture.detectChanges();
    return { fixture, component };
  }

  // ─── Precarga de datos ────────────────────────────────────────────────────

  describe('precarga al editar', () => {
    it('debe inicializar el formulario con los datos del item recibido', () => {
      const { component } = setup(mockClient, true);

      expect(component.form.value).toEqual({
        name: mockClient.name,
        rfc: mockClient.rfc,
        contactName: mockClient.contactName,
        phone: mockClient.phone,
        email: mockClient.email,
        address: mockClient.address,
      });
    });

    it('debe inicializar el formulario vacío cuando item es null (nuevo cliente)', () => {
      const { component } = setup(null, true);

      expect(component.form.value).toEqual({
        name: '', rfc: '', contactName: '', phone: '', email: '', address: '',
      });
    });
  });

  // ─── canWrite: habilitar/deshabilitar formulario ──────────────────────────

  describe('canWrite', () => {
    it('debe deshabilitar el formulario cuando canWrite=false', () => {
      const { component } = setup(mockClient, false);
      expect(component.form.disabled).toBe(true);
    });

    it('debe habilitar el formulario cuando canWrite=true', () => {
      const { component } = setup(mockClient, true);
      expect(component.form.enabled).toBe(true);
    });
  });

  // ─── Output save ──────────────────────────────────────────────────────────

  describe('output save', () => {
    it('debe emitir save con el ClientRequest correcto cuando el formulario es válido', () => {
      const { component } = setup(null, true);
      let emitted: unknown;
      component.save.subscribe(v => (emitted = v));

      component.form.patchValue({ name: 'Cliente Nuevo' });
      component.submit();

      expect(emitted).toEqual({
        name: 'Cliente Nuevo', rfc: null, contactName: null, phone: null, email: null, address: null,
      });
    });

    it('no debe emitir save cuando el nombre está vacío (required falla)', () => {
      const { component } = setup(null, true);
      let emitted = false;
      component.save.subscribe(() => (emitted = true));

      component.form.patchValue({ name: '' });
      component.submit();

      expect(emitted).toBe(false);
    });

    it('no debe emitir save cuando canWrite=false aunque el formulario sea válido', () => {
      const { component } = setup(mockClient, false);
      let emitted = false;
      component.save.subscribe(() => (emitted = true));

      component.submit();

      expect(emitted).toBe(false);
    });
  });

  // ─── Output cancel ────────────────────────────────────────────────────────

  describe('output cancel', () => {
    it('debe emitir cancel al hacer clic en el botón Cancelar', () => {
      const { fixture, component } = setup(null, true);
      let emitted = false;
      component.cancel.subscribe(() => (emitted = true));

      const btn: HTMLElement = fixture.nativeElement.querySelector('button[mat-stroked-button]');
      btn.click();

      expect(emitted).toBe(true);
    });
  });

  // ─── Botón Desactivar ──────────────────────────────────────────────────────

  describe('botón Desactivar', () => {
    it('debe estar visible cuando canDeactivate=true, isEdit=true y el cliente está activo', () => {
      const { fixture } = setup(mockClient, true, true);
      const btn: HTMLElement | null = fixture.nativeElement.querySelector('button[color="warn"]');
      expect(btn).not.toBeNull();
      expect(btn?.textContent?.trim()).toBe('Desactivar');
    });

    it('NO debe estar visible cuando canDeactivate=false', () => {
      const { fixture } = setup(mockClient, true, false);
      const btn: HTMLElement | null = fixture.nativeElement.querySelector('button[color="warn"]');
      expect(btn).toBeNull();
    });

    it('NO debe estar visible cuando el cliente ya está inactivo', () => {
      const { fixture } = setup({ ...mockClient, active: false }, true, true);
      const btn: HTMLElement | null = fixture.nativeElement.querySelector('button[color="warn"]');
      expect(btn).toBeNull();
    });

    it('NO debe estar visible para un cliente nuevo (item=null)', () => {
      const { fixture } = setup(null, true, true);
      const btn: HTMLElement | null = fixture.nativeElement.querySelector('button[color="warn"]');
      expect(btn).toBeNull();
    });

    it('debe emitir el evento deactivate al hacer clic', () => {
      const { fixture, component } = setup(mockClient, true, true);
      let emitted = false;
      component.deactivate.subscribe(() => (emitted = true));

      const btn: HTMLElement = fixture.nativeElement.querySelector('button[color="warn"]');
      btn.click();

      expect(emitted).toBe(true);
    });
  });

  // ─── L25: botón Guardar deshabilitado sin cambios en edición ──────────────

  describe('L25 — dirty check en edición', () => {
    it('el botón Guardar está deshabilitado en edición si el formulario no fue modificado', () => {
      const { fixture } = setup(mockClient, true);
      const submitBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitBtn.disabled).toBe(true);
    });

    it('el botón Guardar se habilita en edición tras modificar un campo', () => {
      const { fixture, component } = setup(mockClient, true);
      component.form.get('phone')?.setValue('5559999999');
      component.form.get('phone')?.markAsDirty();
      fixture.detectChanges();
      const submitBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitBtn.disabled).toBe(false);
    });
  });
});
