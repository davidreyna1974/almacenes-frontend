import { TestBed } from '@angular/core/testing';
import { DateAdapter, MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { DdMmYyyyDateAdapter } from './dd-mm-yyyy-date-adapter';

/**
 * Verifica que el parseo de texto tecleado interprete dd/MM/yyyy (no M/d/yyyy),
 * que es el desajuste que tenía el NativeDateAdapter con locale es-PE.
 */
describe('DdMmYyyyDateAdapter', () => {
  let adapter: DdMmYyyyDateAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideNativeDateAdapter(),
        { provide: DateAdapter, useClass: DdMmYyyyDateAdapter },
        { provide: MAT_DATE_LOCALE, useValue: 'es-PE' },
      ],
    });
    adapter = TestBed.inject(DateAdapter) as DdMmYyyyDateAdapter;
  });

  it('parsea dd/MM/yyyy con día > 12 (el caso que fallaba)', () => {
    const d = adapter.parse('31/12/2026');
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(11); // diciembre (0-based)
    expect(d!.getDate()).toBe(31);
  });

  it('parsea fechas ambiguas como dd/MM (01/02 = 1 de febrero)', () => {
    const d = adapter.parse('01/02/2026');
    expect(d!.getMonth()).toBe(1); // febrero
    expect(d!.getDate()).toBe(1);
  });

  it('rechaza orden M/d/yyyy con mes > 12 (12/31 → mes 31 inválido)', () => {
    const d = adapter.parse('12/31/2026');
    expect(adapter.isValid(d as Date)).toBe(false);
  });

  it('rechaza fechas inexistentes (31/02/2026)', () => {
    const d = adapter.parse('31/02/2026');
    expect(adapter.isValid(d as Date)).toBe(false);
  });

  it('admite separadores - y .', () => {
    expect(adapter.parse('15-06-2026')!.getMonth()).toBe(5);
    expect(adapter.parse('15.06.2026')!.getDate()).toBe(15);
  });

  it('cadena vacía → null', () => {
    expect(adapter.parse('')).toBeNull();
    expect(adapter.parse('   ')).toBeNull();
  });
});
