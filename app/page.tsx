"use client"

import { useState, useEffect } from "react"
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
import { StandardSearch } from "@/components/standard-search"

// Configuration 기반 imports
import { getTopLevelPages, getAllPageIds } from "@/config/navigation"
import { useKeyboardNavigation, usePageTransition } from "@/hooks/useNavigation"
import { getPageClasses } from "@/utils/navigationUtils"



// Configuration에서 자동으로 ViewType 생성
type ViewType = string

export default function HomePage() {
  const [currentView, setCurrentView] = useState<ViewType>("calendar")
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [selectedConference, setSelectedConference] = useState<any>(null)
  const [conferences, setConferences] = useState([])
  const [reports, setReports] = useState([])
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [adminReportViewer, setAdminReportViewer] = useState<any>(null) // 관리자에서 보는 보고서
  const [monthlyReportViewer, setMonthlyReportViewer] = useState<any>(null) // 월별 동향에서 보는 보고서
  const [organizationReportViewer, setOrganizationReportViewer] = useState<any>(null) // 기구별 동향에서 보는 보고서
  const [calendarReportViewer, setCalendarReportViewer] = useState<any>(null) // 캘린더에서 보는 보고서

  // Load conferences from database
  const loadConferences = async () => {
    try {
      const response = await fetch('/api/conferences');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setConferences(result.data || []);
        }
      } else {
        console.error('Failed to load conferences');
        setConferences([]);
      }
    } catch (error) {
      console.error('Error loading conferences:', error);
      setConferences([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load reports from database
  const loadReports = async () => {
    try {
      const response = await fetch('/api/reports');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
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
              content: report.content,
              category: report.category,
              organization: report.organization,
              tags: tags,
              downloadUrl: report.download_url,
              conferenceId: report.conference_id
            };
          });
          
          setReports(dbReports);
        }
      } else {
        console.error('Failed to load reports');
        setReports([]);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      setReports([]);
    }
  };

  useEffect(() => {
    loadConferences();
    loadReports();
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

  const handleReportClick = (reportId: number) => {
    const report = reports.find((r) => r.id === reportId)
    if (report) {
      setSelectedReport(report)
      setCurrentView("report-detail")
    }
  }

  const handleReportSelect = (report: any) => {
    setSelectedReport(report)
    setCurrentView("report-detail")
  }

  const handleMonthlyReportSelect = (report: any) => {
    setMonthlyReportViewer(report)
  }

  const handleOrganizationReportSelect = (report: any) => {
    setOrganizationReportViewer(report)
  }

  const handleCalendarReportSelect = (report: any) => {
    setCalendarReportViewer(report)
  }


  const handleSaveConference = async (data: any) => {
    try {
      if (selectedConference) {
        // Edit existing conference
        const response = await fetch(`/api/conferences/${selectedConference.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const result = await response.json();
          // Reload conferences to get fresh data from database
          await loadConferences();
        } else {
          console.error('Failed to update conference');
        }
      } else {
        // Add new conference
        const response = await fetch('/api/conferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const result = await response.json();
          // Reload conferences to get fresh data from database
          await loadConferences();
        } else {
          console.error('Failed to create conference');
        }
      }
      setCurrentView("admin")
      setSelectedConference(null)
    } catch (error) {
      console.error('Error saving conference:', error);
    }
  }

  const handleSaveReport = async (data: any) => {
    try {
      if (selectedReport && currentView === "admin-edit-report") {
        // Edit existing report
        const response = await fetch(`/api/reports/${selectedReport.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const result = await response.json();
          // Reload both reports and conferences to get fresh data from database
          await loadReports();
          await loadConferences(); // 회의의 보고서 정보 업데이트
        } else {
          console.error('Failed to update report');
        }
      } else {
        // Add new report
        const response = await fetch('/api/reports', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const result = await response.json();
          // Reload both reports and conferences to get fresh data from database
          await loadReports();
          await loadConferences(); // 회의의 보고서 정보 업데이트
        } else {
          console.error('Failed to create report');
        }
      }
      setCurrentView("admin")
      setSelectedReport(null)
    } catch (error) {
      console.error('Error saving report:', error);
    }
  }

  const handleDeleteConference = async (id: number) => {
    try {
      const response = await fetch(`/api/conferences/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Reload conferences to get fresh data from database
        await loadConferences();
      } else {
        console.error('Failed to delete conference');
      }
    } catch (error) {
      console.error('Error deleting conference:', error);
    }
  }

  const handleDeleteReport = async (id: number) => {
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Reload both reports and conferences to get fresh data from database
        await loadReports();
        await loadConferences(); // 회의의 보고서 정보 업데이트
      } else {
        console.error('Failed to delete report');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  }

  const renderAdmin = () => {
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
              onAddConference={() => setCurrentView("admin-add-conference")}
              onEditConference={(conference) => {
                // Transform conference data for the form
                const formData = {
                  id: conference.id, // Preserve the ID
                  title: conference.title,
                  startDate: conference.startDate || conference.date,
                  endDate: conference.endDate || conference.date,
                  startTime: conference.startTime || "",
                  endTime: conference.endTime || "",
                  location: conference.location,
                  organization: conference.organization,
                  hasReport: conference.hasReport,
                  description: conference.description || ""
                };
                setSelectedConference(formData)
                setCurrentView("admin-edit-conference")
              }}
              onDeleteConference={handleDeleteConference}
              onAddReport={() => setCurrentView("admin-add-report")}
              onEditReport={(report) => {
                setSelectedReport(report)
                setCurrentView("admin-edit-report")
              }}
              onDeleteReport={handleDeleteReport}
              onViewReport={(report) => {
                setAdminReportViewer(report)
              }}
              onViewConferenceReport={(conferenceId) => {
                // 해당 회의와 연관된 보고서 찾기
                const conferenceReport = reports.find(report => report.conferenceId === conferenceId)
                if (conferenceReport) {
                  setAdminReportViewer(conferenceReport)
                }
              }}
              onViewSpecificReport={(reportId) => {
                // 특정 보고서 ID로 보고서 찾기
                const report = reports.find(r => r.id === reportId)
                if (report) {
                  setAdminReportViewer(report)
                }
              }}
            />
          </div>
        )
    }
  }


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card relative z-10">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold font-serif text-primary">메타버스 국제표준화 동향</h1>
          <p className="text-muted-foreground mt-2">메타버스 관련 국제표준화 동향과 표준 검색 서비스</p>
        </div>
      </header>

      {/* Configuration 기반 자동 생성 네비게이션 */}
      <nav className="border-b border-border bg-muted/30 relative z-10" role="navigation" aria-label="주요 네비게이션">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-6">
            {getTopLevelPages().map((page) => {
              const Icon = page.icon
              const shortcut = page.shortcuts?.[0]
              const isActive = page.id === "admin" ? currentView.startsWith("admin") : currentView === page.id
              
              return (
                <Button
                  key={page.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigateToPage(page.id)}
                  className="flex items-center gap-2"
                  aria-label={shortcut ? `${page.title} 페이지로 이동 (단축키: ${shortcut.key})` : `${page.title} 페이지로 이동`}
                  accessKey={shortcut?.key}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {page.title}
                </Button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Sliding page container */}
      <div className="page-container">
        {/* Calendar page */}
        <div className={getPageClasses("calendar", currentView)}>
          <div className="container mx-auto px-4 py-6 pb-20">
            <CalendarComponent conferences={conferences} reports={reports} onViewReport={handleCalendarReportSelect} />
          </div>
        </div>

        {/* Report list page */}
        <div className={getPageClasses("reports", currentView)}>
          <div className="container mx-auto px-4 py-6 pb-20">
            <ReportList reports={reports} onReportClick={handleReportSelect} />
          </div>
        </div>

        {/* Report detail page */}
        {selectedReport && (
          <div className={getPageClasses("report-detail", currentView)}>
            <div className="container mx-auto px-4 py-6 pb-20">
              <ReportViewer
                report={selectedReport}
                onBack={() => {
                  navigateToPage("reports")
                  setSelectedReport(null)
                }}
              />
            </div>
          </div>
        )}

        {/* Admin page */}
        <div className={getPageClasses("admin", currentView)}>
          <div className="container mx-auto px-4 py-6 pb-20">{renderAdmin()}</div>
        </div>

        {/* Monthly reports page */}
        <div className={getPageClasses("monthly-reports", currentView)}>
          <div className="container mx-auto px-4 py-6 pb-20">
            <MonthlyReports reports={reports} onReportClick={handleMonthlyReportSelect} />
          </div>
        </div>

        {/* Organization reports page */}
        <div className={getPageClasses("organization-reports", currentView)}>
          <div className="container mx-auto px-4 py-6 pb-20">
            <OrganizationReports reports={reports} onReportClick={handleOrganizationReportSelect} />
          </div>
        </div>

        {/* Standard search page */}
        <div className={getPageClasses("standard-search", currentView)}>
          <div className="container mx-auto px-4 py-6 pb-20">
            <StandardSearch />
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
        />
      )}

      {/* 월별 동향에서 보고서 뷰어 모달 */}
      {monthlyReportViewer && (
        <ReportViewer
          report={monthlyReportViewer}
          onBack={() => setMonthlyReportViewer(null)}
        />
      )}

      {/* 기구별 동향에서 보고서 뷰어 모달 */}
      {organizationReportViewer && (
        <ReportViewer
          report={organizationReportViewer}
          onBack={() => setOrganizationReportViewer(null)}
        />
      )}

      {/* 캘린더에서 보고서 뷰어 모달 */}
      {calendarReportViewer && (
        <ReportViewer
          report={calendarReportViewer}
          onBack={() => setCalendarReportViewer(null)}
        />
      )}
    </div>
  )
}
