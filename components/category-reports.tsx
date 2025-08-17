"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Tag, FileText, Calendar } from "lucide-react"
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

interface CategoryReportsProps {
  reports: Report[]
  onReportClick: (report: Report) => void
}

export function CategoryReports({ reports, onReportClick }: CategoryReportsProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])

  // Group reports by category
  const reportsByCategory = reports.reduce(
    (acc, report) => {
      const categoryName = report.category || "미분류"

      if (!acc[categoryName]) {
        acc[categoryName] = {
          name: categoryName,
          reports: [],
        }
      }
      acc[categoryName].reports.push(report)
      return acc
    },
    {} as Record<string, { name: string; reports: Report[] }>,
  )

  // Sort categories by report count (descending) and then alphabetically
  const sortedCategories = Object.entries(reportsByCategory).sort(([aKey, aData], [bKey, bData]) => {
    const countDiff = bData.reports.length - aData.reports.length
    if (countDiff !== 0) return countDiff
    return aKey.localeCompare(bKey, 'ko-KR')
  })

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold font-serif text-primary mb-2">분야별 표준화 동향</h2>
        <p className="text-muted-foreground">표준화 분야별로 분류된 최신 동향 보고서를 확인하세요</p>
      </div>

      <div className="space-y-4">
        {sortedCategories.map(([categoryName, categoryData]) => {
          const isExpanded = expandedCategories.includes(categoryName)
          
          return (
            <Card key={categoryName} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => toggleCategory(categoryName)}
              >
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Tag className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-serif text-xl">{categoryName}</div>
                      <div className="text-sm text-muted-foreground font-normal">
                        {categoryData.reports.length}개의 보고서
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {categoryData.reports.length}
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </CardTitle>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categoryData.reports.map((report) => (
                      <Card
                        key={report.id}
                        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 group"
                        onClick={() => onReportClick(report)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <Badge variant="outline" className="text-xs">
                              {report.organization}
                            </Badge>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {report.date}
                            </div>
                          </div>
                          <CardTitle className="font-serif text-base leading-tight group-hover:text-primary transition-colors line-clamp-2">
                            {report.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                            {report.summary}
                          </p>
                          
                          <div className="flex flex-wrap gap-1">
                            {(Array.isArray(report.tags) ? report.tags : []).slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {report.tags && report.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{report.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {sortedCategories.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">분야별 보고서가 없습니다</h3>
          <p className="text-muted-foreground">
            카테고리가 설정된 보고서가 등록되면 여기에 표시됩니다.
          </p>
        </div>
      )}
    </div>
  )
}