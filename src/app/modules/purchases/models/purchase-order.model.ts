// Contratos exactos del backend: PurchaseOrder*DTO
// Fuente: PurchaseOrderController.java + DTOs — verificado 2026-06-07

export type PurchaseOrderStatus = 'PENDING' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrderDetailResponse {
  id:          number;
  quantity:    number;
  unitPrice:   number;
  subtotal:    number;
  productId:   number;
  productSku:  string;
  productName: string;
}

export interface PurchaseOrderResponse {
  id:                   number;
  orderNumber:          string;
  status:               PurchaseOrderStatus;
  notes:                string | null;
  totalAmount:          number;
  supplierId:           number;
  supplierName:         string;
  createdById:          number;
  createdByUsername:    string;
  createdAt:            string;
  updatedAt:            string | null;
  approvedAt:           string | null;
  approvedById:         number | null;
  approvedByUsername:   string | null;
  receivedAt:           string | null;
  receivedById:         number | null;
  receivedByUsername:   string | null;
  cancelledAt:          string | null;
  cancelledById:        number | null;
  cancelledByUsername:  string | null;
  details:              PurchaseOrderDetailResponse[];
}

export interface PurchaseOrderRequest {
  supplierId: number;
  notes:      string | null;
  details:    PurchaseOrderDetailRequest[];
}

export interface PurchaseOrderDetailRequest {
  productId:  number;
  quantity:   number;
  unitPrice:  number;
}

export interface PurchaseOrderUpdateRequest {
  supplierId: number;
  notes:      string | null;
}

export interface PurchaseOrderDetailUpdateRequest {
  quantity:  number;
  unitPrice: number;
}
