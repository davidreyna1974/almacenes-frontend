import { TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';

import { SaleOrdersPageComponent } from './sale-orders-page.component';
import { SaleOrderService } from '../../services/sale-order.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { LayoutService } from '../../../../core/layout/layout.service';
import { PageResponse } from '../../../../shared/models/page-response.model';
import { SaleOrderResponse, SaleOrderStatus } from '../../models/sale-order.model';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeOrder(overrides: Partial<SaleOrderResponse> = {}): SaleOrderResponse {
  return {
    id: 1, orderNumber: 'SO-0001', status: 'PENDING', notes: null,
    totalAmount: 100, clientId: 1, clientName: 'Cliente Test',
    createdById: 1, createdByUsername: 'ventas01', createdAt: '2026-06-01T00:00:00',
    updatedAt: null, updatedById: null, updatedByUsername: null,
    approvedAt: null, approvedById: null, approvedByUsername: null,
    deliveredAt: null, deliveredById: null, deliveredByUsername: null,
    cancelledAt: null, cancelledById: null, cancelledByUsername: null,
    details: [],
    ...overrides,
  };
}

function pageOf(content: SaleOrderResponse[]): PageResponse<SaleOrderResponse> {
  return { content, currentPage: 0, totalPages: 1, totalElements: content.length, size: 20, first: true, last: true };
}

function setup(roles: string[], pagesByStatus: Partial<Record<SaleOrderStatus, PageResponse<SaleOrderResponse>>> = {}, queryTab: string | null = null) {
  const empty = pageOf([]);
  const getByStatus = vi.fn((status: SaleOrderStatus) =>
    of(pagesByStatus[status] ?? empty)
  );
  const approve  = vi.fn().mockReturnValue(of(makeOrder({ status: 'APPROVED' })));
  const deliver  = vi.fn().mockReturnValue(of(makeOrder({ status: 'DELIVERED' })));
  const cancel   = vi.fn().mockReturnValue(of(makeOrder({ status: 'CANCELLED' })));

  const mockOrderService  = { getByStatus, approve, deliver, cancel };
  const mockAuthService   = { hasRole: (r: string) => roles.includes(r) };
  const mockLayoutService = { collapse: () => {}, collapsed$: of(false) };
  const mockDialog        = { open: () => ({ afterClosed: () => of(true) }) };
  const mockSnackBar      = { open: () => {} };
  const mockRouter        = { navigate: vi.fn() };
  const mockRoute = {
    snapshot: { queryParamMap: convertToParamMap(queryTab ? { tab: queryTab } : {}) },
  };

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [SaleOrdersPageComponent],
    providers: [
      provideAnimations(),
      { provide: SaleOrderService, useValue: mockOrderService },
      { provide: AuthService,      useValue: mockAuthService },
      { provide: LayoutService,    useValue: mockLayoutService },
      { provide: MatDialog,        useValue: mockDialog },
      { provide: MatSnackBar,      useValue: mockSnackBar },
      { provide: Router,           useValue: mockRouter },
      { provide: ActivatedRoute,   useValue: mockRoute },
    ],
  });
  const fixture = TestBed.createComponent(SaleOrdersPageComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, mockOrderService, mockDialog, mockSnackBar, mockRouter };
}

// ─── Carga inicial de tabs/counts ──────────────────────────────────────────────

