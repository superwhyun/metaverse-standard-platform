"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Calendar, FileText, Tag } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Report {
  id: number
  title: string
  date: string
  summary: string
  category: string
  organization: string
  tags: string[]
}

interface MonthlyReportsProps {
  reports: Report[]
  onReportClick: (report: Report) => void
}

export function MonthlyReports({ reports, onReportClick }: MonthlyReportsProps) {
  const [expandedMonths, setExpandedMonths] = useState<string[]>([])

  // Group reports by month
  const reportsByMonth = reports.reduce(
    (acc, report) => {
      const date = new Date(report.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const monthName = date.toLocaleDateString("ko-KR", { year: "numeric", month: "long" })

      if (!acc[monthKey]) {
        acc[monthKey] = {
          name: monthName,
          reports: [],
        }
      }
      acc[monthKey].reports.push(report)
      return acc
    },
    {} as Record<string, { name: string; reports: Report[] }>,
  )

  // Sort months in descending order (most recent first)
  const sortedMonths = Object.entries(reportsByMonth).sort(([a], [b]) => b.localeCompare(a))

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths((prev) => (prev.includes(monthKey) ? prev.filter((m) => m !== monthKey) : [...prev, monthKey]))
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold font-serif text-primary mb-4">월별 표준화 동향 보고서</h2>
          <p className="text-muted-foreground">최근 등록된 메타버스 관련 표준화 동향 보고서를 월별로 확인하세요</p>
        </div>

        <div className="space-y-4">
          {sortedMonths.map(([monthKey, monthData]) => (
            <Card key={monthKey} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleMonth(monthKey)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <CardTitle className="text-xl">{monthData.name}</CardTitle>
                    <Badge variant="secondary" className="ml-2">
                      {monthData.reports.length}개 보고서
                    </Badge>
                  </div>
                  {expandedMonths.includes(monthKey) ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>

              {expandedMonths.includes(monthKey) && (
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {monthData.reports
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((report) => (
                        <div
                          key={report.id}
                          className="border rounded-lg p-4 hover:bg-muted/30 cursor-pointer transition-colors"
                          onClick={() => onReportClick(report)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                              {report.title}
                            </h3>
                            <Badge variant="outline" className="ml-2 shrink-0">
                              {report.organization}
                            </Badge>
                          </div>

                          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{report.summary}</p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {new Date(report.date).toLocaleDateString("ko-KR")}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {report.category}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-1">
                              <Tag className="w-3 h-3 text-muted-foreground" />
                              <div className="flex gap-1">
                                {(Array.isArray(report.tags) ? report.tags : []).slice(0, 2).map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {(Array.isArray(report.tags) ? report.tags : []).length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{(Array.isArray(report.tags) ? report.tags : []).length - 2}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>아래 화살표 키를 눌러 표준 검색 페이지로 이동하세요</p>
        </div>
      </div>
    </div>
  )
}
