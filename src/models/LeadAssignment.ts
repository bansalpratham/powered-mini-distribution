import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILeadAssignment extends Document {
  leadId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  assignedAt: Date;
}

const LeadAssignmentSchema = new Schema<ILeadAssignment>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    providerId: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
    assignedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound unique index: prevents duplicate lead assignments to the same provider
LeadAssignmentSchema.index({ leadId: 1, providerId: 1 }, { unique: true });

const LeadAssignment: Model<ILeadAssignment> =
  mongoose.models.LeadAssignment ||
  mongoose.model<ILeadAssignment>('LeadAssignment', LeadAssignmentSchema);

export default LeadAssignment;
