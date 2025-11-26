"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getToken, createPost } from "@/lib/api";

export default function CreatePost() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!content.trim()) return setError('Inserisci il contenuto del post');
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }
      const res: any = await createPost({ content: content.trim() }, token);
      // res should contain created post with id
      const id = res?.id || res?.data?.id;
      if (id) {
        router.push(`/post/${id}`);
      } else {
        // fallback to home
        router.push('/');
      }
    } catch (err: unknown) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-[#091018] border border-zinc-800 rounded-2xl p-8 shadow-lg">
        <h2 className="text-2xl font-semibold">Crea un nuovo post</h2>
        <p className="text-sm text-zinc-400 mt-1">Condividi qualcosa con la comunità — sii conciso e chiaro.</p>

        <form onSubmit={handleSubmit} className="mt-6">
          {error && <div className="mb-4 text-sm text-red-400">{error}</div>}

          <div>
            <Label className="text-zinc-300">Contenuto</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} className="mt-1 bg-zinc-900" rows={6} />
            <div className="mt-2 text-xs text-zinc-500">{content.length} caratteri</div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={loading} className="rounded-full bg-[#0081f1] px-6 py-3 text-white hover:bg-[#0062a3]">
              {loading ? 'Pubblicazione...' : 'Pubblica'}
            </Button>
          </div>
        </form>
      </div>

      <div className="mt-6 text-center text-sm text-zinc-500">
        <p>Rispetta le regole della community. I post possono essere modificati o rimossi dagli amministratori.</p>
      </div>
    </div>
  );
}
