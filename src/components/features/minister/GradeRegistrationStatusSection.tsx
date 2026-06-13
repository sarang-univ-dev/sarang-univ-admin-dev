"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  PieChart,
  Pie,
  Cell,
  Label,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserRetreatRegistrationPaymentStatus } from "@/types";
import type { IUnivGroupAdminStaffRetreat } from "@/types/univ-group-admin-staff";
import {
  attendanceChartConfig,
  FULL_COLOR,
  PARTIAL_COLOR,
  GRADE_PALETTE,
  gradeSliceLabelColor,
} from "./charts/chart-config";

const RADIAN = Math.PI / 180;

interface GradeRegistrationStatusSectionProps {
  registrations: IUnivGroupAdminStaffRetreat[];
  /** 수양회 전체 일정(스케줄). 길이로 전체참여 기준 산정 */
  schedules: unknown[];
}

const pct = (value: number, total: number) =>
  total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";

/**
 * 학년별 수양회 신청 현황 섹션 (부서 교역자 페이지)
 *
 * - 입금완료(PAID) 신청자만 집계
 * - 전체참여(전참): 선택 일정 수 == 수양회 전체 일정 수 / 그 외 = 부분참여
 * - figure 3개: 누적 막대(전체/부분참여) + 요약, 도넛(학년별 비중), 테이블
 */
