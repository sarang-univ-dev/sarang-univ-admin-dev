"use client";

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
import { HelpCircle } from "lucide-react";
import { useMemo, useState } from "react";

import {
  DetailSidebar,
  useDetailSidebar,
} from "@/components/common/detail-sidebar";
import { PageHelpPanel } from "@/components/common/help";
import { VirtualizedTable } from "@/components/common/table";
import { Button } from "@/components/ui/button";
import {
  useAccountStaffColumns,
  AccountStaffTableData,
} from "@/hooks/account/use-account-staff-columns";
import { useAccountStaffRegistration } from "@/hooks/account/use-account-staff-registration";
import { accountRetreatRegistrationHelp } from "@/lib/help";
import { TRetreatRegistrationSchedule } from "@/types";
import { IRetreatRegistration } from "@/types/account";

import { AccountStaffRegistrationDetailContent } from "./AccountStaffRegistrationDetailContent";
import { AccountStaffRegistrationTableToolbar } from "./AccountStaffRegistrationTableToolbar";
import { transformRegistrationsForTable } from "./utils";

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
  const [helpOpen, setHelpOpen] = useState(false);

  // ✅ 컬럼 훅으로 컬럼 정의 가져오기
  const columns = useAccountStaffColumns(schedules, retreatSlug, sidebar.open);

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
        row.original.department,
        row.original.grade,
        row.original.type?.toString(),
        row.original.phoneNumber,
        row.original.status,
      ];

      return searchableFields.some(field =>
        field?.toLowerCase().includes(filterValue.toLowerCase())
      );
    },
  });

  // ✅ 필터링된 데이터 수
  const filteredRowCount = table.getRowModel().rows.length;

  // ✅ 사이드바에 표시할 최신 데이터 (SWR 캐시와 동기화)
  const currentSidebarData = sidebar.selectedItem
    ? data.find(item => item.id === sidebar.selectedItem?.id) ||
      sidebar.selectedItem
    : null;

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              재정 간사 조회
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              대학부 전체 신청자 목록 ({filteredRowCount}명)
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setHelpOpen(true)}
          >
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">재정간사 신청 조회 도움말</span>
          </Button>
        </div>

        <PageHelpPanel
          content={accountRetreatRegistrationHelp}
          open={helpOpen}
          onOpenChange={setHelpOpen}
        />

        {/* 툴바 */}
        <AccountStaffRegistrationTableToolbar
          table={table}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          retreatSlug={retreatSlug}
        />

        {/* ✅ 가상화 테이블 - 사이드바는 상세보기 버튼에서만 열림 */}
        <VirtualizedTable
          table={table}
          estimateSize={50}
          overscan={10}
          className="max-h-[80vh]"
          emptyMessage={
            globalFilter ? "검색 결과가 없습니다." : "표시할 데이터가 없습니다."
          }
        />
      </div>

      {/* ✅ 상세 정보 사이드바 - 최신 데이터로 실시간 동기화 */}
      <DetailSidebar
        open={sidebar.isOpen}
        onOpenChange={sidebar.setIsOpen}
        data={currentSidebarData}
        title="신청자 상세 정보"
        description={data => `${data.name} (${data.department}) 신청 내역`}
      >
        {data => <AccountStaffRegistrationDetailContent data={data} />}
      </DetailSidebar>
    </>
  );
}
