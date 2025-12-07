"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchPosts } from "@/lib/api";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import PostItem from "@/components/post-item";

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user?: { id: string; username: string } | null;
};

export default function Home() {
  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    setLoading(true);
    setIsAuth(status === 'authenticated');
    fetchPosts()
      .then((res: any) => {
        // API may return { items: [...] } or array
        if (res == null) return setItems([]);
        if (Array.isArray(res.items)) setItems(res.items);
        else if (Array.isArray(res)) setItems(res);
        else if (Array.isArray(res.items?.items)) setItems(res.items.items);
        else setItems([]);
      })
      .catch((err: unknown) => {
        console.error(err);
        setError(String(err));
      })
      .finally(() => setLoading(false));
  }, [status]);

  function handlePostUpdated(updated: Comment) {
    setItems((prev) => prev.map((it) => (it.id === updated.id ? { ...it, ...updated } : it)));
  }

  function handlePostDeleted(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  return (
    <div className="min-h-screen bg-[#0b0f13] text-zinc-100">
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-6 py-12">
        <main className="col-span-12 md:col-span-9 flex justify-center">
          <div className="w-full">
            <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">Feed</h1>
                <p className="mt-1 text-sm text-zinc-400">I post più recenti della community. Interagisci, commenta e condividi.</p>
              </div>

              <div className="flex items-center gap-3">
                {isAuth ? (
                  <Button asChild className="rounded-full bg-[#0081f1] text-white hover:bg-[#0062a3]">
                    <Link href="/post">Crea post</Link>
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button asChild className="rounded-full bg-[#0081f1] text-white hover:bg-[#0062a3]">
                      <Link href="/login">Accedi</Link>
                    </Button>
                    <Button asChild className="rounded-full bg-black" variant="outline">
                      <Link href="/signup">Registrati</Link>
                    </Button>
                  </div>
                )}
              </div>
            </header>

            <div>
              {loading ? (
                <div className="space-y-4">
                  <div className="h-4 w-1/3 bg-zinc-700 animate-pulse" />
                  <div className="h-40 bg-zinc-800 animate-pulse rounded-sm" />
                  <div className="h-40 bg-zinc-800 animate-pulse rounded-sm" />
                </div>
              ) : error ? (
                <div className="py-6 text-red-400">Errore: {error}</div>
              ) : items.length === 0 ? (
                <div className="py-12 text-center">
                  <h3 className="text-xl font-semibold">Ancora niente da vedere</h3>
                  <p className="mt-2 text-zinc-400">Non ci sono post pubblici in questo momento.</p>
                  {isAuth ? (
                    <div className="mt-4">
                      <Button asChild className="rounded-full bg-[#0081f1] text-white hover:bg-[#0062a3]">
                        <Link href="/post">Scrivi il primo post</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-4 flex justify-center gap-3">
                      <Button asChild className="rounded-full bg-[#0081f1] text-white hover:bg-[#0062a3]">
                        <Link href="/signup">Crea account</Link>
                      </Button>
                      <Button asChild className="rounded-full bg-black" variant="outline">
                        <Link href="/login">Accedi</Link>
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((c) => (
                    <PostItem key={c.id} post={c} onUpdated={handlePostUpdated} onDeleted={handlePostDeleted} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
