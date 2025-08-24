import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createReportOperations } from '@/lib/database-operations';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const db = await createDatabaseAdapter();
    const reportOperations = createReportOperations(db);
    
    // 모든 보고서 가져오기 (날짜만 필요)
    const allReports = await reportOperations.getAll();
    
    // 월별로 그룹화하여 개수 계산
    const monthlyStats: Record<string, { count: number; name: string }> = {};
    
    allReports.forEach((report: any) => {
      if (report.date) {
        const date = new Date(report.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
        
        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = {
            count: 0,
            name: monthName
          };
        }
        monthlyStats[monthKey].count++;
      }
    });
    
    // 월별 통계를 배열로 변환하고 최신순으로 정렬
    const statsArray = Object.entries(monthlyStats)
      .map(([key, value]) => {
        const [year, month] = key.split('-');
        return {
          year: parseInt(year),
          month: parseInt(month),
          name: value.name,
          count: value.count
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
    
    return NextResponse.json({ 
      success: true, 
      data: statsArray,
      total: statsArray.length
    });
  } catch (error) {
    console.error('Failed to get monthly stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get monthly stats' },
      { status: 500 }
    );
  }
}