describe('SaleOrdersPageComponent — carga inicial', () => {

  it('crea el componente y carga el tab PENDING por defecto', () => {
    const { component } = setup(['ROLE_ADMIN']);
    expect(component).toBeTruthy();
    expect(component.activeTab).toBe('PENDING');
  });

  it('carga las órdenes del tab activo en pages', () => {
    const pending = pageOf([makeOrder({ id: 1 }), makeOrder({ id: 2 })]);
    const { component } = setup(['ROLE_ADMIN'], { PENDING: pending });
    expect(component.orders.length).toBe(2);
    expect(component.currentPage?.totalElements).toBe(2);
  });

  it('carga los counts de los tabs no activos por separado de pages', () => {
    const approved = pageOf([makeOrder({ id: 3, status: 'APPROVED' })]);
    const { component } = setup(['ROLE_ADMIN'], { APPROVED: approved });
    expect(component.countFor('APPROVED')).toBe(1);
    expect(component.pages.has('APPROVED')).toBe(false);
  });

  it('respeta el query param ?tab= para seleccionar el tab inicial', () => {
    const { component } = setup(['ROLE_ADMIN'], {}, 'APPROVED');
    expect(component.activeTab).toBe('APPROVED');
    expect(component.activeTabIndex).toBe(1);
  });

  it('muestra mensaje de error en snackbar si falla la carga del tab activo', () => {
    const failingService = {
      getByStatus: vi.fn((status: SaleOrderStatus) =>
        status === 'PENDING' ? throwError(() => ({ error: { message: 'Error backend' } })) : of(pageOf([]))
      ),
      approve: vi.fn(), deliver: vi.fn(), cancel: vi.fn(),
    };
    const mockSnackBar = { open: vi.fn() };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SaleOrdersPageComponent],
      providers: [
        provideAnimations(),
        { provide: SaleOrderService, useValue: failingService },
        { provide: AuthService,      useValue: { hasRole: () => true } },
        { provide: LayoutService,    useValue: { collapse: () => {}, collapsed$: of(false) } },
        { provide: MatDialog,        useValue: { open: () => ({ afterClosed: () => of(null) }) } },
        { provide: MatSnackBar,      useValue: mockSnackBar },
        { provide: Router,           useValue: { navigate: () => {} } },
        { provide: ActivatedRoute,   useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
      ],
    });
    const fixture = TestBed.createComponent(SaleOrdersPageComponent);
    fixture.detectChanges();
    expect(mockSnackBar.open).toHaveBeenCalledWith('Error backend', 'Cerrar', expect.objectContaining({ panelClass: ['snackbar-error'] }));
  });
});

// ─── Cambio de tab y reset de paginador (L31) ──────────────────────────────────

describe('SaleOrdersPageComponent — cambio de tab', () => {

  it('onTabChange actualiza activeTab y resetea la página a 0', () => {
    const { component, mockOrderService } = setup(['ROLE_ADMIN']);
    mockOrderService.getByStatus.mockClear();

    component.onTabChange(1); // APPROVED

    expect(component.activeTab).toBe('APPROVED');
    expect(mockOrderService.getByStatus).toHaveBeenCalledWith('APPROVED', 0, component.pageSize);
  });

  it('onPageChange recarga el tab activo con la página y tamaño solicitados', () => {
    const { component, mockOrderService } = setup(['ROLE_ADMIN']);
    mockOrderService.getByStatus.mockClear();

    component.onPageChange({ pageIndex: 2, pageSize: 50, length: 0 } as any);

    expect(component.pageSize).toBe(50);
    expect(mockOrderService.getByStatus).toHaveBeenCalledWith('PENDING', 2, 50);
  });
});

// ─── RBAC de botones ────────────────────────────────────────────────────────────

describe('SaleOrdersPageComponent — RBAC canCreateOrder/canEditOrder', () => {

  it('ADMIN, MANAGER y SALES pueden crear órdenes', () => {
    expect(setup(['ROLE_ADMIN']).component.canCreateOrder()).toBe(true);
    expect(setup(['ROLE_MANAGER']).component.canCreateOrder()).toBe(true);
    expect(setup(['ROLE_SALES']).component.canCreateOrder()).toBe(true);
  });

  it('WAREHOUSEMAN no puede crear órdenes', () => {
    expect(setup(['ROLE_WAREHOUSEMAN']).component.canCreateOrder()).toBe(false);
  });

  it('canEditOrder es true solo si puede crear y la orden está PENDING', () => {
    const { component } = setup(['ROLE_SALES']);
    expect(component.canEditOrder(makeOrder({ status: 'PENDING' }))).toBe(true);
    expect(component.canEditOrder(makeOrder({ status: 'APPROVED' }))).toBe(false);
  });

  it('canEditOrder es false para WAREHOUSEMAN aunque la orden esté PENDING', () => {
    const { component } = setup(['ROLE_WAREHOUSEMAN']);
    expect(component.canEditOrder(makeOrder({ status: 'PENDING' }))).toBe(false);
  });
});

