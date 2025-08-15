"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, Calendar, FileText, Settings } from "lucide-react"
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

const mockConferences = [
  {
    id: 1,
    date: "2024-12-15",
    title: "ISO/IEC JTC 1/SC 24 메타버스 표준화 회의",
    time: "09:00-17:00",
    location: "서울 코엑스",
    organization: "ISO/IEC",
    hasReport: true,
    reportId: 1,
  },
  {
    id: 2,
    date: "2024-12-20",
    title: "ITU-T SG16 가상현실 표준 워킹그룹",
    time: "14:00-18:00",
    location: "온라인",
    organization: "ITU-T",
    hasReport: false,
  },
  {
    id: 3,
    date: "2024-12-28",
    title: "IEEE 메타버스 기술 표준 컨퍼런스",
    time: "10:00-16:00",
    location: "부산 벡스코",
    organization: "IEEE",
    hasReport: true,
    reportId: 2,
  },
  {
    id: 4,
    date: "2024-12-10",
    title: "W3C 메타버스 웹 표준 워크샵",
    time: "13:00-17:00",
    location: "대전 KAIST",
    organization: "W3C",
    hasReport: true,
    reportId: 3,
  },
  {
    id: 5,
    date: "2024-12-25",
    title: "ETSI 확장현실(XR) 표준화 회의",
    time: "09:30-15:30",
    location: "온라인",
    organization: "ETSI",
    hasReport: false,
  },
]

