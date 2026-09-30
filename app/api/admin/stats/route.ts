import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { getSessionFromRequest } from '@/lib/edge-auth';

export const runtime = 'edge';

interface DashboardStats {
  totalConferences: number;
  conferencesWithReports: number;
  totalReports: number;
  monthlyConferences: number;
  totalTrendInsights: number;
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ success: false, error: '관리자 권한이 필요합니다.' }, { status: 401 });
  }

  const now = new Date();
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get('year') ?? now.getFullYear());
  const month = Number(searchParams.get('month') ?? now.getMonth() + 1);
  if (!Number.isInteger(year) || year < 1 || year > 9999 || !Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ success: false, error: '유효하지 않은 연월입니다.' }, { status: 400 });
  }

  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextMonthStart = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

  try {
    const db = await createDatabaseAdapter();
    const stats = await db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM conferences) AS totalConferences,
        (SELECT COUNT(*) FROM conferences AS c
          WHERE EXISTS (SELECT 1 FROM reports AS r WHERE r.conference_id = c.id)) AS conferencesWithReports,
        (SELECT COUNT(*) FROM reports) AS totalReports,
        (SELECT COUNT(*) FROM conferences
          WHERE start_date >= ? AND start_date < ?) AS monthlyConferences,
        (SELECT COUNT(*) FROM trend_insights) AS totalTrendInsights
    `).get([monthStart, nextMonthStart]) as DashboardStats | null;

    if (!stats) throw new Error('Dashboard stats query returned no row');
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Failed to load admin dashboard stats:', error);
    return NextResponse.json({ success: false, error: '통계를 불러오지 못했습니다.' }, { status: 500 });
  }
}
