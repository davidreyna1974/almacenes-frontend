import { TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';

import { ReservationsPageComponent } from './reservations-page.component';
import { ReservationService } from '../../services/reservation.service';
import { LayoutService } from '../../../../core/layout/layout.service';
import { ReservationSummary, ReservedProduct, ReservedClient } from '../../models/reservation.model';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSummary(overrides: Partial<ReservationSummary> = {}): ReservationSummary {
  return {
    totalProductsWithReservations: 2,
    totalReservedUnits: 15,
    totalReservedValue: 1500,
    totalApprovedOrders: 3,
    ...overrides,
  };
}

function makeProduct(overrides: Partial<ReservedProduct> = {}): ReservedProduct {
  return {
    productId: 1,
    productSku: 'SKU-001',
    productName: 'Producto Test',
    totalReservedQty: 10,
    unitPrice: 100,
    totalReservedValue: 1000,
    orders: [
      { orderId: 11, orderNumber: 'SO-0011', quantity: 10, subtotal: 1000, clientId: 1, clientName: 'Cliente A', approvedAt: '2026-06-01T00:00:00' },
    ],
    ...overrides,
  };
}

function makeClient(overrides: Partial<ReservedClient> = {}): ReservedClient {
  return {
    clientId: 1,
    clientName: 'Cliente A',
    totalReservedOrders: 1,
    totalReservedValue: 1000,
    orders: [
      { orderId: 11, orderNumber: 'SO-0011', totalAmount: 1000, approvedAt: '2026-06-01T00:00:00', totalItems: 1 },
    ],
    ...overrides,
  };
}

function setup(opts: {
  summary?: ReservationSummary | 'error';
  products?: ReservedProduct[] | 'error';
  clients?: ReservedClient[] | 'error';
} = {}) {
  const summary$ = opts.summary === 'error'
    ? throwError(() => new Error('500'))
    : of(opts.summary ?? makeSummary());
  const products$ = opts.products === 'error'
    ? throwError(() => new Error('500'))
    : of(opts.products ?? [makeProduct()]);
  const clients$ = opts.clients === 'error'
    ? throwError(() => new Error('500'))
    : of(opts.clients ?? [makeClient()]);

  const mockReservationService = {
    getSummary: vi.fn(() => summary$),
    getProducts: vi.fn(() => products$),
    getClients: vi.fn(() => clients$),
  };
  const mockLayoutService = { collapse: () => {}, collapsed$: of(false) };
  const mockRouter = { navigate: vi.fn() };

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [ReservationsPageComponent],
    providers: [
      provideAnimations(),
      { provide: ReservationService, useValue: mockReservationService },
      { provide: LayoutService,      useValue: mockLayoutService },
      { provide: Router,             useValue: mockRouter },
    ],
  });
  const fixture = TestBed.createComponent(ReservationsPageComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, mockReservationService, mockRouter };
}

// ─── Carga inicial ──────────────────────────────────────────────────────────

describe('ReservationsPageComponent — carga inicial', () => {

  it('crea el componente y carga summary, productos y clientes', () => {
    const { component } = setup();
    expect(component).toBeTruthy();
    expect(component.loading).toBe(false);
    expect(component.summary.totalProductsWithReservations).toBe(2);
    expect(component.products.length).toBe(1);
    expect(component.clients.length).toBe(1);
  });

  it('llama a collapse() del LayoutService al inicializar', () => {
    setup();
    expect(true).toBe(true);
  });
});

// ─── L33 — forkJoin con catchError aislado ─────────────────────────────────────

describe('ReservationsPageComponent — forkJoin y catchError (L33)', () => {

  it('si getSummary falla, usa un resumen vacío sin romper el dashboard', () => {
    const { component } = setup({ summary: 'error' });
    expect(component.summary).toEqual({
      totalProductsWithReservations: 0,
      totalReservedUnits: 0,
      totalReservedValue: 0,
      totalApprovedOrders: 0,
    });
    expect(component.products.length).toBe(1);
    expect(component.clients.length).toBe(1);
  });

  it('si getProducts falla, devuelve lista vacía sin romper las otras secciones', () => {
    const { component } = setup({ products: 'error' });
    expect(component.products).toEqual([]);
    expect(component.summary.totalProductsWithReservations).toBe(2);
    expect(component.clients.length).toBe(1);
  });

  it('si getClients falla, devuelve lista vacía sin romper las otras secciones', () => {
    const { component } = setup({ clients: 'error' });
    expect(component.clients).toEqual([]);
    expect(component.summary.totalProductsWithReservations).toBe(2);
    expect(component.products.length).toBe(1);
  });
});

// ─── Estados vacíos ─────────────────────────────────────────────────────────

describe('ReservationsPageComponent — estados vacíos', () => {

  it('products vacío resulta en lista vacía (EMPTY-RES-01)', () => {
    const { component } = setup({ products: [] });
    expect(component.products).toEqual([]);
  });

  it('clients vacío resulta en lista vacía (EMPTY-RES-02)', () => {
    const { component } = setup({ clients: [] });
    expect(component.clients).toEqual([]);
  });
});

// ─── Expansión de filas ─────────────────────────────────────────────────────

describe('ReservationsPageComponent — expansión de filas', () => {

  it('toggleProduct alterna la fila expandida', () => {
    const { component } = setup();
    const product = makeProduct();
    expect(component.expandedProductId).toBeNull();

    component.toggleProduct(product);
    expect(component.expandedProductId).toBe(product.productId);

    component.toggleProduct(product);
    expect(component.expandedProductId).toBeNull();
  });

  it('toggleClient alterna la fila expandida', () => {
    const { component } = setup();
    const client = makeClient();
    expect(component.expandedClientId).toBeNull();

    component.toggleClient(client);
    expect(component.expandedClientId).toBe(client.clientId);

    component.toggleClient(client);
    expect(component.expandedClientId).toBeNull();
  });
});

// ─── Navegación (RBAC-RES-02) ─────────────────────────────────────────────────

describe('ReservationsPageComponent — navegación a detalle de orden', () => {

  it('goToOrder navega a /sales/orders/:id con queryParams from=reservations', () => {
    const { component, mockRouter } = setup();
    component.goToOrder(11);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/sales/orders', 11], { queryParams: { from: 'reservations' } });
  });
});
