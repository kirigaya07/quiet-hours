import { Schema, model, models } from "mongoose";

const StudyBlockSchema = new Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Optional: compound index to speed queries for upcoming blocks per user
StudyBlockSchema.index({ userId: 1, startAt: 1 });

export const StudyBlock =
  models.StudyBlock || model("StudyBlock", StudyBlockSchema);
