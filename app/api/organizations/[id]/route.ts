import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createOrganizationOperations } from '@/lib/database-operations';
import { getSessionFromRequest } from '@/lib/edge-auth';

export const runtime = 'edge';

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ message: '관리자 권한이 필요합니다.' }, { status: 401 });
    }

    const db = await createDatabaseAdapter();
    const organizationOperations = createOrganizationOperations(db);
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
    }

    const success = await organizationOperations.delete(id);

    if (success) {
      return NextResponse.json({ message: 'Organization deleted successfully' }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Organization not found or could not be deleted' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Failed to delete organization with id ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete organization' }, { status: 500 });
  }
}