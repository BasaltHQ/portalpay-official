import mongoose, { Schema, Document } from 'mongoose';

export type RosterStratum = 'ADMIN' | 'BOH' | 'FOH';

export interface RosterAssignment {
  userId: string; // Could be Toast GUID or 7shifts user id
  source: 'TOAST' | 'SEVEN_SHIFTS';
  displayName?: string;
  rating?: number;
}

export interface RosterNode {
  id: string;
  name: string;
  department: string;
  stratum: RosterStratum;
  capacity: number;
  assigned: RosterAssignment[];
  children?: RosterNode[];
}

export interface IRosterConfiguration extends Document {
  name: string;
  description?: string;
  isActive: boolean;
  nodes: RosterNode[];
  createdAt: Date;
  updatedAt: Date;
}

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

// Note: For recursive children we allow flexible schema (strict: false) to store nested nodes

const RosterConfigurationSchema = new Schema<IRosterConfiguration>({
  name: { type: String, required: true, unique: true, index: true },
  description: { type: String },
  isActive: { type: Boolean, default: false, index: true },
  nodes: { type: [RosterNodeSchema], default: [] },
}, {
  timestamps: true,
});

const RosterConfiguration = mongoose.models.RosterConfiguration || mongoose.model<IRosterConfiguration>('RosterConfiguration', RosterConfigurationSchema);

export default RosterConfiguration;


