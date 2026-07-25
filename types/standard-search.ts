// 표준 검색 관련 타입 정의

export interface StandardResult {
  id: string;
  title: string;
  organization: string;
  description: string;
  relevanceScore: number;
  tags: string[];
  status: string;
  publishedDate: string;
}

