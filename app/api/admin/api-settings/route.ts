import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createAdminApiSettingsOperations } from '@/lib/database-operations';
import { getSessionFromRequest } from '@/lib/edge-auth';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await createDatabaseAdapter();
    const settingsOperations = createAdminApiSettingsOperations(db);
    const settings = await settingsOperations.get();

    return NextResponse.json({
      success: true,
      data: {
        openai_api_key: (settings?.openai_api_key as string | null) || null,
      },
    });
  } catch (error) {
    console.error('Failed to get admin api settings:', error);
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
    const { openaiApiKey } = body;

    if (typeof openaiApiKey !== 'string' || !openaiApiKey.trim()) {
      return NextResponse.json(
        { success: false, error: 'openaiApiKey is required' },
        { status: 400 }
      );
    }

    const db = await createDatabaseAdapter();
    const settingsOperations = createAdminApiSettingsOperations(db);
    const updated = await settingsOperations.upsert({ openai_api_key: openaiApiKey.trim() });

    return NextResponse.json({
      success: true,
      message: 'API 키가 저장되었습니다.',
      data: updated,
    });
  } catch (error) {
    console.error('Failed to save admin api settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
