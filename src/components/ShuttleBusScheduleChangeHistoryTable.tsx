"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { GenderBadge } from "@/components/Badge";
import { generateShuttleBusScheduleColumns } from "../utils/bus-utils";
import { TRetreatShuttleBus } from "@/types";
import { formatDate } from "@/utils/formatDate";
import { useToastStore } from "@/store/toast-store";
import { AxiosError } from "axios";
import { IUserScheduleChangeShuttleBusHistory } from "@/hooks/user-schedule-change-bus-history";

const transformScheduleChangeHistoryForTable = (
  histories: IUserScheduleChangeShuttleBusHistory[],
  schedules: TRetreatShuttleBus[]
) => {
  const transformedData: any[] = [];

  histories.forEach((history, index) => {
    // 안전한 배열 처리 - 필드명 수정
    const beforeScheduleIds = Array.isArray(history.beforeShuttleBusIds)
      ? history.beforeShuttleBusIds
      : [];
    const afterScheduleIds = Array.isArray(history.afterShuttleBusIds)
      ? history.afterShuttleBusIds
      : [];

    // Before row
    const beforeScheduleMap = schedules.reduce(
      (acc, cur) => {
        // 타입 안전성을 위해 문자열로도 비교
        const scheduleId = cur.id;
        const isIncluded =
          beforeScheduleIds.includes(scheduleId) ||
          beforeScheduleIds.includes(scheduleId.toString() as any) ||
          beforeScheduleIds.includes(parseInt(scheduleId.toString()));
        acc[`schedule_${cur.id}`] = isIncluded;
        return acc;
      },
      {} as Record<string, boolean>
    );

    const beforeRow = {
      id: `${history.userRetreatShuttleBusRegistrationId}_${index}_before`,
      registrationId: history.userRetreatShuttleBusRegistrationId,
      department: `${history.univGroupNumber}부`,
      gender: history.gender,
      grade: `${history.gradeNumber}학년`,
      name: history.name,
      phone: history.phoneNumber,
      schedule: beforeScheduleMap,
      price: history.beforePrice,
      userName: history.createdUserName,
      timestamp: history.createdAt,
      type: "before",
      rowIndex: index,
    };

    // After row
    const afterScheduleMap = schedules.reduce(
      (acc, cur) => {
        // 타입 안전성을 위해 문자열로도 비교
        const scheduleId = cur.id;
        const isIncluded =
          afterScheduleIds.includes(scheduleId) ||
          afterScheduleIds.includes(scheduleId.toString() as any) ||
          afterScheduleIds.includes(parseInt(scheduleId.toString()));
        acc[`schedule_${cur.id}`] = isIncluded;
        return acc;
      },
      {} as Record<string, boolean>
    );

    const afterRow = {
      id: `${history.userRetreatShuttleBusRegistrationId}_${index}_after`,
      registrationId: history.userRetreatShuttleBusRegistrationId,
      department: `${history.univGroupNumber}부`,
      gender: history.gender,
      grade: `${history.gradeNumber}학년`,
      name: history.name,
      phone: history.phoneNumber,
      schedule: afterScheduleMap,
      price: history.afterPrice,
      userName: history.resolvedUserName,
      timestamp: history.resolvedAt,
      type: "after",
      rowIndex: index,
    };

    transformedData.push(beforeRow, afterRow);
  });

  return transformedData;
};

