"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Close mobile drawer when viewport becomes >= md (768px)
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setIsOpen(false);
    };
    // initial
    if (mq.matches) setIsOpen(false);
    // add listener
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", handler as EventListener);
    } else if (typeof mq.addListener === "function") {
      // deprecated fallback
      // @ts-ignore
      mq.addListener(handler);
    }
    return () => {
      if (typeof mq.removeEventListener === "function") {
        mq.removeEventListener("change", handler as EventListener);
      } else if (typeof mq.removeListener === "function") {
        // @ts-ignore
        mq.removeListener(handler);
      }
    };
  }, []);

  // close drawer on route change (covers navigation not triggered by onClick)
  const pathname = usePathname();
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // disable body scroll when drawer is open
  useEffect(() => {
    if (typeof window === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [isOpen]);

  const SidebarContent = (
    <div className="flex flex-col justify-between h-full">
      <div className="pt-12">
        <h2 className="mb-6 text-3xl font-bold">Partecipa alla conversazione</h2>
        <div className="flex w-full flex-col gap-3">
          <Button asChild className="w-full rounded-full bg-[#0081f1] text-white hover:bg-[#003865]" size="lg">
            <Link href="/signup" onClick={() => setIsOpen(false)}>Crea account</Link>
          </Button>
          <Button asChild className="w-full rounded-full bg-black" variant="outline" size="lg">
            <Link href="/login" onClick={() => setIsOpen(false)}>Accedi</Link>
          </Button>
        </div>
      </div>

      <div className="pb-8">
        <nav className="flex flex-col gap-2 text-sm text-zinc-400">
          <Link className="text-[#217FE9] hover:text-zinc-200" href="/terms" onClick={() => setIsOpen(false)}>Termini di servizio</Link>
          <Link className="text-[#217FE9] hover:text-zinc-200" href="/privacy" onClick={() => setIsOpen(false)}>Informativa sulla privacy</Link>
        </nav>
      </div>
    </div>
  );

  return (
    <>
      <button
        className="md:hidden fixed top-6 left-6 z-40 p-2 rounded-md bg-[#0b0f13] border border-zinc-700 text-zinc-100"
        onClick={() => setIsOpen(true)}
        aria-label="Apri menu"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      <aside className="hidden md:fixed md:left-10 md:top-0 md:h-screen md:w-80 md:flex md:flex-col md:justify-between md:border-r md:border-zinc-800/60 md:pr-8 md:bg-[#0b0f13] md:z-20">
        {SidebarContent}
      </aside>

      <div className={`fixed inset-0 z-50 flex ${isOpen ? "" : "pointer-events-none"}`}>
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setIsOpen(false)}
        />
        <aside className={`relative w-80 max-w-[80%] h-full bg-[#0b0f13] p-6 shadow-xl overflow-y-auto transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <button className="absolute top-4 right-4 text-zinc-300" onClick={() => setIsOpen(false)} aria-label="Chiudi menu">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {SidebarContent}
        </aside>
      </div>
    </>
  );
}
