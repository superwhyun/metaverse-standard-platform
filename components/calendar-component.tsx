"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, FileText, Clock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Conference {
  id: number
  date: string
  title: string
  time: string
  location: string
  organization: string
  hasReport: boolean
  reportId?: number
}

interface CalendarComponentProps {
  conferences: Conference[]
  onReportClick: (reportId: number) => void
}

export function CalendarComponent({ conferences, onReportClick }: CalendarComponentProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

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

  const getConferencesForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return conferences.filter((conf) => conf.date === dateStr)
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(new Date(year, month + (direction === "next" ? 1 : -1)))
  }

  const renderCalendarDay = (day: number) => {
    const dayConferences = getConferencesForDate(day)
    const isToday = isCurrentMonth && day === todayDate

    return (
      <div
        key={day}
        className={`min-h-28 border border-border p-2 transition-all duration-200 hover:bg-muted/50 ${
          isToday ? "bg-primary/10 border-primary" : ""
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
          {dayConferences.map((conference) => (
            <TooltipProvider key={conference.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card
                    className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                      conference.hasReport
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    }`}
                    onClick={() => {
                      if (conference.hasReport && conference.reportId) {
                        onReportClick(conference.reportId)
                      }
                    }}
                  >
                    <CardContent className="p-2">
                      <div className="text-xs font-medium truncate">{conference.title}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">{conference.time}</span>
                        {conference.hasReport && <FileText className="w-3 h-3 ml-auto" />}
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-2">
                    <div className="font-semibold">{conference.title}</div>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>{conference.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        <span>{conference.location}</span>
                      </div>
                      <div className="text-muted-foreground">주최: {conference.organization}</div>
                      {conference.hasReport && (
                        <div className="flex items-center gap-2 text-primary">
                          <FileText className="w-3 h-3" />
                          <span>보고서 있음 (클릭하여 보기)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
    )
  }

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
          <h2 className="text-3xl font-bold font-serif text-primary">
            {year}년 {monthNames[month]}
          </h2>
          <p className="text-muted-foreground mt-1">국제회의 일정</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
            <ChevronLeft className="w-4 h-4" />
            이전달
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="px-4">
            오늘
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
            다음달
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"].map((day, index) => (
              <div
                key={day}
                className={`p-4 text-center font-semibold bg-muted/50 border-r border-border last:border-r-0 ${
                  index === 0 ? "text-red-600" : index === 6 ? "text-blue-600" : ""
                }`}
              >
                <div className="hidden sm:block">{day}</div>
                <div className="sm:hidden">{day.charAt(0)}</div>
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">{days}</div>
        </CardContent>
      </Card>

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
