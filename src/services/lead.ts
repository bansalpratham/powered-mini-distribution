import connectDB from '@/lib/mongodb';
import Lead from '@/models/Lead';
import mongoose from 'mongoose';

interface CreateLeadInput {
  name: string;
  phone: string;
  city: string;
  serviceId: string;
  description: string;
}

export async function createLead(input: CreateLeadInput, session?: mongoose.ClientSession | null) {
  await connectDB();
  const queryOpts = session ? { session } : {};

  // Check unique compound index manually as a secondary layer
  const leadExists = await Lead.findOne({
    phone: input.phone,
    serviceId: input.serviceId,
  }).session(session || null);

  if (leadExists) {
    const err = new Error(`Lead duplicate: Phone ${input.phone} already submitted a request for this service.`);
    (err as any).code = 11000;
    throw err;
  }

  const leadArray = await Lead.create(
    [
      {
        name: input.name,
        phone: input.phone,
        city: input.city,
        serviceId: new mongoose.Types.ObjectId(input.serviceId),
        description: input.description,
      },
    ],
    queryOpts
  );
  return leadArray[0];
}

export async function getLeadById(leadId: string, session?: mongoose.ClientSession | null) {
  await connectDB();
  return await Lead.findById(leadId)
    .populate('serviceId')
    .session(session || null);
}

export async function getAllLeads() {
  await connectDB();
  return await Lead.find({})
    .populate('serviceId')
    .sort({ createdAt: -1 });
}
