"use client"

import { useState, useEffect } from "react"
import { Search, Download, Calendar, Tag, ChevronRight, Filter } from "lucide-react"
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
  onReportClick: (report: Report) => void
}

export function ReportList({ onReportClick }: ReportListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedOrganization, setSelectedOrganization] = useState<string>("all")
  const [searchResults, setSearchResults] = useState<Report[]>([])
  const [recentReports, setRecentReports] = useState<Report[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [organizations, setOrganizations] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [isServerSearch, setIsServerSearch] = useState(false)

  // Load recent 6 reports on component mount
  useEffect(() => {
    loadRecentReports()
    loadFilterOptions()
  }, [])

  // Reset server search when search term is cleared
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      setSearchPerformed(false)
      setIsServerSearch(false)
    }
  }, [searchTerm])

  const loadRecentReports = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/reports/recent')
      const result = await response.json()
      if (result.success) {
        setRecentReports(result.data || [])
      }
    } catch (error) {
      console.error('Failed to load recent reports:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadFilterOptions = async () => {
    try {
      // Load categories and organizations from APIs
      const [categoryRes, orgRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/organizations')
      ])
      
      if (categoryRes.ok) {
        const categoryData = await categoryRes.json()
        // API returns direct array: [{id: 1, name: "ITU-T"}, ...]
        if (Array.isArray(categoryData)) {
          setCategories(categoryData.map((c: any) => c.name))
        }
      }
      
      if (orgRes.ok) {
        const orgData = await orgRes.json()
        // API returns direct array: [{id: 1, name: "ITU-T"}, ...]
        if (Array.isArray(orgData)) {
          setOrganizations(orgData.map((o: any) => o.name))
        }
      }
    } catch (error) {
      console.error('Failed to load filter options:', error)
    }
  }

  const performServerSearch = async () => {
    if (!searchTerm.trim()) return
    
    setIsSearching(true)
    setSearchPerformed(true)
    setIsServerSearch(true)
    try {
      let url = `/api/reports/search?q=${encodeURIComponent(searchTerm)}`
      if (selectedCategory !== 'all') {
        url += `&category=${encodeURIComponent(selectedCategory)}`
      }
      if (selectedOrganization !== 'all') {
        url += `&organization=${encodeURIComponent(selectedOrganization)}`
      }
      
      const response = await fetch(url)
      const result = await response.json()
      if (result.success) {
        setSearchResults(result.data || [])
      }
    } catch (error) {
      console.error('Failed to search reports:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Local filtering for recent reports (when not doing server search)
  const filteredRecentReports = recentReports.filter((report) => {
    const matchesSearch = !searchTerm.trim() || 
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(report.tags) ? report.tags : []).some((tag) => 
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
    
    const matchesCategory = selectedCategory === "all" || report.category === selectedCategory
    const matchesOrganization = selectedOrganization === "all" || report.organization === selectedOrganization
    
    return matchesSearch && matchesCategory && matchesOrganization
  })
  
  const displayReports = isServerSearch ? searchResults : filteredRecentReports
  const isShowingSearchResults = isServerSearch && searchPerformed

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold font-playfair text-primary mb-2">표준화 동향 보고서</h2>
        <p className="text-muted-foreground">
          {isShowingSearchResults 
            ? '검색 결과를 확인하세요' 
            : '최근 등록된 6개의 보고서와 검색 기능을 활용하세요'
          }
        </p>
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

            <Button 
              onClick={performServerSearch}
              disabled={!searchTerm.trim() || isSearching}
              variant="default"
              size="default"
              className="whitespace-nowrap"
            >
              {isSearching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  검색중
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  전체 검색
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          {isShowingSearchResults 
            ? `전체 데이터베이스 검색 결과: ${displayReports.length}개의 보고서`
            : `현재 ${filteredRecentReports.length}개의 보고서 (최근 6개에서 실시간 필터링)`
          }
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-muted-foreground">보고서를 불러오는 중...</div>
        </div>
      )}

      {/* Reports Grid */}
      {!isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayReports.map((report) => (
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
              <CardTitle className="font-playfair text-lg leading-tight group-hover:text-primary transition-colors">
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
      )}

      {/* Empty State */}
      {!isLoading && displayReports.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {isShowingSearchResults 
              ? '검색 결과가 없습니다' 
              : '보고서가 없습니다'
            }
          </div>
          {isShowingSearchResults && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setSearchResults([])
                setSearchPerformed(false)
              }}
            >
              검색 초기화
            </Button>
          )}
        </div>
      )}

      {/* Help Text */}
      {!isLoading && !isShowingSearchResults && displayReports.length > 0 && (
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>더 많은 보고서를 찾으시려면 위의 검색 기능을 이용하거나</p>
          <p>월별/기구별/분야별 보고서 페이지를 방문하세요</p>
        </div>
      )}
    </div>
  )
}
