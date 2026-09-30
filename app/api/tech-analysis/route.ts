import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter, DatabaseAdapter } from '@/lib/database-adapter';
import { createTechAnalysisReportOperations } from '@/lib/database-operations';
import { getSessionFromRequest } from '@/lib/edge-auth';
import { categorizeContent, classificationErrorDetails, ClassificationApiKey, resolveClassificationApiKey } from '@/lib/openai-categorizer';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

// GET tech analysis reports with pagination and search
export async function GET(request: NextRequest) {
  try {
    const db = await createDatabaseAdapter();
    const techAnalysisReportOperations = createTechAnalysisReportOperations(db);
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    if (idsParam !== null) {
      const parts = idsParam.split(',');
      if (parts.length === 0 || parts.length > 20 || parts.some(part => !/^[1-9]\d*$/.test(part))) {
        return NextResponse.json({ message: 'Invalid ids parameter' }, { status: 400 });
      }
      const ids = parts.map(Number);
      if (ids.some(id => !Number.isSafeInteger(id))) {
        return NextResponse.json({ message: 'Invalid ids parameter' }, { status: 400 });
      }
      const reports = await techAnalysisReportOperations.getByIds(ids);
      return NextResponse.json(reports);
    }
    const requestedLimit = Number(searchParams.get('limit') ?? '8');
    const requestedOffset = Number(searchParams.get('offset') ?? '0');
    if (!Number.isSafeInteger(requestedLimit) || !Number.isSafeInteger(requestedOffset) || requestedLimit < 1 || requestedOffset < 0) {
      return NextResponse.json({ message: 'Invalid pagination parameters' }, { status: 400 });
    }
    const limit = Math.min(requestedLimit, 50);
    const offset = requestedOffset;
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
    } catch {
      return NextResponse.json({ message: 'Invalid URL format' }, { status: 400 });
    }

    const apiKey = await resolveClassificationApiKey(db);
    if (!apiKey) {
      console.error('[tech-analysis] classification unavailable: no OpenAI API key in admin settings or Cloudflare environment');
      return NextResponse.json({ message: 'OpenAI API 키가 설정되지 않았습니다.' }, { status: 503 });
    }

    // Cloudflare next-on-pages의 request context에서 waitUntil 지원 여부 판단
    let supportsWaitUntil = false;
    let waitUntilFn: undefined | ((p: Promise<unknown>) => void);
    try {
      // next-on-pages의 타입 정의에서는 waitUntil이 RequestContext의 최상위가 아니라 ctx(ExecutionContext)에 존재함
      const rc = getRequestContext();
      const ctx = rc?.ctx;
      if (ctx && typeof ctx.waitUntil === 'function') {
        supportsWaitUntil = true;
        waitUntilFn = ctx.waitUntil.bind(ctx);
      }
    } catch {
      supportsWaitUntil = false;
    }

    if (!supportsWaitUntil) {
      // 미지원: 동기 처리로 즉시 완료까지 수행
      console.info('[tech-analysis] processing synchronously', { keySource: apiKey.source });
      return await processUrlSynchronously(url, techAnalysisReportOperations, db, apiKey);
    }

    // 지원: pending 레코드 생성 후 즉시 응답 반환, 백그라운드 처리는 비동기로 실행
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
    console.info('[tech-analysis] pending report created', { reportId: pendingReport.id, keySource: apiKey.source });
    
    // 백그라운드 처리 스케줄링 (응답과 독립적으로 실행)
    if (pendingReport.id && waitUntilFn) {
      const processing = processMetadataInBackground(Number(pendingReport.id), url, db, apiKey);
      try {
        waitUntilFn(processing);
      } catch (e) {
        console.warn('[tech-analysis] waitUntil enqueue failed', classificationErrorDetails(e));
        // Keep the same task alive; starting a second task would duplicate API calls.
        await processing;
      }
    }

    return response;
  } catch (error) {
    console.error('[tech-analysis] POST failed', classificationErrorDetails(error));
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ 
      message: `예상치 못한 서버 오류: ${errorMessage}` 
    }, { status: 500 });
  }
}

