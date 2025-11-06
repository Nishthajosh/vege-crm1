import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userRole = (session.user as any).role;
    
    if (userRole === 'broker') {
      // Broker can see all orders
      const orders = await db.getAllOrders();
      return NextResponse.json(orders);
    } else if (userRole === 'retailer') {
      // Retailer can only see their own orders
      const userId = (session.user as any).id;
      const orders = await db.getOrdersByUserId(userId);
      return NextResponse.json(orders);
    }

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'retailer') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { date, name, quantity, totalPrice, items } = body;

    if (!date || !name || !quantity || !totalPrice || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;
    const orderId = `order_${randomBytes(16).toString('hex')}`;
    
    const order = await db.createOrder({
      id: orderId,
      userId,
      date,
      name,
      quantity: parseInt(quantity),
      totalPrice: parseFloat(totalPrice),
      status: 'pending',
    });

    // Create order items
    for (const item of items) {
      const itemId = `item_${randomBytes(16).toString('hex')}`;
      await db.createOrderItem({
        id: itemId,
        orderId,
        vegetableId: item.vegetableId,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price),
      });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
