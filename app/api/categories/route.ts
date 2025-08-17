import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createCategoryOperations } from '@/lib/database-operations';

// GET all categories
export async function GET(request: NextRequest, { env }: { env: any }) {
  try {
    const db = createDatabaseAdapter(env);
    const categoryOperations = createCategoryOperations(db);
    const categories = await categoryOperations.getAll();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json({ message: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST a new category
export async function POST(request: NextRequest, { env }: { env: any }) {
  try {
    const db = createDatabaseAdapter(env);
    const categoryOperations = createCategoryOperations(db);
    const { name, description } = await request.json();
    if (!name) {
      return NextResponse.json({ message: 'Category name is required' }, { status: 400 });
    }

    const newCategory = await categoryOperations.create({ name, description });
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Failed to create category:', error);
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        return NextResponse.json({ message: 'Category name already exists' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to create category' }, { status: 500 });
  }
}