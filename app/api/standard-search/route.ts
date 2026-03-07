import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createReportOperations, createConferenceOperations } from '@/lib/database-operations';
import { performAISearch } from '@/lib/standard-search-ai';
import { getRequestContext } from '@cloudflare/next-on-pages';
import type { SearchCache, StandardSearchContext, StandardSearchJob } from '@/types/standard-search';
import { SEARCH_CACHE_TTL } from '@/types/standard-search';

// Cloudflare KV 타입 임포트
/// <reference types="@cloudflare/workers-types" />

export const runtime = 'edge';

interface StandardSearchQueue {
  send(message: StandardSearchJob): Promise<void>;
}

interface SearchCacheStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

// KV 접근 헬퍼
function getKVNamespace(): SearchCacheStore | null {
  try {
    const { env } = getRequestContext();
    return env.STANDARD_SEARCH_CACHE || null;
  } catch (error) {
    console.error('Failed to get KV namespace:', error);
    return null;
  }
}

function getQueueBinding(): StandardSearchQueue | null {
  try {
    const { env } = getRequestContext();
    return env.STANDARD_SEARCH_QUEUE || null;
  } catch (error) {
    console.error('Failed to get queue binding:', error);
    return null;
  }
}

// Cloudflare Pages/Workers 환경 호환을 위한 환경변수 접근 헬퍼
function getEnv(name: string): string | undefined {
  // Next.js Edge 런타임에서는 process.env가 없을 수 있음
  // 일부 배포 환경에서는 globalThis 혹은 __env__에 바인딩됨
  // 가능한 모든 위치를 점검
  // @ts-ignore
  return (typeof process !== 'undefined' && process?.env?.[name])
    // @ts-ignore
    || (globalThis as any)?.[name]
    // @ts-ignore
    || (globalThis as any)?.__env__?.[name];
}

// POST AI 표준 검색
export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    if (!query || !query.trim()) {
      return NextResponse.json({ message: 'Query is required' }, { status: 400 });
    }

    const normalizedQuery = query.trim();
    const kv = getKVNamespace();
    const queue = getQueueBinding();

    if (kv && queue) {
      const searchId = generateSearchId();
      const contextData = await collectRelevantData(normalizedQuery);
      const initialCache: SearchCache = {
        searchId,
        query: normalizedQuery,
        status: 'pending',
        createdAt: Date.now()
      };

      await saveSearchCache(kv, initialCache);

      try {
        await queue.send({
          searchId,
          query: normalizedQuery,
          contextData,
          createdAt: Date.now()
        });

        return NextResponse.json({
          searchId,
          status: 'pending',
          message: 'AI가 관련 표준을 검색하고 있습니다...',
          results: []
        }, { status: 202 });
      } catch (error) {
        console.warn('Queue send failed, falling back to waitUntil/sync:', error);
        await processStandardSearchInBackground(searchId, normalizedQuery, contextData);

        const cacheData = await kv.get(`search:${searchId}`);
        if (cacheData) {
          const searchCache: SearchCache = JSON.parse(cacheData);
          return NextResponse.json({
            searchId: searchCache.searchId,
            status: searchCache.status,
            results: searchCache.results || [],
            error: searchCache.error,
            query: searchCache.query
          }, { status: searchCache.status === 'completed' ? 200 : 500 });
        }
      }
    }

    // Cloudflare next-on-pages의 request context에서 waitUntil 지원 여부 판단
    let supportsWaitUntil = false;
    let waitUntilFn: undefined | ((p: Promise<any>) => void);
    try {
      // next-on-pages의 타입 정의에서는 waitUntil이 RequestContext의 최상위가 아니라 ctx(ExecutionContext)에 존재함
      const rc: any = getRequestContext();
      const ctx = rc?.ctx;
      if (ctx && typeof ctx.waitUntil === 'function') {
        supportsWaitUntil = true;
        waitUntilFn = ctx.waitUntil.bind(ctx);
      }
    } catch (_) {
      supportsWaitUntil = false;
    }

    if (!supportsWaitUntil) {
      // 미지원: 동기 처리로 즉시 완료까지 수행
      console.log('No requestContext.waitUntil: processing search synchronously');
      return await processStandardSearchSynchronously(normalizedQuery);
    }

    // 지원: 임시 검색 ID 생성 후 백그라운드 처리
    console.log('requestContext.waitUntil detected: scheduling background search');
    const searchId = generateSearchId();
    
    // KV에 초기 상태 저장
    if (kv) {
      const initialCache: SearchCache = {
        searchId,
        query: normalizedQuery,
        status: 'pending',
        createdAt: Date.now()
      };

      await saveSearchCache(kv, initialCache);
    }
    
    // 임시 결과로 즉시 응답 (pending 상태)
    const pendingResult = {
      searchId,
      status: 'pending',
      message: 'AI가 관련 표준을 검색하고 있습니다...',
      results: []
    };

    if (waitUntilFn) {
        try {
        waitUntilFn(processStandardSearchInBackground(searchId, normalizedQuery));
      } catch (e) {
        console.warn('waitUntil enqueue failed, falling back to direct Promise:', e);
        processStandardSearchInBackground(searchId, normalizedQuery).catch(err => {
          console.error('Background search failed:', err);
        });
      }
    }

    return NextResponse.json(pendingResult, { status: 202 });
  } catch (error) {
    console.error('Unexpected error in standard-search POST:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ 
      message: `예상치 못한 서버 오류: ${errorMessage}` 
    }, { status: 500 });
  }
}

