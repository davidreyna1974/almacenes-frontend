import { TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SimpleChange } from '@angular/core';
import { Subject, of } from 'rxjs';
import { ProductDetailComponent } from './product-detail.component';
import { ProductService } from '../../services/product.service';
import { ProductResponseDTO } from '../../models/product.model';
import { StockMovementResponseDTO } from '../../models/stock-movement.model';
import { PageResponse } from '../../../../shared/models/page-response.model';

const mockProduct: ProductResponseDTO = {
  id: 1,
  sku: 'TOOL-001',
  name: 'Taladro',
  description: '',
  price: 99.99,
  unitCost: 50,
  currentStock: 30,
  minimumStock: 5,
  status: 'AVAILABLE',
  active: true,
  reservedStock: 2,
  availableStock: 28,
  categoryId: 1,
  categoryName: 'Herramientas',
  supplierId: 1,
  supplierName: 'Proveedor A',
  createdAt: '2026-01-01T00:00:00',
  createdByUsername: 'admin',
  updatedAt: '',
};

const mockMovement: StockMovementResponseDTO = {
  id: 10,
  quantity: 5,
  reason: 'Reposición',
  createdAt: '2026-01-15T10:00:00',
  type: 'IN',
  productId: 1,
  productName: 'Taladro',
  createdByUsername: 'admin',
};

const mockMovPage: PageResponse<StockMovementResponseDTO> = {
  content: [mockMovement],
  currentPage: 0,
  totalPages: 1,
  totalElements: 1,
  size: 10,
  first: true,
  last: true,
};

const emptyMovPage: PageResponse<StockMovementResponseDTO> = {
  content: [],
  currentPage: 0,
  totalPages: 0,
  totalElements: 0,
  size: 10,
  first: true,
  last: true,
};

function setup(canWrite = true, canDeactivate = false) {
  let getMovementsSubject = new Subject<PageResponse<StockMovementResponseDTO>>();
  let snackBarArgs: any[] = [];

  const mockProductService = {
    getMovements: (_id: number, _page: number, _size: number) => getMovementsSubject.asObservable(),
  };
  const mockSnackBar = { open: (...args: any[]) => { snackBarArgs = args; } };

  TestBed.configureTestingModule({
    imports: [ProductDetailComponent],
    providers: [
      provideAnimations(),
      { provide: ProductService, useValue: mockProductService },
      { provide: MatSnackBar, useValue: mockSnackBar },
    ],
  });

  const fixture = TestBed.createComponent(ProductDetailComponent);
  const component = fixture.componentInstance;
  fixture.componentRef.setInput('item', null);
  fixture.componentRef.setInput('canWrite', canWrite);
  fixture.componentRef.setInput('canDeactivate', canDeactivate);
  fixture.detectChanges();

  return {
    fixture, component, mockProductService, getMovementsSubject,
    get snackBarArgs() { return snackBarArgs; },
    resetSubject() { getMovementsSubject = new Subject(); mockProductService.getMovements = () => getMovementsSubject.asObservable(); },
  };
}

