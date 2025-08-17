import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'edge';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createConferenceOperations } from '@/lib/database-operations';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest, { params, env }: { params: { id: string }, env: any }) {
  try {
    const db = createDatabaseAdapter(env);
    const conferenceOperations = createConferenceOperations(db);
    const id = parseInt(params.id, 10);
    const conference = await conferenceOperations.getById(id);

    if (!conference) {
      return NextResponse.json({ success: false, error: 'Conference not found' }, { status: 404 });
    }

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
      hasReport: conference.reports && conference.reports.length > 0,
      reports: conference.reports || [],
      createdAt: conference.created_at,
      updatedAt: conference.updated_at
    };

    return NextResponse.json({ success: true, data: transformedConference });
  } catch (error) {
    console.error('Error fetching conference:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch conference' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params, env }: { params: { id: string }, env: any }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, error: '관리자 권한이 필요합니다.' }, { status: 401 });
    }

    const db = createDatabaseAdapter(env);
    const conferenceOperations = createConferenceOperations(db);
    const id = parseInt(params.id, 10);
    const body = await request.json();

    const existingConference = await conferenceOperations.getById(id);
    if (!existingConference) {
      return NextResponse.json({ success: false, error: 'Conference not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (body.title) updateData.title = body.title;
    if (body.organization) updateData.organization = body.organization;
    if (body.location) updateData.location = body.location;
    if (body.description !== undefined) updateData.description = body.description;
    
    if (body.startDate && body.endDate) {
      const startDate = new Date(body.startDate);
      const endDate = new Date(body.endDate);
      const isMultiDay = startDate.toDateString() !== endDate.toDateString();
      
      updateData.is_multi_day = isMultiDay;
      updateData.start_date = body.startDate;
      updateData.end_date = body.endDate;
      
      if (isMultiDay) {
        updateData.start_time = null;
        updateData.end_time = null;
      } else {
        updateData.start_time = body.startTime || null;
        updateData.end_time = body.endTime || null;
      }
    }

    const success = await conferenceOperations.update(id, updateData);

    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to update conference' }, { status: 500 });
    }

    const updatedConference = await conferenceOperations.getById(id);

    return NextResponse.json({ success: true, data: updatedConference });
  } catch (error) {
    console.error('Error updating conference:', error);
    return NextResponse.json({ success: false, error: 'Failed to update conference' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params, env }: { params: { id: string }, env: any }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, error: '관리자 권한이 필요합니다.' }, { status: 401 });
    }

    const db = createDatabaseAdapter(env);
    const conferenceOperations = createConferenceOperations(db);
    const id = parseInt(params.id, 10);
    
    const success = await conferenceOperations.delete(id);

    if (!success) {
      return NextResponse.json({ success: false, error: 'Conference not found or failed to delete' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Conference deleted successfully' });
  } catch (error) {
    console.error('Error deleting conference:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete conference' }, { status: 500 });
  }
}
