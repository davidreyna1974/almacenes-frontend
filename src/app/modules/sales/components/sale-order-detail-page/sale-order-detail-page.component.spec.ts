import { TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';

import { SaleOrderDetailPageComponent } from './sale-order-detail-page.component';
import { SaleOrderService } from '../../services/sale-order.service';
import { ClientService } from '../../services/client.service';
import { ProductService } from '../../../inventory/services/product.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { LayoutService } from '../../../../core/layout/layout.service';
import { PageResponse } from '../../../../shared/models/page-response.model';
import { SaleOrderResponse, SaleOrderDetailResponse } from '../../models/sale-order.model';
import { ClientDTO } from '../../models/client.model';
import { ProductResponseDTO } from '../../../inventory/models/product.model';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeOrder(overrides: Partial<SaleOrderResponse> = {}): SaleOrderResponse {
  return {
    id: 1, orderNumber: 'SO-0001', status: 'PENDING', notes: null,
    totalAmount: 500, clientId: 1, clientName: 'Cliente Test',
    createdById: 1, createdByUsername: 'ventas01', createdAt: '2026-06-01T00:00:00',
    updatedAt: null, updatedById: null, updatedByUsername: null,
    approvedAt: null, approvedById: null, approvedByUsername: null,
    deliveredAt: null, deliveredById: null, deliveredByUsername: null,
    cancelledAt: null, cancelledById: null, cancelledByUsername: null,
    details: [makeDetail()],
    ...overrides,
  };
}

function makeDetail(overrides: Partial<SaleOrderDetailResponse> = {}): SaleOrderDetailResponse {
  return {
    id: 1, quantity: 5, unitPrice: 100, unitCost: 60, subtotal: 500,
    productId: 10, productSku: 'LUB-001', productName: 'Aceite Lubricante 20W-50',
    ...overrides,
  };
}

function makeClient(overrides: Partial<ClientDTO> = {}): ClientDTO {
  return {
    id: 1, name: 'Cliente Test', rfc: 'XAXX010101000', contactName: 'Juan Pérez',
    phone: '5512345678', email: 'cliente@test.com', address: 'Calle 1', active: true,
    createdAt: '', createdById: 1, createdByUsername: 'admin',
    updatedAt: null, updatedById: null, updatedByUsername: null,
    ...overrides,
  };
}

function makeProduct(overrides: Partial<ProductResponseDTO> = {}): ProductResponseDTO {
  return {
    id: 10, sku: 'LUB-001', name: 'Aceite Lubricante 20W-50', description: '',
    price: 100, currentStock: 50, minimumStock: 5, status: 'AVAILABLE',
    active: true, reservedStock: 0, availableStock: 50, unitCost: 60,
    categoryId: 1, categoryName: 'Lubricantes', supplierId: 1, supplierName: 'Proveedor A',
    createdAt: '', createdByUsername: 'admin', updatedAt: '',
    ...overrides,
  };
}

function pageOf<T>(content: T[]): PageResponse<T> {
  return { content, currentPage: 0, totalPages: 1, totalElements: content.length, size: 200, first: true, last: true };
}

interface SetupOptions {
  roles?: string[];
  routeId?: string | null;
  queryFrom?: string | null;
  order?: SaleOrderResponse;
  clients?: ClientDTO[];
  orderServiceOverrides?: Record<string, any>;
  productServiceOverrides?: Record<string, any>;
  dialogAfterClosed?: any;
}

function setup(opts: SetupOptions = {}) {
  const roles = opts.roles ?? ['ROLE_ADMIN'];
  const order = opts.order ?? makeOrder();
  const clients = opts.clients ?? [makeClient(), makeClient({ id: 2, name: 'Otro Cliente' })];

  const getById = vi.fn().mockReturnValue(of(order));
  const create  = vi.fn().mockReturnValue(of(order));
  const update  = vi.fn().mockReturnValue(of(order));
  const approve = vi.fn().mockReturnValue(of({ ...order, status: 'APPROVED' }));
  const deliver = vi.fn().mockReturnValue(of({ ...order, status: 'DELIVERED' }));
  const cancel  = vi.fn().mockReturnValue(of({ ...order, status: 'CANCELLED' }));
  const addDetail    = vi.fn().mockReturnValue(of(order));
  const updateDetail = vi.fn().mockReturnValue(of(order));
  const removeDetail = vi.fn().mockReturnValue(of(undefined));

  const mockOrderService = {
    getById, create, update, approve, deliver, cancel, addDetail, updateDetail, removeDetail,
    ...opts.orderServiceOverrides,
  };

  const mockClientService = {
    getActive: vi.fn().mockReturnValue(of(pageOf(clients))),
  };

  const mockProductService = {
    getById: vi.fn().mockReturnValue(of(makeProduct())),
    ...opts.productServiceOverrides,
  };

  const mockAuthService   = { hasRole: (r: string) => roles.includes(r) };
  const mockLayoutService = { collapse: () => {}, collapsed$: of(false) };
  const mockDialog = {
    open: vi.fn().mockReturnValue({ afterClosed: () => of(opts.dialogAfterClosed ?? true) }),
  };
  const mockSnackBar = { open: vi.fn() };
  const mockRouter   = { navigate: vi.fn() };
  const mockRoute = {
    snapshot: {
      paramMap: convertToParamMap(opts.routeId !== undefined ? (opts.routeId ? { id: opts.routeId } : {}) : { id: '1' }),
      queryParamMap: convertToParamMap(opts.queryFrom ? { from: opts.queryFrom } : {}),
    },
  };

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [SaleOrderDetailPageComponent],
    providers: [
      provideAnimations(),
      { provide: SaleOrderService,  useValue: mockOrderService },
      { provide: ClientService,     useValue: mockClientService },
      { provide: ProductService,    useValue: mockProductService },
      { provide: AuthService,       useValue: mockAuthService },
      { provide: LayoutService,     useValue: mockLayoutService },
      { provide: MatDialog,         useValue: mockDialog },
      { provide: MatSnackBar,       useValue: mockSnackBar },
      { provide: Router,            useValue: mockRouter },
      { provide: ActivatedRoute,    useValue: mockRoute },
    ],
  });

  const fixture = TestBed.createComponent(SaleOrderDetailPageComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  return { fixture, component, mockOrderService, mockClientService, mockProductService, mockDialog, mockSnackBar, mockRouter };
}