describe('ProductDetailComponent', () => {

  // ─── getStatusLabel ───────────────────────────────────────────────────────

  describe('getStatusLabel()', () => {

    it('debe retornar "Disponible" para AVAILABLE', () => {
      const { component } = setup();
      expect(component.getStatusLabel('AVAILABLE')).toBe('Disponible');
    });

    it('debe retornar "Descontinuado" para DISCONTINUED', () => {
      const { component } = setup();
      expect(component.getStatusLabel('DISCONTINUED')).toBe('Descontinuado');
    });

    it('debe retornar "Sin stock" para OUT_OF_STOCK', () => {
      const { component } = setup();
      expect(component.getStatusLabel('OUT_OF_STOCK')).toBe('Sin stock');
    });

    it('debe retornar el valor original cuando el status no está en el mapa (fallback)', () => {
      const { component } = setup();
      expect(component.getStatusLabel('VALOR_DESCONOCIDO')).toBe('VALOR_DESCONOCIDO');
    });

  });

  // ─── getMovementTypeLabel ─────────────────────────────────────────────────

  describe('getMovementTypeLabel()', () => {

    it('debe retornar "Entrada" para IN', () => {
      const { component } = setup();
      expect(component.getMovementTypeLabel('IN')).toBe('Entrada');
    });

    it('debe retornar "Salida" para OUT', () => {
      const { component } = setup();
      expect(component.getMovementTypeLabel('OUT')).toBe('Salida');
    });

    it('debe retornar "Salida" para cualquier valor distinto de IN (rama else)', () => {
      const { component } = setup();
      expect(component.getMovementTypeLabel('UNKNOWN')).toBe('Salida');
    });

  });

  // ─── ngOnChanges — carga de movimientos ──────────────────────────────────

  describe('ngOnChanges()', () => {

    it('debe limpiar movimientos cuando item cambia a null', () => {
      const ctx = setup();
      ctx.component.movements = [mockMovement];
      ctx.component.movPage = mockMovPage;

      ctx.component.item = null;
      ctx.component.ngOnChanges({
        item: new SimpleChange(mockProduct, null, false),
      });

      expect(ctx.component.movements).toEqual([]);
      expect(ctx.component.movPage).toBeNull();
    });

    it('debe reiniciar movCurrentPage a 0 al recibir un nuevo producto', () => {
      const ctx = setup();
      ctx.component.movCurrentPage = 3;
      ctx.component.item = mockProduct;
      ctx.component.ngOnChanges({
        item: new SimpleChange(null, mockProduct, false),
      });

      expect(ctx.component.movCurrentPage).toBe(0);
    });

  });

  // ─── loadMovements ────────────────────────────────────────────────────────

  describe('loadMovements()', () => {

    it('debe cargar movimientos y asignarlos cuando el servicio responde con datos', () => {
      const ctx = setup();
      ctx.component.item = mockProduct;
      ctx.component.loadMovements();
      ctx.getMovementsSubject.next(mockMovPage);
      ctx.getMovementsSubject.complete();

      expect(ctx.component.movements).toEqual([mockMovement]);
      expect(ctx.component.movPage).toEqual(mockMovPage);
      expect(ctx.component.movLoading).toBe(false);
    });

    it('no debe llamar al servicio si item es null', () => {
      const ctx = setup();
      let called = false;
      ctx.mockProductService.getMovements = () => { called = true; return of(emptyMovPage); };
      ctx.component.item = null;
      ctx.component.loadMovements();
      expect(called).toBe(false);
    });

    it('debe manejar error del servicio y mostrar snackbar', () => {
      const ctx = setup();
      ctx.component.item = mockProduct;
      ctx.component.loadMovements();
      ctx.getMovementsSubject.error(new Error('500'));

      expect(ctx.component.movLoading).toBe(false);
      expect(ctx.snackBarArgs[0]).toBe('Error al cargar el Kardex.');
    });

    it('movements debe quedar vacío cuando la página no tiene contenido', () => {
      const ctx = setup();
      ctx.component.item = mockProduct;
      ctx.component.loadMovements();
      ctx.getMovementsSubject.next(emptyMovPage);
      ctx.getMovementsSubject.complete();

      expect(ctx.component.movements).toEqual([]);
    });

    it('movLoading debe ser true durante la carga y false al terminar', () => {
      const ctx = setup();
      ctx.component.item = mockProduct;
      ctx.component.loadMovements();
      expect(ctx.component.movLoading).toBe(true);
      ctx.getMovementsSubject.next(mockMovPage);
      ctx.getMovementsSubject.complete();
      expect(ctx.component.movLoading).toBe(false);
    });

  });

  // ─── onMovPageChange ──────────────────────────────────────────────────────

  describe('onMovPageChange()', () => {

    it('debe actualizar currentPage y pageSize y recargar movimientos', () => {
      const ctx = setup();
      ctx.component.item = mockProduct;

      let capturedArgs: any[] = [];
      ctx.mockProductService.getMovements = (...args: any[]) => { capturedArgs = args; return of(emptyMovPage); };

      ctx.component.onMovPageChange({ pageIndex: 2, pageSize: 5, length: 30 });

      expect(ctx.component.movCurrentPage).toBe(2);
      expect(ctx.component.movPageSize).toBe(5);
      expect(capturedArgs).toEqual([mockProduct.id, 2, 5]);
    });

  });

  // ─── reloadMovements ──────────────────────────────────────────────────────

  describe('reloadMovements()', () => {

    it('debe reiniciar página a 0 y recargar', () => {
      const ctx = setup();
      ctx.component.item = mockProduct;
      ctx.component.movCurrentPage = 5;

      let capturedArgs: any[] = [];
      ctx.mockProductService.getMovements = (...args: any[]) => { capturedArgs = args; return of(emptyMovPage); };

      ctx.component.reloadMovements();

      expect(ctx.component.movCurrentPage).toBe(0);
      expect(capturedArgs[0]).toBe(mockProduct.id);
      expect(capturedArgs[1]).toBe(0);
    });

  });

  // ─── Vista de solo lectura (canWrite=false) ───────────────────────────────

  describe('vista readonly cuando canWrite=false', () => {

    it('debe renderizar el bloque readonly cuando canWrite=false y hay item', () => {
      const { fixture } = setup(false);
      fixture.componentRef.setInput('item', mockProduct);
      fixture.componentRef.setInput('canWrite', false);
      fixture.detectChanges();

      const readonlyBlock = fixture.nativeElement.querySelector('.product-detail__readonly');
      expect(readonlyBlock).not.toBeNull();
    });

    it('debe mostrar título "Ver producto" en vista readonly', () => {
      const { fixture } = setup(false);
      fixture.componentRef.setInput('item', mockProduct);
      fixture.componentRef.setInput('canWrite', false);
      fixture.detectChanges();

      const title: HTMLElement = fixture.nativeElement.querySelector('.product-form__title');
      expect(title?.textContent?.trim()).toBe('Ver producto');
    });

  });

});
