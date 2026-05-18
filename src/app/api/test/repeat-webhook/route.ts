import { NextResponse } from 'next/server';
import { processSubscriptionWebhook } from '@/services/webhook';

export async function POST() {
  try {
    const testEventId = `idempotent_test_${Math.floor(Math.random() * 100000)}`;

    // Fire 5 identical requests simultaneously in parallel
    const promises = Array.from({ length: 5 }).map(() =>
      processSubscriptionWebhook(testEventId)
    );

    const results = await Promise.allSettled(promises);

    const summary = results.map((res) => {
      if (res.status === 'fulfilled') {
        return res.value;
      } else {
        return {
          success: false,
          error: res.reason.message || 'Unknown error',
        };
      }
    });

    return NextResponse.json({
      eventId: testEventId,
      message: 'Triggered 5 identical webhook requests in parallel.',
      results: summary,
    });
  } catch (error: any) {
    console.error('Error in repeat webhook test:', error);
    return NextResponse.json(
      { error: error.message || 'Repeat webhook test failed' },
      { status: 500 }
    );
  }
}
