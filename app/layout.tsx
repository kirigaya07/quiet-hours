// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { AuthProvider } from "@/components/AuthProvider";
import { Navigation } from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Quiet Hours",
  description: "Create study blocks and get timely reminders.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
            <header className="border-b border-neutral-200/60 dark:border-neutral-800">
              <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
                <Link href="/" className="text-xl font-semibold">
                  Quiet Hours
                </Link>
                <Navigation />
              </div>
            </header>
            <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
            <footer className="border-t border-neutral-200/60 dark:border-neutral-800">
              <div className="mx-auto max-w-4xl px-4 py-6 text-sm text-neutral-500">
                Built with Next.js
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
