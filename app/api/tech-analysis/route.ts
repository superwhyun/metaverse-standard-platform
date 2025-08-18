import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createTechAnalysisReportOperations } from '@/lib/database-operations';
import { getSessionFromRequest } from '@/lib/edge-auth';
import { categorizeContent } from '@/lib/openai-categorizer';

export const runtime = 'edge';

// GET tech analysis reports with pagination and search
export async function GET(request: NextRequest) {
  try {
    const db = await createDatabaseAdapter();
    const techAnalysisReportOperations = createTechAnalysisReportOperations(db);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '8');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    const reports = await techAnalysisReportOperations.getPaginated(limit, offset, search, category);
    return NextResponse.json(reports);
  } catch (error) {
    console.error('Failed to fetch tech analysis reports:', error);
    return NextResponse.json({ message: 'Failed to fetch tech analysis reports' }, { status: 500 });
  }
}

// POST a new tech analysis report from a URL
export async function POST(request: NextRequest) {
  try {
    const db = await createDatabaseAdapter();
    const techAnalysisReportOperations = createTechAnalysisReportOperations(db);
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ message: 'URL is required' }, { status: 400 });
    }

    try {
      new URL(url);
    } catch (_) {
      return NextResponse.json({ message: 'Invalid URL format' }, { status: 400 });
    }

    console.log('About to fetch microlink for URL:', url);
    const microlinkResponse = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
    console.log('Microlink response status:', microlinkResponse.status);
    
    if (!microlinkResponse.ok) {
      throw new Error('Failed to fetch metadata from URL');
    }
    const metadata = await microlinkResponse.json();
    console.log('Microlink metadata status:', metadata.status);

    if (metadata.status !== 'success') {
        return NextResponse.json({ message: 'Could not retrieve metadata from the provided URL.' }, { status: 400 });
    }

    console.log('Metadata data keys:', Object.keys(metadata.data || {}));
    const { title, description, image } = metadata.data;
    console.log('Raw extracted values:', { 
      title, 
      description, 
      image,
      hasImageUrl: !!image?.url
    });

    if (!title) {
        return NextResponse.json({ message: 'Could not find a title for the provided URL.' }, { status: 400 });
    }

    const summary = description || '설명이 없습니다.';
    
    let categoryName: string | null = null;
    try {
      // Categorizer will create its own db adapter
      categoryName = await categorizeContent(title, summary);
      console.log(`Auto-categorized content: "${title}" -> category: ${categoryName}`);
    } catch (error) {
      console.error('Failed to auto-categorize content:', error);
    }

    console.log('BEFORE CREATE - About to create with values:', {
      url: `"${url}"`,
      title: `"${title}"`,
      summary: `"${summary}"`,
      categoryName: `"${categoryName}"`,
      imageUrl: image?.url ? `"${image.url}"` : 'undefined'
    });
    
    // Debug logging before create call
    const createParams = {
      url,
      title,
      summary: summary || null,
      image_url: image?.url || null,
      category_name: categoryName || null
    };
    
    console.log('FINAL CREATE PARAMS:', {
      url: createParams.url,
      title: createParams.title,
      summary: createParams.summary,
      image_url: createParams.image_url,
      category_name: createParams.category_name
    });

    const newReport = await techAnalysisReportOperations.create(createParams);

    return NextResponse.json(newReport, { status: 201 });
  } catch (error) {
    console.error('Failed to create tech analysis report:', error);
    return NextResponse.json({ message: (error as Error).message || 'Failed to create tech analysis report' }, { status: 500 });
  }
}

// PUT update a tech analysis report (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ message: '관리자 권한이 필요합니다.' }, { status: 401 });
    }

    const db = await createDatabaseAdapter();
    const techAnalysisReportOperations = createTechAnalysisReportOperations(db);
    const { id, title, summary, url, image_url, category_name } = await request.json();
    
    if (!id || !title) {
      return NextResponse.json({ message: 'ID와 제목이 필요합니다.' }, { status: 400 });
    }

    const reportId = parseInt(id);
    if (isNaN(reportId)) {
      return NextResponse.json({ message: '유효하지 않은 ID입니다.' }, { status: 400 });
    }

    const existingReport = await techAnalysisReportOperations.getById(reportId);
    if (!existingReport) {
      return NextResponse.json({ message: '해당 기술 소식을 찾을 수 없습니다.' }, { status: 404 });
    }

    const updatedReport = await techAnalysisReportOperations.update(reportId, {
      title,
      summary: summary || '설명이 없습니다.',
      url,
      image_url,
      category_name: category_name || null
    });
    
    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error('Failed to update tech analysis report:', error);
    return NextResponse.json({ message: '기술 소식 수정에 실패했습니다.' }, { status: 500 });
  }
}

// DELETE a tech analysis report (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ message: '관리자 권한이 필요합니다.' }, { status: 401 });
    }

    const db = await createDatabaseAdapter();
    const techAnalysisReportOperations = createTechAnalysisReportOperations(db);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ message: 'ID가 필요합니다.' }, { status: 400 });
    }

    const reportId = parseInt(id);
    if (isNaN(reportId)) {
      return NextResponse.json({ message: '유효하지 않은 ID입니다.' }, { status: 400 });
    }

    const existingReport = await techAnalysisReportOperations.getById(reportId);
    if (!existingReport) {
      return NextResponse.json({ message: '해당 기술 소식을 찾을 수 없습니다.' }, { status: 404 });
    }

    await techAnalysisReportOperations.delete(reportId);
    
    return NextResponse.json({ message: '기술 소식이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('Failed to delete tech analysis report:', error);
    return NextResponse.json({ message: '기술 소식 삭제에 실패했습니다.' }, { status: 500 });
  }
}
