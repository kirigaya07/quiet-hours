// app/blocks/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllBlocks } from "@/actions/block";
import Link from "next/link";

export default async function BlocksPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">All Blocks</h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          You&apos;re not signed in.{" "}
          <Link className="underline" href="/signin">
            Sign in
          </Link>{" "}
          to view your blocks.
        </p>
      </div>
    );
  }

  const blocks = await getAllBlocks(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">All Blocks</h2>
        <Link
          href="/blocks/new"
          className="rounded-md bg-black text-white px-4 py-2 hover:bg-gray-800 transition-colors"
        >
          Create New Block
        </Link>
      </div>

      {blocks.length === 0 ? (
        <div className="rounded-xl border border-neutral-200/60 p-6 dark:border-neutral-800">
          <p>
            No blocks created yet.{" "}
            <Link href="/blocks/new" className="underline">
              Create your first block
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((block) => {
            const startDate = new Date(block.startAtISO);
            const endDate = new Date(block.endAtISO);
            const now = new Date();
            const isPast = endDate < now;
            const isCurrent = startDate <= now && endDate >= now;
            // const isUpcoming = startDate > now; // Unused for now

            return (
              <div
                key={block._id}
                className={`rounded-lg border p-4 dark:border-neutral-800 ${
                  isCurrent
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : isPast
                    ? "border-gray-300 bg-gray-50 dark:bg-gray-900/20"
                    : "border-blue-300 bg-blue-50 dark:bg-blue-900/20"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{block.title}</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      {startDate.toLocaleString()} → {endDate.toLocaleString()}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                      Created: {new Date(block.createdAtISO).toLocaleString()}
                    </div>
                  </div>
                  <div className="ml-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isCurrent
                          ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                          : isPast
                          ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                      }`}
                    >
                      {isCurrent ? "Active" : isPast ? "Completed" : "Upcoming"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
