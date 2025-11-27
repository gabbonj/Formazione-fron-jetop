"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/auth-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { loginStep1, verifyOtp } from "@/lib/api";
import { formatError } from "@/lib/utils";
import { signIn } from "next-auth/react";

export default function LoginCard() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res: any = await loginStep1({ username, password });
      if (res?.requires_otp && res?.temp_token) {
        setTempToken(res.temp_token);
      } else if (res?.token) {
        // Sign in into next-auth session by passing the token to the credentials provider
        const result = await signIn('credentials', { token: res.token, redirect: false });
        if (result && (result as any).ok) router.push('/');
        else setError('Impossibile creare la sessione');
      } else {
        setError("Risposta imprevista dal server");
      }
    } catch (err: unknown) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!tempToken) return setError("Manca il token temporaneo");
    setLoading(true);
    setError(null);
    try {
      const res: any = await verifyOtp({ temp_token: tempToken, otp_token: otp });
      if (res?.token) {
        const result = await signIn('credentials', { token: res.token, redirect: false });
        if (result && (result as any).ok) router.push('/');
        else setError('Impossibile creare la sessione');
      } else {
        setError("OTP non valido o risposta imprevista");
      }
    } catch (err: unknown) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Accedi"
      subtitle="Inserisci le tue credenziali per accedere"
      error={error}
      footer={!tempToken ? <>{"Non hai un account? "}<Link href="/signup" className="text-[#1da1f2] hover:underline">Registrati</Link></> : null}
    >
      {!tempToken ? (
        <form onSubmit={handleStep1} className="space-y-4">
          <div>
            <Label className="text-zinc-300">Username</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500" required />
          </div>

          <div>
            <Label className="text-zinc-300">Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500" required />
          </div>

          <div className="mt-6">
            <Button type="submit" disabled={loading} className="w-full rounded-full bg-[#0081f1] px-6 py-3 text-white shadow-sm hover:bg-[#0062a3]" size="lg">
              Continua
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="text-center text-sm text-zinc-400">Inserisci il codice OTP che trovi su google authenticator</div>

          <div>
            <Label className="text-zinc-300">OTP</Label>
            <Input value={otp} onChange={(e) => setOtp(e.target.value)} className="mt-1 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500" required />
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Button variant="outline" type="button" onClick={() => setTempToken(null)} className="w-1/3">
              Annulla
            </Button>
            <Button type="submit" disabled={loading} className="ml-auto w-2/3 rounded-full bg-[#0081f1] text-white hover:bg-[#0062a3]">
              Verifica
            </Button>
          </div>
        </form>
      )}
    </AuthCard>
  );
}
