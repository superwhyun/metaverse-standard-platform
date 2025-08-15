"use client"

import { useState } from "react"
import { Search, Sparkles, FileText, Tag, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface StandardResult {
  id: string
  title: string
  organization: string
  description: string
  relevanceScore: number
  tags: string[]
  status: string
  publishedDate: string
}

type StandardSearchProps = {}

export function StandardSearch({}: StandardSearchProps) {
  const [query, setQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<StandardResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  // Mock search function - in real implementation, this would call RAG + LLM
  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setHasSearched(true)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock results based on query
    const mockResults: StandardResult[] = [
      {
        id: "iso-iec-23005",
        title: "ISO/IEC 23005 - 메타버스 상호운용성 표준",
        organization: "ISO/IEC",
        description:
          "메타버스 플랫폼 간 상호운용성을 위한 데이터 교환, 사용자 인터페이스, 서비스 통합 프레임워크를 정의합니다. 아바타 이동성, 가상 자산 표현, 크로스 플랫폼 통신 프로토콜을 포함합니다.",
        relevanceScore: 95,
        tags: ["상호운용성", "아바타", "데이터교환", "플랫폼통합"],
        status: "개발중",
        publishedDate: "2024-12-15",
      },
      {
        id: "ieee-2888",
        title: "IEEE 2888 - 메타버스 시스템 아키텍처",
        organization: "IEEE",
        description:
          "메타버스 시스템의 전체적인 아키텍처를 정의하는 포괄적인 표준으로, 참조 모델, 컴포넌트 간 인터페이스, 데이터 모델 및 보안 프레임워크를 제공합니다.",
        relevanceScore: 88,
        tags: ["시스템아키텍처", "참조모델", "인터페이스", "보안"],
        status: "발표됨",
        publishedDate: "2024-11-28",
      },
      {
        id: "w3c-webxr",
        title: "W3C WebXR Device API",
        organization: "W3C",
        description:
          "웹 브라우저에서 가상현실과 증강현실 경험을 제공하기 위한 API 표준입니다. 메타버스 웹 구현의 핵심 기술로 활용됩니다.",
        relevanceScore: 82,
        tags: ["웹표준", "WebXR", "VR", "AR"],
        status: "권고안",
        publishedDate: "2024-10-20",
      },
      {
        id: "itu-t-h430",
        title: "ITU-T H.430 시리즈 - VR 품질 평가",
        organization: "ITU-T",
        description:
          "가상현실 서비스의 품질 평가를 위한 객관적 측정 방법론을 제시하며, VR 비디오/오디오 품질, 상호작용 지연시간, 사용자 경험 품질을 다룹니다.",
        relevanceScore: 75,
        tags: ["품질평가", "VR", "QoE", "측정방법론"],
        status: "개발중",
        publishedDate: "2024-12-08",
      },
    ]

    setResults(mockResults)
    setIsSearching(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "발표됨":
        return "bg-green-100 text-green-800"
      case "권고안":
        return "bg-blue-100 text-blue-800"
      case "개발중":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold font-serif text-primary">AI 표준 검색 & 추천</h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            개발하고자 하는 기능이나 요구사항을 설명하면, AI가 관련된 메타버스 표준들을 찾아서 추천해드립니다.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              기능 요구사항 입력
            </CardTitle>
            <CardDescription>
              예: "사용자가 다른 메타버스 플랫폼으로 아바타를 이동할 수 있는 기능", "VR 콘텐츠의 품질을 측정하는 방법"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="개발하고자 하는 기능이나 해결하고자 하는 문제를 자세히 설명해주세요..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[120px]"
            />
            <Button onClick={handleSearch} disabled={!query.trim() || isSearching} className="w-full" size="lg">
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  AI가 관련 표준을 검색 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI 표준 검색 시작
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {hasSearched && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">검색 결과</h3>
              {results.length > 0 && <Badge variant="secondary">{results.length}개 표준 발견</Badge>}
            </div>

            {isSearching ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">RAG 검색과 LLM 분석을 통해 관련 표준을 찾고 있습니다...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-4">
                {results.map((result) => (
                  <Card key={result.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-lg">{result.title}</h4>
                            <Badge variant="outline">{result.organization}</Badge>
                            <Badge className={getStatusColor(result.status)}>{result.status}</Badge>
                          </div>
                          <p className="text-muted-foreground text-sm mb-3">{result.description}</p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-primary">{result.relevanceScore}%</div>
                          <div className="text-xs text-muted-foreground">관련도</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-muted-foreground" />
                          <div className="flex gap-1">
                            {result.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            {new Date(result.publishedDate).toLocaleDateString("ko-KR")}
                          </span>
                          <Button variant="outline" size="sm">
                            <FileText className="w-4 h-4 mr-2" />
                            상세 보기
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">검색 결과가 없습니다. 다른 키워드로 다시 시도해보세요.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>위 화살표 키를 눌러 월별 보고서 페이지로 돌아가세요</p>
        </div>
      </div>
    </div>
  )
}
