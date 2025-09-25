"use client"

import { useState, useEffect } from "react"
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
  const [error, setError] = useState<string | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  // 컴포넌트 언마운트 시 폴링 정리
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  // 폴링 시작 함수
  const startPolling = (searchId: string) => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/standard-search?searchId=${encodeURIComponent(searchId)}`)
        
        if (response.ok) {
          const data = await response.json()
          
          if (data.status === 'completed') {
            // 검색 완료
            setResults(data.results || [])
            setIsSearching(false)
            clearInterval(interval)
            setPollingInterval(null)
          } else if (data.status === 'failed') {
            // 검색 실패
            setError(data.error || '검색 중 오류가 발생했습니다.')
            setIsSearching(false)
            clearInterval(interval)
            setPollingInterval(null)
          }
          // pending 상태면 계속 폴링
        } else {
          console.error('Polling failed:', response.status)
          // 에러가 발생해도 몇 번은 더 시도
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 3000) // 3초마다 확인

    setPollingInterval(interval)

    // 5분 후 타임아웃 처리
    setTimeout(() => {
      if (interval) {
        clearInterval(interval)
        setPollingInterval(null)
        setError('검색이 타임아웃되었습니다. 다시 시도해주세요.')
        setIsSearching(false)
      }
    }, 300000) // 5분 타임아웃
  }

  // AI 표준 검색 API 호출
  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setHasSearched(true)
    setResults([])
    setError(null)

    try {
      const response = await fetch('/api/standard-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '검색 중 오류가 발생했습니다.')
      }

      const data = await response.json()

      if (data.status === 'pending') {
        // 백그라운드 처리 중인 경우 - 실제 폴링 시작
        console.log('Search is being processed in background, starting polling...')
        startPolling(data.searchId)
      } else if (data.status === 'completed') {
        // 동기 처리 완료된 경우
        setResults(data.results || [])
        setIsSearching(false)
      }
    } catch (error: any) {
      console.error('Search failed:', error)
      setResults([])
      setIsSearching(false)
      
      // 에러 상태를 사용자에게 표시
      const errorMessage = error.message || '검색 중 오류가 발생했습니다.'
      setError(errorMessage)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "발표됨":
        return "bg-green-100 text-green-800"
      case "권고안":
        return "bg-blue-100 text-blue-800"
      case "개발중":
        return "bg-yellow-100 text-yellow-800"
      case "처리중":
        return "bg-orange-100 text-orange-800"
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
            <h2 className="text-3xl font-bold font-playfair text-primary">AI 표준 검색 & 추천 (베타버전)</h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            개발하고자 하는 기능이나 요구사항을 설명하면, AI가 관련된 메타버스 표준들을 찾아서 추천해드립니다.
            OpenAI API 호출방식은 답변이 느리다보니 타임아웃에 종종 걸려 안되는 경우가 있습니다. 개선 예정입니다.
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

            {error ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-red-700">검색 오류</h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button onClick={() => { setError(null); handleSearch(); }} variant="outline">
                    다시 시도
                  </Button>
                </CardContent>
              </Card>
            ) : isSearching ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">AI가 관련 표준을 분석하고 검색하고 있습니다...</p>
                <p className="text-sm text-muted-foreground mt-2">GPT-5의 강력한 reasoning을 활용하여 최적의 표준을 찾고 있습니다.</p>
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
