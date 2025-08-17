"use client"

import { useState } from "react"
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

interface OrganizationReportsProps {
  reports: Report[]
  onReportClick: (report: Report) => void
}

export function OrganizationReports({ reports, onReportClick }: OrganizationReportsProps) {
  const [expandedOrgs, setExpandedOrgs] = useState<string[]>([])

  // Group reports by organization
  const reportsByOrganization = reports.reduce(
    (acc, report) => {
      const orgName = report.organization || "기타"

      if (!acc[orgName]) {
        acc[orgName] = {
          name: orgName,
          reports: [],
        }
      }
      acc[orgName].reports.push(report)
      return acc
    },
    {} as Record<string, { name: string; reports: Report[] }>,
  )

  // Sort organizations by report count (descending) and then alphabetically
  const sortedOrganizations = Object.entries(reportsByOrganization).sort(([aKey, aData], [bKey, bData]) => {
    const countDiff = bData.reports.length - aData.reports.length
    if (countDiff !== 0) return countDiff
    return aKey.localeCompare(bKey, 'ko-KR')
  })

  const toggleOrganization = (orgName: string) => {
    setExpandedOrgs((prev) => (prev.includes(orgName) ? prev.filter((o) => o !== orgName) : [...prev, orgName]))
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold font-serif text-primary mb-2">표준화 기구별 동향 보고서</h2>
        <p className="text-muted-foreground">메타버스 관련 표준화 기구별로 분류된 동향 보고서를 확인하세요</p>
      </div>

      <div className="space-y-4">
        {sortedOrganizations.map(([orgName, orgData]) => (
            <Card key={orgName} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleOrganization(orgName)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-primary" />
                    <CardTitle className="text-xl">{orgData.name}</CardTitle>
                    <Badge variant="secondary" className="ml-2">
                      {orgData.reports.length}개 보고서
                    </Badge>
                  </div>
                  {expandedOrgs.includes(orgName) ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>

              {expandedOrgs.includes(orgName) && (
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {orgData.reports
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((report) => (
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
                </CardContent>
              )}
            </Card>
          ))}
      </div>

      <div className="text-center mt-8 text-sm text-muted-foreground">
        <p>위 화살표 키를 눌러 월별 동향으로 이동하세요</p>
      </div>
    </div>
  )
}