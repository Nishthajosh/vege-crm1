import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const auction = await db.getAuctionById(params.id);
    
    if (!auction) {
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(auction);
  } catch (error) {
    console.error('Error fetching auction:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auction' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = session.user as any;
    if (user.role !== 'retailer') {
      return NextResponse.json(
        { error: 'Only retailers can place bids' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const auction = await db.getAuctionById(params.id);
    
    if (!auction) {
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      );
    }

    // Check if auction is active
    if (auction.status !== 'active') {
      return NextResponse.json(
        { error: 'Auction is not active' },
        { status: 400 }
      );
    }

    // Check if auction has ended
    const now = Math.floor(Date.now() / 1000);
    if (auction.endTime <= now) {
      return NextResponse.json(
        { error: 'Auction has ended' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid bid amount' },
        { status: 400 }
      );
    }

    const bidAmount = parseFloat(amount);

    // Check if bid is higher than current bid or base price
    const minimumBid = auction.currentBid 
      ? auction.currentBid + 10 // Minimum increment of ₹10
      : auction.basePrice;

    if (bidAmount < minimumBid) {
      return NextResponse.json(
        { error: `Bid must be at least ₹${minimumBid}` },
        { status: 400 }
      );
    }

    // Create bid
    const bidId = `bid_${randomBytes(16).toString('hex')}`;
    const bid = await db.createBid({
      id: bidId,
      auctionId: params.id,
      bidderId: user.id,
      amount: bidAmount,
    });

    // Update auction with new highest bid
    await db.updateAuction(params.id, {
      currentBid: bidAmount,
      highestBidderId: user.id,
    });

    const updatedAuction = await db.getAuctionById(params.id);

    return NextResponse.json({
      bid,
      auction: updatedAuction,
    }, { status: 201 });
  } catch (error) {
    console.error('Error placing bid:', error);
    return NextResponse.json(
      { error: 'Failed to place bid' },
      { status: 500 }
    );
  }
}
