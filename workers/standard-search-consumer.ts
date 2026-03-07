import { performAISearch } from '../lib/standard-search-ai';
import type { SearchCache, StandardSearchJob } from '../types/standard-search';
import { SEARCH_CACHE_TTL } from '../types/standard-search';

interface ConsumerEnv {
  OPENAI_API_KEY?: string;
  STANDARD_SEARCH_CACHE: SearchCacheStore;
}

interface QueueMessage<T> {
  body: T;
  ack(): void;
}

interface QueueBatch<T> {
  messages: QueueMessage<T>[];
}

interface SearchCacheStore {
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

async function saveSearchCache(kv: SearchCacheStore, cache: SearchCache) {
  await kv.put(`search:${cache.searchId}`, JSON.stringify(cache), {
    expirationTtl: SEARCH_CACHE_TTL
  });
}

export default {
  async queue(batch: QueueBatch<StandardSearchJob>, env: ConsumerEnv) {
    for (const message of batch.messages) {
      const { searchId, query, contextData, createdAt } = message.body;

      try {
        if (!env.OPENAI_API_KEY) {
          throw new Error('OpenAI API key not available');
        }

        const results = await performAISearch(query, contextData, env.OPENAI_API_KEY);

        await saveSearchCache(env.STANDARD_SEARCH_CACHE, {
          searchId,
          query,
          status: 'completed',
          results,
          createdAt,
          completedAt: Date.now()
        });

        message.ack();
      } catch (error) {
        await saveSearchCache(env.STANDARD_SEARCH_CACHE, {
          searchId,
          query,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown queue error',
          createdAt,
          completedAt: Date.now()
        });

        message.ack();
      }
    }
  }
};
