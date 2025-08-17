"use client"

import { useState } from "react"
import { Search, Filter, Download, Calendar, Tag, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Report {
  id: number
  title: string
  date: string
  summary: string
  content: string
  category: string
  organization: string
  tags: string[]
  downloadUrl?: string
}

interface ReportListProps {
  reports: Report[]
  onReportClick: (report: Report) => void
  onLoadMore?: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
}

export function ReportList({ reports, onReportClick, onLoadMore, hasMore = false, isLoadingMore = false }: ReportListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedOrganization, setSelectedOrganization] = useState<string>("all")

  const categories = Array.from(new Set(reports.map((r) => r.category)))
  const organizations = Array.from(new Set(reports.map((r) => r.organization)))

  const filteredReports = reports.filter((report) => {
    const tags = Array.isArray(report.tags) ? report.tags : []
    const matchesSearch =
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = selectedCategory === "all" || report.category === selectedCategory
    const matchesOrganization = selectedOrganization === "all" || report.organization === selectedOrganization

    return matchesSearch && matchesCategory && matchesOrganization
  })

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold font-serif text-primary mb-2">표준화 동향 보고서</h2>
        <p className="text-muted-foreground">최신 메타버스 국제표준화 동향을 확인하세요</p>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="보고서 제목, 내용, 태그로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 카테고리</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedOrganization} onValueChange={setSelectedOrganization}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="기관" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 기관</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org} value={org}>
                    {org}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">총 {filteredReports.length}개의 보고서가 있습니다</div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredReports.map((report) => (
          <Card
            key={report.id}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 group"
            onClick={() => onReportClick(report)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="secondary" className="text-xs">
                  {report.category}
                </Badge>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {report.date}
                </div>
              </div>
              <CardTitle className="font-serif text-lg leading-tight group-hover:text-primary transition-colors">
                {report.title}
              </CardTitle>
              <div className="text-sm text-muted-foreground">{report.organization}</div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{report.summary}</p>

              <div className="flex flex-wrap gap-1 mb-4">
                {(Array.isArray(report.tags) ? report.tags : []).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" className="p-0 h-auto text-primary">
                  자세히 보기
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                {report.downloadUrl && (
                  <Button variant="ghost" size="sm" className="p-0 h-auto">
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">검색 결과가 없습니다</div>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("")
              setSelectedCategory("all")
              setSelectedOrganization("all")
            }}
          >
            필터 초기화
          </Button>
        </div>
      )}

      {/* Load More Button - Debug: 항상 표시 */}
      {filteredReports.length > 0 && onLoadMore && (
        <div className="text-center mt-8">
          <Button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            variant="outline"
            size="lg"
            className="px-8"
          >
            {isLoadingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2"></div>
                로딩 중...
              </>
            ) : hasMore ? (
              "더보기"
            ) : (
              "더 이상 없음"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
