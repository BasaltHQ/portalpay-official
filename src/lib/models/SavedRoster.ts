import mongoose, { Schema, Document } from 'mongoose';
import { RosterNode, RosterAssignment } from './RosterConfiguration'; // Assuming types can be shared

interface AggregateRating {
  department: string;
  rating: number;
}

export interface ISavedRoster extends Document {
  name: string;
  rosterDate: Date;
  shift: string;
  notes?: string;
  nodes: RosterNode[];
  aggregateRatings: {
    overall: number;
    byDepartment: AggregateRating[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const AggregateRatingSchema = new Schema<AggregateRating>({
  department: { type: String, required: true },
  rating: { type: Number, required: true },
}, { _id: false });

// Reusing RosterNode structure, assuming it's exported from RosterConfiguration
const RosterAssignmentSchema = new Schema<RosterAssignment>({
  userId: { type: String, required: true },
  source: { type: String, enum: ['TOAST', 'SEVEN_SHIFTS'], required: true },
  displayName: { type: String },
  rating: { type: Number, default: 0 },
}, { _id: false });

const RosterNodeSchema: Schema<RosterNode> = new Schema<RosterNode>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  department: { type: String, required: true },
  stratum: { type: String, enum: ['ADMIN', 'BOH', 'FOH'], required: true },
  capacity: { type: Number, required: true, default: 1 },
  assigned: { type: [RosterAssignmentSchema], default: [] },
  children: { type: [/* recursive */], default: undefined },
}, { _id: false, strict: false });


const SavedRosterSchema = new Schema<ISavedRoster>({
  name: { type: String, required: true },
  rosterDate: { type: Date, required: true, index: true },
  shift: { type: String, required: true, index: true },
  notes: { type: String },
  nodes: { type: [RosterNodeSchema], required: true },
  aggregateRatings: {
    overall: { type: Number, required: true },
    byDepartment: { type: [AggregateRatingSchema], required: true },
  },
}, {
  timestamps: true,
});

SavedRosterSchema.index({ rosterDate: 1, shift: 1 });

const SavedRoster = mongoose.models.SavedRoster || mongoose.model<ISavedRoster>('SavedRoster', SavedRosterSchema);

export default SavedRoster;
