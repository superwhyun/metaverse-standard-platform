"use client"

import React from "react"
import { Calendar } from "lucide-react"
import { GroupedReports } from "@/components/grouped-reports"

interface MonthlyStats {
  name: string
  count: number
  year: number
  month: number
}

interface MonthlyReportsProps {
  onReportClick: (report: any) => void
}

export function MonthlyReports({ onReportClick }: MonthlyReportsProps) {
  return (
    <div className="py-8 px-4">
      <GroupedReports<MonthlyStats>
        title="월별 표준화 동향 보고서"
        subtitle="최근 등록된 메타버스 관련 표준화 동향 보고서를 월별로 확인하세요"
        icon={<Calendar className="w-4 h-4 text-primary" />}
        statsUrl="/api/reports/stats/monthly"
        getKey={(s) => `${s.year}-${String(s.month).padStart(2,'0')}`}
        getName={(s) => s.name}
        getCount={(s) => s.count}
        buildReportsUrl={(s) => `/api/reports/by-month/${s.year}/${s.month}`}
        onReportClick={onReportClick}
        showPagination={true}
        itemsPerPage={6}
        loadingStatsText="월별 통계를 불러오는 중..."
        loadingReportsText="보고서를 불러오는 중..."
        emptyReportsText="이 달에 등록된 보고서가 없습니다."
        emptyStatsTitle="월별 보고서가 없습니다"
        emptyStatsDescription="보고서가 등록되면 여기에 월별로 표시됩니다."
      />
      <div className="text-center mt-8 text-sm text-muted-foreground">
        <p>아래 화살표 키를 눌러 표준화 기구별 동향으로 이동하세요</p>
      </div>
    </div>
  )
}

