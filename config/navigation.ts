import { ComponentType } from 'react'
import { Settings, Calendar, FileText, Search } from 'lucide-react'

// 페이지 위치 좌표
interface Position {
  x: number  // X축 위치 (% 단위)
  y: number  // Y축 위치 (% 단위)
}

// 네비게이션 방향
interface NavigationMap {
  left?: string
  right?: string
  up?: string
  down?: string
}

// 단축키 정의
interface Shortcut {
  key: string
  description: string
}

// 페이지 설정 인터페이스
export interface PageConfig {
  id: string
  component: string
  title: string
  icon?: ComponentType<any>
  position: Position
  parent?: string  // 부모 페이지 ID (계층 구조용)
  navigation: NavigationMap
  shortcuts?: Shortcut[]
  isSubPage?: boolean  // 서브페이지 여부
  isTopLevel?: boolean  // 상단 네비게이션에 표시할지 여부
}

// 네비게이션 설정
export const navigationConfig: PageConfig[] = [
  {
    id: "admin",
    component: "AdminDashboard",
    title: "관리자",
    icon: Settings,
    position: { x: -100, y: 0 },
    navigation: { right: "calendar" },
    shortcuts: [{ key: "1", description: "관리자 페이지로 이동" }],
    isTopLevel: true
  },
  {
    id: "calendar",
    component: "CalendarComponent", 
    title: "회의 일정",
    icon: Calendar,
    position: { x: 0, y: 0 },
    navigation: { left: "admin", right: "reports" },
    shortcuts: [{ key: "2", description: "회의 일정 페이지로 이동" }],
    isTopLevel: true
  },
  {
    id: "reports",
    component: "ReportList",
    title: "동향 보고서", 
    icon: FileText,
    position: { x: 100, y: 0 },
    navigation: { left: "calendar", right: "standard-search", down: "monthly-reports" },
    shortcuts: [{ key: "3", description: "동향 보고서 페이지로 이동" }],
    isTopLevel: true
  },
  {
    id: "standard-search",
    component: "StandardSearch",
    title: "AI표준검색",
    icon: Search,
    position: { x: 200, y: 0 },
    navigation: { left: "reports" },
    shortcuts: [{ key: "4", description: "AI 표준검색 페이지로 이동" }],
    isTopLevel: true
  },
  {
    id: "monthly-reports",
    component: "MonthlyReports",
    title: "월별 동향",
    position: { x: 100, y: 100 },
    parent: "reports",
    navigation: { up: "reports", down: "organization-reports" },
    isSubPage: true
  },
  {
    id: "organization-reports", 
    component: "OrganizationReports",
    title: "표준화기구별 동향",
    position: { x: 100, y: 200 },
    parent: "reports",
    navigation: { up: "monthly-reports" },
    isSubPage: true
  },
  // 관리자 서브페이지들
  {
    id: "admin-add-conference",
    component: "AdminConferenceForm",
    title: "회의 추가",
    position: { x: -100, y: 0 },
    parent: "admin",
    navigation: {},
    isSubPage: true
  },
  {
    id: "admin-edit-conference",
    component: "AdminConferenceForm", 
    title: "회의 수정",
    position: { x: -100, y: 0 },
    parent: "admin",
    navigation: {},
    isSubPage: true
  },
  {
    id: "admin-add-report",
    component: "AdminReportForm",
    title: "보고서 추가", 
    position: { x: -100, y: 0 },
    parent: "admin",
    navigation: {},
    isSubPage: true
  },
  {
    id: "admin-edit-report",
    component: "AdminReportForm",
    title: "보고서 수정",
    position: { x: -100, y: 0 },
    parent: "admin", 
    navigation: {},
    isSubPage: true
  },
  {
    id: "report-detail",
    component: "ReportViewer",
    title: "보고서 상세",
    position: { x: 100, y: 0 },
    parent: "reports",
    navigation: { left: "reports" },
    isSubPage: true
  }
]

// 유틸리티 함수들
export const getPageById = (id: string): PageConfig | undefined => {
  return navigationConfig.find(page => page.id === id)
}

export const getTopLevelPages = (): PageConfig[] => {
  return navigationConfig.filter(page => page.isTopLevel)
}

export const getSubPages = (parentId: string): PageConfig[] => {
  return navigationConfig.filter(page => page.parent === parentId)
}

export const getNavigationTarget = (currentPageId: string, direction: 'left' | 'right' | 'up' | 'down'): string | undefined => {
  const currentPage = getPageById(currentPageId)
  return currentPage?.navigation[direction]
}

export const getAllPageIds = (): string[] => {
  return navigationConfig.map(page => page.id)
}