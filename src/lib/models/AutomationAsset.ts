import mongoose from "mongoose";

const telemetrySchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metric: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

const automationAssetSchema = new mongoose.Schema(
  {
    assetTag: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "Autonomous Tool Cart",
        "EV Charger",
        "Calibration System",
        "Parts Locker",
        "Shop Drone",
        "Inspection Scanner",
        "Tire Robot",
        "Fluid Station",
      ],
      required: true,
    },
    manufacturer: {
      type: String,
      trim: true,
    },
    modelNumber: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["online", "offline", "maintenance", "degraded"],
      default: "online",
    },
    firmwareVersion: {
      type: String,
      trim: true,
    },
    healthScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },
    utilizationRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    zone: {
      type: String,
      trim: true,
    },
    locationDescription: {
      type: String,
      trim: true,
    },
    assignedBay: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceBay",
    },
    connectedDevices: {
      type: Number,
      default: 0,
      min: 0,
    },
    telemetry: [telemetrySchema],
    lastHeartbeat: Date,
    lastServiceDate: Date,
    nextServiceDate: Date,
    serviceIntervalDays: {
      type: Number,
      default: 90,
    },
    safetyAlerts: [
      {
        level: {
          type: String,
          enum: ["info", "warning", "critical"],
          default: "info",
        },
        message: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: String,
  },
  {
    timestamps: true,
  },
);

automationAssetSchema.index({ type: 1, status: 1 });
automationAssetSchema.index({ zone: 1 });

automationAssetSchema.virtual("isServiceDue").get(function () {
  if (!this.nextServiceDate) return false;
  return new Date(this.nextServiceDate).getTime() <= Date.now();
});

export const AutomationAsset =
  mongoose.models.AutomationAsset ||
  mongoose.model("AutomationAsset", automationAssetSchema);
