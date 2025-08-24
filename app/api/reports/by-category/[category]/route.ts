import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createReportOperations } from '@/lib/database-operations';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ category: string }> }
) {
  try {
    const params = await context.params;
    const { category } = params;
    
    // URL 디코딩
    const categoryName = decodeURIComponent(category);
    
    if (!categoryName) {
      return NextResponse.json(
        { success: false, error: 'Category parameter is required' },
        { status: 400 }
      );
    }
    
    const db = await createDatabaseAdapter();
    const reportOperations = createReportOperations(db);
    
    // 모든 보고서 가져오기
    const allReports = await reportOperations.getAll();
    
    // 특정 분야의 보고서만 필터링
    const categoryReports = allReports
      .filter((report: any) => {
        const reportCategory = report.category || '미분류';
        return reportCategory === categoryName;
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
    const sortedReports = categoryReports.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    return NextResponse.json({ 
      success: true, 
      data: sortedReports,
      total: sortedReports.length,
      category: categoryName
    });
  } catch (error) {
    console.error('Failed to get category reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get category reports' },
      { status: 500 }
    );
  }
}