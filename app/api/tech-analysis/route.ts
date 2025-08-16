import { NextResponse } from 'next/server';
import { techAnalysisReportOperations } from '@/lib/database';

// GET all tech analysis reports
export async function GET() {
  try {
    const reports = techAnalysisReportOperations.getAll();
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

    const newReport = techAnalysisReportOperations.create({
      url,
      title,
      summary: description,
      image_url: image?.url
    });

    return NextResponse.json(newReport, { status: 201 });
  } catch (error) {
    console.error('Failed to create tech analysis report:', error);
    return NextResponse.json({ message: (error as Error).message || 'Failed to create tech analysis report' }, { status: 500 });
  }
}