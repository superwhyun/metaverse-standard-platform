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
  const [dynamicStopWords, setDynamicStopWords] = React.useState<{korean: string[], english: string[]}>({
    korean: ['있다', '하다', '되다', '이다', '않다', '없다', '싶다', '보다', '같다', '많다', '그렇다', '그러나', '하지만', '따라서', '때문에'], // 기본 한글 배제어 복구
    english: ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had'] // 기본 영어 배제어 복구
  })
  const [stopWordsLoaded, setStopWordsLoaded] = React.useState<boolean>(true)

  // 동적으로 WordCloud 라이브러리 로드
  useEffect(() => {
    import('wordcloud').then((module) => {
      setWordCloud(() => module.default)
    })
  }, [])

  // 동적 배제어 로드
  useEffect(() => {
    const loadStopWords = async () => {
      try {
        const response = await fetch('/api/admin/wordcloud-stopwords')
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            setDynamicStopWords({
              korean: result.data.korean?.words || ['있다', '하다', '되다', '이다', '않다', '없다', '싶다', '보다', '같다', '많다'],
              english: result.data.english?.words || ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
            })
          }
        }
      } catch (error) {
        console.error('Failed to load dynamic stopwords:', error)
        // 실패 시 현재 기본 배제어 유지
        setDynamicStopWords(current => current)
      } finally {
        // 배제어 로딩 완료 표시 (성공/실패 상관없이)
        setStopWordsLoaded(true)
      }
    }

    loadStopWords()
  }, [])

  // 보고서 ID 기반으로 안정적인 키 생성 (useMemo 외부에서 계산)
  const reportsKey = useMemo(() => {
    if (!reports || reports.length === 0) return ''
    return reports.map(r => `${r.id}-${r.title}-${r.summary}`).sort().join('|')
  }, [reports])

  // 텍스트에서 키워드 추출 및 빈도 계산
  const wordData = useMemo(() => {
    // 배제어가 로드되지 않았으면 빈 배열 반환
    if (!stopWordsLoaded || !reports || reports.length === 0) return []

    // 모든 보고서의 summary와 title 텍스트 수집
    const allText = reports
      .map(report => `${report.title} ${report.summary}`)
      .join(' ')

    // 한글과 영어 단어 모두 추출
    const rawKoreanWords = allText.match(/[가-힣]{2,}/g) || [] // 한글 2글자 이상
    const englishWords = allText
      .toLowerCase()
      .match(/[a-z]{3,}/g) || [] // 영어 3글자 이상

    // 한글 명사 추출 함수 (배제어 적용 포함)
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
      }).filter(word => {
        // 배제어 필터링을 여기서 적용 (빈도수 계산 전에)
        return word.length >= 2 && !dynamicStopWords.korean.includes(word)
      })
    }

    // 영어 단어 필터링 함수 (배제어 적용 포함)
    const filterEnglishWords = (words: string[]): string[] => {
      return words.filter(word => {
        // 배제어 필터링을 여기서 적용 (빈도수 계산 전에)
        return word.length >= 3 && !dynamicStopWords.english.includes(word)
      })
    }

    // 한글 명사 추출 (이미 배제어 필터링 적용됨)
    const koreanNouns = extractKoreanNouns(rawKoreanWords)

    // 영어 단어 필터링 (이미 배제어 필터링 적용됨)
    const filteredEnglishWords = filterEnglishWords(englishWords)

    // 빈도수 계산 (배제어 필터링 후)
    const frequency: Record<string, number> = {}

    // 한글 명사 처리
    koreanNouns.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1
    })

    // 영어 단어 처리
    filteredEnglishWords.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1
    })

    // 디버깅용 로그
    const allWords = Object.entries(frequency)
      .filter(([word, freq]) => freq >= 1)
      .sort(([wordA, a], [wordB, b]) => {
        if (b !== a) return b - a
        return wordA.localeCompare(wordB)
      })
    
    console.log('워드클라우드 단어 추출 결과:', {
      totalWords: allWords.length,
      top10: allWords.slice(0, 10),
      koreanStopWords: dynamicStopWords.korean.slice(0, 5) + '...',
      englishStopWords: dynamicStopWords.english.slice(0, 5) + '...'
    })

    // 빈도수 정규화를 위한 계산
    const top10Words = allWords.slice(0, 10)
    const frequencies = top10Words.map(([, freq]) => freq)
    const avgFreq = frequencies.reduce((sum, freq) => sum + freq, 0) / frequencies.length
    const maxFreq = Math.max(...frequencies)
    
    // 정규화: 평균을 기준으로 스케일링하여 일관된 크기 확보
    return top10Words.map(([word, freq]) => {
      // 평균 기준 정규화 후 적절한 범위로 매핑 (20-60)
      const normalizedScore = (freq / avgFreq) * 40 + 20
      return [word, normalizedScore]
    })
  }, [reportsKey, dynamicStopWords, stopWordsLoaded])

  // 단어에 기반한 일관된 색상 생성 함수
  const getConsistentColor = (word: string) => {
    // 단어의 해시값을 기반으로 일관된 색상 선택
    let hash = 0
    for (let i = 0; i < word.length; i++) {
      hash = word.charCodeAt(i) + ((hash << 5) - hash)
    }

    const colors = [
      'hsl(var(--primary))',
      'hsl(var(--secondary))',
      'hsl(220, 70%, 50%)',
      'hsl(280, 70%, 50%)',
      'hsl(340, 70%, 50%)',
      'hsl(40, 70%, 50%)',
      'hsl(160, 70%, 50%)'
    ]

    return colors[Math.abs(hash) % colors.length]
  }

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

    // WordCloud 생성 - 뷰티파이 버전
    WordCloud(canvas, {
      list: wordData,
      fontFamily: '"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", Arial, sans-serif',
      // color: (word: string) => getConsistentColor(word),
      backgroundColor: 'transparent',
      rotateRatio: 0.3, // 약간의 회전
      shape: 'circle', // 원형 배치
      gridSize: 8, // 조밀한 배치 8
      // weightFactor: 4 // 적당한 크기
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
