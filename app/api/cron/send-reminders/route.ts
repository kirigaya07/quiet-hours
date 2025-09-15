// app/api/cron/send-reminders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendScheduledReminders, cleanupOldReminders } from "@/actions/email";

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a trusted source (Vercel Cron, GitHub Actions, etc.)
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting scheduled reminder processing...");

    // Send scheduled reminders
    const reminderResult = await sendScheduledReminders();

    // Cleanup old reminders
    const cleanupResult = await cleanupOldReminders();

    return NextResponse.json({
      success: true,
      reminders: reminderResult,
      cleanup: cleanupResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("CRON job failed:", error);
    return NextResponse.json(
      {
        error: "CRON job failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Allow POST requests as well for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}
