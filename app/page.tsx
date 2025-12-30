'use client'

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CalendarComponent } from "@/components/calendar-component"
import { ReportList } from "@/components/report-list"
import { ReportViewer } from "@/components/report-viewer"
import { AdminDashboard } from "@/components/admin-dashboard"
import { AdminConferenceForm } from "@/components/admin-conference-form"
import { AdminReportForm } from "@/components/admin-report-form"
import { KeyboardGuide } from "@/components/keyboard-guide"
import { MonthlyReports } from "@/components/monthly-reports"
import { OrganizationReports } from "@/components/organization-reports"
import { CategoryReports } from "@/components/category-reports"
import { StandardSearch } from "@/components/standard-search"
import { TechAnalysis } from "@/components/tech-analysis"
import { StandardTools } from "@/components/standard-tools"

import { ThemeToggle } from "@/components/ui/theme-toggle"

// Configuration 기반 imports
import { getTopLevelPages, getAllPageIds, getNavigationTarget, getPageById } from "@/config/navigation"
import { useKeyboardNavigation, usePageTransition } from "@/hooks/useNavigation"
import { cn } from "@/lib/utils"



// Configuration에서 자동으로 ViewType 생성
type ViewType = string

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
  const [currentView, setCurrentView] = useState<ViewType>("calendar")
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [selectedConference, setSelectedConference] = useState<any>(null)
  const [conferences, setConferences] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [allConferences, setAllConferences] = useState<any[]>([])
  const [allReports, setAllReports] = useState<any[]>([])
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingConferences, setIsLoadingConferences] = useState(false)
  const [adminReportViewer, setAdminReportViewer] = useState<any>(null) // 관리자에서 보는 보고서
  const [monthlyReportViewer, setMonthlyReportViewer] = useState<any>(null) // 월별 동향에서 보는 보고서
  const [organizationReportViewer, setOrganizationReportViewer] = useState<any>(null) // 기구별 동향에서 보는 보고서
  const [categoryReportViewer, setCategoryReportViewer] = useState<any>(null) // 분야별 동향에서 보는 보고서
  const [calendarReportViewer, setCalendarReportViewer] = useState<any>(null) // 캘린더에서 보는 보고서
  const [adminActiveTab, setAdminActiveTab] = useState("conferences") // 관리자 탭 상태 관리
  const [previousView, setPreviousView] = useState<string | null>(null) // 수정 전 이전 페이지 저장
  
  // 더보기 기능을 위한 state
  const [currentOffset, setCurrentOffset] = useState(0)
  const [hasMoreReports, setHasMoreReports] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

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
      // Get a high limit to fetch all reports for statistics
      const response = await fetch('/api/reports?limit=10000&offset=0');
      if (response.ok) {
        const result = await response.json();
        const reportData = (result.data || []).map((report: any) => {
          let tags = [];
          try {
            tags = typeof report.tags === 'string' ? JSON.parse(report.tags || '[]') : (report.tags || []);
          } catch (e) {
            console.warn('Failed to parse tags for report', report.id, e);
            tags = [];
          }
          
          return {
            id: report.id,
            title: report.title,
            date: report.date,
            summary: report.summary,
            category: report.category,
            organization: report.organization,
            tags: tags,
            downloadUrl: report.download_url,
            conferenceId: report.conference_id
          };
        });
        setAllReports(reportData);
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
  const loadReports = async (year?: number, month?: number, reset = true) => {
    try {
      const offset = reset ? 0 : currentOffset;
      const limit = 50;
      
      let apiUrl = `/api/reports?limit=${limit}&offset=${offset}`;
      
      // year와 month가 모두 제공된 경우에만 월별 필터링 적용
      if (year && month) {
        apiUrl += `&year=${year}&month=${month}`;
      }
      
      // 리스트용 API - content 제외하고 빠른 로딩
      const response = await fetch(apiUrl);
      if (response.ok) {
        const result = await response.json();
        // Transform database data to frontend format
        const dbReports = (result.data || []).map((report: any) => {
          let tags = [];
          try {
            // Handle both string and already-parsed array cases
            tags = typeof report.tags === 'string' ? JSON.parse(report.tags || '[]') : (report.tags || []);
          } catch (e) {
            console.warn('Failed to parse tags for report', report.id, e);
            tags = [];
          }
          
          return {
            id: report.id,
            title: report.title,
            date: report.date,
            summary: report.summary,
            // content는 리스트에서 제외 - 필요할 때만 개별 로딩
            category: report.category,
            organization: report.organization,
            tags: tags,
            downloadUrl: report.download_url,
            conferenceId: report.conference_id
          };
        });
        
        if (reset) {
          setReports(dbReports);
          setCurrentOffset(limit);
        } else {
          setReports(prev => [...prev, ...dbReports]);
          setCurrentOffset(prev => prev + limit);
        }
        
        // 더 가져올 데이터가 있는지 확인 (요청한 limit보다 적게 왔으면 끝)
        setHasMoreReports(dbReports.length === limit);
      } else {
        console.error('Failed to load reports');
        if (reset) setReports([]);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      if (reset) setReports([]);
    }
  };

  // 개별 보고서 상세 내용 로딩 (content 포함)
  const loadReportDetail = async (reportId: number) => {
    try {
      const response = await fetch(`/api/reports/${reportId}`);
      if (response.ok) {
        const result = await response.json();
        const report = result.data;
        let tags = [];
        try {
          tags = typeof report.tags === 'string' ? JSON.parse(report.tags || '[]') : (report.tags || []);
        } catch (e) {
          console.warn('Failed to parse tags for report', report.id, e);
          tags = [];
        }
        
        return {
          id: report.id,
          title: report.title,
          date: report.date,
          summary: report.summary,
          content: report.content, // 상세 로딩 시에만 포함
          category: report.category,
          organization: report.organization,
          tags: tags,
          downloadUrl: report.download_url,
          conferenceId: report.conference_id
        };
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

  const handleReportClick = async (reportId: number) => {
    // 먼저 리스트에서 기본 정보 가져오기
    const basicReport = reports.find((r) => r.id === reportId)
    if (basicReport) {
      // 상세 내용 로딩
      const detailReport = await loadReportDetail(reportId)
      if (detailReport) {
        setSelectedReport(detailReport)
        setCurrentView("report-detail")
      } else {
        // 상세 로딩 실패 시 기본 정보로라도 표시
        setSelectedReport(basicReport)
        setCurrentView("report-detail")
      }
    }
  }

  const handleReportSelect = async (report: any) => {
    // 이미 content가 있는지 확인
    if (report.content) {
      setSelectedReport(report)
      setCurrentView("report-detail")
    } else {
      // content가 없으면 상세 로딩
      const detailReport = await loadReportDetail(report.id)
      if (detailReport) {
        setSelectedReport(detailReport)
        setCurrentView("report-detail")
      } else {
        setSelectedReport(report)
        setCurrentView("report-detail")
      }
    }
  }

  const handleMonthlyReportSelect = async (report: any) => {
    // content를 포함한 상세 데이터 로딩
    const detailReport = await loadReportDetail(report.id)
    if (detailReport) {
      setMonthlyReportViewer(detailReport)
    } else {
      setMonthlyReportViewer(report)
    }
  }

  const handleOrganizationReportSelect = async (report: any) => {
    // content를 포함한 상세 데이터 로딩
    const detailReport = await loadReportDetail(report.id)
    if (detailReport) {
      setOrganizationReportViewer(detailReport)
    } else {
      setOrganizationReportViewer(report)
    }
  }

  const handleCategoryReportSelect = async (report: any) => {
    // content를 포함한 상세 데이터 로딩
    const detailReport = await loadReportDetail(report.id)
    if (detailReport) {
      setCategoryReportViewer(detailReport)
    } else {
      setCategoryReportViewer(report)
    }
  }

  const handleCalendarReportSelect = async (report: any) => {
    // content를 포함한 상세 데이터 로딩
    const detailReport = await loadReportDetail(report.id)
    if (detailReport) {
      setCalendarReportViewer(detailReport)
    } else {
      setCalendarReportViewer(report)
    }
  }

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
    await loadReports(year, month, true) // 월별 필터링하여 로드
  }

  // 더보기 버튼 핸들러 - DB에서 추가 보고서 로딩 (전체 데이터)
  const handleLoadMoreReports = async () => {
    if (isLoadingMore || !hasMoreReports) return
    
    setIsLoadingMore(true)
    try {
      await loadReports(undefined, undefined, false) // 전체 데이터에서 추가 로딩
    } finally {
      setIsLoadingMore(false)
    }
  }


  const handleSaveConference = async (data: any) => {
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

  const handleSaveReport = async (data: any) => {
    try {
      const isEdit = selectedReport && currentView === "admin-edit-report";
      const url = isEdit ? `/api/reports/${selectedReport.id}` : '/api/reports';
      const method = isEdit ? 'PUT' : 'POST';

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
          // 수정의 경우: allReports 배열에서 해당 보고서 업데이트
          setAllReports(prev => prev.map(report => 
            report.id === selectedReport.id 
              ? { ...report, ...data, id: selectedReport.id }
              : report
          ));
        } else {
          // 새로 등록의 경우: allReports 배열 맨 앞에 새 보고서 추가
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
        // 보고서 뷰어를 다시 열어주기 (수정된 내용으로)
        const savedReport = { ...data, id: selectedReport?.id || data.id };
        switch (previousView) {
          case "admin":
            setAdminReportViewer(savedReport);
            break;
          case "monthly-reports":
            setMonthlyReportViewer(savedReport);
            break;
          case "organization-reports":
            setOrganizationReportViewer(savedReport);
            break;
          case "category-reports":
            setCategoryReportViewer(savedReport);
            break;
          case "calendar":
            setCalendarReportViewer(savedReport);
            break;
          case "report-detail":
            // report-detail 뷰의 경우 selectedReport를 업데이트
            setSelectedReport(savedReport);
            setCurrentView("report-detail");
            return; // early return to avoid clearing selectedReport
          default:
            setCurrentView("admin");
            setAdminActiveTab("reports");
        }
        setSelectedReport(null); // 다른 뷰들은 selectedReport를 초기화
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
  const handleEditReportFromViewer = async (report: any) => {
    // 현재 뷰를 이전 뷰로 저장
    setPreviousView(currentView);
    
    // content를 포함한 상세 데이터 로딩 (기존 onEditReport와 동일한 방식)
    const detailReport = await loadReportDetail(report.id);
    if (detailReport) {
      setSelectedReport(detailReport);
    } else {
      setSelectedReport(report);
    }
    
    // 관리자 편집 화면으로 이동
    setCurrentView("admin-edit-report");
    setAdminActiveTab("reports");
    
    // 현재 열린 모든 뷰어 닫기
    setAdminReportViewer(null);
    setMonthlyReportViewer(null);
    setOrganizationReportViewer(null);
    setCategoryReportViewer(null);
    setCalendarReportViewer(null);
  };

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
              initialData={selectedConference}
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
              onCancel={() => {
                setCurrentView("admin")
                setSelectedReport(null)
              }}
              initialData={selectedReport}
              isEdit={true}
              conferences={conferences}
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
                // Transform conference data for the form
                const formData = {
                  id: conference.id, // Preserve the ID
                  title: conference.title,
                  startDate: (conference as any).startDate || (conference as any).date,
                  endDate: (conference as any).endDate || (conference as any).date,
                  startTime: (conference as any).startTime || "",
                  endTime: (conference as any).endTime || "",
                  location: conference.location,
                  organization: conference.organization,
                  hasReport: conference.hasReport,
                  description: (conference as any).description || ""
                };
                setSelectedConference(formData)
                setCurrentView("admin-edit-conference")
              }}
              onDeleteConference={handleDeleteConference}
              onAddReport={() => setCurrentView("admin-add-report")}
              onEditReport={async (report) => {
                // content를 포함한 상세 데이터 로딩 (뷰어와 동일한 방식)
                const detailReport = await loadReportDetail(report.id)
                if (detailReport) {
                  setSelectedReport(detailReport)
                } else {
                  // 실패 시 기본 데이터라도 전달 (기존 방식과 동일)
                  setSelectedReport(report)
                }
                setCurrentView("admin-edit-report")
              }}
              onDeleteReport={handleDeleteReport}
              onViewReport={async (report) => {
                // content를 포함한 상세 데이터 로딩
                const detailReport = await loadReportDetail(report.id)
                if (detailReport) {
                  setAdminReportViewer(detailReport)
                } else {
                  setAdminReportViewer(report)
                }
              }}
              onViewConferenceReport={async (conferenceId) => {
                // 해당 회의와 연관된 보고서 찾기
                const conferenceReport = reports.find(report => report.conferenceId === conferenceId)
                if (conferenceReport) {
                  // content를 포함한 상세 데이터 로딩
                  const detailReport = await loadReportDetail(conferenceReport.id)
                  if (detailReport) {
                    setAdminReportViewer(detailReport)
                  } else {
                    setAdminReportViewer(conferenceReport)
                  }
                }
              }}
              onViewSpecificReport={async (reportId) => {
                // content를 포함한 상세 데이터 로딩
                const detailReport = await loadReportDetail(reportId)
                if (detailReport) {
                  setAdminReportViewer(detailReport)
                } else {
                  // 실패 시 기본 데이터라도 표시
                  const report = reports.find(r => r.id === reportId)
                  if (report) {
                    setAdminReportViewer(report)
                  }
                }
              }}
              onMonthChange={handleAdminMonthChange}
              session={session}
              onLogout={async () => {
                await signOut()
              }}
              activeTab={adminActiveTab}
              onTabChange={setAdminActiveTab}
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
            <p className="text-muted-foreground mt-1 text-sm">메타버스 관련 국제표준화 동향과 표준 검색 서비스</p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Configuration 기반 자동 생성 네비게이션 */}
      <nav className="border-b border-border bg-muted/30 relative z-30" role="navigation" aria-label="주요 네비게이션">
        <div className="container mx-auto px-4 py-2 pt-2 pb-2">
          <div className="flex items-center gap-3 md:gap-6 overflow-x-auto overflow-y-visible md:justify-center scroll-smooth scrollbar-hide min-w-0"
               style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
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

      {/* 관리자 대시보드에서 보고서 뷰어 모달 */}
      {adminReportViewer && (
        <ReportViewer
          report={adminReportViewer}
          onBack={() => setAdminReportViewer(null)}
          isAdmin={!!session}
          onEdit={handleEditReportFromViewer}
        />
      )}

      {/* 월별 동향에서 보고서 뷰어 모달 */}
      {monthlyReportViewer && (
        <ReportViewer
          report={monthlyReportViewer}
          onBack={() => setMonthlyReportViewer(null)}
          isAdmin={!!session}
          onEdit={handleEditReportFromViewer}
        />
      )}

      {/* 기구별 동향에서 보고서 뷰어 모달 */}
      {organizationReportViewer && (
        <ReportViewer
          report={organizationReportViewer}
          onBack={() => setOrganizationReportViewer(null)}
          isAdmin={!!session}
          onEdit={handleEditReportFromViewer}
        />
      )}

      {/* 분야별 동향에서 보고서 뷰어 모달 */}
      {categoryReportViewer && (
        <ReportViewer
          report={categoryReportViewer}
          onBack={() => setCategoryReportViewer(null)}
          isAdmin={!!session}
          onEdit={handleEditReportFromViewer}
        />
      )}

      {/* 캘린더에서 보고서 뷰어 모달 */}
      {calendarReportViewer && (
        <ReportViewer
          report={calendarReportViewer}
          onBack={() => setCalendarReportViewer(null)}
          isAdmin={!!session}
          onEdit={handleEditReportFromViewer}
        />
      )}
    </div>
  )
}
