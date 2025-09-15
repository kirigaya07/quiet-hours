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
            }) => (
              <li
                key={b._id}
                className="rounded-lg border p-4 dark:border-neutral-800"
              >
                <div className="font-medium">{b.title}</div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  {new Date(b.startAtISO).toLocaleString()} →{" "}
                  {new Date(b.endAtISO).toLocaleString()}
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}
