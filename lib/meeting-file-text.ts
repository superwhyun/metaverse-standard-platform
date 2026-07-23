import mammoth from 'mammoth'

// admin-trend-insights-form.tsx와 동일한 CDN 스크립트 로딩 패턴 재사용 (번들링 이슈 회피, 이미 검증된 방식)
let pdfjsLib: any = null

async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib

  if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
    pdfjsLib = (window as any).pdfjsLib
    return pdfjsLib
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    script.onload = () => {
      const pdfjs = (window as any).pdfjsLib
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      pdfjsLib = pdfjs
      resolve(pdfjs)
    }
    script.onerror = () => reject(new Error('Failed to load pdf.js from CDN'))
    document.head.appendChild(script)
  })
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await loadPdfJs()
  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
  const pdf = await loadingTask.promise

  const pageTexts: string[] = []
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()
    const pageText = textContent.items.map((item: any) => item.str).join(' ')
    pageTexts.push(pageText)
  }

  return pageTexts.join('\n\n')
}

async function extractDocxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

export function isSupportedMeetingFile(fileName: string): boolean {
  const name = fileName.toLowerCase()
  return name.endsWith('.vtt') || name.endsWith('.pdf') || name.endsWith('.docx')
}

export async function extractMeetingText(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf')) return extractPdfText(file)
  if (name.endsWith('.docx')) return extractDocxText(file)
  return file.text()
}
