'use client'

import { useState } from "react"
import { Calendar, FileText, Plus, Edit, Trash2, Eye, List, FolderKanban, LogOut, User, Settings, Server, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminOrganizationForm } from '@/components/admin-organization-form'
import { AdminCategoryForm } from '@/components/admin-category-form'
import { AdminEnvSettings } from '@/components/admin-env-settings'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Conference {
  id: number
  title: string
  date: string
  time: string
  location: string
  organization: string
  hasReport: boolean
  reports?: { id: number; title: string }[]
}

interface Report {
  id: number
  title: string
  date: string
  category: string
  organization: string
  tags: string[]
}

interface AdminDashboardProps {
  conferences: Conference[]
  reports: Report[]
  allConferences?: Conference[]
  allReports?: Report[]
  onAddConference: () => void
  onEditConference: (conference: Conference) => void
  onDeleteConference: (id: number) => void
  onAddReport: () => void
  onEditReport: (report: Report) => void
  onDeleteReport: (id: number) => void
  onViewReport: (report: Report) => void
  onViewConferenceReport: (conferenceId: number) => void
  onViewSpecificReport: (reportId: number) => void
  onMonthChange?: (year: number, month: number) => void
  session?: any
  onLogout?: () => void
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export function AdminDashboard({
  conferences,
  reports,
  allConferences,
  allReports,
  onAddConference,
  onEditConference,
  onDeleteConference,
  onAddReport,
  onEditReport,
  onDeleteReport,
  onViewReport,
  onViewConferenceReport,
  onViewSpecificReport,
  onMonthChange,
  session,
  onLogout,
  activeTab = "conferences",
  onTabChange,
}: AdminDashboardProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  })
  
  const [showAllConferences, setShowAllConferences] = useState(false)
  const [showAllReports, setShowAllReports] = useState(false)

  const handlePrevMonth = () => {
    const newDate = currentDate.month === 1 
      ? { year: currentDate.year - 1, month: 12 }
      : { year: currentDate.year, month: currentDate.month - 1 }
    setCurrentDate(newDate)
    onMonthChange?.(newDate.year, newDate.month)
  }

  const handleNextMonth = () => {
    const newDate = currentDate.month === 12 
      ? { year: currentDate.year + 1, month: 1 }
      : { year: currentDate.year, month: currentDate.month + 1 }
    setCurrentDate(newDate)
    onMonthChange?.(newDate.year, newDate.month)
  }

  const formatCurrentMonth = () => {
    return `${currentDate.year}년 ${currentDate.month}월`
  }

  // 전체 회의 목록을 날짜순으로 정렬 (최신순)
  const getSortedConferences = () => {
    return [...(allConferences || conferences)].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
  }

  // 전체 보고서 목록을 날짜순으로 정렬 (최신순)  
  const getSortedReports = () => {
    return [...(allReports || reports)].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header with User Info */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold font-playfair text-primary">관리자 대시보드</h2>
        {session && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{session.user.name || '관리자'}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/admin/settings'}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              설정
            </Button>
            {onLogout && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card 
          className={`cursor-pointer transition-all duration-200 ${showAllConferences ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setShowAllConferences(!showAllConferences)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">총 회의</p>
                <p className="text-2xl font-bold">{(allConferences || conferences).length}</p>
              </div>
              <Calendar className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">보고서 있는 회의</p>
                <p className="text-2xl font-bold">{(allConferences || conferences).filter((c) => c.reports && c.reports.length > 0).length}</p>
              </div>
              <FileText className="w-8 h-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 ${showAllReports ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setShowAllReports(!showAllReports)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">총 보고서</p>
                <p className="text-2xl font-bold">{(allReports || reports).length}</p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{formatCurrentMonth()} 회의</p>
                <p className="text-2xl font-bold">{conferences.filter((c) => {
                  const selectedMonth = `${currentDate.year}-${String(currentDate.month).padStart(2, '0')}`;
                  return c.date.startsWith(selectedMonth);
                }).length}</p>
              </div>
              <Calendar className="w-8 h-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 전체 회의 목록 */}
      {showAllConferences && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">전체 회의 목록 (최신순)</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAllConferences(false)}
              className="h-8 w-8 p-0"
            >
              ✕
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>제목</TableHead>
                    <TableHead>날짜</TableHead>
                    <TableHead>시간</TableHead>
                    <TableHead>위치</TableHead>
                    <TableHead>기관</TableHead>
                    <TableHead>보고서</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getSortedConferences().map((conference) => (
                    <TableRow key={conference.id}>
                      <TableCell className="font-medium">{conference.title}</TableCell>
                      <TableCell>{conference.date}</TableCell>
                      <TableCell>{conference.time}</TableCell>
                      <TableCell>{conference.location}</TableCell>
                      <TableCell>{conference.organization}</TableCell>
                      <TableCell>
                        {conference.reports && conference.reports.length > 0 ? (
                          <Badge variant="secondary">
                            {conference.reports.length}개
                          </Badge>
                        ) : (
                          <Badge variant="outline">없음</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEditConference?.(conference)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>수정</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onViewConferenceReport?.(conference.id)}
                                  disabled={!conference.reports || conference.reports.length === 0}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>보고서 보기</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 전체 보고서 목록 */}
      {showAllReports && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">전체 보고서 목록 (최신순)</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAllReports(false)}
              className="h-8 w-8 p-0"
            >
              ✕
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>제목</TableHead>
                    <TableHead>날짜</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>기관</TableHead>
                    <TableHead>태그</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getSortedReports().map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.title}</TableCell>
                      <TableCell>{report.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{report.category}</Badge>
                      </TableCell>
                      <TableCell>{report.organization}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {report.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {report.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{report.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onViewSpecificReport?.(report.id)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>보기</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEditReport?.(report)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>수정</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title="삭제">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>보고서 삭제</AlertDialogTitle>
                                <AlertDialogDescription>
                                  "{report.title}" 보고서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDeleteReport?.(report.id)}>
                                  삭제
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="conferences" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            회의 관리
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            보고서 관리
          </TabsTrigger>
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            표준화 기구 관리
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4" />
            카테고리 관리
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            시스템 설정
          </TabsTrigger>
        </TabsList>
        <TabsContent value="conferences">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>회의 일정 관리</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handlePrevMonth}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-2 min-w-[120px] justify-center">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">{formatCurrentMonth()}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleNextMonth}
                      className="flex items-center gap-1"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button onClick={onAddConference}>
                    <Plus className="w-4 h-4 mr-2" />새 회의 등록
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>제목</TableHead>
                      <TableHead>날짜</TableHead>
                      <TableHead>시간</TableHead>
                      <TableHead>장소</TableHead>
                      <TableHead>기관</TableHead>
                      <TableHead>보고서</TableHead>
                      <TableHead>작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {conferences.map((conference) => (
                    <TableRow key={conference.id}>
                      <TableCell className="font-medium">{conference.title}</TableCell>
                      <TableCell>{conference.date}</TableCell>
                      <TableCell>{conference.time}</TableCell>
                      <TableCell>{conference.location}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{conference.organization}</Badge>
                      </TableCell>
                      <TableCell>
                        {conference.reports && conference.reports.length > 0 ? (
                          <Badge variant="default">{conference.reports.length}개</Badge>
                        ) : (
                          <Badge variant="secondary">없음</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {conference.reports && conference.reports.map((report) => (
                            <TooltipProvider key={report.id}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => onViewSpecificReport(report.id)}
                                  >
                                    <FileText className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{report.title}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                          <Button variant="ghost" size="sm" onClick={() => onEditConference(conference)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>회의 삭제</AlertDialogTitle>
                                <AlertDialogDescription>
                                  이 회의를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDeleteConference(conference.id)}>
                                  삭제
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{formatCurrentMonth()} 보고서 관리</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handlePrevMonth}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-2 min-w-[120px] justify-center">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">{formatCurrentMonth()}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleNextMonth}
                      className="flex items-center gap-1"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button onClick={onAddReport}>
                    <Plus className="w-4 h-4 mr-2" />새 보고서 등록
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>제목</TableHead>
                      <TableHead>날짜</TableHead>
                      <TableHead>카테고리</TableHead>
                      <TableHead>기관</TableHead>
                      <TableHead>태그</TableHead>
                      <TableHead>작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium max-w-xs truncate">{report.title}</TableCell>
                      <TableCell>{report.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{report.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{report.organization}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(report.tags) ? report.tags : []).slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {(Array.isArray(report.tags) ? report.tags : []).length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{(Array.isArray(report.tags) ? report.tags : []).length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => onViewReport(report)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => onEditReport(report)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>보고서 삭제</AlertDialogTitle>
                                <AlertDialogDescription>
                                  이 보고서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDeleteReport(report.id)}>삭제</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="organizations">
            <AdminOrganizationForm />
        </TabsContent>
        <TabsContent value="categories">
            <AdminCategoryForm />
        </TabsContent>
        <TabsContent value="system">
            <AdminEnvSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