// ─── Inicialización ─────────────────────────────────────────────────────────────

describe('SaleOrderDetailPageComponent — inicialización', () => {

  it('crea el componente y carga la orden existente', () => {
    const { component, mockOrderService } = setup({ routeId: '1' });
    expect(component).toBeTruthy();
    expect(component.isNew).toBe(false);
    expect(mockOrderService.getById).toHaveBeenCalledWith(1);
    expect(component.order?.id).toBe(1);
  });

  it('modo creación cuando la ruta es "new"', () => {
    const { component, mockOrderService } = setup({ routeId: 'new' });
    expect(component.isNew).toBe(true);
    expect(mockOrderService.getById).not.toHaveBeenCalled();
  });

  it('modo creación cuando no hay parámetro id', () => {
    const { component } = setup({ routeId: null });
    expect(component.isNew).toBe(true);
  });

  it('precarga headerForm con cliente y notas de la orden', () => {
    const { component } = setup({ order: makeOrder({ clientName: 'Cliente X', notes: 'Notas de prueba' }) });
    expect(component.headerForm.getRawValue().clientSearch).toBe('Cliente X');
    expect(component.headerForm.getRawValue().notes).toBe('Notas de prueba');
    expect(component.selectedClientId).toBe(1);
  });

  it('deshabilita headerForm si la orden no está PENDING', () => {
    const { component } = setup({ order: makeOrder({ status: 'APPROVED' }) });
    expect(component.headerForm.disabled).toBe(true);
  });

  it('deshabilita headerForm para roles sin permiso de edición aunque esté PENDING', () => {
    const { component } = setup({ roles: ['ROLE_WAREHOUSEMAN'], order: makeOrder({ status: 'PENDING' }) });
    expect(component.headerForm.disabled).toBe(true);
  });

  it('navega a /sales/orders si falla la carga de la orden', () => {
    const { mockRouter, mockSnackBar } = setup({
      orderServiceOverrides: { getById: vi.fn().mockReturnValue(throwError(() => ({ error: { message: 'No encontrada' } }))) },
    });
    expect(mockSnackBar.open).toHaveBeenCalledWith('No encontrada', 'Cerrar', expect.objectContaining({ panelClass: ['snackbar-error'] }));
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/sales/orders']);
  });

});

