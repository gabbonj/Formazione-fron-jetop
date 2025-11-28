"use client";

import React, { useState } from "react";
import Link from "next/link";
import AuthCard from "@/components/auth-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { register } from "@/lib/api";
import { formatError } from "@/lib/utils";

export default function SignupCard() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) return setError("Le password non coincidono");
    setLoading(true);
    try {
      const res: any = await register({ username, email, password });

      // Debugging help: log server response (dev only)
      try {
        // eslint-disable-next-line no-console
        console.debug("register response:", res);
      } catch (e) {}

      // Robust OTP detection: look for common keys at top-level and one level deep
      const findOtp = (obj: any): string | null => {
        if (!obj || typeof obj !== 'object') return null;
        const keys = Object.keys(obj);
        for (const k of keys) {
          // match common OTP/secret field names, including `otp_secret`
          if (/(otp_secret|otp_code|otp|secret|two_factor_code|code)/i.test(k) && obj[k]) return String(obj[k]);
        }
        // check nested objects one level deep
        for (const k of keys) {
          const v = obj[k];
          if (v && typeof v === 'object') {
            const nested = findOtp(v);
            if (nested) return nested;
          }
        }
        return null;
      };

      const code = findOtp(res);
      if (code) {
        setOtpCode(String(code));
        setSuccess(true);
        setLoading(false);
        return;
      }

      // Se non c'è OTP, mostriamo comunque una pagina di successo
      setSuccess(true);
    } catch (err: unknown) {
      setError(formatError(err));
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
      {otpCode ? (
        <div className="space-y-4">
          <div className="text-center text-sm text-zinc-400">Registrazione completata con successo. Ecco il codice OTP da usare con Google Authenticator:</div>
          <div className="mx-auto max-w-sm rounded-md border border-zinc-700 bg-[#071018] p-4 text-center">
            <div className="text-xs md:text-base wrap-anywhere font-mono font-semibold text-zinc-100">{otpCode}</div>
            <div className="mt-2 text-zinc-400">Salva questo codice: potresti averne bisogno per configurare l'autenticazione a due fattori.</div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => { navigator.clipboard?.writeText(otpCode); }} className="mx-auto">Copia codice</Button>
              <Link href="/login" className="ml-auto text-[#1da1f2] hover:underline">Vai al login</Link>
            </div>
          </div>
        </div>
      ) : success ? (
        <div className="space-y-4">
          <div className="text-center text-sm text-zinc-400">Registrazione completata con successo.</div>
          <div className="mx-auto max-w-sm rounded-md border border-zinc-700 bg-[#071018] p-4 text-center">
            <div className="text-lg font-semibold text-zinc-100">Controlla la tua email per confermare l'account.</div>
            <div className="mt-2 text-sm text-zinc-400">Ora puoi effettuare il login per accedere al tuo profilo.</div>
            <div className="mt-4 flex gap-2">
              <Link href="/login" className="ml-auto text-[#1da1f2] hover:underline">Vai al login</Link>
            </div>
          </div>
        </div>
      ) : (
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
      )}
    </AuthCard>
  );
}
