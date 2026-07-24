import Papa from 'papaparse';
import type { StandardRecommendSyncCache, StandardRecommendSyncJob } from '../types/standard-recommend';
import { SYNC_CACHE_TTL } from '../types/standard-recommend';

// NOTE: lib/database-adapter.ts는 최상단에서 @cloudflare/next-on-pages를 import하고,
// 그 패키지는 Next.js 전용 "server-only" 패키지를 require하기 때문에 이 독립 Worker
// 번들에서는 resolve가 안 된다. 그래서 이 파일은 D1 네이티브 바인딩을 직접 다룬다.
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<unknown>;
}
interface D1Database {
  prepare(sql: string): D1PreparedStatement;
}

interface ConsumerEnv {
  OPENAI_API_KEY?: string;
  STANDARD_SEARCH_CACHE: SyncCacheStore;
  MSP: D1Database;
}

interface QueueMessage<T> {
  body: T;
  ack(): void;
}

interface QueueBatch<T> {
  messages: QueueMessage<T>[];
}

interface SyncCacheStore {
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

async function saveSyncCache(kv: SyncCacheStore, cache: StandardRecommendSyncCache) {
  await kv.put(`sync:${cache.syncId}`, JSON.stringify(cache), { expirationTtl: SYNC_CACHE_TTL });
}

function toCsvExportUrl(sheetUrl: string): string {
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    throw new Error('올바른 구글 시트 링크가 아닙니다.');
  }
  return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
}

function formatRowAsText(row: Record<string, string>): string {
  return Object.entries(row)
    .filter(([key]) => key.trim().length > 0)
    .map(([key, value]) => `${key}: ${value ?? ''}`)
    .join('\n');
}

