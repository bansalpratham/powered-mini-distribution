import { NextResponse } from 'next/server';
import { allocateLead } from '@/services/allocation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, city, serviceId, description } = body;

    // Validate request inputs
    if (!name || !phone || !city || !serviceId || !description) {
      return NextResponse.json(
        { error: 'All fields (name, phone, city, serviceId, description) are required.' },
        { status: 400 }
      );
    }

    const result = await allocateLead({
      name,
      phone,
      city,
      serviceId,
      description,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error creating lead:', error);
    
    // Friendly handling of compound unique index violation
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A lead with this phone number has already requested this service. Duplicates are blocked.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to submit lead request' },
      { status: 500 }
    );
  }
}
