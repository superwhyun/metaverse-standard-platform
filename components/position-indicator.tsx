"use client"

import { useState, useEffect } from "react"
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getPageById, getNavigationTarget, getTopLevelPages } from "@/config/navigation"
import { cn } from "@/lib/utils"

interface PositionIndicatorProps {
  currentView: string
  onNavigate: (pageId: string) => void
  className?: string
}

export function PositionIndicator({ currentView, onNavigate, className }: PositionIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)

  // 스크롤 감지 및 표시 여부 결정
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      setScrollPosition(scrollTop)
      // 50px 이상 스크롤했을 때 표시 (더 빨리 나타나도록)
      setIsVisible(scrollTop > 50)
    }

    // 초기에도 표시되도록 설정
    setIsVisible(true)
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const currentPage = getPageById(currentView)
  if (!currentPage) return null

  const topLevelPages = getTopLevelPages()
  const currentIndex = topLevelPages.findIndex(page => page.id === currentView)
  
  // 네비게이션 방향 감지
  const canGoLeft = getNavigationTarget(currentView, 'left') !== undefined
  const canGoRight = getNavigationTarget(currentView, 'right') !== undefined
  const canGoUp = getNavigationTarget(currentView, 'up') !== undefined
  const canGoDown = getNavigationTarget(currentView, 'down') !== undefined

  const handleDirectionClick = (direction: 'left' | 'right' | 'up' | 'down') => {
    const targetPageId = getNavigationTarget(currentView, direction)
    if (targetPageId) {
      onNavigate(targetPageId)
    }
  }

  if (!isVisible) return null

  return (
    <div 
      className={cn(
        "fixed bottom-6 right-6 z-[100] bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3",
        "transition-all duration-300 ease-in-out",
        className
      )}
    >
      {/* 현재 위치 표시 */}
      <div className="text-center mb-3">
        <div className="text-xs text-muted-foreground mb-1">현재 위치</div>
        <div className="font-medium text-sm flex items-center justify-center gap-2">
          {currentPage.icon && <currentPage.icon className="w-4 h-4" />}
          {currentPage.title}
        </div>
      </div>

      {/* 페이지 그리드 표시 (최상위 페이지들) */}
      <div className="grid grid-cols-3 gap-1 mb-3">
        {topLevelPages.slice(0, 6).map((page, index) => {
          const isCurrentPage = page.id === currentView || 
            (page.id === "admin" && currentView.startsWith("admin"))
          
          return (
            <Button
              key={page.id}
              variant={isCurrentPage ? "default" : "ghost"}
              size="sm"
              onClick={() => onNavigate(page.id)}
              className="h-8 text-xs px-2"
              title={page.title}
            >
              {page.icon && <page.icon className="w-3 h-3" />}
            </Button>
          )
        })}
      </div>

      {/* 방향 네비게이션 */}
      <div className="grid grid-cols-3 gap-1">
        {/* 첫 번째 줄: 위 */}
        <div></div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDirectionClick('up')}
          disabled={!canGoUp}
          className="h-8 w-8 p-0"
          title={canGoUp ? "위로 이동" : "위로 갈 수 없음"}
        >
          <ArrowUp className={cn("w-3 h-3", canGoUp ? "text-primary" : "text-muted-foreground")} />
        </Button>
        <div></div>

        {/* 두 번째 줄: 왼쪽, 홈, 오른쪽 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDirectionClick('left')}
          disabled={!canGoLeft}
          className="h-8 w-8 p-0"
          title={canGoLeft ? "왼쪽으로 이동" : "왼쪽으로 갈 수 없음"}
        >
          <ArrowLeft className={cn("w-3 h-3", canGoLeft ? "text-primary" : "text-muted-foreground")} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className="h-8 w-8 p-0"
          title="맨 위로 스크롤"
        >
          <Home className="w-3 h-3 text-primary" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDirectionClick('right')}
          disabled={!canGoRight}
          className="h-8 w-8 p-0"
          title={canGoRight ? "오른쪽으로 이동" : "오른쪽으로 갈 수 없음"}
        >
          <ArrowRight className={cn("w-3 h-3", canGoRight ? "text-primary" : "text-muted-foreground")} />
        </Button>

        {/* 세 번째 줄: 아래 */}
        <div></div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDirectionClick('down')}
          disabled={!canGoDown}
          className="h-8 w-8 p-0"
          title={canGoDown ? "아래로 이동" : "아래로 갈 수 없음"}
        >
          <ArrowDown className={cn("w-3 h-3", canGoDown ? "text-primary" : "text-muted-foreground")} />
        </Button>
        <div></div>
      </div>

      {/* 스크롤 위치 표시 */}
      <div className="text-center mt-2 text-xs text-muted-foreground">
        스크롤: {Math.round(scrollPosition)}px
      </div>
    </div>
  )
}