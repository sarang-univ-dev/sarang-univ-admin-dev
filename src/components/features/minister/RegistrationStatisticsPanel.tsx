"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RegistrationTrendChart } from "./charts";
import {
  calculateDailyStats,
  calculateWeeklyStats,
  getUniqueDepartments,
  type RegistrationForStats,
} from "@/lib/utils/registration-stats";

type TimeRange = "daily" | "weekly";

interface RegistrationStatisticsPanelProps {
  registrations: RegistrationForStats[];
  /** 부서 필터 표시 여부 (행정 총괄 교역자용) */
  showDepartmentFilter?: boolean;
  /** 패널 제목 */
  title?: string;
}

/**
 * 신청 현황 통계 패널
 *
 * Features:
 * - 일별/주별 탭 전환
 * - 누적 보기 토글
 * - 부서 필터 (행정 총괄 교역자용)
 * - 리더/조원/합계 라인 차트
 */
export function RegistrationStatisticsPanel({
  registrations,
  showDepartmentFilter = false,
  title = "신청 현황 통계",
}: RegistrationStatisticsPanelProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("daily");
  const [showCumulative, setShowCumulative] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  // 부서 목록 추출
  const departments = useMemo(
    () => getUniqueDepartments(registrations),
    [registrations]
  );

  // 선택된 부서 필터 값
  const departmentFilter = useMemo(() => {
    if (selectedDepartment === "all") return "all";
    return parseInt(selectedDepartment, 10);
  }, [selectedDepartment]);

  // 통계 데이터 계산
  const stats = useMemo(() => {
    if (timeRange === "daily") {
      return calculateDailyStats(registrations, departmentFilter);
    }
    return calculateWeeklyStats(registrations, departmentFilter);
  }, [registrations, timeRange, departmentFilter]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Time Range Tabs */}
          <Tabs
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as TimeRange)}
          >
            <TabsList>
              <TabsTrigger value="daily">일별</TabsTrigger>
              <TabsTrigger value="weekly">주별</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Cumulative Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="cumulative-toggle"
              checked={showCumulative}
              onCheckedChange={setShowCumulative}
            />
            <Label htmlFor="cumulative-toggle" className="text-sm">
              누적 보기
            </Label>
          </div>

          {/* Department Filter (only for admin minister) */}
          {showDepartmentFilter && departments.length > 0 && (
            <div className="sm:ml-auto">
              <Select
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="부서 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 부서</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept.toString()}>
                      {dept}부
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Chart */}
        <RegistrationTrendChart data={stats} showCumulative={showCumulative} />

        {/* Summary */}
        {stats.length > 0 && (
          <div className="text-sm text-muted-foreground text-center">
            {showCumulative ? (
              <>
                총 {stats[stats.length - 1].cumulativeTotal}명 (리더{" "}
                {stats[stats.length - 1].cumulativeLeaders}명, 조원{" "}
                {stats[stats.length - 1].cumulativeMembers}명)
              </>
            ) : (
              <>
                {timeRange === "daily" ? "기간" : "기간"}: {stats[0].label} ~{" "}
                {stats[stats.length - 1].label}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
