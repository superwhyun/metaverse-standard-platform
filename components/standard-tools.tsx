'use client'

import { ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ToolItem {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: React.ReactNode;
}

// 커스텀 SVG 아이콘들
const MarkdownIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M7 9v6M17 9v6M10 12h4M7 15l3-3-3-3M17 15l-3-3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M18 7h2v2" stroke="currentColor" strokeWidth="1" fill="none"/>
    <path d="M20 7v4l-2 2" stroke="currentColor" strokeWidth="1" fill="none"/>
  </svg>
);

const DateCalculatorIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
    <path d="M7 14h2v2H7zM11 14h2v2h-2zM15 14h2v2h-2z" fill="currentColor"/>
    <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M17 18h2M18 17v2" stroke="currentColor" strokeWidth="1"/>
  </svg>
);

const WorldClockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M3 12h2M19 12h2M12 3v2M12 19v2" stroke="currentColor" strokeWidth="1"/>
    <path d="M5.6 5.6l1.4 1.4M16.6 16.6l1.4 1.4M5.6 18.4l1.4-1.4M16.6 7.4l1.4-1.4" stroke="currentColor" strokeWidth="1"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
  </svg>
);

const PdfMergerIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="8" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <rect x="13" y="3" width="8" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <rect x="8" y="11" width="8" height="10" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M7 7h2M7 9h1.5M17 7h2M17 9h1.5M12 15h2M12 17h1.5" stroke="currentColor" strokeWidth="1"/>
    <path d="M7 13l5 2M17 13l-5 2" stroke="currentColor" strokeWidth="1.5"/>
    <text x="11" y="18" fill="currentColor" fontSize="4" fontWeight="bold">PDF</text>
  </svg>
);

const MetaverseMeetingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="8" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="8" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <circle cx="16" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M8 14v3M16 14v3M12 10v7" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="6" y="4" width="12" height="6" rx="1" stroke="currentColor" strokeWidth="1" fill="none"/>
    <path d="M9 6h6M10 8h4" stroke="currentColor" strokeWidth="1"/>
    <circle cx="12" cy="16" r="1" fill="currentColor"/>
  </svg>
);

const GltfViewerIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M12 2v20M3 7l9 5 9-5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7.5 4.5l9 5M16.5 4.5l-9 5" stroke="currentColor" strokeWidth="1"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1" fill="none"/>
    <path d="M12 9v6M9 12h6" stroke="currentColor" strokeWidth="1"/>
  </svg>
);

const tools: ToolItem[] = [
  {
    id: 'markdown-printer',
    name: '마크다운 프린터',
    description: '마크다운 문서를 인쇄용 PDF로 변환하는 도구입니다.',
    url: 'https://md2-rh.vercel.app/',
    icon: <MarkdownIcon />
  },
  {
    id: 'date-calculator',
    name: '표준화 날짜계산기',
    description: '표준화 일정과 기간을 계산하는 도구입니다.',
    url: 'https://cont-dead.vercel.app/',
    icon: <DateCalculatorIcon />
  },
  {
    id: 'world-clock',
    name: '세계 시간',
    description: '전세계 시간대를 확인할 수 있는 도구입니다.',
    url: 'https://world-clock-kohl.vercel.app/',
    icon: <WorldClockIcon />
  },
  {
    id: 'pdf-merger',
    name: 'PDF 병합기',
    description: '여러 PDF 파일을 하나로 병합하는 도구입니다.',
    url: 'https://merge2-pdf.vercel.app/',
    icon: <PdfMergerIcon />
  },
  {
    id: 'metaverse-meeting',
    name: '메타버스회의실',
    description: '가상 공간에서 회의를 진행할 수 있는 메타버스 플랫폼입니다.',
    url: 'https://cuberse.is-an.ai/',
    icon: <MetaverseMeetingIcon />
  },
  {
    id: 'gltf-viewer',
    name: 'glTF Model Viewer',
    description: '3D 모델 파일(glTF)을 웹에서 미리보기할 수 있는 뷰어입니다.',
    url: 'https://gltf-viewer-seven.vercel.app/',
    icon: <GltfViewerIcon />
  }
];

const ToolCard = ({ tool }: { tool: ToolItem }) => {
  const handleClick = () => {
    window.open(tool.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-border/50"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {tool.icon}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{tool.name}</h3>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {tool.description}
        </p>
      </CardContent>
    </Card>
  );
};

export function StandardTools() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold font-serif text-primary">표준화도구 모음</h1>
        <p className="text-muted-foreground">
          표준화 작업에 도움이 되는 다양한 도구들을 모았습니다. 각 도구를 클릭하면 새 탭에서 열립니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>

      <div className="text-center pt-6">
        <p className="text-xs text-muted-foreground">
          💡 모든 도구는 새 탭에서 열리므로 현재 페이지를 벗어나지 않고 사용할 수 있습니다.
        </p>
      </div>
    </div>
  );
}