import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createStandardRecommendSettingsOperations } from '@/lib/database-operations';
import { getSessionFromRequest } from '@/lib/edge-auth';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await createDatabaseAdapter();
    const settingsOperations = createStandardRecommendSettingsOperations(db);
    const settings = await settingsOperations.get();

    return NextResponse.json({
      success: true,
      data: settings || {
        vector_store_id: null,
        last_synced_at: null,
        last_sync_status: null,
      },
    });
  } catch (error) {
    console.error('Failed to get standard-recommend settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { vectorStoreId } = body;

    if (typeof vectorStoreId !== 'string' || !vectorStoreId.trim()) {
      return NextResponse.json(
        { success: false, error: 'vectorStoreId is required' },
        { status: 400 }
      );
    }

    const db = await createDatabaseAdapter();
    const settingsOperations = createStandardRecommendSettingsOperations(db);
    const updated = await settingsOperations.upsert({
      vector_store_id: vectorStoreId.trim(),
      last_synced_at: new Date().toISOString(),
      last_sync_status: 'completed',
    });

    return NextResponse.json({
      success: true,
      message: 'Vector Store ID가 저장되었습니다.',
      data: updated,
    });
  } catch (error) {
    console.error('Failed to save standard-recommend settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
