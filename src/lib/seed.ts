import connectDB from './mongodb';
import Service from '@/models/Service';
import Provider from '@/models/Provider';
import Lead from '@/models/Lead';
import LeadAssignment from '@/models/LeadAssignment';
import AllocationState from '@/models/AllocationState';
import WebhookEvent from '@/models/WebhookEvent';

export async function seedDatabase() {
  await connectDB();

  // 1. Seed Services
  const serviceNames = ['Service 1', 'Service 2', 'Service 3'];
  const services = [];

  for (const name of serviceNames) {
    let service = await Service.findOne({ name });
    if (!service) {
      service = await Service.create({ name });
    }
    services.push(service);
  }

  // 2. Seed Providers (exactly 8)
  const providers = [];
  for (let i = 1; i <= 8; i++) {
    const name = `Provider ${i}`;
    let provider = await Provider.findOne({ name });
    if (!provider) {
      provider = await Provider.create({
        name,
        monthlyQuota: 10,
        leadsReceivedCount: 0,
        active: true,
      });
    }
    providers.push(provider);
  }

  // 3. Seed/Reset AllocationState
  // Make sure we have allocation states initialized for each service
  for (const service of services) {
    const stateExists = await AllocationState.findOne({ serviceId: service._id });
    if (!stateExists) {
      await AllocationState.create({
        serviceId: service._id,
        lastAssignedProviderIndex: -1,
      });
    }
  }

  console.log('Database seeded successfully!');
  return { services, providers };
}

export async function resetDatabase() {
  await connectDB();

  // Clear data
  await LeadAssignment.deleteMany({});
  await Lead.deleteMany({});
  await AllocationState.deleteMany({});
  await WebhookEvent.deleteMany({});
  await Provider.deleteMany({});
  await Service.deleteMany({});

  // Seed again
  const result = await seedDatabase();
  return { success: true, message: 'Database reset and seeded successfully!', ...result };
}
