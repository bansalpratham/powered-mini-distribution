import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Service from '@/models/Service';
import Provider, { IProvider } from '@/models/Provider';
import LeadAssignment from '@/models/LeadAssignment';
import AllocationState from '@/models/AllocationState';
import { runInTransaction } from '@/lib/transaction';
import { realtimeEmitter } from '@/lib/events';
import { createLead } from '@/services/lead';

interface AllocateLeadInput {
  name: string;
  phone: string;
  city: string;
  serviceId: string;
  description: string;
}

export async function allocateLead(input: AllocateLeadInput) {
  await connectDB();

  return await runInTransaction(async (session) => {
    // 1. Resolve and validate service
    const service = await Service.findById(input.serviceId).session(session || null);
    if (!service) {
      throw new Error(`Service with ID ${input.serviceId} not found.`);
    }

    // 2. Validate & Create Lead using Lead Service inside the transaction
    const lead = await createLead(input, session || null);

    // 3. Define mandatory providers and pool for this service
    let mandatoryNames: string[] = [];
    let poolNames: string[] = [];

    if (service.name === 'Service 1') {
      mandatoryNames = ['Provider 1'];
      poolNames = ['Provider 2', 'Provider 3', 'Provider 4'];
    } else if (service.name === 'Service 2') {
      mandatoryNames = ['Provider 5'];
      poolNames = ['Provider 6', 'Provider 7', 'Provider 8'];
    } else if (service.name === 'Service 3') {
      mandatoryNames = ['Provider 1', 'Provider 4'];
      poolNames = ['Provider 2', 'Provider 3', 'Provider 5', 'Provider 6', 'Provider 7', 'Provider 8'];
    } else {
      poolNames = ['Provider 1', 'Provider 2', 'Provider 3', 'Provider 4', 'Provider 5', 'Provider 6', 'Provider 7', 'Provider 8'];
    }

    // Fetch all providers involved (mandatory + pool) inside this session
    const allProviderNames = Array.from(new Set([...mandatoryNames, ...poolNames]));
    const providers = await Provider.find({
      name: { $in: allProviderNames },
      active: true,
    }).session(session || null);

    const providerMap = new Map<string, IProvider>();
    providers.forEach((p) => providerMap.set(p.name, p));

    const assignedProvidersMap = new Map<string, IProvider>();

    // 4. Assign Mandatory Providers (check their quota)
    for (const name of mandatoryNames) {
      const provider = providerMap.get(name);
      if (provider && provider.leadsReceivedCount < provider.monthlyQuota) {
        assignedProvidersMap.set(provider.name, provider);
      }
    }

    // 5. Fill remaining slots from pool using persistent round-robin
    if (assignedProvidersMap.size < 3 && poolNames.length > 0) {
      // Retrieve or initialize AllocationState for persistent round-robin
      let state = await AllocationState.findOne({ serviceId: service._id }).session(session || null);
      if (!state) {
        state = new AllocationState({
          serviceId: service._id,
          lastAssignedProviderIndex: -1,
        });
        await state.save(session ? { session } : {});
      }

      const N = poolNames.length;
      let lastIndex = state.lastAssignedProviderIndex;
      const startIndex = (lastIndex + 1) % N;

      // Scan through the pool to find valid candidates
      for (let i = 0; i < N; i++) {
        if (assignedProvidersMap.size >= 3) {
          break;
        }

        const poolIdx = (startIndex + i) % N;
        const pName = poolNames[poolIdx];
        const provider = providerMap.get(pName);

        if (
          provider &&
          provider.leadsReceivedCount < provider.monthlyQuota &&
          !assignedProvidersMap.has(provider.name)
        ) {
          assignedProvidersMap.set(provider.name, provider);
          lastIndex = poolIdx;
        }
      }

      // Update the allocation state with the last assigned provider index
      state.lastAssignedProviderIndex = lastIndex;
      await state.save(session ? { session } : {});
    }

    // 6. Save Assignments and Increment Lead Counts
    const assignedProviders = Array.from(assignedProvidersMap.values());
    
    if (assignedProviders.length > 0) {
      const assignmentsData = assignedProviders.map((p) => ({
        leadId: lead._id,
        providerId: p._id,
        assignedAt: new Date(),
      }));

      // Pass ordered: true to resolve multi-document session creation in Mongoose
      await LeadAssignment.create(
        assignmentsData, 
        session ? { session, ordered: true } : { ordered: true }
      );

      // Atomically increment leadsReceivedCount for each assigned provider
      const providerIds = assignedProviders.map((p) => p._id);
      await Provider.updateMany(
        { _id: { $in: providerIds } },
        { $inc: { leadsReceivedCount: 1 } }
      ).session(session || null);
    }

    // Trigger dashboard refresh in real-time
    setTimeout(() => {
      realtimeEmitter.emitUpdate('dashboard_update', {
        event: 'lead_assigned',
        leadId: lead._id,
        timestamp: new Date().toISOString(),
      });
    }, 50);

    return {
      success: true,
      lead,
      assignedProviders: assignedProviders.map((p) => ({
        id: p._id,
        name: p.name,
      })),
    };
  });
}