// ─── goBack ──────────────────────────────────────────────────────────────────────

describe('SaleOrderDetailPageComponent — goBack', () => {

  it('navega a /sales/orders sin query params si no hay "from"', () => {
    const { component, mockRouter } = setup();
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/sales/orders'], {});
  });

  it('navega a /sales/orders con tab=from si el query param existe', () => {
    const { component, mockRouter } = setup({ queryFrom: 'APPROVED' });
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/sales/orders'], { queryParams: { tab: 'APPROVED' } });
  });

});

// ─── RBAC ────────────────────────────────────────────────────────────────────────

describe('SaleOrderDetailPageComponent — RBAC', () => {

  it('canCreateOrder: ADMIN, MANAGER y SALES pueden crear; WAREHOUSEMAN no', () => {
    expect(setup({ roles: ['ROLE_ADMIN'] }).component.canCreateOrder()).toBe(true);
    expect(setup({ roles: ['ROLE_MANAGER'] }).component.canCreateOrder()).toBe(true);
    expect(setup({ roles: ['ROLE_SALES'] }).component.canCreateOrder()).toBe(true);
    expect(setup({ roles: ['ROLE_WAREHOUSEMAN'] }).component.canCreateOrder()).toBe(false);
  });

  it('canApprove: solo ADMIN/MANAGER y orden PENDING', () => {
    expect(setup({ roles: ['ROLE_ADMIN'], order: makeOrder({ status: 'PENDING' }) }).component.canApprove()).toBe(true);
    expect(setup({ roles: ['ROLE_SALES'], order: makeOrder({ status: 'PENDING' }) }).component.canApprove()).toBe(false);
    expect(setup({ roles: ['ROLE_ADMIN'], order: makeOrder({ status: 'APPROVED' }) }).component.canApprove()).toBe(false);
  });

  it('canDeliver: ADMIN/MANAGER/WAREHOUSEMAN y orden APPROVED', () => {
    expect(setup({ roles: ['ROLE_WAREHOUSEMAN'], order: makeOrder({ status: 'APPROVED' }) }).component.canDeliver()).toBe(true);
    expect(setup({ roles: ['ROLE_SALES'], order: makeOrder({ status: 'APPROVED' }) }).component.canDeliver()).toBe(false);
    expect(setup({ roles: ['ROLE_WAREHOUSEMAN'], order: makeOrder({ status: 'PENDING' }) }).component.canDeliver()).toBe(false);
  });

  it('canCancel: roles con canCreateOrder y orden PENDING/APPROVED', () => {
    expect(setup({ roles: ['ROLE_SALES'], order: makeOrder({ status: 'PENDING' }) }).component.canCancel()).toBe(true);
    expect(setup({ roles: ['ROLE_SALES'], order: makeOrder({ status: 'APPROVED' }) }).component.canCancel()).toBe(true);
    expect(setup({ roles: ['ROLE_SALES'], order: makeOrder({ status: 'DELIVERED' }) }).component.canCancel()).toBe(false);
    expect(setup({ roles: ['ROLE_WAREHOUSEMAN'], order: makeOrder({ status: 'PENDING' }) }).component.canCancel()).toBe(false);
  });

  it('canSeeCost: solo ADMIN y MANAGER (H2/L29)', () => {
    expect(setup({ roles: ['ROLE_ADMIN'] }).component.canSeeCost()).toBe(true);
    expect(setup({ roles: ['ROLE_MANAGER'] }).component.canSeeCost()).toBe(true);
    expect(setup({ roles: ['ROLE_WAREHOUSEMAN'] }).component.canSeeCost()).toBe(false);
    expect(setup({ roles: ['ROLE_SALES'] }).component.canSeeCost()).toBe(false);
  });

  it('canEditHeader/canEditDetails: true en modo nuevo para roles que crean', () => {
    const { component } = setup({ roles: ['ROLE_SALES'], routeId: 'new' });
    expect(component.canEditHeader()).toBe(true);
    expect(component.canEditDetails()).toBe(true);
  });

  it('canEditHeader/canEditDetails: false si la orden ya no está PENDING', () => {
    const { component } = setup({ roles: ['ROLE_SALES'], order: makeOrder({ status: 'APPROVED' }) });
    expect(component.canEditHeader()).toBe(false);
    expect(component.canEditDetails()).toBe(false);
  });

});

