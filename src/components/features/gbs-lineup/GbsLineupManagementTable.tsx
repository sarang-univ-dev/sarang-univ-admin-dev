"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { VirtualizedTable } from "@/components/common/table";
import { useGbsLineupManagement, useGbsLineupColumns } from "@/hooks/gbs-lineup";
import { GbsLineupTableData, GbsLineupRow } from "@/types/gbs-lineup";
import { GbsLineupToolbar } from "./GbsLineupToolbar";
import { GbsLeaderSelectionModal } from "./GbsLeaderSelectionModal";

interface GbsLineupManagementTableProps {
  initialData?: GbsLineupRow[];
  retreatSlug: string;
}

/**
 * GBS 라인업 관리 테이블
 *
 * Features:
 * - TanStack Table 기반 테이블
 * - GBS 생성/삭제
 * - 리더 배정/해제
 * - 인라인 메모 편집 (MemoEditor)
 * - 검색 필터
 */
export function GbsLineupManagementTable({
  initialData,
  retreatSlug,
}: GbsLineupManagementTableProps) {
  // SWR로 데이터 조회 (initialData를 fallback으로)
  const { gbsList, isLoading } = useGbsLineupManagement(retreatSlug, {
    fallbackData: initialData,
  });

  // TanStack Table State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // 리더 선택 모달 상태
  const [leaderModalOpen, setLeaderModalOpen] = useState(false);
  const [selectedGbsNumber, setSelectedGbsNumber] = useState<number | null>(null);

  // 리더 선택 모달 열기
  const handleSelectLeaders = (gbsNumber: number) => {
    setSelectedGbsNumber(gbsNumber);
    setLeaderModalOpen(true);
  };

  // 컬럼 정의
  const columns = useGbsLineupColumns({
    retreatSlug,
    onSelectLeaders: handleSelectLeaders,
  });

  // 데이터 변환 (테이블용)
  const data = useMemo<GbsLineupTableData[]>(
    () =>
      gbsList.map((gbs) => ({
        ...gbs,
        leaderNames: gbs.leaders?.map((l) => l.name).join(", ") || "",
        hasLeaders: (gbs.leaders?.length ?? 0) > 0,
      })),
    [gbsList]
  );

  // TanStack Table 초기화
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // 전역 필터 함수
    globalFilterFn: (row, columnId, filterValue) => {
      const searchFields = [
        String(row.original.number),
        row.original.leaderNames,
        row.original.memo ?? "",
      ];
      return searchFields.some((field) =>
        field.toLowerCase().includes(filterValue.toLowerCase())
      );
    },
  });

  const filteredRowCount = table.getRowModel().rows.length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="text-center text-muted-foreground">
            데이터를 불러오는 중...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* 헤더 */}
        <div>
          <h2 className="text-xl font-semibold tracking-tight">GBS 관리</h2>
          <p className="text-sm text-muted-foreground mt-1">
            GBS 생성/삭제, 리더 지정, 메모 관리 ({filteredRowCount}개)
          </p>
        </div>

        {/* 툴바 */}
        <GbsLineupToolbar table={table} retreatSlug={retreatSlug} />

        {/* 테이블 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">GBS 목록</CardTitle>
            <CardDescription>GBS별 상세 정보, 리더, 메모 관리</CardDescription>
          </CardHeader>
          <CardContent>
            <VirtualizedTable
              table={table}
              estimateSize={60}
              overscan={10}
              className="max-h-[70vh]"
              emptyMessage={
                globalFilter
                  ? "검색 결과가 없습니다."
                  : "GBS가 없습니다. 상단의 'GBS 생성' 버튼을 눌러 생성해주세요."
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* 리더 선택 모달 */}
      <GbsLeaderSelectionModal
        open={leaderModalOpen}
        onOpenChange={setLeaderModalOpen}
        gbsNumber={selectedGbsNumber}
        retreatSlug={retreatSlug}
      />
    </>
  );
}
