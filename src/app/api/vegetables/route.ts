import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

export async function GET() {
  try {
    const vegetables = await db.getAllVegetables();
    return NextResponse.json(vegetables);
  } catch (error) {
    console.error('Error fetching vegetables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vegetables' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'broker') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, price, image, description } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      );
    }

    const vegetableId = `veg_${randomBytes(16).toString('hex')}`;
    
    const vegetable = await db.createVegetable({
      id: vegetableId,
      name,
      price: parseFloat(price),
      image: image || null,
      description: description || null,
    });

    return NextResponse.json(vegetable, { status: 201 });
  } catch (error) {
    console.error('Error creating vegetable:', error);
    return NextResponse.json(
      { error: 'Failed to create vegetable' },
      { status: 500 }
    );
  }
}
