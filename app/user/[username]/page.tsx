"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchUserByUsername, fetchPosts, fetchComments, fetchLikesCountByUser } from "@/lib/api";
import PostItem from "@/components/post-item";
import BackLink from "@/components/back-link";

export default function UserPage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function countUserComments(userId: string) {
    const pageSize = 100;
    let offset = 0;
    let total = 0;
    let totalAvailable = Number.POSITIVE_INFINITY;
    let safety = 0;

    while (offset < totalAvailable && safety < 50) {
      const res: any = await fetchComments({ limit: pageSize, offset });
      let items: any[] = [];
      if (res == null) items = [];
      else if (Array.isArray(res)) items = res;
      else if (Array.isArray(res.items)) items = res.items;
      else if (Array.isArray(res.data)) items = res.data;

      totalAvailable = typeof res?.count === 'number' ? res.count : offset + items.length;
      total += items.filter((c) => String(c.user_id) === String(userId)).length;

      if (items.length < pageSize || items.length === 0) break;
      offset += pageSize;
      safety += 1;
    }

    return total;
  }

  useEffect(() => {
    if (!username) return;
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const u = await fetchUserByUsername(String(username));
        if (!mounted) return;
        if (!u) {
          setError('Utente non trovato');
          setUser(null);
          setPosts([]);
          setPostCount(0);
          return;
        }
        setUser(u);
        // fetch posts by user id
        try {
          const res: any = await fetchPosts({ user_id: String(u.id), limit: 20 });
          // normalize response to array
          let items: any[] = [];
          if (!res) items = [];
          else if (Array.isArray(res)) items = res;
          else if (Array.isArray(res.items)) items = res.items;
          else if (Array.isArray(res.data)) items = res.data;
          else if (res.items && Array.isArray(res.items)) items = res.items;
          setPosts(items);
          const totalPosts = typeof res?.count === 'number' ? res.count : items.length;
          setPostCount(totalPosts);
        } catch (e) {
          // ignore posts error but keep user
          console.error(e);
          setPosts([]);
          setPostCount(0);
        }
      } catch (err: unknown) {
        setError(String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [username]);

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;
    setStatsLoading(true);
    setCommentCount(0);
    setLikesCount(0);

    async function loadStats() {
      try {
        const [likes, comments] = await Promise.all([
          fetchLikesCountByUser(String(user.id)),
          countUserComments(String(user.id)),
        ]);
        if (!mounted) return;
        setLikesCount(likes);
        setCommentCount(comments);
      } catch (e) {
        if (!mounted) return;
        setLikesCount(0);
        setCommentCount(0);
      } finally {
        if (mounted) setStatsLoading(false);
      }
    }

    loadStats();

    return () => { mounted = false; };
  }, [user?.id]);

  if (loading) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="h-36 rounded-2xl bg-[#08131a] animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl font-semibold">{error}</h2>
          <p className="text-zinc-500 mt-2">Controlla che l'username sia corretto o prova a cercare di nuovo.</p>
          <div className="mt-4">
            <Link href="/" className="text-[#1da1f2] hover:underline">Torna alla home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <BackLink />
      <div className="max-w-3xl mx-auto">
        <div className="bg-[#091018] border border-zinc-800 rounded-2xl p-6 shadow">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                {user?.avatar_url ? (
                  <AvatarImage src={user.avatar_url} alt={user.username} />
                ) : (
                  <AvatarFallback>{(user?.username || 'U')[0]?.toUpperCase()}</AvatarFallback>
                )}
              </Avatar>

              <div>
                <h1 className="text-2xl font-semibold">{user?.username}</h1>
                <div className="text-sm text-zinc-400">@{user?.username}</div>
              </div>
            </div>

            <div className="ml-auto text-right">
              <div className="text-sm text-zinc-400">{user?.created_at ? `Si è unito il ${new Date(user.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}</div>
            </div>
          </div>

          {user?.bio ? (
            <div className="mt-4 text-zinc-200">{user.bio}</div>
          ) : (
            <div className="mt-4 text-zinc-500">Nessuna bio disponibile.</div>
          )}

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[{ label: 'Post', value: postCount }, { label: 'Commenti', value: commentCount }, { label: 'Mi piace dati', value: likesCount }].map((stat) => (
              <div key={stat.label} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-[#0c141d] px-4 py-3">
                <span className="text-sm text-zinc-400">{stat.label}</span>
                <span className="text-xl font-semibold text-zinc-100">{statsLoading ? '...' : stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        <section className="mt-6">

          <h2 className="text-lg font-semibold mb-4">{postCount} post pubblici:</h2>
          {posts.length === 0 ? (
            <div className="text-zinc-500">Nessun post pubblico trovato.</div>
          ) : (
            posts.map((p) => (
              <div key={p.id} className="mb-4">
                <PostItem post={p} />
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
