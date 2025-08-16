'use client'

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
import { toast } from "./ui/use-toast"

interface ConferenceFormData {
  title: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
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

interface Organization {
  id: number
  name: string
}

export function AdminConferenceForm({ onSave, onCancel, initialData, isEdit = false }: AdminConferenceFormProps) {
  const [formData, setFormData] = useState<ConferenceFormData>(
    initialData || {
      title: "",
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      location: "",
      organization: "",
      hasReport: false,
      description: "",
    },
  )

  const [errors, setErrors] = useState<Partial<ConferenceFormData>>({})
  const [organizations, setOrganizations] = useState<Organization[]>([])

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch('/api/organizations')
        if (!response.ok) {
          throw new Error('Failed to fetch organizations')
        }
        const data = await response.json()
        setOrganizations(data)
      } catch (error) {
        toast({
          title: "오류",
          description: "주최 기관 목록을 불러오는 데 실패했습니다.",
          variant: "destructive",
        })
      }
    }
    fetchOrganizations()
  }, [])

  const isMultiDay = formData.startDate && formData.endDate && formData.startDate !== formData.endDate

  const validateForm = () => {
    const newErrors: Partial<ConferenceFormData> = {}

    if (!formData.title.trim()) newErrors.title = "회의 제목을 입력해주세요"
    if (!formData.startDate) newErrors.startDate = "시작 날짜를 선택해주세요"
    if (!formData.endDate) newErrors.endDate = "종료 날짜를 선택해주세요"
    if (!formData.location.trim()) newErrors.location = "장소를 입력해주세요"
    if (!formData.organization) newErrors.organization = "주최 기관을 선택해주세요"

    // Validate dates
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate)
      const endDate = new Date(formData.endDate)
      if (endDate < startDate) {
        newErrors.endDate = "종료 날짜는 시작 날짜보다 늦어야 합니다"
      }
    }

    // Validate times for single-day conferences
    if (!isMultiDay) {
      if (!formData.startTime.trim()) newErrors.startTime = "시작 시간을 입력해주세요"
      if (!formData.endTime.trim()) newErrors.endTime = "종료 시간을 입력해주세요"
      
      // Validate time format and logic
      if (formData.startTime && formData.endTime) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
        if (!timeRegex.test(formData.startTime)) {
          newErrors.startTime = "올바른 시간 형식을 입력해주세요 (HH:MM)"
        }
        if (!timeRegex.test(formData.endTime)) {
          newErrors.endTime = "올바른 시간 형식을 입력해주세요 (HH:MM)"
        }
        
        if (timeRegex.test(formData.startTime) && timeRegex.test(formData.endTime)) {
          const [startHour, startMin] = formData.startTime.split(':').map(Number)
          const [endHour, endMin] = formData.endTime.split(':').map(Number)
          const startMinutes = startHour * 60 + startMin
          const endMinutes = endHour * 60 + endMin
          
          if (endMinutes <= startMinutes) {
            newErrors.endTime = "종료 시간은 시작 시간보다 늦어야 합니다"
          }
        }
      }
    }

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

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">시작 날짜 *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                  className={errors.startDate ? "border-destructive" : ""}
                />
                {errors.startDate && <p className="text-sm text-destructive">{errors.startDate}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">종료 날짜 *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  className={errors.endDate ? "border-destructive" : ""}
                />
                {errors.endDate && <p className="text-sm text-destructive">{errors.endDate}</p>}
              </div>
            </div>

            {isMultiDay && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>여러 날 회의:</strong> 선택한 기간동안 종일 회의로 설정됩니다.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">시작 시간 {!isMultiDay && "*"}</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange("startTime", e.target.value)}
                  className={errors.startTime ? "border-destructive" : ""}
                  disabled={isMultiDay}
                  placeholder={isMultiDay ? "종일 회의" : ""}
                />
                {errors.startTime && <p className="text-sm text-destructive">{errors.startTime}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">종료 시간 {!isMultiDay && "*"}</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange("endTime", e.target.value)}
                  className={errors.endTime ? "border-destructive" : ""}
                  disabled={isMultiDay}
                  placeholder={isMultiDay ? "종일 회의" : ""}
                />
                {errors.endTime && <p className="text-sm text-destructive">{errors.endTime}</p>}
              </div>
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
              <Label>주최 기관 *</Label>
              <Select value={formData.organization} onValueChange={(value) => handleInputChange("organization", value)}>
                <SelectTrigger className={errors.organization ? "border-destructive" : ""}>
                  <SelectValue placeholder="기관 선택" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.name}>
                      {org.name}
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