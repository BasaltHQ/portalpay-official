import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: String,
    title: String,
    email: String,
    phone: String,
    mobile: String,
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const addressSchema = new mongoose.Schema(
  {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: "US",
    },
  },
  { _id: false },
);

const paymentTermsSchema = new mongoose.Schema(
  {
    terms: {
      type: String,
      enum: ["Net 15", "Net 30", "Net 45", "Net 60", "COD", "Prepaid", "Custom"],
      default: "Net 30",
    },
    customTerms: String,
    creditLimit: Number,
    currentBalance: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
  },
  { _id: false },
);

const logisticsSchema = new mongoose.Schema(
  {
    deliveryDays: [String],
    deliveryWindow: String,
    minimumOrder: {
      type: Number,
      default: 0,
    },
    freightMethod: String,
    dropShipAvailable: {
      type: Boolean,
      default: false,
    },
    leadTimeDays: {
      type: Number,
      default: 2,
    },
    expeditedLeadTimeDays: Number,
    shippingAccount: String,
  },
  { _id: false },
);

const accreditationSchema = new mongoose.Schema(
  {
    name: String,
    issuedBy: String,
    certificationId: String,
    issuedAt: Date,
    expiresAt: Date,
    notes: String,
  },
  { _id: false },
);

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    supplierCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "OEM",
        "Aftermarket",
        "Performance",
        "Reconditioning",
        "Equipment",
        "Fluids & Chemicals",
        "Tire Distributor",
        "Diagnostic",
        "Fleet",
        "Salvage",
      ],
      default: "Aftermarket",
    },
    categories: [
      {
        type: String,
        enum: [
          "Braking",
          "Powertrain",
          "Electrical",
          "Suspension",
          "HVAC",
          "Diagnostics",
          "Tires",
          "Tools",
          "Shop Supplies",
          "Fluids",
          "Fluids & Chemicals",
          "Detailing",
          "Safety",
          "Accessories",
          "Fleet",
        ],
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive", "trial", "pending_review"],
      default: "active",
    },
    contacts: [contactSchema],
    address: addressSchema,
    paymentTerms: paymentTermsSchema,
    logistics: logisticsSchema,
    performanceMetrics: {
      totalOrders: {
        type: Number,
        default: 0,
      },
      totalSpend: {
        type: Number,
        default: 0,
      },
      averageLeadTimeDays: {
        type: Number,
        default: 0,
      },
      onTimeDeliveryRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      fillRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      qualityScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      warrantyClaims: {
        type: Number,
        default: 0,
      },
      lastEvaluation: Date,
    },
    programs: [
      {
        name: String,
        description: String,
        effectiveDate: Date,
        expirationDate: Date,
        rebatePercent: Number,
      },
    ],
    accreditations: [accreditationSchema],
    digitalPortals: [
      {
        name: String,
        url: String,
        credentials: {
          username: String,
          password: String,
        },
      },
    ],
    documents: [
      {
        name: String,
        type: String,
        url: String,
        uploadedAt: Date,
        expiresAt: Date,
      },
    ],
    preferred: {
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
    notes: String,
  },
  {
    timestamps: true,
  },
);

supplierSchema.index({ name: 1 });
supplierSchema.index({ status: 1 });
supplierSchema.index({ type: 1 });
supplierSchema.index({ categories: 1 });

try {
  supplierSchema.index(
    { name: "text", companyName: "text", supplierCode: "text", "contacts.name": "text" },
    { name: "supplier_text", weights: { name: 10, companyName: 6, supplierCode: 5 } },
  );
} catch {}

export const Supplier =
  mongoose.models.Supplier ||
  mongoose.model("Supplier", supplierSchema);
