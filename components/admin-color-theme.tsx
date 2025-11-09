'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, RotateCcw } from 'lucide-react';
import {
  loadColorTheme,
  saveColorTheme,
  applyColorTheme,
  resetColorTheme,
  getContrastColor,
  DEFAULT_COLOR_THEME,
  type ColorThemeConfig,
} from '@/lib/color-theme';

interface AdminColorThemeProps {
  currentTheme: 'light' | 'dark';
}

export function AdminColorTheme({ currentTheme }: AdminColorThemeProps) {
  const [colorConfig, setColorConfig] = useState<ColorThemeConfig>(DEFAULT_COLOR_THEME);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // 저장된 색상 테마 로드
    const loaded = loadColorTheme();
    setColorConfig(loaded);
  }, []);

  const handleColorChange = (mode: 'light' | 'dark', field: 'cardBackground' | 'cardBorder', value: string) => {
    setColorConfig((prev) => ({
      ...prev,
      [mode]: {
        ...prev[mode],
        [field]: value,
      },
    }));
    setMessage(null);
  };

  const handleSave = () => {
    try {
      saveColorTheme(colorConfig);
      applyColorTheme(colorConfig, currentTheme);
      setMessage({ type: 'success', text: '색상 테마가 성공적으로 저장되었습니다.' });

      // 페이지 새로고침하여 모든 카드에 즉시 적용
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      setMessage({ type: 'error', text: '색상 테마 저장에 실패했습니다.' });
    }
  };

  const handleReset = () => {
    if (confirm('색상 테마를 디폴트로 초기화하시겠습니까?')) {
      resetColorTheme();
      setColorConfig(DEFAULT_COLOR_THEME);
      setMessage({ type: 'success', text: '색상 테마가 디폴트로 초기화되었습니다.' });

      // 페이지 새로고침하여 모든 카드에 즉시 적용
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>카드 색상 테마 설정</CardTitle>
        <CardDescription>
          다크모드와 라이트모드에서 카드의 배경색과 테두리색을 커스터마이징할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="light" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="light">라이트 모드</TabsTrigger>
            <TabsTrigger value="dark">다크 모드</TabsTrigger>
          </TabsList>

          <TabsContent value="light" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="light-card-bg">카드 배경색</Label>
                <div className="flex gap-2 items-center">
                  <input
                    id="light-card-bg"
                    type="color"
                    value={colorConfig.light.cardBackground}
                    onChange={(e) => handleColorChange('light', 'cardBackground', e.target.value)}
                    className="w-20 h-10 rounded border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={colorConfig.light.cardBackground}
                    onChange={(e) => handleColorChange('light', 'cardBackground', e.target.value)}
                    className="flex-1 px-3 py-2 rounded border border-border bg-background"
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="light-card-border">카드 테두리색</Label>
                <div className="flex gap-2 items-center">
                  <input
                    id="light-card-border"
                    type="color"
                    value={colorConfig.light.cardBorder}
                    onChange={(e) => handleColorChange('light', 'cardBorder', e.target.value)}
                    className="w-20 h-10 rounded border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={colorConfig.light.cardBorder}
                    onChange={(e) => handleColorChange('light', 'cardBorder', e.target.value)}
                    className="flex-1 px-3 py-2 rounded border border-border bg-background"
                    placeholder="#d1d5db"
                  />
                </div>
              </div>

              {/* 미리보기 카드 */}
              <div className="mt-6">
                <Label>미리보기</Label>
                <div
                  className="mt-2 p-4 rounded-xl shadow-sm"
                  style={{
                    backgroundColor: colorConfig.light.cardBackground,
                    border: `1px solid ${colorConfig.light.cardBorder}`,
                    color: getContrastColor(colorConfig.light.cardBackground),
                  }}
                >
                  <h3 className="font-semibold mb-2">샘플 카드</h3>
                  <p className="text-sm" style={{ opacity: 0.7 }}>
                    이것은 라이트 모드에서의 카드 미리보기입니다. 배경색에 따라 텍스트 색상이 자동으로 조정됩니다.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dark" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dark-card-bg">카드 배경색</Label>
                <div className="flex gap-2 items-center">
                  <input
                    id="dark-card-bg"
                    type="color"
                    value={colorConfig.dark.cardBackground}
                    onChange={(e) => handleColorChange('dark', 'cardBackground', e.target.value)}
                    className="w-20 h-10 rounded border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={colorConfig.dark.cardBackground}
                    onChange={(e) => handleColorChange('dark', 'cardBackground', e.target.value)}
                    className="flex-1 px-3 py-2 rounded border border-border bg-background"
                    placeholder="#1e293b"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dark-card-border">카드 테두리색</Label>
                <div className="flex gap-2 items-center">
                  <input
                    id="dark-card-border"
                    type="color"
                    value={colorConfig.dark.cardBorder}
                    onChange={(e) => handleColorChange('dark', 'cardBorder', e.target.value)}
                    className="w-20 h-10 rounded border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={colorConfig.dark.cardBorder}
                    onChange={(e) => handleColorChange('dark', 'cardBorder', e.target.value)}
                    className="flex-1 px-3 py-2 rounded border border-border bg-background"
                    placeholder="#475569"
                  />
                </div>
              </div>

              {/* 미리보기 카드 */}
              <div className="mt-6">
                <Label>미리보기</Label>
                <div
                  className="mt-2 p-4 rounded-xl shadow-sm"
                  style={{
                    backgroundColor: colorConfig.dark.cardBackground,
                    border: `1px solid ${colorConfig.dark.cardBorder}`,
                    color: getContrastColor(colorConfig.dark.cardBackground),
                  }}
                >
                  <h3 className="font-semibold mb-2">샘플 카드</h3>
                  <p className="text-sm" style={{ opacity: 0.7 }}>
                    이것은 다크 모드에서의 카드 미리보기입니다. 배경색에 따라 텍스트 색상이 자동으로 조정됩니다.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {message && (
          <Alert className={`mt-4 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            <CheckCircle className={`h-4 w-4 ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`} />
            <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2 mt-6">
          <Button onClick={handleSave} className="flex-1">
            설정 저장
          </Button>
          <Button onClick={handleReset} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            초기화
          </Button>
        </div>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>참고:</strong> 색상을 변경한 후 저장하면 페이지가 자동으로 새로고침되어 모든 카드에 새 색상이 적용됩니다.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
