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
import { useLeaderAttendance } from "@/hooks/leader-report/use-leader-attendance";
import { LeaderAdminView } from "@/lib/api/leader-admin-api";
import { ILeaderAttendance, ILeaderTodayInfo } from "@/types/leader-report";

import { LeaderDateControls } from "./LeaderDateControls";

interface LeaderAttendanceTableProps {
  initialAttendance: ILeaderAttendance[];
  initialDate: string | null;
  initialToday: ILeaderTodayInfo;
  retreatSlug: string;
  title?: string;
  selectedDate?: string | null;
  onSelectedDateChange?: (date: string) => void;
  showDateControls?: boolean;
  showTodayControl?: boolean;
  view?: LeaderAdminView;
}

const columnHelper = createColumnHelper<ILeaderAttendance>();

/**
 * 리더 출석 현황 (교육 간사 / EDUCATION_STAFF)
 *
 * - 상단 Card: /admin/today.days 의 일자별 토글 버튼 (현재 today 강조)
 *   클릭 시 PUT /admin/today 후 revalidate
 * - 하단: 선택된 today 기준 멤버 × 출석 상태 배지 테이블
 */
export function LeaderAttendanceTable({
  initialAttendance,
  initialDate,
  initialToday,
  retreatSlug,
  title,
  selectedDate,
  onSelectedDateChange,
  showDateControls = true,
  showTodayControl = true,
  view = "department",
}: LeaderAttendanceTableProps) {
  const [internalSelectedDate, setInternalSelectedDate] = useState(
    initialDate ?? initialToday.today ?? initialToday.days[0] ?? null
  );
  const activeDate = selectedDate ?? internalSelectedDate;
  const setActiveDate = onSelectedDateChange ?? setInternalSelectedDate;

  const { attendance, date } = useLeaderAttendance(
    retreatSlug,
    activeDate ?? undefined,
    view,
    {
      fallbackData:
        activeDate === initialDate && initialDate != null
          ? { attendance: initialAttendance, date: initialDate }
          : undefined,
    }
  );

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  const debouncedSetGlobalFilter = useMemo(
    () => debounce((value: string) => setGlobalFilter(value), 200),
    []
  );

  const presentCount = useMemo(
    () => attendance.filter(a => a.attendanceStatus === "PRESENT").length,
    [attendance]
  );
  const displayTitle =
    title ?? (view === "all" ? "전체 출석 현황" : "부서별 출석 현황");
  const description =
    view === "all"
      ? "해당 일자 일정이 있는 전체 인원 기준"
      : "해당 일자 일정이 있는 내 부서 인원 기준";

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
    ],
    []
  );

  const table = useReactTable<ILeaderAttendance>({
    data: attendance,
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
    <div className="space-y-5">
      {showDateControls ? (
        <LeaderDateControls
          retreatSlug={retreatSlug}
          selectedDate={activeDate}
          onSelectedDateChange={setActiveDate}
          initialToday={initialToday}
          showTodayControl={showTodayControl}
        />
      ) : null}

      <div className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {displayTitle}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {description} · 기준 일자: {date ?? "-"}
            </p>
          </div>
          <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
            <span className="text-sm font-medium text-green-700 whitespace-nowrap">
              출석 {presentCount} / 전체 {attendance.length}
            </span>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="검색 (이름, 부서, 학년, GBS)..."
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
            globalFilter ? "검색 결과가 없습니다." : "표시할 멤버가 없습니다."
          }
        />
      </div>
    </div>
  );
}
