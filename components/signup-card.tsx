"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/auth-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { register } from "@/lib/api";
import { signIn } from "next-auth/react";

export default function SignupCard() {
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
        const result = await signIn('credentials', { token: res.token, redirect: false });
        if (result && (result as any).ok) router.push('/');
        else setError('Impossibile creare la sessione');
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
    <AuthCard
      title="Crea un account"
      subtitle="Inserisci i tuoi dati per registrarti"
      error={error}
      footer={<>{"Hai già un account? "}<Link href="/login" className="text-[#1da1f2] hover:underline">Accedi</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="text-zinc-300">Username</Label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500" required />
        </div>

        <div>
          <Label className="text-zinc-300">Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500" required />
        </div>

        <div>
          <Label className="text-zinc-300">Password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500" required />
        </div>

        <div>
          <Label className="text-zinc-300">Conferma Password</Label>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500" required />
        </div>

        <div className="mt-6">
          <Button type="submit" disabled={loading} className="w-full rounded-full bg-[#0081f1] px-6 py-3 text-white shadow-sm hover:bg-[#0062a3]" size="lg">
            Crea account
          </Button>
        </div>
      </form>
    </AuthCard>
  );
}
