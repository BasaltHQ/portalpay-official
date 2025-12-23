import mongoose from 'mongoose';

const orderTrackingConfigSchema = new mongoose.Schema({
  restaurantGuid: { type: String, required: true },
  enabled: { type: Boolean, default: false },
  lastRunAt: { type: Date },
  lastBusinessDate: { type: String },
}, { timestamps: true });

orderTrackingConfigSchema.index({ restaurantGuid: 1 }, { unique: true });

export const OrderTrackingConfig = mongoose.models.OrderTrackingConfig || mongoose.model('OrderTrackingConfig', orderTrackingConfigSchema);


