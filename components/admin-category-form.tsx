'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { List, Plus, Trash2, Edit3 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Category {
  id: number
  name: string
  description?: string
}

export function AdminCategoryForm() {
  const [categories, setCategories] = useState<Category[]>([])
  const [newCatName, setNewCatName] = useState('')
  const [newCatDescription, setNewCatDescription] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // 편집 관련 상태
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: ''
  })

  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/categories')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setCategories(data)
    } catch (err) {
      toast({
        title: '오류',
        description: '카테고리 목록을 불러오는 데 실패했습니다.',
        variant: 'destructive',
      })
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) {
      setError('카테고리 이름을 입력해주세요.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName, description: newCatDescription }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to add category')
      }

      setNewCatName('')
      setNewCatDescription('')
      setError('')
      toast({
        title: '성공',
        description: '새로운 카테고리를 추가했습니다.',
      })
      await fetchCategories() // Refresh the list
    } catch (err: any) {
      setError(err.message)
      toast({
        title: '오류',
        description: err.message || '카테고리 추가에 실패했습니다.',
        variant: 'destructive',
      })
    }
    setIsLoading(false)
  }

  const handleDeleteCategory = async (id: number) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete category');
      }

      toast({
        title: '성공',
        description: '카테고리를 삭제했습니다.',
      });
      await fetchCategories(); // Refresh the list
    } catch (err: any) {
      toast({
        title: '오류',
        description: err.message || '카테고리 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setEditFormData({
      name: category.name,
      description: category.description || ''
    })
  }

  const handleEditSubmit = async () => {
    if (!editingCategory) return
    
    if (!editFormData.name.trim()) {
      toast({
        title: '오류',
        description: '카테고리 이름을 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editFormData.name.trim(),
          description: editFormData.description.trim()
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update category')
      }

      toast({
        title: '성공',
        description: '카테고리를 수정했습니다.',
      })

      setEditingCategory(null)
      await fetchCategories()
    } catch (err: any) {
      toast({
        title: '오류',
        description: err.message || '카테고리 수정에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="w-5 h-5" />
          보고서 카테고리 관리
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddCategory} className="space-y-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="catName">새 카테고리 이름</Label>
            <div className="flex gap-2">
              <Input
                id="catName"
                value={newCatName}
                onChange={(e) => {
                  setNewCatName(e.target.value)
                  if (error) setError('')
                }}
                placeholder="예: 상호운용성"
                className={error ? 'border-destructive' : ''}
              />
              <Button type="submit" disabled={isLoading || !newCatName.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                추가
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="catDescription">설명 (선택 사항)</Label>
            <Textarea
              id="catDescription"
              value={newCatDescription}
              onChange={(e) => setNewCatDescription(e.target.value)}
              placeholder="이 카테고리에 대한 간략한 설명을 입력해주세요."
              rows={2}
            />
          </div>
        </form>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">등록된 카테고리 목록</h3>
          {isLoading && <p>로딩 중...</p>}
          {!isLoading && categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">등록된 카테고리가 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.id} className="flex flex-col p-2 border rounded-md bg-card">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{cat.name}</span>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => handleEditCategory(cat)}
                      >
                        <Edit3 className="w-4 h-4 text-blue-500" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                            <AlertDialogDescription>
                              이 작업은 되돌릴 수 없습니다. '{cat.name}' 카테고리를 영구적으로 삭제합니다.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteCategory(cat.id)}>
                              삭제
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  {cat.description && (
                    <p className="text-sm text-muted-foreground mt-1">{cat.description}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>

      {/* 편집 모달 */}
      <Dialog open={editingCategory !== null} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>카테고리 편집</DialogTitle>
            <DialogDescription>
              카테고리 이름과 설명을 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">카테고리 이름</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="카테고리 이름을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">설명 (선택사항)</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="카테고리 설명을 입력하세요"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              취소
            </Button>
            <Button onClick={handleEditSubmit}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
