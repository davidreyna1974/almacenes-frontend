import { TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LowStockPageComponent, LowStockItem } from './low-stock-page.component';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { LayoutService } from '../../../../core/layout/layout.service';
import { PageResponse } from '../../../../shared/models/page-response.model';
import { ProductResponseDTO } from '../../models/product.model';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeProduct(overrides: Partial<ProductResponseDTO> = {}): ProductResponseDTO {
  return {
    id: 1, sku: 'T001', name: 'Producto Test', description: '',
    price: 100, unitCost: 50,
    currentStock: 5, reservedStock: 0, availableStock: 5, minimumStock: 10,
    status: 'AVAILABLE', active: true,
    categoryId: 1, categoryName: 'Cat1',
    supplierId: 1, supplierName: 'Prov1',
    createdAt: '2026-01-01T00:00:00', createdByUsername: 'admin', updatedAt: '',
    ...overrides,
  };
}

function emptyPage(): PageResponse<ProductResponseDTO> {
  return { content: [], currentPage: 0, totalPages: 0, totalElements: 0, size: 200, first: true, last: true };
}

function setup(roles: string[], products: ProductResponseDTO[] = []) {
  const page: PageResponse<ProductResponseDTO> = { ...emptyPage(), content: products };
  const mockProductService = { getLowStock: () => of(page) };
  const mockAuthService    = { hasRole: (r: string) => roles.includes(r) };
  const mockLayoutService  = { collapse: () => {}, collapsed$: of(false) };
  const mockDialog         = { open: () => ({ afterClosed: () => of(null) }) };
  const mockSnackBar       = { open: () => {} };

  TestBed.configureTestingModule({
    imports: [LowStockPageComponent],
    providers: [
      provideAnimations(),
      { provide: ProductService, useValue: mockProductService },
      { provide: AuthService,    useValue: mockAuthService },
      { provide: LayoutService,  useValue: mockLayoutService },
      { provide: MatDialog,      useValue: mockDialog },
      { provide: MatSnackBar,    useValue: mockSnackBar },
    ],
  });
  const fixture = TestBed.createComponent(LowStockPageComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

// ─── Tests de getSeverity ──────────────────────────────────────────────────────

describe('LowStockPageComponent — getSeverity()', () => {
  let component: LowStockPageComponent;

  beforeEach(() => {
    ({ component } = setup(['ROLE_ADMIN']));
  });

  it('debe retornar "sin-stock" cuando availableStock es 0', () => {
    const item = { ...makeProduct({ availableStock: 0, currentStock: 5, minimumStock: 10 }), deficit: 10 };
    expect(component.getSeverity(item)).toBe('sin-stock');
  });

  it('debe retornar "critico" cuando currentStock < minimumStock y availableStock > 0', () => {
    const item = { ...makeProduct({ currentStock: 3, availableStock: 3, minimumStock: 10 }), deficit: 7 };
    expect(component.getSeverity(item)).toBe('critico');
  });

  it('debe retornar "reservas" cuando currentStock >= minimumStock pero reservedStock eleva el déficit', () => {
    const item = { ...makeProduct({ currentStock: 15, reservedStock: 12, availableStock: 3, minimumStock: 10 }), deficit: 7 };
    expect(component.getSeverity(item)).toBe('reservas');
  });
});

// ─── Tests de getSeverityLabel ─────────────────────────────────────────────────

describe('LowStockPageComponent — getSeverityLabel()', () => {
  let component: LowStockPageComponent;

  beforeEach(() => {
    ({ component } = setup(['ROLE_ADMIN']));
  });

  it('debe retornar "Sin stock" para availableStock = 0', () => {
    const item = { ...makeProduct({ availableStock: 0 }), deficit: 10 };
    expect(component.getSeverityLabel(item)).toBe('Sin stock');
  });

  it('debe retornar "Crítico" para currentStock < minimumStock y availableStock > 0', () => {
    const item = { ...makeProduct({ currentStock: 3, availableStock: 3, minimumStock: 10 }), deficit: 7 };
    expect(component.getSeverityLabel(item)).toBe('Crítico');
  });

  it('debe retornar "Por reservas" cuando currentStock >= minimumStock', () => {
    const item = { ...makeProduct({ currentStock: 15, availableStock: 3, minimumStock: 10 }), deficit: 7 };
    expect(component.getSeverityLabel(item)).toBe('Por reservas');
  });
});

// ─── Tests de contadores de severidad ─────────────────────────────────────────

describe('LowStockPageComponent — contadores de severidad', () => {

  it('sinStockCount cuenta solo los productos con availableStock = 0', () => {
    const products = [
      makeProduct({ id: 1, availableStock: 0, currentStock: 5, minimumStock: 10 }),
      makeProduct({ id: 2, availableStock: 3, currentStock: 3, minimumStock: 10 }),
      makeProduct({ id: 3, availableStock: 0, currentStock: 8, minimumStock: 10 }),
    ];
    const { component } = setup(['ROLE_ADMIN'], products);
    expect(component.sinStockCount).toBe(2);
  });

  it('criticoCount cuenta productos con availableStock > 0 y currentStock < minimumStock', () => {
    const products = [
      makeProduct({ id: 1, availableStock: 3, currentStock: 3, minimumStock: 10 }),
      makeProduct({ id: 2, availableStock: 0, currentStock: 0, minimumStock: 10 }),
      makeProduct({ id: 3, availableStock: 2, currentStock: 2, minimumStock: 10 }),
    ];
    const { component } = setup(['ROLE_ADMIN'], products);
    expect(component.criticoCount).toBe(2);
  });

  it('reservasCount cuenta productos donde currentStock >= minimumStock', () => {
    const products = [
      makeProduct({ id: 1, currentStock: 15, reservedStock: 12, availableStock: 3, minimumStock: 10 }),
      makeProduct({ id: 2, currentStock: 3,  reservedStock: 0,  availableStock: 3, minimumStock: 10 }),
    ];
    const { component } = setup(['ROLE_ADMIN'], products);
    expect(component.reservasCount).toBe(1);
  });
});

// ─── Tests de displayedColumns por rol ────────────────────────────────────────

describe('LowStockPageComponent — displayedColumns por rol', () => {

  it('ADMIN: incluye unitCost y actions', () => {
    const { component } = setup(['ROLE_ADMIN']);
    expect(component.displayedColumns).toContain('unitCost');
    expect(component.displayedColumns).toContain('actions');
  });

  it('MANAGER: incluye unitCost y actions', () => {
    const { component } = setup(['ROLE_MANAGER']);
    expect(component.displayedColumns).toContain('unitCost');
    expect(component.displayedColumns).toContain('actions');
  });

  it('WAREHOUSEMAN: NO incluye unitCost pero SÍ actions', () => {
    const { component } = setup(['ROLE_WAREHOUSEMAN']);
    expect(component.displayedColumns).not.toContain('unitCost');
    expect(component.displayedColumns).toContain('actions');
  });

  it('SALES: NO incluye unitCost ni actions', () => {
    const { component } = setup(['ROLE_SALES']);
    expect(component.displayedColumns).not.toContain('unitCost');
    expect(component.displayedColumns).not.toContain('actions');
  });

  it('WAREHOUSEMAN: incluye columnas base de stock', () => {
    const { component } = setup(['ROLE_WAREHOUSEMAN']);
    ['severity', 'sku', 'name', 'currentStock', 'availableStock', 'deficit'].forEach(col => {
      expect(component.displayedColumns).toContain(col);
    });
  });
});

// ─── Test de ordenamiento ──────────────────────────────────────────────────────

describe('LowStockPageComponent — ordenamiento por déficit', () => {

  it('ordena los items por deficit DESC (mayor urgencia primero)', () => {
    const products = [
      makeProduct({ id: 1, availableStock: 8, minimumStock: 10 }),  // deficit 2
      makeProduct({ id: 2, availableStock: 1, minimumStock: 10 }),  // deficit 9
      makeProduct({ id: 3, availableStock: 5, minimumStock: 10 }),  // deficit 5
    ];
    const { component } = setup(['ROLE_ADMIN'], products);
    expect(component.items[0].deficit).toBeGreaterThanOrEqual(component.items[1].deficit);
    expect(component.items[1].deficit).toBeGreaterThanOrEqual(component.items[2].deficit);
  });
});

// ─── Test de creación ──────────────────────────────────────────────────────────

describe('LowStockPageComponent — creación', () => {

  it('debe crearse correctamente para ADMIN', () => {
    const { component } = setup(['ROLE_ADMIN']);
    expect(component).toBeTruthy();
  });

  it('debe crearse correctamente para SALES', () => {
    const { component } = setup(['ROLE_SALES']);
    expect(component).toBeTruthy();
  });
});
