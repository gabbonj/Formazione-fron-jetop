"use client";

import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getUsername, getUserSlug } from "@/lib/utils";
import { fetchUser } from "@/lib/api";

export default function CommentItem({ comment }: { comment: any }) {
  const [authorName, setAuthorName] = useState<string>(() => getUsername(comment));
  const [authorSlug, setAuthorSlug] = useState<string>(() => getUserSlug(comment));

  useEffect(() => {
    let mounted = true;
    const hasUsername = Boolean(comment.user && comment.user.username);
    const userId = comment.user_id ?? comment.user?.id;
    if (!hasUsername && userId) {
      fetchUser(String(userId))
        .then((u: any) => {
          if (!mounted) return;
          setAuthorName(u?.username || getUsername(comment));
          setAuthorSlug(u?.username || String(u?.id || userId));
        })
        .catch(() => {
          if (!mounted) return;
          setAuthorName(getUsername(comment));
          setAuthorSlug(String(userId));
        });
    } else {
      setAuthorName(getUsername(comment));
      setAuthorSlug(getUserSlug(comment));
    }
    return () => { mounted = false; };
  }, [comment]);

  return (
    <div className="flex items-start gap-4 py-4">
      <div className="shrink-0">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-sm">{authorName?.[0]?.toUpperCase() ?? "G"}</AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-100">{authorName}</span>
          <span className="text-xs text-zinc-500">{new Date(comment.created_at).toLocaleString()}</span>
        </div>

        <div className="mt-2 rounded-md bg-[#06121a] p-4 text-zinc-200 text-sm prose prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.content || ""}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
