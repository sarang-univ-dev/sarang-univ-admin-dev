"use client";

import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  createColumnHelper,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import debounce from "lodash/debounce";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { GenderBadge } from "@/components/Badge";
import { LeaderAttendanceBadge } from "@/components/common/retreat";
import {
  UnifiedColumnHeader,
  VirtualizedTable,
} from "@/components/common/table";
import { Input } from "@/components/ui/input";
import { useLeaderMemberMemos } from "@/hooks/leader-report/use-leader-member-memos";
import { ILeaderMemberMemo } from "@/types/leader-report";

interface LeaderMemberMemoTableProps {
  retreatSlug: string;
  selectedDate?: string | null;
  title?: string;
}

const columnHelper = createColumnHelper<ILeaderMemberMemo>();

/**
 * 리더 비고(특이사항) 모아보기 (리더보고서 간사 / LEADER_STAFF)
 *
 * - 선택된 일자에 리더가 남긴 비고가 있는 조원만 (오늘 일정 유무 무관)
 * - 다른 탭(출석/제출현황)과 동일한 VirtualizedTable + 검색/정렬 패턴
 */
export function LeaderMemberMemoTable({
  retreatSlug,
  selectedDate,
  title,
}: LeaderMemberMemoTableProps) {
  const { memos, date } = useLeaderMemberMemos(
    retreatSlug,
    selectedDate ?? undefined
  );

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  const debouncedSetGlobalFilter = useMemo(
    () => debounce((value: string) => setGlobalFilter(value), 200),
    []
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("univGroupNumber", {
        id: "univGroupNumber",
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="부서"
            enableSorting
            enableFiltering
            formatFilterValue={value => `${value}부`}
          />
        ),
        cell: info => (
          <div className="text-center text-sm whitespace-nowrap shrink-0 px-1">
            {info.getValue()}부
          </div>
        ),
        filterFn: "arrIncludesSome",
      }),
      columnHelper.accessor("gradeNumber", {
        id: "gradeNumber",
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="학년"
            enableSorting
            enableFiltering
            formatFilterValue={value => `${value}학년`}
          />
        ),
        cell: info => (
          <div className="text-center text-sm whitespace-nowrap shrink-0 px-1">
            {info.getValue()}학년
          </div>
        ),
        filterFn: "arrIncludesSome",
      }),
      columnHelper.accessor("gender", {
        id: "gender",
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="성별"
            enableFiltering
            formatFilterValue={value => (value === "MALE" ? "남" : "여")}
          />
        ),
        cell: info => (
          <div className="flex justify-center shrink-0 px-1">
            <GenderBadge gender={info.getValue()} />
          </div>
        ),
        filterFn: "arrIncludesSome",
      }),
      columnHelper.accessor("name", {
        id: "name",
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="이름"
            enableSorting
          />
        ),
        cell: info => (
          <div className="font-medium text-center text-sm whitespace-nowrap shrink-0 px-1">
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor("gbsNumber", {
        id: "gbsNumber",
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="GBS"
            enableSorting
            enableFiltering
          />
        ),
        cell: info => (
          <div className="text-center text-sm whitespace-nowrap shrink-0 px-1">
            {info.getValue() ?? "-"}
          </div>
        ),
        filterFn: "arrIncludesSome",
      }),
      columnHelper.accessor("attendanceStatus", {
        id: "attendanceStatus",
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="출석"
            enableFiltering
            formatFilterValue={value =>
              value === "PRESENT"
                ? "출석"
                : value === "ABSENT"
                  ? "결석"
                  : "미체크"
            }
          />
        ),
        cell: info => (
          <div className="flex justify-center shrink-0 px-1">
            <LeaderAttendanceBadge status={info.getValue()} />
          </div>
        ),
        filterFn: "arrIncludesSome",
      }),
      columnHelper.accessor("memo", {
        id: "memo",
        enableSorting: false,
        header: ({ column, table }) => (
          <UnifiedColumnHeader column={column} table={table} title="비고" />
        ),
        cell: info => (
          <div className="text-sm whitespace-pre-wrap break-keep px-2 py-1 min-w-[200px] text-left">
            {info.getValue()}
          </div>
        ),
      }),
    ],
    []
  );

  const table = useReactTable<ILeaderMemberMemo>({
    data: memos,
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
    enableMultiSort: true,
    enableSortingRemoval: true,
    isMultiSortEvent: () => true,
    globalFilterFn: (row, _columnId, filterValue) => {
      const fields = [
        row.original.name,
        row.original.memo,
        `${row.original.univGroupNumber}부`,
        `${row.original.gradeNumber}학년`,
        `${row.original.gbsNumber}`,
      ];
      return fields.some(field =>
        field?.toLowerCase().includes(String(filterValue).toLowerCase())
      );
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {title ?? "전체 비고"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            해당 일자 비고가 있는 전체 조원 기준 · 기준 일자: {date ?? "-"}
          </p>
        </div>
        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200">
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
            비고 {memos.length}건
          </span>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="검색 (이름, 비고, 부서, 학년, GBS)..."
          className="pl-8 pr-4 py-2 border-gray-200 focus:border-primary focus:ring-primary rounded-md"
          defaultValue={globalFilter}
          onChange={e => debouncedSetGlobalFilter(e.target.value)}
        />
      </div>

      <VirtualizedTable
        table={table}
        estimateSize={56}
        overscan={10}
        className="max-h-[70vh]"
        emptyMessage={
          globalFilter
            ? "검색 결과가 없습니다."
            : "해당 일자에 등록된 비고가 없습니다."
        }
      />
    </div>
  );
}
