// app/api/debug-email-system/route.ts
import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongo";
import { EmailDelivery } from "@/models/EmailDelivery";
import { StudyBlock } from "@/models/StudyBlock";
import { User } from "@/models/User";

export async function GET() {
  try {
    await connectMongo();

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Get all email deliveries
    const allEmailDeliveries = await EmailDelivery.find({})
      .sort({ scheduledFor: -1 })
      .limit(10);

    // Get pending reminders
    const pendingReminders = await EmailDelivery.find({
      status: "pending",
      scheduledFor: { $gte: now },
    }).sort({ scheduledFor: 1 });

    // Get recent blocks
    const recentBlocks = await StudyBlock.find({
      startAt: { $gte: oneHourAgo, $lte: oneHourFromNow },
    }).sort({ startAt: 1 });

    // Get users
    const users = await User.find({}).limit(5);

    // Check cron job status
    const cronStatus = {
      hasCronSecret: !!process.env.CRON_SECRET,
      cronSecretLength: process.env.CRON_SECRET?.length || 0,
    };

    console.log(allEmailDeliveries[0].sentAt?.toISOString());

    return NextResponse.json({
      success: true,
      debug: {
        currentTime: now.toISOString(),
        environment: {
          resendApiKey: process.env.RESEND_API_KEY ? "✅ Set" : "❌ Missing",
          cronSecret: process.env.CRON_SECRET ? "✅ Set" : "❌ Missing",
          mongodbUri: process.env.MONGODB_URI ? "✅ Set" : "❌ Missing",
        },
        cronStatus,
        emailDeliveries: {
          total: allEmailDeliveries.length,
          pending: pendingReminders.length,
          recent: allEmailDeliveries.map((delivery) => ({
            id: delivery._id.toString(),
            blockId: delivery.blockId,
            userId: delivery.userId,
            scheduledFor: delivery.scheduledFor.toISOString(),
            status: delivery.status,
            sentAt: delivery.sentAt?.toISOString(),
            dedupeKey: delivery.dedupeKey,
          })),
        },
        blocks: {
          total: recentBlocks.length,
          recent: recentBlocks.map((block) => ({
            id: block._id.toString(),
            title: block.title,
            startAt: block.startAt.toISOString(),
            endAt: block.endAt.toISOString(),
            userId: block.userId,
            reminderTime: new Date(
              block.startAt.getTime() - 10 * 60 * 1000
            ).toISOString(),
          })),
        },
        users: users.map((user) => ({
          id: user._id.toString(),
          email: user.email,
          supabaseUserId: user.supabaseUserId,
        })),
      },
    });
  } catch (error) {
    console.error("Debug email system error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        errorType: error instanceof Error ? error.constructor.name : "Unknown",
      },
      { status: 500 }
    );
  }
}
