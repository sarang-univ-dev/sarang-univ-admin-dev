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
import { useUnivGroupRetreatRegistrationColumns } from "@/hooks/univ-group-retreat-registration/use-univ-group-retreat-registration-columns";
import { UnivGroupRetreatRegistrationTableToolbar } from "./UnivGroupRetreatRegistrationTableToolbar";
import { UnivGroupRetreatRegistrationMobileTable } from "./UnivGroupRetreatRegistrationMobileTable";
import { MemoDialog } from "@/components/common/table/MemoDialog";
import { useIsMobile } from "@/hooks/use-media-query";
import { transformUnivGroupAdminStaffData } from "./utils";
import { useUnivGroupRetreatRegistration } from "@/hooks/univ-group-retreat-registration/use-univ-group-retreat-registration";
import {
  IUnivGroupAdminStaffRetreat,
  UnivGroupAdminStaffData,
} from "@/types/univ-group-admin-staff";
import { TRetreatRegistrationSchedule } from "@/types";
import { DetailSidebar, useDetailSidebar } from "@/components/common/detail-sidebar";
import { UnivGroupRetreatRegistrationDetailContent } from "./UnivGroupRetreatRegistrationDetailContent";

interface UnivGroupRetreatRegistrationTableProps {
  initialData: IUnivGroupAdminStaffRetreat[];
  schedules: TRetreatRegistrationSchedule[];
  retreatSlug: string;
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
 */
export function UnivGroupRetreatRegistrationTable({
  initialData,
  schedules,
  retreatSlug,
}: UnivGroupRetreatRegistrationTableProps) {
  // ✅ SWR로 실시간 데이터 동기화 (initialData를 fallback으로)
  const { registrations, saveScheduleMemo, isMutating } = useUnivGroupRetreatRegistration(retreatSlug, {
    fallbackData: initialData,
  });

  // ✅ 사이드바 상태 관리
  const sidebar = useDetailSidebar<UnivGroupAdminStaffData>();

  // ✅ 모바일 감지
  const isMobile = useIsMobile();

  // ✅ TanStack Table State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  // ✅ 컬럼 훅으로 컬럼 정의 가져오기
  const columns = useUnivGroupRetreatRegistrationColumns(
    schedules,
    retreatSlug,
    sidebar.open
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
        row.original.phone,
        row.original.currentLeaderName,
        row.original.hadRegisteredShuttleBus ? "신청함" : "신청 안함",
      ];

      return searchableFields.some((field) =>
        field?.toLowerCase().includes(filterValue.toLowerCase())
      );
    },
  });

  // ✅ 필터링된 데이터 (모바일 테이블과 공유)
  const filteredData = table.getRowModel().rows.map((row) => row.original);

  return (
    <>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">부서 현황 및 입금 조회</h2>
          <p className="text-sm text-muted-foreground mt-1">
            부서 신청자 목록 ({filteredData.length}명)
          </p>
        </div>

        {/* 툴바 */}
        <UnivGroupRetreatRegistrationTableToolbar
          table={table}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          retreatSlug={retreatSlug}
        />

        {/* ✅ 모바일: 컴팩트 테이블 */}
        <div className="md:hidden">
          <UnivGroupRetreatRegistrationMobileTable
            data={filteredData}
            onRowClick={sidebar.open}
          />
        </div>

        {/* ✅ 데스크톱: 전체 테이블 */}
        <div className="hidden md:block border rounded-lg">
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

      {/* 일정 변경 요청 메모 다이얼로그 */}
      <MemoDialog
        eventName="open-memo-dialog"
        title="일정 변경 요청 메모 작성"
        placeholder="메모를 입력하세요... ex) 전참 → 금숙 ~ 토점"
        onSave={async (id, memo) => {
          await saveScheduleMemo(id, memo);
        }}
        loading={isMutating}
      />

      {/* ✅ 상세 정보 사이드바 (반응형) */}
      <DetailSidebar
        open={sidebar.isOpen}
        onOpenChange={sidebar.setIsOpen}
        data={sidebar.selectedItem}
        title="신청자 상세 정보"
        description={(data) => `${data.name} (${data.department}) 신청 내역`}
        side={isMobile ? "bottom" : "right"}
      >
        {(data) => (
          <UnivGroupRetreatRegistrationDetailContent
            data={data}
            retreatSlug={retreatSlug}
            schedules={schedules}
          />
        )}
      </DetailSidebar>
    </>
  );
}
