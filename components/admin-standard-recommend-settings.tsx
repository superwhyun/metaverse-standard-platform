'use client'

import { useState, useEffect } from "react"
import { Save, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "./ui/use-toast"

interface Settings {
  sheet_url: string | null
  vector_store_id: string | null
  last_synced_at: string | null
  last_sync_status: string | null
}

export function AdminStandardRecommendSettings() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [sheetUrlInput, setSheetUrlInput] = useState('')
  const [vectorStoreIdInput, setVectorStoreIdInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingLink, setSavingLink] = useState(false)
  const [savingVectorStoreId, setSavingVectorStoreId] = useState(false)

  const loadSettings = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/standard-recommend/settings')
      const result = await res.json()
      if (result.success) {
        setSettings(result.data)
        setSheetUrlInput(result.data.sheet_url || '')
        setVectorStoreIdInput(result.data.vector_store_id || '')
      }
    } catch (error) {
      console.error('Failed to load standard-recommend settings:', error)
      toast({
        title: "오류",
        description: "설정을 불러오는 데 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const saveSheetUrl = async () => {
    if (!sheetUrlInput.trim()) return
    try {
      setSavingLink(true)
      const res = await fetch('/api/admin/standard-recommend/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl: sheetUrlInput.trim() }),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.error || '저장 실패')
      toast({ title: "저장 완료", description: "구글 시트 링크가 저장되었습니다." })
      await loadSettings()
    } catch (error: any) {
      toast({
        title: "저장 실패",
        description: error.message || "구글 시트 링크 저장에 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setSavingLink(false)
    }
  }

  const saveVectorStoreId = async () => {
    if (!vectorStoreIdInput.trim()) return
    try {
      setSavingVectorStoreId(true)
      const res = await fetch('/api/admin/standard-recommend/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vectorStoreId: vectorStoreIdInput.trim() }),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.error || '저장 실패')
      toast({ title: "저장 완료", description: "Vector Store ID가 저장되었습니다." })
      await loadSettings()
    } catch (error: any) {
      toast({
        title: "저장 실패",
        description: error.message || "Vector Store ID 저장에 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setSavingVectorStoreId(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="ml-2">설정을 불러오는 중...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI 표준 추천 — 구글 시트 연동</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            표준 목록을 관리하는 공개 구글 스프레드시트 링크입니다. 이 시트에 연결된 Google Apps
            Script가 OpenAI Vector Store로 동기화를 수행하고, 그 결과 생성되는 Vector Store ID를
            아래에 붙여넣으면 AI 표준 추천 검색이 해당 데이터를 사용합니다.
          </p>

          <div className="space-y-2">
            <Label htmlFor="sheet-url">구글 시트 링크</Label>
            <div className="flex gap-2">
              <Input
                id="sheet-url"
                value={sheetUrlInput}
                onChange={(e) => setSheetUrlInput(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
              />
              <Button onClick={saveSheetUrl} disabled={savingLink || !sheetUrlInput.trim()}>
                {savingLink ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                저장
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vector-store-id">Vector Store ID</Label>
            <div className="flex gap-2">
              <Input
                id="vector-store-id"
                value={vectorStoreIdInput}
                onChange={(e) => setVectorStoreIdInput(e.target.value)}
                placeholder="vs_..."
              />
              <Button onClick={saveVectorStoreId} disabled={savingVectorStoreId || !vectorStoreIdInput.trim()}>
                {savingVectorStoreId ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                저장
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground pt-2">
            {settings?.last_synced_at ? (
              <div>
                마지막 반영: {new Date(settings.last_synced_at).toLocaleString('ko-KR')}
                {settings.last_sync_status === 'completed' && (
                  <span className="inline-flex items-center gap-1 text-green-600 ml-2">
                    <CheckCircle2 className="w-3 h-3" /> 완료
                  </span>
                )}
                {settings.last_sync_status === 'failed' && (
                  <span className="inline-flex items-center gap-1 text-destructive ml-2">
                    <AlertCircle className="w-3 h-3" /> 실패
                  </span>
                )}
              </div>
            ) : (
              <div>아직 Vector Store ID가 등록되지 않았습니다.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
