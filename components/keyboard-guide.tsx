"use client"

import { useState } from "react"
import { Keyboard, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

export function KeyboardGuide() {
  const [open, setOpen] = useState(false)

  const shortcuts = [
    {
      category: "페이지 네비게이션",
      items: [
        { keys: ["←"], description: "캘린더 → 보고서 목록" },
        { keys: ["→"], description: "캘린더 → 관리자 페이지" },
        { keys: ["→"], description: "보고서 목록 → 캘린더" },
        { keys: ["←"], description: "보고서 상세/관리자 → 이전 페이지" },
      ],
    },
    {
      category: "일반 단축키",
      items: [
        { keys: ["Escape"], description: "현재 작업 취소 / 이전 페이지로" },
        { keys: ["1"], description: "캘린더 페이지로 바로 이동" },
        { keys: ["2"], description: "보고서 목록으로 바로 이동" },
        { keys: ["3"], description: "관리자 페이지로 바로 이동" },
        { keys: ["Tab"], description: "다음 요소로 포커스 이동" },
        { keys: ["Shift", "Tab"], description: "이전 요소로 포커스 이동" },
        { keys: ["Enter"], description: "선택된 요소 활성화" },
      ],
    },
    {
      category: "폼 작업",
      items: [
        { keys: ["Ctrl", "S"], description: "폼 저장 (관리자 페이지)" },
        { keys: ["Ctrl", "Enter"], description: "폼 제출" },
        { keys: ["Escape"], description: "폼 취소" },
      ],
    },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="fixed bottom-4 right-4 z-50">
          <Keyboard className="w-4 h-4 mr-2" />
          단축키
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            키보드 단축키 가이드
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="font-semibold text-lg mb-3">{section.category}</h3>
              <div className="space-y-2">
                {section.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">{item.description}</span>
                    <div className="flex gap-1">
                      {item.keys.map((key, keyIndex) => (
                        <div key={keyIndex} className="flex items-center gap-1">
                          <Badge variant="outline" className="font-mono text-xs px-2 py-1">
                            {key === "↑" && <ArrowUp className="w-3 h-3" />}
                            {key === "↓" && <ArrowDown className="w-3 h-3" />}
                            {key === "←" && <ArrowLeft className="w-3 h-3" />}
                            {key === "→" && <ArrowRight className="w-3 h-3" />}
                            {!["↑", "↓", "←", "→"].includes(key) && key}
                          </Badge>
                          {keyIndex < item.keys.length - 1 && <span className="text-muted-foreground text-xs">+</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-6 p-4 bg-primary/10 rounded-lg">
            <h4 className="font-medium mb-2">접근성 팁</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Tab 키를 사용하여 모든 인터랙티브 요소에 접근할 수 있습니다</li>
              <li>• 스크린 리더 사용자를 위한 ARIA 레이블이 제공됩니다</li>
              <li>• 키보드만으로 모든 기능을 사용할 수 있습니다</li>
              <li>• 페이지 간 슬라이딩 전환으로 연결된 종이를 넘기는 듯한 자연스러운 경험을 제공합니다</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