// ─── detailColumns (H2/L29) ───────────────────────────────────────────────────────

describe('SaleOrderDetailPageComponent — detailColumns', () => {

  it('ADMIN ve unitCost/margin + actions en orden existente PENDING', () => {
    const { component } = setup({ roles: ['ROLE_ADMIN'], order: makeOrder({ status: 'PENDING' }) });
    expect(component.detailColumns).toEqual(['product', 'quantity', 'unitPrice', 'subtotal', 'unitCost', 'margin', 'actions']);
  });

  it('SALES no ve unitCost/margin', () => {
    const { component } = setup({ roles: ['ROLE_SALES'], order: makeOrder({ status: 'PENDING' }) });
    expect(component.detailColumns).not.toContain('unitCost');
    expect(component.detailColumns).not.toContain('margin');
  });

  it('WAREHOUSEMAN no ve unitCost/margin ni acciones de edición', () => {
    const { component } = setup({ roles: ['ROLE_WAREHOUSEMAN'], order: makeOrder({ status: 'PENDING' }) });
    expect(component.detailColumns).toEqual(['product', 'quantity', 'unitPrice', 'subtotal']);
  });

  it('modo nuevo usa pendingActions en lugar de actions', () => {
    const { component } = setup({ roles: ['ROLE_SALES'], routeId: 'new' });
    expect(component.detailColumns).toContain('pendingActions');
    expect(component.detailColumns).not.toContain('actions');
  });

  it('orden no editable (APPROVED) no muestra columna de acciones', () => {
    const { component } = setup({ roles: ['ROLE_SALES'], order: makeOrder({ status: 'APPROVED' }) });
    expect(component.detailColumns).not.toContain('actions');
    expect(component.detailColumns).not.toContain('pendingActions');
  });

});

// ─── statusHistory (D4) ────────────────────────────────────────────────────────────

describe('SaleOrderDetailPageComponent — statusHistory', () => {

  it('retorna 3 filas: Aprobada, Entregada, Cancelada', () => {
    const { component } = setup();
    const history = component.statusHistory;
    expect(history.map(h => h.label)).toEqual(['Aprobada', 'Entregada', 'Cancelada']);
  });

  it('filas sin fecha tienen username y at en null', () => {
    const { component } = setup({ order: makeOrder() });
    const history = component.statusHistory;
    expect(history.every(h => h.at === null && h.username === null)).toBe(true);
  });

  it('refleja approvedAt/approvedByUsername cuando existen', () => {
    const { component } = setup({
      order: makeOrder({ approvedAt: '2026-06-05T10:00:00', approvedByUsername: 'manager01' }),
    });
    const aprobada = component.statusHistory.find(h => h.label === 'Aprobada')!;
    expect(aprobada.at).toBe('2026-06-05T10:00:00');
    expect(aprobada.username).toBe('manager01');
  });

  it('retorna lista vacía en modo nuevo (sin orden)', () => {
    const { component } = setup({ routeId: 'new' });
    expect(component.statusHistory).toEqual([]);
  });

});

// ─── Autocomplete de cliente ────────────────────────────────────────────────────────

