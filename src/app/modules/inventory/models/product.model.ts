export type ProductStatus = 'AVAILABLE' | 'DISCONTINUED' | 'OUT_OF_STOCK';

export interface ProductResponseDTO {
  id: number;
  sku: string;
  name: string;
  description: string;
  price: number;
  currentStock: number;
  minimumStock: number;
  status: ProductStatus;
  active: boolean;
  reservedStock: number;
  availableStock: number;
  unitCost: number;
  categoryId: number;
  categoryName: string;
  supplierId: number;
  createdAt: string;
  createdByUsername: string;
  updatedAt: string;
}

export interface ProductRequestDTO {
  sku: string;
  name: string;
  description?: string;
  price: number;
  currentStock?: number;
  minimumStock?: number;
  status: ProductStatus;
  categoryId: number;
  supplierId: number;
  unitCost: number;
}

export interface SupplierOption {
  id: number;
  name: string;
}
