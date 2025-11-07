import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
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

    const userRole = (session.user as any).role;

    // Different stats for different roles
    if (userRole === 'farmer') {
      // Farmer stats: vegetables, revenue, orders, top demand
      const vegetables = await db.getAllVegetables();
      const orders = await db.getAllOrders();
      
      // Calculate revenue from completed orders
      const completedOrders = orders.filter(order => order.status === 'completed');
      const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalPrice, 0);
      
      // Find top demand vegetable from orders
      const vegetableDemand: Record<string, number> = {};
      for (const order of orders) {
        const items = await db.getOrderItems(order.id);
        for (const item of items) {
          const veg = await db.getVegetableById(item.vegetableId);
          if (veg) {
            vegetableDemand[veg.name] = (vegetableDemand[veg.name] || 0) + item.quantity;
          }
        }
      }
      
      const topDemand = Object.entries(vegetableDemand).length > 0
        ? Object.entries(vegetableDemand).sort((a, b) => b[1] - a[1])[0][0]
        : 'N/A';

      return NextResponse.json({
        totalVegetables: vegetables.length,
        totalRevenue,
        totalOrders: orders.length,
        topDemand,
      });
    } else if (userRole === 'retailer') {
      // Retailer stats: cart items, orders, spent, available vegetables
      const user = await db.getUserByEmail(session.user.email!);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      const vegetables = await db.getAllVegetables();
      const orders = await db.getOrdersByUserId(user.id);
      
      const totalSpent = orders.reduce((sum, order) => sum + order.totalPrice, 0);

      return NextResponse.json({
        cartItems: 0, // Cart is stored in localStorage
        totalOrders: orders.length,
        totalSpent,
        availableVegetables: vegetables.length,
      });
    } else if (userRole === 'broker') {
      // Broker stats: farmers, retailers, orders, vegetables
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
    }

    return NextResponse.json(
      { error: 'Invalid role' },
      { status: 403 }
    );
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
