import { NextRequest, NextResponse } from 'next/server'
import { reportOperations, conferenceOperations } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeContent = searchParams.get('includeContent') === 'true'
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined
    
    if (includeContent) {
      // 상세 보기용 - 전체 내용 포함
      const reports = reportOperations.getAll()
      return NextResponse.json({ success: true, data: reports })
    } else {
      // 리스트용 - content 제외하고 요약 정보만
      const reports = reportOperations.getAll().map(report => ({
        id: report.id,
        title: report.title,
        date: report.date,
        summary: report.summary,
        category: report.category,
        organization: report.organization,
        tags: report.tags,
        download_url: report.download_url,
        conference_id: report.conference_id
        // content 제외!
      }))
      
      // 날짜순으로 정렬 (최신이 먼저)
      const sortedReports = reports.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })
      
      // 페이지네이션 적용
      let paginatedReports = sortedReports
      if (limit) {
        const start = offset || 0
        paginatedReports = sortedReports.slice(start, start + limit)
      }
      
      return NextResponse.json({ 
        success: true, 
        data: paginatedReports,
        total: reports.length,
        hasMore: limit ? (offset || 0) + limit < reports.length : false
      })
    }
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