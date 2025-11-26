"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getToken, fetchCurrentUser, updateUser } from "@/lib/api";

export default function ProfileForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        if (!token) {
          router.push('/login');
          return;
        }
        const res: any = await fetchCurrentUser(token);
        // Map response fields - backend may return the user object directly
        const user = res?.user ? res.user : res;
        setUserId(user?.id || null);
        setUsername(user?.username || "");
        setEmail(user?.email || "");
        setBio(user?.bio || "");
        setAvatarUrl(user?.avatar_url || user?.avatar || null);
      } catch (err: unknown) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const token = getToken();
      if (!token) return setError('Devi essere autenticato');

      if (!userId) return setError('Impossibile determinare l\'utente');

      const payload: any = {
        username: username.trim(),
        email: email.trim(),
        bio: bio.trim(),
      };

      const res = await updateUser(userId, payload, token);
      setSuccess('Profilo aggiornato con successo');
      // optionally refresh or navigate
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-[#091018] border border-zinc-800 rounded-2xl p-8 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:gap-8 gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={username || 'Avatar'} />
              ) : (
                <AvatarFallback>{(username || 'U').charAt(0).toUpperCase()}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <h3 className="text-2xl font-semibold">Modifica profilo</h3>
              <p className="text-sm text-zinc-400">Aggiorna le informazioni del tuo account</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            {error && <div className="mb-4 text-sm text-red-400">{error}</div>}
            {success && <div className="mb-4 text-sm text-green-400">{success}</div>}
          </div>

          <div>
            <Label className="text-zinc-300">Username</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 bg-zinc-900" required />
          </div>

          <div>
            <Label className="text-zinc-300">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 bg-zinc-900" required />
          </div>

          <div className="md:col-span-2">
            <Label className="text-zinc-300">Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1 bg-zinc-900" rows={4} />
            <p className="mt-2 text-sm text-zinc-500">Una breve descrizione che verrà mostrata sul tuo profilo (max 160 caratteri).</p>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={saving || loading} className="rounded-full bg-[#0081f1] px-6 py-3 text-white hover:bg-[#0062a3]">
              {saving ? 'Salvataggio...' : 'Salva modifiche'}
            </Button>
          </div>
        </form>
      </div>

      <div className="mt-6 text-center text-sm text-zinc-500">
        <p>Puoi aggiornare il tuo username, email e bio. Per cambiare avatar contatta il supporto o usa il tuo profilo esterno.</p>
      </div>
    </div>
  );
}
