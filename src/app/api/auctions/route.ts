import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

export async function GET() {
  try {
    const auctions = await db.getAllAuctions();
    return NextResponse.json(auctions);
  } catch (error) {
    console.error('Error fetching auctions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auctions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = session.user as any;
    if (user.role !== 'farmer') {
      return NextResponse.json(
        { error: 'Only farmers can create auctions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { vegetableId, quantity, basePrice, endTime } = body;

    // Validation
    if (!vegetableId || !quantity || !basePrice || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      );
    }

    if (basePrice <= 0) {
      return NextResponse.json(
        { error: 'Base price must be greater than 0' },
        { status: 400 }
      );
    }

    const endTimeTimestamp = Math.floor(new Date(endTime).getTime() / 1000);
    const startTimeTimestamp = Math.floor(Date.now() / 1000);

    if (endTimeTimestamp <= startTimeTimestamp) {
      return NextResponse.json(
        { error: 'End time must be in the future' },
        { status: 400 }
      );
    }

    // Verify vegetable exists
    const vegetable = await db.getVegetableById(vegetableId);
    if (!vegetable) {
      return NextResponse.json(
        { error: 'Vegetable not found' },
        { status: 404 }
      );
    }

    const auctionId = `auction_${randomBytes(16).toString('hex')}`;
    
    const auction = await db.createAuction({
      id: auctionId,
      farmerId: user.id,
      vegetableId,
      quantity: parseFloat(quantity),
      basePrice: parseFloat(basePrice),
      startTime: startTimeTimestamp,
      endTime: endTimeTimestamp,
    });

    return NextResponse.json(auction, { status: 201 });
  } catch (error) {
    console.error('Error creating auction:', error);
    return NextResponse.json(
      { error: 'Failed to create auction' },
      { status: 500 }
    );
  }
}
