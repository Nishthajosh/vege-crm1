import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = session.user as any;
    
    if (user.role === 'farmer') {
      const auctions = await db.getAuctionsByFarmer(user.id);
      return NextResponse.json(auctions);
    } else if (user.role === 'retailer') {
      const bids = await db.getBidsByBidder(user.id);
      return NextResponse.json(bids);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching user auctions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auctions' },
      { status: 500 }
    );
  }
}
