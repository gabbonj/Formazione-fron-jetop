"use client";

import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getUsername, getUserSlug, isLikelyId } from "@/lib/utils";
import { fetchUser } from "@/lib/api";
import Link from "next/link";
import { fetchPost, fetchComments, createComment } from "@/lib/api";
import { getToken } from "@/lib/api";
import CommentItem from "@/components/comment-item";

type Comment = { id: string; content: string; created_at: string; user?: { username?: string } };

export default function PostDetail({ id }: { id: string }) {
  const [post, setPost] = useState<any | null>(null);
  const initialName = getUsername(post);
  const [authorName, setAuthorName] = useState<string>(() => (initialName && !isLikelyId(initialName) ? initialName : ""));
  const [authorSlug, setAuthorSlug] = useState<string>(() => {
    const s = getUserSlug(post);
    return s && !isLikelyId(s) ? s : "";
  });
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const router = useRouter();

  async function load() {
    setLoading(true);
    try {
      // try to load post
      const p = await fetchPost(id);
      if (p) setPost(p);
    } catch (e) {
      // ignore: fallback to comments for post info
    }

    try {
      const data = await fetchComments({ post_id: id });
      const items = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];
      setComments(items);
      // if no post data, try to take from first comment's post
      if (!post && items.length > 0 && (items[0] as any).post) {
        setPost((items as any)[0].post);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    let mounted = true;
    if (!post) return;
    const hasUsername = Boolean(post.user && post.user.username);
    const userId = (post as any).user_id ?? post.user?.id;
    if (!hasUsername && userId) {
      fetchUser(String(userId))
        .then((u: any) => {
          if (!mounted) return;
          setAuthorName(u?.username || getUsername(post));
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

  async function submitComment() {
    if (!text.trim()) return;
    try {
      const token = getToken();
      await createComment({ post_id: id, content: text }, token || undefined);
      setText("");
      await load();
    } catch (e) {
      // check if unauthorized
      // createComment throws with {status, data}
      // fallback: redirect to login on 401
      // @ts-ignore
      if (e?.status === 401) router.push('/login');
      else console.error(e);
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-6">
        <div className="mb-4">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-300 hover:text-zinc-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Torna al feed
          </Link>
        </div>
        {loading && <div className="py-6 text-zinc-400">Caricamento...</div>}
        {!loading && post && (
          <header className="mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                      <AvatarFallback>{authorName?.[0]?.toUpperCase() ?? 'G'}</AvatarFallback>
              </Avatar>
              <div>
                      <div className="text-sm font-semibold text-zinc-100">{authorName ? `@${authorName}` : <span className="inline-block h-5 w-40 rounded bg-zinc-700 animate-pulse" />}</div>
                <div className="text-xs text-zinc-500">{new Date(post.created_at).toLocaleString()}</div>
              </div>
            </div>

            <div className="mt-4 text-zinc-200 text-lg prose prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content || ""}</ReactMarkdown>
            </div>

            <div className="mt-4 flex gap-4 text-sm text-zinc-400">
              <div className="flex items-center gap-2">♡ <span className="text-sm">0</span></div>
              <div className="flex items-center gap-2">💬 <span className="text-sm">{comments.length}</span></div>
            </div>
          </header>
        )}

        {!loading && !post && (
          <div className="py-6 text-zinc-400">Post non trovato.</div>
        )}
      </div>

      <div className="border-t border-zinc-800 pt-6">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Scrivi un commento..."
          className="w-full resize-none rounded-md bg-[#06121a] p-3 text-zinc-100 border border-zinc-800"
          rows={4}
        />
        <div className="flex justify-end mt-3">
          <Button onClick={submitComment} className="rounded-md bg-[#0b66b0] px-4 py-2 text-white">Commenta</Button>
        </div>
      </div>

      <div className="mt-6 divide-y divide-zinc-800">
        {comments.map((c) => (
          <CommentItem key={c.id} comment={c} />
        ))}
      </div>
    </div>
  );
}
