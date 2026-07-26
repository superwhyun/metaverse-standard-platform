import mammoth from 'mammoth'

// pdf.js is loaded from a CDN <script> tag at runtime (see admin-trend-insights-form.tsx
// for the same pattern) rather than the npm package, to avoid edge-bundling issues.
// These interfaces describe only the subset of the pdf.js API actually used here.
interface PdfTextItem {
  str: string
}

interface PdfPage {
  getTextContent(): Promise<{ items: PdfTextItem[] }>
}

interface PdfDocument {
  numPages: number
  getPage(pageNumber: number): Promise<PdfPage>
}

interface PdfJsLib {
  getDocument(source: { data: ArrayBuffer }): { promise: Promise<PdfDocument> }
  GlobalWorkerOptions: { workerSrc: string }
}

let pdfjsLib: PdfJsLib | null = null

async function loadPdfJs(): Promise<PdfJsLib> {
  if (pdfjsLib) return pdfjsLib

  const win = window as unknown as { pdfjsLib?: PdfJsLib }
  if (typeof window !== 'undefined' && win.pdfjsLib) {
    pdfjsLib = win.pdfjsLib
    return pdfjsLib
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    script.onload = () => {
      const pdfjs = (window as unknown as { pdfjsLib: PdfJsLib }).pdfjsLib
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
    const pageText = textContent.items.map((item) => item.str).join(' ')
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
