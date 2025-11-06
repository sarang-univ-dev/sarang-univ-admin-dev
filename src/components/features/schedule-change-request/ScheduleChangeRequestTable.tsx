"use client";

import { useMemo, useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  ColumnFiltersState,
  SortingState,
  flexRender,
} from "@tanstack/react-table";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useScheduleChangeRequest } from "@/hooks/schedule-change-request/use-schedule-change-request";
import { useScheduleChangeRequestColumns, ScheduleChangeRequestTableData } from "@/hooks/schedule-change-request/use-schedule-change-request-columns";
import { ScheduleChangeRequestTableToolbar } from "./ScheduleChangeRequestTableToolbar";
import { ScheduleChangeModal } from "@/components/common/retreat";
import { transformScheduleChangeRequestForTable } from "./utils";
import { TRetreatRegistrationSchedule, TRetreatPaymentSchedule } from "@/types";
import { webAxios } from "@/lib/api/axios";

interface ScheduleChangeRequestTableProps {
  initialData: any[];
  schedules: TRetreatRegistrationSchedule[];
  payments: TRetreatPaymentSchedule[];
  retreatSlug: string;
}

/**
 * 일정 변경 요청 테이블 (TanStack Table)
 *
 * Features:
 * - 동적 스케줄 컬럼
 * - 정렬
 * - 통합 검색
 * - 일정 변경 처리 모달
 * - 처리 완료 기능
 */
export function ScheduleChangeRequestTable({
  initialData,
  schedules,
  payments,
  retreatSlug,
}: ScheduleChangeRequestTableProps) {
  // SWR로 실시간 데이터 동기화 (initialData를 fallback으로)
  const { scheduleChangeRequests, approveScheduleChange, resolveScheduleChange } =
    useScheduleChangeRequest(retreatSlug, {
      fallbackData: initialData,
    });

  // 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ScheduleChangeRequestTableData | null>(null);
  const [retreatInfo, setRetreatInfo] = useState<any>(null);

  // TanStack Table State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // Retreat info 가져오기 (금액 계산에 필요)
  useEffect(() => {
    const getRetreatInfo = async () => {
      try {
        const response = await webAxios.get(`/api/v1/retreat/${retreatSlug}/info`);
        setRetreatInfo(response.data.retreatInfo);
      } catch (error) {
        console.error("Retreat 조회 중 오류 발생:", error);
      }
    };
    getRetreatInfo();
  }, [retreatSlug]);

  // 일정 처리 버튼 클릭 핸들러
  const handleProcessSchedule = (row: ScheduleChangeRequestTableData) => {
    setSelectedRow(row);
    setIsModalOpen(true);
  };

  // 처리 완료 버튼 클릭 핸들러
  const handleResolveSchedule = (row: ScheduleChangeRequestTableData) => {
    if (!row.memoId) {
      return;
    }
    resolveScheduleChange(row.memoId);
  };

  // 모달 확인 핸들러
  const handleModalConfirm = async (data: {
    scheduleIds: number[];
    calculatedAmount: number;
  }) => {
    if (!selectedRow) return;
    await approveScheduleChange(selectedRow.id, data.scheduleIds);
  };

  // 컬럼 훅으로 컬럼 정의 가져오기
  const columns = useScheduleChangeRequestColumns(
    schedules,
    retreatSlug,
    handleProcessSchedule,
    handleResolveSchedule
  );

  // useMemo로 data 메모이제이션
  const data = useMemo(
    () => transformScheduleChangeRequestForTable(scheduleChangeRequests, schedules),
    [scheduleChangeRequests, schedules]
  );

  // TanStack Table 초기화
  const table = useReactTable<ScheduleChangeRequestTableData>({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // 전역 필터 함수 (통합 검색)
    globalFilterFn: (row, columnId, filterValue) => {
      const searchableFields = [
        row.original.name,
        row.original.department,
        row.original.grade,
        row.original.type?.toString(),
        row.original.issuerName,
        row.original.memo,
      ];

      return searchableFields.some((field) =>
        field?.toLowerCase().includes(filterValue.toLowerCase())
      );
    },
  });

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between bg-gray-50 border-b">
          <div className="whitespace-nowrap">
            <CardTitle>일정 변경 요청 조회</CardTitle>
            <CardDescription>일정 변경 요청 목록</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* 툴바 */}
            <ScheduleChangeRequestTableToolbar
              globalFilter={globalFilter}
              setGlobalFilter={setGlobalFilter}
            />

            {/* 테이블 */}
            <div className="rounded-md border">
              <div className="max-h-[calc(100vh-300px)] overflow-auto">
                <table className="relative w-full caption-bottom text-sm whitespace-nowrap">
                  <TableHeader className="bg-gray-50 sticky top-0 z-10">
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead
                              key={header.id}
                              className="px-2 py-2 text-center bg-gray-50"
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-200">
                      {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                          <TableRow
                            key={row.id}
                            className="group hover:bg-gray-50 transition-colors duration-150"
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id} className="px-2 py-2">
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center"
                          >
                            {globalFilter
                              ? "검색 결과가 없습니다."
                              : "표시할 데이터가 없습니다."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 일정 변경 모달 */}
      {selectedRow && (
        <ScheduleChangeModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          userData={{
            name: selectedRow.name,
            department: selectedRow.department,
            grade: selectedRow.grade,
            type: selectedRow.type || "",
          }}
          schedules={schedules}
          payments={payments}
          initialScheduleIds={selectedRow.scheduleIds}
          originalAmount={selectedRow.amount}
          retreatInfo={retreatInfo}
          memo={{
            content: selectedRow.memo,
            issuerName: selectedRow.issuerName,
            createdAt: selectedRow.memoCreatedAt,
          }}
          memoMode="readonly"
          onConfirm={handleModalConfirm}
          confirmButtonText="일정 변동 처리 완료"
          title="일정 변경 처리"
        />
      )}
    </>
  );
}
