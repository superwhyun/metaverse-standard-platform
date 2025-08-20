import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createReportOperations, createConferenceOperations } from '@/lib/database-operations';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

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

    // TODO: 실제로는 KV나 메모리에서 결과 조회
    // 현재는 단순 구현으로 완료된 것으로 간주
    return NextResponse.json({
      searchId,
      status: 'completed',
      results: []
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
  try {
    const OPENAI_API_KEY = getEnv('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not available for background search');
      return;
    }

    console.log(`Background standard search for ID: ${searchId}, query: ${query}`);

    // 기존 데이터베이스에서 관련 정보 수집
    const contextData = await collectRelevantData();

    // GPT-5로 표준 검색 수행
    const searchResults = await performAISearch(query, contextData, OPENAI_API_KEY);

    console.log(`Background search completed for ${searchId} with ${searchResults.length} results`);

    // TODO: 실제로는 결과를 KV나 메모리에 저장
    // 현재는 로그만 출력

  } catch (error) {
    console.error(`Background search error for ${searchId}:`, error);
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
3. 최대 5개의 표준을 추천하세요
4. 각 표준의 설명은 구체적이고 상세해야 합니다`;

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5',
        reasoning: { effort: 'high' },
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `사용자 요구사항: ${query}` }
        ],
        max_output_tokens: 2000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.output_text;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    // JSON 응답 파싱
    try {
      const results = JSON.parse(content);
      return Array.isArray(results) ? results : [];
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', content);
      return [];
    }

  } catch (error) {
    console.error('AI search failed:', error);
    return [];
  }
}

// 검색 ID 생성
function generateSearchId(): string {
  return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}