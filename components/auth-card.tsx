"use client";

import React from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
        <Card className="rounded-lg border border-zinc-800 bg-[#071018] p-8 shadow-md">
          <CardHeader className="p-0">
            <div className="flex flex-col items-center text-center">
              <CardTitle className="text-2xl font-bold text-zinc-100">{title}</CardTitle>
              {subtitle && <CardDescription className="mt-2 text-sm text-zinc-400">{subtitle}</CardDescription>}
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {error && (
              <div className="mb-4 rounded-md bg-red-900/30 px-3 py-2 text-center text-sm text-red-300">{error}</div>
            )}

            <div>{children}</div>
          </CardContent>

          {footer && (
            <CardFooter>
              <div className="w-full text-center text-sm text-zinc-400">{footer}</div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