export async function assignExistingLead(leadId: string) {
  await connectDB();

  return await runInTransaction(async (session) => {
    // 1. Fetch Lead using model query
    const LeadModel = mongoose.model('Lead');
    const lead = await LeadModel.findById(leadId).session(session || null);
    if (!lead) {
      throw new Error(`Lead with ID ${leadId} not found.`);
    }

    // 2. Resolve service
    const service = await Service.findById(lead.serviceId).session(session || null);
    if (!service) {
      throw new Error(`Service with ID ${lead.serviceId} not found.`);
    }

    // 3. Clear any existing assignments first to avoid duplicate violations
    await LeadAssignment.deleteMany({ leadId: lead._id }, session ? { session } : {});

    // 4. Define mandatory providers and pool for this service
    let mandatoryNames: string[] = [];
    let poolNames: string[] = [];

    if (service.name === 'Service 1') {
      mandatoryNames = ['Provider 1'];
      poolNames = ['Provider 2', 'Provider 3', 'Provider 4'];
    } else if (service.name === 'Service 2') {
      mandatoryNames = ['Provider 5'];
      poolNames = ['Provider 6', 'Provider 7', 'Provider 8'];
    } else if (service.name === 'Service 3') {
      mandatoryNames = ['Provider 1', 'Provider 4'];
      poolNames = ['Provider 2', 'Provider 3', 'Provider 5', 'Provider 6', 'Provider 7', 'Provider 8'];
    } else {
      poolNames = ['Provider 1', 'Provider 2', 'Provider 3', 'Provider 4', 'Provider 5', 'Provider 6', 'Provider 7', 'Provider 8'];
    }

    // Fetch all providers involved inside this session
    const allProviderNames = Array.from(new Set([...mandatoryNames, ...poolNames]));
    const providers = await Provider.find({
      name: { $in: allProviderNames },
      active: true,
    }).session(session || null);

    const providerMap = new Map<string, IProvider>();
    providers.forEach((p) => providerMap.set(p.name, p));

    const assignedProvidersMap = new Map<string, IProvider>();

    // 5. Assign Mandatory Providers (check quota)
    for (const name of mandatoryNames) {
      const provider = providerMap.get(name);
      if (provider && provider.leadsReceivedCount < provider.monthlyQuota) {
        assignedProvidersMap.set(provider.name, provider);
      }
    }

    // 6. Fill remaining slots from pool using persistent round-robin
    if (assignedProvidersMap.size < 3 && poolNames.length > 0) {
      let state = await AllocationState.findOne({ serviceId: service._id }).session(session || null);
      if (!state) {
        state = new AllocationState({
          serviceId: service._id,
          lastAssignedProviderIndex: -1,
        });
        await state.save(session ? { session } : {});
      }

      const N = poolNames.length;
      let lastIndex = state.lastAssignedProviderIndex;
      const startIndex = (lastIndex + 1) % N;

      for (let i = 0; i < N; i++) {
        if (assignedProvidersMap.size >= 3) {
          break;
        }

        const poolIdx = (startIndex + i) % N;
        const pName = poolNames[poolIdx];
        const provider = providerMap.get(pName);

        if (
          provider &&
          provider.leadsReceivedCount < provider.monthlyQuota &&
          !assignedProvidersMap.has(provider.name)
        ) {
          assignedProvidersMap.set(provider.name, provider);
          lastIndex = poolIdx;
        }
      }

      state.lastAssignedProviderIndex = lastIndex;
      await state.save(session ? { session } : {});
    }

    // 7. Save Assignments and Increment Lead Counts
    const assignedProviders = Array.from(assignedProvidersMap.values());
    
    if (assignedProviders.length > 0) {
      const assignmentsData = assignedProviders.map((p) => ({
        leadId: lead._id,
        providerId: p._id,
        assignedAt: new Date(),
      }));

      // Pass ordered: true to resolve multi-document session creation in Mongoose
      await LeadAssignment.create(
        assignmentsData, 
        session ? { session, ordered: true } : { ordered: true }
      );

      const providerIds = assignedProviders.map((p) => p._id);
      await Provider.updateMany(
        { _id: { $in: providerIds } },
        { $inc: { leadsReceivedCount: 1 } }
      ).session(session || null);
    }

    // Trigger dashboard refresh in real-time
    setTimeout(() => {
      realtimeEmitter.emitUpdate('dashboard_update', {
        event: 'lead_assigned',
        leadId: lead._id,
        timestamp: new Date().toISOString(),
      });
    }, 50);

    return {
      success: true,
      lead,
      assignedProviders: assignedProviders.map((p) => ({
        id: p._id,
        name: p.name,
      })),
    };
  });
}
