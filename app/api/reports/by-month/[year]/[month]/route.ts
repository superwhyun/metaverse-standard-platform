import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createReportOperations } from '@/lib/database-operations';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ year: string; month: string }> }
) {
  try {
    const params = await context.params;
    const { year, month } = params;
    
    // 파라미터 검증
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { success: false, error: 'Invalid year or month parameter' },
        { status: 400 }
      );
    }
    
    const db = await createDatabaseAdapter();
    const reportOperations = createReportOperations(db);
    
    // 모든 보고서 가져오기
    const allReports = await reportOperations.getAll();
    
    // 특정 년월의 보고서만 필터링
    const targetYearMonth = `${yearNum}-${String(monthNum).padStart(2, '0')}`;
    
    const monthlyReports = allReports
      .filter((report: any) => {
        if (!report.date) return false;
        const reportYearMonth = report.date.substring(0, 7); // YYYY-MM 추출
        return reportYearMonth === targetYearMonth;
      })
      .map((report: any) => {
        let tags = [];
        try {
          tags = typeof report.tags === 'string' ? JSON.parse(report.tags || '[]') : (report.tags || []);
        } catch (e) {
          tags = [];
        }
        
        return {
          id: report.id,
          title: report.title,
          date: report.date,
          summary: report.summary,
          category: report.category,
          organization: report.organization,
          tags: tags,
          download_url: report.download_url,
          conference_id: report.conference_id
        };
      });
    
    // 날짜순 정렬 (최신순)
    const sortedReports = monthlyReports.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    return NextResponse.json({ 
      success: true, 
      data: sortedReports,
      total: sortedReports.length,
      period: {
        year: yearNum,
        month: monthNum,
        monthName: new Date(yearNum, monthNum - 1).toLocaleDateString('ko-KR', { 
          year: 'numeric', 
          month: 'long' 
        })
      }
    });
  } catch (error) {
    console.error('Failed to get monthly reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get monthly reports' },
      { status: 500 }
    );
  }
}