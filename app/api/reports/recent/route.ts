import { NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createReportOperations } from '@/lib/database-operations';

export const runtime = 'edge';

export async function GET() {
  try {
    const db = await createDatabaseAdapter();
    const reportOperations = createReportOperations(db);
    
    const recentReports = await reportOperations.getSummaries({ limit: 6 });
    
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