describe('SaleOrderDetailPageComponent — autocomplete de cliente', () => {

  it('filterClients filtra case/accent-insensitive', () => {
    const { component } = setup({
      clients: [makeClient({ id: 1, name: 'Óscar Pérez' }), makeClient({ id: 2, name: 'María López' })],
    });
    component.filterClients('oscar');
    expect(component.filteredClients.length).toBe(1);
    expect(component.filteredClients[0].id).toBe(1);
  });

  it('onClientSelected actualiza selectedClientId', () => {
    const { component } = setup({ routeId: 'new' });
    component.onClientSelected(makeClient({ id: 99, name: 'Nuevo Cliente' }));
    expect(component.selectedClientId).toBe(99);
  });

  it('displayClient retorna el nombre del cliente', () => {
    const { component } = setup();
    expect(component.displayClient(makeClient({ name: 'Cliente ABC' }))).toBe('Cliente ABC');
    expect(component.displayClient(null)).toBe('');
    expect(component.displayClient('texto libre')).toBe('texto libre');
  });

});

// ─── Creación de orden ───────────────────────────────────────────────────────────

describe('SaleOrderDetailPageComponent — createOrder', () => {

  it('no crea la orden si no hay cliente seleccionado', () => {
    const { component, mockOrderService } = setup({ routeId: 'new' });
    component.pendingDetailRows = [{ productId: 10, quantity: 1, unitPrice: 100, productSku: 'LUB-001', productName: 'Aceite' }];
    component.createOrder();
    expect(mockOrderService.create).not.toHaveBeenCalled();
  });

  it('no crea la orden si no hay líneas de detalle', () => {
    const { component, mockOrderService } = setup({ routeId: 'new' });
    component.selectedClientId = 1;
    component.createOrder();
    expect(mockOrderService.create).not.toHaveBeenCalled();
  });

  it('crea la orden y navega al detalle al tener éxito', () => {
    const { component, mockOrderService, mockRouter, mockSnackBar } = setup({ routeId: 'new', order: makeOrder({ id: 50 }) });
    component.selectedClientId = 1;
    component.pendingDetailRows = [{ productId: 10, quantity: 2, unitPrice: 100, productSku: 'LUB-001', productName: 'Aceite' }];
    component.createOrder();
    expect(mockOrderService.create).toHaveBeenCalledWith({
      clientId: 1, notes: null,
      details: [{ productId: 10, quantity: 2, unitPrice: 100 }],
    });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/sales/orders', 50]);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Orden creada correctamente.', 'Cerrar', expect.objectContaining({ panelClass: ['snackbar-success'] }));
  });

  it('muestra snackbar de error si falla la creación', () => {
    const { component, mockSnackBar } = setup({
      routeId: 'new',
      orderServiceOverrides: { create: vi.fn().mockReturnValue(throwError(() => ({ error: { message: 'Cliente inválido' } }))) },
    });
    component.selectedClientId = 1;
    component.pendingDetailRows = [{ productId: 10, quantity: 1, unitPrice: 100, productSku: 'LUB-001', productName: 'Aceite' }];
    component.createOrder();
    expect(mockSnackBar.open).toHaveBeenCalledWith('Cliente inválido', 'Cerrar', expect.objectContaining({ panelClass: ['snackbar-error'] }));
  });

});

// ─── saveHeader (L25) ─────────────────────────────────────────────────────────────

describe('SaleOrderDetailPageComponent — saveHeader (L25)', () => {

  it('llama a update con clientId y notes, y marca el formulario como pristine', () => {
    const { component, mockOrderService, mockSnackBar } = setup({ order: makeOrder({ id: 7, status: 'PENDING' }) });
    component.headerForm.patchValue({ notes: 'Nueva nota' });
    component.headerForm.markAsDirty();
    expect(component.headerForm.dirty).toBe(true);

    component.saveHeader();

    expect(mockOrderService.update).toHaveBeenCalledWith(7, { clientId: 1, notes: 'Nueva nota' });
    expect(component.headerForm.dirty).toBe(false);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Orden actualizada.', 'Cerrar', expect.objectContaining({ panelClass: ['snackbar-success'] }));
  });

  it('no llama a update si no hay cliente seleccionado', () => {
    const { component, mockOrderService } = setup({ order: makeOrder({ status: 'PENDING' }) });
    component.selectedClientId = null;
    component.saveHeader();
    expect(mockOrderService.update).not.toHaveBeenCalled();
  });

  it('muestra snackbar de error si falla update', () => {
    const { component, mockSnackBar } = setup({
      order: makeOrder({ status: 'PENDING' }),
      orderServiceOverrides: { update: vi.fn().mockReturnValue(throwError(() => ({ error: { message: 'Error de validación' } }))) },
    });
    component.headerForm.patchValue({ notes: 'x' });
    component.saveHeader();
    expect(mockSnackBar.open).toHaveBeenCalledWith('Error de validación', 'Cerrar', expect.objectContaining({ panelClass: ['snackbar-error'] }));
  });

});

