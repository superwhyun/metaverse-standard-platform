import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createTechAnalysisReportOperations } from '@/lib/database-operations';
import { getSessionFromRequest } from '@/lib/edge-auth';
import { categorizeContent } from '@/lib/openai-categorizer';
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

// GET tech analysis reports with pagination and search
export async function GET(request: NextRequest) {
  try {
    const db = await createDatabaseAdapter();
    const techAnalysisReportOperations = createTechAnalysisReportOperations(db);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '8');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    const reports = await techAnalysisReportOperations.getPaginated(limit, offset, search, category);
    return NextResponse.json(reports);
  } catch (error) {
    console.error('Failed to fetch tech analysis reports:', error);
    return NextResponse.json({ message: 'Failed to fetch tech analysis reports' }, { status: 500 });
  }
}

// POST a new tech analysis report from a URL
export async function POST(request: NextRequest) {
  try {
    const db = await createDatabaseAdapter();
    const techAnalysisReportOperations = createTechAnalysisReportOperations(db);
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ message: 'URL is required' }, { status: 400 });
    }

    try {
      new URL(url);
    } catch (_) {
      return NextResponse.json({ message: 'Invalid URL format' }, { status: 400 });
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
      console.log('No requestContext.waitUntil: processing synchronously');
      return await processUrlSynchronously(url, techAnalysisReportOperations);
    }

    // 지원: pending 레코드 생성 후 즉시 응답 반환, 백그라운드 처리는 비동기로 실행
    console.log('requestContext.waitUntil detected: creating pending record');
    const pendingReport = await techAnalysisReportOperations.create({
      url,
      title: url,
      summary: '메타데이터를 분석 중입니다...',
      image_url: null,
      category_name: null,
      status: 'pending'
    });

    // pending 레코드 생성 후 즉시 응답 반환
    const response = NextResponse.json(pendingReport, { status: 201 });
    
    // 백그라운드 처리 스케줄링 (응답과 독립적으로 실행)
    if (pendingReport.id && waitUntilFn) {
      console.log('Scheduling background processing for report ID:', pendingReport.id);
      try {
        waitUntilFn(processMetadataInBackground(Number(pendingReport.id), url));
      } catch (e) {
        console.warn('waitUntil enqueue failed, falling back to direct Promise:', e);
        // 백그라운드 처리 실패 시에도 응답은 이미 반환됨
        processMetadataInBackground(Number(pendingReport.id), url).catch(err => {
          console.error('Background processing failed:', err);
        });
      }
    }

    return response;
  } catch (error) {
    console.error('Unexpected error in tech-analysis POST:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ 
      message: `예상치 못한 서버 오류: ${errorMessage}` 
    }, { status: 500 });
  }
}

