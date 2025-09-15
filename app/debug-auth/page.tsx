// app/debug-auth/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export default function DebugAuthPage() {
  const { user, loading } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [cookies, setCookies] = useState<string>("");

  useEffect(() => {
    const supabase = createBrowserClient();

    // Get current session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      setSessionInfo({ session, error });
    });

    // Get cookies
    setCookies(document.cookie);
  }, []);

  const testSignOut = async () => {
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error);
    } else {
      console.log("Signed out successfully");
      window.location.reload();
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Auth Debug Page</h1>

      <div className="space-y-6">
        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Auth Provider State</h2>
          <p>
            <strong>User:</strong> {user ? user.email : "Not logged in"}
          </p>
          <p>
            <strong>User ID:</strong> {user?.id || "N/A"}
          </p>
          <p>
            <strong>Loading:</strong> {loading ? "Yes" : "No"}
          </p>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Session Info</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Cookies</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {cookies || "No cookies"}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Actions</h2>
          <button
            onClick={testSignOut}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Test Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
