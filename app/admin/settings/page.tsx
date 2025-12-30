'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { AdminColorTheme } from '@/components/admin-color-theme';
import { useEffect } from 'react';

function ApiSettings() {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const key = localStorage.getItem('openai_api_key');
    if (key) setApiKey(key);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('openai_api_key', apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API 설정</CardTitle>
        <CardDescription>
          외부 서비스 연동을 위한 API 키를 설정합니다. 이 키는 브라우저에만 저장됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">OpenAI API Key</Label>
            <div className="flex gap-2">
              <Input
                id="apiKey"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={() => setShowKey(!showKey)}>
                {showKey ? "숨기기" : "보기"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              보고서 자동 생성을 위해 필요합니다.
            </p>
          </div>
          <Button type="submit" disabled={saved}>
            {saved ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                저장됨
              </>
            ) : (
              '저장'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function AdminSettingsPage() {
  const { session, status } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const user = session?.user;
  const loading = status === 'loading';

  // 로딩 중이거나 관리자가 아닌 경우
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    router.push('/admin/login');
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setMessage(null); // 입력 시 메시지 초기화
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    // 새 비밀번호 확인
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' });
      setIsSubmitting(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setMessage({ type: 'error', text: '새 비밀번호는 최소 8자 이상이어야 합니다.' });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: '비밀번호가 성공적으로 변경되었습니다. 다시 로그인해 주세요.' });
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        // 3초 후 로그인 페이지로 리디렉션
        setTimeout(() => {
          router.push('/admin/login');
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.error || '비밀번호 변경에 실패했습니다.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '서버 오류가 발생했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">관리자 설정</h1>

        <Tabs defaultValue="password" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="password">비밀번호 변경</TabsTrigger>
            <TabsTrigger value="theme">색상 테마</TabsTrigger>
            <TabsTrigger value="api">API 설정</TabsTrigger>
          </TabsList>

          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>비밀번호 변경</CardTitle>
                <CardDescription>
                  관리자 계정 비밀번호를 변경할 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">현재 비밀번호</Label>
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">새 비밀번호</Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                      minLength={8}
                    />
                    <p className="text-sm text-muted-foreground">최소 8자 이상 입력하세요.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  {message && (
                    <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
                      {message.type === 'error' ? (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
                        {message.text}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? '변경 중...' : '비밀번호 변경'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="theme">
            <AdminColorTheme currentTheme={(theme as 'light' | 'dark') || 'light'} />
          </TabsContent>

          <TabsContent value="api">
            <ApiSettings />
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <Button
            variant="outline"
            onClick={() => {
              // 세션 스토리지에 관리자 뷰로 돌아갈 것을 표시
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('returnView', 'admin');
              }
              router.push('/');
            }}
            className="w-full"
          >
            관리자 대시보드로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  );
}