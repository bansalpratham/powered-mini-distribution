import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProvider extends Document {
  name: string;
  monthlyQuota: number;
  leadsReceivedCount: number;
  active: boolean;
  createdAt: Date;
}

const ProviderSchema = new Schema<IProvider>(
  {
    name: { type: String, required: true, unique: true },
    monthlyQuota: { type: Number, required: true, default: 10 },
    leadsReceivedCount: { type: Number, required: true, default: 0 },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

const Provider: Model<IProvider> =
  mongoose.models.Provider || mongoose.model<IProvider>('Provider', ProviderSchema);

export default Provider;
