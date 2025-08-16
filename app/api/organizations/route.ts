import { NextResponse } from 'next/server';
import { organizationOperations } from '@/lib/database';

// GET all organizations
export async function GET() {
  try {
    const organizations = organizationOperations.getAll();
    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
    return NextResponse.json({ message: 'Failed to fetch organizations' }, { status: 500 });
  }
}

// POST a new organization
export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ message: 'Organization name is required' }, { status: 400 });
    }

    const newOrganization = organizationOperations.create({ name });
    return NextResponse.json(newOrganization, { status: 201 });
  } catch (error) {
    console.error('Failed to create organization:', error);
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        return NextResponse.json({ message: 'Organization name already exists' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to create organization' }, { status: 500 });
  }
}
