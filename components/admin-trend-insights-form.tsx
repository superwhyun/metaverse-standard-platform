'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// we use a dynamic loader for pdfjs to avoid global variable issues in Node.js/Edge during build
let pdfjsLib: any = null;

async function loadPdfJs() {
    if (pdfjsLib) return pdfjsLib;
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    return pdfjsLib;
}

interface AdminTrendInsightsFormProps {
    onCancel: () => void;
    onSuccess: () => void;
}

export function AdminTrendInsightsForm({ onCancel, onSuccess }: AdminTrendInsightsFormProps) {
    const { session } = useAuth();
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [thumbnail, setThumbnail] = useState<Blob | null>(null);
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const generateThumbnail = async (pdfFile: File) => {
        try {
            const pdfjs = await loadPdfJs();
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
            const page = await pdf.getPage(1);

            const viewport = page.getViewport({ scale: 0.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            if (!context) return;

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport, canvas: canvas }).promise;

            canvas.toBlob((blob) => {
                if (blob) {
                    setThumbnail(blob);
                    setThumbnailUrl(URL.createObjectURL(blob));
                }
            }, 'image/jpeg', 0.8);
        } catch (error) {
            console.error('Error generating thumbnail:', error);
            toast.error('PDF 썸네일 생성 중 오류가 발생했습니다.');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            if (title === '') {
                setTitle(selectedFile.name.replace(/\.pdf$/i, ''));
            }
            generateThumbnail(selectedFile);
        } else if (selectedFile) {
            toast.error('PDF 파일만 업로드 가능합니다.');
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile && droppedFile.type === 'application/pdf') {
            setFile(droppedFile);
            if (title === '') {
                setTitle(droppedFile.name.replace(/\.pdf$/i, ''));
            }
            generateThumbnail(droppedFile);
        } else if (droppedFile) {
            toast.error('PDF 파일만 업로드 가능합니다.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title) return;

        setIsUploading(true);
        try {
            // 1. Upload PDF to R2
            const pdfFormData = new FormData();
            pdfFormData.append('file', file);
            pdfFormData.append('type', 'pdf');

            const pdfUploadRes = await fetch('/api/trend-insights/upload', {
                method: 'POST',
                body: pdfFormData,
                headers: {
                    'Authorization': `Bearer ${session?.user?.id}` // We need a real token here if using Bearer, but getSessionFromRequest handles cookies too.
                }
            });

            const pdfData = await pdfUploadRes.json();
            if (!pdfData.success) throw new Error(pdfData.error);

            // 2. Upload Thumbnail to R2 (if exists)
            let thumbUrl = '';
            if (thumbnail) {
                const thumbFormData = new FormData();
                thumbFormData.append('file', new File([thumbnail], 'thumb.jpg', { type: 'image/jpeg' }));
                thumbFormData.append('type', 'thumbnail');

                const thumbUploadRes = await fetch('/api/trend-insights/upload', {
                    method: 'POST',
                    body: thumbFormData
                });

                const thumbData = await thumbUploadRes.json();
                if (thumbData.success) thumbUrl = thumbData.url;
            }

            // 3. Save metadata to D1
            const metaRes = await fetch('/api/trend-insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    summary,
                    pdf_url: pdfData.url,
                    thumbnail_url: thumbUrl
                })
            });

            const metaData = await metaRes.json();
            if (!metaData.success) throw new Error(metaData.error);

            toast.success('동향 보고서가 성공적으로 업로드되었습니다.');
            onSuccess();
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(`업로드 실패: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>새 트렌드 인사이트 업로드</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">제목</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="자료 제목을 입력하세요"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="summary">내용 요약</Label>
                        <Textarea
                            id="summary"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="주요 내용을 간단히 요약해주세요"
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>PDF 파일 (Drag & Drop)</Label>
                        {!file ? (
                            <div
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                className={cn(
                                    "border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer bg-muted/5",
                                    isDragging ? "border-primary bg-primary/5 scale-[0.99]" : "border-muted-foreground/25 hover:border-primary/50"
                                )}
                                onClick={() => document.getElementById('pdf-upload')?.click()}
                            >
                                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-lg font-medium">PDF 파일을 끌어넣거나 클릭해서 선택하세요</p>
                                <p className="text-sm text-muted-foreground mt-1">발표자료, 기술 보고서 (PDF 전용)</p>
                                <input
                                    type="file"
                                    id="pdf-upload"
                                    className="hidden"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                />
                            </div>
                        ) : (
                            <div className="relative border rounded-lg p-4 flex items-center gap-4 bg-muted/10 border-primary/20">
                                <div className="w-24 h-32 bg-muted rounded overflow-hidden border">
                                    {thumbnailUrl ? (
                                        <img src={thumbnailUrl} alt="PDF Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <FileText className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="font-medium truncate">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                    <div className="mt-2 flex items-center text-primary text-xs gap-1">
                                        <CheckCircle2 className="h-3 w-3" />
                                        업로드 준비됨
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => { setFile(null); setThumbnailUrl(null); }}
                                    className="absolute top-2 right-2"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isUploading}>
                            취소
                        </Button>
                        <Button type="submit" disabled={!file || !title || isUploading} className="min-w-[100px]">
                            {isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    업로드 중...
                                </>
                            ) : (
                                '업로드 하기'
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
