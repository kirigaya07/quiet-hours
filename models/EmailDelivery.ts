import { Schema, model, models } from "mongoose";

const EmailDeliverySchema = new Schema({
  blockId: { type: String, required: true },
  userId: { type: String, required: true },
  scheduledFor: { type: Date, required: true },
  sentAt: { type: Date },
  status: {
    type: String,
    enum: ["pending", "sent", "failed", "cancelled"],
    default: "pending",
  },
  dedupeKey: { type: String, required: true },
});

// Unique index for idempotency
EmailDeliverySchema.index({ dedupeKey: 1 }, { unique: true });

export const EmailDelivery =
  models.EmailDelivery || model("EmailDelivery", EmailDeliverySchema);
