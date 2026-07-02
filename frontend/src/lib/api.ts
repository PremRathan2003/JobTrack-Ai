import { auth } from './firebase';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData)
        ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get('content-type') || '';
  return (ct.includes('json') ? res.json() : res.text()) as Promise<T>;
}

export const apiBase = BASE;
