"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { VirtualizedTable } from "@/components/common/table";
import { useUnivGroupRetreatRegistrationColumns } from "@/hooks/univ-group-retreat-registration/use-univ-group-retreat-registration-columns";
import { UnivGroupRetreatRegistrationTableToolbar } from "./UnivGroupRetreatRegistrationTableToolbar";
import { UnivGroupRetreatRegistrationMobileTable } from "./UnivGroupRetreatRegistrationMobileTable";
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
  const {
    registrations,
    saveScheduleMemo,
    updateScheduleMemo,
    deleteScheduleMemo,
    saveAdminMemo,
    updateAdminMemo,
    deleteAdminMemo,
    isMutating
  } = useUnivGroupRetreatRegistration(retreatSlug, {
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
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    columnResizeMode: "onChange",
    enableColumnResizing: false,
    // ✅ Multi-sort 및 필터 활성화
    enableMultiSort: true,
    enableSortingRemoval: true,
    enableColumnFilters: true,
    enableFilters: true,
    // ✅ 모든 클릭을 multi-sort event로 처리 (Shift 키 불필요)
    isMultiSortEvent: () => true,
    // 전역 필터 함수 (통합 검색)
    globalFilterFn: (row, columnId, filterValue) => {
      const searchableFields = [
        row.original.name,
        row.original.grade,
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

  // ✅ 사이드바에 표시할 최신 데이터 (SWR 캐시와 동기화)
  const currentSidebarData = sidebar.selectedItem
    ? data.find((item) => item.id === sidebar.selectedItem?.id) ?? sidebar.selectedItem
    : null;

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
          schedules={schedules}
        />

        {/* ✅ 모바일: 컴팩트 테이블 - 사이드바는 상세보기 버튼에서만 열림 */}
        <div className="md:hidden">
          <UnivGroupRetreatRegistrationMobileTable
            data={filteredData}
            onRowClick={sidebar.open}
          />
        </div>

        {/* ✅ 데스크톱: 가상화 테이블 - 사이드바는 상세보기 버튼에서만 열림 */}
        <div className="hidden md:block">
          <VirtualizedTable
            table={table}
            estimateSize={50}
            overscan={10}
            className="max-h-[80vh]"
            emptyMessage={
              globalFilter
                ? "검색 결과가 없습니다."
                : "표시할 데이터가 없습니다."
            }
          />
        </div>
      </div>

      {/* ✅ 상세 정보 사이드바 (반응형) - 최신 데이터로 실시간 동기화 */}
      <DetailSidebar
        open={sidebar.isOpen}
        onOpenChange={sidebar.setIsOpen}
        data={currentSidebarData}
        title="신청자 상세 정보"
        description={(data) => `${data.name} (${data.department}) 신청 내역`}
        side={isMobile ? "bottom" : "right"}
      >
        {(data) => (
          <UnivGroupRetreatRegistrationDetailContent
            data={data}
            retreatSlug={retreatSlug}
            schedules={schedules}
            onSaveScheduleMemo={saveScheduleMemo}
            onUpdateScheduleMemo={updateScheduleMemo}
            onDeleteScheduleMemo={deleteScheduleMemo}
            onSaveAdminMemo={saveAdminMemo}
            onUpdateAdminMemo={updateAdminMemo}
            onDeleteAdminMemo={deleteAdminMemo}
            isMutating={isMutating}
          />
        )}
      </DetailSidebar>
    </>
  );
}
