/**
 * Help System Types
 *
 * @description
 * In-App 문서화 시스템을 위한 타입 정의
 */

/**
 * 컴포넌트 레지스트리에 등록된 컴포넌트 이름
 */
export type HelpComponentName =
  | "StatusBadge"
  | "TypeBadge"
  | "GenderBadge"
  | "ShuttleBusStatusBadge"
  | "Button";

/**
 * 도움말에 표시될 컴포넌트 예시
 *
 * @description
 * 문서화 내에서 실제 컴포넌트를 렌더링하여 시각적 예시 제공
 *
 * @example
 * ```ts
 * {
 *   component: "StatusBadge",
 *   props: { status: "PAID" },
 *   label: "입금 완료 상태"
 * }
 * ```
 */
export interface ComponentExample {
  /** 레지스트리에 등록된 컴포넌트 이름 */
  component: HelpComponentName;
  /** 컴포넌트에 전달될 props */
  props: Record<string, unknown>;
  /** 예시에 대한 설명 라벨 (선택) */
  label?: string;
}

/**
 * 헬프 패널의 섹션
 */
export interface HelpSection {
  id: string;
  title: string;
  description: string;
  items?: {
    label: string;
    description: string;
    /** 해당 항목의 시각적 예시 (선택) */
    examples?: ComponentExample[];
  }[];
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
  /** 해당 뱃지의 시각적 예시 (선택) */
  preview?: ComponentExample;
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
