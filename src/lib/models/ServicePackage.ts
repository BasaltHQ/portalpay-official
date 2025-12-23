import mongoose from "mongoose";

const recommendedPartSchema = new mongoose.Schema(
  {
    part: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      default: "each",
      trim: true,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

const servicePackageSchema = new mongoose.Schema(
  {
    serviceCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    shortName: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Preventive Maintenance",
        "Diagnostics",
        "Powertrain",
        "Electrical",
        "Braking",
        "Suspension",
        "HVAC",
        "Tires",
        "Detailing",
        "Performance",
        "Fleet Service",
        "Inspection",
        "Restoration",
      ],
    },
    subcategory: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    detailedSteps: [
      {
        type: String,
        trim: true,
      },
    ],
    laborHours: {
      type: Number,
      required: true,
      min: 0,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    bayType: {
      type: String,
      enum: [
        "General",
        "Heavy Duty",
        "Alignment",
        "Express",
        "Diagnostic",
        "EV Specialized",
        "Detail",
      ],
      default: "General",
    },
    skillLevel: {
      type: String,
      enum: ["Apprentice", "Intermediate", "Advanced", "Master"],
      default: "Intermediate",
    },
    warrantyMonths: {
      type: Number,
      default: 0,
      min: 0,
    },
    serviceIntervalMiles: {
      type: Number,
      min: 0,
    },
    serviceIntervalMonths: {
      type: Number,
      min: 0,
    },
    recommendedParts: [recommendedPartSchema],
    requiredEquipment: [
      {
        type: String,
        trim: true,
      },
    ],
    upsellRecommendations: [
      {
        type: String,
        trim: true,
      },
    ],
    inspectionChecklist: [
      {
        type: String,
        trim: true,
      },
    ],
    safetyNotes: {
      type: String,
      trim: true,
    },
    sameDayEligible: {
      type: Boolean,
      default: true,
    },
    isSeasonal: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

servicePackageSchema.index({ category: 1, name: 1 });
servicePackageSchema.index({ isFeatured: 1 });
servicePackageSchema.index({ sameDayEligible: 1 });

export const ServicePackage =
  mongoose.models.ServicePackage ||
  mongoose.model("ServicePackage", servicePackageSchema);
