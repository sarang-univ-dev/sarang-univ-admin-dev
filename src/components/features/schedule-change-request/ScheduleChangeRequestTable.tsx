"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
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
import { DetailSidebar } from "@/components/common/detail-sidebar";
import { useScheduleChangeRequest } from "@/hooks/schedule-change-request/use-schedule-change-request";
import {
  useScheduleChangeRequestColumns,
  ScheduleChangeRequestTableData,
} from "@/hooks/schedule-change-request/use-schedule-change-request-columns";
import { ScheduleChangeRequestTableToolbar } from "./ScheduleChangeRequestTableToolbar";
import { ScheduleChangeRequestDetailContent } from "./ScheduleChangeRequestDetailContent";
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
 * - 정렬, 필터링
 * - 통합 검색
 * - 일정 변경 처리 모달
 * - 처리 완료 기능
 * - Card wrap 제거
 * - 금액, 신청 시각, 메모 작성자명, 메모 작성 시각은 Detail Sidebar에 표시
 * - VirtualizedTable 사용
 */
export function ScheduleChangeRequestTable({
  initialData,
  schedules,
  payments,
  retreatSlug,
}: ScheduleChangeRequestTableProps) {
  // SWR로 실시간 데이터 동기화 (initialData를 fallback으로)
  const {
    scheduleChangeRequests,
    approveScheduleChange,
    resolveScheduleChange,
  } = useScheduleChangeRequest(retreatSlug, {
    fallbackData: initialData,
  });

  // 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] =
    useState<ScheduleChangeRequestTableData | null>(null);
  const [retreatInfo, setRetreatInfo] = useState<any>(null);

  // Detail Sidebar State
  const [sidebarData, setSidebarData] =
    useState<ScheduleChangeRequestTableData | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // TanStack Table State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  // Retreat info 가져오기 (금액 계산에 필요)
  useEffect(() => {
    const getRetreatInfo = async () => {
      try {
        const response = await webAxios.get(
          `/api/v1/retreat/${retreatSlug}/info`
        );
        setRetreatInfo(response.data.retreatInfo);
      } catch (error) {
        console.error("Retreat 조회 중 오류 발생:", error);
      }
    };
    getRetreatInfo();
  }, [retreatSlug]);

  // 행 클릭 핸들러 (DetailSidebar 열기)
  const handleRowClick = useCallback((row: ScheduleChangeRequestTableData) => {
    setSidebarData(row);
    setIsSidebarOpen(true);
  }, []);

  // 일정 처리 버튼 클릭 핸들러
  const handleProcessSchedule = useCallback(
    (row: ScheduleChangeRequestTableData) => {
      setSelectedRow(row);
      setIsModalOpen(true);
    },
    []
  );

  // 처리 완료 버튼 클릭 핸들러
  const handleResolveSchedule = useCallback(
    (row: ScheduleChangeRequestTableData) => {
      if (!row.memoId) {
        return;
      }
      resolveScheduleChange(row.memoId);
    },
    [resolveScheduleChange]
  );

  // 모달 확인 핸들러
  const handleModalConfirm = async (data: {
    scheduleIds: number[];
    calculatedAmount: number;
    selectedPaymentScheduleId?: number;
  }) => {
    if (!selectedRow) return;
    await approveScheduleChange(selectedRow.id, data.scheduleIds, data.selectedPaymentScheduleId);
  };

  // 컬럼 훅으로 컬럼 정의 가져오기
  const columns = useScheduleChangeRequestColumns(
    schedules,
    handleRowClick,
    handleProcessSchedule,
    handleResolveSchedule
  );

  // useMemo로 data 메모이제이션
  const data = useMemo(
    () =>
      transformScheduleChangeRequestForTable(scheduleChangeRequests, schedules),
    [scheduleChangeRequests, schedules]
  );

  // TanStack Table 초기화
  const table = useReactTable<ScheduleChangeRequestTableData>({
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
    // Multi-sort 및 필터 활성화
    enableMultiSort: true,
    enableSortingRemoval: true,
    enableColumnFilters: true,
    enableFilters: true,
    // 모든 클릭을 multi-sort event로 처리 (Shift 키 불필요)
    isMultiSortEvent: () => true,
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
      <div className="space-y-4">
        {/* 헤더 */}
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            일정 변경 요청 조회
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            전체 요청 목록 ({table.getFilteredRowModel().rows.length}건)
          </p>
        </div>

        {/* 툴바 */}
        <ScheduleChangeRequestTableToolbar
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
        />

        {/* 가상화 테이블 */}
        <VirtualizedTable
          table={table}
          estimateSize={50}
          overscan={10}
          className="max-h-[70vh]"
          emptyMessage={
            globalFilter
              ? "검색 결과가 없습니다."
              : "표시할 데이터가 없습니다."
          }
        />
      </div>

      {/* Detail Sidebar */}
      <DetailSidebar
        open={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
        data={sidebarData}
        title="상세 정보"
      >
        {(data) => (
          <ScheduleChangeRequestDetailContent
            data={data}
            schedules={schedules}
          />
        )}
      </DetailSidebar>

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