// ─── Transiciones de estado (R4/R7/R10) ────────────────────────────────────────────

describe('SaleOrderDetailPageComponent — approve (R4)', () => {

  it('muestra error si la orden no tiene líneas de detalle', () => {
    const { component, mockSnackBar, mockDialog } = setup({ order: makeOrder({ status: 'PENDING', details: [] }) });
    component.approve();
    expect(mockSnackBar.open).toHaveBeenCalledWith('La orden no tiene líneas de detalle.', 'Cerrar', expect.objectContaining({ panelClass: ['snackbar-error'] }));
    expect(mockDialog.open).not.toHaveBeenCalled();
  });

  it('abre el preview de stock con availableStock y aprueba al confirmar', () => {
    const { component, mockOrderService, mockProductService, mockDialog, mockSnackBar } = setup({
      order: makeOrder({ id: 3, status: 'PENDING', details: [makeDetail({ productId: 10, quantity: 5 })] }),
      productServiceOverrides: { getById: vi.fn().mockReturnValue(of(makeProduct({ id: 10, availableStock: 20, currentStock: 30 }))) },
      dialogAfterClosed: true,
    });

    component.approve();

    expect(mockProductService.getById).toHaveBeenCalledWith(10);
    expect(mockDialog.open).toHaveBeenCalled();
    const dialogData = mockDialog.open.mock.calls[0][1].data;
    expect(dialogData.availableLabel).toBe('Disponible');
    expect(dialogData.items[0]).toEqual({ productSku: 'LUB-001', productName: 'Aceite Lubricante 20W-50', quantity: 5, available: 20 });

    expect(mockOrderService.approve).toHaveBeenCalledWith(3);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Orden aprobada correctamente.', 'Cerrar', expect.objectContaining({ panelClass: ['snackbar-success'] }));
  });

  it('no llama a approve si el diálogo se cancela', () => {
    const { component, mockOrderService } = setup({
      order: makeOrder({ status: 'PENDING' }),
      dialogAfterClosed: false,
    });
    component.approve();
    expect(mockOrderService.approve).not.toHaveBeenCalled();
  });

  it('(L33) un producto que falla al cargar se trata como available=0 sin romper el preview', () => {
    const { component, mockDialog } = setup({
      order: makeOrder({ status: 'PENDING', details: [makeDetail({ productId: 10, quantity: 5 })] }),
      productServiceOverrides: { getById: vi.fn().mockReturnValue(throwError(() => ({ status: 404 }))) },
    });

    component.approve();

    const dialogData = mockDialog.open.mock.calls[0][1].data;
    expect(dialogData.items[0].available).toBe(0);
  });

});

describe('SaleOrderDetailPageComponent — deliver (R7)', () => {

  it('abre el preview de stock con currentStock y entrega al confirmar', () => {
    const { component, mockOrderService, mockDialog, mockSnackBar } = setup({
      order: makeOrder({ id: 4, status: 'APPROVED', details: [makeDetail({ productId: 10, quantity: 5 })] }),
      productServiceOverrides: { getById: vi.fn().mockReturnValue(of(makeProduct({ id: 10, availableStock: 20, currentStock: 30 }))) },
      dialogAfterClosed: true,
    });

    component.deliver();

    const dialogData = mockDialog.open.mock.calls[0][1].data;
    expect(dialogData.availableLabel).toBe('Stock físico');
    expect(dialogData.items[0].available).toBe(30);

    expect(mockOrderService.deliver).toHaveBeenCalledWith(4);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Orden entregada correctamente.', 'Cerrar', expect.objectContaining({ panelClass: ['snackbar-success'] }));
  });

});

