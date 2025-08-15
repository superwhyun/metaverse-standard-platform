"use client"

import { useState } from "react"
import { Calendar, FileText, Plus, Edit, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  onAddConference: () => void
  onEditConference: (conference: Conference) => void
  onDeleteConference: (id: number) => void
  onAddReport: () => void
  onEditReport: (report: Report) => void
  onDeleteReport: (id: number) => void
  onViewReport: (report: Report) => void
}

export function AdminDashboard({
  conferences,
  reports,
  onAddConference,
  onEditConference,
  onDeleteConference,
  onAddReport,
  onEditReport,
  onDeleteReport,
  onViewReport,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"conferences" | "reports">("conferences")

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold font-serif text-primary">관리자 대시보드</h2>
        <div className="flex gap-2">
          <Button
            variant={activeTab === "conferences" ? "default" : "outline"}
            onClick={() => setActiveTab("conferences")}
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            회의 관리
          </Button>
          <Button
            variant={activeTab === "reports" ? "default" : "outline"}
            onClick={() => setActiveTab("reports")}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            보고서 관리
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">총 회의</p>
                <p className="text-2xl font-bold">{conferences.length}</p>
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
                <p className="text-2xl font-bold">{conferences.filter((c) => c.hasReport).length}</p>
              </div>
              <FileText className="w-8 h-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">총 보고서</p>
                <p className="text-2xl font-bold">{reports.length}</p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">이번 달 회의</p>
                <p className="text-2xl font-bold">{conferences.filter((c) => c.date.startsWith("2024-12")).length}</p>
              </div>
              <Calendar className="w-8 h-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content based on active tab */}
      {activeTab === "conferences" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>회의 일정 관리</CardTitle>
              <Button onClick={onAddConference}>
                <Plus className="w-4 h-4 mr-2" />새 회의 등록
              </Button>
            </div>
          </CardHeader>
          <CardContent>
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
                      {conference.hasReport ? (
                        <Badge variant="default">있음</Badge>
                      ) : (
                        <Badge variant="secondary">없음</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
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
          </CardContent>
        </Card>
      )}

      {activeTab === "reports" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>보고서 관리</CardTitle>
              <Button onClick={onAddReport}>
                <Plus className="w-4 h-4 mr-2" />새 보고서 등록
              </Button>
            </div>
          </CardHeader>
          <CardContent>
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
                        {report.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {report.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{report.tags.length - 2}
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
          </CardContent>
        </Card>
      )}
    </div>
  )
}
