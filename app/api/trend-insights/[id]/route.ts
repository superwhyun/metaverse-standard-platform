import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createTrendInsightOperations } from '@/lib/database-operations';
import { getSessionFromRequest } from '@/lib/edge-auth';

export const runtime = 'edge';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await getSessionFromRequest(request);
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json({ success: false, error: '관리자 권한이 필요합니다.' }, { status: 401 });
        }

        const db = await createDatabaseAdapter();
        const operations = createTrendInsightOperations(db);
        const insightId = parseInt(id, 10);

        if (isNaN(insightId)) {
            return NextResponse.json({ success: false, error: 'Invalid insight ID' }, { status: 400 });
        }

        // Before deleting metadata, we could delete files from R2 as well, 
        // but let's keep it simple for now as requested.

        const success = await operations.delete(insightId);
        if (!success) {
            return NextResponse.json({ success: false, error: 'Failed to delete insight' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Failed to delete trend insight:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete insight' }, { status: 500 });
    }
}
