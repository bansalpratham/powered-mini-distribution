import { NextResponse } from 'next/server';
import { processSubscriptionWebhook } from '@/services/webhook';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId is required in webhook body.' },
        { status: 400 }
      );
    }

    const result = await processSubscriptionWebhook(eventId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error handling webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed.' },
      { status: 500 }
    );
  }
}
