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

export interface StandardSearchContextReport {
  title: string;
  summary: string | null;
  category: string | null;
  organization: string | null;
  tags: string[];
}

export interface StandardSearchContextConference {
  title: string;
  organization: string | null;
  description: string | null;
}

export interface StandardSearchContext {
  reports: StandardSearchContextReport[];
  conferences: StandardSearchContextConference[];
}

export interface StandardSearchJob {
  searchId: string;
  query: string;
  contextData: StandardSearchContext;
  createdAt: number;
}

export interface SearchCache {
  searchId: string;
  query: string;
  status: 'pending' | 'completed' | 'failed';
  results?: StandardResult[];
  error?: string;
  createdAt: number;
  completedAt?: number;
}

export const SEARCH_CACHE_TTL = 3600; // 1시간 TTL
export const SEARCH_TIMEOUT = 300000; // 5분 타임아웃
