"use client";

import { useState, useRef, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import {
  generateScheduleStats,
  groupScheduleColumnsByDay,
} from "../utils/bus-utils";
import {
  TRetreatShuttleBus,
  UserRetreatShuttleBusPaymentStatus,
} from "@/types";

interface BusScheduleSummaryProps {
  registrations: any[];
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
        reg => reg.shuttleBusPaymentStatus === UserRetreatShuttleBusPaymentStatus.PAID
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
        reg.userRetreatShuttleBusRegistrationScheduleIds?.length || 0;

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
        reg => reg.shuttleBusPaymentStatus === UserRetreatShuttleBusPaymentStatus.PAID
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
      <Card>
        <CardHeader>
          {/* <CardTitle>식사 숙박 인원 집계 표</CardTitle> */}
          {/* <CardDescription>수양회 식사 및 숙박 인원 현황</CardDescription> */}
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            스케줄 데이터가 없습니다.
          </div>
        </CardContent>
      </Card>
    );
  }
}