describe('SaleOrdersPageComponent — RBAC canApprove', () => {

  it('ADMIN y MANAGER pueden aprobar órdenes PENDING', () => {
    expect(setup(['ROLE_ADMIN']).component.canApprove(makeOrder({ status: 'PENDING' }))).toBe(true);
    expect(setup(['ROLE_MANAGER']).component.canApprove(makeOrder({ status: 'PENDING' }))).toBe(true);
  });

  it('SALES y WAREHOUSEMAN no pueden aprobar', () => {
    expect(setup(['ROLE_SALES']).component.canApprove(makeOrder({ status: 'PENDING' }))).toBe(false);
    expect(setup(['ROLE_WAREHOUSEMAN']).component.canApprove(makeOrder({ status: 'PENDING' }))).toBe(false);
  });

  it('ADMIN no puede aprobar una orden que no está PENDING', () => {
    const { component } = setup(['ROLE_ADMIN']);
    expect(component.canApprove(makeOrder({ status: 'APPROVED' }))).toBe(false);
  });
});

describe('SaleOrdersPageComponent — RBAC canDeliver', () => {

  it('ADMIN, MANAGER y WAREHOUSEMAN pueden entregar órdenes APPROVED', () => {
    expect(setup(['ROLE_ADMIN']).component.canDeliver(makeOrder({ status: 'APPROVED' }))).toBe(true);
    expect(setup(['ROLE_MANAGER']).component.canDeliver(makeOrder({ status: 'APPROVED' }))).toBe(true);
    expect(setup(['ROLE_WAREHOUSEMAN']).component.canDeliver(makeOrder({ status: 'APPROVED' }))).toBe(true);
  });

  it('SALES no puede entregar', () => {
    expect(setup(['ROLE_SALES']).component.canDeliver(makeOrder({ status: 'APPROVED' }))).toBe(false);
  });

  it('WAREHOUSEMAN no puede entregar una orden que no está APPROVED', () => {
    const { component } = setup(['ROLE_WAREHOUSEMAN']);
    expect(component.canDeliver(makeOrder({ status: 'PENDING' }))).toBe(false);
  });
});

describe('SaleOrdersPageComponent — RBAC canCancel', () => {

  it('SALES puede cancelar órdenes PENDING o APPROVED', () => {
    const { component } = setup(['ROLE_SALES']);
    expect(component.canCancel(makeOrder({ status: 'PENDING' }))).toBe(true);
    expect(component.canCancel(makeOrder({ status: 'APPROVED' }))).toBe(true);
  });

  it('SALES no puede cancelar órdenes DELIVERED o CANCELLED', () => {
    const { component } = setup(['ROLE_SALES']);
    expect(component.canCancel(makeOrder({ status: 'DELIVERED' }))).toBe(false);
    expect(component.canCancel(makeOrder({ status: 'CANCELLED' }))).toBe(false);
  });

  it('WAREHOUSEMAN no puede cancelar', () => {
    expect(setup(['ROLE_WAREHOUSEMAN']).component.canCancel(makeOrder({ status: 'PENDING' }))).toBe(false);
  });
});

// ─── Transiciones approve/deliver/cancel ───────────────────────────────────────

