import { TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { SupplierFormComponent } from './supplier-form.component';
import { SupplierDTO } from '../../models/supplier.model';

function makeSupplier(overrides: Partial<SupplierDTO> = {}): SupplierDTO {
  return {
    id: 1, rfc: 'ABC123456789', companyName: 'Proveedor Test',
    contactName: 'Juan', phone: '5551234567', email: 'test@prov.com',
    address: 'Calle 1', active: true,
    createdAt: '2026-01-01T00:00:00', createdById: 1, createdByUsername: 'admin',
    updatedAt: null, updatedById: null, updatedByUsername: null,
    ...overrides,
  };
}

function setup(inputs: {
  supplier?: SupplierDTO | null;
  isEdit?: boolean;
  canWrite?: boolean;
  canDeactivate?: boolean;
} = {}) {
  TestBed.configureTestingModule({
    imports: [SupplierFormComponent],
    providers: [provideAnimations()],
  });
  const fixture = TestBed.createComponent(SupplierFormComponent);
  const comp = fixture.componentInstance;
  if (inputs.supplier   !== undefined) fixture.componentRef.setInput('supplier',   inputs.supplier);
  if (inputs.isEdit     !== undefined) fixture.componentRef.setInput('isEdit',     inputs.isEdit);
  if (inputs.canWrite   !== undefined) fixture.componentRef.setInput('canWrite',   inputs.canWrite);
  if (inputs.canDeactivate !== undefined) fixture.componentRef.setInput('canDeactivate', inputs.canDeactivate);
  fixture.detectChanges();
  return { fixture, comp };
}

describe('SupplierFormComponent', () => {

  it('debe crearse correctamente', () => {
    const { comp } = setup({ canWrite: true });
    expect(comp).toBeTruthy();
  });

  it('precarga el formulario con los datos del proveedor recibido', () => {
    const supplier = makeSupplier();
    const { comp } = setup({ supplier, isEdit: true, canWrite: true });
    expect(comp.form.value.companyName).toBe('Proveedor Test');
    expect(comp.form.value.rfc).toBe('ABC123456789');
    expect(comp.form.value.email).toBe('test@prov.com');
  });

  it('emite save con los datos del formulario al hacer submit válido', () => {
    const { comp } = setup({ canWrite: true });
    comp.form.setValue({
      rfc: 'XYZ999888771', companyName: 'Nuevo Prov', contactName: '',
      phone: '', email: '', address: '',
    });
    const emitido: SupplierDTO[] = [];
    comp.save.subscribe(v => emitido.push(v));
    comp.submit();
    expect(emitido.length).toBe(1);
    expect(emitido[0].companyName).toBe('Nuevo Prov');
    expect(emitido[0].rfc).toBe('XYZ999888771');
  });

  it('no emite save si el formulario es inválido (rfc vacío)', () => {
    const { comp } = setup({ canWrite: true });
    comp.form.patchValue({ rfc: '', companyName: 'Test' });
    const emitido: SupplierDTO[] = [];
    comp.save.subscribe(v => emitido.push(v));
    comp.submit();
    expect(emitido.length).toBe(0);
  });

  it('no emite save si canWrite es false', () => {
    const { comp } = setup({ canWrite: false });
    comp.form.setValue({
      rfc: 'ABC123456789', companyName: 'Test',
      contactName: '', phone: '', email: '', address: '',
    });
    const emitido: SupplierDTO[] = [];
    comp.save.subscribe(v => emitido.push(v));
    comp.submit();
    expect(emitido.length).toBe(0);
  });

  it('emite cancel al llamar cancel.emit()', () => {
    const { comp } = setup({ canWrite: true });
    let emitido = false;
    comp.cancel.subscribe(() => (emitido = true));
    comp.cancel.emit();
    expect(emitido).toBe(true);
  });

  it('botón Desactivar presente solo con canDeactivate=true e isEdit=true', () => {
    const { fixture } = setup({ supplier: makeSupplier(), isEdit: true, canWrite: true, canDeactivate: true });
    const btn = fixture.nativeElement.querySelector('button[color="warn"]');
    expect(btn).toBeTruthy();
  });

  it('botón Desactivar ausente cuando canDeactivate=false', () => {
    const { fixture } = setup({ supplier: makeSupplier(), isEdit: true, canWrite: true, canDeactivate: false });
    const btn = fixture.nativeElement.querySelector('button[color="warn"]');
    expect(btn).toBeNull();
  });
});
