"use client";

import {
  ColumnFiltersState,
  FilterFn,
  SortingState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import debounce from "lodash/debounce";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { GenderBadge } from "@/components/Badge";
import { UnifiedColumnHeader } from "@/components/common/table";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LineupUnivGroupAdminStaffMemo } from "@/hooks/gbs-line-up/use-lineup-univ-group-admin-staff-memos";
import { formatDate } from "@/utils/formatDate";

interface LineupUnivGroupAdminStaffMemoTableProps {
  memos: LineupUnivGroupAdminStaffMemo[];
}

const columnHelper = createColumnHelper<LineupUnivGroupAdminStaffMemo>();

const selectedValueFilter: FilterFn<LineupUnivGroupAdminStaffMemo> = (
  row,
  columnId,
  filterValue
) => {
  const selectedValues = filterValue as (string | number)[] | undefined;

  if (!selectedValues?.length) return true;

  const value = row.getValue(columnId);

  if (
    selectedValues.includes("__EMPTY__") &&
    (value === null || value === undefined || value === "")
  ) {
    return true;
  }

  return selectedValues.includes(value as string | number);
};

export function LineupUnivGroupAdminStaffMemoTable({
  memos,
}: LineupUnivGroupAdminStaffMemoTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: false },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo(
    () => [
      columnHelper.accessor("univGroupNumber", {
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
        cell: ({ getValue }) => `${getValue()}부`,
        filterFn: selectedValueFilter,
      }),
      columnHelper.accessor("gradeNumber", {
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
        cell: ({ getValue }) => `${getValue()}학년`,
        filterFn: selectedValueFilter,
      }),
      columnHelper.accessor("gender", {
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="성별"
            enableSorting
            enableFiltering
            formatFilterValue={value => (value === "MALE" ? "남자" : "여자")}
          />
        ),
        cell: ({ getValue }) => <GenderBadge gender={getValue()} />,
        filterFn: selectedValueFilter,
      }),
      columnHelper.accessor("name", {
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="이름"
            enableSorting
          />
        ),
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue()}</span>
        ),
      }),
      columnHelper.accessor("phoneNumber", {
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="전화번호"
            enableSorting
          />
        ),
        cell: ({ getValue }) => (
          <a
            href={`tel:${getValue()}`}
            className="text-blue-600 hover:underline"
          >
            {getValue()}
          </a>
        ),
      }),
      columnHelper.accessor(row => row.gbsNumber ?? "미배정", {
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
        cell: ({ getValue }) => getValue(),
        filterFn: selectedValueFilter,
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.gbsNumber;
          const b = rowB.original.gbsNumber;

          if (a === null && b === null) return 0;
          if (a === null) return 1;
          if (b === null) return -1;

          return a - b;
        },
      }),
      columnHelper.accessor("currentLeaderName", {
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="현리더"
            enableSorting
            enableFiltering
          />
        ),
        cell: ({ getValue }) => getValue() || "-",
        filterFn: selectedValueFilter,
      }),
      columnHelper.accessor("memo", {
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="메모"
            enableSorting
          />
        ),
        cell: ({ getValue }) => (
          <p className="whitespace-pre-wrap text-sm leading-6">{getValue()}</p>
        ),
      }),
      columnHelper.accessor("createdAdminUserName", {
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="작성자"
            enableSorting
            enableFiltering
          />
        ),
        cell: ({ getValue }) => getValue() || "-",
        filterFn: selectedValueFilter,
      }),
      columnHelper.accessor("createdAt", {
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="생성 시각"
            enableSorting
          />
        ),
        cell: ({ getValue }) => formatDate(getValue()),
        sortingFn: "datetime",
      }),
      columnHelper.accessor("updatedAt", {
        header: ({ column, table }) => (
          <UnifiedColumnHeader
            column={column}
            table={table}
            title="수정 시각"
            enableSorting
          />
        ),
        cell: ({ getValue }) => formatDate(getValue()),
        sortingFn: "datetime",
      }),
    ],
    []
  );

  const table = useReactTable({
    data: memos,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableMultiSort: true,
    enableSortingRemoval: true,
    enableColumnFilters: true,
    enableFilters: true,
    isMultiSortEvent: () => true,
    globalFilterFn: (row, _columnId, filterValue) => {
      const searchValue = String(filterValue ?? "")
        .trim()
        .toLowerCase();

      if (!searchValue) return true;

      const memo = row.original;

      return [
        `${memo.univGroupNumber}부`,
        `${memo.gradeNumber}학년`,
        memo.gender === "MALE" ? "남자" : "여자",
        memo.name,
        memo.phoneNumber,
        memo.currentLeaderName,
        memo.gbsNumber === null ? "미배정" : String(memo.gbsNumber),
        memo.memo,
        memo.createdAdminUserName ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchValue);
    },
  });

  const debouncedSetGlobalFilter = useMemo(
    () => debounce((value: string) => setGlobalFilter(value), 300),
    []
  );

  useEffect(() => {
    return () => {
      debouncedSetGlobalFilter.cancel();
    };
  }, [debouncedSetGlobalFilter]);

  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            defaultValue={globalFilter}
            onChange={event => debouncedSetGlobalFilter(event.target.value)}
            placeholder="통합 검색 (이름, 부서, GBS, 메모 등)..."
            className="pl-8 text-sm"
          />
        </div>
        <div className="text-sm text-gray-500">{rows.length}명</div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader className="bg-gray-100">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead
                    key={header.id}
                    className={
                      header.column.id === "memo"
                        ? "min-w-[280px]"
                        : "whitespace-nowrap"
                    }
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
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="h-32 text-center text-sm text-gray-500"
                >
                  행정간사 메모가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              rows.map(row => (
                <TableRow key={row.original.userRetreatRegistrationId}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell
                      key={cell.id}
                      className={
                        cell.column.id === "memo"
                          ? undefined
                          : cell.column.id === "univGroupNumber" ||
                              cell.column.id === "gradeNumber" ||
                              cell.column.id === "gender" ||
                              cell.column.id === "gbsNumber"
                            ? "whitespace-nowrap text-center"
                            : "whitespace-nowrap"
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
