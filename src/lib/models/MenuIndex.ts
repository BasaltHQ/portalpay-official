import mongoose from 'mongoose';

const modifierOptionSchema = new mongoose.Schema({
  referenceId: Number,
  guid: String,
  name: String,
  price: Number,
  pricingStrategy: String,
}, { _id: false });

const modifierGroupSchema = new mongoose.Schema({
  referenceId: Number,
  guid: String,
  name: String,
  pricingStrategy: String,
  modifierOptionReferences: [Number],
}, { _id: false });

const menuItemSchema = new mongoose.Schema({
  guid: { type: String, index: true },
  name: String,
  description: String,
  price: Number,
  pricingStrategy: String,
  taxInclusion: String,
  modifierGroupReferences: [Number],
}, { _id: false });

const menuGroupSchema: any = new mongoose.Schema({
  guid: String,
  name: String,
  description: String,
  menuItems: [menuItemSchema],
}, { _id: false });

// Add recursive children after base schema is created
menuGroupSchema.add({ menuGroups: [menuGroupSchema] });

const menuSchema = new mongoose.Schema({
  guid: String,
  name: String,
  description: String,
  menuGroups: [menuGroupSchema],
}, { _id: false });

const menuIndexSchema = new mongoose.Schema({
  restaurantGuid: { type: String, required: true },
  lastUpdated: String,
  menus: [menuSchema],
  // Use Mixed to tolerate V2 vs V3 differences like visibility, etc.
  modifierGroupReferences: { type: Map, of: mongoose.Schema.Types.Mixed },
  modifierOptionReferences: { type: Map, of: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

menuIndexSchema.index({ restaurantGuid: 1 }, { unique: true });

export const MenuIndex = mongoose.models.MenuIndex || mongoose.model('MenuIndex', menuIndexSchema);


