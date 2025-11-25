"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register, saveToken } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) return setError("Le password non coincidono");
    setLoading(true);
    try {
      const res: any = await register({ username, email, password });
      if (res?.token) {
        saveToken(res.token);
        router.push("/");
      } else {
        setError("Registrazione completata ma nessun token ricevuto");
      }
    } catch (err: unknown) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full justify-center py-24">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-zinc-800 bg-[#071018] p-8 shadow-md">
          <h1 className="mb-2 text-center text-2xl font-bold">Crea un account</h1>
          <p className="mb-6 text-center text-sm text-zinc-400">Inserisci i tuoi dati per registrarti</p>

          {error && (
            <div className="mb-4 rounded-md bg-red-900/30 px-3 py-2 text-center text-sm text-red-300">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-zinc-300">Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 bg-zinc-900" required />
            </div>

            <div>
              <Label className="text-zinc-300">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 bg-zinc-900" required />
            </div>

            <div>
              <Label className="text-zinc-300">Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 bg-zinc-900" required />
            </div>

            <div>
              <Label className="text-zinc-300">Conferma Password</Label>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1 bg-zinc-900" required />
            </div>

            <div className="mt-6">
              <Button type="submit" disabled={loading} className="w-full rounded-full bg-[#0081f1] px-6 py-3 text-white shadow-sm hover:bg-[#0062a3]" size="lg">
                Crea account
              </Button>
            </div>

            <div className="mt-4 text-center text-sm text-zinc-400">
              Hai già un account? <Link href="/login" className="text-[#1da1f2] hover:underline">Accedi</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
