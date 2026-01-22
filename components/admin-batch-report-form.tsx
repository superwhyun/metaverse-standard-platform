'use client'

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { FileText, Upload, Loader2, CheckCircle2, AlertCircle, Save, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "./ui/use-toast"
import { VTT_PROMPT } from "@/config/vtt-prompt"

interface BatchItem {
    id: string
    file: File
    status: 'pending' | 'analyzing' | 'ready' | 'registering' | 'completed' | 'error'
    error?: string
    data?: {
        title: string
        date: string
        organization: string
        category: string
        location: string
        summary: string
        content: string
        tags: string[]
    }
    isDuplicate?: boolean
}

interface AdminBatchReportFormProps {
    onCancel: () => void
    onSuccess?: () => void
}

export function AdminBatchReportForm({ onCancel, onSuccess }: AdminBatchReportFormProps) {
    const [items, setItems] = useState<BatchItem[]>([])
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files) {
            addFiles(Array.from(e.dataTransfer.files))
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addFiles(Array.from(e.target.files))
        }
    }

    const addFiles = (files: File[]) => {
        const vttFiles = files.filter(f => f.name.endsWith('.vtt'))
        if (vttFiles.length === 0) {
            toast({
                title: "잘못된 파일",
                description: "VTT 파일만 업로드 가능합니다.",
                variant: "destructive"
            })
            return
        }

        const newItems: BatchItem[] = vttFiles
            .filter(file => !items.some(item => item.file.name === file.name && item.file.size === file.size))
            .map(file => ({
                id: Math.random().toString(36).substring(2, 9),
                file,
                status: 'pending'
            }))

        setItems(prev => [...prev, ...newItems])
    }

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id))
    }

    const analyzeFile = async (item: BatchItem) => {
        const apiKey = localStorage.getItem('openai_api_key')
        if (!apiKey) {
            toast({
                title: "API 키 필요",
                description: "설정 메뉴에서 OpenAI API 키를 먼저 등록해주세요.",
                variant: "destructive"
            })
            return
        }

        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'analyzing' } : i))

        try {
            const text = await item.file.text()
            const usageInstructions = `
You act as a professional meeting minutes writer.
Analyze the provided VTT transcript and output a JSON object with the following fields:
1. "title": A concise title (format: "Group Name - #[Ordinal]").
2. "date": Meeting date in "YYYY-MM-DD" format.
3. "organization": Standard organization name (e.g., ISO, IEC, MSF, etc.).
4. "category": One of "메타버스 기구", "표준 기구", "학술 행사", "국제 협력", "기타".
5. "location": Meeting location (e.g., "온라인", "서울", etc.).
6. "summary": 1000자 이내의 요약 내용.
7. "content": 상세 회의 보고서 (Markdown 포맷).
8. "tags": 관련 키워드 배열 (예: ["메타버스", "표준화", "X3D"]).

For the "content" field, strictly follow these style rules:
${VTT_PROMPT}

CRITICAL: Output MUST be valid, parseable JSON. No markdown code blocks.
`;
            const fullPrompt = `${usageInstructions}\n\nFilename: ${item.file.name}\n\nTranscript:\n${text}`

            const response = await fetch('https://api.openai.com/v1/responses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-5',
                    reasoning: { effort: 'low' },
                    input: [{ role: 'user', content: fullPrompt }],
                    max_output_tokens: 4096
                })
            })

            if (!response.ok) {
                const errData = await response.json()
                throw new Error(errData.error?.message || 'OpenAI API Error')
            }

            const data = await response.json()
            let content = ''
            if (typeof data.output_text === 'string' && data.output_text.trim()) {
                content = data.output_text.trim()
            } else if (Array.isArray(data.output)) {
                for (const part of data.output) {
                    if (part.type === 'message' && Array.isArray(part.content)) {
                        for (const c of part.content) {
                            if ((c.type === 'text' || c.type === 'output_text') && c.text) content += c.text
                        }
                    } else if (part.text) content += part.text
                }
            }

            const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim()
            const jsonStart = cleanJson.indexOf('{')
            const jsonEnd = cleanJson.lastIndexOf('}')
            const result = JSON.parse(cleanJson.substring(jsonStart, jsonEnd + 1))
            const analyzedData = {
                title: result.title || item.file.name,
                date: result.date || new Date().toISOString().split('T')[0],
                organization: result.organization || "MSF",
                category: result.category || "국제 협력",
                location: result.location || "온라인",
                summary: result.summary || "",
                content: result.content || "",
                tags: result.tags || []
            }

            // DB 중복 체크 (날짜와 제목 기준)
            let isDuplicate = false
            try {
                const checkRes = await fetch(`/api/conferences?startDate=${analyzedData.date}&endDate=${analyzedData.date}`)
                if (checkRes.ok) {
                    const resJson = await checkRes.json()
                    const existingConfs = resJson.data || []
                    isDuplicate = existingConfs.some((c: any) => c.title === analyzedData.title)
                }
            } catch (e) {
                console.error("Duplicate check failed", e)
            }

            setItems(prev => prev.map(i => i.id === item.id ? {
                ...i,
                status: 'ready',
                isDuplicate,
                data: analyzedData
            } : i))

        } catch (error: any) {
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', error: error.message } : i))
        }
    }

    const registerItem = async (item: BatchItem) => {
        if (!item.data) return

        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'registering' } : i))

        try {
            // 1. Create Conference
            const confResponse = await fetch('/api/conferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: item.data.title,
                    organization: item.data.organization,
                    startDate: item.data.date,
                    endDate: item.data.date,
                    location: item.data.location,
                    description: item.data.summary
                })
            })

            if (!confResponse.ok) throw new Error('회의 등록 실패')
            const confData = await confResponse.json()
            const conferenceId = confData.data.id

            // 2. Create Report
            const reportResponse = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: item.data.title,
                    date: item.data.date,
                    summary: item.data.summary,
                    content: item.data.content,
                    category: item.data.category,
                    organization: item.data.organization,
                    tags: item.data.tags,
                    conferenceId: conferenceId
                })
            })

            if (!reportResponse.ok) throw new Error('보고서 등록 실패')

            setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'completed' } : i))
            toast({ title: "등록 완료", description: `"${item.data?.title}" 등록되었습니다.` })

            if (onSuccess) onSuccess()

        } catch (error: any) {
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', error: error.message } : i))
        }
    }

    const analyzeAll = () => {
        items.filter(i => i.status === 'pending' || i.status === 'error').forEach(analyzeFile)
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    VTT 배치 업로드 등록
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div
                    className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center transition-colors cursor-pointer ${dragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary/50"
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">여러 VTT 파일을 드래그하여 놓으세요</p>
                    <p className="text-sm text-muted-foreground">또는 클릭하여 파일을 선택하세요</p>
                    <Input
                        ref={fileInputRef}
                        type="file"
                        accept=".vtt"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                </div>

                {items.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">업로드 목록 ({items.length})</h3>
                            <div className="flex gap-2">
                                <Button onClick={analyzeAll} variant="secondary" size="sm">
                                    전체 분석 시작
                                </Button>
                                <Button onClick={() => setItems([])} variant="outline" size="sm">
                                    목록 비우기
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[120px]">파일명</TableHead>
                                        <TableHead className="min-w-[180px]">회의/보고서 제목</TableHead>
                                        <TableHead className="min-w-[120px]">날짜</TableHead>
                                        <TableHead className="min-w-[100px]">기관</TableHead>
                                        <TableHead className="min-w-[100px]">카테고리</TableHead>
                                        <TableHead className="min-w-[100px]">장소</TableHead>
                                        <TableHead className="min-w-[150px]">요약</TableHead>
                                        <TableHead className="min-w-[120px]">태그</TableHead>
                                        <TableHead>상태</TableHead>
                                        <TableHead className="text-right">작업</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-xs text-muted-foreground truncate max-w-[120px]" title={item.file.name}>
                                                {item.file.name}
                                            </TableCell>
                                            <TableCell>
                                                {item.data ? (
                                                    <div className="flex flex-col gap-1">
                                                        <Input
                                                            value={item.data.title}
                                                            onChange={(e) => {
                                                                const title = e.target.value
                                                                setItems(prev => prev.map(i => i.id === item.id ? { ...i, data: { ...i.data!, title } } : i))
                                                            }}
                                                            className="h-8 text-sm"
                                                        />
                                                        {item.isDuplicate && (
                                                            <Badge variant="destructive" className="w-fit text-[10px] h-4 py-0">중복 데이터</Badge>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {item.data ? (
                                                    <Input
                                                        type="date"
                                                        value={item.data.date}
                                                        onChange={(e) => {
                                                            const date = e.target.value
                                                            setItems(prev => prev.map(i => i.id === item.id ? { ...i, data: { ...i.data!, date } } : i))
                                                        }}
                                                        className="h-8 text-sm w-[130px]"
                                                    />
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {item.data ? (
                                                    <Input
                                                        value={item.data.organization}
                                                        onChange={(e) => {
                                                            const organization = e.target.value
                                                            setItems(prev => prev.map(i => i.id === item.id ? { ...i, data: { ...i.data!, organization } } : i))
                                                        }}
                                                        className="h-8 text-sm w-[80px]"
                                                    />
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {item.data ? (
                                                    <Input
                                                        value={item.data.category}
                                                        onChange={(e) => {
                                                            const category = e.target.value
                                                            setItems(prev => prev.map(i => i.id === item.id ? { ...i, data: { ...i.data!, category } } : i))
                                                        }}
                                                        className="h-8 text-sm w-[100px]"
                                                    />
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {item.data ? (
                                                    <Input
                                                        value={item.data.location}
                                                        onChange={(e) => {
                                                            const location = e.target.value
                                                            setItems(prev => prev.map(i => i.id === item.id ? { ...i, data: { ...i.data!, location } } : i))
                                                        }}
                                                        className="h-8 text-sm w-[80px]"
                                                    />
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {item.data ? (
                                                    <textarea
                                                        value={item.data.summary}
                                                        onChange={(e) => {
                                                            const summary = e.target.value
                                                            setItems(prev => prev.map(i => i.id === item.id ? { ...i, data: { ...i.data!, summary } } : i))
                                                        }}
                                                        className="w-full min-w-[150px] h-12 text-xs p-1 border rounded resize-none"
                                                    />
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {item.data ? (
                                                    <div className="flex flex-wrap gap-1 max-w-[120px]">
                                                        {item.data.tags.map((tag, idx) => (
                                                            <Badge key={idx} variant="outline" className="text-[10px] px-1 py-0 h-4">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {item.status === 'analyzing' && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                                                    {item.status === 'registering' && <Loader2 className="w-4 h-4 animate-spin text-secondary" />}
                                                    {item.status === 'ready' && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                                                    {item.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                                    {item.status === 'error' && (
                                                        <div className="flex items-center gap-1 text-red-500">
                                                            <AlertCircle className="w-4 h-4" />
                                                            <span className="text-xs">Error</span>
                                                        </div>
                                                    )}
                                                    <span className="text-xs font-medium">
                                                        {item.status === 'pending' && "대기 중"}
                                                        {item.status === 'analyzing' && "분석 중..."}
                                                        {item.status === 'ready' && "준비됨"}
                                                        {item.status === 'registering' && "등록 중..."}
                                                        {item.status === 'completed' && "완료"}
                                                        {item.status === 'error' && "실패"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {item.status === 'pending' || item.status === 'error' ? (
                                                        <Button onClick={() => analyzeFile(item)} size="sm" variant="ghost">
                                                            분석
                                                        </Button>
                                                    ) : item.status === 'ready' ? (
                                                        <Button onClick={() => registerItem(item)} size="sm" variant="default">
                                                            <Save className="w-4 h-4 mr-1" /> 등록
                                                        </Button>
                                                    ) : null}
                                                    <Button onClick={() => removeItem(item.id)} size="sm" variant="ghost" className="text-red-500">
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-4">
                    <Button variant="outline" onClick={onCancel}>
                        닫기
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
