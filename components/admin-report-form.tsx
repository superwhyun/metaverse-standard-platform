"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { FileText, Save, X, Tag, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface Conference {
  id: number
  title: string
  organization: string
  endDate: string
  startDate: string
}

interface ReportFormData {
  title: string
  date: string
  summary: string
  content: string
  category: string
  organization: string
  tags: string[]
  downloadUrl: string
  conferenceId?: number
}

interface AdminReportFormProps {
  onSave: (data: ReportFormData) => void
  onCancel: () => void
  initialData?: ReportFormData
  isEdit?: boolean
  conferences?: Conference[]
}

export function AdminReportForm({ onSave, onCancel, initialData, isEdit = false, conferences = [] }: AdminReportFormProps) {
  const [formData, setFormData] = useState<ReportFormData>(() => {
    if (initialData) {
      // Ensure tags is always an array
      let tags = [];
      if (initialData.tags) {
        if (Array.isArray(initialData.tags)) {
          tags = initialData.tags;
        } else if (typeof initialData.tags === 'string') {
          try {
            tags = JSON.parse(initialData.tags);
          } catch (e) {
            tags = [];
          }
        }
      }
      
      return {
        title: initialData.title || "",
        date: initialData.date || "",
        summary: initialData.summary || "",
        content: initialData.content || "",
        category: initialData.category || "",
        organization: initialData.organization || "",
        tags: tags,
        downloadUrl: initialData.downloadUrl || "",
        conferenceId: initialData.conferenceId,
      };
    }
    
    return {
      title: "",
      date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      summary: "",
      content: "",
      category: "",
      organization: "",
      tags: [],
      downloadUrl: "",
      conferenceId: undefined,
    };
  })

  const [errors, setErrors] = useState<Partial<ReportFormData>>({})
  const [newTag, setNewTag] = useState("")

  const categories = [
    "상호운용성",
    "품질 평가",
    "웹 표준",
    "시스템 아키텍처",
    "엣지 컴퓨팅",
    "보안",
    "프라이버시",
    "기타",
  ]

  const organizations = ["ISO/IEC", "ITU-T", "IEEE", "W3C", "ETSI", "3GPP", "IETF", "기타"]

  // 오늘 기준으로 종료된 회의들 중 가장 가까운 10개 필터링
  const getRecentEndedConferences = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return conferences
      .filter(conf => {
        const endDate = new Date(conf.endDate);
        endDate.setHours(23, 59, 59, 999);
        return endDate < today;
      })
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
      .slice(0, 10);
  };

  const recentEndedConferences = getRecentEndedConferences();

  // 회의 선택 시 자동 입력 처리
  const handleConferenceSelect = (conferenceId: string) => {
    if (conferenceId === "none") {
      setFormData(prev => ({
        ...prev,
        conferenceId: undefined,
        title: "",
        organization: ""
      }));
      return;
    }

    const conference = conferences.find(c => c.id.toString() === conferenceId);
    if (conference) {
      setFormData(prev => ({
        ...prev,
        conferenceId: conference.id,
        title: `${conference.title} 동향 분석 보고서`,
        organization: conference.organization
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<ReportFormData> = {}

    if (!formData.title.trim()) newErrors.title = "보고서 제목을 입력해주세요"
    if (!formData.date) newErrors.date = "날짜를 선택해주세요"
    if (!formData.summary.trim()) newErrors.summary = "요약을 입력해주세요"
    if (!formData.content.trim()) newErrors.content = "내용을 입력해주세요"
    if (!formData.category) newErrors.category = "카테고리를 선택해주세요"
    if (!formData.organization) newErrors.organization = "기관을 선택해주세요"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSave(formData)
    }
  }

  const handleInputChange = (field: keyof ReportFormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const addTag = () => {
    const currentTags = Array.isArray(formData.tags) ? formData.tags : []
    if (newTag.trim() && !currentTags.includes(newTag.trim())) {
      handleInputChange("tags", [...currentTags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    const currentTags = Array.isArray(formData.tags) ? formData.tags : []
    handleInputChange(
      "tags",
      currentTags.filter((tag) => tag !== tagToRemove),
    )
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "s":
            event.preventDefault()
            if (validateForm()) {
              onSave(formData)
            }
            break
          case "Enter":
            event.preventDefault()
            if (validateForm()) {
              onSave(formData)
            }
            break
        }
      } else if (event.key === "Escape") {
        event.preventDefault()
        onCancel()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [formData, onSave, onCancel])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {isEdit ? "보고서 수정" : "새 보고서 등록"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
          role="form"
          aria-label={isEdit ? "보고서 수정 폼" : "새 보고서 등록 폼"}
        >
          {/* 관련 회의 선택 */}
          {recentEndedConferences.length > 0 && (
            <div className="space-y-2">
              <Label>관련 회의 (선택사항)</Label>
              <Select 
                value={formData.conferenceId ? formData.conferenceId.toString() : "none"} 
                onValueChange={handleConferenceSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="회의를 선택하면 제목과 기관이 자동 입력됩니다" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">회의 선택 안함</SelectItem>
                  {recentEndedConferences.map((conference) => (
                    <SelectItem key={conference.id} value={conference.id.toString()}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{conference.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {conference.organization} · 종료일: {conference.endDate}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                최근 종료된 회의 {recentEndedConferences.length}개를 표시합니다
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">보고서 제목 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="예: ISO/IEC 23005 메타버스 상호운용성 표준 동향"
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">발행일 *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                className={errors.date ? "border-destructive" : ""}
              />
              {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
            </div>

            <div className="space-y-2">
              <Label>카테고리 *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
            </div>

            <div className="space-y-2">
              <Label>기관 *</Label>
              <Select value={formData.organization} onValueChange={(value) => handleInputChange("organization", value)}>
                <SelectTrigger className={errors.organization ? "border-destructive" : ""}>
                  <SelectValue placeholder="기관 선택" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org} value={org}>
                      {org}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.organization && <p className="text-sm text-destructive">{errors.organization}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">요약 *</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => handleInputChange("summary", e.target.value)}
              placeholder="보고서의 주요 내용을 요약해주세요"
              rows={3}
              className={errors.summary ? "border-destructive" : ""}
            />
            {errors.summary && <p className="text-sm text-destructive">{errors.summary}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">내용 * (마크다운 지원)</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
              placeholder="## 주요 내용
마크다운 문법을 사용하여 작성하세요:

**굵은 글씨**, *기울임*, `코드`

### 기술적 세부사항
1. 첫 번째 항목
2. 두 번째 항목

### 관련 표준
- ISO/IEC 23005
- ITU-T H.430

### 결론
메타버스 표준화의 중요성..."
              rows={12}
              className={`${errors.content ? "border-destructive" : ""} min-h-[300px] max-h-[500px] resize-y`}
            />
            <p className="text-xs text-muted-foreground">
              마크다운 문법을 사용할 수 있습니다: **굵게**, *기울임*, ### 제목, - 목록, 1. 번호 목록
            </p>
            {errors.content && <p className="text-sm text-destructive">{errors.content}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">태그</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="태그를 입력하고 Enter를 누르세요"
                className="flex-1"
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(Array.isArray(formData.tags) ? formData.tags : []).map((tag) => (
                <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="downloadUrl">다운로드 URL</Label>
            <Input
              id="downloadUrl"
              value={formData.downloadUrl}
              onChange={(e) => handleInputChange("downloadUrl", e.target.value)}
              placeholder="예: /reports/report-filename.pdf"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1" aria-label={`${isEdit ? "수정" : "등록"} (Ctrl+S)`}>
              <Save className="w-4 h-4 mr-2" />
              {isEdit ? "수정" : "등록"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 bg-transparent"
              aria-label="취소 (Escape)"
            >
              <X className="w-4 h-4 mr-2" />
              취소
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
