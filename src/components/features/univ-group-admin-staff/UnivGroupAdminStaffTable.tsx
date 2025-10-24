"use client";

import { useMemo, useState, CSSProperties } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  ColumnPinningState,
  Column,
  flexRender,
} from "@tanstack/react-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createUnivGroupAdminStaffColumns } from "./univ-group-admin-staff-columns";
import { UnivGroupAdminStaffTableToolbar } from "./UnivGroupAdminStaffTableToolbar";
import { UnivGroupAdminStaffMemoDialog } from "./UnivGroupAdminStaffMemoDialog";
import { transformUnivGroupAdminStaffData } from "./utils";
import { useUnivGroupAdminStaffData } from "@/hooks/univ-group-admin-staff/use-univ-group-admin-staff-data";
import {
  IUnivGroupAdminStaffRetreat,
  UnivGroupAdminStaffData,
} from "@/types/univ-group-admin-staff";
import { TRetreatRegistrationSchedule } from "@/types";

interface UnivGroupAdminStaffTableProps {
  initialData: IUnivGroupAdminStaffRetreat[];
  schedules: TRetreatRegistrationSchedule[];
  retreatSlug: string;
}

/**
 * 컬럼 고정(pinning)을 위한 스타일 헬퍼 함수
 * - 왼쪽/오른쪽 고정 컬럼에 sticky 포지셔닝 적용
 * - 고정 컬럼의 마지막/첫번째에 box-shadow 추가 (시각적 구분)
 */
function getCommonPinningStyles<T>(
  column: Column<T>
): CSSProperties {
  const isPinned = column.getIsPinned();
  const isLastLeftPinnedColumn =
    isPinned === "left" && column.getIsLastColumn("left");
  const isFirstRightPinnedColumn =
    isPinned === "right" && column.getIsFirstColumn("right");

  return {
    boxShadow: isLastLeftPinnedColumn
      ? "-4px 0 4px -4px gray inset"
      : isFirstRightPinnedColumn
        ? "4px 0 4px -4px gray inset"
        : undefined,
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    opacity: isPinned ? 0.95 : 1,
    position: isPinned ? "sticky" : "relative",
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
    backgroundColor: isPinned ? "rgb(243 244 246)" : "white", // gray-100 for pinned
  };
}

/**
 * 부서 행정 간사 - 수양회 신청 테이블 (TanStack Table)
 *
 * Features:
 * - 동적 스케줄 컬럼
 * - 열 가시성 토글
 * - 정렬
 * - 통합 검색 (Lodash debounce)
 * - 액션 버튼 (환불, 새가족, 군지체)
 * - 메모 관리
 * - 엑셀 다운로드
 * - 왼쪽 컬럼 고정 (부서, 성별, 학년, 이름)
 */
export function UnivGroupAdminStaffTable({
  initialData,
  schedules,
  retreatSlug,
}: UnivGroupAdminStaffTableProps) {
  // ✅ SWR로 실시간 데이터 동기화 (initialData를 fallback으로)
  const { data: registrations } = useUnivGroupAdminStaffData(retreatSlug, {
    fallbackData: initialData,
  });

  // ✅ TanStack Table State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  // ✅ Column Pinning State (왼쪽 4개 컬럼 고정: 부서, 성별, 학년, 이름)
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: ["department", "gender", "grade", "name"],
    right: [],
  });

  // ✅ useMemo로 columns 메모이제이션 (Best Practice)
  const columns = useMemo(
    () => createUnivGroupAdminStaffColumns(schedules, retreatSlug),
    [schedules, retreatSlug]
  );

  // ✅ useMemo로 data 메모이제이션
  const data = useMemo(
    () => transformUnivGroupAdminStaffData(registrations || [], schedules),
    [registrations, schedules]
  );

  // ✅ TanStack Table 초기화
  const table = useReactTable<UnivGroupAdminStaffData>({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      columnPinning,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onColumnPinningChange: setColumnPinning,
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
        row.original.phone,
        row.original.currentLeaderName,
        row.original.gbs,
        row.original.accommodation,
        row.original.hadRegisteredShuttleBus ? "신청함" : "신청 안함",
      ];

      return searchableFields.some((field) =>
        field?.toLowerCase().includes(filterValue.toLowerCase())
      );
    },
  });

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="bg-gray-50 border-b px-4 py-3">
          <CardTitle className="text-lg">부서 현황 및 입금 조회</CardTitle>
          <CardDescription className="text-sm">
            부서 신청자 목록
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 py-4">
          {/* 툴바 */}
          <UnivGroupAdminStaffTableToolbar
            table={table}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
            retreatSlug={retreatSlug}
          />

          {/* 테이블 */}
          <div className="rounded-md border overflow-x-auto">
            <div className="max-h-[80vh] overflow-y-auto">
              <Table className="relative">
                <TableHeader className="bg-gray-100 sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const pinningStyles = getCommonPinningStyles(
                          header.column
                        );
                        return (
                          <TableHead
                            key={header.id}
                            className="px-2 py-2 text-center"
                            style={{
                              ...pinningStyles,
                              width: header.column.columnDef.size,
                            }}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="divide-y divide-gray-200">
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="group hover:bg-gray-50 transition-colors duration-150"
                      >
                        {row.getVisibleCells().map((cell) => {
                          const pinningStyles = getCommonPinningStyles(
                            cell.column
                          );
                          return (
                            <TableCell
                              key={cell.id}
                              className="px-2 py-2"
                              style={{
                                ...pinningStyles,
                                width: cell.column.columnDef.size,
                              }}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          );
                        })}
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
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 일정 변경 요청 메모 다이얼로그 */}
      <UnivGroupAdminStaffMemoDialog retreatSlug={retreatSlug} />
    </>
  );
}
