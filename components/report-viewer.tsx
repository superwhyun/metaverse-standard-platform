"use client"

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Download,
  Share2,
  Bookmark,
  Calendar,
  Building,
  Tag,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface Report {
  id: number
  title: string
  date: string
  summary: string
  content: string
  category: string
  organization: string
  tags: string[]
  downloadUrl?: string
  tableOfContents?: { id: string; title: string; level: number }[]
}

interface ReportViewerProps {
  report: Report
  onBack: () => void
}

export function ReportViewer({ report, onBack }: ReportViewerProps) {
  // 마크다운 내용을 번호와 함께 전처리하는 함수
  const processMarkdownWithNumbers = (content: string) => {
    const lines = content.split('\n')
    const counters = { h1: 0, h2: 0, h3: 0 }
    const koreanChars = ['가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카', '타', '파', '하']
    
    return lines.map(line => {
      if (line.startsWith('# ')) {
        counters.h1++
        counters.h2 = 0
        counters.h3 = 0
        return line.replace('# ', `# ${counters.h1}. `)
      } else if (line.startsWith('## ')) {
        counters.h2++
        counters.h3 = 0
        const koreanChar = koreanChars[counters.h2 - 1] || counters.h2
        return line.replace('## ', `## ${koreanChar}. `)
      } else if (line.startsWith('### ')) {
        counters.h3++
        return line.replace('### ', `### ${counters.h3}) `)
      }
      return line
    }).join('\n')
  }

  const processedContent = processMarkdownWithNumbers(report.content)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen flex justify-center py-8 px-4">
        <div className="bg-background rounded-lg shadow-2xl w-full max-w-4xl h-fit">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b bg-card sticky top-0 z-10 rounded-t-lg">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Bookmark className="w-4 h-4 mr-2" />
                북마크
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                공유
              </Button>
              {report.downloadUrl && (
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  다운로드
                </Button>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div>
          <Card className="border-0 rounded-none shadow-none">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="secondary">{report.category}</Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {report.date}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Building className="w-4 h-4" />
                {report.organization}
              </div>
            </div>

            <CardTitle className="font-serif text-2xl leading-tight">{report.title}</CardTitle>

            <div className="flex flex-wrap gap-1 mt-4">
              {(Array.isArray(report.tags) ? report.tags : []).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </CardHeader>

          <CardContent className="prose max-w-none">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">요약</h3>
              <p className="text-lg leading-relaxed mb-6 text-muted-foreground">{report.summary}</p>
            </div>

            <Separator className="my-6" />

            <div className="prose prose-gray max-w-none leading-relaxed">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({children}) => (
                    <h1 className="text-2xl font-bold mb-4 mt-8 text-gray-900 border-b border-gray-200 pb-2">
                      {children}
                    </h1>
                  ),
                  h2: ({children}) => (
                    <h2 className="text-xl font-semibold mb-3 mt-6 ml-4 text-gray-900">
                      {children}
                    </h2>
                  ),
                  h3: ({children}) => (
                    <h3 className="text-lg font-semibold mb-2 mt-4 ml-8 text-gray-900">
                      {children}
                    </h3>
                  ),
                  p: ({children}) => <p className="mb-4 leading-relaxed text-gray-700 whitespace-pre-wrap">{children}</p>,
                  ul: ({children}) => <ul className="list-disc ml-12 mb-4 space-y-2 text-gray-700">{children}</ul>,
                  ol: ({children}) => <ol className="list-decimal ml-12 mb-4 space-y-2 text-gray-700">{children}</ol>,
                  li: ({children}) => <li className="leading-relaxed">{children}</li>,
                  blockquote: ({children}) => (
                    <blockquote className="border-l-4 border-blue-200 pl-4 my-4 italic text-gray-600 bg-blue-50 py-2">
                      {children}
                    </blockquote>
                  ),
                  strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                  em: ({children}) => <em className="italic text-gray-600">{children}</em>,
                  code: ({children}) => <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">{children}</code>,
                  pre: ({children}) => (
                    <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4 border border-gray-200">
                      {children}
                    </pre>
                  ),
                  table: ({children}) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full border-collapse border border-gray-300">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({children}) => (
                    <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-left">
                      {children}
                    </th>
                  ),
                  td: ({children}) => (
                    <td className="border border-gray-300 px-4 py-2">
                      {children}
                    </td>
                  ),
                }}
              >
                {processedContent}
              </ReactMarkdown>
            </div>
          </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
