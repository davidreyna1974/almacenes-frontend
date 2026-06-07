export interface CategoryDTO {
  id: number;
  name: string;
  description: string;
  active: boolean;
  createdAt: string;
  createdByUsername: string;
}

export interface CategoryRequest {
  name: string;
  description?: string;
}
