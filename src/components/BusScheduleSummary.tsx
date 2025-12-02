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
import { groupScheduleColumnsByDay } from "../utils/bus-utils";
import {
  TRetreatShuttleBus,
  UserRetreatShuttleBusPaymentStatus,
} from "@/types";
import { IUserBusRegistration } from "@/hooks/use-user-bus-registration";

interface BusScheduleSummaryProps {
  registrations: IUserBusRegistration[];
  schedules: TRetreatShuttleBus[];
}

export function BusScheduleSummary({
  registrations = [],
  schedules = [],
}: BusScheduleSummaryProps) {
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

  // 부서별 스케줄 통계 생성 (모든 등록자 기준)
  const allRows = useMemo(() => {
    if (!Array.isArray(registrations) || !Array.isArray(schedules)) {
      return [];
    }

    // 부서 목록 추출 (모든 등록자 기준, 중복 제거)
    const departments = registrations
      .map(reg => reg.univGroupNumber)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort((a, b) => a - b)
      .map(num => `${num}부`);

    // 각 부서별 스케줄 카운트 초기화
    const stats = departments.map(dept => {
      const scheduleCount: Record<string, number> = {};

      // 각 스케줄에 대해 카운트 초기화
      schedules.forEach(schedule => {
        scheduleCount[`schedule_${schedule.id}`] = 0;
      });

      return {
        id: dept.replace("부", ""),
        label: dept,
        cells: scheduleCount,
      };
    });

    // 각 등록에 대해 스케줄별로 카운트
    registrations.forEach(reg => {
      const deptIndex = stats.findIndex(
        s => s.label === `${reg.univGroupNumber}부`
      );
      if (deptIndex === -1) return;

      // 사용자가 선택한 스케줄들에 대해 카운트 증가
      if (Array.isArray(reg.userRetreatShuttleBusRegistrationScheduleIds)) {
        reg.userRetreatShuttleBusRegistrationScheduleIds.forEach(
          (scheduleId: number) => {
            const scheduleKey = `schedule_${scheduleId}`;
            if (stats[deptIndex].cells[scheduleKey] !== undefined) {
              stats[deptIndex].cells[scheduleKey]++;
            }
          }
        );
      }
    });

    // 합계 계산
    const totals = {
      id: "total",
      label: "합계",
      cells: {} as Record<string, number>,
    };

    schedules.forEach(schedule => {
      const scheduleKey = `schedule_${schedule.id}`;
      totals.cells[scheduleKey] = stats.reduce(
        (sum, dept) => sum + dept.cells[scheduleKey],
        0
      );
    });

    return [...stats, totals];
  }, [registrations, schedules]);

  // 부서가 1개인 경우 전체 행 제외
  const rows = useMemo(() => {
    if (uniqueDepartments <= 1) {
      return allRows.filter(row => row.id !== "total");
    }
    return allRows;
  }, [allRows, uniqueDepartments]);

  // 부서별 총 인원수 계산 (모든 등록자 기준)
  const calculateDepartmentTotals = useMemo(() => {
    const departmentCounts: Record<string, number> = {};

    // 부서별 초기화
    const departments = [
      ...new Set(registrations.map(reg => reg.univGroupNumber)),
    ];
    departments.forEach(dept => {
      departmentCounts[dept] = 0;
    });

    // 부서별 총 인원 계산 (모든 등록자)
    registrations.forEach(reg => {
      departmentCounts[reg.univGroupNumber]++;
    });

    return departmentCounts;
  }, [registrations]);

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

      return {
        ...row,
        cells: scheduleCells,
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
  }, [rows, allScheduleColumns, calculateDepartmentTotals]);

  const handleDownloadImage = async () => {
    if (!tableRef.current) return;

    try {
      setIsDownloading(true);
      const element = tableRef.current;
      const canvas = await html2canvas(element);
      const data = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.href = data;
      link.download = `버스인원집계표_${new Date().toISOString().split("T")[0]}.png`;
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

  // 데이터가 없어도 기본 테이블 구조는 보여주기
  const showEmptyMessage = schedules.length === 0 || registrations.length === 0;

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">버스 인원 집계 표</h2>
          <p className="text-sm text-muted-foreground mt-1">수양회 버스 인원 현황</p>
        </div>
        <Button
          onClick={handleDownloadImage}
          disabled={isDownloading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {isDownloading ? "다운로드 중..." : "이미지 다운로드"}
        </Button>
      </div>
      <div ref={tableRef}>
        <div className="overflow-x-auto rounded-md border">
          <Table className="min-w-full whitespace-nowrap">
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead rowSpan={2} className="text-center px-3 py-2.5">
                  부서
                </TableHead>
                {dayGroups.length > 0 ? (
                  dayGroups.map((group, index) => (
                    <TableHead
                      key={group.dayName}
                      colSpan={group.schedules.length}
                      className={`text-center px-3 py-2.5 ${getDayColor(index)}`}
                    >
                      {group.dayName}
                    </TableHead>
                  ))
                ) : (
                  <TableHead className="text-center px-3 py-2.5">
                    버스 일정
                  </TableHead>
                )}
                <TableHead rowSpan={2} className="text-center px-3 py-2.5">
                  총 인원
                </TableHead>
              </TableRow>
              <TableRow>
                {allScheduleColumns.length > 0 ? (
                  allScheduleColumns.map(schedule => (
                    <TableHead
                      key={schedule.key}
                      className="text-center px-2 py-2.5 text-xs"
                    >
                      <div className="whitespace-pre-line">
                        {schedule.fullLabel}
                      </div>
                    </TableHead>
                  ))
                ) : (
                  <TableHead className="text-center px-2 py-2.5 text-xs">
                    -
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {showEmptyMessage ? (
                <TableRow>
                  <TableCell
                    colSpan={Math.max(allScheduleColumns.length + 2, 3)}
                    className="text-center py-10 text-gray-500"
                  >
                    {schedules.length === 0
                      ? "스케줄 데이터가 없습니다."
                      : "등록 데이터가 없습니다."}
                  </TableCell>
                </TableRow>
              ) : (
                formattedRows.map(row => (
                  <TableRow
                    key={row.id}
                    className={
                      row.id === "total"
                        ? "bg-gray-50 font-semibold border-t-2"
                        : ""
                    }
                  >
                    <TableCell className="text-center px-3 py-2.5 font-medium">
                      {row.label}
                    </TableCell>
                    {allScheduleColumns.map(schedule => (
                      <TableCell
                        key={schedule.key}
                        className="text-center px-2 py-2.5"
                      >
                        {row.cells[schedule.key]}
                      </TableCell>
                    ))}
                    <TableCell className="text-center px-3 py-2.5">
                      {row.total}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
