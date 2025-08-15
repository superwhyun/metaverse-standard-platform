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

interface ReportFormData {
  title: string
  date: string
  summary: string
  content: string
  category: string
  organization: string
  tags: string[]
  downloadUrl: string
}

interface AdminReportFormProps {
  onSave: (data: ReportFormData) => void
  onCancel: () => void
  initialData?: ReportFormData
  isEdit?: boolean
}

export function AdminReportForm({ onSave, onCancel, initialData, isEdit = false }: AdminReportFormProps) {
  const [formData, setFormData] = useState<ReportFormData>(
    initialData || {
      title: "",
      date: "",
      summary: "",
      content: "",
      category: "",
      organization: "",
      tags: [],
      downloadUrl: "",
    },
  )

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
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      handleInputChange("tags", [...formData.tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    handleInputChange(
      "tags",
      formData.tags.filter((tag) => tag !== tagToRemove),
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
              <Label htmlFor="category">카테고리 *</Label>
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
              <Label htmlFor="organization">기관 *</Label>
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
            <Label htmlFor="content">내용 *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
              placeholder="보고서의 상세 내용을 입력해주세요"
              rows={8}
              className={errors.content ? "border-destructive" : ""}
            />
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
              {formData.tags.map((tag) => (
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
