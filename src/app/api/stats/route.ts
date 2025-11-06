import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'broker') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const [totalFarmers, totalRetailers, totalOrders, totalVegetables] = await Promise.all([
      db.getUsersByRole('farmer'),
      db.getUsersByRole('retailer'),
      db.getTotalOrders(),
      db.getTotalVegetables(),
    ]);

    return NextResponse.json({
      totalFarmers,
      totalRetailers,
      totalOrders,
      totalVegetables,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
