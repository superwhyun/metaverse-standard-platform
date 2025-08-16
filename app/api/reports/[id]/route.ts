import { NextRequest, NextResponse } from 'next/server'
import { reportOperations, conferenceOperations } from '@/lib/database'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await context.params
    const id = parseInt(paramId)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid report ID' },
        { status: 400 }
      )
    }
    
    const report = reportOperations.getById(id)
    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, data: report })
  } catch (error) {
    console.error('Failed to get report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get report' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await context.params
    const id = parseInt(paramId)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid report ID' },
        { status: 400 }
      )
    }
    
    const data = await request.json()
    
    // 기존 보고서 정보 조회 (회의 ID 변경 확인용)
    const existingReport = reportOperations.getById(id)
    if (!existingReport) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      )
    }
    
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
    
    const result = reportOperations.update(id, reportData)
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      )
    }
    
    // 회의 연결 변경 시 특별한 처리 불필요 (reports 배열로 자동 계산됨)
    
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Failed to update report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update report' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await context.params
    const id = parseInt(paramId)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid report ID' },
        { status: 400 }
      )
    }
    
    // 삭제하기 전에 보고서 정보 조회 (회의 ID 확인용)
    const reportToDelete = reportOperations.getById(id)
    if (!reportToDelete) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      )
    }
    
    const success = reportOperations.delete(id)
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete report' },
        { status: 500 }
      )
    }
    
    // 보고서 삭제 완료 (연관된 회의의 has_report 상태는 자동으로 reports 배열로 계산됨)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete report' },
      { status: 500 }
    )
  }
}