import mongoose from "mongoose";

const serviceBaySchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    type: {
      type: String,
      enum: [
        "General",
        "Alignment",
        "Diagnostic",
        "EV Specialized",
        "Heavy Duty",
        "Express",
        "Detail",
      ],
      default: "General",
    },
    status: {
      type: String,
      enum: ["available", "occupied", "reserved", "out_of_service"],
      default: "available",
    },
    assignedTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamMember",
    },
    currentTicket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceLaneTicket",
    },
    capacity: {
      type: Number,
      default: 1,
      min: 1,
    },
    queueDepth: {
      type: Number,
      default: 0,
      min: 0,
    },
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    lastInspection: Date,
    nextMaintenance: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

serviceBaySchema.index({ status: 1 });
serviceBaySchema.index({ type: 1 });

export const ServiceBay =
  mongoose.models.ServiceBay ||
  mongoose.model("ServiceBay", serviceBaySchema);
