// Contratos exactos del backend: SaleOrder*DTO
// Fuente: SaleOrderController.java + DTOs — verificado 2026-06-13

export type SaleOrderStatus = 'PENDING' | 'APPROVED' | 'DELIVERED' | 'CANCELLED';

export interface SaleOrderDetailResponse {
  id:          number;
  quantity:    number;
  unitPrice:   number;
  unitCost:    number | null; // ⚠️ H2 (L29) — null/oculto para WAREHOUSEMAN/SALES
  subtotal:    number;
  productId:   number;
  productSku:  string;
  productName: string;
}

export interface SaleOrderResponse {
  id:                   number;
  orderNumber:          string;
  status:               SaleOrderStatus;
  notes:                string | null;
  totalAmount:          number;
  clientId:             number;
  clientName:           string;
  createdById:          number;
  createdByUsername:    string;
  createdAt:            string;
  updatedAt:            string | null;
  updatedById:          number | null;
  updatedByUsername:    string | null;
  approvedAt:           string | null;
  approvedById:         number | null;
  approvedByUsername:   string | null;
  deliveredAt:          string | null;
  deliveredById:        number | null;
  deliveredByUsername:  string | null;
  cancelledAt:          string | null;
  cancelledById:        number | null;
  cancelledByUsername:  string | null;
  details:              SaleOrderDetailResponse[];
}

// Body de POST /sales/orders
export interface SaleOrderRequest {
  clientId: number;
  notes:    string | null;
  details:  SaleOrderDetailRequest[]; // NotNull, Size(min=1)
}

export interface SaleOrderDetailRequest {
  productId: number;
  quantity:  number; // min 1
  unitPrice: number; // min 0.01
  // unitCost NO se envía — el backend lo lee de Product.unitCost
}

// Body de PUT /sales/orders/{id}
export interface SaleOrderUpdateRequest {
  clientId: number;
  notes:    string | null;
}

// Body de PUT /sales/orders/{id}/details/{detailId}
export interface SaleOrderDetailUpdateRequest {
  quantity:  number; // min 1
  unitPrice: number; // min 0.01
  // productId NO se incluye (cambio de producto = delete + add)
}
