// Contrato exacto del backend: PageResponseDTO<T>
// Fuente: memoria_tecnica_global_proyecto.md §3
export interface PageResponse<T> {
  content:       T[];
  currentPage:   number;
  totalPages:    number;
  totalElements: number;
  size:          number;
  first:         boolean;
  last:          boolean;
}
