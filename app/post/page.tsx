"use client";

import React from "react";
import CreatePost from "@/components/create-post";
import BackLink from "@/components/back-link";

export default function NewPostPage() {
  return (
    <div className="py-8 px-4">
      <BackLink />
      <CreatePost />
    </div>
  );
}