const mockReports = [
  {
    id: 1,
    title: "ISO/IEC 23005 메타버스 상호운용성 표준 동향",
    date: "2024-12-10",
    summary: "메타버스 플랫폼 간 상호운용성을 위한 ISO/IEC 23005 표준의 최신 개발 동향을 분석합니다.",
    content:
      "메타버스 생태계의 급속한 성장과 함께 플랫폼 간 상호운용성의 중요성이 대두되고 있습니다. ISO/IEC 23005 표준은 이러한 요구에 부응하여 메타버스 환경에서의 데이터 교환, 사용자 인터페이스, 그리고 서비스 통합을 위한 프레임워크를 제공합니다.\n\n주요 내용:\n1. 메타버스 플랫폼 간 아바타 이동성\n2. 가상 자산의 표준화된 표현\n3. 크로스 플랫폼 통신 프로토콜\n4. 보안 및 프라이버시 고려사항\n\n이번 회의에서는 특히 아바타 표현 방식의 표준화와 관련된 기술적 세부사항이 논의되었으며, 2025년 상반기 최종 표준 발표를 목표로 하고 있습니다.",
    category: "상호운용성",
    organization: "ISO/IEC",
    tags: ["메타버스", "상호운용성", "아바타", "표준화"],
    downloadUrl: "/reports/iso-iec-23005.pdf",
  },
  {
    id: 2,
    title: "ITU-T H.430 시리즈 가상현실 품질 평가 표준",
    date: "2024-12-08",
    summary: "ITU-T에서 개발 중인 가상현실 서비스 품질 평가를 위한 H.430 시리즈 표준을 소개합니다.",
    content:
      "가상현실 서비스의 품질 평가는 사용자 경험의 핵심 요소입니다. ITU-T H.430 시리즈는 VR 서비스의 객관적 품질 측정 방법론을 제시합니다.\n\n표준의 주요 구성:\n1. H.430.1: VR 비디오 품질 평가 방법\n2. H.430.2: VR 오디오 품질 평가 방법\n3. H.430.3: VR 상호작용 지연시간 측정\n4. H.430.4: 사용자 경험 품질(QoE) 평가\n\n이 표준은 VR 서비스 제공업체들이 일관된 품질 기준을 적용할 수 있도록 도움을 줄 것으로 예상됩니다.",
    category: "품질 평가",
    organization: "ITU-T",
    tags: ["가상현실", "품질평가", "QoE", "H.430"],
    downloadUrl: "/reports/itu-t-h430.pdf",
  },
  {
    id: 3,
    title: "W3C 메타버스 웹 표준 개발 현황",
    date: "2024-12-05",
    summary: "W3C에서 진행 중인 메타버스 관련 웹 표준 개발 현황과 향후 계획을 정리했습니다.",
    content:
      "W3C는 메타버스를 웹 기반으로 구현하기 위한 다양한 표준을 개발하고 있습니다.\n\n주요 개발 영역:\n1. WebXR Device API 확장\n2. Web3D 그래픽스 표준\n3. 분산 신원 관리(DID) 표준\n4. 웹 기반 가상 경제 표준\n\n특히 WebXR API의 새로운 기능들이 주목받고 있으며, 브라우저에서 직접 고품질 메타버스 경험을 제공할 수 있는 기반을 마련하고 있습니다.",
    category: "웹 표준",
    organization: "W3C",
    tags: ["웹표준", "WebXR", "DID", "Web3D"],
  },
  {
    id: 4,
    title: "IEEE 2888 메타버스 시스템 아키텍처 표준",
    date: "2024-11-28",
    summary: "IEEE에서 개발 중인 메타버스 시스템 아키텍처 표준 IEEE 2888의 최신 동향을 분석합니다.",
    content:
      "IEEE 2888 표준은 메타버스 시스템의 전체적인 아키텍처를 정의하는 포괄적인 표준입니다.\n\n주요 구성 요소:\n1. 메타버스 시스템 참조 모델\n2. 컴포넌트 간 인터페이스 정의\n3. 데이터 모델 및 프로토콜\n4. 보안 및 프라이버시 프레임워크\n\n이 표준은 메타버스 생태계의 기술적 기반을 제공하며, 다양한 메타버스 플랫폼 간의 통합을 가능하게 합니다.",
    category: "시스템 아키텍처",
    organization: "IEEE",
    tags: ["시스템아키텍처", "IEEE2888", "참조모델", "인터페이스"],
  },
  {
    id: 5,
    title: "ETSI GS MEC 메타버스 엣지 컴퓨팅 표준",
    date: "2024-11-20",
    summary: "ETSI에서 개발하는 메타버스 서비스를 위한 멀티액세스 엣지 컴퓨팅(MEC) 표준을 소개합니다.",
    content:
      "메타버스 서비스의 실시간성과 몰입감을 보장하기 위해서는 엣지 컴퓨팅 기술이 필수적입니다.\n\n주요 기술 요소:\n1. 초저지연 렌더링 서비스\n2. 분산 컴퓨팅 자원 관리\n3. 동적 로드 밸런싱\n4. QoS 보장 메커니즘\n\nETSI GS MEC 표준은 5G 네트워크와 연계하여 메타버스 서비스의 성능을 최적화하는 방안을 제시합니다.",
    category: "엣지 컴퓨팅",
    organization: "ETSI",
    tags: ["엣지컴퓨팅", "MEC", "5G", "초저지연"],
  },
]

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
  const [conferences, setConferences] = useState(mockConferences)
  const [reports, setReports] = useState(mockReports)
  const [isTransitioning, setIsTransitioning] = useState(false)

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
    // Scroll to top and focus main content when view changes
    window.scrollTo({ top: 0, behavior: "smooth" })

    // Set focus to main content for screen readers
    const mainElement = document.querySelector("main")
    if (mainElement) {
      mainElement.focus()
    }
  }, [currentView])

  const handleReportClick = (reportId: number) => {
    const report = mockReports.find((r) => r.id === reportId)
    if (report) {
      setSelectedReport(report)
      setCurrentView("report-detail")
    }
  }

  const handleReportSelect = (report: any) => {
    setSelectedReport(report)
    setCurrentView("report-detail")
  }

  const getRelatedReports = (currentReport: any) => {
    return mockReports
      .filter((r) => r.id !== currentReport.id)
      .filter(
        (r) =>
          r.category === currentReport.category ||
          r.organization === currentReport.organization ||
          r.tags.some((tag) => currentReport.tags.includes(tag)),
      )
      .slice(0, 3)
  }

  const handleSaveConference = (data: any) => {
    if (selectedConference) {
      // Edit existing conference
      setConferences((prev) =>
        prev.map((conf) =>
          conf.id === selectedConference.id ? { ...conf, ...data, id: selectedConference.id } : conf,
        ),
      )
    } else {
      // Add new conference
      const newConference = {
        ...data,
        id: Math.max(...conferences.map((c) => c.id)) + 1,
        reportId: data.hasReport ? Math.max(...reports.map((r) => r.id)) + 1 : undefined,
      }
      setConferences((prev) => [...prev, newConference])
    }
    setCurrentView("admin")
    setSelectedConference(null)
  }

  const handleSaveReport = (data: any) => {
    if (selectedReport && currentView === "admin-edit-report") {
      // Edit existing report
      setReports((prev) =>
        prev.map((report) =>
          report.id === selectedReport.id ? { ...report, ...data, id: selectedReport.id } : report,
        ),
      )
    } else {
      // Add new report
      const newReport = {
        ...data,
        id: Math.max(...reports.map((r) => r.id)) + 1,
      }
      setReports((prev) => [...prev, newReport])
    }
    setCurrentView("admin")
    setSelectedReport(null)
  }

  const handleDeleteConference = (id: number) => {
    setConferences((prev) => prev.filter((conf) => conf.id !== id))
  }

  const handleDeleteReport = (id: number) => {
    setReports((prev) => prev.filter((report) => report.id !== id))
  }

  const renderAdmin = () => {
    switch (currentView) {
      case "admin-add-conference":
        return <AdminConferenceForm onSave={handleSaveConference} onCancel={() => setCurrentView("admin")} />
      case "admin-edit-conference":
        return (
          <AdminConferenceForm
            onSave={handleSaveConference}
            onCancel={() => {
              setCurrentView("admin")
              setSelectedConference(null)
            }}
            initialData={selectedConference}
            isEdit={true}
          />
        )
      case "admin-add-report":
        return <AdminReportForm onSave={handleSaveReport} onCancel={() => setCurrentView("admin")} />
      case "admin-edit-report":
        return (
          <AdminReportForm
            onSave={handleSaveReport}
            onCancel={() => {
              setCurrentView("admin")
              setSelectedReport(null)
            }}
            initialData={selectedReport}
            isEdit={true}
          />
        )
      default:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" size="sm" onClick={() => setCurrentView("calendar")}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                캘린더로 돌아가기
              </Button>
            </div>
            <AdminDashboard
              conferences={conferences}
              reports={reports}
              onAddConference={() => setCurrentView("admin-add-conference")}
              onEditConference={(conference) => {
                setSelectedConference(conference)
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
                setSelectedReport(report)
                setCurrentView("report-detail")
              }}
            />
          </div>
        )
    }
  }

  const getPageClasses = (pageType: string) => {
    const baseClass = `page-slide ${pageType}`

    if (currentView === pageType) {
      return `${baseClass} active`
    }

    // Determine sliding direction
    if (pageType === "calendar") {
      if (currentView === "reports") return `${baseClass} slide-left`
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
          <div className="container mx-auto">
            <CalendarComponent conferences={conferences} onReportClick={handleReportClick} />
          </div>
        </div>

        {/* Report list page */}
        <div className={getPageClasses("reports")}>
          <div className="container mx-auto">
            <ReportList reports={reports} onReportClick={handleReportSelect} />
          </div>
        </div>

        {/* Report detail page */}
        {selectedReport && (
          <div className={getPageClasses("report-detail")}>
            <div className="container mx-auto">
              <ReportViewer
                report={selectedReport}
                onBack={() => {
                  setIsTransitioning(true)
                  setCurrentView("reports")
                  setSelectedReport(null)
                  setTimeout(() => setIsTransitioning(false), 600)
                }}
                relatedReports={getRelatedReports(selectedReport)}
                onRelatedReportClick={handleReportSelect}
              />
            </div>
          </div>
        )}

        {/* Admin page */}
        <div className={getPageClasses("admin")}>
          <div className="container mx-auto">{renderAdmin()}</div>
        </div>

        {/* Monthly reports page */}
        <div className={getPageClasses("monthly-reports")}>
          <div className="container mx-auto">
            <MonthlyReports reports={reports} onReportClick={handleReportSelect} />
          </div>
        </div>

        {/* Standard search page */}
        <div className={getPageClasses("standard-search")}>
          <div className="container mx-auto">
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
    </div>
  )
}