export function ShuttleBusScheduleChangeHistoryTable({
  scheduleChangeHistories = [],
  schedules = [],
  retreatSlug,
}: {
  scheduleChangeHistories: IUserScheduleChangeShuttleBusHistory[];
  schedules: TRetreatShuttleBus[];
  retreatSlug: string;
}) {
  const addToast = useToastStore(state => state.add);
  const [allData, setAllData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (scheduleChangeHistories.length > 0 && schedules.length > 0) {
      try {
        const transformedData = transformScheduleChangeHistoryForTable(
          scheduleChangeHistories,
          schedules
        );
        setAllData(transformedData);
      } catch (error) {
        console.error("데이터 변환 중 오류 발생:", error);
        addToast({
          title: "오류",
          description:
            error instanceof AxiosError
              ? error.response?.data?.message || error.message
              : error instanceof Error
                ? error.message
                : "데이터를 불러오는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } else {
      setAllData([]);
    }
  }, [scheduleChangeHistories, schedules, addToast]);

  useEffect(() => {
    let dataToFilter = [...allData];

    if (searchTerm) {
      dataToFilter = dataToFilter.filter(row =>
        [
          row.name,
          row.department,
          row.grade?.toString(),
          row.phone?.toString(),
          row.userName?.toString(),
        ].some(field => field?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredData(dataToFilter);
  }, [allData, searchTerm]);

  const scheduleColumns = useMemo(
    () => generateShuttleBusScheduleColumns(schedules),
    [schedules]
  );

  const renderTableRow = (row: any, index: number) => {
    const isBeforeRow = row.type === "before";
    const nextRow = filteredData[index + 1];
    const isLastRowOfPair = !nextRow || nextRow.rowIndex !== row.rowIndex;

    return (
      <TableRow
        key={row.id}
        className="group hover:bg-gray-50 transition-colors duration-150"
      >
        {/* 부서 - rowspan 2 for first row of pair */}
        {isBeforeRow && (
          <TableCell className="text-center px-3 py-2.5" rowSpan={2}>
            {row.department}
          </TableCell>
        )}

        {/* 성별 - rowspan 2 for first row of pair */}
        {isBeforeRow && (
          <TableCell className="text-center px-3 py-2.5" rowSpan={2}>
            <GenderBadge gender={row.gender} />
          </TableCell>
        )}

        {/* 학년 - rowspan 2 for first row of pair */}
        {isBeforeRow && (
          <TableCell className="text-center px-3 py-2.5" rowSpan={2}>
            {row.grade}
          </TableCell>
        )}

        {/* 이름 - rowspan 2 for first row of pair */}
        {isBeforeRow && (
          <TableCell
            className="sticky left-0 bg-white hover:bg-gray-50 transition-colors duration-150 z-20 font-medium text-center px-3 py-2.5"
            rowSpan={2}
          >
            {row.name}
          </TableCell>
        )}

        {/* 전화번호 - rowspan 2 for first row of pair */}
        {isBeforeRow && (
          <TableCell
            className="font-medium text-center px-3 py-2.5"
            rowSpan={2}
          >
            {row.phone || "-"}
          </TableCell>
        )}

        {/* 구분 */}
        <TableCell className="text-center px-3 py-2.5 font-medium">
          {isBeforeRow ? "변경 전" : "변경 후"}
        </TableCell>

        {/* 스케줄 컬럼들 */}
        {scheduleColumns.map(col => {
          const isChecked = !!row.schedule?.[col.key];

          return (
            <TableCell key={`${row.id}-${col.key}`} className="p-2 text-center">
              <Checkbox
                checked={isChecked}
                disabled
                className={isChecked ? col.bgColorClass : ""}
              />
            </TableCell>
          );
        })}

        {/* 금액 */}
        <TableCell className="font-medium text-center px-3 py-2.5">
          {row.price?.toLocaleString()}원
        </TableCell>

        {/* 처리자명 */}
        <TableCell className="text-center px-3 py-2.5">
          {row.userName || "-"}
        </TableCell>

        {/* 처리시각 */}
        <TableCell className="text-gray-600 text-xs text-center whitespace-nowrap px-3 py-2.5">
          {formatDate(row.timestamp)}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="bg-gray-50 border-b px-4 py-3">
        <div>
          <CardTitle className="text-lg">일정 변경 이력 조회</CardTitle>
          <CardDescription className="text-sm">
            일정 변경 이력 목록
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="통합 검색 (이름, 부서, 학년, 전화번호, 처리자 등)..."
              className="pl-8 pr-4 py-2 border-gray-200 focus:border-primary focus:ring-primary rounded-md"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div
            className="rounded-md border overflow-hidden"
            ref={tableContainerRef}
          >
            <div className="max-h-[80vh] overflow-auto">
                <Table className="min-w-full whitespace-nowrap relative text-sm">
                  <TableHeader className="bg-gray-100 sticky top-0 z-10 select-none">
                    <TableRow>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>부서</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>성별</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>학년</span>
                        </div>
                      </TableHead>
                      <TableHead
                        className="sticky left-0 bg-gray-100 z-20 px-3 py-2.5"
                        rowSpan={2}
                      >
                        <div className="flex items-center space-x-1 justify-center">
                          <span>이름</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>전화번호</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>구분</span>
                        </div>
                      </TableHead>
                      <TableHead
                        colSpan={scheduleColumns.length}
                        className="text-center px-3 py-2.5"
                      >
                        신청 셔틀버스 일정
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>금액</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>처리자명</span>
                        </div>
                      </TableHead>
                      <TableHead className="px-3 py-2.5" rowSpan={2}>
                        <div className="flex items-center space-x-1 justify-center">
                          <span>처리시각</span>
                        </div>
                      </TableHead>
                    </TableRow>
                    <TableRow>
                      {scheduleColumns.map(scheduleCol => (
                        <TableHead
                          key={scheduleCol.key}
                          className="p-2 text-center"
                        >
                          <div className="flex items-center justify-center">
                            <span className="text-xs whitespace-pre-line">
                              {scheduleCol.label}
                            </span>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-200">
                    {filteredData.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={10 + scheduleColumns.length}
                          className="text-center py-10 text-gray-500"
                        >
                          {allData.length > 0
                            ? "검색 결과가 없습니다."
                            : "표시할 데이터가 없습니다."}
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredData.map((row, index) =>
                      renderTableRow(row, index)
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
      </CardContent>
    </Card>
  );
}
