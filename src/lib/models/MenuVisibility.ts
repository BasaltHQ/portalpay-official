import mongoose from 'mongoose';

const menuVisibilitySchema = new mongoose.Schema({
  restaurantGuid: { type: String, required: true },
  hiddenMenus: { type: [String], default: [] },
  hiddenGroups: { type: [String], default: [] },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

menuVisibilitySchema.index({ restaurantGuid: 1 }, { unique: true });

export const MenuVisibility = mongoose.models.MenuVisibility || mongoose.model('MenuVisibility', menuVisibilitySchema);



