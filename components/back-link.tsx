"use client";

import Link from "next/link";
import * as React from "react";

type BackLinkProps = {
  href?: string;
  children?: React.ReactNode;
  className?: string;
};

export default function BackLink({ href = '/', children = 'Torna al feed', className = '' }: BackLinkProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <Link href={href} className="inline-flex items-center gap-2 text-zinc-300 hover:text-zinc-100">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        {children}
      </Link>
    </div>
  );
}
