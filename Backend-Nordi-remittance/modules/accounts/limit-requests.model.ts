import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const { Schema } = mongoose;

const LimitValuesSchema = new Schema(
  {
    perTransaction: { type: Number, min: 0 },
    daily: { type: Number, min: 0 },
    monthly: { type: Number, min: 0 },
  },
  { _id: false },
);

const LimitRequestSchema = new Schema(
  {
    _id: { type: String, default: () => uuidv4() },
    user: { type: String, ref: "Users", required: true, index: true },
    scope: {
      type: String,
      enum: ["domestic", "international"],
      required: true,
    },
    action: {
      type: String,
      enum: ["increase", "decrease"],
      required: true,
    },
    requestedLimits: { type: LimitValuesSchema, required: true },
    currentLimits: { type: LimitValuesSchema },
    reason: { type: String, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
    reviewNote: { type: String, trim: true, maxlength: 500 },
  },
  {
    timestamps: true,
    _id: false,
  },
);

LimitRequestSchema.index({ user: 1, createdAt: -1 });

const LimitRequests =
  mongoose.models.LimitRequests || mongoose.model("LimitRequests", LimitRequestSchema);

export default LimitRequests;

