'use client'

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CalendarComponent } from "@/components/calendar-component"
import { ReportList } from "@/components/report-list"
import { ReportViewer } from "@/components/report-viewer"
import { AdminDashboard } from "@/components/admin-dashboard"
import { AdminConferenceForm } from "@/components/admin-conference-form"
import { AdminReportForm } from "@/components/admin-report-form"
import { AdminBatchReportForm } from "@/components/admin-batch-report-form"
import { KeyboardGuide } from "@/components/keyboard-guide"
import { MonthlyReports } from "@/components/monthly-reports"
import { OrganizationReports } from "@/components/organization-reports"
import { CategoryReports } from "@/components/category-reports"
import { StandardSearch } from "@/components/standard-search"
import { TechAnalysis } from "@/components/tech-analysis"
import { StandardTools } from "@/components/standard-tools"
import dynamic from 'next/dynamic'

const TrendInsightsList = dynamic(() => import("@/components/trend-insights-list").then(mod => mod.TrendInsightsList), { ssr: false })
const AdminTrendInsightsForm = dynamic(() => import("@/components/admin-trend-insights-form").then(mod => mod.AdminTrendInsightsForm), { ssr: false })

import { ThemeToggle } from "@/components/ui/theme-toggle"

// Configuration 기반 imports
import { getTopLevelPages, getNavigationTarget, getPageById } from "@/config/navigation"
import { useKeyboardNavigation, usePageTransition } from "@/hooks/useNavigation"
import { cn } from "@/lib/utils"



// Configuration에서 자동으로 ViewType 생성
type ViewType = string
type ReportViewerSource = "admin" | "monthly-reports" | "organization-reports" | "category-reports" | "calendar"

interface ApiReportRecord {
  id: number
  title: string
  date: string
  summary: string
  content?: string | null
  category: string
  organization: string
  tags?: string[] | string | null
  download_url?: string | null
  conference_id?: number | null
}

interface AppReport {
  id: number
  title: string
  date: string
  summary: string
  category: string
  organization: string
  tags: string[]
  downloadUrl?: string
  conferenceId?: number
  content?: string
}

interface AppReportDetail extends AppReport {
  content: string
}

interface AppConference {
  id: number
  title: string
  date: string
  startDate: string
  endDate: string
  time: string
  startTime?: string
  endTime?: string
  location: string
  organization: string
  hasReport: boolean
  reports?: { id: number; title: string }[]
  isMultiDay?: boolean
  description?: string
  createdAt?: string
  updatedAt?: string
}

interface ModalReportViewer {
  source: ReportViewerSource
  report: AppReportDetail
}

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

interface EditableConference extends ConferenceFormData {
  id?: number
}

interface ReportFormData {
  title: string
  date: string
  summary: string
  content: string
  category: string
  organization: string
  tags: string[]
  downloadUrl: string
  conferenceId?: number
}

const reportViewerSources = new Set<ReportViewerSource>([
  "admin",
  "monthly-reports",
  "organization-reports",
  "category-reports",
  "calendar",
])

const parseReportTags = (tags: ApiReportRecord["tags"]): string[] => {
  if (Array.isArray(tags)) {
    return tags
  }

  if (typeof tags === "string") {
    try {
      const parsedTags = JSON.parse(tags)
      return Array.isArray(parsedTags) ? parsedTags : []
    } catch (error) {
      console.warn("Failed to parse tags", error)
    }
  }

  return []
}

const toAppReport = (report: ApiReportRecord): AppReport => ({
  id: report.id,
  title: report.title,
  date: report.date,
  summary: report.summary,
  category: report.category,
  organization: report.organization,
  tags: parseReportTags(report.tags),
  downloadUrl: report.download_url || undefined,
  conferenceId: report.conference_id || undefined,
})

const toAppReportDetail = (report: ApiReportRecord): AppReportDetail => ({
  ...toAppReport(report),
  content: typeof report.content === "string" ? report.content : "",
})

