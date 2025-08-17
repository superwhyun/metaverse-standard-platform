import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'edge';
import { createDatabaseAdapter } from '@/lib/database-adapter';
import { createConferenceOperations } from '@/lib/database-operations';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest, { env }: { env: any }) {
  try {
    const db = createDatabaseAdapter(env);
    const conferenceOperations = createConferenceOperations(db);
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let conferences;

    if (year && month) {
      conferences = await conferenceOperations.getByMonth(parseInt(year), parseInt(month));
    } else if (startDate && endDate) {
      conferences = await conferenceOperations.getByDateRange(startDate, endDate);
    } else {
      conferences = await conferenceOperations.getAll();
    }

    const transformedConferences = conferences.map((conf: any) => ({
      id: conf.id,
      title: conf.title,
      organization: conf.organization,
      location: conf.location,
      description: conf.description,
      date: conf.startDate || conf.start_date,
      startDate: conf.startDate || conf.start_date,
      endDate: conf.endDate || conf.end_date,
      isMultiDay: conf.isMultiDay || Boolean(conf.is_multi_day),
      time: (conf.isMultiDay || conf.is_multi_day) ? '종일' : `${conf.startTime || conf.start_time || '09:00'}-${conf.endTime || conf.end_time || '17:00'}`,
      startTime: conf.startTime || conf.start_time,
      endTime: conf.endTime || conf.end_time,
      hasReport: conf.hasReport || Boolean(conf.reports && conf.reports.length > 0),
      reports: conf.reports || [],
      createdAt: conf.created_at,
      updatedAt: conf.updated_at
    }));

    return NextResponse.json({
      success: true,
      data: transformedConferences
    });
  } catch (error) {
    console.error('Error fetching conferences:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch conferences'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { env }: { env: any }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, error: '관리자 권한이 필요합니다.' }, { status: 401 });
    }

    const db = createDatabaseAdapter(env);
    const conferenceOperations = createConferenceOperations(db);
    const body = await request.json();
    
    const requiredFields = ['title', 'organization', 'startDate', 'endDate'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          error: `${field} is required`
        }, { status: 400 });
      }
    }

    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    const isMultiDay = startDate.toDateString() !== endDate.toDateString();

    const conferenceData = {
      title: body.title,
      organization: body.organization,
      location: body.location || null,
      description: body.description || null,
      start_date: body.startDate,
      end_date: body.endDate,
      is_multi_day: isMultiDay,
      start_time: isMultiDay ? null : body.startTime,
      end_time: isMultiDay ? null : body.endTime
    };

    const newConference = await conferenceOperations.create(conferenceData);

    return NextResponse.json({
      success: true,
      data: {
        id: newConference.id,
        title: newConference.title,
        organization: newConference.organization,
        location: newConference.location,
        description: newConference.description,
        date: newConference.start_date,
        startDate: newConference.start_date,
        endDate: newConference.end_date,
        isMultiDay: newConference.is_multi_day,
        time: newConference.is_multi_day ? '종일' : `${newConference.start_time || '09:00'}-${newConference.end_time || '17:00'}`,
        startTime: newConference.start_time,
        endTime: newConference.end_time,
        hasReport: false,
        reports: []
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating conference:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create conference'
    }, { status: 500 });
  }
}
