"use client"

import React from "react"
import { Building, FileText, Tag as TagIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { GroupedReports } from "@/components/grouped-reports"

interface OrganizationStats {
  name: string
  count: number
}

interface OrganizationReportsProps {
  onReportClick: (report: any) => void
}

export function OrganizationReports({ onReportClick }: OrganizationReportsProps) {
  return (
    <GroupedReports<OrganizationStats>
      title="표준화 기구별 동향 보고서"
      subtitle="메타버스 관련 표준화 기구별로 분류된 동향 보고서를 확인하세요"
      icon={<Building className="w-4 h-4 text-primary" />}
      statsUrl="/api/reports/stats/organizations"
      getKey={(s) => s.name}
      getName={(s) => s.name}
      getCount={(s) => s.count}
      buildReportsUrl={(s) => `/api/reports/by-organization/${encodeURIComponent(s.name)}`}
      onReportClick={onReportClick}
      showPagination={true}
      itemsPerPage={6}
      loadingStatsText="기구별 통계를 불러오는 중..."
      loadingReportsText="보고서를 불러오는 중..."
      emptyReportsText="이 기구의 보고서가 없습니다."
      emptyStatsTitle="기구별 보고서가 없습니다"
      emptyStatsDescription="보고서가 등록되면 여기에 기구별로 표시됩니다."
      renderReportCard={(report) => (
        <div
          key={report.id}
          className="bg-card/80 dark:bg-card/60 border-2 border-border/80 dark:border-gray-500/80 rounded-lg p-4 hover:bg-card dark:hover:bg-card/80 hover:border-primary/70 dark:hover:border-primary/80 cursor-pointer transition-all duration-200"
          onClick={() => onReportClick(report)}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg hover:text-primary transition-colors">
              {report.title}
            </h3>
            <Badge variant="outline" className="ml-2 shrink-0">
              {new Date(report.date).toLocaleDateString("ko-KR")}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{report.summary}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <Badge variant="secondary" className="text-xs">
                {report.category}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <TagIcon className="w-3 h-3 text-muted-foreground" />
              <div className="flex gap-1">
                {(Array.isArray(report.tags) ? report.tags : []).slice(0, 2).map((tag: string) => (
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
      )}
    />
  )
}

