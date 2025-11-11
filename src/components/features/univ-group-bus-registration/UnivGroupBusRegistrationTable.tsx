"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  createColumnHelper,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { VirtualizedTable } from "@/components/common/table";
import { IUnivGroupBusRegistration } from "@/types/bus-registration";
import { TRetreatShuttleBus } from "@/types";
import { GenderBadge, StatusBadge } from "@/components/Badge-bus";
import { useUnivGroupBusRegistration } from "@/hooks/univ-group-bus-registration/use-univ-group-bus-registration";
import { UnivGroupBusRegistrationTableToolbar } from "./UnivGroupBusRegistrationTableToolbar";
import { UnivGroupBusRegistrationDetailContent } from "./UnivGroupBusRegistrationDetailContent";
import { DetailSidebar, useDetailSidebar } from "@/components/common/detail-sidebar";
import { generateShuttleBusScheduleColumns } from "@/utils/bus-utils";
import { useIsMobile } from "@/hooks/use-media-query";

interface UnivGroupBusRegistrationTableProps {
  initialData: IUnivGroupBusRegistration[];
  schedules: TRetreatShuttleBus[];
  retreatSlug: string;
}

const columnHelper = createColumnHelper<IUnivGroupBusRegistration>();

/**
 * 부서 셔틀버스 등록 테이블 (TanStack Table)
 *
 * Features:
 * - 동적 스케줄 컬럼
 * - 정렬
 * - 통합 검색 (Lodash debounce)
 * - 메모 작성
 * - Detail Sidebar
 * - Timestamp 정보는 테이블에서 제외 (Detail에만 표시)
 */
