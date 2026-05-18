import mongoose from 'mongoose';

export async function runInTransaction<T>(
  fn: (session: mongoose.ClientSession | null) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error: any) {
    // If the MongoDB deployment does not support transactions (e.g., standalone local instance)
    if (
      error.message &&
      (error.message.includes('Replica Set member') ||
        error.message.includes('Transaction numbers are only allowed') ||
        error.message.includes('does not support transactions'))
    ) {
      console.warn(
        '⚠️ MongoDB environment does not support replica set transactions. Falling back to non-transactional execution. Concurrency guarantees are limited to atomic database updates.'
      );
      // Abort and end session
      try {
        await session.abortTransaction();
      } catch (e) {
        // ignore
      }
      await session.endSession();

      // Run without transaction session
      return await fn(null);
    }

    // Otherwise, abort and throw actual error
    await session.abortTransaction();
    throw error;
  } finally {
    if (!session.hasEnded) {
      await session.endSession();
    }
  }
}
