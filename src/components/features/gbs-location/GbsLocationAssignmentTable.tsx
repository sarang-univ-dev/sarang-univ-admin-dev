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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGbsLocationManagement } from "@/hooks/gbs-location/use-gbs-location";
import { useGbsLocationColumns } from "@/hooks/gbs-location/use-gbs-location-columns";
import { GbsLocationAssignmentTableToolbar } from "./GbsLocationAssignmentTableToolbar";
import { GbsLocationTableData } from "@/types/gbs-location";
import { Skeleton } from "@/components/ui/skeleton";

interface GbsLocationAssignmentTableProps {
  retreatSlug: string;
}

/**
 * GBS 장소 배정 테이블 (TanStack Table)
 *
 * Features:
 * - TanStack Table + VirtualizedTable
 * - 정렬 및 필터링 (UnifiedColumnHeader)
 * - 통합 검색 (Lodash debounce)
 * - 인라인 장소 편집 (LocationCombobox)
 * - Optimistic update로 즉시 UI 반영
 */
export function GbsLocationAssignmentTable({
  retreatSlug,
}: GbsLocationAssignmentTableProps) {
  // 통합 Hook 사용
  const {
    gbsList,
    availableLocations,
    isLoading,
    isMutating,
    error,
    assignLocation,
  } = useGbsLocationManagement(retreatSlug);

  // TanStack Table State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  // 컬럼 정의 Hook
  const columns = useGbsLocationColumns({
    availableLocations,
    assignLocation,
    isMutating,
  });

  // 데이터 변환 (GbsLocationItem → GbsLocationTableData)
  const data = useMemo<GbsLocationTableData[]>(
    () =>
      gbsList.map((item) => ({
        id: item.id,
        number: item.number,
        memo: item.memo || null,
        location: item.location || null,
      })),
    [gbsList]
  );

  // TanStack Table 초기화
  const table = useReactTable<GbsLocationTableData>({
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
    enableMultiSort: true,
    enableSortingRemoval: true,
    enableColumnFilters: true,
    enableFilters: true,
    isMultiSortEvent: () => true,
    globalFilterFn: (row, columnId, filterValue) => {
      const searchableFields = [
        row.original.number?.toString(),
        row.original.memo,
        row.original.location,
      ];

      return searchableFields.some((field) =>
        field?.toLowerCase().includes(filterValue.toLowerCase())
      );
    },
  });

  // 필터링된 행 수
  const filteredRowCount = table.getRowModel().rows.length;

  // 로딩 상태
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">GBS 장소 배정</CardTitle>
          <CardDescription>로딩 중...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">GBS 장소 배정</CardTitle>
          <CardDescription className="text-red-500">
            에러가 발생했습니다: {error.message}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">GBS 장소 배정</CardTitle>
        <CardDescription>
          GBS별로 숙소 장소를 배정할 수 있습니다. ({filteredRowCount}개)
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pt-4">
        {/* 툴바 */}
        <GbsLocationAssignmentTableToolbar
          table={table}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
        />

        {/* 가상화 테이블 */}
        <VirtualizedTable
          table={table}
          estimateSize={60}
          overscan={10}
          className="max-h-[70vh]"
          emptyMessage={
            globalFilter
              ? "검색 결과가 없습니다."
              : "GBS 데이터가 없습니다."
          }
        />
      </CardContent>
    </Card>
  );
}
