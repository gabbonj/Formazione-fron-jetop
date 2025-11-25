import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getUsername(user: any): string {
  if (!user) return "anonimo";
  // If passed the whole post/comment object, try direct properties first
  if (typeof user.username === "string" && user.username.trim()) return user.username;
  if (typeof user.name === "string" && user.name.trim()) return user.name;

  // If passed a nested user object
  const maybe = user.user ?? user.author ?? user;
  if (typeof maybe === "string" && maybe.trim()) return maybe;
  if (maybe && typeof maybe.username === "string" && maybe.username.trim()) return maybe.username;
  if (maybe && typeof maybe.name === "string" && maybe.name.trim()) return maybe.name;

  // fallback to id-like
  if (user.user_id) return String(user.user_id);
  if (maybe && maybe.id) return String(maybe.id);
  if (user.id) return String(user.id);

  return "anonimo";
}

export function getUserSlug(obj: any): string {
  // prefer username, otherwise fallback to id
  if (!obj) return '';
  const name = getUsername(obj);
  if (name && name !== 'anonimo') return name;
  // try to find id
  const maybe = (obj.user ?? obj.author ?? obj) || null;
  if (maybe && maybe.id) return String(maybe.id);
  if (obj && obj.user_id) return String(obj.user_id);
  if (obj && obj.id) return String(obj.id);
  return '';
}

export function isLikelyId(value: string | null | undefined): boolean {
  if (!value) return false;
  // UUID v4-ish pattern
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(value)) return true;
  // numeric ids
  if (/^\d+$/.test(value)) return true;
  // short hex-ish ids (like supabase simple ids)
  if (/^[0-9a-f]{6,32}$/i.test(value) && value.length >= 8) return true;
  return false;
}
