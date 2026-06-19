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

import { LeaderReportSubmittedBadge } from "@/components/common/retreat";
import {
  UnifiedColumnHeader,
  VirtualizedTable,
} from "@/components/common/table";
import { Input } from "@/components/ui/input";
import { useLeaderReportSubmissionStatus } from "@/hooks/leader-report/use-leader-report-submission-status";
import { LeaderAdminView } from "@/lib/api/leader-admin-api";
import {
  ILeaderReportSubmissionStatus,
  ILeaderTodayInfo,
} from "@/types/leader-report";
import { formatDate } from "@/utils/formatDate";

import { LeaderDateControls } from "./LeaderDateControls";

interface LeaderReportSubmissionStatusTableProps {
  initialData: ILeaderReportSubmissionStatus[];
  initialDate: string | null;
  initialToday: ILeaderTodayInfo;
  retreatSlug: string;
  selectedDate?: string | null;
  onSelectedDateChange?: (date: string) => void;
  showDateControls?: boolean;
  view?: LeaderAdminView;
}

const columnHelper = createColumnHelper<ILeaderReportSubmissionStatus>();

/**
 * 리더 리포트 제출 현황 테이블 (리더보고서 간사 / LEADER_STAFF)
 *
 * - GBS 별 제출 여부 / 리더 명단 / 제출 시각
 * - 상단 요약 "제출 X / 전체 Y"
 */
export function LeaderReportSubmissionStatusTable({
  initialData,
  initialDate,
  initialToday,
  retreatSlug,
  selectedDate,
  onSelectedDateChange,
  showDateControls = true,
  view = "department",
}: LeaderReportSubmissionStatusTableProps) {
  const [internalSelectedDate, setInternalSelectedDate] = useState(
    initialDate ?? initialToday.today ?? initialToday.days[0] ?? null
  );
  const activeDate = selectedDate ?? internalSelectedDate;
  const setActiveDate = onSelectedDateChange ?? setInternalSelectedDate;

  const submissionStatusOptions = useMemo(
    () => ({
      fallbackData:
        activeDate === initialDate && initialDate != null
          ? { submissionStatus: initialData, date: initialDate }
          : undefined,
    }),
    [activeDate, initialData, initialDate]
  );

  const { submissionStatus, date } = useLeaderReportSubmissionStatus(
    retreatSlug,
    activeDate ?? undefined,
    view,
    submissionStatusOptions
  );

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  const debouncedSetGlobalFilter = useMemo(
    () => debounce((value: string) => setGlobalFilter(value), 200),
    []
  );

  const submittedCount = useMemo(
    () => submissionStatus.filter(s => s.submitted).length,
    [submissionStatus]
  );
  const totalCount = submissionStatus.length;
  const title =
    view === "all" ? "전체 보고서 제출현황" : "부서 보고서 제출현황";
  const description =
    view === "all"
      ? "해당 일자 일정이 있는 전체 리더 기준"
      : "해당 일자 일정이 있는 내 부서 리더 기준";

  const columns = useMemo(
    () => [
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
          <div className="font-medium text-center text-sm whitespace-nowrap shrink-0 px-1">
            {info.getValue()}
          </div>
        ),
        filterFn: "arrIncludesSome",
      }),
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
      columnHelper.accessor("leaderName", {
        id: "leaderName",
        header: () => (
          <div className="text-center text-sm whitespace-nowrap">리더</div>
        ),
        cell: info => (
          <div className="text-center text-sm whitespace-nowrap shrink-0 px-2">
            {info.getValue() || "-"}
          </div>
        ),
      }),
      columnHelper.accessor("submitted", {
        id: "submitted",
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="제출 여부"
            enableFiltering
            formatFilterValue={value => (value ? "제출 완료" : "미제출")}
          />
        ),
        cell: info => (
          <div className="flex justify-center shrink-0 px-1">
            <LeaderReportSubmittedBadge submitted={info.getValue()} />
          </div>
        ),
        filterFn: "arrIncludesSome",
      }),
      columnHelper.accessor("submittedAt", {
        id: "submittedAt",
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="제출 시각"
            enableSorting
          />
        ),
        cell: info => (
          <div className="text-center text-sm whitespace-nowrap shrink-0 px-1">
            {info.getValue() ? formatDate(info.getValue()) : "-"}
          </div>
        ),
      }),
    ],
    []
  );

  const table = useReactTable<ILeaderReportSubmissionStatus>({
    data: submissionStatus,
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
        `${row.original.univGroupNumber}부`,
        `${row.original.gbsNumber}`,
        row.original.leaderName,
      ];
      return fields.some(field =>
        field?.toLowerCase().includes(String(filterValue).toLowerCase())
      );
    },
  });

  return (
    <div className="space-y-5">
      {showDateControls ? (
        <LeaderDateControls
          retreatSlug={retreatSlug}
          selectedDate={activeDate}
          onSelectedDateChange={setActiveDate}
          initialToday={initialToday}
          showTodayControl={false}
        />
      ) : null}

      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {description} · 기준 일자: {date ?? "-"}
          </p>
        </div>
        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200">
          <span className="text-sm font-medium text-blue-700 whitespace-nowrap">
            제출 {submittedCount} / 전체 {totalCount}
          </span>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="검색 (부서, GBS, 리더)..."
          className="pl-8 pr-4 py-2 border-gray-200 focus:border-primary focus:ring-primary rounded-md"
          defaultValue={globalFilter}
          onChange={e => debouncedSetGlobalFilter(e.target.value)}
        />
      </div>

      <VirtualizedTable
        table={table}
        estimateSize={52}
        overscan={10}
        className="max-h-[70vh]"
        emptyMessage={
          globalFilter ? "검색 결과가 없습니다." : "표시할 리더가 없습니다."
        }
      />
    </div>
  );
}
