import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Service from '@/models/Service';
import { allocateLead } from '@/services/allocation';

export async function POST() {
  try {
    await connectDB();

    const services = await Service.find({});
    if (services.length === 0) {
      return NextResponse.json({ error: 'Please seed the database first by loading the dashboard' }, { status: 400 });
    }

    // Prepare 10 concurrent lead inputs
    // We will use standard mock details, with random numbers to avoid duplication across runs,
    // but run them in parallel to test transactional safety and round-robin consistency!
    const batchId = Math.floor(Math.random() * 1000000);
    const mockLeads = Array.from({ length: 10 }).map((_, index) => {
      // Rotate services
      const service = services[index % services.length];
      
      // We will generate unique phone numbers to make sure they are valid, but they are all created simultaneously!
      const phone = `555${String(batchId).padStart(6, '0')}${index}`;
      
      return {
        name: `Concurrent Lead ${index + 1}`,
        phone,
        city: ['New York', 'San Francisco', 'Chicago', 'Austin', 'Miami'][index % 5],
        serviceId: service._id.toString(),
        description: `This is automated lead #${index + 1} generated concurrently in batch ${batchId}.`,
      };
    });

    // Fire all 10 requests concurrently using Promise.allSettled
    const results = await Promise.allSettled(
      mockLeads.map((lead) => allocateLead(lead))
    );

    const summary = results.map((res, index) => {
      if (res.status === 'fulfilled') {
        return {
          success: true,
          leadName: mockLeads[index].name,
          assigned: res.value.assignedProviders.map(p => p.name),
        };
      } else {
        return {
          success: false,
          leadName: mockLeads[index].name,
          error: res.reason.message || 'Unknown error',
        };
      }
    });

    return NextResponse.json({
      message: '10 concurrent leads processed.',
      results: summary,
    });
  } catch (error: any) {
    console.error('Error generating concurrent leads:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate concurrent leads' },
      { status: 500 }
    );
  }
}
