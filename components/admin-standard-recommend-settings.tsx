'use client'

import { useState, useEffect, useRef } from "react"
import { Save, RefreshCw, PlayCircle, CheckCircle2, AlertCircle } from "lucide-react"
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

interface SyncStatus {
  status: 'pending' | 'running' | 'completed' | 'failed'
  processed: number
  total: number
  error?: string
}

const POLL_INTERVAL_MS = 1500

export function AdminStandardRecommendSettings() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [sheetUrlInput, setSheetUrlInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingLink, setSavingLink] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadSettings = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/standard-recommend/settings')
      const result = await res.json()
      if (result.success) {
        setSettings(result.data)
        setSheetUrlInput(result.data.sheet_url || '')
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
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
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

  const pollSyncStatus = (syncId: string) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/standard-recommend/sync?syncId=${syncId}`)
        const result = await res.json()
        if (!result.success) return

        setSyncStatus({
          status: result.status,
          processed: result.processed || 0,
          total: result.total || 0,
          error: result.error,
        })

        if (result.status === 'completed' || result.status === 'failed') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current)
          if (result.status === 'completed') {
            toast({ title: "동기화 완료", description: `${result.processed}개 표준이 동기화되었습니다.` })
          } else {
            toast({
              title: "동기화 실패",
              description: result.error || "알 수 없는 오류가 발생했습니다.",
              variant: "destructive",
            })
          }
          await loadSettings()
        }
      } catch (error) {
        console.error('Failed to poll sync status:', error)
      }
    }, POLL_INTERVAL_MS)
  }

  const startSync = async () => {
    try {
      setSyncStatus({ status: 'pending', processed: 0, total: 0 })
      const res = await fetch('/api/admin/standard-recommend/sync', { method: 'POST' })
      const result = await res.json()
      if (!result.success) throw new Error(result.error || '동기화 시작 실패')
      pollSyncStatus(result.syncId)
    } catch (error: any) {
      setSyncStatus(null)
      toast({
        title: "동기화 시작 실패",
        description: error.message || "동기화를 시작하지 못했습니다.",
        variant: "destructive",
      })
    }
  }

  const isSyncing = syncStatus?.status === 'pending' || syncStatus?.status === 'running'
  const progressPercent =
    syncStatus && syncStatus.total > 0 ? Math.round((syncStatus.processed / syncStatus.total) * 100) : 0

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
            표준 목록을 관리하는 공개 구글 스프레드시트 링크를 등록하면, 동기화 시 그 내용을 기반으로
            AI 표준 추천 검색 데이터가 갱신됩니다.
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

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-muted-foreground space-y-1">
              {settings?.last_synced_at ? (
                <div>
                  마지막 동기화: {new Date(settings.last_synced_at).toLocaleString('ko-KR')}
                  {settings.last_sync_status === 'completed' && (
                    <span className="inline-flex items-center gap-1 text-green-600 ml-2">
                      <CheckCircle2 className="w-3 h-3" /> 성공
                    </span>
                  )}
                  {settings.last_sync_status === 'failed' && (
                    <span className="inline-flex items-center gap-1 text-destructive ml-2">
                      <AlertCircle className="w-3 h-3" /> 실패
                    </span>
                  )}
                </div>
              ) : (
                <div>아직 동기화된 적이 없습니다.</div>
              )}
            </div>
            <Button onClick={startSync} disabled={isSyncing || !settings?.sheet_url}>
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <PlayCircle className="w-4 h-4 mr-2" />
              )}
              동기화 시작
            </Button>
          </div>

          {syncStatus && (
            <div className="space-y-2 pt-2">
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${syncStatus.status === 'completed' ? 100 : progressPercent}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {syncStatus.status === 'pending' && '동기화 준비 중...'}
                {syncStatus.status === 'running' && `${syncStatus.processed} / ${syncStatus.total} 처리 중...`}
                {syncStatus.status === 'completed' && `완료 — ${syncStatus.processed}개 동기화됨`}
                {syncStatus.status === 'failed' && `실패: ${syncStatus.error || '알 수 없는 오류'}`}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
