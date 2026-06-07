// Contrato exacto del backend: SupplierDTO
// Fuente: SupplierController.java + SupplierDTO.java — verificado 2026-06-07
export interface SupplierDTO {
  id:                  number | null;
  rfc:                 string;
  companyName:         string;
  contactName:         string | null;
  phone:               string | null;
  email:               string | null;
  address:             string | null;
  active:              boolean;
  createdAt:           string | null;
  createdById:         number | null;
  createdByUsername:   string | null;
  updatedAt:           string | null;
  updatedById:         number | null;
  updatedByUsername:   string | null;
}