describe('SaleOrdersPageComponent — transiciones de estado', () => {

  it('approveOrder llama al servicio approve y muestra snackbar de éxito al confirmar', () => {
    const { component, mockOrderService, mockSnackBar } = setup(['ROLE_ADMIN']);
    vi.spyOn(mockSnackBar, 'open');

    component.approveOrder(makeOrder({ id: 5, status: 'PENDING' }));

    expect(mockOrderService.approve).toHaveBeenCalledWith(5);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Orden aprobada correctamente.', 'Cerrar', expect.objectContaining({ panelClass: ['snackbar-success'] }));
  });

  it('deliverOrder llama al servicio deliver y muestra snackbar de éxito al confirmar', () => {
    const { component, mockOrderService, mockSnackBar } = setup(['ROLE_WAREHOUSEMAN']);
    vi.spyOn(mockSnackBar, 'open');

    component.deliverOrder(makeOrder({ id: 7, status: 'APPROVED' }));

    expect(mockOrderService.deliver).toHaveBeenCalledWith(7);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Orden entregada correctamente.', 'Cerrar', expect.objectContaining({ panelClass: ['snackbar-success'] }));
  });

  it('cancelOrder llama al servicio cancel y muestra snackbar de éxito al confirmar', () => {
    const { component, mockOrderService, mockSnackBar } = setup(['ROLE_SALES']);
    vi.spyOn(mockSnackBar, 'open');

    component.cancelOrder(makeOrder({ id: 9, status: 'PENDING' }));

    expect(mockOrderService.cancel).toHaveBeenCalledWith(9);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Orden cancelada correctamente.', 'Cerrar', expect.objectContaining({ panelClass: ['snackbar-success'] }));
  });

  it('no llama al servicio si el diálogo de confirmación se cancela', () => {
    const mockOrderService = {
      getByStatus: vi.fn().mockReturnValue(of(pageOf([]))),
      approve: vi.fn(), deliver: vi.fn(), cancel: vi.fn(),
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SaleOrdersPageComponent],
      providers: [
        provideAnimations(),
        { provide: SaleOrderService, useValue: mockOrderService },
        { provide: AuthService,      useValue: { hasRole: () => true } },
        { provide: LayoutService,    useValue: { collapse: () => {}, collapsed$: of(false) } },
        { provide: MatDialog,        useValue: { open: () => ({ afterClosed: () => of(false) }) } },
        { provide: MatSnackBar,      useValue: { open: () => {} } },
        { provide: Router,           useValue: { navigate: () => {} } },
        { provide: ActivatedRoute,   useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
      ],
    });
    const fixture = TestBed.createComponent(SaleOrdersPageComponent);
    fixture.detectChanges();

    fixture.componentInstance.approveOrder(makeOrder({ id: 1, status: 'PENDING' }));

    expect(mockOrderService.approve).not.toHaveBeenCalled();
  });

  it('muestra snackbar de error si el backend rechaza la transición', () => {
    const mockOrderService = {
      getByStatus: vi.fn().mockReturnValue(of(pageOf([]))),
      approve: vi.fn().mockReturnValue(throwError(() => ({ error: { message: 'Stock insuficiente' } }))),
      deliver: vi.fn(), cancel: vi.fn(),
    };
    const mockSnackBar = { open: vi.fn() };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SaleOrdersPageComponent],
      providers: [
        provideAnimations(),
        { provide: SaleOrderService, useValue: mockOrderService },
        { provide: AuthService,      useValue: { hasRole: () => true } },
        { provide: LayoutService,    useValue: { collapse: () => {}, collapsed$: of(false) } },
        { provide: MatDialog,        useValue: { open: () => ({ afterClosed: () => of(true) }) } },
        { provide: MatSnackBar,      useValue: mockSnackBar },
        { provide: Router,           useValue: { navigate: () => {} } },
        { provide: ActivatedRoute,   useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
      ],
    });
    const fixture = TestBed.createComponent(SaleOrdersPageComponent);
    fixture.detectChanges();

    fixture.componentInstance.approveOrder(makeOrder({ id: 1, status: 'PENDING' }));

    expect(mockSnackBar.open).toHaveBeenCalledWith('Stock insuficiente', 'Cerrar', expect.objectContaining({ panelClass: ['snackbar-error'] }));
  });
});

// ─── Navegación ─────────────────────────────────────────────────────────────────

describe('SaleOrdersPageComponent — navegación', () => {

  it('openDetail navega a /sales/orders/:id con el tab activo como query param', () => {
    const { component, mockRouter } = setup(['ROLE_ADMIN']);
    component.openDetail(makeOrder({ id: 42 }));
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/sales/orders', 42], { queryParams: { from: 'PENDING' } });
  });

  it('newOrder navega a /sales/orders/new', () => {
    const { component, mockRouter } = setup(['ROLE_ADMIN']);
    component.newOrder();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/sales/orders/new']);
  });
});

// ─── getStatusClass ───────────────────────────────────────────────────────────

describe('SaleOrdersPageComponent — getStatusClass', () => {

  it('mapea cada estado a su clase CSS correspondiente', () => {
    const { component } = setup(['ROLE_ADMIN']);
    expect(component.getStatusClass('PENDING')).toBe('status--pending');
    expect(component.getStatusClass('APPROVED')).toBe('status--approved');
    expect(component.getStatusClass('DELIVERED')).toBe('status--delivered');
    expect(component.getStatusClass('CANCELLED')).toBe('status--cancelled');
  });
});
