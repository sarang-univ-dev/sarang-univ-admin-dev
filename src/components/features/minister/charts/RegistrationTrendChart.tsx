"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import type { RegistrationStats } from "@/lib/utils/registration-stats";
import {
  registrationChartConfig,
  cumulativeChartConfig,
} from "./chart-config";

interface RegistrationTrendChartProps {
  data: RegistrationStats[];
  showCumulative: boolean;
  title?: string;
}

/**
 * 신청 현황 트렌드 라인 차트
 *
 * Features:
 * - 3개 라인: 리더, 조원, 합계
 * - 일반/누적 모드 전환
 * - 반응형 높이
 * - 툴팁 및 범례 포함
 */
export function RegistrationTrendChart({
  data,
  showCumulative,
}: RegistrationTrendChartProps) {
  const chartConfig = showCumulative
    ? cumulativeChartConfig
    : registrationChartConfig;

  const dataKeys = showCumulative
    ? {
        leaders: "cumulativeLeaders",
        members: "cumulativeMembers",
        total: "cumulativeTotal",
      }
    : {
        leaders: "leaders",
        members: "members",
        total: "total",
      };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] md:h-[300px] text-muted-foreground">
        표시할 데이터가 없습니다.
      </div>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="h-[200px] md:h-[300px] w-full"
    >
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 10,
          left: 10,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
          width={40}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value) => `${value}`}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey={dataKeys.leaders}
          name="leaders"
          stroke="var(--color-leaders)"
          strokeWidth={2}
          dot={{ fill: "var(--color-leaders)", strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey={dataKeys.members}
          name="members"
          stroke="var(--color-members)"
          strokeWidth={2}
          dot={{ fill: "var(--color-members)", strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey={dataKeys.total}
          name="total"
          stroke="var(--color-total)"
          strokeWidth={2}
          dot={{ fill: "var(--color-total)", strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
