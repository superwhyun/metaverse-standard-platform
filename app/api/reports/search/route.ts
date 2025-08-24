import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createReportOperations } from '@/lib/database-operations';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';
    const category = searchParams.get('category') || '';
    const organization = searchParams.get('organization') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    if (!query && !category && !organization) {
      return NextResponse.json(
        { success: false, error: 'Search query or filters required' },
        { status: 400 }
      );
    }
    
    const db = await createDatabaseAdapter();
    const reportOperations = createReportOperations(db);
    
    // 모든 보고서 가져오기 (content 제외)
    const allReports = await reportOperations.getAll();
    
    const reports = allReports.map((report: any) => {
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
    
    // 검색 필터링
    const filteredReports = reports.filter((report: any) => {
      let matchesQuery = true;
      let matchesCategory = true;
      let matchesOrganization = true;
      
      // 검색어 필터링
      if (query) {
        const searchQuery = query.toLowerCase();
        matchesQuery = 
          report.title.toLowerCase().includes(searchQuery) ||
          report.summary.toLowerCase().includes(searchQuery) ||
          (Array.isArray(report.tags) && report.tags.some((tag: string) => 
            tag.toLowerCase().includes(searchQuery)
          ));
      }
      
      // 카테고리 필터링
      if (category && category !== 'all') {
        matchesCategory = report.category === category;
      }
      
      // 기관 필터링
      if (organization && organization !== 'all') {
        matchesOrganization = report.organization === organization;
      }
      
      return matchesQuery && matchesCategory && matchesOrganization;
    });
    
    // 날짜순 정렬
    const sortedReports = filteredReports.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // 페이징 적용
    const paginatedReports = sortedReports.slice(offset, offset + limit);
    
    return NextResponse.json({ 
      success: true, 
      data: paginatedReports,
      total: filteredReports.length,
      hasMore: offset + limit < filteredReports.length,
      query: { query, category, organization, limit, offset }
    });
  } catch (error) {
    console.error('Failed to search reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search reports' },
      { status: 500 }
    );
  }
}