'use client'

import { useState, useEffect } from "react"
import { AlertTriangle, CheckCircle, Key, RefreshCw, Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { toast } from "./ui/use-toast"

interface EnvironmentVariable {
  exists: boolean;
  masked: string | null;
  required: boolean;
  description: string;
}

interface EnvStatus {
  status: 'healthy' | 'warning';
  missing: number;
  total: number;
  variables: Record<string, EnvironmentVariable>;
  missingVariables: string[];
}

export function AdminEnvSettings() {
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEnvStatus = async () => {
    try {
      const response = await fetch('/api/admin/env-check');
      if (!response.ok) {
        throw new Error('Failed to load environment status');
      }
      const data = await response.json();
      setEnvStatus(data);
    } catch (error) {
      console.error('Error loading environment status:', error);
      toast({
        title: "오류",
        description: "환경변수 상태를 불러오는 데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEnvStatus();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "복사됨",
      description: "클립보드에 복사되었습니다.",
    });
  };

  useEffect(() => {
    loadEnvStatus();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="ml-2">환경변수 상태 확인 중...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!envStatus) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">환경변수 상태를 불러올 수 없습니다</h3>
            <Button onClick={loadEnvStatus}>다시 시도</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              시스템 환경변수 상태
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              새로고침
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            {envStatus.status === 'healthy' ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">시스템 정상</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">설정 필요</span>
              </div>
            )}
            <Separator orientation="vertical" className="h-6" />
            <div className="text-sm text-muted-foreground">
              {envStatus.total - envStatus.missing}/{envStatus.total} 환경변수 설정됨
            </div>
          </div>

          {envStatus.missing > 0 && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {envStatus.missing}개의 필수 환경변수가 설정되지 않았습니다. 
                일부 기능이 제대로 작동하지 않을 수 있습니다.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Environment Variables Details */}
      <Card>
        <CardHeader>
          <CardTitle>환경변수 상세 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(envStatus.variables).map(([name, config]) => (
              <div key={name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {name}
                    </code>
                    <Badge variant={config.exists ? "default" : "destructive"}>
                      {config.exists ? "설정됨" : "누락"}
                    </Badge>
                    {config.required && (
                      <Badge variant="outline">필수</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {config.description}
                  </p>
                  {config.masked && config.exists && (
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {config.masked}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(name)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
                {!config.exists && config.required && (
                  <div className="flex items-center gap-2">
                    {name === 'OPENAI_API_KEY' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('https://platform.openai.com/api-keys', '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        API 키 발급
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      {envStatus.missingVariables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>설정 방법</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Cloudflare Pages Dashboard에서 설정</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Cloudflare Pages 대시보드로 이동</li>
                  <li>프로젝트 선택 → Settings → Environment variables</li>
                  <li>Production 탭에서 다음 환경변수 추가:</li>
                </ol>
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  {envStatus.missingVariables.map((varName) => (
                    <div key={varName} className="flex items-center justify-between py-1">
                      <code className="text-sm">{varName}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(varName)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {envStatus.missingVariables.includes('OPENAI_API_KEY') && (
                <div>
                  <h4 className="font-medium mb-2">OPENAI_API_KEY 발급 방법</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>OpenAI Platform 웹사이트 방문</li>
                    <li>계정 로그인 후 API Keys 페이지로 이동</li>
                    <li>"Create new secret key" 클릭</li>
                    <li>생성된 키를 복사하여 Cloudflare Pages에 설정</li>
                  </ol>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => window.open('https://platform.openai.com/api-keys', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    OpenAI API Keys 페이지 열기
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}