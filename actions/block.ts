// actions/blocks.ts
"use server";

import { connectMongo } from "@/lib/mongo";
import { StudyBlock } from "@/models/StudyBlock";
import { scheduleBlockReminder } from "@/actions/email";

export async function createBlock(input: {
  userId: string;
  userEmail?: string;
  userTimeZone?: string;
  title: string;
  startAtISO: string;
  endAtISO: string;
}) {
  await connectMongo();

  const startAt = new Date(input.startAtISO);
  const endAt = new Date(input.endAtISO);

  if (!(startAt instanceof Date) || isNaN(startAt.getTime())) {
    throw new Error("Invalid start time");
  }
  if (!(endAt instanceof Date) || isNaN(endAt.getTime())) {
    throw new Error("Invalid end time");
  }
  if (endAt <= startAt) {
    throw new Error("End time must be after start time");
  }

  const doc = await StudyBlock.create({
    userId: input.userId,
    title: input.title,
    startAt, // store UTC
    endAt,
  });

  // Schedule email reminder (10 minutes before start)
  try {
    await scheduleBlockReminder(
      doc._id.toString(),
      input.userId,
      input.userEmail,
      input.userTimeZone
    );
  } catch (error) {
    console.error("Failed to queue/send reminder:", error);
    // Don't fail block creation if reminder step fails
  }

  return JSON.parse(JSON.stringify(doc));
}

export async function getUpcomingBlocks(userId: string) {
  await connectMongo();
  const now = new Date();
  const rows = await StudyBlock.find({ userId, startAt: { $gte: now } })
    .sort({ startAt: 1 })
    .lean();
  return rows.map((r: any) => ({
    _id: r._id.toString(),
    title: r.title,
    startAtISO: r.startAt.toISOString(),
    endAtISO: r.endAt.toISOString(),
  }));
}

export async function deleteBlock(blockId: string, userId: string) {
  await connectMongo();

  // Verify the block belongs to the user
  const block = await StudyBlock.findOne({ _id: blockId, userId });
  if (!block) {
    throw new Error("Block not found or access denied");
  }

  // Delete the block
  await StudyBlock.findByIdAndDelete(blockId);

  // Cancel any pending email reminders
  const { EmailDelivery } = await import("@/models/EmailDelivery");
  await EmailDelivery.updateMany(
    { blockId, status: "pending" },
    { status: "cancelled" }
  );

  return { success: true };
}

export async function getAllBlocks(userId: string) {
  await connectMongo();
  const rows = await StudyBlock.find({ userId })
    .sort({ startAt: -1 }) // Most recent first
    .lean();
  return rows.map((r: any) => ({
    _id: r._id.toString(),
    title: r.title,
    startAtISO: r.startAt.toISOString(),
    endAtISO: r.endAt.toISOString(),
    createdAtISO: r.createdAt.toISOString(),
  }));
}
