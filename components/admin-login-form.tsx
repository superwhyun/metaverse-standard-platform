'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { LogIn } from 'lucide-react'

export function AdminLoginForm() {
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const result = await signIn('credentials', {
      redirect: false, // Do not redirect, handle response manually
      password: password,
    })

    setIsLoading(false)

    if (result?.error) {
      toast({
        title: '로그인 실패',
        description: '비밀번호가 올바르지 않습니다.',
        variant: 'destructive',
      })
    } else {
      // On successful login, NextAuth will handle the session and refresh the page
      // No explicit redirect needed here, as the page will re-render with session
      toast({
        title: '로그인 성공',
        description: '관리자 페이지로 이동합니다.',
      })
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <LogIn className="w-6 h-6" />
            관리자 로그인
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="관리자 비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
