import { TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StockPreviewDialogComponent, StockPreviewDialogData } from './stock-preview-dialog.component';

function setup(data: StockPreviewDialogData) {
  let closedWith: boolean | undefined;
  const mockDialogRef = { close: (val?: boolean) => { closedWith = val; } };

  TestBed.configureTestingModule({
    imports: [StockPreviewDialogComponent],
    providers: [
      provideAnimations(),
      { provide: MatDialogRef, useValue: mockDialogRef },
      { provide: MAT_DIALOG_DATA, useValue: data },
    ],
  });

  const fixture = TestBed.createComponent(StockPreviewDialogComponent);
  const comp = fixture.componentInstance;
  fixture.detectChanges();

  return { fixture, comp, get closedWith() { return closedWith; } };
}

const ITEMS_SUFICIENTES = [
  { productSku: 'LUB-001', productName: 'Aceite Lubricante', quantity: 5, available: 10 },
  { productSku: 'HER-002', productName: 'Amoladora', quantity: 2, available: 2 },
];

const ITEMS_INSUFICIENTES = [
  { productSku: 'LUB-001', productName: 'Aceite Lubricante', quantity: 5, available: 10 },
  { productSku: 'FIL-003', productName: 'Filtro de aceite', quantity: 5, available: 3 },
];

describe('StockPreviewDialogComponent', () => {

  it('debe crearse correctamente', () => {
    const { comp } = setup({
      title: 'Aprobar orden', message: 'msg', availableLabel: 'Disponible', items: ITEMS_SUFICIENTES,
    });
    expect(comp).toBeTruthy();
  });

  // ── hasInsufficient ───────────────────────────────────────────────────────

  describe('hasInsufficient', () => {

    it('es false cuando todas las líneas tienen stock suficiente', () => {
      const { comp } = setup({
        title: 'Aprobar orden', message: 'msg', availableLabel: 'Disponible', items: ITEMS_SUFICIENTES,
      });
      expect(comp.hasInsufficient).toBe(false);
    });

    it('es true cuando al menos una línea excede el stock disponible', () => {
      const { comp } = setup({
        title: 'Aprobar orden', message: 'msg', availableLabel: 'Disponible', items: ITEMS_INSUFICIENTES,
      });
      expect(comp.hasInsufficient).toBe(true);
    });

    it('es false con lista vacía de items', () => {
      const { comp } = setup({
        title: 'Aprobar orden', message: 'msg', availableLabel: 'Disponible', items: [],
      });
      expect(comp.hasInsufficient).toBe(false);
    });

  });

  // ── confirm / cancel ──────────────────────────────────────────────────────

  it('confirm cierra el dialog con true', () => {
    const ctx = setup({
      title: 'Aprobar orden', message: 'msg', availableLabel: 'Disponible', items: ITEMS_SUFICIENTES,
    });
    ctx.comp.confirm();
    expect(ctx.closedWith).toBe(true);
  });

  it('cancel cierra el dialog con false', () => {
    const ctx = setup({
      title: 'Aprobar orden', message: 'msg', availableLabel: 'Disponible', items: ITEMS_SUFICIENTES,
    });
    ctx.comp.cancel();
    expect(ctx.closedWith).toBe(false);
  });

  // ── data ──────────────────────────────────────────────────────────────────

  it('expone los datos recibidos por MAT_DIALOG_DATA', () => {
    const { comp } = setup({
      title: 'Entregar orden', message: 'msg', availableLabel: 'Stock físico', items: ITEMS_SUFICIENTES,
      confirmLabel: 'Entregar',
    });
    expect(comp.data.title).toBe('Entregar orden');
    expect(comp.data.availableLabel).toBe('Stock físico');
    expect(comp.data.confirmLabel).toBe('Entregar');
    expect(comp.data.items.length).toBe(2);
  });

});
