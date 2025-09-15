"use server";

import { connectMongo } from "@/lib/mongo";
import { User } from "@/models/User";

export async function ensureUser(userId: string, email: string) {
  await connectMongo();
  let user = await User.findOne({ supabaseUserId: userId });
  if (!user) {
    user = await User.create({ supabaseUserId: userId, email });
  }
  return user;
}
