import { StatusLabelPipe } from './status-label.pipe';

describe('StatusLabelPipe', () => {
  let pipe: StatusLabelPipe;

  beforeEach(() => {
    pipe = new StatusLabelPipe();
  });

  it('should translate PENDING to Pendiente', () => {
    expect(pipe.transform('PENDING')).toBe('Pendiente');
  });

  it('should translate APPROVED to Aprobado', () => {
    expect(pipe.transform('APPROVED')).toBe('Aprobado');
  });

  it('should translate RECEIVED to Recibido', () => {
    expect(pipe.transform('RECEIVED')).toBe('Recibido');
  });

  it('should translate DELIVERED to Entregado', () => {
    expect(pipe.transform('DELIVERED')).toBe('Entregado');
  });

  it('should translate CANCELLED to Cancelado', () => {
    expect(pipe.transform('CANCELLED')).toBe('Cancelado');
  });

  it('should translate ACTIVE to Activo', () => {
    expect(pipe.transform('ACTIVE')).toBe('Activo');
  });

  it('should translate INACTIVE to Inactivo', () => {
    expect(pipe.transform('INACTIVE')).toBe('Inactivo');
  });

  it('should return the original value for unknown statuses', () => {
    expect(pipe.transform('UNKNOWN_STATUS')).toBe('UNKNOWN_STATUS');
  });
});
