import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Provider from '@/models/Provider';
import { seedDatabase } from '@/lib/seed';

export async function GET() {
  try {
    await connectDB();
    
    // Automatically seed database if empty
    const providerCount = await Provider.countDocuments();
    if (providerCount === 0) {
      await seedDatabase();
    }

    const providers = await Provider.find({}).sort({ name: 1 });
    return NextResponse.json(providers);
  } catch (error: any) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}
