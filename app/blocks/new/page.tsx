// app/blocks/new/page.tsx
"use client";

import { useState } from "react";
import { createBlock } from "@/actions/block";
import { createBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function NewBlockPage() {
  const [title, setTitle] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createBrowserClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      alert("Please sign in first.");
      setLoading(false);
      return;
    }

    try {
      // HTML datetime-local is local time; convert to ISO (browser returns local; Date will convert to ISO UTC)
      await createBlock({
        userId: user.id,
        userEmail: user.email ?? undefined,
        title,
        startAtISO: new Date(startAt).toISOString(),
        endAtISO: new Date(endAt).toISOString(),
      });
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create block";
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md">
      <h2 className="text-2xl font-semibold mb-4">New Quiet Hour Block</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full rounded-md border px-3 py-2 dark:border-neutral-800 bg-white dark:bg-neutral-900"
          placeholder="Title (e.g., DSA Focus)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <label className="block text-sm">Start</label>
        <input
          type="datetime-local"
          className="w-full rounded-md border px-3 py-2 dark:border-neutral-800 bg-white dark:bg-neutral-900"
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
          required
        />
        <label className="block text-sm">End</label>
        <input
          type="datetime-local"
          className="w-full rounded-md border px-3 py-2 dark:border-neutral-800 bg-white dark:bg-neutral-900"
          value={endAt}
          onChange={(e) => setEndAt(e.target.value)}
          required
        />
        <button
          disabled={loading}
          className="rounded-md bg-black text-white px-4 py-2 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Block"}
        </button>
      </form>
    </div>
  );
}
