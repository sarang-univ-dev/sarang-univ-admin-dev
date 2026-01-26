/**
 * Help System Types
 *
 * @description
 * In-App 문서화 시스템을 위한 타입 정의
 */

/**
 * 헬프 패널의 섹션
 */
export interface HelpSection {
  id: string;
  title: string;
  description: string;
  items?: { label: string; description: string }[];
}

/**
 * 컬럼 헤더 도움말 콘텐츠
 */
export interface ColumnHelpContent {
  columnId: string;
  title: string;
  description: string;
  examples?: string[];
  tips?: string[];
}

/**
 * 상태 뱃지 도움말 콘텐츠
 */
export interface BadgeHelpContent {
  status: string;
  title: string;
  description: string;
  action?: string;
}

/**
 * 페이지 전체 헬프 콘텐츠
 */
export interface PageHelpContent {
  pageId: string;
  title: string;
  description: string;
  sections: HelpSection[];
  columns: ColumnHelpContent[];
  badges: Record<string, BadgeHelpContent[]>;
  faqs?: { question: string; answer: string }[];
}
