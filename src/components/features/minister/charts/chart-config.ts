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
