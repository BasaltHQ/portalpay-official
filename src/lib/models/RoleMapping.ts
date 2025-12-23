import mongoose, { Schema, Document } from 'mongoose';

export interface IRoleMapping extends Document {
  sevenShiftsRoleName: string;
  standardRoleName: string;
  department: string;
  stratum: 'ADMIN' | 'BOH' | 'FOH';
}

const RoleMappingSchema = new Schema<IRoleMapping>({
  sevenShiftsRoleName: { type: String, required: true, unique: true },
  standardRoleName: { type: String, required: true },
  department: { type: String, required: true },
  stratum: { type: String, enum: ['ADMIN', 'BOH', 'FOH'], required: true },
});

const RoleMapping = mongoose.models.RoleMapping || mongoose.model<IRoleMapping>('RoleMapping', RoleMappingSchema);

export default RoleMapping;
