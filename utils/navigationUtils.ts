import { getPageById, getNavigationTarget } from '@/config/navigation'
import { getSlideClass, shouldHidePage } from './cssGenerator'

/**
 * 현재 페이지의 CSS 클래스를 생성합니다
 */
export const getPageClasses = (pageType: string, currentView: string): string => {
  const baseClass = `page-slide ${pageType}`

  // 현재 활성 페이지인 경우
  if (currentView === pageType) {
    return `${baseClass} active`
  }

  // 관리자 페이지들은 admin으로 시작하는 모든 뷰에서 활성화
  if (pageType === "admin" && currentView.startsWith("admin")) {
    return `${baseClass} active`
  }

  // 보고서 상세 페이지가 활성화된 경우 reports 페이지도 활성 상태 유지 (오버레이)
  if (pageType === "reports" && currentView === "report-detail") {
    return `${baseClass} active`
  }

  // 현재 뷰를 기준으로 상대적 위치 클래스 계산
  const currentPage = getPageById(currentView)
  const targetPage = getPageById(pageType)
  
  if (!currentPage || !targetPage) {
    return `${baseClass} hidden`
  }

  // 현재 페이지 기준 상대적 위치 계산
  const relativeX = targetPage.position.x - currentPage.position.x
  const relativeY = targetPage.position.y - currentPage.position.y

  let positionClass = ''
  
  if (relativeX > 0) {
    positionClass += ' slide-from-right'
  } else if (relativeX < 0) {
    positionClass += ' slide-from-left'
  }
  
  if (relativeY > 0) {
    positionClass += ' slide-from-bottom'
  } else if (relativeY < 0) {
    positionClass += ' slide-from-top'
  }

  return `${baseClass}${positionClass}`
}

/**
 * 네비게이션 설정의 유효성을 검사합니다
 */
export const validateNavigationConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  const { navigationConfig, getAllPageIds } = require('@/config/navigation')
  const allIds = getAllPageIds()
  
  navigationConfig.forEach((page: any) => {
    // 네비게이션 타겟이 존재하는지 확인
    Object.entries(page.navigation).forEach(([direction, targetId]) => {
      if (targetId && !allIds.includes(targetId as string)) {
        errors.push(`Page '${page.id}' has invalid ${direction} navigation target: '${targetId}'`)
      }
    })
    
    // 부모 페이지가 존재하는지 확인
    if (page.parent && !allIds.includes(page.parent)) {
      errors.push(`Page '${page.id}' has invalid parent: '${page.parent}'`)
    }
    
    // 순환 참조 확인
    if (page.navigation.left === page.id || 
        page.navigation.right === page.id ||
        page.navigation.up === page.id ||
        page.navigation.down === page.id) {
      errors.push(`Page '${page.id}' has circular navigation reference`)
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 두 페이지 사이의 네비게이션 경로를 찾습니다
 */
export const findNavigationPath = (fromPageId: string, toPageId: string): string[] => {
  const visited = new Set<string>()
  const queue: { pageId: string; path: string[] }[] = [{ pageId: fromPageId, path: [fromPageId] }]
  
  while (queue.length > 0) {
    const { pageId, path } = queue.shift()!
    
    if (pageId === toPageId) {
      return path
    }
    
    if (visited.has(pageId)) {
      continue
    }
    
    visited.add(pageId)
    const page = getPageById(pageId)
    
    if (page) {
      // 모든 방향의 네비게이션 타겟을 큐에 추가
      Object.values(page.navigation).forEach(targetId => {
        if (targetId && !visited.has(targetId)) {
          queue.push({ pageId: targetId, path: [...path, targetId] })
        }
      })
    }
  }
  
  return [] // 경로를 찾을 수 없음
}

/**
 * 페이지의 계층 구조를 반환합니다
 */
export const getPageHierarchy = (pageId: string): string[] => {
  const hierarchy: string[] = []
  let currentPage = getPageById(pageId)
  
  while (currentPage) {
    hierarchy.unshift(currentPage.id)
    currentPage = currentPage.parent ? getPageById(currentPage.parent) : undefined
  }
  
  return hierarchy
}

/**
 * 디버깅용: 현재 네비게이션 상태를 콘솔에 출력
 */
export const debugNavigationState = (currentView: string) => {
  const currentPage = getPageById(currentView)
  if (currentPage) {
    console.group(`🧭 Navigation Debug: ${currentPage.title} (${currentView})`)
    console.log('Position:', currentPage.position)
    console.log('Navigation:', currentPage.navigation)
    console.log('Hierarchy:', getPageHierarchy(currentView))
    console.log('Is SubPage:', currentPage.isSubPage)
    console.log('Is TopLevel:', currentPage.isTopLevel)
    console.groupEnd()
  }
}