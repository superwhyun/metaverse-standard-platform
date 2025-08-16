import { NextRequest, NextResponse } from 'next/server'
import { reportOperations, conferenceOperations } from '@/lib/database'

export async function GET() {
  try {
    const reports = reportOperations.getAll()
    return NextResponse.json({ success: true, data: reports })
  } catch (error) {
    console.error('Failed to get reports:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get reports' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Map frontend camelCase to database snake_case
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
    }
    
    const result = reportOperations.create(reportData)
    
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Failed to create report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create report' },
      { status: 500 }
    )
  }
}