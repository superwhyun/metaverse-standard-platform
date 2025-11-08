"use client"

import React from "react"
import { Tag as TagIcon, Calendar, Edit } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GroupedReports } from "@/components/grouped-reports"

interface CategoryStats {
  name: string
  count: number
}

interface CategoryReportsProps {
  onReportClick: (report: any) => void
  isAdmin?: boolean
  onEdit?: (report: any) => void
}

export function CategoryReports({ onReportClick, isAdmin = false, onEdit }: CategoryReportsProps) {
  return (
    <GroupedReports<CategoryStats>
      title="분야별 표준화 동향"
      subtitle="표준화 분야별로 분류된 최신 동향 보고서를 확인하세요"
      icon={<TagIcon className="w-4 h-4 text-primary" />}
      statsUrl="/api/reports/stats/categories"
      getKey={(s) => s.name}
      getName={(s) => s.name}
      getCount={(s) => s.count}
      buildReportsUrl={(s) => `/api/reports/by-category/${encodeURIComponent(s.name)}`}
      onReportClick={onReportClick}
      isAdmin={isAdmin}
      onEdit={onEdit}
      showPagination={true}
      itemsPerPage={6}
      showWordCloud={true}
      loadingStatsText="분야별 통계를 불러오는 중..."
      loadingReportsText="보고서를 불러오는 중..."
      emptyReportsText="이 분야의 보고서가 없습니다."
      emptyStatsTitle="분야별 보고서가 없습니다"
      emptyStatsDescription="카테고리가 설정된 보고서가 등록되면 여기에 표시됩니다."
      renderReportCard={(report) => (
        <Card
          key={report.id}
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 group bg-card/80 dark:bg-card/60 border-2 border-border/80 dark:border-gray-500/80 hover:border-primary/70 dark:hover:border-primary/80 hover:bg-card dark:hover:bg-card/80"
          onClick={() => onReportClick(report)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {report.organization}
                </Badge>
                {isAdmin && onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(report)
                    }}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    수정
                  </Button>
                )}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {report.date}
              </div>
            </div>
            <CardTitle className="font-playfair text-base leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {report.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
              {report.summary}
            </p>
            <div className="flex flex-wrap gap-1">
              {(Array.isArray(report.tags) ? report.tags : []).slice(0, 3).map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-xs">
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
      )}
    />
  )
}

