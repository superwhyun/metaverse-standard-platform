import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'edge';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createReportOperations } from '@/lib/database-operations';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest, { params, env }: { params: { id: string }, env: any }) {
  try {
    const db = createDatabaseAdapter(env);
    const reportOperations = createReportOperations(db);
    const id = parseInt(params.id, 10);
    
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid report ID' }, { status: 400 });
    }
    
    const report = await reportOperations.getById(id);
    if (!report) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error('Failed to get report:', error);
    return NextResponse.json({ success: false, error: 'Failed to get report' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params, env }: { params: { id: string }, env: any }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, error: '관리자 권한이 필요합니다.' }, { status: 401 });
    }

    const db = createDatabaseAdapter(env);
    const reportOperations = createReportOperations(db);
    const id = parseInt(params.id, 10);
    
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid report ID' }, { status: 400 });
    }
    
    const data = await request.json();
    
    const existingReport = await reportOperations.getById(id);
    if (!existingReport) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
    }
    
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
    
    const result = await reportOperations.update(id, reportData);
    if (!result) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Failed to update report:', error);
    return NextResponse.json({ success: false, error: 'Failed to update report' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params, env }: { params: { id: string }, env: any }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, error: '관리자 권한이 필요합니다.' }, { status: 401 });
    }

    const db = createDatabaseAdapter(env);
    const reportOperations = createReportOperations(db);
    const id = parseInt(params.id, 10);
    
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid report ID' }, { status: 400 });
    }
    
    const reportToDelete = await reportOperations.getById(id);
    if (!reportToDelete) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
    }
    
    const success = await reportOperations.delete(id);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to delete report' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete report:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete report' }, { status: 500 });
  }
}
