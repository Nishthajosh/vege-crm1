import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'broker') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const body = await request.json();
    const { name, price, image, description } = body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (price !== undefined) updates.price = parseFloat(price);
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
    if (!session?.user || (session.user as any).role !== 'broker') {
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
