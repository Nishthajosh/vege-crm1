import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const order = await db.getOrderById(params.id);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    // Check authorization
    if (userRole !== 'broker' && order.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const orderItems = await db.getOrderItemsByOrderId(params.id);

    // Get vegetable details for each order item
    const itemsWithVegetables = await Promise.all(
      orderItems.map(async (item) => {
        const vegetable = await db.getVegetableById(item.vegetableId);
        return {
          ...item,
          vegetable: vegetable || null,
        };
      })
    );

    return NextResponse.json({
      ...order,
      items: itemsWithVegetables,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
