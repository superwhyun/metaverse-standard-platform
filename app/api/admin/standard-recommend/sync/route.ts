import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createStandardRecommendSettingsOperations } from '@/lib/database-operations';
import { getSessionFromRequest } from '@/lib/edge-auth';
import type { StandardRecommendSyncCache, StandardRecommendSyncJob } from '@/types/standard-recommend';
import { SYNC_CACHE_TTL } from '@/types/standard-recommend';

export const runtime = 'edge';

interface SyncQueue {
  send(message: StandardRecommendSyncJob): Promise<void>;
}

interface SyncCacheStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

function getKVNamespace(): SyncCacheStore | null {
  try {
    const { env } = getRequestContext();
    return (env as any).STANDARD_SEARCH_CACHE || null;
  } catch (error) {
    console.error('Failed to get KV namespace:', error);
    return null;
  }
}

function getQueueBinding(): SyncQueue | null {
  try {
    const { env } = getRequestContext();
    return (env as any).STANDARD_RECOMMEND_SYNC_QUEUE || null;
  } catch (error) {
    console.error('Failed to get queue binding:', error);
    return null;
  }
}

function generateSyncId(): string {
  return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function saveSyncCache(kv: SyncCacheStore, cache: StandardRecommendSyncCache) {
  await kv.put(`sync:${cache.syncId}`, JSON.stringify(cache), {
    expirationTtl: SYNC_CACHE_TTL,
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await createDatabaseAdapter();
    const settingsOperations = createStandardRecommendSettingsOperations(db);
    const settings = await settingsOperations.get();

    if (!settings?.sheet_url) {
      return NextResponse.json(
        { success: false, error: '먼저 구글 시트 링크를 저장해주세요.' },
        { status: 400 }
      );
    }

    const kv = getKVNamespace();
    const queue = getQueueBinding();

    if (!kv || !queue) {
      return NextResponse.json(
        { success: false, error: 'KV 또는 Queue 바인딩을 사용할 수 없습니다. (로컬 cf:dev 환경인지 확인)' },
        { status: 500 }
      );
    }

    const syncId = generateSyncId();
    const initialCache: StandardRecommendSyncCache = {
      syncId,
      status: 'pending',
      processed: 0,
      total: 0,
      createdAt: Date.now(),
    };
    await saveSyncCache(kv, initialCache);

    await queue.send({
      syncId,
      sheetUrl: settings.sheet_url as string,
      previousVectorStoreId: (settings.vector_store_id as string | null) || null,
      createdAt: Date.now(),
    });

    return NextResponse.json(
      { success: true, syncId, status: 'pending', message: '동기화를 시작했습니다.' },
      { status: 202 }
    );
  } catch (error) {
    console.error('Failed to start standard-recommend sync:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start sync' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const syncId = searchParams.get('syncId');
    if (!syncId) {
      return NextResponse.json({ success: false, error: 'syncId is required' }, { status: 400 });
    }

    const kv = getKVNamespace();
    if (!kv) {
      return NextResponse.json({ success: false, error: 'KV namespace not available' }, { status: 500 });
    }

    const cacheData = await kv.get(`sync:${syncId}`);
    if (!cacheData) {
      return NextResponse.json({ success: false, error: 'Sync not found or expired' }, { status: 404 });
    }

    const cache: StandardRecommendSyncCache = JSON.parse(cacheData);
    return NextResponse.json({ success: true, ...cache });
  } catch (error) {
    console.error('Failed to get sync status:', error);
    return NextResponse.json({ success: false, error: 'Failed to get sync status' }, { status: 500 });
  }
}
