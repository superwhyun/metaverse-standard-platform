export interface StandardRecommendSyncJob {
  syncId: string;
  sheetUrl: string;
  previousVectorStoreId?: string | null;
  createdAt: number;
}

export interface StandardRecommendSyncCache {
  syncId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  processed: number;
  total: number;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

export const SYNC_CACHE_TTL = 3600; // seconds
