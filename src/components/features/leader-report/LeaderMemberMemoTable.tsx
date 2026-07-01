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
import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx-js-style";

import { GenderBadge } from "@/components/Badge";
import { LeaderAttendanceBadge } from "@/components/common/retreat";
import {
  UnifiedColumnHeader,
  VirtualizedTable,
} from "@/components/common/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLeaderMemberMemos } from "@/hooks/leader-report/use-leader-member-memos";
import { ILeaderMemberMemo } from "@/types/leader-report";

interface LeaderMemberMemoTableProps {
  retreatSlug: string;
  selectedDate?: string | null;
  title?: string;
}

const columnHelper = createColumnHelper<ILeaderMemberMemo>();

function formatGender(gender: ILeaderMemberMemo["gender"]) {
  return gender === "MALE" ? "남" : "여";
}

function formatAttendanceStatus(status: ILeaderMemberMemo["attendanceStatus"]) {
  if (status === "PRESENT") return "출석 O";
  if (status === "ABSENT") return "출석 X";
  return "미체크";
}

function downloadLeaderMemberMemoExcel(
  rows: ILeaderMemberMemo[],
  date: string | null | undefined
) {
  const header = ["부서", "학년", "성별", "이름", "GBS", "출석", "비고"];
  const aoa = [
    ["리더 전체 비고"],
    [`기준 일자: ${date ?? "-"} / 총 ${rows.length}건`],
    [],
    header,
    ...rows.map(row => [
      `${row.univGroupNumber}부`,
      `${row.gradeNumber}학년`,
      formatGender(row.gender),
      row.name,
      row.gbsNumber ?? "-",
      formatAttendanceStatus(row.attendanceStatus),
      row.memo,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 14 },
    { wch: 10 },
    { wch: 12 },
    { wch: 48 },
  ];
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: header.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: header.length - 1 } },
  ];

  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1:G1");
  for (let c = range.s.c; c <= range.e.c; c += 1) {
    const headerCell = ws[XLSX.utils.encode_cell({ r: 3, c })];
    if (headerCell) {
      headerCell.s = {
        font: { bold: true, color: { rgb: "111827" } },
        fill: { fgColor: { rgb: "E5E7EB" } },
        alignment: { horizontal: "center" },
      };
    }
  }

  for (let r = 4; r <= range.e.r; r += 1) {
    const memoCell = ws[XLSX.utils.encode_cell({ r, c: 6 })];
    if (memoCell) {
      memoCell.s = {
        alignment: { vertical: "top", wrapText: true },
      };
    }
  }

  if (ws.A1) {
    ws.A1.s = { font: { bold: true, sz: 16, color: { rgb: "111827" } } };
  }
  if (ws.A2) {
    ws.A2.s = { font: { color: { rgb: "374151" } } };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "전체 비고");
  XLSX.writeFile(
    wb,
    `리더_전체_비고_${date ?? new Date().toISOString().split("T")[0]}.xlsx`
  );
}

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

  const handleDownload = () => {
    downloadLeaderMemberMemoExcel(
      table.getRowModel().rows.map(row => row.original),
      date
    );
  };

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

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="검색 (이름, 비고, 부서, 학년, GBS)..."
            className="pl-8 pr-4 py-2 border-gray-200 focus:border-primary focus:ring-primary rounded-md"
            defaultValue={globalFilter}
            onChange={e => debouncedSetGlobalFilter(e.target.value)}
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleDownload}
          className="h-8 gap-1.5 whitespace-nowrap self-start md:self-auto"
        >
          <Download className="h-4 w-4" />
          엑셀 다운로드
        </Button>
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
