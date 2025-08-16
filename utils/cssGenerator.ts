import { navigationConfig, PageConfig } from '@/config/navigation'

// CSS 클래스 생성 유틸리티
export const generatePageCSS = (): string => {
  let css = `
/* Auto-generated page positioning CSS */
.page-slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  min-height: 100%;
  padding: 2rem 1rem;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
  z-index: 1; /* 기본 z-index */
}

/* Active state for all pages */
.page-slide.active {
  transform: translate(0, 0);
  z-index: 2;
}

/* Sliding direction classes */
.page-slide.slide-left {
  transform: translateX(100%);  /* 왼쪽 키: 오른쪽에서 왼쪽으로 */
}

.page-slide.slide-right {
  transform: translateX(-100%); /* 오른쪽 키: 왼쪽에서 오른쪽으로 */
}

.page-slide.slide-up {
  transform: translateY(-100%); /* 아래키로 올 때: 아래에서 위로 슬라이딩 */
}

.page-slide.slide-down {
  transform: translateY(100%);  /* 위키로 올 때: 위에서 아래로 슬라이딩 */
}

/* Enhanced smooth scrolling for better performance */
@media (prefers-reduced-motion: no-preference) {
  .page-slide {
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-slide {
    transition: none;
  }
}
`

  // 각 페이지별 기본 위치 생성
  navigationConfig.forEach((page: PageConfig) => {
    const transformX = page.position.x !== 0 ? `translateX(${page.position.x}%)` : ''
    const transformY = page.position.y !== 0 ? `translateY(${page.position.y}%)` : ''
    
    let transform = ''
    if (transformX && transformY) {
      transform = `transform: translate(${page.position.x}%, ${page.position.y}%);`
    } else if (transformX) {
      transform = `transform: ${transformX};`
    } else if (transformY) {
      transform = `transform: ${transformY};`
    } else {
      transform = `transform: translate(0, 0);`
    }

    css += `
/* ${page.title} page */
.page-slide.${page.id} {
  ${transform}
}
`
  })

  return css
}

// 특정 방향으로의 슬라이딩 클래스 결정
export const getSlideClass = (fromPageId: string, toPageId: string): string => {
  const fromPage = navigationConfig.find(p => p.id === fromPageId)
  const toPage = navigationConfig.find(p => p.id === toPageId)
  
  if (!fromPage || !toPage) return ''
  
  // 수평 이동인지 수직 이동인지 판단
  const deltaX = toPage.position.x - fromPage.position.x
  const deltaY = toPage.position.y - fromPage.position.y
  
  // X축 이동이 더 큰 경우 (수평 이동)
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX > 0 ? 'slide-right' : 'slide-left'
  }
  // Y축 이동이 더 큰 경우 (수직 이동)  
  else if (Math.abs(deltaY) > 0) {
    return deltaY > 0 ? 'slide-down' : 'slide-up'
  }
  
  return ''
}

// 페이지가 숨겨져야 하는지 판단
export const shouldHidePage = (pageId: string, currentViewId: string): boolean => {
  const page = navigationConfig.find(p => p.id === pageId)
  const currentView = navigationConfig.find(p => p.id === currentViewId)
  
  if (!page || !currentView) return false
  
  // 현재 뷰가 서브페이지인 경우, 관련 없는 메인 페이지들은 숨김
  if (currentView.isSubPage && !page.isSubPage) {
    // 현재 서브페이지의 부모가 아닌 메인 페이지들은 숨김
    return page.id !== currentView.parent
  }
  
  return false
}