async function createVectorStore(apiKey: string, name: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/vector_stores', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    throw new Error(`Vector store 생성 실패: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

async function uploadFileToVectorStore(
  apiKey: string,
  vectorStoreId: string,
  fileName: string,
  content: string
): Promise<string> {
  const formData = new FormData();
  formData.append('file', new Blob([content], { type: 'text/plain' }), fileName);
  formData.append('purpose', 'assistants');

  const uploadRes = await fetch('https://api.openai.com/v1/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });
  if (!uploadRes.ok) {
    throw new Error(`파일 업로드 실패(${fileName}): ${uploadRes.status} ${await uploadRes.text()}`);
  }
  const uploaded = (await uploadRes.json()) as { id: string };

  const attachRes = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}/files`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_id: uploaded.id }),
  });
  if (!attachRes.ok) {
    throw new Error(`Vector store 파일 추가 실패(${fileName}): ${attachRes.status} ${await attachRes.text()}`);
  }

  return uploaded.id;
}

async function deleteVectorStore(apiKey: string, vectorStoreId: string): Promise<void> {
  const res = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    // 이전 스토어 정리 실패는 새 동기화 자체를 실패시키지 않는다 (다음 재동기화에서 다시 시도됨)
    console.error(`이전 vector store 삭제 실패(${vectorStoreId}): ${res.status} ${await res.text()}`);
  }
}

async function markSyncCompleted(db: D1Database, vectorStoreId: string, syncedAt: string) {
  await db
    .prepare(
      `UPDATE standard_recommend_settings
       SET vector_store_id = ?, last_synced_at = ?, last_sync_status = 'completed', updated_at = CURRENT_TIMESTAMP
       WHERE id = 1`
    )
    .bind(vectorStoreId, syncedAt)
    .run();
}

async function markSyncFailed(db: D1Database) {
  await db
    .prepare(
      `UPDATE standard_recommend_settings
       SET last_sync_status = 'failed', updated_at = CURRENT_TIMESTAMP
       WHERE id = 1`
    )
    .run();
}

// NOTE: 행마다 개별 INSERT라 대량 동기화 시 서브리퀘스트가 많이 소모됨.
// 감사용 보조 테이블이라 검색 경로에는 영향 없음 — 규모가 커지면 배치 INSERT로 전환 고려.
async function recordSyncedFiles(
  db: D1Database,
  vectorStoreId: string,
  files: { row_index: number; openai_file_id: string; title?: string }[]
) {
  const stmt = db.prepare(
    'INSERT INTO standard_recommend_sync_files (vector_store_id, row_index, openai_file_id, title) VALUES (?, ?, ?, ?)'
  );
  for (const file of files) {
    await stmt.bind(vectorStoreId, file.row_index, file.openai_file_id, file.title || null).run();
  }
}

async function deleteSyncedFilesRecord(db: D1Database, vectorStoreId: string) {
  await db.prepare('DELETE FROM standard_recommend_sync_files WHERE vector_store_id = ?').bind(vectorStoreId).run();
}

export default {
  async queue(batch: QueueBatch<StandardRecommendSyncJob>, env: ConsumerEnv) {
    for (const message of batch.messages) {
      const { syncId, sheetUrl, previousVectorStoreId } = message.body;
      let processedCount = 0;
      let totalCount = 0;

      try {
        if (!env.OPENAI_API_KEY) {
          throw new Error('OpenAI API key not available');
        }

        const csvUrl = toCsvExportUrl(sheetUrl);
        const csvRes = await fetch(csvUrl);
        if (!csvRes.ok) {
          throw new Error(`구글 시트를 불러오지 못했습니다: ${csvRes.status}`);
        }
        const csvText = await csvRes.text();

        const parsed = Papa.parse<Record<string, string>>(csvText, {
          header: true,
          skipEmptyLines: true,
        });
        const rows = parsed.data.filter((row) => Object.values(row).some((v) => (v ?? '').trim().length > 0));
        totalCount = rows.length;

        await saveSyncCache(env.STANDARD_SEARCH_CACHE, {
          syncId,
          status: 'running',
          processed: 0,
          total: rows.length,
          createdAt: message.body.createdAt,
        });

        const vectorStoreId = await createVectorStore(env.OPENAI_API_KEY, `standard-recommend-${Date.now()}`);

        const syncedFiles: { row_index: number; openai_file_id: string; title?: string }[] = [];
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const text = formatRowAsText(row);
          const firstValue = Object.values(row).find((v) => (v ?? '').trim().length > 0) || `row-${i + 1}`;
          const fileId = await uploadFileToVectorStore(env.OPENAI_API_KEY, vectorStoreId, `standard-${i + 1}.txt`, text);
          syncedFiles.push({ row_index: i + 1, openai_file_id: fileId, title: firstValue.slice(0, 200) });
          processedCount = i + 1;

          await saveSyncCache(env.STANDARD_SEARCH_CACHE, {
            syncId,
            status: 'running',
            processed: processedCount,
            total: rows.length,
            createdAt: message.body.createdAt,
          });
        }

        await markSyncCompleted(env.MSP, vectorStoreId, new Date().toISOString());
        await recordSyncedFiles(env.MSP, vectorStoreId, syncedFiles);

        if (previousVectorStoreId) {
          await deleteVectorStore(env.OPENAI_API_KEY, previousVectorStoreId);
          await deleteSyncedFilesRecord(env.MSP, previousVectorStoreId);
        }

        await saveSyncCache(env.STANDARD_SEARCH_CACHE, {
          syncId,
          status: 'completed',
          processed: rows.length,
          total: rows.length,
          createdAt: message.body.createdAt,
          completedAt: Date.now(),
        });

        message.ack();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
        console.error('Standard-recommend sync failed:', errorMessage);

        try {
          await markSyncFailed(env.MSP);
        } catch (dbError) {
          console.error('Failed to record sync failure in D1:', dbError);
        }

        await saveSyncCache(env.STANDARD_SEARCH_CACHE, {
          syncId,
          status: 'failed',
          processed: processedCount,
          total: totalCount,
          error: errorMessage,
          createdAt: message.body.createdAt,
          completedAt: Date.now(),
        });

        message.ack();
      }
    }
  },
};
