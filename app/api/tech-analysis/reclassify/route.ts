import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createTechAnalysisReportOperations } from '@/lib/database-operations';
import { categorizeContent, classificationErrorDetails } from '@/lib/openai-categorizer';
import { getSessionFromRequest } from '@/lib/edge-auth';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ message: '관리자 권한이 필요합니다.' }, { status: 401 });
  }

  const { id } = await request.json() as { id?: unknown };
  if (!Number.isSafeInteger(id) || Number(id) < 1) {
    return NextResponse.json({ message: '유효하지 않은 ID입니다.' }, { status: 400 });
  }

  try {
    const db = await createDatabaseAdapter();
    const reports = createTechAnalysisReportOperations(db);
    const report = await reports.getById(Number(id));
    if (!report) {
      return NextResponse.json({ message: '기술 소식을 찾을 수 없습니다.' }, { status: 404 });
    }

    console.info('[tech-classify] manual reclassification started', { reportId: Number(id) });
    const category = await categorizeContent(report.title, report.summary || '', { db, reportId: Number(id) });
    await reports.update(Number(id), { category_name: category });
    console.info('[tech-classify] manual reclassification completed', { reportId: Number(id), category });
    return NextResponse.json({ category_name: category });
  } catch (error) {
    console.error('[tech-classify] manual reclassification failed', { reportId: Number(id), ...classificationErrorDetails(error) });
    return NextResponse.json({ message: '자동 분류에 실패했습니다. API 키와 서버 로그를 확인하세요.' }, { status: 502 });
  }
}
