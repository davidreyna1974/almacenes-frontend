import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { StockBadgeComponent } from './stock-badge.component';
import { provideAnimations } from '@angular/platform-browser/animations';

/**
 * Tests para StockBadgeComponent.
 *
 * Cubre los dos getters con lógica de umbral:
 *   - level: 'error' | 'warning' | 'success'
 *   - tooltipText: mensaje descriptivo con valores numéricos
 *
 * Se instancia el componente directamente (sin TestBed completo) para los
 * tests de getters, y con TestBed para verificar el renderizado del template.
 */
describe('StockBadgeComponent', () => {

  // ─── Tests de lógica pura (sin DOM) ───────────────────────────────────────

  describe('level getter', () => {
    let component: StockBadgeComponent;

    beforeEach(() => {
      component = new StockBadgeComponent();
    });

    it('debe retornar "error" cuando stock es 0', () => {
      component.currentStock = 0;
      component.minimumStock = 10;
      expect(component.level).toBe('error');
    });

    it('debe retornar "warning" cuando stock es menor que el mínimo', () => {
      component.currentStock = 5;
      component.minimumStock = 10;
      expect(component.level).toBe('warning');
    });

    it('debe retornar "warning" cuando stock es exactamente igual al mínimo', () => {
      // El límite: stock === minimumStock sigue siendo alerta, no éxito.
      component.currentStock = 10;
      component.minimumStock = 10;
      expect(component.level).toBe('warning');
    });

    it('debe retornar "success" cuando stock supera el mínimo', () => {
      component.currentStock = 50;
      component.minimumStock = 10;
      expect(component.level).toBe('success');
    });
  });

  // ─── Tests de tooltipText ─────────────────────────────────────────────────

  describe('tooltipText getter', () => {
    let component: StockBadgeComponent;

    beforeEach(() => {
      component = new StockBadgeComponent();
    });

    it('debe mostrar "Sin stock" cuando currentStock es 0', () => {
      component.currentStock = 0;
      component.minimumStock = 10;
      expect(component.tooltipText).toBe('Sin stock (mínimo: 10)');
    });

    it('debe mostrar "Bajo stock" con valores cuando stock es menor al mínimo', () => {
      component.currentStock = 3;
      component.minimumStock = 10;
      expect(component.tooltipText).toBe('Bajo stock — actual: 3, mínimo: 10');
    });

    it('debe mostrar "Stock OK" con valores cuando stock supera el mínimo', () => {
      component.currentStock = 45;
      component.minimumStock = 10;
      expect(component.tooltipText).toBe('Stock OK — actual: 45, mínimo: 10');
    });
  });

  // ─── Test de renderizado con TestBed ──────────────────────────────────────

  describe('renderizado', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [StockBadgeComponent],
        providers: [provideAnimations()],
      });
    });

    it('debe crearse correctamente con los inputs requeridos', () => {
      const fixture = TestBed.createComponent(StockBadgeComponent);
      const component = fixture.componentInstance;
      component.currentStock = 50;
      component.minimumStock = 10;
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });
  });
});
