import { NextResponse } from 'next/server';
import { organizationOperations } from '@/lib/database';

export async function DELETE(request: Request) {
  try {
    const urlParts = request.url.split('/');
    const idString = urlParts[urlParts.length - 1];
    const id = parseInt(idString, 10);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
    }

    const success = organizationOperations.delete(id);

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
