import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamMember",
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "active", "completed", "on_hold", "cancelled"],
      default: "scheduled",
    },
    notes: {
      type: String,
      trim: true,
    },
    actualStartTime: {
      type: Date,
    },
    actualEndTime: {
      type: Date,
    },
    breakTime: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

shiftSchema.index({ date: 1 });
shiftSchema.index({ assignedTo: 1 });
shiftSchema.index({ status: 1 });
shiftSchema.index({ date: 1, assignedTo: 1 });

export const Shift =
  mongoose.models.Shift || mongoose.model("Shift", shiftSchema);
