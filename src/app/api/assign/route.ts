import { NextResponse } from 'next/server';
import { assignExistingLead } from '@/services/allocation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json(
        { error: 'leadId is required in request body.' },
        { status: 400 }
      );
    }

    const result = await assignExistingLead(leadId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error assigning lead:', error);
    return NextResponse.json(
      { error: error.message || 'Lead assignment failed.' },
      { status: 500 }
    );
  }
}
