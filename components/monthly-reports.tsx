"use client"

import React, { useState, useEffect } from "react"
import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GroupedReports } from "@/components/grouped-reports"

interface MonthlyStats {
  name: string
  count: number
  year: number
  month: number
}

interface MonthlyReportsProps {
  onReportClick: (report: any) => void
  isAdmin?: boolean
  onEdit?: (report: any) => void
}

export function MonthlyReports({ onReportClick, isAdmin = false, onEdit }: MonthlyReportsProps) {
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAvailableYears = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/reports/stats/monthly')
        const data = await response.json()
        if (data.success && data.availableYears) {
          setAvailableYears(data.availableYears)
          // 기본값으로 최신 연도 선택
          if (data.availableYears.length > 0) {
            setSelectedYear(data.availableYears[0])
          }
        }
      } catch (error) {
        console.error('Failed to fetch available years:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAvailableYears()
  }, [])

  const statsUrl = selectedYear ? `/api/reports/stats/monthly?year=${selectedYear}` : '/api/reports/stats/monthly'

  return (
    <div className="py-2 px-4">
      <div className="w-full max-w-6xl mx-auto">
        <div className="mb-8 pt-1 text-center">
          <h2 className="text-3xl font-bold font-playfair text-primary mb-2">월별 표준화 동향 보고서</h2>
          <p className="text-muted-foreground">최근 등록된 메타버스 관련 표준화 동향 보고서를 월별로 확인하세요</p>
        </div>

        {/* 연도 탭 버튼 */}
        {!isLoading && availableYears.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {availableYears.map((year) => (
              <Button
                key={year}
                variant={selectedYear === year ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedYear(year)}
                className="min-w-[80px]"
              >
                {year}년
              </Button>
            ))}
          </div>
        )}

        {/* 로딩 중일 때 */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-muted-foreground">연도 정보를 불러오는 중...</div>
          </div>
        )}

        {/* 선택된 연도의 월별 데이터 */}
        {!isLoading && selectedYear && (
          <GroupedReports<MonthlyStats>
            title=""
            subtitle=""
            icon={<Calendar className="w-4 h-4 text-primary" />}
            statsUrl={statsUrl}
            getKey={(s) => `${s.year}-${String(s.month).padStart(2,'0')}`}
            getName={(s) => s.name}
            getCount={(s) => s.count}
            buildReportsUrl={(s) => `/api/reports/by-month/${s.year}/${s.month}`}
            onReportClick={onReportClick}
            isAdmin={isAdmin}
            onEdit={onEdit}
            showPagination={true}
            itemsPerPage={6}
            loadingStatsText="월별 통계를 불러오는 중..."
            loadingReportsText="보고서를 불러오는 중..."
            emptyReportsText="이 달에 등록된 보고서가 없습니다."
            emptyStatsTitle="월별 보고서가 없습니다"
            emptyStatsDescription="보고서가 등록되면 여기에 월별로 표시됩니다."
          />
        )}

        {!isLoading && availableYears.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <div className="text-lg font-medium mb-2">월별 보고서가 없습니다</div>
            <div className="text-muted-foreground">보고서가 등록되면 여기에 월별로 표시됩니다.</div>
          </div>
        )}
      </div>

      <div className="text-center mt-8 text-sm text-muted-foreground">
        <p>아래 화살표 키를 눌러 표준화 기구별 동향으로 이동하세요</p>
      </div>
    </div>
  )
}
