"use client"

import { useState, useEffect } from "react"
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

interface CategoryStats {
  name: string
  count: number
}

interface CategoryReportsProps {
  onReportClick: (report: Report) => void
}

export function CategoryReports({ onReportClick }: CategoryReportsProps) {
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([])
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [loadedReports, setLoadedReports] = useState<Record<string, Report[]>>({})
  const [loadingCategories, setLoadingCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load category statistics on component mount
  useEffect(() => {
    loadCategoryStats()
  }, [])

  const loadCategoryStats = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/reports/stats/categories')
      const result = await response.json()
      if (result.success) {
        setCategoryStats(result.data || [])
      }
    } catch (error) {
      console.error('Failed to load category stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCategoryReports = async (categoryName: string) => {
    if (loadedReports[categoryName]) {
      return // Already loaded
    }

    setLoadingCategories(prev => [...prev, categoryName])
    try {
      const response = await fetch(`/api/reports/by-category/${encodeURIComponent(categoryName)}`)
      const result = await response.json()
      if (result.success) {
        setLoadedReports(prev => ({
          ...prev,
          [categoryName]: result.data || []
        }))
      }
    } catch (error) {
      console.error('Failed to load category reports:', error)
    } finally {
      setLoadingCategories(prev => prev.filter(cat => cat !== categoryName))
    }
  }

  const toggleCategory = async (categoryName: string) => {
    if (expandedCategories.includes(categoryName)) {
      // Collapse
      setExpandedCategories(prev => prev.filter(name => name !== categoryName))
    } else {
      // Expand and load data if needed
      setExpandedCategories(prev => [...prev, categoryName])
      await loadCategoryReports(categoryName)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold font-playfair text-primary mb-2">분야별 표준화 동향</h2>
        <p className="text-muted-foreground">표준화 분야별로 분류된 최신 동향 보고서를 확인하세요</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-muted-foreground">분야별 통계를 불러오는 중...</div>
        </div>
      )}

      {/* Category Stats */}
      {!isLoading && (
        <div className="space-y-4">
          {categoryStats.map((stat) => {
            const isExpanded = expandedCategories.includes(stat.name)
            const isLoadingCategory = loadingCategories.includes(stat.name)
            const reports = loadedReports[stat.name] || []
            
            return (
              <Card key={stat.name} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => toggleCategory(stat.name)}
                >
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Tag className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-playfair text-xl">{stat.name}</div>
                        <div className="text-sm text-muted-foreground font-normal">
                          {stat.count}개의 보고서
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {stat.count}
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
                    {isLoadingCategory ? (
                      <div className="text-center py-6">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
                        <div className="text-sm text-muted-foreground">보고서를 불러오는 중...</div>
                      </div>
                    ) : reports.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {reports.map((report) => (
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
                              <CardTitle className="font-playfair text-base leading-tight group-hover:text-primary transition-colors line-clamp-2">
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
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        이 분야의 보고서가 없습니다.
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && categoryStats.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Tag className="w-8 h-8 text-muted-foreground" />
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