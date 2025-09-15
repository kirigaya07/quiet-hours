// actions/email.ts
"use server";

import { connectMongo } from "@/lib/mongo";
import { EmailDelivery } from "@/models/EmailDelivery";
import { StudyBlock } from "@/models/StudyBlock";
import { User } from "@/models/User";
import { sendEmail, generateBlockReminderEmail } from "@/lib/email";

export async function scheduleBlockReminder(
  blockId: string,
  userId: string,
  userEmail?: string,
  userTimeZone?: string
) {
  await connectMongo();

  // Get the block details
  const block = await StudyBlock.findById(blockId);
  if (!block) {
    throw new Error("Block not found");
  }

  // Get user details (prefer email passed from client to avoid lookup issues)
  let emailToNotify: string | null = null;
  if (userEmail) {
    emailToNotify = userEmail;
  } else {
    const user = await User.findOne({ supabaseUserId: userId });
    if (!user) {
      throw new Error("User not found");
    }
    emailToNotify = user.email;
  }

  // Calculate when to send the reminder (10 minutes before start)
  const reminderTime = new Date(block.startAt.getTime() - 10 * 60 * 1000);

  // Skip if reminder time is in the past
  if (reminderTime <= new Date()) {
    console.log(
      `Skipping reminder for block ${blockId} - reminder time is in the past`
    );
    return;
  }

  // Create deduplication key
  const dedupeKey = `block-${blockId}-reminder`;

  try {
    // Create email delivery record
    await EmailDelivery.create({
      blockId: blockId,
      userId: userId,
      scheduledFor: reminderTime,
      status: "pending",
      dedupeKey: dedupeKey,
      // persist tz if you add it to the schema in the future
    } as any);

    console.log(
      `Scheduled reminder for block ${blockId} at ${reminderTime.toISOString()}`
    );
  } catch (error: any) {
    if (error.code === 11000) {
      // Duplicate key error - reminder already scheduled
      console.log(`Reminder already scheduled for block ${blockId}`);
    } else {
      throw error;
    }
  }
}

export async function sendScheduledReminders() {
  await connectMongo();

  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  // Find pending reminders that should be sent now
  const pendingReminders = await EmailDelivery.find({
    status: "pending",
    scheduledFor: {
      $gte: now,
      $lte: fiveMinutesFromNow,
    },
  }).populate("blockId", "title startAt endAt");

  console.log(`Found ${pendingReminders.length} reminders to send`);

  for (const reminder of pendingReminders) {
    try {
      // Determine recipient email (fallback to lookup)
      const user = await User.findOne({ supabaseUserId: reminder.userId });
      const recipientEmail = user?.email ?? undefined;

      // Get block details
      const block = await StudyBlock.findById(reminder.blockId);
      if (!block) {
        console.error(`Block not found for reminder ${reminder._id}`);
        continue;
      }

      // Format times for email in Indian Standard Time
      const tz = "Asia/Kolkata";
      const formatter = new Intl.DateTimeFormat(undefined, {
        timeZone: tz,
        dateStyle: "medium",
        timeStyle: "short",
      });
      const startTime = formatter.format(block.startAt);
      const endTime = formatter.format(block.endAt);

      // Send email
      if (!recipientEmail) {
        console.error(`No recipient email for reminder ${reminder._id}`);
        continue;
      }

      await sendEmail({
        to: recipientEmail,
        subject: `🔇 Quiet Hours Reminder: ${block.title}`,
        html: generateBlockReminderEmail(block.title, startTime, endTime),
      });

      // Update reminder status
      await EmailDelivery.findByIdAndUpdate(reminder._id, {
        status: "sent",
        sentAt: new Date(),
      });

      console.log(
        `Sent reminder for block ${block.title} to ${recipientEmail}`
      );
    } catch (error) {
      console.error(`Failed to send reminder ${reminder._id}:`, error);

      // Update reminder status to failed
      await EmailDelivery.findByIdAndUpdate(reminder._id, {
        status: "failed",
      });
    }
  }

  return {
    processed: pendingReminders.length,
    timestamp: now.toISOString(),
  };
}

export async function cleanupOldReminders() {
  await connectMongo();

  // Delete reminders older than 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const result = await EmailDelivery.deleteMany({
    scheduledFor: { $lt: sevenDaysAgo },
    status: { $in: ["sent", "failed"] },
  });

  console.log(`Cleaned up ${result.deletedCount} old reminders`);
  return result.deletedCount;
}
