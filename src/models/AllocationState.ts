import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAllocationState extends Document {
  serviceId: mongoose.Types.ObjectId;
  lastAssignedProviderIndex: number;
}

const AllocationStateSchema = new Schema<IAllocationState>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true, unique: true },
    lastAssignedProviderIndex: { type: Number, required: true, default: -1 },
  },
  { timestamps: true }
);

const AllocationState: Model<IAllocationState> =
  mongoose.models.AllocationState ||
  mongoose.model<IAllocationState>('AllocationState', AllocationStateSchema);

export default AllocationState;
