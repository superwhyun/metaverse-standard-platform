import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createTechAnalysisReportOperations } from '@/lib/database-operations';
import { getSessionFromRequest } from '@/lib/edge-auth';
import { categorizeContent } from '@/lib/openai-categorizer';

export const runtime = 'edge';

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
export async function POST(request: NextRequest, context: { params: any; waitUntil?: (promise: Promise<any>) => void }) {
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

    // 환경 감지: 로컬 개발 vs 프로덕션
    // Wrangler dev에서는 CF_PAGES가 없고, 실제 프로덕션에서는 CF_PAGES가 있음
    const isLocal = !process.env.CF_PAGES;
    
    if (isLocal) {
      // 로컬 환경: 즉시 처리 (waitUntil 지원 안됨)
      console.log('Local environment detected: processing synchronously');
      return await processUrlSynchronously(url, techAnalysisReportOperations);
    } else {
      // 프로덕션 환경: 백그라운드 처리 (waitUntil 사용)
      console.log('Production environment detected: processing in background');
      const pendingReport = await techAnalysisReportOperations.create({
        url,
        title: url,
        summary: '메타데이터를 분석 중입니다...',
        image_url: null,
        category_name: null,
        status: 'pending'
      });

      if (pendingReport.id && context.waitUntil) {
        // Cloudflare Workers의 waitUntil 사용
        context.waitUntil(processMetadataInBackground(Number(pendingReport.id), url));
      } else if (pendingReport.id) {
        // waitUntil이 없는 경우 fallback (일반적인 Promise)
        processMetadataInBackground(Number(pendingReport.id), url).catch(error => {
          console.error('Background processing failed:', error);
        });
      }

      return NextResponse.json(pendingReport, { status: 201 });
    }
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
    const { OPENAI_API_KEY } = process.env;
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not available');
      return NextResponse.json({ 
        message: 'OpenAI API 키가 설정되지 않았습니다. 관리자에게 문의해주세요.' 
      }, { status: 500 });
    }

    console.log(`Synchronous processing for URL: ${url}`);

    // Microlink 메타데이터 가져오기
    let title, description, image;
    try {
      const microlinkResponse = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
      console.log('Microlink response status:', microlinkResponse.status);
      
      if (!microlinkResponse.ok) {
        console.log('Microlink HTTP error, using fallback values');
        title = url;
        description = null;
        image = null;
      } else {
        const metadata = await microlinkResponse.json();
        console.log('Microlink metadata status:', metadata.status);

        if (metadata.status !== 'success') {
          console.log('Microlink parsing failed, using fallback values');
          title = url;
          description = null;
          image = null;
        } else {
          console.log('Metadata data keys:', Object.keys(metadata.data || {}));
          ({ title, description, image } = metadata.data);
        }
      }
    } catch (microlinkError) {
      console.log('Microlink network error, using fallback values:', microlinkError);
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
      image_url: image?.url || undefined,
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
  try {
    const { OPENAI_API_KEY } = process.env;
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not available for background processing');
      return;
    }

    const db = await createDatabaseAdapter();
    const techAnalysisReportOperations = createTechAnalysisReportOperations(db);

    console.log(`Background processing for report ${reportId}, URL: ${url}`);

    // Microlink 메타데이터 가져오기
    let title, description, image;
    try {
      const microlinkResponse = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
      console.log('Background Microlink response status:', microlinkResponse.status);
      
      if (!microlinkResponse.ok) {
        console.log('Background Microlink HTTP error, using fallback values');
        title = url;
        description = null;
        image = null;
      } else {
        const metadata = await microlinkResponse.json();
        console.log('Background Microlink metadata status:', metadata.status);

        if (metadata.status !== 'success') {
          console.log('Background Microlink parsing failed, using fallback values');
          title = url;
          description = null;
          image = null;
        } else {
          console.log('Background metadata data keys:', Object.keys(metadata.data || {}));
          ({ title, description, image } = metadata.data);
        }
      }
    } catch (microlinkError) {
      console.log('Background Microlink network error, using fallback values:', microlinkError);
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
        image_url: image?.url || undefined,
        category_name: categoryName || undefined,
        status: 'completed'
      });
      console.log(`Background processing completed for report ${reportId}`);
    } catch (updateError) {
      console.error(`Background DB update failed for report ${reportId}:`, updateError);
      // 실패 상태로 업데이트
      try {
        await techAnalysisReportOperations.update(reportId, {
          status: 'failed'
        });
      } catch (statusUpdateError) {
        console.error('Failed to update status to failed:', statusUpdateError);
      }
    }
  } catch (error) {
    console.error(`Background processing error for report ${reportId}:`, error);
    // 실패 상태로 업데이트 시도
    try {
      const db = await createDatabaseAdapter();
      const techAnalysisReportOperations = createTechAnalysisReportOperations(db);
      await techAnalysisReportOperations.update(reportId, {
        status: 'failed'
      });
    } catch (statusUpdateError) {
      console.error('Failed to update status to failed:', statusUpdateError);
    }
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
