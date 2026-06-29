// Contratos exactos del backend — ReportsController + DTOs
// Verificados en código fuente: 2026-06-15

export type AbcClassification = 'A' | 'B' | 'C';
export type MovementType = 'IN' | 'OUT';
export type TurnoverInterpretation = 'Alta' | 'Media' | 'Baja' | 'Sin datos';
export type OrderStatus = 'PENDING' | 'APPROVED';
export type TrendGroupBy = 'DAY' | 'WEEK' | 'MONTH';

// E1 — GET /reports/dashboard/executive
export interface ExecutiveDashboardDTO {
  totalRevenue: number;
  totalCogs: number;
  grossMargin: number;
  grossMarginPct: number | null;
  inventoryValue: number;
  pendingPurchaseOrders: number;
  pendingSaleOrders: number;
  generatedAt: string;
}

// E2 — GET /reports/inventory/valuation
export interface InventoryValuationCategoryDTO {
  categoryId: number;
  categoryName: string;
  productCount: number;
  categoryValue: number;
  pct: number;
}

export interface InventoryValuationDTO {
  totalValue: number;
  generatedAt: string;
  categories: InventoryValuationCategoryDTO[];
}

// E3 — GET /reports/sales/profitability (from y to OBLIGATORIOS)
export interface SalesProfitabilityDTO {
  from: string;
  to: string;
  totalRevenue: number;
  totalCogs: number;
  grossMargin: number;
  grossMarginPct: number | null;
  deliveredOrderCount: number;
  avgTicket: number | null;
  generatedAt: string;
}

// G1 — GET /reports/products/top-performers
export interface TopProductDTO {
  rank: number;
  productId: number;
  sku: string;
  name: string;
  categoryName: string;
  totalQuantitySold: number;
  totalRevenue: number;
  totalCogs: number;
  grossMargin: number;
  grossMarginPct: number | null;
}

// G2 — GET /reports/inventory/abc
export interface AbcProductDTO {
  classification: AbcClassification;
  productId: number;
  sku: string;
  name: string;
  totalRevenue: number;
  revenuePct: number;
  cumulativePct: number;
}

// G3 — GET /reports/inventory/turnover
export interface InventoryTurnoverItemDTO {
  productId: number;
  sku: string;
  name: string;
  categoryName: string;
  cogsInPeriod: number;
  currentInventoryValue: number;
  turnoverRate: number | null;
  interpretation: TurnoverInterpretation;
}

// G4 — GET /reports/purchases/by-supplier
export interface PurchaseBySupplierDTO {
  supplierId: number;
  supplierName: string;
  rfc: string;
  orderCount: number;
  totalAmount: number;
  avgOrderAmount: number;
  lastOrderDate: string | null;
}

// G5 — GET /reports/sales/trend
export interface SalesTrendItemDTO {
  period: string;
  revenue: number;
  orderCount: number;
  avgTicket: number | null;
}

// O1 — GET /reports/inventory/low-stock
export interface LowStockReportItemDTO {
  productId: number;
  sku: string;
  name: string;
  categoryName: string;
  currentStock: number;
  minimumStock: number;
  availableStock: number;
  reservedStock: number;
  deficit: number;
}

// O2 — GET /reports/inventory/kardex/{productId}
export interface KardexMovementItemDTO {
  date: string;
  type: MovementType;
  quantity: number;
  reason: string;
  balance: number;
  createdByUsername: string;
}

export interface KardexReportDTO {
  productId: number;
  sku: string;
  name: string;
  from: string | null;
  to: string | null;
  openingStock: number;
  closingStock: number;
  totalIn: number;
  totalOut: number;
  movements: KardexMovementItemDTO[];
}

// O3 — GET /reports/operations/pending
export interface PendingOrderSummaryDTO {
  orderId: number;
  orderNumber: string;
  status: OrderStatus;
  counterpartName: string;
  createdAt: string;
  totalAmount: number;
  detailCount: number;
}

export interface PendingOperationsDTO {
  pendingPurchaseOrders: PendingOrderSummaryDTO[];
  pendingSaleOrders: PendingOrderSummaryDTO[];
  totalPendingPurchases: number;
  totalPendingSales: number;
}

// O4 — GET /reports/inventory/movements
export interface MovementsSummaryDTO {
  from: string | null;
  to: string | null;
  totalIn: number;
  totalOut: number;
  netMovement: number;
}
