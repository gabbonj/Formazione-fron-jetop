"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fetchLikesCount, addLike, removeLike, fetchCommentsCount, fetchUser, updatePost, deletePost, getUserIdFromToken } from "@/lib/api";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getUsername, getUserSlug, isLikelyId } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type Post = {
  id: string;
  content: string;
  created_at: string;
  user?: { id: string; username: string } | null;
};

type Props = {
  post: Post;
  onUpdated?: (post: Post) => void;
  onDeleted?: (id: string) => void;
};

export default function PostItem({ post, onUpdated, onDeleted }: Props) {
  const initialName = getUsername(post);
  const [authorName, setAuthorName] = useState<string>(() => (initialName && !isLikelyId(initialName) ? initialName : ""));
  const [authorSlug, setAuthorSlug] = useState<string>(() => {
    const s = getUserSlug(post);
    return s && !isLikelyId(s) ? s : "";
  });
  const [content, setContent] = useState<string>(post.content || "");
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as any)?.token as string | undefined;

  const ownerId = useMemo(() => String((post as any)?.user_id ?? post.user?.id ?? ""), [post]);
  const [isOwner, setIsOwner] = useState(false);
  useEffect(() => {
    const uid = token ? getUserIdFromToken(token) : null;
    setIsOwner(Boolean(uid && ownerId && String(uid) === String(ownerId)));
  }, [token, ownerId]);

  useEffect(() => {
    let mounted = true;
    const hasUsername = Boolean(post.user && (post.user as any).username);
    const userId = (post as any).user_id ?? post.user?.id;
    if (!hasUsername && userId) {
      fetchUser(String(userId))
        .then((u: any) => {
          if (!mounted) return;
          const uname = u?.username || getUsername(post);
          setAuthorName(uname);
          setAuthorSlug(u?.username || String(u?.id || userId));
        })
        .catch(() => {
          if (!mounted) return;
          setAuthorName(getUsername(post));
          setAuthorSlug(String(userId));
        });
    } else {
      setAuthorName(getUsername(post));
      setAuthorSlug(getUserSlug(post));
    }
    return () => { mounted = false; };
  }, [post]);

  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  useEffect(() => {
    let mounted = true;
    const token = (session as any)?.token;
    fetchLikesCount(post.id, token)
      .then((res: any) => {
        if (!mounted) return;
        const count = typeof res?.count === 'number' ? res.count : typeof res === 'number' ? res : 0;
        setLikes(count);
        if (typeof res?.liked === 'boolean') setLiked(res.liked);
      })
      .catch(() => {})
      .finally(() => {});
    return () => { mounted = false; };
  }, [post.id, session]);

  const [commentCount, setCommentCount] = useState(0);
  useEffect(() => {
    let mounted = true;
    fetchCommentsCount(post.id)
      .then((c) => {
        if (!mounted) return;
        setCommentCount(typeof c === 'number' ? c : 0);
      })
      .catch(() => {})
      .finally(() => {});
    return () => { mounted = false; };
  }, [post.id]);

  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.content || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setContent(post.content || "");
    setEditText(post.content || "");
  }, [post]);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Eliminare questo post?")) return;
    if (deleting) return;
    setDeleting(true);
    setActionError(null);
    try {
      await deletePost(post.id, token || undefined);
      if (onDeleted) onDeleted(post.id);
      else router.refresh();
    } catch (err: any) {
      setActionError(err?.data || "Errore durante l'eliminazione");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSave(e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    if (!editText.trim()) {
      setActionError("Il contenuto non può essere vuoto");
      return;
    }
    if (saving) return;
    setSaving(true);
    setActionError(null);
    try {
      const updated = await updatePost(post.id, { content: editText }, token || undefined);
      const nextPost = { ...post, ...updated, content: updated?.content ?? editText } as Post;
      setContent(nextPost.content);
      onUpdated?.(nextPost);
      setEditing(false);
    } catch (err: any) {
      setActionError(err?.data || "Errore durante l'aggiornamento");
    } finally {
      setSaving(false);
    }
  }

  async function toggleLike() {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      // retrieve token from next-auth session on the client
      // we access via hook inside component scope
      // but here we can't call hook, so read from window.__NEXT_AUTH_SESSION__ if available
      const t = (session as any)?.token ?? undefined;
      if (!liked) {
        await addLike(post.id, t || undefined);
        setLikes((n) => n + 1);
        setLiked(true);
      } else {
        await removeLike(post.id, t || undefined);
        setLikes((n) => Math.max(0, n - 1));
        setLiked(false);
      }
    } catch (e) {
      // if unauthorized, redirect to login could be handled elsewhere; for now log
      console.error(e);
    } finally {
      setLikeLoading(false);
    }
  }

  return (
    <article
      className="py-0 group cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/post/${post.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(`/post/${post.id}`);
      }}
    >
      <div className="relative p-4 w-full rounded-md group-hover:bg-[#071a21] transition-colors">
        <div className="flex gap-4 items-start">
          <div className="shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-sm">{authorName?.[0]?.toUpperCase() ?? "G"}</AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                {authorName ? (
                  <Link
                    href={`/user/${authorSlug ?? ""}`}
                    onClick={(e:any) => e.stopPropagation()}
                    className="block truncate text-sm font-semibold text-zinc-100 hover:underline"
                  >
                    @{authorName}
                  </Link>
                ) : (
                  <div className="h-4 w-32 bg-zinc-700 animate-pulse" />
                )}
                <div className="mt-1 text-xs text-zinc-500">{new Date(post.created_at).toLocaleString()}</div>
              </div>

              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <Button aria-label="Like" onClick={(e) => { e.stopPropagation(); toggleLike(); }} variant="ghost" className={`flex items-center gap-2 transition-colors ${liked ? 'text-pink-400' : 'text-zinc-300 hover:text-pink-400'}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
                    <path d="M20.8 7.2c0 5-8.8 9.9-8.8 9.9s-8.8-4.9-8.8-9.9a4.4 4.4 0 0 1 7.8-3.1 4.4 4.4 0 0 1 7.8 3.1z" />
                  </svg>
                  <span className="text-sm">{likes}</span>
                </Button>

                <Link href={`/post/${post.id}`} onClick={(e:any) => e.stopPropagation()} className="flex items-center gap-2 text-zinc-300 hover:text-zinc-100">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="text-sm">{commentCount}</span>
                </Link>
                {/* owner actions moved to bottom-right */}
              </div>
            </div>

            <div className="mt-4 text-zinc-200 text-base leading-relaxed prose prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || ""}</ReactMarkdown>
            </div>

            {actionError && <div className="mt-2 text-sm text-red-400">{actionError}</div>}

          </div>
        </div>
        {/* Owner-specific action buttons absolutely positioned bottom-right */}
        {isOwner && (
          <div className="absolute bottom-2 right-2 flex items-center gap-2 z-10">
            <Button
              aria-label="Modifica"
              variant="ghost"
              className="text-zinc-300 hover:text-white p-1"
              onClick={(e) => { e.stopPropagation(); setActionError(null); setEditing(true); setEditText(content || ""); }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
              </svg>
            </Button>
            <Button
              aria-label="Elimina"
              variant="ghost"
              className="text-red-400 hover:text-red-300 p-1"
              onClick={(e) => { e.stopPropagation(); handleDelete(e); }}
              disabled={deleting}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
                <path d="M3 6h18" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
            </Button>
          </div>
        )}
      </div>
      <div className="mt-4 border-b border-zinc-800" />

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setEditing(false)}>
          <div className="w-full max-w-lg rounded-md bg-[#0f1720] border border-zinc-800 p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-zinc-100">Modifica post</h3>
              <button className="text-zinc-400 hover:text-zinc-200" onClick={() => setEditing(false)} aria-label="Chiudi">✕</button>
            </div>
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={6}
              className="bg-[#0b1520] border-zinc-800 text-zinc-100"
              placeholder="Aggiorna il contenuto..."
            />
            {actionError && <div className="mt-3 text-sm text-red-400">{actionError}</div>}
            <div className="mt-4 flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setEditing(false)} className="text-zinc-300">Annulla</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-[#0b66b0] text-white hover:bg-[#0a5a9b]">
                {saving ? "Salvataggio..." : "Salva"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </article>
  );
}
