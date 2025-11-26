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

export async function verifyOtp(payload: { temp_token: string; secret: string }) {
  return request('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchComments(params?: { post_id?: string; limit?: number; offset?: number }, token?: string) {
  const qs = new URLSearchParams();
  if (params?.post_id) qs.set('post_id', params.post_id);
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.offset) qs.set('offset', String(params.offset));
  const path = `/api/comments${qs.toString() ? `?${qs.toString()}` : ''}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return request(path, {
    method: 'GET',
    headers,
  });
}

export async function fetchCommentsCount(post_id: string) {
  const qs = new URLSearchParams({ post_id, limit: '1' });
  const path = `/api/comments?${qs.toString()}`;
  const res = await request(path, { method: 'GET' });
  // API may return { items: [...], count } or an array
  if (res == null) return 0;
  if (typeof res.count === 'number') return res.count;
  if (Array.isArray(res.items) && typeof res.items.length === 'number' && typeof res.count === 'number') return res.count;
  if (Array.isArray(res)) return res.length;
  if (Array.isArray(res.items)) return res.items.length;
  return 0;
}

export async function fetchPosts(params?: { limit?: number; offset?: number; user_id?: string }) {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.offset) qs.set('offset', String(params.offset));
  if (params?.user_id) qs.set('user_id', params.user_id);
  const path = `/api/posts${qs.toString() ? `?${qs.toString()}` : ''}`;
  return request(path, { method: 'GET' });
}

export async function fetchPost(id: string) {
  return request(`/api/posts/${id}`, { method: 'GET' });
}
// Fetch a user by id (UUID). Optionally pass a token for Authorization header.
export async function fetchUser(id: string, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return request(`/api/users/${id}`, { method: 'GET', headers });
}

// Try to extract user id from a JWT token's payload (base64url decode)
function getUserIdFromToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // atob is available in browsers; in Node this may not exist but this code runs client-side
    const json = decodeURIComponent(
      atob(b64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    const obj = JSON.parse(json);
    return (obj.sub || obj.user_id || obj.id || obj.uid) ?? null;
  } catch (e) {
    return null;
  }
}

// Fetch the current authenticated user by decoding the token to get the UUID
export async function fetchCurrentUser(token?: string) {
  if (!token) throw { status: 401, data: 'Missing token' };
  const id = getUserIdFromToken(token);
  if (!id) throw { status: 400, data: 'Unable to extract user id from token' };
  return fetchUser(id, token);
}

// Update current user profile (UserUpdate route on backend)
// Update current user profile (UserUpdate route on backend)
// This expects the user's id (UUID) to be provided and PATCHes /api/users/{id}
export async function updateUser(id: string, payload: Record<string, any>, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return request(`/api/users/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });
}

// Create a new post (requires Authorization header)
export async function createPost(payload: { content: string }, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return request('/api/posts', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
}

export async function fetchLikesCount(post_id: string) {
  const qs = new URLSearchParams({ post_id, count: 'true' });
  return request(`/api/likes?${qs.toString()}`, { method: 'GET' });
}

export async function addLike(post_id: string, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return request('/api/likes', {
    method: 'POST',
    headers,
    body: JSON.stringify({ post_id }),
  });
}

export async function removeLike(post_id: string, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return request('/api/likes', {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ post_id }),
  });
}

export async function createComment(payload: { post_id: string; content: string }, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return request('/api/comments', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
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

export default {
  API_BASE,
  request,
  register,
  loginStep1,
  verifyOtp,
  fetchComments,
  fetchPosts,
  fetchPost,
  fetchCurrentUser,
  updateUser,
  fetchLikesCount,
  addLike,
  removeLike,
  createComment,
  fetchCommentsCount,
  saveToken,
  getToken,
  clearToken,
};
