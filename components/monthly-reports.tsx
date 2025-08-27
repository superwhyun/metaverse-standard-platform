"use client"

import { useState, useEffect } from "react"
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

interface MonthlyStats {
  name: string
  count: number
  year: number
  month: number
}

interface MonthlyReportsProps {
  onReportClick: (report: Report) => void
}

export function MonthlyReports({ onReportClick }: MonthlyReportsProps) {
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([])
  const [expandedMonths, setExpandedMonths] = useState<string[]>([])
  const [loadedReports, setLoadedReports] = useState<Record<string, Report[]>>({})
  const [loadingMonths, setLoadingMonths] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load monthly statistics on component mount
  useEffect(() => {
    loadMonthlyStats()
  }, [])

  const loadMonthlyStats = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/reports/stats/monthly')
      const result = await response.json()
      if (result.success) {
        setMonthlyStats(result.data || [])
      }
    } catch (error) {
      console.error('Failed to load monthly stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMonthReports = async (year: number, month: number) => {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`
    
    if (loadedReports[monthKey]) {
      return // Already loaded
    }

    setLoadingMonths(prev => [...prev, monthKey])
    try {
      const response = await fetch(`/api/reports/by-month/${year}/${month}`)
      const result = await response.json()
      if (result.success) {
        setLoadedReports(prev => ({
          ...prev,
          [monthKey]: result.data || []
        }))
      }
    } catch (error) {
      console.error('Failed to load month reports:', error)
    } finally {
      setLoadingMonths(prev => prev.filter(m => m !== monthKey))
    }
  }

  const toggleMonth = async (stat: MonthlyStats) => {
    const monthKey = `${stat.year}-${String(stat.month).padStart(2, '0')}`
    
    if (expandedMonths.includes(monthKey)) {
      // Collapse - close this month
      setExpandedMonths([])
    } else {
      // Expand - close all others and open this one
      setExpandedMonths([monthKey])
      await loadMonthReports(stat.year, stat.month)
    }
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold font-playfair text-primary mb-4">월별 표준화 동향 보고서</h2>
          <p className="text-muted-foreground">최근 등록된 메타버스 관련 표준화 동향 보고서를 월별로 확인하세요</p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-muted-foreground">월별 통계를 불러오는 중...</div>
          </div>
        )}

        {/* Monthly Stats */}
        {!isLoading && (
          <div className="space-y-4">
            {monthlyStats.map((stat) => {
              const monthKey = `${stat.year}-${String(stat.month).padStart(2, '0')}`
              const isExpanded = expandedMonths.includes(monthKey)
              const isLoadingMonth = loadingMonths.includes(monthKey)
              const reports = loadedReports[monthKey] || []
              
              return (
                <Card key={monthKey} className="overflow-hidden">
                  <CardHeader
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleMonth(stat)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-primary" />
                        <CardTitle className="text-xl">{stat.name}</CardTitle>
                        <Badge variant="secondary" className="ml-2">
                          {stat.count}개 보고서
                        </Badge>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>

                  <div 
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${
                      isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <CardContent className="pt-0">
                      {isLoadingMonth ? (
                        <div className="text-center py-6">
                          <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
                          <div className="text-sm text-muted-foreground">보고서를 불러오는 중...</div>
                        </div>
                      ) : reports.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {reports.slice(0, 6).map((report) => (
                            <Card
                              key={report.id}
                              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 group bg-card/80 dark:bg-card/60 border-2 border-border/80 dark:border-gray-500/80 hover:border-primary/70 dark:hover:border-primary/80 hover:bg-card dark:hover:bg-card/80"
                              onClick={() => onReportClick(report)}
                            >
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {report.category}
                                  </Badge>
                                  <div className="text-xs text-muted-foreground">
                                    {report.organization}
                                  </div>
                                </div>
                                <CardTitle className="font-playfair text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                  {report.title}
                                </CardTitle>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(report.date).toLocaleDateString("ko-KR")}
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{report.summary}</p>

                                <div className="flex flex-wrap gap-1">
                                  {(Array.isArray(report.tags) ? report.tags : []).slice(0, 3).map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      <Tag className="w-3 h-3 mr-1" />
                                      {tag}
                                    </Badge>
                                  ))}
                                  {(Array.isArray(report.tags) ? report.tags : []).length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{(Array.isArray(report.tags) ? report.tags : []).length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          이 달에 등록된 보고서가 없습니다.
                        </div>
                      )}
                    </CardContent>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && monthlyStats.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <div className="text-lg font-medium mb-2">월별 보고서가 없습니다</div>
            <div className="text-muted-foreground">보고서가 등록되면 여기에 월별로 표시됩니다.</div>
          </div>
        )}

        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>아래 화살표 키를 눌러 표준화 기구별 동향으로 이동하세요</p>
        </div>
      </div>
    </div>
  )
}
