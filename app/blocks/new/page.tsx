// app/blocks/new/page.tsx
"use client";

import { useMemo, useState } from "react";
import { createBlock } from "@/actions/block";
import { createBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function NewBlockPage() {
  const [title, setTitle] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tz = "Asia/Kolkata";

  const preview = useMemo(() => {
    if (!startAt || !endAt) return null;
    const start = new Date(startAt);
    const end = new Date(endAt);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    const fmt: Intl.DateTimeFormatOptions = {
      timeZone: tz,
      dateStyle: "medium",
      timeStyle: "short",
    };
    const minutes = Math.max(
      0,
      Math.round((end.getTime() - start.getTime()) / 60000)
    );
    return {
      start: start.toLocaleString(undefined, fmt),
      end: end.toLocaleString(undefined, fmt),
      duration: minutes,
    };
  }, [startAt, endAt]);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createBrowserClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      alert("Please sign in first.");
      setLoading(false);
      return;
    }

    try {
      // Basic validation
      if (!title.trim()) {
        throw new Error("Title is required");
      }
      const s = new Date(startAt);
      const eDate = new Date(endAt);
      if (isNaN(s.getTime()) || isNaN(eDate.getTime())) {
        throw new Error("Please provide valid start and end times");
      }
      if (eDate <= s) {
        throw new Error("End time must be after start time");
      }
      // HTML datetime-local is local time; convert to ISO (browser returns local; Date will convert to ISO UTC)
      await createBlock({
        userId: user.id,
        userEmail: user.email ?? undefined,
        userTimeZone:
          Intl.DateTimeFormat().resolvedOptions().timeZone ?? undefined,
        title,
        startAtISO: new Date(startAt).toISOString(),
        endAtISO: new Date(endAt).toISOString(),
      });
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create block";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md">
      <h2 className="text-2xl font-semibold mb-4">New Quiet Hour Block</h2>
      {error && (
        <div
          className="mb-3 text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-3" noValidate>
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
        {preview && (
          <div className="rounded-md bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-800 p-3 text-sm">
            <div>
              IST Preview: <span className="font-medium">{preview.start}</span>{" "}
              → <span className="font-medium">{preview.end}</span>
            </div>
            <div className="text-neutral-600 dark:text-neutral-400">
              Duration: {preview.duration} min
            </div>
          </div>
        )}
        <button
          disabled={loading}
          className="rounded-md bg-black text-white px-4 py-2 disabled:opacity-50 hover:bg-neutral-800 transition-colors"
        >
          {loading ? "Creating…" : "Create Block"}
        </button>
      </form>
    </div>
  );
}
