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

    // 한글과 영어 단어 모두 추출
    const rawKoreanWords = allText.match(/[가-힣]{2,}/g) || [] // 한글 2글자 이상
    const englishWords = allText
      .toLowerCase()
      .match(/[a-z]{3,}/g) || [] // 영어 3글자 이상

    // 한글 명사 추출 함수
    const extractKoreanNouns = (words: string[]): string[] => {
      return words.map(word => {
        // 동사 어미 제거 (했다, 했습니다, 하고, 하는, 한다 등)
        const verbEndings = [
          '했다', '했습니다', '하였다', '하였습니다', '하고', '하며', '하여', '하면서', '한다', '합니다', 
          '되었다', '되었습니다', '되어', '되고', '된다', '됩니다', '시켰다', '시켰습니다', '시키고', '시킨다',
          '받았다', '받았습니다', '받고', '받으며', '받는다', '받습니다', '주었다', '주었습니다', '준다', '줍니다',
          '갔다', '갔습니다', '가고', '간다', '갑니다', '왔다', '왔습니다', '오고', '온다', '옵니다',
          '보았다', '보았습니다', '보고', '본다', '봅니다', '들었다', '들었습니다', '듣고', '듣는다',
          '말했다', '말했습니다', '말하고', '말한다', '말합니다', '점검했다', '점검하고', '점검한다', '점검합니다',
          '공유했다', '공유하고', '공유한다', '공유합니다', '개발했다', '개발하고', '개발한다', '개발합니다',
          '제공했다', '제공하고', '제공한다', '제공합니다', '구현했다', '구현하고', '구현한다', '구현합니다',
          '분석했다', '분석하고', '분석한다', '분석합니다', '설계했다', '설계하고', '설계한다', '설계합니다',
          '지원했다', '지원하고', '지원한다', '지원합니다', '활용했다', '활용하고', '활용한다', '활용합니다'
        ]
        
        // 조사 제거 (을/를, 이/가, 은/는, 의, 에, 으로/로, 와/과, 도, 만 등)
        const particles = ['을', '를', '이', '가', '은', '는', '의', '에', '으로', '로', '와', '과', '도', '만', '부터', '까지', '에서', '에게', '한테', '께', '보다', '처럼', '같이']
        
        // 어미 제거
        for (const ending of verbEndings) {
          if (word.endsWith(ending)) {
            const stem = word.slice(0, -ending.length)
            if (stem.length >= 2) {
              return stem
            }
          }
        }
        
        // 조사 제거
        for (const particle of particles) {
          if (word.endsWith(particle)) {
            const stem = word.slice(0, -particle.length)
            if (stem.length >= 2) {
              return stem
            }
          }
        }
        
        return word
      }).filter(word => word.length >= 2)
    }

    // 한글 명사 추출
    const koreanNouns = extractKoreanNouns(rawKoreanWords)

    // 빈도수 계산
    const frequency: Record<string, number> = {}
    
    // 한글 명사 처리
    koreanNouns.forEach(word => {
      // 한글 불용어 제거 (의미 없는 명사들)
      const koreanStopWords = ['것', '때', '곳', '데', '바', '수', '중', '간', '쪽', '뒤', '앞', '위', '아래', '옆', '내', '외', '밖', '안', '등', '등등', '기타', '일부', '전체', '부분', '상황', '경우', '때문', '결과', '과정', '방법', '방식', '형태', '모습', '상태', '종류', '유형', '특성', '성격', '내용', '구조', '체계', '시스템', '이용', '사용', '활용', '적용', '구현', '개발', '제공', '지원', '관련', '연관', '해당', '관계', '대상', '목적', '목표', '계획', '예정', '준비', '진행', '완료', '시작', '종료', '마지막', '최종', '다음', '이전', '현재', '미래', '과거']
      
      if (!koreanStopWords.includes(word) && word.length >= 2) {
        frequency[word] = (frequency[word] || 0) + 1
      }
    })
    
    // 영어 단어 처리
    englishWords.forEach(word => {
      // 영어 불용어 제거
      const englishStopWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'this', 'that', 'with', 'have', 'they', 'been', 'from', 'will', 'would', 'there', 'their', 'what', 'were', 'said', 'each', 'which', 'your', 'time', 'may', 'into', 'than', 'only', 'other', 'after', 'first', 'well', 'also', 'through', 'being', 'where', 'work', 'much', 'such', 'over', 'during', 'before', 'must', 'years', 'used', 'using', 'provide', 'based', 'through', 'should', 'could', 'development', 'system', 'standard', 'standards', 'technology', 'technologies', 'implementation', 'specification', 'specifications', 'application', 'applications', 'requirements', 'framework', 'frameworks']
      
      if (!englishStopWords.includes(word) && word.length >= 3) {
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
      weightFactor: (size: number) => Math.pow(size, 0.8) * width / 1024 * 12,
      fontFamily: '"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", "Segoe UI", Arial, sans-serif',
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
      rotateRatio: 0.2,
      rotationSteps: 2,
      shape: 'square',
      minSize: 12
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