// GET 검색 결과 조회 (searchId로 백그라운드 작업 결과 확인)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchId = searchParams.get('searchId');
    
    if (!searchId) {
      return NextResponse.json({ message: 'searchId is required' }, { status: 400 });
    }

    // 스트리밍 모드: stream=1 이면 KV를 폴링하며 SSE로 진행상황 전송
    const streamFlag = searchParams.get('stream');
    if (streamFlag === '1') {
      const kvForStream = getKVNamespace();
      if (!kvForStream) {
        return new NextResponse('KV namespace not available for streaming', { status: 500 });
      }
      return streamSearchViaSSE(kvForStream, searchId);
    }

    const kv = getKVNamespace();
    if (!kv) {
      return NextResponse.json({ message: 'KV namespace not available' }, { status: 500 });
    }

    // KV에서 검색 결과 조회
    const cacheData = await kv.get(`search:${searchId}`);
    if (!cacheData) {
      return NextResponse.json({ message: 'Search not found or expired' }, { status: 404 });
    }

    const searchCache: SearchCache = JSON.parse(cacheData);
    
    // 응답 형식 통일
    return NextResponse.json({
      searchId: searchCache.searchId,
      status: searchCache.status,
      results: searchCache.results || [],
      error: searchCache.error,
      query: searchCache.query
    });
  } catch (error) {
    console.error('Failed to get search results:', error);
    return NextResponse.json({ message: 'Failed to get search results' }, { status: 500 });
  }
}

// 동기 처리 함수
async function processStandardSearchSynchronously(query: string, contextData?: StandardSearchContext) {
  try {
    const OPENAI_API_KEY = getEnv('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not available');
      return NextResponse.json({ 
        message: 'OpenAI API 키가 설정되지 않았습니다. 관리자에게 문의해주세요.' 
      }, { status: 500 });
    }

    console.log(`Synchronous standard search for query: ${query}`);

    // 기존 데이터베이스에서 관련 정보 수집
    const searchContext = contextData || await collectRelevantData(query);

    // GPT-5로 표준 검색 수행
    const searchResults = await performAISearch(query, searchContext, OPENAI_API_KEY);

    console.log(`Synchronous search completed with ${searchResults.length} results`);
    
    return NextResponse.json({
      status: 'completed',
      results: searchResults,
      message: `${searchResults.length}개의 관련 표준을 찾았습니다.`
    }, { status: 200 });

  } catch (error) {
    console.error('Synchronous search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      message: `처리 중 오류 발생: ${errorMessage}` 
    }, { status: 500 });
  }
}

// 백그라운드 처리 함수
async function processStandardSearchInBackground(searchId: string, query: string, contextData?: StandardSearchContext) {
  const kv = getKVNamespace();
  
  try {
    const OPENAI_API_KEY = getEnv('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not available for background search');
      // KV에 에러 상태 저장
      if (kv) {
        const errorCache: SearchCache = {
          searchId,
          query,
          status: 'failed',
          error: 'OpenAI API key not available',
          createdAt: Date.now(),
          completedAt: Date.now()
        };
        await saveSearchCache(kv, errorCache);
      }
      return;
    }

    console.log(`Background standard search for ID: ${searchId}, query: ${query}`);

    // 기존 데이터베이스에서 관련 정보 수집
    const searchContext = contextData || await collectRelevantData(query);

    // GPT-5로 표준 검색 수행
    const searchResults = await performAISearch(query, searchContext, OPENAI_API_KEY);

    console.log(`Background search completed for ${searchId} with ${searchResults.length} results`);

    // KV에 완료된 결과 저장
    if (kv) {
      const completedCache: SearchCache = {
        searchId,
        query,
        status: 'completed',
        results: searchResults,
        createdAt: Date.now(),
        completedAt: Date.now()
      };
      await saveSearchCache(kv, completedCache);
    }

  } catch (error) {
    console.error(`Background search error for ${searchId}:`, error);
    
    // KV에 에러 상태 저장
    if (kv) {
      const errorCache: SearchCache = {
        searchId,
        query,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        createdAt: Date.now(),
        completedAt: Date.now()
      };
      await saveSearchCache(kv, errorCache);
    }
  }
}

// 데이터베이스에서 관련 정보 수집
function normalizeText(value: string | null | undefined): string {
  return (value || '').toLowerCase();
}

function parseReportTags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags.filter((tag): tag is string => typeof tag === 'string');
  }

  if (typeof tags !== 'string' || !tags.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed.filter((tag): tag is string => typeof tag === 'string') : [];
  } catch (_) {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
}

function buildSearchTerms(query: string): string[] {
  const normalized = query.trim().toLowerCase();
  const words = normalized.split(/\s+/).filter(Boolean);
  return Array.from(new Set([normalized, ...words])).filter((term) => term.length > 1);
}

