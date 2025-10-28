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
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createUnivGroupRetreatRegistrationColumns } from "./univ-group-retreat-registration-columns";
import { UnivGroupRetreatRegistrationTableToolbar } from "./UnivGroupRetreatRegistrationTableToolbar";
import { UnivGroupRetreatRegistrationMemoDialog } from "./UnivGroupRetreatRegistrationMemoDialog";
import { transformUnivGroupAdminStaffData } from "./utils";
import { useUnivGroupRetreatRegistration } from "@/hooks/univ-group-retreat-registration/use-univ-group-retreat-registration";
import {
  IUnivGroupAdminStaffRetreat,
  UnivGroupAdminStaffData,
} from "@/types/univ-group-admin-staff";
import { TRetreatRegistrationSchedule } from "@/types";

interface UnivGroupRetreatRegistrationTableProps {
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
  column: Column<T>,
  isHeader: boolean = false
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
    position: isPinned ? "sticky" : "relative",
    zIndex: isPinned ? (isHeader ? 20 : 10) : 0,
    backgroundColor: isPinned ? "rgb(243 244 246)" : isHeader ? "rgb(243 244 246)" : "white",
    whiteSpace: "nowrap" as const,
  };
}

/**
 * 부서 수양회 신청 테이블 (TanStack Table)
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
export function UnivGroupRetreatRegistrationTable({
  initialData,
  schedules,
  retreatSlug,
}: UnivGroupRetreatRegistrationTableProps) {
  // ✅ SWR로 실시간 데이터 동기화 (initialData를 fallback으로)
  const { registrations } = useUnivGroupRetreatRegistration(retreatSlug, {
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
    () => createUnivGroupRetreatRegistrationColumns(schedules, retreatSlug),
    [schedules, retreatSlug]
  );

  // ✅ useMemo로 data 메모이제이션
  const data = useMemo(
    () => transformUnivGroupAdminStaffData(registrations, schedules),
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
    columnResizeMode: "onChange",
    enableColumnResizing: false,
    // 전역 필터 함수 (통합 검색)
    globalFilterFn: (row, columnId, filterValue) => {
      const searchableFields = [
        row.original.name,
        row.original.department,
        row.original.grade,
        row.original.type?.toString(),
        row.original.phone,
        row.original.currentLeaderName,
        row.original.hadRegisteredShuttleBus ? "신청함" : "신청 안함",
      ];

      return searchableFields.some((field) =>
        field?.toLowerCase().includes(filterValue.toLowerCase())
      );
    },
  });

  return (
    <>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">부서 현황 및 입금 조회</h2>
          <p className="text-sm text-muted-foreground mt-1">
            부서 신청자 목록
          </p>
        </div>

        {/* 툴바 */}
        <UnivGroupRetreatRegistrationTableToolbar
          table={table}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          retreatSlug={retreatSlug}
        />

        {/* 테이블 */}
        <div>
          <div className="max-h-[80vh] overflow-auto">
              <table className="relative w-full caption-bottom text-sm" style={{ tableLayout: "auto", borderCollapse: "collapse" }}>
                <TableHeader className="sticky top-0 z-30">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const pinningStyles = getCommonPinningStyles(
                          header.column,
                          true
                        );
                        return (
                          <TableHead
                            key={header.id}
                            className="px-2 py-2 text-center bg-gray-100"
                            style={pinningStyles}
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
                            cell.column,
                            false
                          );
                          const isPinned = cell.column.getIsPinned();
                          return (
                            <TableCell
                              key={cell.id}
                              className={`px-2 py-2 ${isPinned ? "!bg-gray-100" : ""}`}
                              style={pinningStyles}
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
              </table>
            </div>
          </div>
        </div>

      {/* 일정 변경 요청 메모 다이얼로그 */}
      <UnivGroupRetreatRegistrationMemoDialog retreatSlug={retreatSlug} />
    </>
  );
}
