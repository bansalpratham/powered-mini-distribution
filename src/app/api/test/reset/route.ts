import { NextResponse } from 'next/server';
import { resetDatabase } from '@/lib/seed';

export async function POST() {
  try {
    const result = await resetDatabase();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error resetting database:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reset database' },
      { status: 500 }
    );
  }
}
