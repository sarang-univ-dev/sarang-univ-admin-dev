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
import { formatSimpleDate } from "@/utils/formatDate";
import type { TRetreatRegistrationSchedule } from "@/types";
import { Sunrise, Sun, Sunset, Bed } from "lucide-react";

// 이벤트 타입을 한글로 매핑
const EVENT_TYPE_MAP: Record<string, string> = {
  BREAKFAST: "아침",
  LUNCH: "점심",
  DINNER: "저녁",
  SLEEP: "숙박",
};

// 이벤트 타입별 아이콘 매핑
const EVENT_ICON_MAP = {
  BREAKFAST: Sunrise,
  LUNCH: Sun,
  DINNER: Sunset,
  SLEEP: Bed,
};

interface RetreatScheduleTableProps {
  schedules: TRetreatRegistrationSchedule[];
  selectedScheduleIds?: number[];
  onScheduleChange?: (id: number) => void;
  readonly?: boolean;
  showSelectAll?: boolean;
}

/**
 * 수양회 신청 일정 표시 테이블 (재사용 가능 공통 컴포넌트)
 *
 * @description
 * - sarang-univ-retreat-web와 sarang-univ-admin에서 공통 사용
 * - 날짜별 x 시간대별 그리드 레이아웃
 * - 읽기 전용/편집 가능 모드 지원
 *
 * @example
 * // 읽기 전용 (DetailSidebar)
 * <RetreatScheduleTable
 *   schedules={schedules}
 *   selectedScheduleIds={[1, 2, 3]}
 *   readonly
 * />
 *
 * // 편집 가능 (등록 폼)
 * <RetreatScheduleTable
 *   schedules={schedules}
 *   selectedScheduleIds={selectedIds}
 *   onScheduleChange={handleScheduleChange}
 *   readonly={false}
 *   showSelectAll
 * />
 */
export function RetreatScheduleTable({
  schedules,
  selectedScheduleIds = [],
  onScheduleChange,
  readonly = true,
  showSelectAll = false,
}: RetreatScheduleTableProps) {
  // 날짜 목록 추출 (고유 날짜만, 정렬)
  const retreatDates = Array.from(
    new Set(
      schedules.map((s) => new Date(s.time).toISOString().split("T")[0])
    )
  ).sort();

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center whitespace-nowrap px-2 sm:px-4">
              일정
            </TableHead>
            {retreatDates.map((date: string) => (
              <TableHead
                key={date}
                className="text-center whitespace-nowrap px-2 sm:px-4"
              >
                {formatSimpleDate(date)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {["BREAKFAST", "LUNCH", "DINNER", "SLEEP"].map((eventType) => {
            const Icon = EVENT_ICON_MAP[eventType as keyof typeof EVENT_ICON_MAP];
            return (
              <TableRow key={eventType}>
                <TableCell className="flex items-center justify-center whitespace-nowrap px-2 sm:px-4">
                  <Icon className="mr-2 h-4 w-4" />
                  {EVENT_TYPE_MAP[eventType]}
                </TableCell>
                {retreatDates.map((date: string) => {
                  const event = schedules.find(
                    (s) =>
                      new Date(s.time).toLocaleDateString("ko-KR") ===
                        new Date(date).toLocaleDateString("ko-KR") &&
                      s.type === eventType
                  );
                  return (
                    <TableCell
                      key={`${date}-${eventType}`}
                      className="text-center px-2 sm:px-4 py-2"
                    >
                      {event ? (
                        <div className="flex justify-center">
                          <Checkbox
                            checked={selectedScheduleIds.includes(event.id)}
                            onCheckedChange={() => {
                              if (!readonly && onScheduleChange) {
                                onScheduleChange(event.id);
                              }
                            }}
                            disabled={readonly}
                            className="cursor-default"
                          />
                        </div>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