export function UnivGroupBusRegistrationTable({
  initialData,
  schedules,
  retreatSlug,
}: UnivGroupBusRegistrationTableProps) {
  // ✅ SWR로 실시간 데이터 동기화 + Mutation 함수들
  const {
    data: registrations,
    saveMemo,
    updateMemo,
    deleteMemo,
    isMutating,
  } = useUnivGroupBusRegistration(retreatSlug, {
    initialData,
    revalidateOnFocus: true,
  });

  // ✅ 사이드바 상태 관리
  const sidebar = useDetailSidebar<IUnivGroupBusRegistration>();

  // ✅ 모바일 감지
  const isMobile = useIsMobile();

  // ✅ TanStack Table State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  // ✅ 색상이 포함된 스케줄 컬럼 정보 생성
  const scheduleColumnsWithColor = useMemo(
    () => generateShuttleBusScheduleColumns(schedules),
    [schedules]
  );

  // ✅ 색상 매핑 헬퍼 함수
  const getChipColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      rose: "border-rose-500 bg-rose-50 text-rose-700",
      amber: "border-amber-500 bg-amber-50 text-amber-700",
      teal: "border-teal-500 bg-teal-50 text-teal-700",
      indigo: "border-indigo-500 bg-indigo-50 text-indigo-700",
    };
    return colorMap[color] || "border-gray-500 bg-gray-50 text-gray-700";
  };

  // ✅ 컬럼 정의 (Timestamp 정보 제외)
  const columns = useMemo<ColumnDef<IUnivGroupBusRegistration>[]>(() => {
    const staticColumns: ColumnDef<IUnivGroupBusRegistration>[] = [
      columnHelper.accessor("gender", {
        id: "gender",
        header: "성별",
        cell: (info) => <GenderBadge gender={info.getValue()} />,
      }),
      columnHelper.accessor("gradeNumber", {
        id: "grade",
        header: "학년",
        cell: (info) => `${info.getValue()}학년`,
      }),
      columnHelper.accessor("name", {
        id: "name",
        header: "이름",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("userPhoneNumber", {
        id: "phone",
        header: "전화번호",
        cell: (info) => info.getValue() || "-",
      }),
      // ✅ 신청 버스 컬럼 (chip/badge로 표시)
      columnHelper.accessor("userRetreatShuttleBusRegistrationScheduleIds", {
        id: "selected-buses",
        header: "신청 버스",
        cell: (info) => {
          const selectedIds = info.getValue() || [];
          const selectedSchedules = scheduleColumnsWithColor.filter((s) =>
            selectedIds.includes(s.id)
          );

          if (selectedSchedules.length === 0) {
            return <span className="text-sm text-muted-foreground">-</span>;
          }

          return (
            <div className="grid grid-cols-2 gap-1 py-1">
              {selectedSchedules.map((schedule) => (
                <Badge
                  key={schedule.id}
                  variant="outline"
                  className={cn(
                    "text-xs whitespace-nowrap justify-center",
                    getChipColorClass(schedule.color)
                  )}
                >
                  {schedule.label}
                </Badge>
              ))}
            </div>
          );
        },
      }),
    ];

    const endColumns: ColumnDef<IUnivGroupBusRegistration>[] = [
      columnHelper.accessor("shuttleBusPaymentStatus", {
        id: "status",
        header: "입금 현황",
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      columnHelper.display({
        id: "detail",
        header: "상세 보기",
        cell: (props) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => sidebar.open(props.row.original)}
            className="flex items-center gap-1.5 text-xs h-7"
          >
            <Eye className="h-3 w-3" />
            <span>보기</span>
          </Button>
        ),
      }),
    ];

    return [...staticColumns, ...endColumns];
  }, [scheduleColumnsWithColor, registrations, sidebar]);

  // ✅ TanStack Table 초기화
  const table = useReactTable<IUnivGroupBusRegistration>({
    data: registrations,
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
    // 전역 필터 함수
    globalFilterFn: (row, columnId, filterValue) => {
      const searchableFields = [
        row.original.name,
        `${row.original.univGroupNumber}부`,
        `${row.original.gradeNumber}학년`,
        row.original.userPhoneNumber,
      ];

      return searchableFields.some((field) =>
        field?.toLowerCase().includes(filterValue.toLowerCase())
      );
    },
  });

  // ✅ 사이드바에 표시할 최신 데이터 (SWR 캐시와 동기화)
  const currentSidebarData = sidebar.selectedItem
    ? registrations.find((item) => item.id === sidebar.selectedItem.id) || sidebar.selectedItem
    : null;

  return (
    <>
      <div className="space-y-4">
        {/* 헤더 */}
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            부서 셔틀버스 신청 내역
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            부서 버스 신청자 목록 ({table.getFilteredRowModel().rows.length}명)
          </p>
        </div>

        {/* 툴바 */}
        <UnivGroupBusRegistrationTableToolbar
          table={table}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          retreatSlug={retreatSlug}
        />

        {/* ✅ 가상화 테이블 */}
        <VirtualizedTable
          table={table}
          estimateSize={50}
          overscan={10}
          onRowClick={sidebar.open}
          className="max-h-[80vh]"
          emptyMessage={
            globalFilter
              ? "검색 결과가 없습니다."
              : "표시할 데이터가 없습니다."
          }
        />
      </div>

      {/* ✅ 상세 정보 사이드바 (반응형) - 최신 데이터로 실시간 동기화 */}
      <DetailSidebar
        open={sidebar.isOpen}
        onOpenChange={sidebar.setIsOpen}
        data={currentSidebarData}
        title="신청자 상세 정보"
        description={(data) => `${data.name} (${data.univGroupNumber}부) 버스 신청 내역`}
        side={isMobile ? "bottom" : "right"}
      >
        {(data) => (
          <UnivGroupBusRegistrationDetailContent
            data={data}
            schedules={schedules}
            onSaveMemo={saveMemo}
            onUpdateMemo={updateMemo}
            onDeleteMemo={deleteMemo}
            isMutating={isMutating}
          />
        )}
      </DetailSidebar>
    </>
  );
}
