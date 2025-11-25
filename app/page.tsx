"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchPosts } from "@/lib/api";
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

  useEffect(() => {
    setLoading(true);
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
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0f13] text-zinc-100">
      <div className="mx-auto grid max-w-6xl grid-cols-12 gap-6 px-6 py-12">
        <main className="col-span-8 flex justify-center">
          <div className="w-full max-w-3xl">
            <h3 className="mb-6 text-center text-2xl font-semibold">Discover</h3>

            {/* vorre che fosse piu largo questo contenitore */}
            <div className="rounded-xl border border-zinc-800 bg-[#071018] p-6 shadow-lg w-full">
              {loading && <div className="py-12 text-center">Caricamento...</div>}
              {error && <div className="py-6 text-red-400">Errore: {error}</div>}
              {!loading && items.length === 0 && (
                <div className="py-6 text-zinc-400">Nessun post trovato.</div>
              )}

              <div className="divide-y divide-zinc-800">
                {items.map((c) => (
                  <PostItem key={c.id} post={c} />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
