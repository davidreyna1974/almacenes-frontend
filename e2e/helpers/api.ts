import { APIRequestContext } from '@playwright/test';

const BASE = 'http://localhost:8080/api/v1';
const TEST_PREFIX = 'TEST_';

let _adminToken: string | null = null;

export async function getAdminToken(request: APIRequestContext): Promise<string> {
  if (_adminToken) return _adminToken;
  const res = await request.post(`${BASE}/auth/login`, {
    data: { username: 'admin', password: 'Admin123!' },
  });
  const body = await res.json();
  _adminToken = body.token as string;
  return _adminToken;
}

export async function deleteProductByName(request: APIRequestContext, name: string): Promise<void> {
  if (!name.startsWith(TEST_PREFIX)) return;
  const token = await getAdminToken(request);
  const res = await request.get(`${BASE}/inventory/products?search=${encodeURIComponent(name)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) return;
  const page = await res.json();
  for (const p of page.content ?? []) {
    await request.delete(`${BASE}/inventory/products/${p.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
}

export function testName(base: string): string {
  return `${TEST_PREFIX}${base}_${Date.now()}`;
}
