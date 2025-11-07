import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const auctions = await db.getActiveAuctions();
    return NextResponse.json(auctions);
  } catch (error) {
    console.error('Error fetching active auctions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active auctions' },
      { status: 500 }
    );
  }
}
