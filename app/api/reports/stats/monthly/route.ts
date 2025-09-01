import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createReportOperations } from '@/lib/database-operations';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const db = await createDatabaseAdapter();
    const reportOperations = createReportOperations(db);
    
    const { searchParams } = new URL(request.url);
    const filterYear = searchParams.get('year'); // 특정 연도 필터링
    
    // 모든 보고서 가져오기 (날짜만 필요)
    const allReports = await reportOperations.getAll();
    
    // 월별로 그룹화하여 개수 계산
    const monthlyStats: Record<string, { count: number; name: string; year: number; month: number }> = {};
    const availableYears = new Set<number>();
    
    allReports.forEach((report: any) => {
      if (report.date) {
        const date = new Date(report.date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        availableYears.add(year);
        
        // 특정 연도 필터링이 있는 경우 해당 연도만 처리
        if (filterYear && year !== parseInt(filterYear)) {
          return;
        }
        
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('ko-KR', { month: 'long' });
        
        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = {
            count: 0,
            name: monthName,
            year: year,
            month: month
          };
        }
        monthlyStats[monthKey].count++;
      }
    });
    
    // 월별 통계를 배열로 변환하고 최신순으로 정렬
    const statsArray = Object.entries(monthlyStats)
      .map(([key, value]) => ({
        year: value.year,
        month: value.month,
        name: value.name,
        count: value.count
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
    
    // 사용 가능한 연도 목록을 최신순으로 정렬
    const sortedYears = Array.from(availableYears).sort((a, b) => b - a);
    
    return NextResponse.json({ 
      success: true, 
      data: statsArray,
      total: statsArray.length,
      availableYears: sortedYears,
      selectedYear: filterYear ? parseInt(filterYear) : null
    });
  } catch (error) {
    console.error('Failed to get monthly stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get monthly stats' },
      { status: 500 }
    );
  }
}