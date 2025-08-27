"use client"

import React, { useState, useEffect } from "react"
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
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
    if (selectedCategory === categoryName) {
      // Collapse - close this category
      setSelectedCategory(null)
    } else {
      // Expand - close all others and open this one
      setSelectedCategory(categoryName)
      await loadCategoryReports(categoryName)
    }
  }

  // Reorganize stats: selected category first, others after
  const organizedStats = selectedCategory
    ? [
        categoryStats.find(stat => stat.name === selectedCategory)!,
        ...categoryStats.filter(stat => stat.name !== selectedCategory)
      ].filter(Boolean)
    : categoryStats

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
          {/* Selected category - full width at top */}
          {selectedCategory && (
            <div>
              <Card className="overflow-hidden py-0 gap-0 transition-all duration-300">
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors p-4"
                  onClick={() => toggleCategory(organizedStats[0].name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded">
                        <Tag className="w-5 h-5 text-primary" />
                      </div>
                      <CardTitle className="text-xl font-playfair">{organizedStats[0].name}</CardTitle>
                      <Badge variant="secondary" className="px-2 py-1">
                        {organizedStats[0].count}
                      </Badge>
                    </div>
                    {selectedCategory === organizedStats[0].name ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </Card>
              
              {/* Expanded Content */}
              <div 
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  selectedCategory === organizedStats[0].name ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <Card className="py-0 gap-0 mt-4">
                  <CardContent className="pt-4">
                    {(() => {
                      const isLoadingCategory = loadingCategories.includes(selectedCategory)
                      const reports = loadedReports[selectedCategory] || []
                      
                      if (isLoadingCategory) {
                        return (
                          <div className="text-center py-4">
                            <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
                            <div className="text-sm text-muted-foreground">보고서를 불러오는 중...</div>
                          </div>
                        )
                      } else if (reports.length > 0) {
                        return (
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {reports.map((report) => (
                              <Card
                                key={report.id}
                                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 group bg-card/80 dark:bg-card/60 border-2 border-border/80 dark:border-gray-500/80 hover:border-primary/70 dark:hover:border-primary/80 hover:bg-card dark:hover:bg-card/80"
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
                        )
                      } else {
                        return (
                          <div className="text-center py-4 text-muted-foreground">
                            이 분야의 보고서가 없습니다.
                          </div>
                        )
                      }
                    })()} 
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Remaining categories in grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(selectedCategory ? organizedStats.slice(1) : categoryStats).map((stat) => {
              return (
                <Card key={stat.name} className="overflow-hidden py-0 gap-0">
                  <CardHeader
                    className="cursor-pointer transition-colors hover:bg-muted/50 p-2"
                    onClick={() => toggleCategory(stat.name)}
                  >
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="p-1 bg-primary/10 rounded">
                          <Tag className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="font-playfair text-base">{stat.name}</div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                          {stat.count}
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