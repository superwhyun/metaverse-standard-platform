"use client"

import { useState } from "react"
import {
  ChevronLeft,
  Download,
  Share2,
  Bookmark,
  Calendar,
  Building,
  Tag,
  ChevronRight,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

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
  tableOfContents?: { id: string; title: string; level: number }[]
}

interface ReportViewerProps {
  report: Report
  onBack: () => void
  relatedReports?: Report[]
  onRelatedReportClick?: (report: Report) => void
}

export function ReportViewer({ report, onBack, relatedReports = [], onRelatedReportClick }: ReportViewerProps) {
  const [tocOpen, setTocOpen] = useState(true)

  const defaultTableOfContents = [
    { id: "summary", title: "요약", level: 1 },
    { id: "background", title: "배경", level: 1 },
    { id: "main-content", title: "주요 내용", level: 1 },
    { id: "technical-details", title: "기술적 세부사항", level: 2 },
    { id: "standards", title: "관련 표준", level: 2 },
    { id: "conclusion", title: "결론", level: 1 },
    { id: "references", title: "참고문헌", level: 1 },
  ]

  const tableOfContents = report.tableOfContents || defaultTableOfContents

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          목록으로 돌아가기
        </Button>
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm">
            <Bookmark className="w-4 h-4 mr-2" />
            북마크
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            공유
          </Button>
          {report.downloadUrl && (
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              다운로드
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Table of Contents - Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <Collapsible open={tocOpen} onOpenChange={setTocOpen}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="text-lg flex items-center justify-between">
                    목차
                    <ChevronDown className={`w-4 h-4 transition-transform ${tocOpen ? "rotate-180" : ""}`} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <nav className="space-y-2">
                    {tableOfContents.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className={`block w-full text-left text-sm hover:text-primary transition-colors ${
                          item.level === 1 ? "font-medium" : "pl-4 text-muted-foreground"
                        }`}
                      >
                        {item.title}
                      </button>
                    ))}
                  </nav>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="secondary">{report.category}</Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {report.date}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Building className="w-4 h-4" />
                  {report.organization}
                </div>
              </div>

              <CardTitle className="font-serif text-2xl leading-tight">{report.title}</CardTitle>

              <div className="flex flex-wrap gap-1 mt-4">
                {report.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardHeader>

            <CardContent className="prose max-w-none">
              <div id="summary" className="scroll-mt-4">
                <h3 className="text-xl font-semibold mb-4">요약</h3>
                <p className="text-lg leading-relaxed mb-6 text-muted-foreground">{report.summary}</p>
              </div>

              <Separator className="my-6" />

              <div id="main-content" className="scroll-mt-4">
                <h3 className="text-xl font-semibold mb-4">주요 내용</h3>
                <div className="whitespace-pre-wrap leading-relaxed">{report.content}</div>
              </div>

              <Separator className="my-6" />

              <div id="technical-details" className="scroll-mt-4">
                <h4 className="text-lg font-semibold mb-3">기술적 세부사항</h4>
                <p className="leading-relaxed text-muted-foreground">
                  이 섹션에서는 표준의 기술적 구현 세부사항과 관련 기술 요구사항을 다룹니다.
                </p>
              </div>

              <div id="standards" className="scroll-mt-4 mt-6">
                <h4 className="text-lg font-semibold mb-3">관련 표준</h4>
                <p className="leading-relaxed text-muted-foreground">
                  본 보고서와 관련된 기존 표준 및 진행 중인 표준화 작업들을 소개합니다.
                </p>
              </div>

              <Separator className="my-6" />

              <div id="conclusion" className="scroll-mt-4">
                <h3 className="text-xl font-semibold mb-4">결론</h3>
                <p className="leading-relaxed text-muted-foreground">
                  메타버스 표준화는 지속적으로 발전하고 있으며, 국제적 협력을 통해 상호운용성을 확보하는 것이
                  중요합니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Related Reports - Sidebar */}
        <div className="lg:col-span-1">
          {relatedReports.length > 0 && (
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">관련 보고서</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {relatedReports.slice(0, 3).map((relatedReport) => (
                  <div
                    key={relatedReport.id}
                    className="cursor-pointer hover:bg-muted/50 p-3 rounded-lg transition-colors"
                    onClick={() => onRelatedReportClick?.(relatedReport)}
                  >
                    <h4 className="font-medium text-sm leading-tight mb-2">{relatedReport.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {relatedReport.date}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-xs">
                        {relatedReport.category}
                      </Badge>
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
