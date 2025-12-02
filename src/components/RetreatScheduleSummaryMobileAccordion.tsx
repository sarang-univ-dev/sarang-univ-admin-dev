"use client";

import { useMemo } from "react";
import { DayGroup, FormattedRow } from "@/types/retreat-schedule";
import { DepartmentHeader } from "@/components/common/retreat/DepartmentHeader";
import { ScheduleTable } from "@/components/common/retreat/ScheduleTable";
import {
  EVENT_TYPE_MAP,
  createDateScheduleMap,
  extractSortedDates,
  formatDate,
} from "@/lib/utils/schedule-utils";

interface RetreatScheduleSummaryMobileAccordionProps {
  formattedRows: FormattedRow[];
  dayGroups: DayGroup[];
}

/**
 * 모바일용 수양회 스케줄 요약 (부서별 아코디언)
 *
 * @description
 * - 부서별로 전참/부분참/전체 인원 표시
 * - 날짜별 × 이벤트별(아침/점심/저녁/숙박) 테이블
 * - 작은 컴포넌트로 분리하여 유지보수성 향상
 */
export function RetreatScheduleSummaryMobileAccordion({
  formattedRows,
  dayGroups,
}: RetreatScheduleSummaryMobileAccordionProps) {
  // 날짜별로 스케줄 정리 (메모이제이션)
  const dateScheduleMap = useMemo(
    () => createDateScheduleMap(dayGroups),
    [dayGroups]
  );

  // 모든 날짜 추출 (정렬)
  const allDates = useMemo(
    () => extractSortedDates(dateScheduleMap),
    [dateScheduleMap]
  );

  return (
    <div className="space-y-3">
      {formattedRows.map((row) => {
        const fullCount = row.fullParticipationCount ?? 0;
        const partialCount = row.partialParticipationCount ?? 0;
        const totalCount = row.totalCount ?? 0;
        const isTotal = row.id === "total";

        return (
          <div key={row.id}>
            {/* 부서명 + 통계 칩 */}
            <DepartmentHeader
              label={row.label}
              isTotal={isTotal}
              totalCount={totalCount}
              fullCount={fullCount}
              partialCount={partialCount}
            />

            {/* 스케줄 테이블 */}
            <ScheduleTable
              dates={allDates}
              eventTypeMap={EVENT_TYPE_MAP}
              row={row}
              dateScheduleMap={dateScheduleMap}
              formatDate={formatDate}
            />
          </div>
        );
      })}
    </div>
  );
}
