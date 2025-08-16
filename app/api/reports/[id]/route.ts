import { NextRequest, NextResponse } from 'next/server'
import { reportOperations } from '@/lib/database'

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
    
    const success = reportOperations.delete(id)
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete report' },
      { status: 500 }
    )
  }
}