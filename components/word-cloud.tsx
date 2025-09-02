"use client"

import React, { useEffect, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'

interface WordCloudProps {
  reports: Array<{
    id: number
    title: string
    summary: string
    tags?: string[]
  }>
  width?: number
  height?: number
}

function ReportWordCloudComponent({ reports, width = 400, height = 300 }: WordCloudProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [WordCloud, setWordCloud] = React.useState<any>(null)

  // 동적으로 WordCloud 라이브러리 로드
  useEffect(() => {
    import('wordcloud').then((module) => {
      setWordCloud(() => module.default)
    })
  }, [])

  // 텍스트에서 키워드 추출 및 빈도 계산
  const wordData = useMemo(() => {
    if (!reports || reports.length === 0) return []

    // 모든 보고서의 summary와 title 텍스트 수집
    const allText = reports
      .map(report => `${report.title} ${report.summary}`)
      .join(' ')

    // 영어 단어만 추출 (3글자 이상)
    const englishWords = allText
      .toLowerCase()
      .match(/[a-z]{3,}/g) || []

    // 빈도수 계산
    const frequency: Record<string, number> = {}
    englishWords.forEach(word => {
      // 불용어 제거
      const stopWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use']
      
      if (!stopWords.includes(word) && word.length >= 3) {
        frequency[word] = (frequency[word] || 0) + 1
      }
    })

    // 빈도수 기준으로 상위 30개 단어 선택
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 30)
      .map(([word, freq]) => [word, freq * 10]) // 크기 조정을 위해 가중치 적용
  }, [reports])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || wordData.length === 0 || !WordCloud) return

    // 캔버스 크기 설정
    canvas.width = width
    canvas.height = height

    // 캔버스 초기화
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, width, height)
    }

    // WordCloud 생성
    WordCloud(canvas, {
      list: wordData,
      gridSize: Math.round(16 * width / 1024),
      weightFactor: (size: number) => Math.pow(size, 0.8) * width / 1024 * 15,
      fontFamily: 'Times, serif',
      color: () => {
        // 다양한 색상 배열
        const colors = [
          'hsl(var(--primary))',
          'hsl(var(--secondary))',
          'hsl(220, 70%, 50%)',
          'hsl(280, 70%, 50%)',
          'hsl(340, 70%, 50%)',
          'hsl(40, 70%, 50%)',
          'hsl(160, 70%, 50%)'
        ]
        return colors[Math.floor(Math.random() * colors.length)]
      },
      backgroundColor: 'transparent',
      rotateRatio: 0.3,
      rotationSteps: 2,
      shape: 'square'
    })
  }, [wordData, width, height, WordCloud])

  if (!WordCloud) {
    return (
      <div 
        className="flex items-center justify-center bg-muted/20 rounded-lg border border-border/50"
        style={{ width, height }}
      >
        <p className="text-sm text-muted-foreground">워드클라우드를 로드하는 중...</p>
      </div>
    )
  }

  if (!reports || reports.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-muted/20 rounded-lg border border-border/50"
        style={{ width, height }}
      >
        <p className="text-sm text-muted-foreground">보고서 데이터를 불러오는 중...</p>
      </div>
    )
  }

  if (wordData.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-muted/20 rounded-lg border border-border/50"
        style={{ width, height }}
      >
        <p className="text-sm text-muted-foreground">키워드를 찾을 수 없습니다</p>
      </div>
    )
  }

  return (
    <div className="bg-background rounded-lg border border-border/50 p-2">
      <div className="mb-2">
        <h4 className="text-sm font-medium text-foreground">키워드 분석</h4>
        <p className="text-xs text-muted-foreground">
          {reports.length}개 보고서 기반
        </p>
      </div>
      <canvas
        ref={canvasRef}
        className="rounded border"
        style={{ 
          maxWidth: '100%', 
          height: 'auto',
          display: 'block'
        }}
      />
    </div>
  )
}

// Next.js 동적 import로 SSR 방지
export const ReportWordCloud = dynamic(() => Promise.resolve(ReportWordCloudComponent), {
  ssr: false,
  loading: () => (
    <div 
      className="flex items-center justify-center bg-muted/20 rounded-lg border border-border/50"
      style={{ width: 400, height: 300 }}
    >
      <p className="text-sm text-muted-foreground">워드클라우드를 로드하는 중...</p>
    </div>
  )
})