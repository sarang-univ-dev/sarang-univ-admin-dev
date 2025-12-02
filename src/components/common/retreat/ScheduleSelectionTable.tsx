"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Sunrise, Sun, Sunset, Bed } from "lucide-react";
import { TRetreatRegistrationSchedule } from "@/types";
import { formatSimpleDate } from "@/utils/formatDate";
import { getRetreatDatesForDisplay } from "@/components/features/schedule-change-request/utils";

// 이벤트 타입을 한글로 매핑
const EVENT_TYPE_MAP: Record<string, string> = {
  BREAKFAST: "아침",
  LUNCH: "점심",
  DINNER: "저녁",
  SLEEP: "숙박",
};

// 이벤트 타입별 아이콘 매핑
const EVENT_ICON_MAP: Record<string, React.ReactNode> = {
  BREAKFAST: <Sunrise className="mr-2" />,
  LUNCH: <Sun className="mr-2" />,
  DINNER: <Sunset className="mr-2" />,
  SLEEP: <Bed className="mr-2" />,
};

interface ScheduleSelectionTableProps {
  schedules: TRetreatRegistrationSchedule[];
  selectedScheduleIds: number[];
  onScheduleChange: (scheduleId: number) => void;
  disabled?: boolean;
}

/**
 * 일정 선택 테이블 컴포넌트
 *
 * @description
 * - 날짜별 × 일정 타입별 체크박스 렌더링
 * - 제어 컴포넌트 패턴 (부모가 상태 관리)
 * - 아이콘으로 시각적 구분 (아침/점심/저녁/숙박)
 *
 * @example
 * ```tsx
 * <ScheduleSelectionTable
 *   schedules={schedules}
 *   selectedScheduleIds={[1, 2, 3]}
 *   onScheduleChange={(id) => handleScheduleToggle(id)}
 *   disabled={false}
 * />
 * ```
 */
export function ScheduleSelectionTable({
  schedules,
  selectedScheduleIds,
  onScheduleChange,
  disabled = false,
}: ScheduleSelectionTableProps) {
  // 표시 목적으로 일정에서 고유한 날짜 추출
  const retreatDatesForDisplay = getRetreatDatesForDisplay(schedules);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center whitespace-nowrap sm:px-2 px-1">
              일정 선택
            </TableHead>
            {retreatDatesForDisplay.map((date: string) => (
              <TableHead
                key={date}
                className="text-center whitespace-nowrap sm:px-2 px-1"
              >
                {formatSimpleDate(date)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {["BREAKFAST", "LUNCH", "DINNER", "SLEEP"].map((eventType) => (
            <TableRow key={eventType}>
              <TableCell className="flex items-center justify-start whitespace-nowrap sm:px-2 px-1">
                {EVENT_ICON_MAP[eventType]}
                {EVENT_TYPE_MAP[eventType]}
              </TableCell>
              {retreatDatesForDisplay.map((date: string) => {
                const event = schedules.find(
                  (s) =>
                    new Date(s.time).toLocaleDateString("ko-KR") ===
                      new Date(date).toLocaleDateString("ko-KR") &&
                    s.type === eventType
                );
                return (
                  <TableCell
                    key={`${date}-${eventType}`}
                    className="text-center p-2 sm:px-3 sm:py-2 whitespace-nowrap"
                  >
                    {event ? (
                      <Checkbox
                        className="schedule-checkbox m-2"
                        checked={selectedScheduleIds.includes(event.id)}
                        onCheckedChange={() => onScheduleChange(event.id)}
                        disabled={disabled}
                      />
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
