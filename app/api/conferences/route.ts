import { NextRequest, NextResponse } from 'next/server';
import { conferenceOperations } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let conferences;

    if (year && month) {
      // Get conferences for specific month
      conferences = conferenceOperations.getByMonth(parseInt(year), parseInt(month));
    } else if (startDate && endDate) {
      // Get conferences for date range
      conferences = conferenceOperations.getByDateRange(startDate, endDate);
    } else {
      // Get all conferences
      conferences = conferenceOperations.getAll();
    }

    // Transform database format to frontend format
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['title', 'organization', 'startDate', 'endDate'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          error: `${field} is required`
        }, { status: 400 });
      }
    }

    // Determine if conference is multi-day
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    const isMultiDay = startDate.toDateString() !== endDate.toDateString();

    // Prepare conference data
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

    const newConference = conferenceOperations.create(conferenceData);

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