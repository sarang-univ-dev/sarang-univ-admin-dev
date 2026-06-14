import type { ChartConfig } from "@/components/ui/chart";

/**
 * 신청 현황 통계 차트 설정
 */
export const registrationChartConfig: ChartConfig = {
  leaders: {
    label: "리더",
    color: "hsl(var(--chart-1))",
  },
  members: {
    label: "조원",
    color: "hsl(var(--chart-2))",
  },
  total: {
    label: "합계",
    color: "hsl(var(--chart-3))",
  },
};

/**
 * 누적 통계 차트 설정
 */
export const cumulativeChartConfig: ChartConfig = {
  cumulativeLeaders: {
    label: "리더 (누적)",
    color: "hsl(var(--chart-1))",
  },
  cumulativeMembers: {
    label: "조원 (누적)",
    color: "hsl(var(--chart-2))",
  },
  cumulativeTotal: {
    label: "합계 (누적)",
    color: "hsl(var(--chart-3))",
  },
};

/**
 * 전체참여(전참) / 부분참여 색상 (학년별 신청 현황)
 * 같은 페이지 상단 통계 차트(RegistrationTrendChart)와 동일하게 테마 토큰 사용.
 */
export const FULL_COLOR = "hsl(var(--chart-1))";
export const PARTIAL_COLOR = "hsl(var(--chart-2))";

/** 학년별 누적 막대그래프 차트 설정 (전체참여 / 부분참여) */
export const attendanceChartConfig: ChartConfig = {
  full: { label: "전체참여", color: FULL_COLOR },
  partial: { label: "부분참여", color: PARTIAL_COLOR },
};

/**
 * 성별 색상 (남 / 여) — 막대 분류 전환용
 */
export const MALE_COLOR = "hsl(var(--chart-1))";
export const FEMALE_COLOR = "hsl(var(--chart-4))";

/** 학년별 누적 막대그래프 차트 설정 (남 / 여) */
export const genderChartConfig: ChartConfig = {
  male: { label: "남", color: MALE_COLOR },
  female: { label: "여", color: FEMALE_COLOR },
};

/** 학년별 파이 차트 팔레트 — 테마 차트 토큰(--chart-1~5) 순환 */
export const GRADE_PALETTE = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

/**
 * 파이 조각 인덱스별 라벨 텍스트 색 — 어두운 토큰(chart-2/3) 위엔 흰색, 밝은 토큰 위엔 진회색.
 * (globals.css: chart-1 61% / chart-2 39% / chart-3 24% / chart-4 66% / chart-5 67% lightness)
 */
export function gradeSliceLabelColor(index: number): string {
  const mod = index % GRADE_PALETTE.length;
  return mod === 1 || mod === 2 ? "#ffffff" : "#1f2937";
}
