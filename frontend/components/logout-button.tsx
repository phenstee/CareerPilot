"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { logout } from "@/lib/api";

export function LogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);
    try {
      await logout();
      router.push("/login");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isSubmitting}
      aria-label="Log out"
      className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-lagoon focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <LogOut aria-hidden="true" className="h-4 w-4" />
      Log out
    </button>
  );
}
