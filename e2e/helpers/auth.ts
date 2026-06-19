import { Page } from '@playwright/test';

export const CREDENTIALS = {
  admin:      { username: 'admin',         password: 'Admin123!',       role: 'ADMIN' },
  manager:    { username: 'qa_manager',    password: 'QaManager123!',   role: 'MANAGER' },
  sales:      { username: 'qa_sales',      password: 'QaSales123!',     role: 'SALES' },
  warehouse:  { username: 'qa_warehouse',  password: 'QaWarehouse123!', role: 'WAREHOUSEMAN' },
};

export type RoleKey = keyof typeof CREDENTIALS;

export async function login(page: Page, role: RoleKey = 'admin'): Promise<void> {
  const { username, password } = CREDENTIALS[role];
  await page.goto('/login');
  await page.getByLabel(/usuario/i).fill(username);
  // Usar role textbox para evitar ambigüedad con el botón de mostrar/ocultar contraseña
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(password);
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  // Esperar a que salga de /login (el layout se carga en /)
  await page.waitForURL(url => !url.href.includes('/login'), { timeout: 10000 });
  // Esperar a que el sidebar esté visible como señal de que el layout cargó
  await page.getByRole('navigation', { name: 'Navegación principal' }).waitFor({ timeout: 8000 });
}

export async function clearSession(page: Page): Promise<void> {
  // Navegar al home primero para que localStorage sea accesible en el dominio correcto
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
}

export async function logout(page: Page): Promise<void> {
  await clearSession(page);
  await page.goto('/login');
}
