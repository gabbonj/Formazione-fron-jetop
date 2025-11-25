export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.twitter.server.jetop.com';

async function request(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = text;
  }

  if (!res.ok) {
    throw { status: res.status, data };
  }

  return data;
}

export async function register(payload: { username: string; email: string; password: string }) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function loginStep1(payload: { username: string; password: string }) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function verifyOtp(payload: { temp_token: string; otp_token: string }) {
  return request('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchComments(token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return request('/api/comments', {
    method: 'GET',
    headers,
  });
}

export function saveToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('jt_token', token);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('jt_token');
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('jt_token');
}

export default { API_BASE, request, register, loginStep1, verifyOtp, fetchComments, saveToken, getToken, clearToken };
