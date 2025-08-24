import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createReportOperations } from '@/lib/database-operations';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const db = await createDatabaseAdapter();
    const reportOperations = createReportOperations(db);
    
    // 모든 보고서 가져오기 (category만 필요)
    const allReports = await reportOperations.getAll();
    
    // 분야별로 그룹화하여 개수 계산
    const categoryStats: Record<string, number> = {};
    
    allReports.forEach((report: any) => {
      const category = report.category || '미분류';
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });
    
    // 분야별 통계를 배열로 변환하고 개수순으로 정렬 (많은 순 → 적은 순)
    const statsArray = Object.entries(categoryStats)
      .map(([name, count]) => ({
        name,
        count
      }))
      .sort((a, b) => {
        // 개수 기준 내림차순, 같으면 이름순
        const countDiff = b.count - a.count;
        if (countDiff !== 0) return countDiff;
        return a.name.localeCompare(b.name, 'ko-KR');
      });
    
    return NextResponse.json({ 
      success: true, 
      data: statsArray,
      total: statsArray.length
    });
  } catch (error) {
    console.error('Failed to get category stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get category stats' },
      { status: 500 }
    );
  }
}