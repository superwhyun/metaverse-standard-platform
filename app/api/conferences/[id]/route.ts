import { NextRequest, NextResponse } from 'next/server';
import { conferenceOperations } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    const conference = conferenceOperations.getById(id);

    if (!conference) {
      return NextResponse.json({
        success: false,
        error: 'Conference not found'
      }, { status: 404 });
    }

    // Transform database format to frontend format
    const transformedConference = {
      id: conference.id,
      title: conference.title,
      organization: conference.organization,
      location: conference.location,
      description: conference.description,
      date: conference.start_date,
      startDate: conference.start_date,
      endDate: conference.end_date,
      isMultiDay: Boolean(conference.is_multi_day),
      time: conference.is_multi_day ? '종일' : `${conference.start_time || '09:00'}-${conference.end_time || '17:00'}`,
      startTime: conference.start_time,
      endTime: conference.end_time,
      hasReport: Boolean(conference.has_report),
      reportId: conference.report_id,
      reportTitle: conference.report_title,
      createdAt: conference.created_at,
      updatedAt: conference.updated_at
    };

    return NextResponse.json({
      success: true,
      data: transformedConference
    });
  } catch (error) {
    console.error('Error fetching conference:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch conference'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    const body = await request.json();

    // Check if conference exists
    const existingConference = conferenceOperations.getById(id);
    if (!existingConference) {
      return NextResponse.json({
        success: false,
        error: 'Conference not found'
      }, { status: 404 });
    }

    // Transform frontend field names to database field names
    const updateData: any = {};
    
    if (body.title) updateData.title = body.title;
    if (body.organization) updateData.organization = body.organization;
    if (body.location) updateData.location = body.location;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.hasReport !== undefined) updateData.has_report = body.hasReport;
    
    if (body.startDate && body.endDate) {
      const startDate = new Date(body.startDate);
      const endDate = new Date(body.endDate);
      const isMultiDay = startDate.toDateString() !== endDate.toDateString();
      
      updateData.is_multi_day = isMultiDay;
      updateData.start_date = body.startDate;
      updateData.end_date = body.endDate;
      
      // Set time fields for single-day conferences, clear for multi-day
      if (isMultiDay) {
        updateData.start_time = null;
        updateData.end_time = null;
      } else {
        updateData.start_time = body.startTime || null;
        updateData.end_time = body.endTime || null;
      }
    }

    const success = conferenceOperations.update(id, updateData);

    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update conference'
      }, { status: 500 });
    }

    // Fetch updated conference
    const updatedConference = conferenceOperations.getById(id);

    return NextResponse.json({
      success: true,
      data: {
        id: updatedConference.id,
        title: updatedConference.title,
        organization: updatedConference.organization,
        location: updatedConference.location,
        description: updatedConference.description,
        date: updatedConference.start_date,
        startDate: updatedConference.start_date,
        endDate: updatedConference.end_date,
        isMultiDay: Boolean(updatedConference.is_multi_day),
        time: updatedConference.is_multi_day ? '종일' : `${updatedConference.start_time || '09:00'}-${updatedConference.end_time || '17:00'}`,
        startTime: updatedConference.start_time,
        endTime: updatedConference.end_time,
        hasReport: Boolean(updatedConference.has_report),
        reportId: updatedConference.report_id
      }
    });

  } catch (error) {
    console.error('Error updating conference:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update conference'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    
    const success = conferenceOperations.delete(id);

    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Conference not found or failed to delete'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Conference deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting conference:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete conference'
    }, { status: 500 });
  }
}