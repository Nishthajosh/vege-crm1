import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.getUserByEmail(session.user.email!);
    
    if (!user || (user.role !== 'farmer' && user.role !== 'broker')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if vegetables already exist
    const existingVegetables = await db.getAllVegetables();
    if (existingVegetables.length > 0) {
      return NextResponse.json({ 
        message: 'Vegetables already initialized',
        count: existingVegetables.length 
      });
    }

    // Initialize default vegetables
    const defaultVegetables = [
      {
        name: 'Tomato',
        price: 45.50,
        quantity: 100,
        image: '/vegetables/tomato.svg',
        description: 'Fresh red tomatoes, perfect for salads and cooking',
      },
      {
        name: 'Potato',
        price: 30.00,
        quantity: 200,
        image: '/vegetables/potato.svg',
        description: 'Fresh potatoes, versatile for all kinds of dishes',
      },
      {
        name: 'Onion',
        price: 35.75,
        quantity: 150,
        image: '/vegetables/onion.svg',
        description: 'Fresh onions, essential for Indian cuisine',
      },
      {
        name: 'Carrot',
        price: 40.00,
        quantity: 120,
        image: '/vegetables/carrot.svg',
        description: 'Fresh carrots, rich in vitamins and minerals',
      },
      {
        name: 'Cabbage',
        price: 25.50,
        quantity: 80,
        image: '/vegetables/cabbage.svg',
        description: 'Fresh green cabbage, great for salads and stir-fry',
      },
      {
        name: 'Cucumber',
        price: 35.00,
        quantity: 100,
        image: '/vegetables/cucumber.svg',
        description: 'Fresh cucumbers, crisp and refreshing',
      },
    ];

    // Create all vegetables
    const createdVegetables = [];
    for (const veg of defaultVegetables) {
      const vegetable = await db.createVegetable({
        id: uuidv4(),
        name: veg.name,
        price: veg.price,
        quantity: veg.quantity,
        image: veg.image,
        description: veg.description,
      });
      createdVegetables.push(vegetable);
    }

    return NextResponse.json({ 
      message: 'Vegetables initialized successfully',
      count: createdVegetables.length,
      vegetables: createdVegetables
    });
  } catch (error) {
    console.error('Error initializing vegetables:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
