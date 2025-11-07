import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const vegetable = await db.getVegetableById(params.id);
    
    if (!vegetable) {
      return NextResponse.json(
        { error: 'Vegetable not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(vegetable);
  } catch (error) {
    console.error('Error fetching vegetable:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vegetable' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['broker', 'farmer'].includes((session.user as any).role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const body = await request.json();
    const { name, price, quantity, image, description } = body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (price !== undefined) updates.price = parseFloat(price);
    if (quantity !== undefined) updates.quantity = parseFloat(quantity);
    if (image !== undefined) updates.image = image;
    if (description !== undefined) updates.description = description;

    const vegetable = await db.updateVegetable(params.id, updates);
    return NextResponse.json(vegetable);
  } catch (error) {
    console.error('Error updating vegetable:', error);
    return NextResponse.json(
      { error: 'Failed to update vegetable' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['broker', 'farmer'].includes((session.user as any).role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const params = await context.params;
    await db.deleteVegetable(params.id);
    return NextResponse.json({ message: 'Vegetable deleted successfully' });
  } catch (error) {
    console.error('Error deleting vegetable:', error);
    return NextResponse.json(
      { error: 'Failed to delete vegetable' },
      { status: 500 }
    );
  }
}
