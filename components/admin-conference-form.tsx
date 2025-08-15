"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Calendar, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface ConferenceFormData {
  title: string
  date: string
  time: string
  location: string
  organization: string
  hasReport: boolean
  description: string
}

interface AdminConferenceFormProps {
  onSave: (data: ConferenceFormData) => void
  onCancel: () => void
  initialData?: ConferenceFormData
  isEdit?: boolean
}

export function AdminConferenceForm({ onSave, onCancel, initialData, isEdit = false }: AdminConferenceFormProps) {
  const [formData, setFormData] = useState<ConferenceFormData>(
    initialData || {
      title: "",
      date: "",
      time: "",
      location: "",
      organization: "",
      hasReport: false,
      description: "",
    },
  )

  const [errors, setErrors] = useState<Partial<ConferenceFormData>>({})

  const organizations = ["ISO/IEC", "ITU-T", "IEEE", "W3C", "ETSI", "3GPP", "IETF", "기타"]

  const validateForm = () => {
    const newErrors: Partial<ConferenceFormData> = {}

    if (!formData.title.trim()) newErrors.title = "회의 제목을 입력해주세요"
    if (!formData.date) newErrors.date = "날짜를 선택해주세요"
    if (!formData.time.trim()) newErrors.time = "시간을 입력해주세요"
    if (!formData.location.trim()) newErrors.location = "장소를 입력해주세요"
    if (!formData.organization) newErrors.organization = "주최 기관을 선택해주세요"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSave(formData)
    }
  }

  const handleInputChange = (field: keyof ConferenceFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {isEdit ? "회의 일정 수정" : "새 회의 일정 등록"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
          role="form"
          aria-label={isEdit ? "회의 일정 수정 폼" : "새 회의 일정 등록 폼"}
        >
          <div className="space-y-2">
            <Label htmlFor="title">회의 제목 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="예: ISO/IEC JTC 1/SC 24 메타버스 표준화 회의"
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">날짜 *</Label>
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
              <Label htmlFor="time">시간 *</Label>
              <Input
                id="time"
                value={formData.time}
                onChange={(e) => handleInputChange("time", e.target.value)}
                placeholder="예: 09:00-17:00"
                className={errors.time ? "border-destructive" : ""}
              />
              {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">장소 *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="예: 서울 코엑스, 온라인"
                className={errors.location ? "border-destructive" : ""}
              />
              {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization">주최 기관 *</Label>
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
            <Label htmlFor="description">회의 설명</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="회의에 대한 추가 설명을 입력해주세요"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasReport"
              checked={formData.hasReport}
              onCheckedChange={(checked) => handleInputChange("hasReport", checked as boolean)}
            />
            <Label htmlFor="hasReport">회의 보고서 있음</Label>
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
