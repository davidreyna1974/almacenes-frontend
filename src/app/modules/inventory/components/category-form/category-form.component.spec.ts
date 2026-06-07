import { TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { CategoryFormComponent } from './category-form.component';
import { CategoryDTO } from '../../models/category.model';

const mockCategory: CategoryDTO = {
  id: 1,
  name: 'Herramientas',
  description: 'Herramientas industriales',
  active: true,
  createdAt: '2026-01-01T00:00:00',
  createdByUsername: 'admin',
};

/**
 * Tests para CategoryFormComponent.
 *
 * Cubre el input `canDeactivate` y el output `deactivate`:
 *   - El botón "Desactivar" solo es visible cuando canDeactivate=true e isEdit=true.
 *   - El botón emite el output `deactivate` al hacer clic.
 *
 * CategoryFormComponent es un dumb component — no inyecta servicios.
 * Se puede instanciar con TestBed mínimo (solo provideAnimations para MatSpinner).
 */
describe('CategoryFormComponent', () => {
  function setup(item: CategoryDTO | null, canDeactivate: boolean) {
    TestBed.configureTestingModule({
      imports: [CategoryFormComponent],
      providers: [provideAnimations()],
    });
    const fixture = TestBed.createComponent(CategoryFormComponent);
    const component = fixture.componentInstance;
    // setInput() is the correct Angular API for testing @Input properties:
    // it properly triggers ngOnChanges so form reset and conditional rendering work.
    fixture.componentRef.setInput('item', item);
    fixture.componentRef.setInput('canDeactivate', canDeactivate);
    fixture.detectChanges();
    return { fixture, component };
  }

  // ─── Visibilidad del botón Desactivar ─────────────────────────────────────

  describe('botón Desactivar', () => {

    it('debe estar visible cuando canDeactivate=true e isEdit=true (item cargado)', () => {
      const { fixture } = setup(mockCategory, true);
      const btn: HTMLElement | null = fixture.nativeElement.querySelector('button[color="warn"]');
      expect(btn).not.toBeNull();
      expect(btn?.textContent?.trim()).toBe('Desactivar');
    });

    it('NO debe estar visible cuando canDeactivate=false aunque sea edición', () => {
      const { fixture } = setup(mockCategory, false);
      const btn: HTMLElement | null = fixture.nativeElement.querySelector('button[color="warn"]');
      expect(btn).toBeNull();
    });

    it('NO debe estar visible cuando canDeactivate=true pero es nueva categoría (item=null)', () => {
      const { fixture } = setup(null, true);
      const btn: HTMLElement | null = fixture.nativeElement.querySelector('button[color="warn"]');
      expect(btn).toBeNull();
    });

  });

  // ─── Output deactivate ────────────────────────────────────────────────────

  describe('output deactivate', () => {

    it('debe emitir el evento deactivate al hacer clic en el botón Desactivar', () => {
      const { fixture, component } = setup(mockCategory, true);
      let emitted = false;
      component.deactivate.subscribe(() => (emitted = true));

      const btn: HTMLElement = fixture.nativeElement.querySelector('button[color="warn"]');
      btn.click();

      expect(emitted).toBe(true);
    });

  });

  // ─── Output save ──────────────────────────────────────────────────────────

  describe('output save', () => {

    it('debe emitir save con el CategoryRequest correcto cuando el formulario es válido', () => {
      const { component } = setup(null, false);
      let emittedValue: { name: string; description?: string } | undefined;
      component.save.subscribe(v => (emittedValue = v));

      component.form.patchValue({ name: 'Nuevas herramientas', description: 'Desc' });
      component.submit();

      expect(emittedValue).toEqual({ name: 'Nuevas herramientas', description: 'Desc' });
    });

    it('no debe emitir save cuando el nombre está vacío (required falla)', () => {
      const { component } = setup(null, false);
      let emitted = false;
      component.save.subscribe(() => (emitted = true));

      component.form.patchValue({ name: '' });
      component.submit();

      expect(emitted).toBe(false);
    });

  });

  // ─── Output cancel ────────────────────────────────────────────────────────

  describe('output cancel', () => {

    it('debe emitir cancel al hacer clic en el botón Cancelar', () => {
      const { fixture, component } = setup(null, false);
      let emitted = false;
      component.cancel.subscribe(() => (emitted = true));

      // setup(null, false) no muestra el botón Desactivar → el único mat-stroked-button es Cancelar
      const btn: HTMLElement = fixture.nativeElement.querySelector('button[mat-stroked-button]');
      btn.click();

      expect(emitted).toBe(true);
    });

  });

  // ─── Precarga de datos ────────────────────────────────────────────────────

  describe('precarga al editar', () => {

    it('debe inicializar el formulario con name y description del item recibido', () => {
      const { component } = setup(mockCategory, false);

      expect(component.form.value).toEqual({
        name:        mockCategory.name,
        description: mockCategory.description,
      });
    });

  });
});