const ensureReportDetail = (report: AppReport): AppReportDetail => ({
  ...report,
  content: typeof report.content === "string" ? report.content : "",
})

const buildReportsApiUrl = (year?: number, month?: number) => {
  const searchParams = new URLSearchParams()

  if (year && month) {
    searchParams.set("year", String(year))
    searchParams.set("month", String(month))
  }

  const query = searchParams.toString()
  return query ? `/api/reports?${query}` : "/api/reports"
}

// Local: page CSS class generator (inlined from utils/navigationUtils)
const getPageClasses = (pageType: string, currentView: string): string => {
  const baseClass = `page-slide ${pageType}`

  if (currentView === pageType) {
    return `${baseClass} active`
  }

  if (pageType === "admin" && currentView.startsWith("admin")) {
    return `${baseClass} active`
  }

  if (pageType === "reports" && currentView === "report-detail") {
    return `${baseClass} active`
  }

  const currentPage = getPageById(currentView)
  const targetPage = getPageById(pageType)

  if (!currentPage || !targetPage) {
    return `${baseClass} hidden`
  }

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

export default function HomePage() {
  const { session, status, signOut } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentView, setCurrentView] = useState<ViewType>("calendar")

  const [selectedReport, setSelectedReport] = useState<AppReportDetail | null>(null)
  const [selectedConference, setSelectedConference] = useState<EditableConference | null>(null)
  const [conferences, setConferences] = useState<AppConference[]>([])
  const [reports, setReports] = useState<AppReport[]>([])
  const [allConferences, setAllConferences] = useState<AppConference[]>([])
  const [allReports, setAllReports] = useState<AppReport[]>([])
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingConferences, setIsLoadingConferences] = useState(false)
  const [modalReportViewer, setModalReportViewer] = useState<ModalReportViewer | null>(null)
  const [adminActiveTab, setAdminActiveTab] = useState("conferences") // 관리자 탭 상태 관리
  const [previousView, setPreviousView] = useState<ViewType | null>(null) // 수정 전 이전 페이지 저장

  // Load all conferences from database (for admin dashboard statistics)
  const loadAllConferences = async () => {
    try {
      const response = await fetch('/api/conferences'); // No year/month params = get all
      if (response.ok) {
        const result = await response.json();
        const conferenceData = result.data || [];
        setAllConferences(conferenceData);
      } else {
        console.error('Failed to load all conferences');
        setAllConferences([]);
      }
    } catch (error) {
      console.error('Error loading all conferences:', error);
      setAllConferences([]);
    }
  };

  // Load all reports from database (for admin dashboard statistics)
  const loadAllReports = async () => {
    try {
      const response = await fetch(buildReportsApiUrl());
      if (response.ok) {
        const result = await response.json();
        setAllReports((result.data || []).map(toAppReport));
      } else {
        console.error('Failed to load all reports');
        setAllReports([]);
      }
    } catch (error) {
      console.error('Error loading all reports:', error);
      setAllReports([]);
    }
  };

  // Load conferences from database with monthly optimization
  const loadConferences = async (year?: number, month?: number) => {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || (now.getMonth() + 1);

    setIsLoadingConferences(true);
    try {
      const response = await fetch(`/api/conferences?year=${targetYear}&month=${targetMonth}`);
      if (response.ok) {
        const result = await response.json();
        const conferenceData = result.data || [];
        setConferences(conferenceData);
      } else {
        console.error('Failed to load conferences');
        setConferences([]);
      }
    } catch (error) {
      console.error('Error loading conferences:', error);
      setConferences([]);
    } finally {
      setIsLoading(false);
      setIsLoadingConferences(false);
    }
  };

  // Load reports from database - 전체 또는 월별 로딩 (content 제외)
  const loadReports = async (year?: number, month?: number) => {
    try {
      const response = await fetch(buildReportsApiUrl(year, month));
      if (response.ok) {
        const result = await response.json();
        setReports((result.data || []).map(toAppReport));
      } else {
        console.error('Failed to load reports');
        setReports([]);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      setReports([]);
    }
  };

  // 개별 보고서 상세 내용 로딩 (content 포함)
  const loadReportDetail = async (reportId: number) => {
    try {
      const response = await fetch(`/api/reports/${reportId}`);
      if (response.ok) {
        const result = await response.json();
        return toAppReportDetail(result.data);
      }
      return null;
    } catch (error) {
      console.error('Error loading report detail:', error);
      return null;
    }
  };

  useEffect(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    // 회의는 캘린더를 위해 월별 로드
    loadConferences(currentYear, currentMonth);
    // 보고서는 전체 로드 (일반 사용자 페이지들이 전체 데이터를 사용)
    loadReports();

    // 세션 스토리지에서 returnView 확인
    if (typeof window !== 'undefined') {
      const returnView = sessionStorage.getItem('returnView');
      if (returnView) {
        setCurrentView(returnView);
        sessionStorage.removeItem('returnView'); // 한 번만 사용하고 제거
      }
    }
  }, []);

  // Configuration 기반 키보드 네비게이션 사용
  const { navigateToPage } = useKeyboardNavigation({
    currentView,
    setCurrentView,
    setIsTransitioning,
    isTransitioning,
    onViewChange: (newView) => {
      // 뷰 변경 시 추가 로직
      if (newView === "admin" || newView === "reports") {
        setSelectedConference(null)
        setSelectedReport(null)
      }
      if (newView === "admin") {
        // 관리자 페이지 진입 시 통계용 전체 데이터와 현재 월 관리 데이터 로드
        loadAllConferences()
        loadAllReports()
        // 현재 월의 관리용 데이터 로드
        const now = new Date();
        loadAdminReports(now.getFullYear(), now.getMonth() + 1)
      }
      if (newView === "report-detail") {
        // report-detail로 갈 때는 selectedReport이 있어야 함
      }
    }
  })

  // Configuration 기반 페이지 전환 효과 사용
  const { scrollToTop } = usePageTransition()

  useEffect(() => {
    scrollToTop(currentView)
  }, [currentView, scrollToTop])

  const loadDetailedReportWithFallback = async (reportId: number, fallbackReport?: AppReport) => {
    const detailReport = await loadReportDetail(reportId)
    if (detailReport) {
      return detailReport
    }

    if (fallbackReport) {
      return ensureReportDetail(fallbackReport)
    }

    return null
  }

  const openReportDetailPage = async (report: AppReport) => {
    const detailReport = await loadDetailedReportWithFallback(report.id, report)
    if (!detailReport) {
      console.error('Report not found even after fetching detail:', report.id)
      return
    }

    setSelectedReport(detailReport)
    setCurrentView("report-detail")
  }

  const openModalReportViewer = async (source: ReportViewerSource, report: AppReport) => {
    const detailReport = await loadDetailedReportWithFallback(report.id, report)
    if (!detailReport) {
      console.error('Failed to open report viewer:', report.id)
      return
    }

    setModalReportViewer({ source, report: detailReport })
  }

  const restorePreviousReportView = (view: ViewType, report: AppReportDetail) => {
    if (view === "report-detail") {
      setSelectedReport(report)
      setCurrentView("report-detail")
      return true
    }

    if (reportViewerSources.has(view as ReportViewerSource)) {
      setModalReportViewer({ source: view as ReportViewerSource, report })
      return true
    }

    return false
  }

  const handleReportClick = async (reportId: number) => {
    const basicReport = reports.find((r) => r.id === reportId)
    const detailReport = await loadDetailedReportWithFallback(reportId, basicReport)
    if (!detailReport) {
      console.error('Report not found even after fetching detail:', reportId)
      return
    }

    setSelectedReport(detailReport)
    setCurrentView("report-detail")
  }

  useEffect(() => {
    const reportId = searchParams.get('reportId')
    if (reportId) {
      handleReportClick(parseInt(reportId))
    }
  }, [searchParams])

  const handleReportSelect = async (report: AppReport) => openReportDetailPage(report)

  const handleMonthlyReportSelect = async (report: AppReport) => openModalReportViewer("monthly-reports", report)

  const handleOrganizationReportSelect = async (report: AppReport) => openModalReportViewer("organization-reports", report)

  const handleCategoryReportSelect = async (report: AppReport) => openModalReportViewer("category-reports", report)

  const handleCalendarReportSelect = async (report: AppReport) => openModalReportViewer("calendar", report)

  // Handle calendar month change (회의만 월별 로드)
  const handleCalendarMonthChange = (year: number, month: number) => {
    loadConferences(year, month);
    // 보고서는 전체 데이터를 유지 (캘린더에서는 전체 보고서 표시)
  }

  // 관리자 대시보드 전용 월 변경 핸들러
  const handleAdminMonthChange = (year: number, month: number) => {
    loadConferences(year, month);
    loadAdminReports(year, month);
  }

  // 관리자 대시보드 전용 월별 보고서 로딩
  const loadAdminReports = async (year: number, month: number) => {
    await loadReports(year, month) // 월별 필터링하여 로드
  }


  const handleSaveConference = async (data: ConferenceFormData) => {
    try {
      const isEdit = !!selectedConference;
      const url = isEdit ? `/api/conferences/${selectedConference.id}` : '/api/conferences';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        // BUG FIX: Reload the month of the saved conference, not the current month
        const conferenceDate = new Date(data.startDate);
        const targetYear = conferenceDate.getFullYear();
        const targetMonth = conferenceDate.getMonth() + 1;
        await loadConferences(targetYear, targetMonth);

        // Also refresh the main calendar if the view is different
        await handleAdminMonthChange(targetYear, targetMonth);

      } else {
        const errorData = await response.json();
        console.error('Failed to save conference:', errorData.error || response.statusText);
        // TODO: Display error message to the user
      }

      setCurrentView("admin");
      setSelectedConference(null);
    } catch (error) {
      console.error('Error saving conference:', error);
    }
  };

  const handleSaveReport = async (data: ReportFormData) => {
    try {
      const isEdit = currentView === "admin-edit-report" && selectedReport !== null;
      const url = isEdit ? `/api/reports/${selectedReport.id}` : '/api/reports';
      const method = isEdit ? 'PUT' : 'POST';
      let savedReportId = selectedReport?.id

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        const reportDate = new Date(data.date);
        const targetYear = reportDate.getFullYear();
        const targetMonth = reportDate.getMonth() + 1;

        if (isEdit) {
          const updatedReport = ensureReportDetail({
            ...selectedReport,
            ...data,
            id: selectedReport.id,
          })

          setAllReports(prev => prev.map(report =>
            report.id === selectedReport.id
              ? updatedReport
              : report
          ));
        } else {
          const newReport = {
            id: result.data?.id || Date.now(), // API에서 ID를 반환하지 않는 경우 임시 ID
            title: data.title,
            date: data.date,
            summary: data.summary,
            category: data.category,
            organization: data.organization,
            tags: data.tags || [],
            downloadUrl: data.downloadUrl,
            conferenceId: data.conferenceId
          };
          savedReportId = newReport.id
          setAllReports(prev => [newReport, ...prev]);
        }

        // 월별 데이터만 재조회 (기존 방식 유지)
        await loadAdminReports(targetYear, targetMonth);
        await loadConferences(targetYear, targetMonth);

      } else {
        const errorData = await response.json();
        console.error('Failed to save report:', errorData.error || response.statusText);
        // TODO: Display error message to the user
      }

      // 이전 뷰가 있으면 해당 뷰로 복귀, 없으면 관리자 대시보드로
      if (previousView) {
        setCurrentView(previousView);
        setPreviousView(null);

        const savedReport = ensureReportDetail({
          ...data,
          id: savedReportId || Date.now(),
        })

        if (restorePreviousReportView(previousView, savedReport)) {
          if (previousView !== "report-detail") {
            setSelectedReport(null)
          }
          return
        }

        setCurrentView("admin");
        setAdminActiveTab("reports");
        setSelectedReport(null);
      } else {
        setCurrentView("admin");
        setAdminActiveTab("reports");
        setSelectedReport(null);
      }
    } catch (error) {
      console.error('Error saving report:', error);
    }
  };

  // 보고서 수정을 위한 공통 함수
  const handleEditReportFromViewer = async (report: AppReport) => {
    setPreviousView(currentView);

    const detailReport = await loadDetailedReportWithFallback(report.id, report);
    if (!detailReport) {
      console.error('Failed to prepare report for editing:', report.id)
      return
    }

    setSelectedReport(detailReport);

    setCurrentView("admin-edit-report");
    setAdminActiveTab("reports");
    setModalReportViewer(null);
  };

  const handleCancelReportEdit = () => {
    if (previousView && selectedReport) {
      setCurrentView(previousView)
      setPreviousView(null)

      if (restorePreviousReportView(previousView, selectedReport)) {
        if (previousView !== "report-detail") {
          setSelectedReport(null)
        }
        return
      }
    }

    setCurrentView("admin")
    setSelectedReport(null)
  }

  const handleDeleteConference = async (id: number) => {
    try {
      // Find the conference to get its date before deleting
      const conferenceToDelete = conferences.find(c => c.id === id) || allConferences.find(c => c.id === id);
      const conferenceDate = conferenceToDelete ? new Date(conferenceToDelete.startDate || conferenceToDelete.date) : new Date();

      const response = await fetch(`/api/conferences/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const targetYear = conferenceDate.getFullYear();
        const targetMonth = conferenceDate.getMonth() + 1;
        await loadConferences(targetYear, targetMonth);
        await handleAdminMonthChange(targetYear, targetMonth);
      } else {
        console.error('Failed to delete conference');
      }
    } catch (error) {
      console.error('Error deleting conference:', error);
    }
  }

  const handleDeleteReport = async (id: number) => {
    try {
      // Find the report to get its date before deleting
      const reportToDelete = reports.find(r => r.id === id) || allReports.find(r => r.id === id);
      const reportDate = reportToDelete ? new Date(reportToDelete.date) : new Date();

      const response = await fetch(`/api/reports/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // allReports 배열에서 해당 보고서만 제거
        setAllReports(prev => prev.filter(report => report.id !== id));

        const targetYear = reportDate.getFullYear();
        const targetMonth = reportDate.getMonth() + 1;
        await loadAdminReports(targetYear, targetMonth);
        await loadConferences(targetYear, targetMonth);
      } else {
        console.error('Failed to delete report');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  }

  const renderAdmin = () => {
    // 인증 확인
    if (status === "loading") {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p>인증 확인 중...</p>
          </div>
        </div>
      )
    }

    if (!session) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-5V9m0 0V7m0 2h2m-2 0H10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">관리자 인증 필요</h3>
            <p className="text-muted-foreground mb-6">
              관리자 페이지에 접근하려면 로그인이 필요합니다.
            </p>
            <Button
              onClick={() => router.push('/admin/login')}
              className="mr-2"
            >
              로그인하기
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentView('calendar')}
            >
              홈으로 돌아가기
            </Button>
          </div>
        </div>
      )
    }

    // 로그인된 상태에서만 관리자 기능 렌더링
    switch (currentView) {
      case "admin-add-conference":
        return (
          <div className="max-h-[80vh] overflow-y-auto pb-8">
            <AdminConferenceForm onSave={handleSaveConference} onCancel={() => setCurrentView("admin")} />
          </div>
        )
      case "admin-edit-conference":
        return (
          <div className="max-h-[80vh] overflow-y-auto pb-8">
            <AdminConferenceForm
              onSave={handleSaveConference}
              onCancel={() => {
                setCurrentView("admin")
                setSelectedConference(null)
              }}
              initialData={selectedConference || undefined}
              isEdit={true}
            />
          </div>
        )
      case "admin-add-report":
        return (
          <div className="max-h-[80vh] overflow-y-auto pb-8">
            <AdminReportForm onSave={handleSaveReport} onCancel={() => setCurrentView("admin")} conferences={conferences} />
          </div>
        )
      case "admin-edit-report":
        return (
          <div className="max-h-[80vh] overflow-y-auto pb-8">
            <AdminReportForm
              onSave={handleSaveReport}
              onCancel={handleCancelReportEdit}
              initialData={selectedReport ? {
                ...selectedReport,
                downloadUrl: selectedReport.downloadUrl || "",
              } : undefined}
              isEdit={true}
              conferences={conferences}
            />
          </div>
        )
      case "admin-batch-report":
        return (
          <div className="max-h-[80vh] overflow-y-auto pb-8">
            <AdminBatchReportForm
              onCancel={() => setCurrentView("admin")}
              onSuccess={() => {
                const now = new Date();
                loadAdminReports(now.getFullYear(), now.getMonth() + 1);
                loadConferences(now.getFullYear(), now.getMonth() + 1);
              }}
            />
          </div>
        )
      case "admin-add-trend-insight":
        return (
          <div className="max-h-[80vh] overflow-y-auto pb-8">
            <AdminTrendInsightsForm
              onCancel={() => setCurrentView("admin")}
              onSuccess={() => {
                setCurrentView("admin")
                setAdminActiveTab("trend-insights")
              }}
            />
          </div>
        )
      default:
        return (
          <div className="space-y-4">
            <AdminDashboard
              conferences={conferences}
              reports={reports}
              allConferences={allConferences}
              allReports={allReports}
              onAddConference={() => setCurrentView("admin-add-conference")}
              onEditConference={(conference) => {
                const appConference = conference as unknown as AppConference
                const formData: EditableConference = {
                  id: appConference.id,
                  title: appConference.title,
                  startDate: appConference.startDate || appConference.date,
                  endDate: appConference.endDate || appConference.date,
                  startTime: appConference.startTime || "",
                  endTime: appConference.endTime || "",
                  location: appConference.location,
                  organization: appConference.organization,
                  hasReport: appConference.hasReport,
                  description: appConference.description || "",
                }
                setSelectedConference(formData)
                setCurrentView("admin-edit-conference")
              }}
              onDeleteConference={handleDeleteConference}
              onAddReport={() => setCurrentView("admin-add-report")}
              onEditReport={async (report) => {
                const fallbackReport = reports.find((item) => item.id === report.id)
                const detailReport = await loadDetailedReportWithFallback(report.id, fallbackReport)
                if (!detailReport) {
                  console.error('Failed to prepare report for editing:', report.id)
                  return
                }

                setSelectedReport(detailReport)
                setCurrentView("admin-edit-report")
              }}
              onDeleteReport={handleDeleteReport}
              onAddBatchReport={() => setCurrentView("admin-batch-report")}
              onViewReport={async (report) => {
                const fallbackReport = reports.find((item) => item.id === report.id)
                if (fallbackReport) {
                  await openModalReportViewer("admin", fallbackReport)
                }
              }}
              onViewConferenceReport={async (conferenceId) => {
                const conferenceReport = reports.find(report => report.conferenceId === conferenceId)
                if (conferenceReport) {
                  await openModalReportViewer("admin", conferenceReport)
                }
              }}
              onViewSpecificReport={async (reportId) => {
                const report = reports.find(r => r.id === reportId)
                if (report) {
                  await openModalReportViewer("admin", report)
                }
              }}
              onMonthChange={handleAdminMonthChange}
              session={session}
              onLogout={async () => {
                await signOut()
              }}
              activeTab={adminActiveTab}
              onTabChange={setAdminActiveTab}
              onAddTrendInsight={() => setCurrentView("admin-add-trend-insight")}
            />
          </div>
        )
    }
  }


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card relative z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold font-playfair text-primary">메타버스 국제표준화 플랫폼</h1>
            <p className="text-muted-foreground mt-1 text-sm">메타버스 관련 국제표준화 동향과 AI 기반 표준 추천 서비스</p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Configuration 기반 자동 생성 네비게이션 */}
      <nav className="border-b border-border bg-muted/30 relative z-30" role="navigation" aria-label="주요 네비게이션">
        <div className="container mx-auto px-4 py-2 pt-2 pb-2">
          <div className="flex items-center gap-3 md:gap-6 overflow-x-auto overflow-y-visible md:justify-center scroll-smooth scrollbar-hide min-w-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {getTopLevelPages().map((page) => {
              const Icon = page.icon
              const shortcut = page.shortcuts?.[0]

              // 현재 뷰가 이 페이지나 이 페이지의 하위 페이지인지 확인
              const currentPage = getPageById(currentView)
              const isInPageTree = page.id === "admin"
                ? currentView.startsWith("admin")
                : currentView === page.id || currentPage?.parent === page.id

              // 현재 뷰에 해당하는 페이지 정보 (하위 페이지면 하위 페이지 정보 사용)
              const displayPage = isInPageTree && currentPage?.parent === page.id ? currentPage : page

              // 방향별 이동 가능 여부는 현재 뷰 기준으로 확인
              const canGoUp = getNavigationTarget(currentView, 'up') !== undefined && isInPageTree
              const canGoDown = getNavigationTarget(currentView, 'down') !== undefined && isInPageTree

              return (
                <div key={page.id} className="relative flex items-center flex-shrink-0 py-3">
                  {/* 위쪽 방향 표시 - 클릭 가능한 버튼 */}
                  {canGoUp && (
                    <button
                      onClick={() => {
                        const upTarget = getNavigationTarget(currentView, 'up')
                        if (upTarget) navigateToPage(upTarget)
                      }}
                      className="absolute top-0 left-1/2 -translate-x-1/2 text-sm text-primary font-bold z-40 hover:text-primary/80 cursor-pointer bg-background/80 rounded px-1 leading-none"
                      aria-label="상위 페이지로 이동"
                    >
                      ▲
                    </button>
                  )}

                  <Button
                    variant={isInPageTree ? "default" : "ghost"}
                    size="sm"
                    onClick={() => navigateToPage(page.id)}
                    className={cn(
                      "flex items-center gap-1 md:gap-2 relative text-xs md:text-sm whitespace-nowrap",
                      isInPageTree && "font-semibold shadow-md"
                    )}
                    aria-label={shortcut ? `${page.title} 페이지로 이동 (단축키: ${shortcut.key})` : `${page.title} 페이지로 이동`}
                    accessKey={shortcut?.key}
                  >
                    {Icon && <Icon className="w-3 h-3 md:w-4 md:h-4" />}
                    <span className="hidden sm:inline">{displayPage?.title || page.title}</span>
                    <span className="sm:hidden">{(displayPage?.title || page.title).split(' ')[0]}</span>
                  </Button>

                  {/* 아래쪽 방향 표시 - 클릭 가능한 버튼 */}
                  {canGoDown && (
                    <button
                      onClick={() => {
                        const downTarget = getNavigationTarget(currentView, 'down')
                        if (downTarget) navigateToPage(downTarget)
                      }}
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 text-sm text-primary font-bold z-40 hover:text-primary/80 cursor-pointer bg-background/80 rounded px-1 leading-none"
                      aria-label="하위 페이지로 이동"
                    >
                      ▼
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Sliding page container */}
      <div className="page-container">
        {/* Calendar page */}
        <div className={`${getPageClasses("calendar", currentView)} bg-pattern-grid`}>
          <div className="container mx-auto px-4 py-2 pb-20">
            <CalendarComponent
              conferences={conferences}
              reports={reports}
              onViewReport={handleCalendarReportSelect}
              onMonthChange={handleCalendarMonthChange}
              isLoading={isLoadingConferences}
            />
          </div>
        </div>

        {/* Report list page */}
        <div className={`${getPageClasses("reports", currentView)} bg-pattern-circuit`}>
          <div className="container mx-auto px-4 py-2 pb-20">
            <ReportList
              onReportClick={handleReportSelect}
              isAdmin={!!session}
              onEdit={handleEditReportFromViewer}
            />
          </div>
        </div>

        {/* Report detail page */}
        {selectedReport && (
          <div className={`${getPageClasses("report-detail", currentView)} bg-pattern-constellation`}>
            <div className="container mx-auto px-4 py-2 pb-20">
              <ReportViewer
                report={selectedReport}
                onBack={() => {
                  navigateToPage("reports")
                  setSelectedReport(null)
                }}
                isAdmin={!!session}
                onEdit={handleEditReportFromViewer}
              />
            </div>
          </div>
        )}

        {/* Admin page */}
        <div className={`${getPageClasses("admin", currentView)} bg-admin-custom`}>
          <div className="container mx-auto px-4 py-2 pb-20">{renderAdmin()}</div>
        </div>

        {/* Monthly reports page */}
        <div className={`${getPageClasses("monthly-reports", currentView)} bg-pattern-grid`}>
          <div className="container mx-auto px-4 py-2 pb-20">
            <MonthlyReports
              onReportClick={handleMonthlyReportSelect}
              isAdmin={!!session}
              onEdit={handleEditReportFromViewer}
            />
          </div>
        </div>

        {/* Organization reports page */}
        <div className={`${getPageClasses("organization-reports", currentView)} bg-pattern-circuit`}>
          <div className="container mx-auto px-4 py-2 pb-20">
            <OrganizationReports
              onReportClick={handleOrganizationReportSelect}
              isAdmin={!!session}
              onEdit={handleEditReportFromViewer}
            />
          </div>
        </div>

        {/* Category reports page */}
        <div className={`${getPageClasses("category-reports", currentView)} bg-pattern-constellation`}>
          <div className="container mx-auto px-4 py-2 pb-20">
            <CategoryReports
              onReportClick={handleCategoryReportSelect}
              isAdmin={!!session}
              onEdit={handleEditReportFromViewer}
            />
          </div>
        </div>

        {/* Tech analysis page */}
        <div className={`${getPageClasses("tech-analysis", currentView)} bg-pattern-hex`}>
          <div className="container mx-auto px-4 py-2 pb-20">
            <TechAnalysis session={session} />
          </div>
        </div>

        {/* Standard search page */}
        <div className={`${getPageClasses("standard-search", currentView)} bg-pattern-grid`}>
          <div className="container mx-auto px-4 py-2 pb-20">
            <StandardSearch />
          </div>
        </div>

        {/* Standard tools page */}
        <div className={`${getPageClasses("standard-tools", currentView)} bg-pattern-circuit`}>
          <div className="container mx-auto px-4 py-2 pb-20">
            <StandardTools />
          </div>
        </div>

        {/* Trend Insights page */}
        <div className={`${getPageClasses("trend-insights", currentView)} bg-pattern-hex`}>
          <div className="container mx-auto px-4 py-2 pb-20">
            <TrendInsightsList />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 mt-16 relative z-10" role="contentinfo">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            메타버스 국제표준화 동향 © 2024. 왼쪽/오른쪽 화살표로 페이지 이동이 가능합니다.
          </p>
        </div>
      </footer>

      <KeyboardGuide />

      {modalReportViewer && (
        <ReportViewer
          report={modalReportViewer.report}
          onBack={() => setModalReportViewer(null)}
          isAdmin={!!session}
          onEdit={handleEditReportFromViewer}
        />
      )}
    </div>
  )
}
