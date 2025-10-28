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
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import {
  generateScheduleStats,
  groupScheduleColumnsByDay,
} from "../utils/retreat-utils";
import {
  TRetreatRegistrationSchedule,
  UserRetreatRegistrationPaymentStatus,
} from "@/types";

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
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">식사 숙박 인원 집계 표</h2>
          <p className="text-sm text-muted-foreground mt-1">수양회 식사 및 숙박 인원 현황</p>
        </div>
        <div className="p-8 text-center text-gray-500">
          스케줄 데이터가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">식사 숙박 인원 집계 표</h2>
          <p className="text-sm text-muted-foreground mt-1">
            수양회 식사 및 숙박 인원 현황 (입금완료 기준)
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadImage}
          disabled={isDownloading}
        >
          <Download className="h-4 w-4 mr-2" />
          이미지 저장
        </Button>
      </div>
      <div ref={tableRef}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-0">
                <TableHead
                  rowSpan={2}
                  className="sticky left-0 bg-gray-100 z-10 border-r font-semibold"
                >
                  부서
                </TableHead>
                <TableHead
                  colSpan={3}
                  className="text-center bg-gray-100 font-semibold text-gray-800 border-l border-l-gray-300"
                >
                  요약
                </TableHead>
                {dayGroups.map((group, index) => (
                  <TableHead
                    key={group.dayName}
                    colSpan={group.schedules.length}
                    className={`text-center font-semibold text-gray-800 border-b ${getDayColor(
                      index
                    )} border-l border-l-gray-300`}
                  >
                    {group.dayName}
                  </TableHead>
                ))}
              </TableRow>
              <TableRow>
                <TableHead className="text-center font-medium text-gray-700 bg-gray-100 border-l border-l-gray-300">
                  전참
                </TableHead>
                <TableHead className="text-center font-medium text-gray-700 bg-gray-100">
                  부분참
                </TableHead>
                <TableHead className="text-center font-medium text-gray-700 bg-gray-100">
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
                        )} ${isFirstInGroup ? "border-l border-l-gray-300" : ""}`}
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
                  <TableCell className="font-medium sticky left-0 bg-gray-50 z-10 border-r">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-md font-medium ${
                        row.id === "total"
                          ? "bg-gray-200 text-gray-800"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {row.label}
                    </span>
                  </TableCell>
                  <TableCell
                    className={`text-center border-l border-l-gray-300 ${
                      row.id === "total" ? "bg-gray-50" : ""
                    }`}
                  >
                    {row.fullParticipation}
                  </TableCell>
                  <TableCell
                    className={`text-center ${
                      row.id === "total" ? "bg-gray-50" : ""
                    }`}
                  >
                    {row.partialParticipation}
                  </TableCell>
                  <TableCell
                    className={`text-center ${
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
                          className={`text-center ${
                            isFirstInGroup
                              ? "border-l border-l-gray-300"
                              : ""
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
    </div>
  );
}
