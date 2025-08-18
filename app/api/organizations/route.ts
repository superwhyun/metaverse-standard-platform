import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createOrganizationOperations } from '@/lib/database-operations';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET all organizations
export async function GET(request: NextRequest) {
  try {
    const db = await createDatabaseAdapter();
    const organizationOperations = createOrganizationOperations(db);
    const organizations = await organizationOperations.getAll();
    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
    return NextResponse.json({ message: 'Failed to fetch organizations' }, { status: 500 });
  }
}

// POST a new organization
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ message: '관리자 권한이 필요합니다.' }, { status: 401 });
    }

    const db = await createDatabaseAdapter();
    const organizationOperations = createOrganizationOperations(db);
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ message: 'Organization name is required' }, { status: 400 });
    }

    const newOrganization = await organizationOperations.create({ name });
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