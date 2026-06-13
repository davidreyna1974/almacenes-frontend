// Contrato exacto del backend: ClientDTO
// Fuente: ClientController.java + ClientDTO.java — verificado 2026-06-13
export interface ClientDTO {
  id:                 number | null;
  name:               string;
  rfc:                string | null;
  contactName:        string | null;
  phone:              string | null;
  email:              string | null;
  address:            string | null;
  active:             boolean;
  createdAt:          string | null;
  createdById:        number | null;
  createdByUsername:  string | null;
  updatedAt:          string | null;
  updatedById:        number | null;
  updatedByUsername:  string | null;
}

// Body de POST /sales/clients y PUT /sales/clients/{id}
export interface ClientRequest {
  name:        string;          // NotBlank, max 150
  rfc:         string | null;    // max 13
  contactName: string | null;    // max 100
  phone:       string | null;    // max 20
  email:       string | null;    // formato válido
  address:     string | null;
}
