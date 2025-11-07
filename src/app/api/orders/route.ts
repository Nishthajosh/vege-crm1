import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await db.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userRole = user.role;
    
    if (userRole === 'broker' || userRole === 'farmer') {
      // Broker and Farmer can see all orders
      const orders = await db.getAllOrders();
      
      // Get order items and populate with vegetable and retailer info
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const items = await db.getOrderItemsByOrderId(order.id);
          
          // Get retailer info
          const retailer = await db.getUserById(order.retailerId || order.userId);
          
          // Populate items with vegetable details
          const populatedItems = await Promise.all(
            items.map(async (item: any) => {
              const vegetable = await db.getVegetableById(item.vegetableId);
              return {
                ...item,
                vegetable: vegetable ? {
                  id: vegetable.id,
                  name: vegetable.name,
                  unit: vegetable.unit,
                } : null,
              };
            })
          );
          
          return {
            ...order,
            retailer: retailer ? {
              name: retailer.name,
              email: retailer.email,
            } : null,
            items: populatedItems,
          };
        })
      );
      
      return NextResponse.json({ orders: ordersWithItems });
    } else if (userRole === 'retailer') {
      // Retailer can only see their own orders
      const userId = user.id;
      const orders = await db.getOrdersByUserId(userId);
      
      // Get order items and populate with vegetable info
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const items = await db.getOrderItemsByOrderId(order.id);
          
          // Populate items with vegetable details
          const populatedItems = await Promise.all(
            items.map(async (item: any) => {
              const vegetable = await db.getVegetableById(item.vegetableId);
              return {
                ...item,
                vegetable: vegetable ? {
                  id: vegetable.id,
                  name: vegetable.name,
                  unit: vegetable.unit,
                } : null,
              };
            })
          );
          
          return {
            ...order,
            items: populatedItems,
          };
        })
      );
      
      return NextResponse.json({ orders: ordersWithItems });
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
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database to ensure we have the role and ID
    const user = await db.getUserByEmail(session.user.email);
    if (!user || user.role !== 'retailer') {
      return NextResponse.json(
        { error: 'Unauthorized - Only retailers can create orders' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { date, name, quantity, totalPrice, items } = body;

    console.log('Order creation request:', { date, name, quantity, totalPrice, items });

    if (!date || !name || !quantity || !totalPrice || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const userId = user.id;
    const orderId = `order_${randomBytes(16).toString('hex')}`;
    
    console.log('Creating order with ID:', orderId, 'for user:', userId);
    
    const order = await db.createOrder({
      id: orderId,
      userId,
      date,
      name,
      quantity: parseInt(quantity),
      totalPrice: parseFloat(totalPrice),
      status: 'pending',
    });

    console.log('Order created:', order);

    // Create order items
    for (const item of items) {
      const itemId = `item_${randomBytes(16).toString('hex')}`;
      console.log('Creating order item:', itemId, item);
      await db.createOrderItem({
        id: itemId,
        orderId,
        vegetableId: item.vegetableId,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price),
      });
    }

    console.log('Order completed successfully');
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
