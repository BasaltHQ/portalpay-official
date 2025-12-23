import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    vin: {
      type: String,
      trim: true,
    },
    year: Number,
    make: String,
    model: String,
    trim: String,
    mileage: Number,
    licensePlate: String,
    color: String,
    fuelType: String,
    drivetrain: String,
  },
  { _id: false },
);

const ticketServiceSchema = new mongoose.Schema(
  {
    servicePackage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServicePackage",
      required: true,
    },
    status: {
      type: String,
      enum: [
        "queued",
        "diagnosing",
        "waiting_parts",
        "in_progress",
        "quality_check",
        "completed",
      ],
      default: "queued",
    },
    estimatedHours: {
      type: Number,
      min: 0,
    },
    actualHours: {
      type: Number,
      min: 0,
    },
    estimatedPrice: {
      type: Number,
      min: 0,
    },
    approved: {
      type: Boolean,
      default: true,
    },
    technicianNotes: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

const ticketNoteSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
    },
    author: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    kind: {
      type: String,
      enum: ["advisor", "technician", "customer", "parts", "ai"],
      default: "advisor",
    },
  },
  { _id: false },
);

const serviceLaneTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerContact: {
      phone: String,
      email: String,
      prefersText: {
        type: Boolean,
        default: true,
      },
    },
    vehicle: vehicleSchema,
    services: [ticketServiceSchema],
    advisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamMember",
    },
    primaryTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamMember",
    },
    bay: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceBay",
    },
    status: {
      type: String,
      enum: [
        "awaiting_check_in",
        "waiting_on_approval",
        "waiting_parts",
        "in_service",
        "road_test",
        "ready_for_pickup",
        "delivered",
      ],
      default: "awaiting_check_in",
    },
    dropoffTime: Date,
    promisedTime: Date,
    actualStartTime: Date,
    actualCompletionTime: Date,
    nextFollowUpDate: Date,
    recommendedFollowUps: [
      {
        type: String,
        trim: true,
      },
    ],
    notes: [ticketNoteSchema],
    attachments: [
      {
        url: String,
        label: String,
      },
    ],
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

serviceLaneTicketSchema.index({ status: 1 });
serviceLaneTicketSchema.index({ promisedTime: 1 });
serviceLaneTicketSchema.index({ customerName: "text", ticketNumber: "text" });

export const ServiceLaneTicket =
  mongoose.models.ServiceLaneTicket ||
  mongoose.model("ServiceLaneTicket", serviceLaneTicketSchema);
