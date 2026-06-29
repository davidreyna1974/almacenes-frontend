// Formato de error del GlobalExceptionHandler del backend
// Fuente: memoria_tecnica_global_proyecto.md §3
export interface ApiError {
  timestamp: string;
  status:    number;
  error:     string;
  message:   string;
}
