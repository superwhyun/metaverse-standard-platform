'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TrendInsight {
    id: number;
    title: string;
    summary: string;
    pdf_url: string;
    thumbnail_url: string;
    created_at: string;
}

export function TrendInsightsList() {
    const [insights, setInsights] = useState<TrendInsight[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const limit = 6;

    const fetchInsights = async () => {
        setIsLoading(true);
        try {
            const offset = (page - 1) * limit;
            const res = await fetch(`/api/trend-insights?limit=${limit}&offset=${offset}`);
            const data = await res.json();
            if (data.success) {
                setInsights(data.data);
                setTotal(data.total);
            }
        } catch (error) {
            console.error('Failed to fetch trend insights:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInsights();
    }, [page]);

    const totalPages = Math.ceil(total / limit);

    if (isLoading && insights.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight">트랜드 인사이트</h2>
                <p className="text-muted-foreground">메타버스 표준화 최신 트렌드와 기술 보고서를 확인하세요.</p>
            </div>

            {insights.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed rounded-xl bg-muted/5">
                    <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-xl font-medium text-muted-foreground">등록된 인사이트 자료가 없습니다.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {insights.map((insight) => (
                            <Card key={insight.id} className="group overflow-hidden border-border/50 bg-background/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
                                <div className="aspect-[3/4] relative overflow-hidden bg-muted">
                                    {insight.thumbnail_url ? (
                                        <img
                                            src={insight.thumbnail_url}
                                            alt={insight.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <FileText className="h-16 w-16 text-muted-foreground/30" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                                    <Button
                                        className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 shadow-lg"
                                        onClick={() => window.open(insight.pdf_url, '_blank')}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        내려받기
                                    </Button>
                                </div>
                                <CardHeader className="p-5 pb-2">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                        <Calendar className="h-3.3 w-3.3" />
                                        <span>{format(new Date(insight.created_at), 'yyyy년 MM월 dd일', { locale: ko })}</span>
                                    </div>
                                    <CardTitle className="text-xl font-bold line-clamp-2 min-h-[3.5rem] group-hover:text-primary transition-colors">
                                        {insight.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-5 pb-5">
                                    <p className="text-sm text-muted-foreground line-clamp-3 min-h-[4.5rem]">
                                        {insight.summary || '내용 요약이 없습니다.'}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                이전
                            </Button>
                            <span className="text-sm font-medium">
                                {page} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                다음
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
