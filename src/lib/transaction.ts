import mongoose from 'mongoose';

export async function runInTransaction<T>(
  fn: (session: mongoose.ClientSession | null) => Promise<T>
): Promise<T> {
  const maxRetries = 6;
  let attempt = 0;

  while (true) {
    attempt++;
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const result = await fn(session);
      await session.commitTransaction();
      return result;
    } catch (error: any) {
      // Abort the active transaction
      try {
        await session.abortTransaction();
      } catch (e) {
        // ignore
      }

      // 1. Fallback for non-replica set local MongoDB instances
      if (
        error.message &&
        (error.message.includes('Replica Set member') ||
          error.message.includes('Transaction numbers are only allowed') ||
          error.message.includes('does not support transactions'))
      ) {
        console.warn(
          '⚠️ MongoDB environment does not support replica set transactions. Falling back to non-transactional execution. Concurrency guarantees are limited to atomic database updates.'
        );
        await session.endSession();
        return await fn(null);
      }

      // 2. Retry on Write Conflict / Transient Transaction Error
      const isTransient =
        (error.hasErrorLabel && error.hasErrorLabel('TransientTransactionError')) ||
        (error.message &&
          (error.message.includes('WriteConflict') ||
            error.message.includes('Write conflict') ||
            error.message.includes('plan execution and yielding is disabled')));

      if (isTransient && attempt < maxRetries) {
        console.warn(
          `⚠️ Concurrency Write Conflict detected on attempt ${attempt}/${maxRetries}. Retrying transaction after randomized backoff...`
        );
        await session.endSession();
        // Add a randomized delay (jitter backoff) to allow the competing transaction to release its lock
        const delay = Math.floor(Math.random() * 80) + 30; // 30ms to 110ms delay
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // 3. Otherwise, throw the actual error to the client
      await session.endSession();
      throw error;
    } finally {
      if (!session.hasEnded) {
        await session.endSession();
      }
    }
  }
}
