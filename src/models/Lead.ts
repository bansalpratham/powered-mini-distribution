import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILead extends Document {
  name: string;
  phone: string;
  city: string;
  serviceId: mongoose.Types.ObjectId;
  description: string;
  createdAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    city: { type: String, required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

// Compound unique index: prevents duplicate leads for the SAME service
LeadSchema.index({ phone: 1, serviceId: 1 }, { unique: true });

const Lead: Model<ILead> =
  mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);

export default Lead;
