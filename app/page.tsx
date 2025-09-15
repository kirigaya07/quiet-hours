// app/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureUser } from "@/actions/auth";
import { getUpcomingBlocks } from "@/actions/block";
import Link from "next/link";

export default async function Page() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          You’re not signed in.{" "}
          <Link className="underline" href="/signin">
            Sign in
          </Link>{" "}
          to create quiet-hour blocks.
        </p>
      </div>
    );
  }

  // ensure user exists in Mongo
  await ensureUser(user.id, user.email ?? "");

  const blocks = await getUpcomingBlocks(user.id);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Upcoming Blocks</h2>

      {blocks.length === 0 ? (
        <div className="rounded-xl border border-neutral-200/60 p-6 dark:border-neutral-800">
          <p>
            No upcoming blocks.{" "}
            <Link href="/blocks/new" className="underline">
              Create one
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {blocks.map(
            (b: {
              _id: string;
              title: string;
              startAtISO: string;
              endAtISO: string;
            }) => {
              const start = new Date(b.startAtISO);
              const end = new Date(b.endAtISO);
              const now = new Date();
              const isPast = end < now;
              const isCurrent = start <= now && end >= now;

              return (
                <li
                  key={b._id}
                  className="rounded-lg border p-4 dark:border-neutral-800 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {b.title}
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isCurrent
                            ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                            : isPast
                            ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                        }`}
                      >
                        {isCurrent
                          ? "Active"
                          : isPast
                          ? "Completed"
                          : "Upcoming"}
                      </span>
                    </div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      {start.toLocaleString(undefined, {
                        timeZone: "Asia/Kolkata",
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}{" "}
                      →{" "}
                      {end.toLocaleString(undefined, {
                        timeZone: "Asia/Kolkata",
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                  </div>
                </li>
              );
            }
          )}
        </ul>
      )}
    </div>
  );
}