// 로컬 환경용 동기 처리 함수
async function processUrlSynchronously(
  url: string,
  techAnalysisReportOperations: ReturnType<typeof createTechAnalysisReportOperations>,
  db: DatabaseAdapter,
  apiKey: ClassificationApiKey,
) {
  try {
    // 커스텀 메타데이터 서비스에서 메타데이터 가져오기
    let title, description, image;
    try {
      const requestUrl = `http://xtandards.is-an.ai:3100/api/metadata?url=${encodeURIComponent(url)}`;
      const microlinkResponse = await fetch(requestUrl);

      if (!microlinkResponse.ok) {
        console.warn('[tech-analysis] synchronous metadata HTTP fallback', { httpStatus: microlinkResponse.status });
        title = url;
        description = null;
        image = null;
      } else {
        const metadata = await microlinkResponse.json();

        if (!metadata.status) {
          console.warn('[tech-analysis] synchronous metadata response had no result');
          title = url;
          description = null;
          image = null;
        } else {
          title = metadata.data.title;
          description = metadata.data.description;
          image = metadata.data.image; // 직접 URL 문자열
        }
      }
    } catch (microlinkError) {
      console.warn('[tech-analysis] synchronous metadata network fallback', classificationErrorDetails(microlinkError));
      title = url;
      description = null;
      image = null;
    }

    // 제목 확보
    if (!title) {
      title = url;
    }

    const summary = description || '설명이 없습니다.';
    console.info('[tech-analysis] synchronous metadata ready', {
      metadataFound: title !== url,
      titleLength: title.length,
      summaryLength: summary.length,
    });

    // AI 카테고리 분류
    let categoryName: string | null = null;
    try {
      categoryName = await categorizeContent(title, summary, { db, apiKey });
    } catch (categorizerError) {
      console.error('[tech-analysis] synchronous categorization failed', classificationErrorDetails(categorizerError));
    }

    // DB에 완료된 보고서 저장
    const report = await techAnalysisReportOperations.create({
      url,
      title,
      summary,
      image_url: image || undefined,
      category_name: categoryName || undefined,
      status: categoryName ? 'completed' : 'failed'
    });

    console.info('[tech-analysis] synchronous report saved', {
      reportId: report.id,
      status: categoryName ? 'completed' : 'failed',
      category: categoryName,
    });

    return NextResponse.json(report, { status: 201 });

  } catch (error) {
    console.error('[tech-analysis] synchronous processing error', classificationErrorDetails(error));
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      message: `처리 중 오류 발생: ${errorMessage}` 
    }, { status: 500 });
  }
}

// 백그라운드 메타데이터 처리 함수
async function processMetadataInBackground(reportId: number, url: string, db: DatabaseAdapter, apiKey: ClassificationApiKey) {
  try {
    const techAnalysisReportOperations = createTechAnalysisReportOperations(db);
    console.info('[tech-analysis] background processing started', { reportId, keySource: apiKey.source });

    // 커스텀 메타데이터 서비스에서 메타데이터 가져오기
    let title, description, image;
    try {
      const requestUrl = `http://xtandards.is-an.ai:3100/api/metadata?url=${encodeURIComponent(url)}`;
      const microlinkResponse = await fetch(requestUrl);

      if (!microlinkResponse.ok) {
        console.warn('[tech-analysis] background metadata HTTP fallback', { reportId, httpStatus: microlinkResponse.status });
        title = url;
        description = null;
        image = null;
      } else {
        const metadata = await microlinkResponse.json();

        if (!metadata.status) {
          console.warn('[tech-analysis] background metadata response had no result', { reportId });
          title = url;
          description = null;
          image = null;
        } else {
          title = metadata.data.title;
          description = metadata.data.description;
          image = metadata.data.image; // 직접 URL 문자열
        }
      }
    } catch (microlinkError) {
      console.warn('[tech-analysis] background metadata network fallback', { reportId, ...classificationErrorDetails(microlinkError) });
      title = url;
      description = null;
      image = null;
    }

    // 제목 확보
    if (!title) {
      title = url;
    }

    const summary = description || '설명이 없습니다.';
    console.info('[tech-analysis] background metadata ready', {
      reportId,
      metadataFound: title !== url,
      titleLength: title.length,
      summaryLength: summary.length,
    });

    // AI 카테고리 분류
    let categoryName: string | null = null;
    try {
      categoryName = await categorizeContent(title, summary, { db, apiKey, reportId });
    } catch (categorizerError) {
      console.error('[tech-analysis] background categorization failed', {
        reportId,
        ...classificationErrorDetails(categorizerError),
      });
    }

    // DB 업데이트
    try {
      await techAnalysisReportOperations.update(reportId, {
        title,
        summary,
        image_url: image || undefined,
        category_name: categoryName || undefined,
        status: categoryName ? 'completed' : 'failed'
      });
      console.info('[tech-analysis] background report updated', {
        reportId,
        status: categoryName ? 'completed' : 'failed',
        category: categoryName,
      });
    } catch (updateError) {
      console.error('[tech-analysis] background DB update failed', { reportId, ...classificationErrorDetails(updateError) });
      await updateReportToFailed(reportId, 'Database update failed', db);
    }
  } catch (error) {
    console.error('[tech-analysis] background processing error', { reportId, ...classificationErrorDetails(error) });
    await updateReportToFailed(reportId, 'Processing error', db);
  }
}

// 실패 상태 업데이트 헬퍼 함수
async function updateReportToFailed(reportId: number, errorMessage: string, db: DatabaseAdapter) {
  try {
    const techAnalysisReportOperations = createTechAnalysisReportOperations(db);
    await techAnalysisReportOperations.update(reportId, {
      status: 'failed'
    });
    console.error('[tech-analysis] report marked failed', { reportId, reason: errorMessage });
  } catch (statusUpdateError) {
    console.error('[tech-analysis] failed to mark report failed', { reportId, ...classificationErrorDetails(statusUpdateError) });
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
