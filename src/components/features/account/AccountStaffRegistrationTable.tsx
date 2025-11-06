"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
} from "@tanstack/react-table";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAccountStaffColumns } from "@/hooks/account/use-account-staff-columns";
import { AccountStaffRegistrationTableToolbar } from "./AccountStaffRegistrationTableToolbar";
import { transformRegistrationsForTable } from "./utils";
import { useAccountStaffRegistration } from "@/hooks/account/use-account-staff-registration";
import { IRetreatRegistration } from "@/types/account";
import { TRetreatRegistrationSchedule } from "@/types";
import { AccountStaffTableData } from "@/hooks/account/use-account-staff-columns";
import { DetailSidebar, useDetailSidebar } from "@/components/common/detail-sidebar";
import { AccountStaffRegistrationDetailContent } from "./AccountStaffRegistrationDetailContent";

interface AccountStaffRegistrationTableProps {
  initialData: IRetreatRegistration[];
  schedules: TRetreatRegistrationSchedule[];
  retreatSlug: string;
}

/**
 * 재정 간사 수양회 신청 테이블 (TanStack Table)
 *
 * Features:
 * - 동적 스케줄 컬럼
 * - 열 가시성 토글
 * - 정렬
 * - 통합 검색 (Lodash debounce)
 * - 액션 버튼 (입금 확인, 간사 배정, 환불)
 * - 메모 관리
 * - 엑셀 다운로드
 */
export function AccountStaffRegistrationTable({
  initialData,
  schedules,
  retreatSlug,
}: AccountStaffRegistrationTableProps) {
  // ✅ SWR로 실시간 데이터 동기화 (initialData를 fallback으로)
  const { registrations } = useAccountStaffRegistration(retreatSlug, {
    fallbackData: initialData,
  });

  // ✅ 사이드바 상태 관리
  const sidebar = useDetailSidebar<AccountStaffTableData>();

  // ✅ TanStack Table State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  // ✅ 컬럼 훅으로 컬럼 정의 가져오기
  const columns = useAccountStaffColumns(
    schedules,
    retreatSlug,
    sidebar.open
  );

  // ✅ useMemo로 data 메모이제이션
  const data = useMemo(
    () => transformRegistrationsForTable(registrations, schedules),
    [registrations, schedules]
  );

  // ✅ TanStack Table 초기화
  const table = useReactTable<AccountStaffTableData>({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
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
        row.original.phoneNumber,
        row.original.status,
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
          <h2 className="text-xl font-semibold tracking-tight">재정 간사 조회</h2>
          <p className="text-sm text-muted-foreground mt-1">
            대학부 전체 신청자 목록 조회
          </p>
        </div>

        {/* 툴바 */}
        <AccountStaffRegistrationTableToolbar
          table={table}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          retreatSlug={retreatSlug}
        />

        {/* 테이블 */}
        <div className="border rounded-lg">
          <div className="max-h-[80vh] overflow-auto">
            <table className="relative w-full caption-bottom text-sm">
              <TableHeader className="sticky top-0 z-10 bg-gray-100">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="px-2 py-2 text-center bg-gray-100"
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
                      data-state={row.getIsSelected() && "selected"}
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

      {/* 상세 정보 사이드바 */}
      <DetailSidebar
        open={sidebar.isOpen}
        onOpenChange={sidebar.setIsOpen}
        data={sidebar.selectedItem}
        title="신청자 상세 정보"
        description={(data) => `${data.name} (${data.department}) 신청 내역`}
      >
        {(data) => <AccountStaffRegistrationDetailContent data={data} />}
      </DetailSidebar>
    </>
  );
}
