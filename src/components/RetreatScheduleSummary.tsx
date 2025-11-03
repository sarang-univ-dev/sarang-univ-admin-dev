"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, ChevronDown, ChevronUp } from "lucide-react";
import html2canvas from "html2canvas";
import {
  generateScheduleStats,
  groupScheduleColumnsByDay,
} from "../utils/retreat-utils";
import {
  TRetreatRegistrationSchedule,
  UserRetreatRegistrationPaymentStatus,
} from "@/types";
import { StatusBadge } from "@/components/Badge";
import { useIsMobile } from "@/hooks/use-media-query";
import { RetreatScheduleSummaryMobileAccordion } from "./RetreatScheduleSummaryMobileAccordion";

interface RetreatScheduleSummaryProps {
  registrations: any[];
  schedules: TRetreatRegistrationSchedule[];
}

export function RetreatScheduleSummary({
  registrations = [],
  schedules = [],
}: RetreatScheduleSummaryProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const isMobile = useIsMobile();

  // 부서 수 계산
  const uniqueDepartments = useMemo(() => {
    return new Set(registrations.map(reg => reg.univGroupNumber)).size;
  }, [registrations]);

  // 요일별로 그룹화된 스케줄 컬럼
  const dayGroups = useMemo(() => {
    return groupScheduleColumnsByDay(schedules);
  }, [schedules]);

  // 모든 스케줄 컬럼 (평면화)
  const allScheduleColumns = useMemo(() => {
    return dayGroups.flatMap(group => group.schedules);
  }, [dayGroups]);

  // 부서별 스케줄 통계 생성
  const allRows = useMemo(() => {
    return generateScheduleStats(registrations, schedules);
  }, [registrations, schedules]);

  // 부서가 1개인 경우 전체 행 제외
  const rows = useMemo(() => {
    if (uniqueDepartments <= 1) {
      return allRows.filter(row => row.id !== "total");
    }
    return allRows;
  }, [allRows, uniqueDepartments]);

  // 전참/부분참 계산 함수
  const calculateParticipation = useMemo(() => {
    const paidRegistrations = registrations.filter(
      reg => reg.paymentStatus === UserRetreatRegistrationPaymentStatus.PAID
    );

    const participationStats: Record<
      string,
      { full: number; partial: number }
    > = {};

    // 부서별 초기화
    const departments = [
      ...new Set(paidRegistrations.map(reg => reg.univGroupNumber)),
    ];
    departments.forEach(dept => {
      participationStats[dept] = { full: 0, partial: 0 };
    });

    // 전체 스케줄 수
    const totalSchedules = schedules.length;

    paidRegistrations.forEach(reg => {
      const userScheduleCount =
        reg.userRetreatRegistrationScheduleIds?.length || 0;

      if (userScheduleCount === totalSchedules) {
        participationStats[reg.univGroupNumber].full++;
      } else if (userScheduleCount > 0) {
        participationStats[reg.univGroupNumber].partial++;
      }
    });

    return participationStats;
  }, [registrations, schedules]);

  // 부서별 총 인원수 계산 (입금완료 기준)
  const calculateDepartmentTotals = useMemo(() => {
    const paidRegistrations = registrations.filter(
      reg => reg.paymentStatus === UserRetreatRegistrationPaymentStatus.PAID
    );

    const departmentCounts: Record<string, number> = {};

    // 부서별 초기화
    const departments = [
      ...new Set(paidRegistrations.map(reg => reg.univGroupNumber)),
    ];
    departments.forEach(dept => {
      departmentCounts[dept] = 0;
    });

    // 부서별 총 인원 계산 (입금완료된 모든 인원)
    paidRegistrations.forEach(reg => {
      departmentCounts[reg.univGroupNumber]++;
    });

    return departmentCounts;
  }, [registrations]);

  // 각 행을 변환하여 셀 생성
  const formattedRows = useMemo(() => {
    return rows.map(row => {
      // 부서별 총 인원수 계산
      let totalParticipants = 0;

      if (row.id === "total") {
        // 합계 행의 경우 모든 부서의 총 인원 합
        totalParticipants = Object.values(calculateDepartmentTotals).reduce(
          (sum: number, count: number) => sum + count,
          0
        );
      } else {
        // 개별 부서의 경우
        const deptNumber = parseInt(row.id);
        totalParticipants = calculateDepartmentTotals[deptNumber] || 0;
      }

      // 스케줄별 셀 생성
      const scheduleCells: Record<string, JSX.Element> = {};
      allScheduleColumns.forEach(column => {
        const count = row.cells[column.key] || 0;
        scheduleCells[column.key] = (
          <div className="text-center">
            {row.id === "total" ? (
              <span className="font-semibold">{count}명</span>
            ) : (
              <span>{count}명</span>
            )}
          </div>
        );
      });

      // 전참/부분참 계산
      let fullParticipation = 0;
      let partialParticipation = 0;

      if (row.id === "total") {
        // 합계 행의 경우 모든 부서의 합
        Object.values(calculateParticipation).forEach(stats => {
          fullParticipation += stats.full;
          partialParticipation += stats.partial;
        });
      } else {
        // 개별 부서의 경우
        const deptNumber = parseInt(row.id);
        const stats = calculateParticipation[deptNumber];
        if (stats) {
          fullParticipation = stats.full;
          partialParticipation = stats.partial;
        }
      }

      return {
        ...row,
        cells: scheduleCells,
        fullParticipation: (
          <div className="text-center">
            {row.id === "total" ? (
              <span className="font-semibold">{fullParticipation}명</span>
            ) : (
              <span>{fullParticipation}명</span>
            )}
          </div>
        ),
        partialParticipation: (
          <div className="text-center">
            {row.id === "total" ? (
              <span className="font-semibold">{partialParticipation}명</span>
            ) : (
              <span>{partialParticipation}명</span>
            )}
          </div>
        ),
        total: (
          <div className="text-center">
            {row.id === "total" ? (
              <span className="font-bold">{totalParticipants}명</span>
            ) : (
              <span className="font-semibold">{totalParticipants}명</span>
            )}
          </div>
        ),
        // 실제 숫자 값 추가 (모바일용)
        fullParticipationCount: fullParticipation,
        partialParticipationCount: partialParticipation,
        totalCount: totalParticipants,
      };
    });
  }, [
    rows,
    allScheduleColumns,
    calculateParticipation,
    calculateDepartmentTotals,
  ]);

  const handleDownloadImage = async () => {
    if (!tableRef.current) return;

    try {
      setIsDownloading(true);
      const element = tableRef.current;
      const canvas = await html2canvas(element);
      const data = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.href = data;
      link.download = `식사숙박인원집계표_${new Date().toISOString().split("T")[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading image:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // retreat-utils.ts와 동일한 색상 시스템
  const getDayColor = (dayIndex: number) => {
    const colors = [
      "bg-rose-50 border-rose-200",
      "bg-amber-50 border-amber-200",
      "bg-teal-50 border-teal-200",
      "bg-indigo-50 border-indigo-200",
    ];
    return colors[dayIndex % colors.length];
  };

  if (schedules.length === 0) {
    return (
      <div className="space-y-3 md:space-y-4">
        <div>
          <h2 className="text-base md:text-xl font-semibold tracking-tight">
            식사 숙박 인원 집계 표
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">
            수양회 식사 및 숙박 인원 현황
          </p>
        </div>
        <div className="p-6 md:p-8 text-center text-gray-500 text-sm">
          스케줄 데이터가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Unified Header for both Mobile and Desktop */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold tracking-tight">
            식사 숙박 인원 집계 표
          </h2>
          <p className="mt-1 text-sm text-muted-foreground flex flex-wrap items-center gap-1">
            수양회 식사 및 숙박 인원 현황 (
            <StatusBadge status={UserRetreatRegistrationPaymentStatus.PAID} />
            기준 집계)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isMobile && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadImage}
              disabled={isDownloading}
              className="text-xs md:text-sm"
            >
              <Download className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
              <span className="hidden md:inline">이미지 저장</span>
            </Button>
          )}
          {isMobile && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              aria-label={isOpen ? "접기" : "펼치기"}
            >
              <ChevronDown
                className={`h-5 w-5 text-gray-600 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {isMobile ? (
        /* Mobile: Collapsible Content */
        isOpen && (
          <div className="mt-3">
            <RetreatScheduleSummaryMobileAccordion
              formattedRows={formattedRows}
              dayGroups={dayGroups}
            />
          </div>
        )
      ) : (
        /* Desktop: Table Layout */
        <div ref={tableRef}>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="border-b-0">
                  <TableHead
                    rowSpan={2}
                    className="sticky left-0 bg-gray-100 z-10 border-r font-semibold text-xs md:text-sm px-2 md:px-4"
                  >
                    부서
                  </TableHead>
                  <TableHead
                    colSpan={3}
                    className="text-center bg-gray-100 font-semibold text-gray-800 border-l border-l-gray-300 text-xs md:text-sm px-2 md:px-4"
                  >
                    요약
                  </TableHead>
                  {dayGroups.map((group, index) => (
                    <TableHead
                      key={group.dayName}
                      colSpan={group.schedules.length}
                      className={`text-center font-semibold text-gray-800 border-b ${getDayColor(
                        index
                      )} border-l border-l-gray-300 text-xs md:text-sm px-2 md:px-4`}
                    >
                      {group.dayName}
                    </TableHead>
                  ))}
                </TableRow>
                <TableRow>
                  <TableHead className="text-center font-medium text-gray-700 bg-gray-100 border-l border-l-gray-300 text-xs md:text-sm px-2 md:px-4">
                    전참
                  </TableHead>
                  <TableHead className="text-center font-medium text-gray-700 bg-gray-100 text-xs md:text-sm px-2 md:px-4">
                    부분참
                  </TableHead>
                  <TableHead className="text-center font-medium text-gray-700 bg-gray-100 text-xs md:text-sm px-2 md:px-4">
                    합계
                  </TableHead>
                  {dayGroups.map((group, groupIndex) =>
                    group.schedules.map((schedule, scheduleIndex) => {
                      const isFirstInGroup = scheduleIndex === 0;
                      return (
                        <TableHead
                          key={schedule.key}
                          className={`text-center font-medium text-gray-700 ${getDayColor(
                            groupIndex
                          )} ${isFirstInGroup ? "border-l border-l-gray-300" : ""} text-xs md:text-sm px-2 md:px-4`}
                        >
                          {schedule.label}
                        </TableHead>
                      );
                    })
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {formattedRows.map(row => (
                  <TableRow
                    key={row.id}
                    className={
                      row.id === "total" ? "bg-gray-50 font-semibold" : ""
                    }
                  >
                    <TableCell className="font-medium sticky left-0 bg-gray-50 z-10 border-r px-2 md:px-4 py-2 md:py-3">
                      <span
                        className={`inline-flex px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md font-medium text-xs md:text-sm ${
                          row.id === "total"
                            ? "bg-gray-200 text-gray-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {row.label}
                      </span>
                    </TableCell>
                    <TableCell
                      className={`text-center border-l border-l-gray-300 text-xs md:text-sm px-2 md:px-4 py-2 md:py-3 ${
                        row.id === "total" ? "bg-gray-50" : ""
                      }`}
                    >
                      {row.fullParticipation}
                    </TableCell>
                    <TableCell
                      className={`text-center text-xs md:text-sm px-2 md:px-4 py-2 md:py-3 ${
                        row.id === "total" ? "bg-gray-50" : ""
                      }`}
                    >
                      {row.partialParticipation}
                    </TableCell>
                    <TableCell
                      className={`text-center text-xs md:text-sm px-2 md:px-4 py-2 md:py-3 ${
                        row.id === "total" ? "bg-gray-50" : ""
                      }`}
                    >
                      {row.total}
                    </TableCell>
                    {dayGroups.map((group, groupIndex) =>
                      group.schedules.map((schedule, scheduleIndex) => {
                        const isFirstInGroup = scheduleIndex === 0;
                        return (
                          <TableCell
                            key={`${row.id}-${schedule.key}`}
                            className={`text-center text-xs md:text-sm px-2 md:px-4 py-2 md:py-3 ${
                              isFirstInGroup ? "border-l border-l-gray-300" : ""
                            } ${row.id === "total" ? "bg-gray-50" : ""}`}
                          >
                            {row.cells[schedule.key]}
                          </TableCell>
                        );
                      })
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
