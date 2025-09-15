// app/api/env-check/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const envCheck = {
    // Required for authentication
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? "✅ Set"
      : "❌ Missing (REQUIRED)",
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? "✅ Set"
      : "❌ Missing (REQUIRED)",

    // Required for data storage
    mongodbUri: process.env.MONGODB_URI ? "✅ Set" : "❌ Missing (REQUIRED)",

    // Optional for email reminders
    resendKey: process.env.RESEND_API_KEY
      ? "✅ Set"
      : "⚠️ Missing (OPTIONAL - emails won't work)",

    // Optional for CRON security
    cronSecret: process.env.CRON_SECRET ? "✅ Set" : "⚠️ Missing (OPTIONAL)",
  };

  const requiredMissing = [
    !process.env.NEXT_PUBLIC_SUPABASE_URL && "NEXT_PUBLIC_SUPABASE_URL",
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    !process.env.MONGODB_URI && "MONGODB_URI",
  ].filter(Boolean);

  return NextResponse.json({
    environment: envCheck,
    status:
      requiredMissing.length === 0
        ? "✅ Ready to run"
        : "❌ Missing required variables",
    missingRequired: requiredMissing,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + "...",
    timestamp: new Date().toISOString(),
  });
}
