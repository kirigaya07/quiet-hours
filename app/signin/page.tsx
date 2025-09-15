// app/signin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");
  // const router = useRouter(); // Unused for now
  const searchParams = useSearchParams();

  // Check for auth errors from callback
  useEffect(() => {
    const error = searchParams.get("error");
    const message = searchParams.get("message");

    if (error) {
      setStatus("error");
      const errorMessage = message ? decodeURIComponent(message) : "";

      switch (error) {
        case "auth_callback_error":
          setMessage(
            `Authentication failed: ${errorMessage || "Please try again."}`
          );
          break;
        case "auth_callback_exception":
          setMessage(
            `An error occurred: ${errorMessage || "Please try again."}`
          );
          break;
        case "no_code":
          setMessage("Invalid authentication link. Please request a new one.");
          break;
        case "no_session":
          setMessage("Session not created. Please try again.");
          break;
        default:
          setMessage(
            `Authentication error: ${errorMessage || "Please try again."}`
          );
      }
    }
  }, [searchParams]);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage("");

    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : undefined,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setStatus("sent");
    setMessage("Check your email for the magic link.");
  }

  return (
    <div className="max-w-md">
      <h2 className="text-2xl font-semibold mb-4">Sign in</h2>
      <form onSubmit={sendMagicLink} className="space-y-3">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border px-3 py-2 dark:border-neutral-800 bg-white dark:bg-neutral-900"
        />
        <button
          disabled={status === "sending"}
          className="rounded-md bg-black text-white px-4 py-2 disabled:opacity-50"
        >
          {status === "sending" ? "Sending..." : "Send magic link"}
        </button>
      </form>
      {message && (
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
          {message}
        </p>
      )}
    </div>
  );
}
