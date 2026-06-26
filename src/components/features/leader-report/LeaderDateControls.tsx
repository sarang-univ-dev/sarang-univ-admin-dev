"use client";

import { CalendarDays } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLeaderToday } from "@/hooks/leader-report/use-leader-today";
import { useConfirm } from "@/hooks/use-confirm";
import { ILeaderTodayInfo } from "@/types/leader-report";

interface LeaderDateControlsProps {
  retreatSlug: string;
  selectedDate: string | null;
  onSelectedDateChange: (date: string) => void;
  initialToday: ILeaderTodayInfo;
  showTodayControl?: boolean;
}

export function LeaderDateControls({
  retreatSlug,
  selectedDate,
  onSelectedDateChange,
  initialToday,
  showTodayControl = true,
}: LeaderDateControlsProps) {
  const confirmDialog = useConfirm();
  const todayOptions = useMemo(
    () => ({
      fallbackData: initialToday,
    }),
    [initialToday]
  );
  const {
    today,
    days,
    isUpdating,
    updateToday,
    leaderReportOpen,
    setLeaderReportOpen,
  } = useLeaderToday(retreatSlug, todayOptions);

  const handleSelectToday = async (day: string) => {
    if (day === today || isUpdating) return;

    const confirmed = await confirmDialog.open({
      title: "오늘 일자 변경",
      description: `${day}을 리더 포털의 오늘 일자로 설정할까요? 리더들이 출석을 입력하는 기준일이 변경됩니다.`,
      confirmText: "변경",
      cancelText: "취소",
      onConfirm: () => updateToday(day),
    });

    if (confirmed && selectedDate === today) {
      onSelectedDateChange(day);
    }
  };

  if (days.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">일자 기준</CardTitle>
        </div>
        <CardDescription>
          {showTodayControl
            ? "리더 포털의 오늘 일자와 조회 테이블의 기준일자를 따로 관리합니다."
            : "테이블 조회 기준일자를 선택합니다."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showTodayControl ? (
          <>
            <div className="space-y-2">
              <div className="text-sm font-medium">오늘 일자 선택</div>
              <div className="flex flex-wrap gap-2">
                {days.map(day => (
                  <Button
                    key={day}
                    type="button"
                    size="sm"
                    variant={day === today ? "default" : "outline"}
                    disabled={isUpdating}
                    onClick={() => handleSelectToday(day)}
                    className="whitespace-nowrap"
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="text-sm font-medium">리더보고서 작성 열기</div>
                <div className="text-xs text-muted-foreground">
                  {leaderReportOpen
                    ? "리더가 작성할 수 있습니다."
                    : "닫힘 — 리더가 접근할 수 없습니다."}
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant={leaderReportOpen ? "default" : "outline"}
                onClick={() => void setLeaderReportOpen(!leaderReportOpen)}
              >
                {leaderReportOpen ? "열림" : "닫힘"}
              </Button>
            </div>
          </>
        ) : null}

        <div className="space-y-2">
          <div className="text-sm font-medium">조회 기준일자</div>
          <div className="flex flex-wrap gap-2">
            {days.map(day => (
              <Button
                key={day}
                type="button"
                size="sm"
                variant={day === selectedDate ? "secondary" : "outline"}
                onClick={() => onSelectedDateChange(day)}
                className="whitespace-nowrap"
              >
                {day}
                {day === today ? (
                  <span className="ml-1 text-xs text-muted-foreground">
                    오늘
                  </span>
                ) : null}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
