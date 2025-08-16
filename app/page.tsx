"use client"

import { useState, useEffect, useCallback } from "react"
import { Calendar, FileText, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CalendarComponent } from "@/components/calendar-component"
import { ReportList } from "@/components/report-list"
import { ReportViewer } from "@/components/report-viewer"
import { AdminDashboard } from "@/components/admin-dashboard"
import { AdminConferenceForm } from "@/components/admin-conference-form"
import { AdminReportForm } from "@/components/admin-report-form"
import { KeyboardGuide } from "@/components/keyboard-guide"
import { MonthlyReports } from "@/components/monthly-reports"
import { StandardSearch } from "@/components/standard-search"



type ViewType =
  | "calendar"
  | "reports"
  | "report-detail"
  | "admin"
  | "admin-add-conference"
  | "admin-edit-conference"
  | "admin-add-report"
  | "admin-edit-report"
  | "monthly-reports"
  | "standard-search"

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

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't handle keyboard shortcuts when user is typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        // Handle form-specific shortcuts
        if (event.ctrlKey || event.metaKey) {
          switch (event.key) {
            case "s":
              event.preventDefault()
              // Trigger form save if in admin forms
              if (currentView.includes("admin-add") || currentView.includes("admin-edit")) {
                const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement
                if (submitButton) submitButton.click()
              }
              break
            case "Enter":
              event.preventDefault()
              const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement
              if (submitButton) submitButton.click()
              break
          }
        }
        return
      }

      // Ignore key inputs during transition
      if (isTransitioning) return

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault()
          if (currentView === "calendar") {
            setIsTransitioning(true)
            setCurrentView("admin")
            setTimeout(() => setIsTransitioning(false), 600)
          } else if (currentView === "report-detail") {
            setIsTransitioning(true)
            setCurrentView("reports")
            setSelectedReport(null)
            setTimeout(() => setIsTransitioning(false), 600)
          } else if (currentView === "reports") {
            setIsTransitioning(true)
            setCurrentView("calendar")
            setTimeout(() => setIsTransitioning(false), 600)
          }
          break
        case "ArrowRight":
          event.preventDefault()
          if (currentView === "calendar") {
            setIsTransitioning(true)
            setCurrentView("reports")
            setTimeout(() => setIsTransitioning(false), 600)
          } else if (currentView.startsWith("admin")) {
            setIsTransitioning(true)
            setCurrentView("calendar")
            setSelectedConference(null)
            setSelectedReport(null)
            setTimeout(() => setIsTransitioning(false), 600)
          }
          break
        case "ArrowDown":
          event.preventDefault()
          if (currentView === "calendar") {
            setIsTransitioning(true)
            setCurrentView("monthly-reports")
            setTimeout(() => setIsTransitioning(false), 600)
          } else if (currentView === "monthly-reports") {
            setIsTransitioning(true)
            setCurrentView("standard-search")
            setTimeout(() => setIsTransitioning(false), 600)
          }
          break
        case "ArrowUp":
          event.preventDefault()
          if (currentView === "monthly-reports") {
            setIsTransitioning(true)
            setCurrentView("calendar")
            setTimeout(() => setIsTransitioning(false), 600)
          } else if (currentView === "standard-search") {
            setIsTransitioning(true)
            setCurrentView("monthly-reports")
            setTimeout(() => setIsTransitioning(false), 600)
          }
          break
        case "Escape":
          event.preventDefault()
          // Handle escape key for going back
          if (currentView === "report-detail") {
            setIsTransitioning(true)
            setCurrentView("reports")
            setSelectedReport(null)
            setTimeout(() => setIsTransitioning(false), 600)
          } else if (currentView.startsWith("admin-")) {
            if (currentView === "admin") {
              setIsTransitioning(true)
              setCurrentView("calendar")
              setTimeout(() => setIsTransitioning(false), 600)
            } else {
              setCurrentView("admin")
              setSelectedConference(null)
              setSelectedReport(null)
            }
          } else if (currentView === "reports") {
            setIsTransitioning(true)
            setCurrentView("calendar")
            setTimeout(() => setIsTransitioning(false), 600)
          } else if (currentView === "admin") {
            setIsTransitioning(true)
            setCurrentView("calendar")
            setTimeout(() => setIsTransitioning(false), 600)
          } else if (currentView === "monthly-reports") {
            setIsTransitioning(true)
            setCurrentView("calendar")
            setTimeout(() => setIsTransitioning(false), 600)
          } else if (currentView === "standard-search") {
            setIsTransitioning(true)
            setCurrentView("calendar")
            setTimeout(() => setIsTransitioning(false), 600)
          }
          break
        case "1":
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            setIsTransitioning(true)
            setCurrentView("admin")
            setTimeout(() => setIsTransitioning(false), 600)
          }
          break
        case "2":
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            setIsTransitioning(true)
            setCurrentView("calendar")
            setTimeout(() => setIsTransitioning(false), 600)
          }
          break
        case "3":
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            setIsTransitioning(true)
            setCurrentView("reports")
            setTimeout(() => setIsTransitioning(false), 600)
          }
          break
      }
    },
    [currentView, isTransitioning],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    // Don't scroll for overlay views like report-detail
    if (currentView !== "report-detail") {
      // Scroll to top and focus main content when view changes
      window.scrollTo({ top: 0, behavior: "smooth" })

      // Set focus to main content for screen readers
      const mainElement = document.querySelector("main")
      if (mainElement) {
        mainElement.focus()
      }
    }
  }, [currentView])

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

  const getPageClasses = (pageType: string) => {
    const baseClass = `page-slide ${pageType}`

    // Check for admin pages (including all admin sub-views)
    if (pageType === "admin" && currentView.startsWith("admin")) {
      return `${baseClass} active`
    }

    // Keep reports page active when viewing report details (overlay)
    if (pageType === "reports" && currentView === "report-detail") {
      return `${baseClass} active`
    }

    if (currentView === pageType) {
      return `${baseClass} active`
    }

    // Determine sliding direction
    if (pageType === "calendar") {
      if (currentView === "reports" || currentView === "report-detail") return `${baseClass} slide-left`
      if (currentView.startsWith("admin")) return `${baseClass} slide-right`
      if (currentView === "monthly-reports") return `${baseClass} slide-up`
      if (currentView === "standard-search") return `${baseClass} slide-up`
    }

    if (pageType === "reports") {
      if (currentView === "calendar") return `${baseClass} slide-right`
    }

    if (pageType === "admin" || pageType.startsWith("admin")) {
      if (currentView === "calendar") return `${baseClass} slide-left`
    }

    if (pageType === "monthly-reports") {
      if (currentView === "calendar") return `${baseClass} slide-down`
      if (currentView === "standard-search") return `${baseClass} slide-up`
    }

    if (pageType === "standard-search") {
      if (currentView === "monthly-reports") return `${baseClass} slide-down`
      if (currentView === "calendar") return `${baseClass} slide-down`
    }

    return baseClass
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

      {/* Navigation */}
      <nav className="border-b border-border bg-muted/30 relative z-10" role="navigation" aria-label="주요 네비게이션">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-6">
            <Button
              variant={currentView.startsWith("admin") ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setIsTransitioning(true)
                setCurrentView("admin")
                setTimeout(() => setIsTransitioning(false), 600)
              }}
              className="flex items-center gap-2"
              aria-label="관리자 페이지로 이동 (단축키: 1)"
              accessKey="1"
            >
              <Settings className="w-4 h-4" />
              관리자
            </Button>
            <Button
              variant={currentView === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setIsTransitioning(true)
                setCurrentView("calendar")
                setTimeout(() => setIsTransitioning(false), 600)
              }}
              className="flex items-center gap-2"
              aria-label="회의 일정 페이지로 이동 (단축키: 2)"
              accessKey="2"
            >
              <Calendar className="w-4 h-4" />
              회의 일정
            </Button>
            <Button
              variant={currentView === "reports" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setIsTransitioning(true)
                setCurrentView("reports")
                setTimeout(() => setIsTransitioning(false), 600)
              }}
              className="flex items-center gap-2"
              aria-label="동향 보고서 페이지로 이동 (단축키: 3)"
              accessKey="3"
            >
              <FileText className="w-4 h-4" />
              동향 보고서
            </Button>
          </div>
        </div>
      </nav>

      {/* Sliding page container */}
      <div className="page-container">
        {/* Calendar page */}
        <div className={getPageClasses("calendar")}>
          <div className="container mx-auto px-4 py-6 pb-20">
            <CalendarComponent conferences={conferences} onReportClick={handleReportClick} />
          </div>
        </div>

        {/* Report list page */}
        <div className={getPageClasses("reports")}>
          <div className="container mx-auto px-4 py-6 pb-20">
            <ReportList reports={reports} onReportClick={handleReportSelect} />
          </div>
        </div>

        {/* Report detail page */}
        {selectedReport && (
          <div className={getPageClasses("report-detail")}>
            <div className="container mx-auto px-4 py-6 pb-20">
              <ReportViewer
                report={selectedReport}
                onBack={() => {
                  setIsTransitioning(true)
                  setCurrentView("reports")
                  setSelectedReport(null)
                  setTimeout(() => setIsTransitioning(false), 600)
                }}
              />
            </div>
          </div>
        )}

        {/* Admin page */}
        <div className={getPageClasses("admin")}>
          <div className="container mx-auto px-4 py-6 pb-20">{renderAdmin()}</div>
        </div>

        {/* Monthly reports page */}
        <div className={getPageClasses("monthly-reports")}>
          <div className="container mx-auto px-4 py-6 pb-20">
            <MonthlyReports reports={reports} onReportClick={handleMonthlyReportSelect} />
          </div>
        </div>

        {/* Standard search page */}
        <div className={getPageClasses("standard-search")}>
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
    </div>
  )
}
