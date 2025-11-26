"use client";

import React from "react";
import BackLink from "@/components/back-link";
import ProfileForm from "@/components/profile-form";

export default function ProfilePage() {
  return (
    <div className="py-8 px-4">
      <BackLink />
      <ProfileForm />
    </div>
  );
}
