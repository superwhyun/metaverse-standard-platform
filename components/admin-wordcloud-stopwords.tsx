'use client'

import { useState, useEffect } from "react"
import { Save, Plus, X, RefreshCw, Tag as TagIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "./ui/use-toast"

interface StopwordsData {
  words: string[]
  wordsString: string
  updatedAt?: string
}

interface StopwordsResponse {
  korean?: StopwordsData
  english?: StopwordsData
}

export function AdminWordcloudStopwords() {
  const [data, setData] = useState<StopwordsResponse>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({ korean: false, english: false })
  const [newWords, setNewWords] = useState({ korean: '', english: '' })
  const [editingWords, setEditingWords] = useState({ korean: false, english: false })
  const [tempWords, setTempWords] = useState({ korean: '', english: '' })

  const loadStopwords = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/wordcloud-stopwords')
      if (!response.ok) {
        throw new Error('Failed to load stopwords')
      }
      const result = await response.json()
      if (result.success) {
        setData(result.data)
        setTempWords({
          korean: result.data.korean?.wordsString || '',
          english: result.data.english?.wordsString || ''
        })
      }
    } catch (error) {
      console.error('Error loading stopwords:', error)
      toast({
        title: "오류",
        description: "배제어 목록을 불러오는 데 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveStopwords = async (language: 'korean' | 'english') => {
    try {
      setSaving(prev => ({ ...prev, [language]: true }))
      
      const wordsToSave = editingWords[language] ? tempWords[language] : 
        [...(data[language]?.words || []), ...newWords[language].split(',').map(w => w.trim()).filter(w => w)].join(',')

      const response = await fetch('/api/admin/wordcloud-stopwords', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language,
          words: wordsToSave
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save stopwords')
      }

      const result = await response.json()
      if (result.success) {
        toast({
          title: "저장 완료",
          description: result.message,
        })
        
        // Reset states
        setNewWords(prev => ({ ...prev, [language]: '' }))
        setEditingWords(prev => ({ ...prev, [language]: false }))
        
        // Reload data
        await loadStopwords()
      }
    } catch (error) {
      console.error('Error saving stopwords:', error)
      toast({
        title: "저장 실패",
        description: "배제어 목록 저장에 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setSaving(prev => ({ ...prev, [language]: false }))
    }
  }

  const removeWord = async (language: 'korean' | 'english', wordToRemove: string) => {
    const currentWords = data[language]?.words || []
    const updatedWords = currentWords.filter(word => word !== wordToRemove)
    
    try {
      setSaving(prev => ({ ...prev, [language]: true }))
      
      const response = await fetch('/api/admin/wordcloud-stopwords', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language,
          words: updatedWords.join(',')
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to remove word')
      }

      const result = await response.json()
      if (result.success) {
        toast({
          title: "삭제 완료",
          description: `"${wordToRemove}" 단어가 삭제되었습니다.`,
        })
        await loadStopwords()
      }
    } catch (error) {
      console.error('Error removing word:', error)
      toast({
        title: "삭제 실패",
        description: "단어 삭제에 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setSaving(prev => ({ ...prev, [language]: false }))
    }
  }

  const startEditing = (language: 'korean' | 'english') => {
    setEditingWords(prev => ({ ...prev, [language]: true }))
    setTempWords(prev => ({ ...prev, [language]: data[language]?.wordsString || '' }))
  }

  const cancelEditing = (language: 'korean' | 'english') => {
    setEditingWords(prev => ({ ...prev, [language]: false }))
    setTempWords(prev => ({ ...prev, [language]: data[language]?.wordsString || '' }))
  }

  useEffect(() => {
    loadStopwords()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="ml-2">배제어 목록을 불러오는 중...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderLanguageSection = (language: 'korean' | 'english', title: string) => {
    const languageData = data[language]
    const isEditing = editingWords[language]
    const isSaving = saving[language]

    return (
      <Card key={language}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TagIcon className="w-5 h-5" />
              {title} 배제어 ({languageData?.words?.length || 0}개)
            </CardTitle>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startEditing(language)}
                >
                  전체 편집
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadStopwords}
                disabled={loading}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor={`${language}-textarea`}>
                  배제어 목록 (쉼표로 구분)
                </Label>
                <textarea
                  id={`${language}-textarea`}
                  value={tempWords[language]}
                  onChange={(e) => setTempWords(prev => ({ ...prev, [language]: e.target.value }))}
                  className="w-full h-32 p-3 border border-input bg-background text-sm resize-none rounded-md"
                  placeholder="단어1, 단어2, 단어3..."
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => saveStopwords(language)}
                  disabled={isSaving}
                  size="sm"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  저장
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => cancelEditing(language)}
                  disabled={isSaving}
                  size="sm"
                >
                  취소
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Add new words */}
              <div className="flex gap-2">
                <Input
                  placeholder="새 배제어 추가 (쉼표로 구분)"
                  value={newWords[language]}
                  onChange={(e) => setNewWords(prev => ({ ...prev, [language]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newWords[language].trim()) {
                      saveStopwords(language)
                    }
                  }}
                />
                <Button 
                  onClick={() => saveStopwords(language)}
                  disabled={!newWords[language].trim() || isSaving}
                  size="sm"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Current words */}
              <div className="flex flex-wrap gap-2">
                {languageData?.words?.map((word) => (
                  <Badge 
                    key={word} 
                    variant="secondary" 
                    className="flex items-center gap-1 px-2 py-1"
                  >
                    {word}
                    <button
                      onClick={() => removeWord(language, word)}
                      disabled={isSaving}
                      className="ml-1 hover:text-destructive transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )) || []}
              </div>

              {languageData?.updatedAt && (
                <div className="text-xs text-muted-foreground">
                  마지막 업데이트: {new Date(languageData.updatedAt).toLocaleString('ko-KR')}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>워드클라우드 배제어 관리</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            워드클라우드에서 제외할 단어들을 관리합니다. 
            의미 없는 조사, 어미, 일반적인 단어들을 배제하여 더 의미있는 키워드만 표시할 수 있습니다.
          </p>
        </CardContent>
      </Card>

      {renderLanguageSection('korean', '한글')}
      <Separator />
      {renderLanguageSection('english', '영어')}
    </div>
  )
}