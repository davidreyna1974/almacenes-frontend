export type MovementType = 'IN' | 'OUT';

export interface StockMovementRequestDTO {
  productId: number;
  quantity: number;
  reason: string;
  type: MovementType;
}

export interface StockMovementResponseDTO {
  id: number;
  quantity: number;
  reason: string;
  createdAt: string;
  type: MovementType;
  productId: number;
  productName: string;
  createdByUsername: string;
}
