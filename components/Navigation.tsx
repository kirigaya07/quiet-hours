// components/Navigation.tsx
"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { signOut } from "@/lib/auth";

export function Navigation() {
  const { user, loading } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  if (loading) {
    return (
      <nav className="text-sm space-x-4">
        <span className="text-neutral-500">Loading...</span>
      </nav>
    );
  }

  if (user) {
    return (
      <nav className="text-sm space-x-4">
        <Link href="/blocks/new" className="underline">
          New Block
        </Link>
        <Link href="/blocks" className="underline">
          All Blocks
        </Link>
        <button onClick={handleSignOut} className="underline cursor-pointer">
          Sign out
        </button>
      </nav>
    );
  }

  return (
    <nav className="text-sm space-x-4">
      <Link href="/signin" className="underline">
        Sign in
      </Link>
    </nav>
  );
}
