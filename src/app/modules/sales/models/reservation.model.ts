// Contratos exactos del backend: Reservation*DTO (solo lectura)
// Fuente: ReservationController.java + DTOs — verificado 2026-06-13

export interface ReservationSummary {
  totalProductsWithReservations: number;
  totalReservedUnits:            number;
  totalReservedValue:            number; // reservedStock × price (precio venta, no costo)
  totalApprovedOrders:           number;
}

export interface ReservedProductOrder {
  orderId:     number;
  orderNumber: string;
  quantity:    number;
  subtotal:    number;
  clientId:    number;
  clientName:  string;
  approvedAt:  string;
}

export interface ReservedProduct {
  productId:          number;
  productSku:         string;
  productName:        string;
  totalReservedQty:   number;
  unitPrice:          number;
  totalReservedValue: number;
  orders:             ReservedProductOrder[];
}

export interface ReservedClientOrder {
  orderId:     number;
  orderNumber: string;
  totalAmount: number;
  approvedAt:  string;
  totalItems:  number;
}

export interface ReservedClient {
  clientId:           number;
  clientName:         string;
  totalReservedOrders: number;
  totalReservedValue:  number;
  orders:              ReservedClientOrder[];
}
