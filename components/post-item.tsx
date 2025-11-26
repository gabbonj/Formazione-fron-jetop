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
    <article
      className="py-0 group cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/post/${post.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(`/post/${post.id}`);
      }}
    >
      <div className="p-4 w-full rounded-md group-hover:bg-[#071a21] transition-colors">
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
                  <Link href={`/user/${authorSlug ?? ""}`} onClick={(e:any) => e.stopPropagation()} className="block truncate text-sm font-semibold text-zinc-100">
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
              </div>
            </div>

            <div className="mt-4 text-zinc-200 text-base leading-relaxed prose prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content || ""}</ReactMarkdown>
            </div>

          </div>
        </div>
      </div>
      <div className="mt-4 border-b border-zinc-800" />

    </article>
  );
}
