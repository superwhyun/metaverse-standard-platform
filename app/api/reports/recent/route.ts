import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createReportOperations } from '@/lib/database-operations';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const db = await createDatabaseAdapter();
    const reportOperations = createReportOperations(db);
    
    // 최근 6개 보고서만 가져오기 (content 제외)
    const allReports = await reportOperations.getAll();
    
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
    
    // 날짜순으로 정렬하고 최근 6개만 반환
    const sortedReports = reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const recentReports = sortedReports.slice(0, 6);
    
    return NextResponse.json({ 
      success: true, 
      data: recentReports,
      total: recentReports.length
    });
  } catch (error) {
    console.error('Failed to get recent reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get recent reports' },
      { status: 500 }
    );
  }
}