describe('SaleOrderDetailPageComponent — cancel (R10)', () => {

  it('mensaje de confirmación menciona liberación de reserva si la orden está APPROVED', () => {
    const { component, mockDialog } = setup({ order: makeOrder({ status: 'APPROVED' }) });
    component.cancel();
    const dialogData = mockDialog.open.mock.calls[0][1].data;
    expect(dialogData.message).toContain('liberará la reserva de stock');
    expect(dialogData.dangerous).toBe(true);
  });

  it('mensaje de confirmación no menciona reserva si la orden está PENDING', () => {
    const { component, mockDialog } = setup({ order: makeOrder({ status: 'PENDING' }) });
    component.cancel();
    const dialogData = mockDialog.open.mock.calls[0][1].data;
    expect(dialogData.message).not.toContain('reserva');
  });

  it('llama a cancel al confirmar', () => {
    const { component, mockOrderService, mockSnackBar } = setup({ order: makeOrder({ id: 8, status: 'PENDING' }), dialogAfterClosed: true });
    component.cancel();
    expect(mockOrderService.cancel).toHaveBeenCalledWith(8);
    expect(mockSnackBar.open).toHaveBeenCalledWith('Orden cancelada correctamente.', 'Cerrar', expect.objectContaining({ panelClass: ['snackbar-success'] }));
  });

  it('no llama a cancel si el diálogo se cancela', () => {
    const { component, mockOrderService } = setup({ order: makeOrder({ status: 'PENDING' }), dialogAfterClosed: false });
    component.cancel();
    expect(mockOrderService.cancel).not.toHaveBeenCalled();
  });

});

// ─── Gestión de líneas de detalle ──────────────────────────────────────────────────

describe('SaleOrderDetailPageComponent — gestión de líneas (modo nuevo)', () => {

  it('openAddDetail agrega una línea a pendingDetailRows en modo creación', () => {
    const { component, mockDialog } = setup({ routeId: 'new' });
    mockDialog.open.mockReturnValue({
      afterClosed: () => of({
        mode: 'create',
        dto: { productId: 10, quantity: 2, unitPrice: 100 },
        productSku: 'LUB-001', productName: 'Aceite Lubricante 20W-50',
      }),
    });

    component.openAddDetail();

    expect(component.pendingDetailRows.length).toBe(1);
    expect(component.pendingDetailRows[0].productId).toBe(10);
  });

  it('removePendingDetail elimina la fila de pendingDetailRows', () => {
    const { component } = setup({ routeId: 'new' });
    const row = { productId: 10, quantity: 2, unitPrice: 100, productSku: 'LUB-001', productName: 'Aceite' };
    component.pendingDetailRows = [row];
    component.removePendingDetail(row);
    expect(component.pendingDetailRows.length).toBe(0);
  });

  it('existingProductIds refleja pendingDetailRows en modo nuevo', () => {
    const { component } = setup({ routeId: 'new' });
    component.pendingDetailRows = [{ productId: 10, quantity: 1, unitPrice: 100, productSku: 'LUB-001', productName: 'Aceite' }];
    expect(component.existingProductIds).toEqual([10]);
  });

});

