"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fetchLikesCount, addLike, removeLike, getToken, fetchCommentsCount, fetchUser } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getUsername, getUserSlug, isLikelyId } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type Post = {
  id: string;
  content: string;
  created_at: string;
  user?: { id: string; username: string } | null;
};

export default function PostItem({ post }: { post: Post }) {
  const initialName = getUsername(post);
  const [authorName, setAuthorName] = useState<string>(() => (initialName && !isLikelyId(initialName) ? initialName : ""));
  const [authorSlug, setAuthorSlug] = useState<string>(() => {
    const s = getUserSlug(post);
    return s && !isLikelyId(s) ? s : "";
  });
  const router = useRouter();

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
  useEffect(() => {
    let mounted = true;
    fetchLikesCount(post.id)
      .then((res: any) => {
        // res might be { count: number } or { items: [...] }
        if (!mounted) return;
        if (res == null) return setLikes(0);
        if (typeof res.count === 'number') setLikes(res.count);
        else if (Array.isArray(res.items)) setLikes(res.items.length);
        else if (typeof res === 'number') setLikes(res);
      })
      .catch(() => {})
      .finally(() => {});
    return () => { mounted = false; };
  }, [post.id]);

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

  async function toggleLike() {
    const token = getToken();
    try {
      if (!liked) {
        await addLike(post.id, token || undefined);
        setLikes((n) => n + 1);
        setLiked(true);
      } else {
        await removeLike(post.id, token || undefined);
        setLikes((n) => Math.max(0, n - 1));
        setLiked(false);
      }
    } catch (e) {
      // if unauthorized, redirect to login could be handled elsewhere; for now log
      console.error(e);
    }
  }

  return (
    <article className="py-4">
      <div className="w-full bg-[#071018] border border-zinc-800 p-4 rounded-sm transition-transform transform duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md hover:border-zinc-600 hover:bg-[#0b1a23]">
        <div className="flex gap-4">
          <div className="shrink-0">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="text-sm">{authorName?.[0]?.toUpperCase() ?? "G"}</AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  {authorName ? (
                    <Link href={`/user/${authorSlug ?? ""}`} onClick={(e:any) => e.stopPropagation()} className="text-sm font-semibold text-zinc-100 hover:underline truncate">
                      @{authorName}
                    </Link>
                  ) : (
                    <span className="inline-block h-4 w-28 rounded bg-zinc-700 animate-pulse" />
                  )}
                  <span className="text-xs text-zinc-500">• {new Date(post.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/post/${post.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter") router.push(`/post/${post.id}`);
              }}
              className="mt-3 text-zinc-200 text-sm prose prose-invert max-w-none"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content || ""}</ReactMarkdown>
            </div>

            <div className="mt-4 flex items-center gap-6 text-sm text-zinc-400">
              <button aria-label="Like" onClick={(e) => { e.stopPropagation(); toggleLike(); }} className="flex items-center gap-2 text-zinc-300 hover:text-pink-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
                  <path d="M20.8 7.2c0 5-8.8 9.9-8.8 9.9s-8.8-4.9-8.8-9.9a4.4 4.4 0 0 1 7.8-3.1 4.4 4.4 0 0 1 7.8 3.1z" />
                </svg>
                <span className="text-sm">{likes}</span>
              </button>

              <Link href={`/post/${post.id}`} onClick={(e:any) => e.stopPropagation()} className="flex items-center gap-2 text-zinc-300 hover:text-zinc-100">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span className="text-sm">{commentCount}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
