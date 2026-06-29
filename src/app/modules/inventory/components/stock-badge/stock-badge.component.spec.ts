import { TestBed } from '@angular/core/testing';
import { StockBadgeComponent } from './stock-badge.component';
import { provideAnimations } from '@angular/platform-browser/animations';

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

  // ─── Tests de availableStock getter ──────────────────────────────────────

  describe('availableStock getter', () => {
    let component: StockBadgeComponent;

    beforeEach(() => {
      component = new StockBadgeComponent();
    });

    it('debe ser igual a currentStock cuando reservedStock es 0 (default)', () => {
      component.currentStock = 50;
      component.minimumStock = 10;
      expect(component.availableStock).toBe(50);
    });

    it('debe restar reservedStock a currentStock', () => {
      component.currentStock = 100;
      component.minimumStock = 10;
      component.reservedStock = 30;
      expect(component.availableStock).toBe(70);
    });
  });

  // ─── Tests de tooltipText ─────────────────────────────────────────────────

  describe('tooltipText getter — sin reservedStock', () => {
    let component: StockBadgeComponent;

    beforeEach(() => {
      component = new StockBadgeComponent();
    });

    it('debe mostrar "Sin stock" cuando currentStock es 0', () => {
      component.currentStock = 0;
      component.minimumStock = 10;
      expect(component.tooltipText).toBe('Sin stock · Mínimo: 10');
    });

    it('debe mostrar "Bajo stock" con valores cuando stock es menor al mínimo', () => {
      component.currentStock = 3;
      component.minimumStock = 10;
      expect(component.tooltipText).toBe('Bajo stock · Físico: 3 · Mínimo: 10');
    });

    it('debe mostrar "Stock OK" con valores cuando stock supera el mínimo', () => {
      component.currentStock = 45;
      component.minimumStock = 10;
      expect(component.tooltipText).toBe('Stock OK · Físico: 45 · Mínimo: 10');
    });
  });

  describe('tooltipText getter — con reservedStock', () => {
    let component: StockBadgeComponent;

    beforeEach(() => {
      component = new StockBadgeComponent();
    });

    it('debe incluir reservado y disponible cuando reservedStock > 0 y stock OK', () => {
      component.currentStock = 100;
      component.minimumStock = 10;
      component.reservedStock = 20;
      expect(component.tooltipText).toBe('Stock OK · Físico: 100 · Reservado: 20 · Disponible: 80 · Mínimo: 10');
    });

    it('debe incluir reservado y disponible cuando reservedStock > 0 y bajo stock', () => {
      component.currentStock = 8;
      component.minimumStock = 10;
      component.reservedStock = 3;
      expect(component.tooltipText).toBe('Bajo stock · Físico: 8 · Reservado: 3 · Disponible: 5 · Mínimo: 10');
    });

    it('no debe incluir reservado en tooltip cuando reservedStock es 0', () => {
      component.currentStock = 50;
      component.minimumStock = 10;
      component.reservedStock = 0;
      expect(component.tooltipText).not.toContain('Reservado');
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
