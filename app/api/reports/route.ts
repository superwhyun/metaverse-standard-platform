import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createReportOperations } from '@/lib/database-operations';
import { getSessionFromRequest } from '@/lib/edge-auth';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const db = await createDatabaseAdapter();
    const reportOperations = createReportOperations(db);
    const { searchParams } = new URL(request.url);
    const includeContent = searchParams.get('includeContent') === 'true';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;
    
    let allReports = await reportOperations.getAll();
    
    // 월별 필터링 적용
    if (year && month) {
      const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
      allReports = allReports.filter((report: any) => {
        return report.date && report.date.startsWith(yearMonth);
      });
    }

    if (includeContent) {
      return NextResponse.json({ success: true, data: allReports });
    } else {
      const reports = allReports.map((report: any) => ({
        id: report.id,
        title: report.title,
        date: report.date,
        summary: report.summary,
        category: report.category,
        organization: report.organization,
        tags: report.tags,
        download_url: report.download_url,
        conference_id: report.conference_id
      }));
      
      const sortedReports = reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      let paginatedReports = sortedReports;
      if (limit) {
        const start = offset || 0;
        paginatedReports = sortedReports.slice(start, start + limit);
      }
      
      return NextResponse.json({ 
        success: true, 
        data: paginatedReports,
        total: reports.length,
        hasMore: limit ? (offset || 0) + limit < reports.length : false
      });
    }
  } catch (error) {
    console.error('Failed to get reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, error: '관리자 권한이 필요합니다.' }, { status: 401 });
    }

    const db = await createDatabaseAdapter();
    const reportOperations = createReportOperations(db);
    const data = await request.json();
    
    const reportData = {
      title: data.title,
      date: data.date,
      summary: data.summary,
      content: data.content,
      category: data.category,
      organization: data.organization,
      tags: JSON.stringify(data.tags || []),
      download_url: data.downloadUrl || null,
      conference_id: data.conferenceId || null
    };
    
    const result = await reportOperations.create(reportData);
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Failed to create report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create report' },
      { status: 500 }
    );
  }
}
