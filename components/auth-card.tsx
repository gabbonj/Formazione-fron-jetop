"use client";

import React from "react";
import { Button } from "@/components/ui/button";

type Props = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  error?: React.ReactNode | null;
  footer?: React.ReactNode;
  children: React.ReactNode;
};

export default function AuthCard({ title, subtitle, error = null, footer = null, children }: Props) {
  return (
    <div className="flex w-full justify-center py-24">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-zinc-800 bg-[#071018] p-8 shadow-md">
          <h1 className="mb-2 text-center text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mb-6 text-center text-sm text-zinc-400">{subtitle}</p>}

          {error && (
            <div className="mb-4 rounded-md bg-red-900/30 px-3 py-2 text-center text-sm text-red-300">{error}</div>
          )}

          <div>{children}</div>

          {footer && <div className="mt-4 text-center text-sm text-zinc-400">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
