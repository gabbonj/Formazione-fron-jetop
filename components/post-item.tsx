"use client";

import Link from "next/link";
import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export type Post = {
  id: string;
  content: string;
  created_at: string;
  user?: { id: string; username: string } | null;
};

export default function PostItem({ post }: { post: Post }) {
  return (
    <article className="py-6">
      <div className="flex items-start gap-4">
        <Avatar className="h-11 w-11">
          <AvatarFallback>{post.user?.username?.[0]?.toUpperCase() ?? "G"}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">
              <Link className="hover:underline" href={`/user/${post.user?.username ?? ""}`}>
                @{post.user?.username ?? "anonimo"}
              </Link>
            </div>
            <div className="text-xs text-zinc-500">{new Date(post.created_at).toLocaleString()}</div>
          </div>

          <p className="mt-2 whitespace-pre-wrap text-zinc-200">{post.content}</p>

          <div className="mt-4 flex gap-3 text-sm">
            <Button variant="ghost" size="sm" className="text-zinc-300">♡ 0</Button>
            <Button variant="ghost" size="sm" className="text-zinc-300">💬 0</Button>
          </div>
        </div>
      </div>
    </article>
  );
}