export function GradeRegistrationStatusSection({
  registrations,
  schedules,
}: GradeRegistrationStatusSectionProps) {
  const totalSchedules = schedules.length;

  const { byGrade, byCount, summary } = useMemo(() => {
    const paid = registrations.filter(
      (r) => r.paymentStatus === UserRetreatRegistrationPaymentStatus.PAID
    );

    const map = new Map<
      number,
      { gradeNumber: number; count: number; full: number }
    >();
    for (const r of paid) {
      const cur = map.get(r.gradeNumber) ?? {
        gradeNumber: r.gradeNumber,
        count: 0,
        full: 0,
      };
      cur.count += 1;
      const selected = r.userRetreatRegistrationScheduleIds?.length ?? 0;
      if (totalSchedules > 0 && selected === totalSchedules) cur.full += 1;
      map.set(r.gradeNumber, cur);
    }

    const rows = Array.from(map.values()).map((x) => ({
      gradeNumber: x.gradeNumber,
      gradeLabel: `${x.gradeNumber}학년`,
      count: x.count,
      full: x.full,
      partial: x.count - x.full,
    }));

    const totalCount = rows.reduce((s, x) => s + x.count, 0);
    const totalFull = rows.reduce((s, x) => s + x.full, 0);
    const totalPartial = totalCount - totalFull;

    return {
      byGrade: [...rows].sort((a, b) => a.gradeNumber - b.gradeNumber),
      byCount: [...rows].sort((a, b) => b.count - a.count),
      summary: { totalCount, totalFull, totalPartial },
    };
  }, [registrations, totalSchedules]);

  if (summary.totalCount === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          학년별 수양회 신청 현황
        </h2>
        <div className="flex h-[160px] items-center justify-center rounded-md border text-sm text-muted-foreground">
          입금완료된 신청 데이터가 없습니다.
        </div>
      </section>
    );
  }

  // 파이 조각 라벨 (차트 안/주변에 직접 표시 — hover 아님)
  const renderSliceLabel = (props: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
    value: number;
    index: number;
    payload: { gradeLabel: string };
  }) => {
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      percent,
      value,
      index,
      payload,
    } = props;

    if (percent >= 0.04) {
      // 큰 조각: 조각 안쪽에 표시
      const r = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + r * Math.cos(-midAngle * RADIAN);
      const y = cy + r * Math.sin(-midAngle * RADIAN);
      return (
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={11}
          fill={gradeSliceLabelColor(index)}
        >
          <tspan x={x} dy="-0.5em" fontWeight={600}>
            {payload.gradeLabel}
          </tspan>
          <tspan x={x} dy="1.2em">
            {value}명 ({(percent * 100).toFixed(1)}%)
          </tspan>
        </text>
      );
    }

    // 작은 조각: 바깥쪽에 표시
    const ro = outerRadius + 16;
    const x = cx + ro * Math.cos(-midAngle * RADIAN);
    const y = cy + ro * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={11}
        fill="#374151"
      >
        {payload.gradeLabel} {value}명 ({(percent * 100).toFixed(1)}%)
      </text>
    );
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          학년별 수양회 신청 현황
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          입금완료 기준 · 전체참여 {summary.totalFull}명 / 부분참여{" "}
          {summary.totalPartial}명 (총 {summary.totalCount}명)
        </p>
      </div>

      {/* Figure 1: 누적 막대 + 전체 요약 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          학년별 전체참여 / 부분참여
        </h3>
        <div className="grid gap-4 md:gap-6 lg:grid-cols-[1fr_240px]">
          <ChartContainer
            config={attendanceChartConfig}
            className="h-[300px] w-full md:h-[340px]"
          >
            <BarChart
              data={byGrade}
              margin={{ top: 20, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="gradeLabel"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={11}
                interval={0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={11}
                width={32}
                allowDecimals={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="full" stackId="a" fill="var(--color-full)">
                <LabelList
                  dataKey="full"
                  position="center"
                  fontSize={10}
                  fill="#ffffff"
                  formatter={(v: number) => (v > 0 ? v : "")}
                />
              </Bar>
              <Bar
                dataKey="partial"
                stackId="a"
                fill="var(--color-partial)"
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  dataKey="partial"
                  position="center"
                  fontSize={10}
                  fill="#ffffff"
                  formatter={(v: number) => (v > 0 ? v : "")}
                />
                <LabelList
                  dataKey="count"
                  position="top"
                  fontSize={11}
                  className="fill-foreground"
                />
              </Bar>
            </BarChart>
          </ChartContainer>

          {/* 전체 요약 */}
          <div className="space-y-3 rounded-md border p-4">
            <div className="text-sm font-semibold tracking-tight">전체 요약</div>
            <SummaryStat
              label="전체 신청"
              value={`${summary.totalCount}명`}
              sub="(100%)"
            />
            <SummaryStat
              label="전체참여"
              value={`${summary.totalFull}명`}
              sub={`(${pct(summary.totalFull, summary.totalCount)}%)`}
              color={FULL_COLOR}
            />
            <SummaryStat
              label="부분참여"
              value={`${summary.totalPartial}명`}
              sub={`(${pct(summary.totalPartial, summary.totalCount)}%)`}
              color={PARTIAL_COLOR}
            />
            <div className="h-[110px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "전체참여", value: summary.totalFull },
                      { name: "부분참여", value: summary.totalPartial },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={30}
                    outerRadius={50}
                  >
                    <Cell fill={FULL_COLOR} />
                    <Cell fill={PARTIAL_COLOR} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Figure 2: 학년별 신청 인원 비중 (도넛, 라벨은 차트에 직접 표시) */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          학년별 신청 인원 비중
        </h3>
        <div className="h-[420px] w-full md:h-[520px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 16, right: 80, bottom: 16, left: 80 }}>
              <Pie
                data={byCount}
                dataKey="count"
                nameKey="gradeLabel"
                innerRadius="50%"
                outerRadius="78%"
                paddingAngle={1}
                labelLine={false}
                label={renderSliceLabel}
                isAnimationActive={false}
              >
                {byCount.map((row, i) => (
                  <Cell
                    key={row.gradeNumber}
                    fill={GRADE_PALETTE[i % GRADE_PALETTE.length]}
                  />
                ))}
                <Label
                  position="center"
                  content={(props: { viewBox?: unknown }) => {
                    const vb = props.viewBox as
                      | { cx?: number; cy?: number }
                      | undefined;
                    if (!vb?.cx || !vb?.cy) return null;
                    return (
                      <text
                        x={vb.cx}
                        y={vb.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan x={vb.cx} dy="-0.4em" fontSize="13" fill="#6b7280">
                          총 신청 인원
                        </tspan>
                        <tspan
                          x={vb.cx}
                          dy="1.5em"
                          fontSize="26"
                          fontWeight="700"
                          fill="#111827"
                        >
                          {summary.totalCount}명
                        </tspan>
                      </text>
                    );
                  }}
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Figure 3: 학년별 신청 인원 테이블 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          학년별 신청 인원
        </h3>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-gray-100 font-semibold text-gray-800 text-xs md:text-sm px-2 md:px-4">
                  학년
                </TableHead>
                <TableHead className="bg-gray-100 font-semibold text-gray-800 text-xs md:text-sm px-2 md:px-4 text-right">
                  신청 인원(명)
                </TableHead>
                <TableHead className="bg-gray-100 font-semibold text-gray-800 text-xs md:text-sm px-2 md:px-4 text-right">
                  비중(%)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byCount.map((row) => (
                <TableRow key={row.gradeNumber}>
                  <TableCell className="px-2 md:px-4 py-2 md:py-3">
                    <span className="inline-flex px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md bg-gray-100 text-gray-700 font-medium text-xs md:text-sm whitespace-nowrap">
                      {row.gradeLabel}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs md:text-sm px-2 md:px-4 py-2 md:py-3 text-right">
                    {row.count}
                  </TableCell>
                  <TableCell className="text-xs md:text-sm px-2 md:px-4 py-2 md:py-3 text-right">
                    {pct(row.count, summary.totalCount)}%
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2 font-semibold">
                <TableCell className="px-2 md:px-4 py-2 md:py-3">
                  <span className="inline-flex px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md bg-gray-200 text-gray-800 font-semibold text-xs md:text-sm whitespace-nowrap">
                    합계
                  </span>
                </TableCell>
                <TableCell className="text-xs md:text-sm px-2 md:px-4 py-2 md:py-3 text-right">
                  {summary.totalCount}
                </TableCell>
                <TableCell className="text-xs md:text-sm px-2 md:px-4 py-2 md:py-3 text-right">
                  100.0%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}

interface SummaryStatProps {
  label: string;
  value: string;
  sub: string;
  color?: string;
}

function SummaryStat({ label, value, sub, color }: SummaryStatProps) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className="text-2xl font-bold"
        style={color ? { color } : undefined}
      >
        {value}{" "}
        <span className="text-sm font-normal text-muted-foreground">{sub}</span>
      </div>
    </div>
  );
}
