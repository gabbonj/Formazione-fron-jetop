"use client";

import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function CommentItem({ comment }: { comment: any }) {
  return (
    <div className="flex items-start gap-4 py-4">
      <div className="shrink-0">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-sm">{comment.user?.username?.[0]?.toUpperCase() ?? "G"}</AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-100">{comment.user?.username ?? "anonimo"}</span>
          <span className="text-xs text-zinc-500">{new Date(comment.created_at).toLocaleString()}</span>
        </div>

        <div className="mt-2 rounded-md bg-[#06121a] p-4 text-zinc-200 text-sm">
          {comment.content}
        </div>
      </div>
    </div>
  );
}
