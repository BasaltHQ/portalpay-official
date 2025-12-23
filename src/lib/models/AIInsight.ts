import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAIInsight extends Document {
	module: 'inventory' | 'scheduling' | 'invoicing' | 'menu' | 'analytics' | 'hostpro' | 'dashboard';
	title: string;
	description: string;
	action: string;
	urgency: 'low' | 'medium' | 'critical';
	impact?: string;
	data?: Record<string, any>;
	status: 'active' | 'dismissed';
	createdAt: Date;
	forDate?: Date; // e.g., next-day insights
	createdBy?: string; // userId or 'varuni'
}

const AIInsightSchema = new Schema<IAIInsight>({
	module: { type: String, required: true },
	title: { type: String, required: true },
	description: { type: String, required: true },
	action: { type: String, required: true },
	urgency: { type: String, required: true },
	impact: { type: String },
	data: { type: Schema.Types.Mixed },
	status: { type: String, enum: ['active', 'dismissed'], default: 'active' },
	forDate: { type: Date },
	createdBy: { type: String, default: 'varuni' },
}, { timestamps: { createdAt: true, updatedAt: true } });

export const AIInsight: Model<IAIInsight> = mongoose.models.AIInsight || mongoose.model<IAIInsight>('AIInsight', AIInsightSchema);

export default AIInsight;

