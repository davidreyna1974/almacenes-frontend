export const environment = {
  production: true,
  // URL RELATIVA a propósito: en producción nginx sirve la SPA y proxea /api/ al
  // backend en el MISMO origen, por lo que no se necesita el dominio aquí. Esto
  // hace el build agnóstico del dominio (sirve para cualquier dominio/cliente/nube).
  apiUrl: '/api/v1',
  sentryDsn: ''  // reemplazar con el DSN real antes del go-live
};
