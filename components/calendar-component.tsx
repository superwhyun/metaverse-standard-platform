"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, FileText, Clock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Conference {
  id: number
  date: string
  startDate: string
  endDate: string
  title: string
  time: string
  location: string
  organization: string
  hasReport: boolean
  reportId?: number
  isMultiDay?: boolean
  reports?: { id: number; title: string }[]
  description?: string
}

interface CalendarComponentProps {
  conferences: Conference[]
  reports?: any[]
  onViewReport: (report: any) => void
  onMonthChange?: (year: number, month: number) => void
  isLoading?: boolean
}

export function CalendarComponent({ conferences, reports = [], onViewReport, onMonthChange, isLoading = false }: CalendarComponentProps) {
  const [mounted, setMounted] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    setMounted(true)
  }, [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month
  const todayDate = today.getDate()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"]

  // Organization color mapping
  const organizationColors = {
    "ISO/IEC": "bg-blue-500 text-white hover:bg-blue-600",
    "ITU-T": "bg-green-500 text-white hover:bg-green-600",
    "IEEE": "bg-purple-500 text-white hover:bg-purple-600",
    "W3C": "bg-orange-500 text-white hover:bg-orange-600",
    "ETSI": "bg-red-500 text-white hover:bg-red-600",
    "3GPP": "bg-teal-500 text-white hover:bg-teal-600",
    "IETF": "bg-indigo-500 text-white hover:bg-indigo-600",
    "기타": "bg-gray-500 text-white hover:bg-gray-600"
  }

  const getOrganizationColor = (organization: string) => {
    return organizationColors[organization as keyof typeof organizationColors] || organizationColors["기타"]
  }

  const getConferencesForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return conferences.filter((conf) => {
      // For backward compatibility, check both date and startDate/endDate
      if (conf.date === dateStr) {
        return true;
      }

      // Check if date falls within conference date range
      if (conf.startDate && conf.endDate) {
        const currentDate = new Date(dateStr);
        const startDate = new Date(conf.startDate);
        const endDate = new Date(conf.endDate);

        return currentDate >= startDate && currentDate <= endDate;
      }

      return false;
    });
  }

  // Helper function to determine conference display style for multi-day events
  const getConferenceDisplayInfo = (conf: Conference, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

    if (!conf.startDate || !conf.endDate) {
      return { isStart: true, isEnd: true, isContinuation: false };
    }

    const currentDate = new Date(dateStr);
    const startDate = new Date(conf.startDate);
    const endDate = new Date(conf.endDate);

    const isStart = currentDate.toDateString() === startDate.toDateString();
    const isEnd = currentDate.toDateString() === endDate.toDateString();
    const isContinuation = !isStart && !isEnd;

    return { isStart, isEnd, isContinuation };
  }

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(year, month + (direction === "next" ? 1 : -1))
    setCurrentDate(newDate)
    if (onMonthChange) {
      onMonthChange(newDate.getFullYear(), newDate.getMonth() + 1)
    }
  }

  const renderCalendarDay = (day: number) => {
    const dayConferences = getConferencesForDate(day)
    const isToday = mounted && isCurrentMonth && day === todayDate

    return (
      <div
        key={day}
        className={`min-h-28 border border-border p-2 transition-all duration-200 hover:bg-muted/50 ${isToday ? "bg-primary/10 border-primary" : ""
          }`}
      >
        <div className={`text-sm font-medium mb-2 ${isToday ? "text-primary font-bold" : ""}`}>
          {day}
          {isToday && (
            <Badge variant="secondary" className="ml-1 text-xs">
              오늘
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          {dayConferences.map((conference, index) => {
            const displayInfo = getConferenceDisplayInfo(conference, day);
            const isMultiDay = conference.startDate && conference.endDate && conference.startDate !== conference.endDate;

            return (
              <TooltipProvider key={`${conference.id}-${day}-${index}`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 relative h-6 flex items-center px-1.5 border shadow-sm ${getOrganizationColor(conference.organization)
                        } ${isMultiDay ? (
                          displayInfo.isContinuation
                            ? "rounded-none border-l-0 border-r-0"
                            : displayInfo.isStart
                              ? "rounded-r-none border-r-0"
                              : displayInfo.isEnd
                                ? "rounded-l-none border-l-0"
                                : ""
                        ) : "rounded"
                        } ${conference.reports && conference.reports.length > 0 ? "ring-1 ring-white/30 brightness-110" : ""}`}
                      onClick={() => {
                        if (conference.reports && conference.reports.length > 0) {
                          const firstReport = conference.reports[0]
                          // 리스트에서 전체 객체를 찾거나, 없으면 최소 정보(id)만으로 onViewReport 호출
                          const fullReport = reports.find(report => report.id === firstReport.id)
                          onViewReport(fullReport || { id: firstReport.id })
                        }
                      }}
                    >
                      <div className="text-xs font-semibold truncate leading-none flex-1">
                        {conference.title}
                      </div>
                      {conference.reports && conference.reports.length > 0 && <FileText className="w-3 h-3 ml-1 flex-shrink-0" />}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="space-y-2">
                      <div className="font-semibold">{conference.title}</div>
                      <div className="text-sm space-y-1">
                        {isMultiDay ? (
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span>{conference.startDate} ~ {conference.endDate}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span>{conference.time}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3" />
                          <span>{conference.location}</span>
                        </div>
                        <div className="text-primary">주최: {conference.organization}</div>
                        {conference.description && (
                          <div className="text-sm border-t pt-2 mt-2">
                            <div className="font-medium mb-1">회의 설명</div>
                            <div className="text-foreground">{conference.description}</div>
                          </div>
                        )}
                        {conference.reports && conference.reports.length > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-primary">
                              <FileText className="w-3 h-3" />
                              <span>보고서 {conference.reports.length}개 (클릭하여 보기)</span>
                            </div>
                            <div className="text-xs space-y-1">
                              {conference.reports.map((report, index) => (
                                <div key={report.id} className="text-foreground">
                                  {index + 1}. {report.title}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>
    );
  };

  const days = []

  // Empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="min-h-28 border border-border bg-muted/20"></div>)
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(renderCalendarDay(day))
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold font-playfair text-primary">
            {year}년 {monthNames[month]}
          </h2>
          <p className="text-muted-foreground mt-1">국제회의 일정</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")} disabled={isLoading}>
            <ChevronLeft className="w-4 h-4" />
            이전달
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const today = new Date()
            setCurrentDate(today)
            if (onMonthChange) {
              onMonthChange(today.getFullYear(), today.getMonth() + 1)
            }
          }} className="px-4" disabled={isLoading}>
            오늘
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateMonth("next")} disabled={isLoading}>
            다음달
            <ChevronRight className="w-4 h-4" />
          </Button>
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              로딩 중...
            </div>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-hidden border rounded-lg">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"].map((day, index) => (
            <div
              key={day}
              className={`p-4 text-center font-semibold bg-muted/50 border-r border-border last:border-r-0 ${index === 0 ? "text-red-600" : index === 6 ? "text-blue-600" : ""
                }`}
            >
              <div className="hidden sm:block">{day}</div>
              <div className="sm:hidden">{day.charAt(0)}</div>
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">{days}</div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary rounded"></div>
          <span>보고서 있음</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-secondary rounded"></div>
          <span>회의만 있음</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary rounded"></div>
          <span>오늘</span>
        </div>
        <div className="text-muted-foreground">회의를 클릭하면 상세 정보를 볼 수 있습니다</div>
      </div>
    </div>
  )
}
