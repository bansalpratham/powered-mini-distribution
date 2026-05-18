import connectDB from '@/lib/mongodb';
import WebhookEvent from '@/models/WebhookEvent';
import Provider from '@/models/Provider';
import { runInTransaction } from '@/lib/transaction';
import { realtimeEmitter } from '@/lib/events';

export async function processSubscriptionWebhook(eventId: string) {
  if (!eventId || typeof eventId !== 'string') {
    throw new Error('Invalid event ID');
  }

  await connectDB();

  return await runInTransaction(async (session) => {
    // 1. Check if event is already processed (idempotency check)
    const existingEvent = await WebhookEvent.findOne({ eventId }).session(session || null);

    if (existingEvent) {
      return {
        success: true,
        duplicate: true,
        message: `Event ${eventId} has already been processed. Skipping quota reset to preserve idempotency.`,
      };
    }

    // 2. Create the webhook event log to lock it using .save()
    const webhookEvent = new WebhookEvent({
      eventId,
      processed: true,
    });
    await webhookEvent.save(session ? { session } : {});

    // 3. Reset quotas: set monthlyQuota of all providers to 10 and reset leadsReceivedCount to 0
    await Provider.updateMany(
      {},
      { $set: { monthlyQuota: 10, leadsReceivedCount: 0 } }
    ).session(session || null);

    // Trigger dashboard update
    setTimeout(() => {
      realtimeEmitter.emitUpdate('dashboard_update', {
        event: 'quota_reset',
        eventId,
        timestamp: new Date().toISOString(),
      });
    }, 50);

    return {
      success: true,
      duplicate: false,
      message: `Event ${eventId} processed successfully. All providers quotas reset to 10.`,
    };
  });
}