describe('SaleOrderDetailPageComponent — gestión de líneas (orden existente)', () => {

  it('openAddDetail llama a addDetail y recarga la orden', () => {
    const { component, mockOrderService, mockDialog, mockSnackBar } = setup({ order: makeOrder({ id: 5, status: 'PENDING' }) });
    mockDialog.open.mockReturnValue({
      afterClosed: () => of({ mode: 'create', dto: { productId: 20, quantity: 1, unitPrice: 50 }, productSku: 'X', productName: 'Y' }),
    });

    component.openAddDetail();

    expect(mockOrderService.addDetail).toHaveBeenCalledWith(5, { productId: 20, quantity: 1, unitPrice: 50 });
    expect(mockSnackBar.open).toHaveBeenCalledWith('Línea agregada.', 'Cerrar', expect.objectContaining({ panelClass: ['snackbar-success'] }));
  });

  it('openEditDetail llama a updateDetail con el id correcto', () => {
    const { component, mockOrderService, mockDialog, mockSnackBar } = setup({
      order: makeOrder({ id: 5, status: 'PENDING', details: [makeDetail({ id: 99 })] }),
    });
    mockDialog.open.mockReturnValue({
      afterClosed: () => of({ mode: 'edit', dto: { quantity: 9, unitPrice: 150 } }),
    });

    component.openEditDetail(makeDetail({ id: 99 }));

    expect(mockOrderService.updateDetail).toHaveBeenCalledWith(5, 99, { quantity: 9, unitPrice: 150 });
    expect(mockSnackBar.open).toHaveBeenCalledWith('Línea actualizada.', 'Cerrar', expect.objectContaining({ panelClass: ['snackbar-success'] }));
  });

  it('existingProductIds refleja order.details en orden existente', () => {
    const { component } = setup({ order: makeOrder({ details: [makeDetail({ productId: 10 }), makeDetail({ id: 2, productId: 20 })] }) });
    expect(component.existingProductIds).toEqual([10, 20]);
  });

});

// ─── removeDetail (L26) ─────────────────────────────────────────────────────────────

describe('SaleOrderDetailPageComponent — removeDetail (L26)', () => {

  it('bloquea la eliminación si es la única línea de la orden', () => {
    const { component, mockOrderService, mockSnackBar, mockDialog } = setup({
      order: makeOrder({ details: [makeDetail({ id: 1 })] }),
    });

    component.removeDetail(makeDetail({ id: 1 }));

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'No se puede eliminar la única línea. Una orden debe tener al menos un producto.',
      'Cerrar',
      expect.objectContaining({ panelClass: ['snackbar-error'] }),
    );
    expect(mockDialog.open).not.toHaveBeenCalled();
    expect(mockOrderService.removeDetail).not.toHaveBeenCalled();
  });

  it('elimina la línea y recarga la orden cuando hay más de una línea', () => {
    const { component, mockOrderService, mockDialog } = setup({
      order: makeOrder({ id: 6, details: [makeDetail({ id: 1 }), makeDetail({ id: 2, productId: 20 })] }),
      dialogAfterClosed: true,
    });

    component.removeDetail(makeDetail({ id: 2, productId: 20 }));

    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockOrderService.removeDetail).toHaveBeenCalledWith(6, 2);
  });

  it('no elimina si el diálogo de confirmación se cancela', () => {
    const { component, mockOrderService } = setup({
      order: makeOrder({ details: [makeDetail({ id: 1 }), makeDetail({ id: 2, productId: 20 })] }),
      dialogAfterClosed: false,
    });

    component.removeDetail(makeDetail({ id: 2, productId: 20 }));

    expect(mockOrderService.removeDetail).not.toHaveBeenCalled();
  });

});

// ─── Helpers de presentación ──────────────────────────────────────────────────────

describe('SaleOrderDetailPageComponent — helpers de presentación', () => {

  it('getStatusClass mapea cada estado a su clase CSS', () => {
    const { component } = setup();
    expect(component.getStatusClass('PENDING')).toBe('status--pending');
    expect(component.getStatusClass('APPROVED')).toBe('status--approved');
    expect(component.getStatusClass('DELIVERED')).toBe('status--delivered');
    expect(component.getStatusClass('CANCELLED')).toBe('status--cancelled');
  });

  it('margin retorna unitPrice - unitCost cuando unitCost no es null', () => {
    const { component } = setup();
    expect(component.margin(makeDetail({ unitPrice: 100, unitCost: 60 }))).toBe(40);
  });

  it('margin retorna null cuando unitCost es null (H2/L29)', () => {
    const { component } = setup();
    expect(component.margin(makeDetail({ unitCost: null }))).toBeNull();
  });

});
