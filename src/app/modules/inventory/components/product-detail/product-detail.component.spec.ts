import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ProductDetailComponent } from './product-detail.component';

/**
 * Tests para ProductDetailComponent.
 *
 * Cubre los dos métodos de traducción con lógica de negocio:
 *   - getStatusLabel(): traduce ProductStatus al texto español mostrado en la vista.
 *   - getMovementTypeLabel(): traduce IN/OUT al texto de la columna Tipo en el Kardex.
 */
describe('ProductDetailComponent', () => {
  let component: ProductDetailComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProductDetailComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideAnimations()],
    });
    const fixture = TestBed.createComponent(ProductDetailComponent);
    component = fixture.componentInstance;
  });

  // ─── getStatusLabel ───────────────────────────────────────────────────────

  describe('getStatusLabel', () => {

    it('debe retornar "Disponible" para AVAILABLE', () => {
      expect(component.getStatusLabel('AVAILABLE')).toBe('Disponible');
    });

    it('debe retornar "Descontinuado" para DISCONTINUED', () => {
      expect(component.getStatusLabel('DISCONTINUED')).toBe('Descontinuado');
    });

    it('debe retornar "Sin stock" para OUT_OF_STOCK', () => {
      expect(component.getStatusLabel('OUT_OF_STOCK')).toBe('Sin stock');
    });

    it('debe retornar el valor original cuando el status no está en el mapa (fallback)', () => {
      expect(component.getStatusLabel('VALOR_DESCONOCIDO')).toBe('VALOR_DESCONOCIDO');
    });

  });

  // ─── getMovementTypeLabel ─────────────────────────────────────────────────

  describe('getMovementTypeLabel', () => {

    it('debe retornar "Entrada" para IN', () => {
      expect(component.getMovementTypeLabel('IN')).toBe('Entrada');
    });

    it('debe retornar "Salida" para OUT', () => {
      expect(component.getMovementTypeLabel('OUT')).toBe('Salida');
    });

    it('debe retornar "Salida" para cualquier valor distinto de IN (rama else)', () => {
      expect(component.getMovementTypeLabel('UNKNOWN')).toBe('Salida');
    });

  });
});
