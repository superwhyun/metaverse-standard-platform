'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { Link, PlusCircle, ImageOff, Trash2 } from 'lucide-react'

interface TechReport {
  id: number
  url: string
  title: string
  summary?: string
  image_url?: string
  created_at: string
}

interface TechAnalysisProps {
  session?: any
}

export function TechAnalysis({ session }: TechAnalysisProps) {
  const [reports, setReports] = useState<TechReport[]>([])
  const [newUrl, setNewUrl] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchReports = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/tech-analysis')
      if (!response.ok) throw new Error('Failed to fetch reports')
      const data = await response.json()
      setReports(data)
    } catch (err) {
      toast({
        title: '오류',
        description: '기술 분석 보고서 목록을 불러오는 데 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
        setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const validateForm = () => {
    if (!newUrl.trim()) {
      setError('URL을 입력해주세요.')
      return false
    }
    try {
      new URL(newUrl)
    } catch (_) {
      setError('유효한 URL 형식이 아닙니다.')
      return false
    }
    setError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/tech-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to add report')
      }

      setNewUrl('')
      toast({
        title: '성공',
        description: '새로운 기술 소식을 추가했습니다.',
      })
      await fetchReports() // Refresh the list
    } catch (err: any) {
      toast({
        title: '오류',
        description: err.message || '소식 추가에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
        setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!session) {
      toast({
        title: '권한 없음',
        description: '관리자만 삭제할 수 있습니다.',
        variant: 'destructive',
      })
      return
    }

    if (!confirm('이 기술 소식을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/tech-analysis?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete report')
      }

      toast({
        title: '성공',
        description: '기술 소식을 삭제했습니다.',
      })
      await fetchReports() // Refresh the list
    } catch (err: any) {
      toast({
        title: '오류',
        description: err.message || '삭제에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="w-6 h-6" />
            새 기술 소식 등록
          </CardTitle>
          <CardDescription>공유하고 싶은 최신 기술 동향, 아티클, 보고서 등의 URL을 등록해주세요. 제목, 요약, 이미지는 자동으로 가져옵니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex items-start gap-2">
            <div className="flex-grow space-y-2">
              <Label htmlFor="url" className="sr-only">URL</Label>
              <Input
                id="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com/tech-report"
                className={error ? 'border-destructive' : ''}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '등록 중...' : '등록하기'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-2xl font-bold">기술 소식 모아보기</h3>
        {isLoading ? (
          <p>로딩 중...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {reports.map((report) => (
              <Card key={report.id} className="flex flex-col overflow-hidden">
                <a href={report.url} target="_blank" rel="noopener noreferrer" className="block bg-muted">
                    <div className="w-full h-32 flex items-center justify-center">
                    {report.image_url ? (
                        <img src={report.image_url} alt={report.title} className="w-full h-full object-cover" />
                    ) : (
                        <ImageOff className="w-8 h-8 text-muted-foreground" />
                    )}
                    </div>
                </a>
                <CardHeader className="p-3 flex-grow">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-semibold leading-snug tracking-tight line-clamp-2 flex-1">
                      <a href={report.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {report.title}
                      </a>
                    </CardTitle>
                    {session && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.preventDefault()
                          handleDelete(report.id)
                        }}
                        title="삭제"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  {report.summary && (
                    <CardDescription className="text-xs mt-1 line-clamp-3">
                        {report.summary}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardFooter className="p-3 pt-0 mt-auto">
                  <p className="text-xs text-muted-foreground">
                    {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        {!isLoading && reports.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">아직 등록된 소식이 없습니다.</p>
            <p className="text-sm text-muted-foreground">첫 번째 소식을 등록해보세요!</p>
          </div>
        )}
      </div>
    </div>
  )
}
