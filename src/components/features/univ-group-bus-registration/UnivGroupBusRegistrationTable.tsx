"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
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
import { ColumnHeader } from "@/components/common/table/ColumnHeader";
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
  const columns = useMemo(() => {
    const staticColumns = [
      columnHelper.accessor("gender", {
        id: "gender",
        header: ({ column, table }) => (
          <ColumnHeader
            column={column}
            table={table}
            title="성별"
            enableSorting
            enableFiltering
            formatFilterValue={(value) => (value === "MALE" ? "남" : "여")}
          />
        ),
        cell: (info) => (
          <div className="flex justify-center">
            <GenderBadge gender={info.getValue()} />
          </div>
        ),
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
          if (!value || !Array.isArray(value) || value.length === 0) return true;
          return value.includes(row.getValue(id));
        },
      }),
      columnHelper.accessor("gradeNumber", {
        id: "grade",
        header: ({ column, table }) => (
          <ColumnHeader
            column={column}
            table={table}
            title="학년"
            enableSorting
            enableFiltering
            formatFilterValue={(value) => `${value}학년`}
          />
        ),
        cell: (info) => <div className="text-center">{`${info.getValue()}학년`}</div>,
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
          if (!value || !Array.isArray(value) || value.length === 0) return true;
          const gradeNumber = row.getValue(id) as number;
          return value.includes(gradeNumber);
        },
      }),
      columnHelper.accessor("name", {
        id: "name",
        header: ({ column, table }) => (
          <ColumnHeader
            column={column}
            table={table}
            title="이름"
            enableSorting
            enableFiltering
          />
        ),
        cell: (info) => <div className="text-center">{info.getValue()}</div>,
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
          if (!value || !Array.isArray(value) || value.length === 0) return true;
          return value.includes(row.getValue(id));
        },
      }),
      columnHelper.accessor("userPhoneNumber", {
        id: "phone",
        header: ({ column, table }) => (
          <ColumnHeader
            column={column}
            table={table}
            title="전화번호"
            enableSorting
            enableFiltering
          />
        ),
        cell: (info) => <div className="text-center">{info.getValue() || "-"}</div>,
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
          if (!value || !Array.isArray(value) || value.length === 0) return true;
          return value.includes(row.getValue(id));
        },
      }),
      // ✅ 신청 버스 컬럼 (chip/badge로 표시)
      columnHelper.accessor("userRetreatShuttleBusRegistrationScheduleIds", {
        id: "selected-buses",
        header: ({ column, table }) => {
          // 버스 스케줄 ID를 이름으로 포맷
          const formatBusValue = (value: number) => {
            const schedule = scheduleColumnsWithColor.find(s => s.id === value);
            return schedule ? schedule.label : String(value);
          };

          // 버스를 시간 순서대로 정렬
          const sortBusByTime = (a: number, b: number) => {
            const indexA = scheduleColumnsWithColor.findIndex(s => s.id === a);
            const indexB = scheduleColumnsWithColor.findIndex(s => s.id === b);
            return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
          };

          return (
            <ColumnHeader
              column={column}
              table={table}
              title="신청 버스"
              enableSorting
              enableFiltering
              formatFilterValue={formatBusValue}
              sortFilterValues={sortBusByTime}
            />
          );
        },
        cell: (info) => {
          const selectedIds = info.getValue() || [];
          const selectedSchedules = scheduleColumnsWithColor.filter((s) =>
            selectedIds.includes(s.id)
          );

          if (selectedSchedules.length === 0) {
            return <div className="text-center"><span className="text-sm text-muted-foreground">-</span></div>;
          }

          return (
            <div className="flex justify-center py-1">
              <div className="grid grid-cols-2 gap-1">
                {selectedSchedules.map((schedule) => (
                  <Badge
                    key={schedule.id}
                    variant="outline"
                    className={cn(
                      "text-xs whitespace-nowrap shrink-0 justify-center",
                      getChipColorClass(schedule.color)
                    )}
                  >
                    {schedule.label}
                  </Badge>
                ))}
              </div>
            </div>
          );
        },
        enableSorting: true,
        enableColumnFilter: true,
        // 정렬: 신청한 버스 개수 기준 → 개수 같으면 각 버스 순차적 비교
        sortingFn: (rowA, rowB, columnId) => {
          const idsA = (rowA.getValue(columnId) as number[]) || [];
          const idsB = (rowB.getValue(columnId) as number[]) || [];

          // 1차 정렬: 신청한 버스 개수 (많은 순 → 적은 순)
          const countDiff = idsA.length - idsB.length;
          if (countDiff !== 0) {
            return countDiff;
          }

          // 2차 정렬: 개수가 같으면 각 버스를 순차적으로 비교
          // 가장 이른 버스부터 비교하고, 같으면 다음 버스 비교
          const maxLength = Math.max(idsA.length, idsB.length);

          for (let i = 0; i < maxLength; i++) {
            const idA = idsA[i];
            const idB = idsB[i];

            // 한쪽이 버스가 없으면 (배열 길이가 다른 경우)
            if (idA === undefined) return 1;  // A가 없으면 B가 앞
            if (idB === undefined) return -1; // B가 없으면 A가 앞

            // schedules에서 각 ID의 인덱스를 찾아 시간 순서 비교
            const indexA = scheduleColumnsWithColor.findIndex(s => s.id === idA);
            const indexB = scheduleColumnsWithColor.findIndex(s => s.id === idB);

            const diff = (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);

            // 다르면 그 결과 반환, 같으면 다음 버스 비교
            if (diff !== 0) {
              return diff;
            }
          }

          return 0; // 모든 버스가 같으면 동일
        },
        filterFn: (row, id, value) => {
          if (!value || !Array.isArray(value) || value.length === 0) return true;
          const userScheduleIds = row.getValue(id) as number[];
          if (!userScheduleIds || userScheduleIds.length === 0) return false;
          // 선택된 필터 값 중 하나라도 사용자의 스케줄에 포함되어 있으면 true
          return value.some(filterId => userScheduleIds.includes(filterId));
        },
      }),
    ];

    const endColumns = [
      columnHelper.accessor("shuttleBusPaymentStatus", {
        id: "status",
        header: ({ column, table }) => {
          const formatStatusValue = (value: string) => {
            const statusMap: Record<string, string> = {
              PENDING: "입금 확인 대기",
              PAID: "입금 확인 완료",
              REFUND_REQUEST: "환불 요청",
              REFUNDED: "환불 완료",
            };
            return statusMap[value] || value;
          };

          return (
            <ColumnHeader
              column={column}
              table={table}
              title="입금 현황"
              enableSorting
              enableFiltering
              formatFilterValue={formatStatusValue}
            />
          );
        },
        cell: (info) => (
          <div className="flex justify-center">
            <StatusBadge status={info.getValue()} />
          </div>
        ),
        enableSorting: true,
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
          if (!value || !Array.isArray(value) || value.length === 0) return true;
          return value.includes(row.getValue(id));
        },
      }),
      columnHelper.display({
        id: "detail",
        header: () => <div className="text-center">상세보기</div>,
        cell: (props) => (
          <div className="flex justify-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => sidebar.open(props.row.original)}
              className="flex items-center gap-1.5 text-xs h-7"
            >
              <Eye className="h-3 w-3" />
              <span>보기</span>
            </Button>
          </div>
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
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
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
    ? registrations.find((item) => item.id === sidebar.selectedItem?.id) ?? sidebar.selectedItem
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
            scheduleColumnsWithColor={scheduleColumnsWithColor}
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
