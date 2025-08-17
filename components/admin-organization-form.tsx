'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { List, Plus, Trash2 } from 'lucide-react'
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

interface Organization {
  id: number
  name: string
}

export function AdminOrganizationForm() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [newOrgName, setNewOrgName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const fetchOrganizations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/organizations')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setOrganizations(data)
    } catch (err) {
      toast({
        title: '오류',
        description: '표준화 기구 목록을 불러오는 데 실패했습니다.',
        variant: 'destructive',
      })
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const handleAddOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOrgName.trim()) {
      setError('기구 이름을 입력해주세요.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newOrgName }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to add organization')
      }

      setNewOrgName('')
      setError('')
      toast({
        title: '성공',
        description: '새로운 표준화 기구를 추가했습니다.',
      })
      await fetchOrganizations() // Refresh the list
    } catch (err: any) {
      setError(err.message)
      toast({
        title: '오류',
        description: err.message || '기구 추가에 실패했습니다.',
        variant: 'destructive',
      })
    }
    setIsLoading(false)
  }

  const handleDeleteOrganization = async (id: number) => {
    try {
      const response = await fetch(`/api/organizations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete organization');
      }

      toast({
        title: '성공',
        description: '표준화 기구를 삭제했습니다.',
      });
      await fetchOrganizations(); // Refresh the list
    } catch (err: any) {
      toast({
        title: '오류',
        description: err.message || '기구 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="w-5 h-5" />
          표준화 기구 관리
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddOrganization} className="space-y-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="orgName">새 기구 이름</Label>
            <div className="flex gap-2">
              <Input
                id="orgName"
                value={newOrgName}
                onChange={(e) => {
                  setNewOrgName(e.target.value)
                  if (error) setError('')
                }}
                placeholder="예: W3C"
                className={error ? 'border-destructive' : ''}
              />
              <Button type="submit" disabled={isLoading || !newOrgName.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                추가
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </form>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">등록된 기구 목록</h3>
          {isLoading && <p>로딩 중...</p>}
          {!isLoading && organizations.length === 0 ? (
            <p className="text-sm text-muted-foreground">등록된 기구가 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {organizations.map((org) => (
                <li key={org.id} className="flex items-center justify-between p-2 border rounded-md bg-card">
                  <span>{org.name}</span>
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
                          이 작업은 되돌릴 수 없습니다. '{org.name}' 기구를 영구적으로 삭제합니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteOrganization(org.id)}>
                          삭제
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}