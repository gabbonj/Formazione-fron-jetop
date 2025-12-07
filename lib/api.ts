export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

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

// Count posts authored by a user by leveraging the posts list endpoint (which returns an exact count)
export async function fetchPostsCountByUser(user_id: string) {
  const res = await fetchPosts({ user_id, limit: 1, offset: 0 });
  if (res && typeof (res as any).count === 'number') return (res as any).count as number;
  if (Array.isArray((res as any)?.items)) return (res as any).items.length;
  if (Array.isArray(res)) return res.length;
  return 0;
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
export function getUserIdFromToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decode = (input: string) => {
      if (typeof atob === 'function') return atob(input);
      if (typeof Buffer !== 'undefined') return Buffer.from(input, 'base64').toString('binary');
      return '';
    };
    const json = decodeURIComponent(
      decode(b64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    const obj = JSON.parse(json);
    return (obj.userId || obj.sub || obj.user_id || obj.id || obj.uid) ?? null;
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

// Fetch a user by username using the list endpoint with query `q`.
export async function fetchUserByUsername(username: string) {
  const qs = new URLSearchParams({ q: username, limit: '1' });
  const path = `/api/users?${qs.toString()}`;
  const res = await request(path, { method: 'GET' });
  if (!res) return null;
  // API may return { items: [...] } or an array
  if (Array.isArray(res)) return res[0] || null;
  if (Array.isArray(res.items)) return res.items[0] || null;
  if (Array.isArray(res.data)) return res.data[0] || null;
  // If API returned a single user object, try to detect that
  if (res.user) return res.user;
  return null;
}

export async function fetchLikesCount(post_id: string, token?: string) {
  const qs = new URLSearchParams({ post_id, count: 'true' });
  const res = await request(`/api/likes?${qs.toString()}`, { method: 'GET' });

  const countValue =
    res == null
      ? 0
      : typeof res.count === 'number'
        ? res.count
        : Array.isArray(res.items)
          ? res.items.length
          : typeof res === 'number'
            ? res
            : 0;

  let liked = false;
  const userId = token ? getUserIdFromToken(token) : null;

  if (userId) {
    const userQs = new URLSearchParams({ post_id, user_id: userId, count: 'true' });
    try {
      const userRes = await request(`/api/likes?${userQs.toString()}`, { method: 'GET' });
      const userCount =
        userRes == null
          ? 0
          : typeof userRes.count === 'number'
            ? userRes.count
            : Array.isArray(userRes.items)
              ? userRes.items.length
              : typeof userRes === 'number'
                ? userRes
                : 0;
      liked = userCount > 0;
    } catch (e) {
      liked = false;
    }
  }

  // Fallback: if the initial response included items, detect liked from there without a second call
  if (!liked && userId && Array.isArray(res?.items)) {
    liked = res.items.some((it: any) => String(it?.user_id ?? it?.user?.id ?? it?.user ?? it?.id ?? it) === String(userId));
  }

  return { count: countValue, liked };
}

export async function fetchLikesCountByUser(user_id: string) {
  const qs = new URLSearchParams({ user_id, count: 'true' });
  const res = await request(`/api/likes?${qs.toString()}`, { method: 'GET' });
  if (res && typeof (res as any).count === 'number') return (res as any).count as number;
  if (typeof res === 'number') return res;
  return 0;
}

// Count how many comments a user has written by paging through the comments list endpoint
export async function fetchCommentsCountByUser(user_id: string) {
  const limit = 100;
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;
  let totalForUser = 0;

  while (offset < total) {
    const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    const res = await request(`/api/comments?${qs.toString()}`, { method: 'GET' });

    const items = Array.isArray((res as any)?.items)
      ? (res as any).items
      : Array.isArray(res)
        ? (res as any)
        : [];

    const batchCount = items.filter((c: any) => String(c?.user_id ?? c?.user?.id) === String(user_id)).length;
    totalForUser += batchCount;

    if (typeof (res as any)?.count === 'number') total = (res as any).count as number;
    else if (items.length < limit) total = offset + items.length;

    if (items.length < limit) break; // nothing more to fetch
    offset += limit;
  }

  return totalForUser;
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
  fetchPostsCountByUser,
  fetchCurrentUser,
  updateUser,
  createPost,
  fetchUserByUsername,
  fetchLikesCount,
  fetchLikesCountByUser,
  fetchCommentsCountByUser,
  addLike,
  removeLike,
  createComment,
  fetchCommentsCount,
  saveToken,
  getToken,
  clearToken,
};
