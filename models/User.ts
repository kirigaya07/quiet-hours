import { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  supabaseUserId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const User = models.User || model("User", UserSchema);
