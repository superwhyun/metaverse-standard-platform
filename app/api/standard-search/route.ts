import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createReportOperations, createConferenceOperations } from '@/lib/database-operations';
import { getRequestContext } from '@cloudflare/next-on-pages';
import type { SearchCache, StandardResult } from '@/types/standard-search';
import { SEARCH_CACHE_TTL } from '@/types/standard-search';

// Cloudflare KV 타입 임포트
/// <reference types="@cloudflare/workers-types" />

export const runtime = 'edge';

// KV 접근 헬퍼
function getKVNamespace(): any | null {
  try {
    const { env } = getRequestContext();
    return env.STANDARD_SEARCH_CACHE || null;
  } catch (error) {
    console.error('Failed to get KV namespace:', error);
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
      return await processStandardSearchSynchronously(query);
    }

    // 지원: 임시 검색 ID 생성 후 백그라운드 처리
    console.log('requestContext.waitUntil detected: scheduling background search');
    const searchId = generateSearchId();
    
    // KV에 초기 상태 저장
    const kv = getKVNamespace();
    if (kv) {
      const initialCache: SearchCache = {
        searchId,
        query,
        status: 'pending',
        createdAt: Date.now()
      };
      
      await kv.put(`search:${searchId}`, JSON.stringify(initialCache), {
        expirationTtl: SEARCH_CACHE_TTL
      });
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
        waitUntilFn(processStandardSearchInBackground(searchId, query));
      } catch (e) {
        console.warn('waitUntil enqueue failed, falling back to direct Promise:', e);
        processStandardSearchInBackground(searchId, query).catch(err => {
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
async function processStandardSearchSynchronously(query: string) {
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
    const contextData = await collectRelevantData();

    // GPT-5로 표준 검색 수행
    const searchResults = await performAISearch(query, contextData, OPENAI_API_KEY);

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
async function processStandardSearchInBackground(searchId: string, query: string) {
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
        await kv.put(`search:${searchId}`, JSON.stringify(errorCache), {
          expirationTtl: SEARCH_CACHE_TTL
        });
      }
      return;
    }

    console.log(`Background standard search for ID: ${searchId}, query: ${query}`);

    // 기존 데이터베이스에서 관련 정보 수집
    const contextData = await collectRelevantData();

    // GPT-5로 표준 검색 수행
    const searchResults = await performAISearch(query, contextData, OPENAI_API_KEY);

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
      await kv.put(`search:${searchId}`, JSON.stringify(completedCache), {
        expirationTtl: SEARCH_CACHE_TTL
      });
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
      await kv.put(`search:${searchId}`, JSON.stringify(errorCache), {
        expirationTtl: SEARCH_CACHE_TTL
      });
    }
  }
}

// 데이터베이스에서 관련 정보 수집
async function collectRelevantData() {
  try {
    const db = await createDatabaseAdapter();
    const reportOperations = createReportOperations(db);
    const conferenceOperations = createConferenceOperations(db);

    // 최근 보고서들 (제목과 요약만)
    const reports = await reportOperations.getAll();
    const recentReports = reports.slice(0, 20).map(report => ({
      title: report.title,
      summary: report.summary,
      category: report.category,
      organization: report.organization
    }));

    // 최근 회의들
    const conferences = await conferenceOperations.getAll();
    const recentConferences = conferences.slice(0, 20).map(conf => ({
      title: conf.title,
      organization: conf.organization,
      description: conf.description
    }));

    return {
      reports: recentReports,
      conferences: recentConferences
    };
  } catch (error) {
    console.error('Failed to collect relevant data:', error);
    return { reports: [], conferences: [] };
  }
}

// GPT-5로 AI 표준 검색 수행
async function performAISearch(query: string, contextData: any, apiKey: string) {
  try {
    const systemPrompt = `당신은 메타버스와 관련 기술 표준 전문가입니다. 

사용자의 요구사항을 분석하여 관련된 국제 표준들을 찾아 추천해주세요.

다음 정보를 참고하세요:
- 최근 보고서: ${JSON.stringify(contextData.reports.slice(0, 10))}
- 최근 회의: ${JSON.stringify(contextData.conferences.slice(0, 10))}

응답은 반드시 다음 JSON 형식으로 해주세요:
[
  {
    "id": "표준 고유 식별자 (예: iso-iec-23005)",
    "title": "표준 제목",
    "organization": "표준화 기구명 (ISO/IEC, IEEE, W3C, ITU-T 등)",
    "description": "표준에 대한 상세 설명 (200자 이상)",
    "relevanceScore": 관련도 점수 (0-100),
    "tags": ["관련", "태그", "목록"],
    "status": "발표됨|권고안|개발중|초안",
    "publishedDate": "2024-MM-DD"
  }
]

주의사항:
1. 실제 존재하는 표준들만 추천하세요
2. relevanceScore는 사용자 요구사항과의 관련도를 정확히 평가하세요
3. 최대 3개의 표준만 추천하세요 (3개를 넘기지 마세요)
4. 각 표준의 설명은 2-3문장, 400자 이내로 간결하게 작성하세요
5. 반드시 JSON 배열만 출력하세요. 설명 문구, 해설, 마크다운 코드펜스 금지`;

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-nano',
        reasoning: { effort: 'low' },
        input: [
          { role: 'user', content: `${systemPrompt}\n\n사용자 요구사항: ${query}` }
        ],
        max_output_tokens: 2048
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const wasIncomplete = data?.status === 'incomplete' && data?.incomplete_details?.reason === 'max_output_tokens';
    console.log('OpenAI API full response:', JSON.stringify(data, null, 2));

    // Responses API 출력에서 텍스트 추출
    let content: string = '';
    if (typeof data.output_text === 'string' && data.output_text.trim()) {
      content = data.output_text.trim();
    } else if (Array.isArray(data.output)) {
      for (const item of data.output) {
        if (item && item.type === 'message' && Array.isArray(item.content)) {
          for (const part of item.content) {
            if (typeof part?.text === 'string' && part.text.trim()) { content = part.text.trim(); break; }
          }
          if (content) break;
        }
        if (item && typeof item.text === 'string' && item.text.trim()) { content = item.text.trim(); break; }
      }
    }
    
    // JSON 응답 파싱 (안전 파서)
    function tryParseArray(text: string): any[] | null {
      try {
        let jsonText = text;
        const fenceMatch = text.match(/```(?:json)?\n([\s\S]*?)```/i);
        if (fenceMatch) jsonText = fenceMatch[1];
        const firstBracket = jsonText.indexOf('[');
        const lastBracket = jsonText.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1) {
          jsonText = jsonText.slice(firstBracket, lastBracket + 1);
        }
        const arr = JSON.parse(jsonText);
        return Array.isArray(arr) ? arr : null;
      } catch (_) {
        // 객체 단위 복구 시도
        const objs: any[] = [];
        const matches = text.match(/\{[\s\S]*?\}/g);
        if (matches) {
          for (const m of matches) {
            try {
              const obj = JSON.parse(m);
              objs.push(obj);
            } catch (_) { /* skip */ }
          }
        }
        return objs.length ? objs : null;
      }
    }

    let results: any[] = [];
    const parsedOnce = tryParseArray(content);
    if (parsedOnce) results = parsedOnce;

    // 불완전 출력이면 자동 이어받기 호출
    if (wasIncomplete || results.length < 3) {
      const existingIds = results.map((r: any) => r?.id).filter(Boolean);
      const continuationPrompt = `${systemPrompt}\n\n사용자 요구사항: ${query}\n\n이미 확보한 표준 ID: ${existingIds.join(', ') || '(없음)'}\n남은 항목만 작성하세요. 전체 개수는 최대 3개를 넘지 마세요. 반드시 JSON 배열만 출력하세요.`;

      const contRes = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-nano',
          reasoning: { effort: 'low' },
          input: [
            { role: 'user', content: continuationPrompt }
          ],
          max_output_tokens: 1024
        }),
      });

      if (contRes.ok) {
        const contData = await contRes.json();
        let contText: string | undefined = contData.output_text;
        if (!contText && Array.isArray(contData.output)) {
          for (const item of contData.output) {
            if (item && item.type === 'message' && Array.isArray(item.content)) {
              for (const part of item.content) {
                if (typeof part?.text === 'string' && part.text.trim()) { contText = part.text.trim(); break; }
              }
              if (contText) break;
            }
            if (item && typeof item.text === 'string' && item.text.trim()) { contText = item.text.trim(); break; }
          }
        }
        if (contText) {
          const more = tryParseArray(contText) || [];
          // 병합 (id 중복 제거)
          const byId = new Map<string, any>();
          for (const r of [...results, ...more]) {
            const key = r?.id || JSON.stringify(r);
            if (!byId.has(key)) byId.set(key, r);
          }
          results = Array.from(byId.values()).slice(0, 3);
        }
      } else {
        console.warn('Continuation call failed:', contRes.status, await contRes.text());
      }
    }

    return Array.isArray(results) ? results : [];

  } catch (error) {
    console.error('AI search failed:', error);
    return [];
  }
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