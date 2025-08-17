'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { Link, PlusCircle, ImageOff, Trash2, Edit3, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TechReport {
  id: number
  url: string
  title: string
  summary?: string
  image_url?: string
  created_at: string
  category_id?: number
  category_name?: string
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
  
  // 무한 스크롤 관련 상태
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  
  // 검색 관련 상태
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  
  // 편집 관련 상태
  const [editingReport, setEditingReport] = useState<TechReport | null>(null)
  const [editFormData, setEditFormData] = useState({
    title: '',
    summary: '',
    url: '',
    image_url: '',
    category_id: ''
  })
  
  // 카테고리 목록
  const [categories, setCategories] = useState<Array<{id: number, name: string}>>([])
  const [categoriesLoaded, setCategoriesLoaded] = useState(false)
  
  // 삭제 확인 상태
  const [deletingReportId, setDeletingReportId] = useState<number | null>(null)

  const fetchReports = async (reset = true, search = '', categoryId = '') => {
    if (reset) {
      setIsLoading(true)
      setReports([])
      setOffset(0)
    } else {
      setIsLoadingMore(true)
    }
    
    try {
      const currentOffset = reset ? 0 : offset
      const params = new URLSearchParams({
        limit: '8',
        offset: currentOffset.toString(),
      })
      
      if (search.trim()) {
        params.append('search', search.trim())
      }
      
      if (categoryId && categoryId !== 'all') {
        params.append('category', categoryId)
      }
      
      const response = await fetch(`/api/tech-analysis?${params}`)
      if (!response.ok) throw new Error('Failed to fetch reports')
      const data = await response.json()
      
      if (reset) {
        setReports(data)
        setOffset(8)
      } else {
        // 중복 제거: 기존 데이터와 새 데이터에서 중복된 ID 필터링
        setReports(prev => {
          const existingIds = new Set(prev.map(report => report.id))
          const newReports = data.filter((report: TechReport) => !existingIds.has(report.id))
          return [...prev, ...newReports]
        })
        setOffset(prev => prev + 8)
      }
      
      // 가져온 데이터가 8개 미만이면 더 이상 로드할 데이터가 없음
      setHasMore(data.length === 8)
      
    } catch (err) {
      toast({
        title: '오류',
        description: '기술 분석 보고서 목록을 불러오는 데 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchReports(true, '', '')
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    if (categoriesLoaded) return
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const categoriesData = await response.json()
        setCategories(categoriesData)
        setCategoriesLoaded(true)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleSearch = async (searchValue?: string) => {
    const currentSearch = searchValue !== undefined ? searchValue : searchTerm
    setIsSearching(true)
    await fetchReports(true, currentSearch, selectedCategoryId)
    setIsSearching(false)
  }

  const handleCategoryChange = async (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    await fetchReports(true, searchTerm, categoryId)
  }

  const handleLoadMore = () => {
    if (!hasMore || isLoadingMore) return
    fetchReports(false, searchTerm, selectedCategoryId)
  }

  // 무한 스크롤 구현
  useEffect(() => {
    const handleScroll = () => {
      if (
        !isLoadingMore && 
        hasMore && 
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000
      ) {
        handleLoadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasMore, isLoadingMore, searchTerm, selectedCategoryId, offset])

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
      await fetchReports(true, searchTerm, selectedCategoryId) // Refresh the list
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

  const handleDeleteClick = (id: number) => {
    if (!session) {
      toast({
        title: '권한 없음',
        description: '관리자만 삭제할 수 있습니다.',
        variant: 'destructive',
      })
      return
    }
    setDeletingReportId(id)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingReportId) return

    try {
      const response = await fetch(`/api/tech-analysis?id=${deletingReportId}`, {
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
      await fetchReports(true, searchTerm, selectedCategoryId) // Refresh the list
    } catch (err: any) {
      toast({
        title: '오류',
        description: err.message || '삭제에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setDeletingReportId(null)
    }
  }

  const handleEdit = (report: TechReport) => {
    if (!session) {
      toast({
        title: '권한 없음',
        description: '관리자만 편집할 수 있습니다.',
        variant: 'destructive',
      })
      return
    }

    setEditingReport(report)
    setEditFormData({
      title: report.title,
      summary: report.summary || '',
      url: report.url,
      image_url: report.image_url || '',
      category_id: report.category_id?.toString() || 'none'
    })
  }

  const handleEditSubmit = async () => {
    if (!editingReport) return

    try {
      const response = await fetch('/api/tech-analysis', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingReport.id,
          title: editFormData.title,
          summary: editFormData.summary,
          url: editFormData.url,
          image_url: editFormData.image_url,
          category_id: editFormData.category_id && editFormData.category_id !== 'none' ? parseInt(editFormData.category_id) : null
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update report')
      }

      toast({
        title: '성공',
        description: '기술 소식을 수정했습니다.',
      })

      setEditingReport(null)
      fetchReports(true, searchTerm, selectedCategoryId)
    } catch (err) {
      toast({
        title: '오류',
        description: err instanceof Error ? err.message : '수정에 실패했습니다.',
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

      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-2xl font-bold">기술 소식 모아보기</h3>
          
          {/* 검색창과 카테고리 필터 */}
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="제목, 설명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch()
                  }
                }}
                className="pl-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => {
                    setSearchTerm('')
                    handleSearch('')
                  }}
                >
                  ×
                </Button>
              )}
            </div>
            
            {/* 카테고리 필터 */}
            <div className="min-w-[200px]">
              <Select 
                value={selectedCategoryId} 
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 카테고리</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {(searchTerm || (selectedCategoryId && selectedCategoryId !== 'all')) && (
            <p className="text-sm text-muted-foreground">
              {searchTerm && `"${searchTerm}" 검색 결과`}
              {searchTerm && selectedCategoryId && selectedCategoryId !== 'all' && ' · '}
              {selectedCategoryId && selectedCategoryId !== 'all' && 
                `${categories.find(c => c.id.toString() === selectedCategoryId)?.name} 카테고리`}
              {' '}
              {reports.length}개
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p>로딩 중...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {reports.map((report) => (
              <Card key={report.id} className="flex flex-col overflow-hidden relative">
                {report.category_name && (
                  <div className="absolute top-0 left-0 z-10">
                    <span className="inline-block px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full shadow-lg">
                      {report.category_name}
                    </span>
                  </div>
                )}
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
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          onClick={(e) => {
                            e.preventDefault()
                            handleEdit(report)
                          }}
                          title="편집"
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.preventDefault()
                            handleDeleteClick(report.id)
                          }}
                          title="삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
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
        
        {/* 무한 스크롤 로딩 */}
        {isLoadingMore && (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">더 많은 소식을 불러오는 중...</p>
          </div>
        )}
        
        {/* 빈 상태 */}
        {!isLoading && reports.length === 0 && (
          <div className="text-center py-12">
            <ImageOff className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            {searchTerm ? (
              <>
                <p className="text-muted-foreground mb-2">검색 결과가 없습니다.</p>
                <p className="text-sm text-muted-foreground">다른 키워드로 검색해보세요.</p>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mb-2">아직 등록된 소식이 없습니다.</p>
                <p className="text-sm text-muted-foreground">첫 번째 소식을 등록해보세요!</p>
              </>
            )}
          </div>
        )}
        
        {/* 더 이상 로드할 데이터가 없을 때 */}
        {!isLoading && !isLoadingMore && reports.length > 0 && !hasMore && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">모든 소식을 확인했습니다.</p>
          </div>
        )}
      </div>

      {/* 편집 모달 */}
      <Dialog open={editingReport !== null} onOpenChange={() => setEditingReport(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>기술 소식 편집</DialogTitle>
            <DialogDescription>
              제목, 설명, URL, 이미지 URL을 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">제목</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="제목을 입력하세요"
              />
            </div>
            <div>
              <Label htmlFor="edit-summary">설명</Label>
              <Textarea
                id="edit-summary"
                value={editFormData.summary}
                onChange={(e) => setEditFormData(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="설명을 입력하세요"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-url">URL</Label>
              <Input
                id="edit-url"
                value={editFormData.url}
                onChange={(e) => setEditFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-image">이미지 URL (선택사항)</Label>
              <Input
                id="edit-image"
                value={editFormData.image_url}
                onChange={(e) => setEditFormData(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <Label htmlFor="edit-category">카테고리 (선택사항)</Label>
              <Select 
                value={editFormData.category_id} 
                onValueChange={(value) => setEditFormData(prev => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">카테고리 없음</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingReport(null)}>
              취소
            </Button>
            <Button onClick={handleEditSubmit}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deletingReportId !== null} onOpenChange={() => setDeletingReportId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>기술 소식 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 기술 소식을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
