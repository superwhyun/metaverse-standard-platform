"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, Building, FileText, Tag } from "lucide-react"
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

interface OrganizationStats {
  name: string
  count: number
}

interface OrganizationReportsProps {
  onReportClick: (report: Report) => void
}

export function OrganizationReports({ onReportClick }: OrganizationReportsProps) {
  const [organizationStats, setOrganizationStats] = useState<OrganizationStats[]>([])
  const [expandedOrgs, setExpandedOrgs] = useState<string[]>([])
  const [loadedReports, setLoadedReports] = useState<Record<string, Report[]>>({})
  const [loadingOrgs, setLoadingOrgs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load organization statistics on component mount
  useEffect(() => {
    loadOrganizationStats()
  }, [])

  const loadOrganizationStats = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/reports/stats/organizations')
      const result = await response.json()
      if (result.success) {
        setOrganizationStats(result.data || [])
      }
    } catch (error) {
      console.error('Failed to load organization stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadOrganizationReports = async (orgName: string) => {
    if (loadedReports[orgName]) {
      return // Already loaded
    }

    setLoadingOrgs(prev => [...prev, orgName])
    try {
      const response = await fetch(`/api/reports/by-organization/${encodeURIComponent(orgName)}`)
      const result = await response.json()
      if (result.success) {
        setLoadedReports(prev => ({
          ...prev,
          [orgName]: result.data || []
        }))
      }
    } catch (error) {
      console.error('Failed to load organization reports:', error)
    } finally {
      setLoadingOrgs(prev => prev.filter(org => org !== orgName))
    }
  }

  const toggleOrganization = async (orgName: string) => {
    if (expandedOrgs.includes(orgName)) {
      // Collapse
      setExpandedOrgs(prev => prev.filter(org => org !== orgName))
    } else {
      // Expand and load data if needed
      setExpandedOrgs(prev => [...prev, orgName])
      await loadOrganizationReports(orgName)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold font-serif text-primary mb-2">표준화 기구별 동향 보고서</h2>
        <p className="text-muted-foreground">메타버스 관련 표준화 기구별로 분류된 동향 보고서를 확인하세요</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-muted-foreground">기구별 통계를 불러오는 중...</div>
        </div>
      )}

      {/* Organization Stats */}
      {!isLoading && (
        <div className="space-y-4">
          {organizationStats.map((stat) => {
            const isExpanded = expandedOrgs.includes(stat.name)
            const isLoadingOrg = loadingOrgs.includes(stat.name)
            const reports = loadedReports[stat.name] || []
            
            return (
              <Card key={stat.name} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleOrganization(stat.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building className="w-5 h-5 text-primary" />
                      <CardTitle className="text-xl">{stat.name}</CardTitle>
                      <Badge variant="secondary" className="ml-2">
                        {stat.count}개 보고서
                      </Badge>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    {isLoadingOrg ? (
                      <div className="text-center py-6">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
                        <div className="text-sm text-muted-foreground">보고서를 불러오는 중...</div>
                      </div>
                    ) : reports.length > 0 ? (
                      <div className="space-y-4">
                        {reports.map((report) => (
                          <div
                            key={report.id}
                            className="border rounded-lg p-4 hover:bg-muted/30 cursor-pointer transition-colors"
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
                                <Tag className="w-3 h-3 text-muted-foreground" />
                                <div className="flex gap-1">
                                  {(Array.isArray(report.tags) ? report.tags : []).slice(0, 2).map((tag) => (
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
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        이 기구의 보고서가 없습니다.
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
      {!isLoading && organizationStats.length === 0 && (
        <div className="text-center py-12">
          <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <div className="text-lg font-medium mb-2">기구별 보고서가 없습니다</div>
          <div className="text-muted-foreground">보고서가 등록되면 여기에 기구별로 표시됩니다.</div>
        </div>
      )}

      <div className="text-center mt-8 text-sm text-muted-foreground">
        <p>위 화살표 키를 눌러 월별 동향으로 이동하세요</p>
      </div>
    </div>
  )
}