// 로컬 환경용 동기 처리 함수
async function processUrlSynchronously(url: string, techAnalysisReportOperations: any) {
  try {
    const OPENAI_API_KEY = getEnv('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not available');
      return NextResponse.json({ 
        message: 'OpenAI API 키가 설정되지 않았습니다. 관리자에게 문의해주세요.' 
      }, { status: 500 });
    }

    console.log(`Synchronous processing for URL: ${url}`);

    // 커스텀 메타데이터 서비스에서 메타데이터 가져오기
    let title, description, image;
    try {
      const requestUrl = `http://xtandards.is-an.ai/:3100/api/metadata?url=${encodeURIComponent(url)}`;
      console.log('Synchronous requesting URL:', requestUrl);
      const microlinkResponse = await fetch(requestUrl);
      console.log('Custom metadata service response status:', microlinkResponse.status);
      
      if (!microlinkResponse.ok) {
        console.log('Custom metadata service HTTP error, using fallback values');
        title = url;
        description = null;
        image = null;
      } else {
        const metadata = await microlinkResponse.json();
        console.log('Custom metadata service status:', metadata.status);

        if (!metadata.status) {
          console.log('Custom metadata service parsing failed, using fallback values');
          title = url;
          description = null;
          image = null;
        } else {
          console.log('Metadata data keys:', Object.keys(metadata.data || {}));
          title = metadata.data.title;
          description = metadata.data.description;
          image = metadata.data.image; // 직접 URL 문자열
        }
      }
    } catch (microlinkError) {
      console.log('Custom metadata service network error, using fallback values');
      console.log('Error details:', microlinkError instanceof Error ? microlinkError.message : 'Unknown error');
      title = url;
      description = null;
      image = null;
    }

    // 제목 확보
    if (!title) {
      title = url;
    }

    const summary = description || '설명이 없습니다.';
    
    // AI 카테고리 분류
    let categoryName: string | null = null;
    try {
      categoryName = await categorizeContent(title, summary);
      console.log(`Auto-categorized: "${title}" -> category: ${categoryName}`);
    } catch (categorizerError) {
      console.error('Categorization failed:', categorizerError);
    }

    // DB에 완료된 보고서 저장
    const report = await techAnalysisReportOperations.create({
      url,
      title,
      summary,
      image_url: image || undefined,
      category_name: categoryName || undefined,
      status: 'completed'
    });

    console.log(`Synchronous processing completed for report ${report.id}`);
    return NextResponse.json(report, { status: 201 });

  } catch (error) {
    console.error('Synchronous processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      message: `처리 중 오류 발생: ${errorMessage}` 
    }, { status: 500 });
  }
}

