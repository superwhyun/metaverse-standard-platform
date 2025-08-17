import { NextRequest, NextResponse } from 'next/server';
import { techAnalysisReportOperations } from '@/lib/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { categorizeContent } from '@/lib/openai-categorizer';

// GET tech analysis reports with pagination and search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '8');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    const reports = techAnalysisReportOperations.getPaginated(limit, offset, search, category);
    return NextResponse.json(reports);
  } catch (error) {
    console.error('Failed to fetch tech analysis reports:', error);
    return NextResponse.json({ message: 'Failed to fetch tech analysis reports' }, { status: 500 });
  }
}

// POST a new tech analysis report from a URL
export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ message: 'URL is required' }, { status: 400 });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch (_) {
      return NextResponse.json({ message: 'Invalid URL format' }, { status: 400 });
    }

    // Fetch metadata from Microlink API
    const microlinkResponse = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
    if (!microlinkResponse.ok) {
      throw new Error('Failed to fetch metadata from URL');
    }
    const metadata = await microlinkResponse.json();

    if (metadata.status !== 'success') {
        return NextResponse.json({ message: 'Could not retrieve metadata from the provided URL.' }, { status: 400 });
    }

    const { title, description, image } = metadata.data;

    if (!title) {
        return NextResponse.json({ message: 'Could not find a title for the provided URL.' }, { status: 400 });
    }

    const summary = description || '설명이 없습니다.';
    
    // Automatically categorize the content using OpenAI
    let categoryName: string | null = null;
    try {
      categoryName = await categorizeContent(title, summary);
      console.log(`Auto-categorized content: "${title}" -> category: ${categoryName}`);
    } catch (error) {
      console.error('Failed to auto-categorize content:', error);
      // Continue without categorization if AI fails
    }

    const newReport = techAnalysisReportOperations.create({
      url,
      title,
      summary,
      image_url: image?.url,
      category_name: categoryName
    });

    return NextResponse.json(newReport, { status: 201 });
  } catch (error) {
    console.error('Failed to create tech analysis report:', error);
    return NextResponse.json({ message: (error as Error).message || 'Failed to create tech analysis report' }, { status: 500 });
  }
}

// PUT update a tech analysis report (admin only)
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: '관리자 권한이 필요합니다.' }, { status: 401 });
    }

    const { id, title, summary, url, image_url, category_name } = await request.json();
    
    if (!id || !title) {
      return NextResponse.json({ message: 'ID와 제목이 필요합니다.' }, { status: 400 });
    }

    const reportId = parseInt(id);
    if (isNaN(reportId)) {
      return NextResponse.json({ message: '유효하지 않은 ID입니다.' }, { status: 400 });
    }

    // Check if report exists
    const existingReport = techAnalysisReportOperations.getById(reportId);
    if (!existingReport) {
      return NextResponse.json({ message: '해당 기술 소식을 찾을 수 없습니다.' }, { status: 404 });
    }

    // Update the report
    const updatedReport = techAnalysisReportOperations.update(reportId, {
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
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: '관리자 권한이 필요합니다.' }, { status: 401 });
    }

    // Get ID from query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ message: 'ID가 필요합니다.' }, { status: 400 });
    }

    const reportId = parseInt(id);
    if (isNaN(reportId)) {
      return NextResponse.json({ message: '유효하지 않은 ID입니다.' }, { status: 400 });
    }

    // Check if report exists
    const existingReport = techAnalysisReportOperations.getById(reportId);
    if (!existingReport) {
      return NextResponse.json({ message: '해당 기술 소식을 찾을 수 없습니다.' }, { status: 404 });
    }

    // Delete the report
    techAnalysisReportOperations.delete(reportId);
    
    return NextResponse.json({ message: '기술 소식이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('Failed to delete tech analysis report:', error);
    return NextResponse.json({ message: '기술 소식 삭제에 실패했습니다.' }, { status: 500 });
  }
}