"use client"

import React from "react"
import { ChevronDown, ChevronUp, Calendar, Tag as TagIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useGroupedReports, Report } from "@/hooks/useGroupedReports"

type ReactNode = React.ReactNode

interface BaseStat {
  name?: string
  count?: number
  // Allow arbitrary fields (e.g., year/month for monthly)
  [key: string]: any
}

interface GroupedReportsProps<S extends BaseStat> {
  title: string
  subtitle: string
  icon?: ReactNode
  statsUrl: string
  getKey: (stat: S) => string
  getName: (stat: S) => string
  getCount: (stat: S) => number
  buildReportsUrl: (stat: S) => string
  onReportClick: (report: Report) => void
  limit?: number
  loadingStatsText?: string
  loadingReportsText?: string
  emptyReportsText?: string
  emptyStatsTitle?: string
  emptyStatsDescription?: string
  renderReportCard?: (report: Report) => ReactNode
}

export function GroupedReports<S extends BaseStat>(props: GroupedReportsProps<S>) {
  const {
    title,
    subtitle,
    icon,
    statsUrl,
    getKey,
    getName,
    getCount,
    buildReportsUrl,
    onReportClick,
    limit,
    loadingStatsText = "통계를 불러오는 중...",
    loadingReportsText = "보고서를 불러오는 중...",
    emptyReportsText = "해당 항목의 보고서가 없습니다.",
    emptyStatsTitle = "보고서가 없습니다",
    emptyStatsDescription = "보고서가 등록되면 여기에 표시됩니다.",
    renderReportCard,
  } = props

  const {
    isLoading,
    organizedStats,
    selectedKey,
    loadingKeys,
    loadedReports,
    toggle,
  } = useGroupedReports<S>({ statsUrl, getKey, buildReportsUrl })

  const activeStat = selectedKey
    ? organizedStats.find((s) => getKey(s) === selectedKey)
    : undefined

  const DefaultCard = (report: Report) => (
    <Card
      key={report.id}
      className="cursor-pointer hover:shadow-lg transition-colors duration-200 group bg-card/80 dark:bg-card/60 border-2 border-border/80 dark:border-gray-500/80 hover:border-primary/70 dark:hover:border-primary/80 hover:bg-card dark:hover:bg-card/80"
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
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{report.summary}</p>
        <div className="flex flex-wrap gap-1">
          {(Array.isArray(report.tags) ? report.tags : []).slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              <TagIcon className="w-3 h-3 mr-1" />
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
  )

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold font-playfair text-primary mb-2">{title}</h2>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-muted-foreground">{loadingStatsText}</div>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-4">
          <div>
            {activeStat && (
              <Card className="overflow-hidden py-0 gap-0 transition-colors duration-300 bg-primary/10 dark:bg-primary/20 hover:bg-primary/15 dark:hover:bg-primary/25 border border-primary/40">
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors p-2"
                  onClick={() => toggle(activeStat)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {icon}
                      <CardTitle className="text-base font-playfair">{getName(activeStat)}</CardTitle>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                        {getCount(activeStat)}
                      </Badge>
                    </div>
                    <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Card>
            )}

            <div
              className={`overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out ${
                activeStat ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              {activeStat && (
                <Card className="py-0 gap-0 mt-4">
                  <CardContent className="p-4">
                    {(() => {
                      const key = getKey(activeStat)
                      const isLoadingGroup = loadingKeys.includes(key)
                      const reports = loadedReports[key] || []

                      if (isLoadingGroup) {
                        return (
                          <div className="text-center py-4">
                            <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
                            <div className="text-sm text-muted-foreground">{loadingReportsText}</div>
                          </div>
                        )
                      } else if (reports.length > 0) {
                        const render = renderReportCard || DefaultCard
                        const items = typeof limit === 'number' ? reports.slice(0, limit) : reports
                        return (
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {items.map((r) => render(r))}
                          </div>
                        )
                      }
                      return (
                        <div className="text-center py-4 text-muted-foreground">{emptyReportsText}</div>
                      )
                    })()}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(selectedKey ? organizedStats.slice(1) : organizedStats).map((stat) => {
              const key = getKey(stat)
              return (
                <Card key={key} className="overflow-hidden py-0 gap-0">
                  <CardHeader
                    className="cursor-pointer transition-colors hover:bg-muted/50 p-2"
                    onClick={() => toggle(stat)}
                  >
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {icon}
                        <div className="font-playfair text-base">{getName(stat)}</div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                          {getCount(stat)}
                        </Badge>
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    </CardTitle>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {!isLoading && organizedStats.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <div className="text-lg font-medium mb-2">{emptyStatsTitle}</div>
          <div className="text-muted-foreground">{emptyStatsDescription}</div>
        </div>
      )}
    </div>
  )
}