// 백그라운드 메타데이터 처리 함수
async function processMetadataInBackground(reportId: number, url: string) {
  const startTime = Date.now();
  console.log(`=== 백그라운드 처리 시작 ===`);
  console.log(`Report ID: ${reportId}`);
  console.log(`URL: ${url}`);
  console.log(`시작 시간: ${new Date().toISOString()}`);
  
  try {
    const OPENAI_API_KEY = getEnv('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not available for background processing');
      await updateReportToFailed(reportId, 'OpenAI API key not available');
      return;
    }

    const db = await createDatabaseAdapter();
    const techAnalysisReportOperations = createTechAnalysisReportOperations(db);

    // 커스텀 메타데이터 서비스에서 메타데이터 가져오기
    let title, description, image;
    try {
      const requestUrl = `http://u2pia-oracle2.duckdns.org:3100/api/metadata?url=${encodeURIComponent(url)}`;
      // const requestUrl = `http://localhost:3100/api/metadata?url=${encodeURIComponent(url)}`;

      console.log('Background requesting URL:', requestUrl);
      const microlinkResponse = await fetch(requestUrl);
      console.log('Background custom metadata service response status:', microlinkResponse.status);
      
      if (!microlinkResponse.ok) {
        console.log('Background custom metadata service HTTP error, using fallback values');
        title = url;
        description = null;
        image = null;
      } else {
        const metadata = await microlinkResponse.json();
        console.log('Background custom metadata service status:', metadata.status);

        if (!metadata.status) {
          console.log('Background custom metadata service parsing failed, using fallback values');
          title = url;
          description = null;
          image = null;
        } else {
          console.log('Background metadata data keys:', Object.keys(metadata.data || {}));
          title = metadata.data.title;
          description = metadata.data.description;
          image = metadata.data.image; // 직접 URL 문자열
        }
      }
    } catch (microlinkError) {
      console.log('Background custom metadata service network error, using fallback values');
      console.log('Error details:', microlinkError instanceof Error ? microlinkError.message : 'Unknown error');
      title = url;
      description = null;
      image = null;
    }

    // 제목 확보
    if (!title) {
      title = url;
    }

    const summary = description || '설명이 없습니다.';
    
    // AI 카테고리 분류
    let categoryName: string | null = null;
    try {
      categoryName = await categorizeContent(title, summary);
      console.log(`Background auto-categorized: "${title}" -> category: ${categoryName}`);
    } catch (categorizerError) {
      console.error('Background categorization failed:', categorizerError);
    }

    // DB 업데이트
    try {
      await techAnalysisReportOperations.update(reportId, {
        title,
        summary,
        image_url: image || undefined,
        category_name: categoryName || undefined,
        status: 'completed'
      });
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      console.log(`=== 백그라운드 처리 완료 ===`);
      console.log(`Report ID: ${reportId}`);
      console.log(`처리 시간: ${processingTime}ms`);
      console.log(`완료 시간: ${new Date().toISOString()}`);
      console.log(`최종 제목: ${title}`);
      console.log(`최종 카테고리: ${categoryName || '기타'}`);
      
    } catch (updateError) {
      console.error(`Background DB update failed for report ${reportId}:`, updateError);
      await updateReportToFailed(reportId, 'Database update failed');
    }
  } catch (error) {
    console.error(`Background processing error for report ${reportId}:`, error);
    await updateReportToFailed(reportId, `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 실패 상태 업데이트 헬퍼 함수
async function updateReportToFailed(reportId: number, errorMessage: string) {
  try {
    const db = await createDatabaseAdapter();
    const techAnalysisReportOperations = createTechAnalysisReportOperations(db);
    await techAnalysisReportOperations.update(reportId, {
      status: 'failed'
    });
    console.log(`=== 백그라운드 처리 실패 ===`);
    console.log(`Report ID: ${reportId}`);
    console.log(`실패 사유: ${errorMessage}`);
    console.log(`실패 시간: ${new Date().toISOString()}`);
  } catch (statusUpdateError) {
    console.error(`Failed to update status to failed for report ${reportId}:`, statusUpdateError);
  }
}

// PUT update a tech analysis report (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ message: '관리자 권한이 필요합니다.' }, { status: 401 });
    }

    const db = await createDatabaseAdapter();
    const techAnalysisReportOperations = createTechAnalysisReportOperations(db);
    const { id, title, summary, url, image_url, category_name } = await request.json();
    
    if (!id || !title) {
      return NextResponse.json({ message: 'ID와 제목이 필요합니다.' }, { status: 400 });
    }

    const reportId = parseInt(id);
    if (isNaN(reportId)) {
      return NextResponse.json({ message: '유효하지 않은 ID입니다.' }, { status: 400 });
    }

    const existingReport = await techAnalysisReportOperations.getById(reportId);
    if (!existingReport) {
      return NextResponse.json({ message: '해당 기술 소식을 찾을 수 없습니다.' }, { status: 404 });
    }

    const updatedReport = await techAnalysisReportOperations.update(reportId, {
      title,
      summary: summary || '설명이 없습니다.',
      url,
      image_url,
      category_name: category_name || null
    });
    
    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error('Failed to update tech analysis report:', error);
    return NextResponse.json({ message: '기술 소식 수정에 실패했습니다.' }, { status: 500 });
  }
}

// DELETE a tech analysis report (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ message: '관리자 권한이 필요합니다.' }, { status: 401 });
    }

    const db = await createDatabaseAdapter();
    const techAnalysisReportOperations = createTechAnalysisReportOperations(db);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ message: 'ID가 필요합니다.' }, { status: 400 });
    }

    const reportId = parseInt(id);
    if (isNaN(reportId)) {
      return NextResponse.json({ message: '유효하지 않은 ID입니다.' }, { status: 400 });
    }

    const existingReport = await techAnalysisReportOperations.getById(reportId);
    if (!existingReport) {
      return NextResponse.json({ message: '해당 기술 소식을 찾을 수 없습니다.' }, { status: 404 });
    }

    await techAnalysisReportOperations.delete(reportId);
    
    return NextResponse.json({ message: '기술 소식이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('Failed to delete tech analysis report:', error);
    return NextResponse.json({ message: '기술 소식 삭제에 실패했습니다.' }, { status: 500 });
  }
}