function scoreText(value: string, term: string, weight: number): number {
  if (!value.includes(term)) {
    return 0;
  }

  if (value === term) {
    return weight + 3;
  }

  if (value.startsWith(term)) {
    return weight + 2;
  }

  return weight;
}

async function collectRelevantData(query: string): Promise<StandardSearchContext> {
  try {
    const db = await createDatabaseAdapter();
    const reportOperations = createReportOperations(db);
    const conferenceOperations = createConferenceOperations(db);
    const searchTerms = buildSearchTerms(query);

    const reports = await reportOperations.getAll();
    const matchedReports = reports
      .map((report: any) => {
        const tags = parseReportTags(report.tags);
        const title = normalizeText(report.title);
        const summary = normalizeText(report.summary);
        const category = normalizeText(report.category);
        const organization = normalizeText(report.organization);
        const tagText = normalizeText(tags.join(' '));

        const score = searchTerms.reduce((total, term) => {
          return total
            + scoreText(title, term, 8)
            + scoreText(summary, term, 4)
            + scoreText(tagText, term, 4)
            + scoreText(category, term, 3)
            + scoreText(organization, term, 2);
        }, 0);

        return {
          score,
          createdAt: new Date(report.created_at || report.date || 0).getTime(),
          context: {
            title: report.title,
            summary: report.summary ?? null,
            category: report.category ?? null,
            organization: report.organization ?? null,
            tags
          }
        };
      })
      .filter((report) => report.score > 0)
      .sort((a, b) => b.score - a.score || b.createdAt - a.createdAt)
      .slice(0, 12)
      .map((report) => report.context);

    const conferences = await conferenceOperations.getAll();
    const matchedConferences = conferences
      .map((conference: any) => {
        const title = normalizeText(conference.title);
        const organization = normalizeText(conference.organization);
        const description = normalizeText(conference.description);

        const score = searchTerms.reduce((total, term) => {
          return total
            + scoreText(title, term, 8)
            + scoreText(description, term, 4)
            + scoreText(organization, term, 2);
        }, 0);

        return {
          score,
          startDate: new Date(conference.start_date || conference.startDate || 0).getTime(),
          context: {
            title: conference.title,
            organization: conference.organization ?? null,
            description: conference.description ?? null
          }
        };
      })
      .filter((conference) => conference.score > 0)
      .sort((a, b) => b.score - a.score || b.startDate - a.startDate)
      .slice(0, 8)
      .map((conference) => conference.context);

    const fallbackReports = reports.slice(0, 5).map((report: any) => ({
      title: report.title,
      summary: report.summary ?? null,
      category: report.category ?? null,
      organization: report.organization ?? null,
      tags: parseReportTags(report.tags)
    }));

    const fallbackConferences = conferences.slice(0, 5).map((conference: any) => ({
      title: conference.title,
      organization: conference.organization ?? null,
      description: conference.description ?? null
    }));

    return {
      reports: matchedReports.length > 0 ? matchedReports : fallbackReports,
      conferences: matchedConferences.length > 0 ? matchedConferences : fallbackConferences
    };
  } catch (error) {
    console.error('Failed to collect relevant data:', error);
    return { reports: [], conferences: [] };
  }
}

async function saveSearchCache(kv: SearchCacheStore, cache: SearchCache) {
  await kv.put(`search:${cache.searchId}`, JSON.stringify(cache), {
    expirationTtl: SEARCH_CACHE_TTL
  });
}

// 검색 ID 생성
function generateSearchId(): string {
  return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// --- SSE Streaming Helpers ---
function sseHeaders() {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive'
  };
}

function sseFormat(event: string, data: any) {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  return `event: ${event}\n` + `data: ${payload}\n\n`;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function streamSearchViaSSE(kv: any, searchId: string) {
  const encoder = new TextEncoder();
  let lastSnapshot = '';
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // 초기 핸드셰이크
      controller.enqueue(encoder.encode(sseFormat('open', { searchId })));

      const startTime = Date.now();
      const timeoutMs = 30_000; // 최대 30초 스트리밍

      try {
        while (Date.now() - startTime < timeoutMs) {
          const cacheData = await kv.get(`search:${searchId}`);
          if (cacheData && cacheData !== lastSnapshot) {
            lastSnapshot = cacheData;
            try {
              const parsed = JSON.parse(cacheData);
              controller.enqueue(encoder.encode(sseFormat('update', parsed)));
              if (parsed?.status === 'completed' || parsed?.status === 'failed') {
                controller.enqueue(encoder.encode(sseFormat('end', { status: parsed.status })));
                break;
              }
            } catch (_) {
              controller.enqueue(encoder.encode(sseFormat('update', { raw: cacheData })));
            }
          }
          await sleep(1000);
        }
      } catch (err) {
        controller.enqueue(encoder.encode(sseFormat('error', { message: (err as Error).message })));
      } finally {
        controller.close();
      }
    }
  });

  return new NextResponse(stream, { status: 200, headers: sseHeaders() });
}
