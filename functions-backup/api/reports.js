import { createDatabaseAdapter } from '../../lib/database-adapter.js';
import { createReportOperations } from '../../lib/database-operations.js';
import { getSessionFromRequest } from '../../lib/edge-auth.js';

export async function onRequestGet({ request, env }) {
  try {
    const db = await createDatabaseAdapter(env);
    const reportOperations = createReportOperations(db);
    const url = new URL(request.url);
    const includeContent = url.searchParams.get('includeContent') === 'true';
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')) : undefined;
    const offset = url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')) : undefined;
    
    const allReports = await reportOperations.getAll();

    if (includeContent) {
      return new Response(JSON.stringify({ success: true, data: allReports }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      const reports = allReports.map((report) => ({
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
      
      const sortedReports = reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      let paginatedReports = sortedReports;
      if (limit) {
        const start = offset || 0;
        paginatedReports = sortedReports.slice(start, start + limit);
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        data: paginatedReports,
        total: reports.length,
        hasMore: limit ? (offset || 0) + limit < reports.length : false
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Failed to get reports:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to get reports' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const session = await getSessionFromRequest(request, env.NEXTAUTH_SECRET);
    if (!session || session.user?.role !== 'admin') {
      return new Response(JSON.stringify({ success: false, error: '관리자 권한이 필요합니다.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = await createDatabaseAdapter(env);
    const reportOperations = createReportOperations(db);
    const data = await request.json();
    
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
    
    const result = await reportOperations.create(reportData);
    
    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to create report:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to create report' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}