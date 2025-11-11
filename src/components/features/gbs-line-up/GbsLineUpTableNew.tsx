"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { VirtualizedTable } from "@/components/common/table";
import { useRetreatGbsLineupData, type IUserRetreatGBSLineup } from "@/hooks/gbs-line-up/use-retreat-gbs-lineup-data";
import type { TRetreatRegistrationSchedule } from "@/types";
import { useGbsLineupColumns } from "@/hooks/gbs-line-up/use-gbs-lineup-columns";
import { GBSLineupRow } from "@/hooks/gbs-line-up/use-gbs-lineup";
import { GbsLineUpTableToolbar } from "./GbsLineUpTableToolbar";

interface GbsLineUpTableProps {
  initialData: IUserRetreatGBSLineup[];
  schedules: TRetreatRegistrationSchedule[];
  retreatSlug: string;
}

/**
 * GBS Line-Up 테이블 (TanStack Table + Virtual Scrolling)
 *
 * @description
 * - TanStack Table v8 + TanStack Virtual 기반
 * - SWR Cache Validation으로 실시간 협업 지원
 * - 열 가시성, 정렬, 필터 지원
 * - Virtual Scrolling으로 성능 최적화
 * - 리더 행에만 GBS 정보 표시 (하늘색 배경)
 * - 인원 초과 시 빨간색 표시
 *
 * ✅ Props: 3개 (기존 19개에서 대폭 감소!)
 */
export const GbsLineUpTable = React.memo(function GbsLineUpTable({
  initialData,
  schedules,
  retreatSlug,
}: GbsLineUpTableProps) {
  // ✅ SWR로 실시간 데이터 + Mutation 함수들
  const {
    data: pollingData,
    saveGbsNumber,
    saveLineupMemo,
    updateLineupMemo,
    deleteLineupMemo,
    isMutating,
  } = useRetreatGbsLineupData(retreatSlug, {
    fallbackData: initialData,
  });

  // ✅ 데이터 변환
  const data = useMemo<GBSLineupRow[]>(() => {
    const registrations = pollingData || initialData;
    if (!registrations.length || !schedules.length) return [];

    return registrations.map((registration) => {
      const scheduleData: Record<string, boolean> = {};
      schedules.forEach((schedule) => {
        scheduleData[`schedule_${schedule.id}`] =
          registration.userRetreatRegistrationScheduleIds?.includes(schedule.id) || false;
      });

      return {
        id: registration.id.toString(),
        maleCount: registration.maleCount,
        femaleCount: registration.femaleCount,
        fullAttendanceCount: registration.fullAttendanceCount,
        partialAttendanceCount: registration.partialAttendanceCount,
        department: `${registration.univGroupNumber}부`,
        gender: registration.gender,
        grade: `${registration.gradeNumber}학년`,
        name: registration.name,
        phoneNumber: registration.phoneNumber,
        schedule: scheduleData,
        type: registration.userType,
        isLeader: registration.isLeader,
        isFullAttendance: registration.isFullAttendance,
        currentLeader: registration.currentLeader,
        gbsNumber: registration.gbsNumber,
        gbsMemo: registration.gbsMemo,
        lineupMemo: registration.lineupMemo,
        lineupMemoId: registration.lineupMemoId,
        lineupMemocolor: registration.lineupMemocolor,
        unresolvedLineupHistoryMemo: registration.unresolvedLineupHistoryMemo,
        adminMemo: registration.adminMemo,
      } as GBSLineupRow;
    });
  }, [pollingData, initialData, schedules]);

  // ✅ TanStack Table 상태
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  // ✅ Wrapper 함수들 (컬럼 훅이 기대하는 시그니처에 맞춤)
  const handleSaveGbsNumber = useCallback(
    async (row: GBSLineupRow, value: string) => {
      if (!value.trim() || row.isLeader) return;
      await saveGbsNumber(parseInt(row.id), parseInt(value));
    },
    [saveGbsNumber]
  );

  const handleSaveLineupMemo = useCallback(
    async (id: string, memo: string, color?: string) => {
      await saveLineupMemo(id, memo, color);
    },
    [saveLineupMemo]
  );

  const handleUpdateLineupMemo = useCallback(
    async (id: string, memo: string, color?: string) => {
      const currentRow = data.find((r) => r.id === id);
      const memoId = currentRow?.lineupMemoId;
      if (!memoId) return;
      await updateLineupMemo(memoId, memo, color);
    },
    [updateLineupMemo, data]
  );

  const handleDeleteLineupMemo = useCallback(
    async (id: string) => {
      const currentRow = data.find((r) => r.id === id);
      const memoId = currentRow?.lineupMemoId;
      if (!memoId) return;
      await deleteLineupMemo(memoId);
    },
    [deleteLineupMemo, data]
  );

  // Placeholder handlers (미구현 기능)
  const handleSaveScheduleMemo = useCallback(async (id: string, memo: string) => {
    // 미구현
  }, []);

  const handleUpdateScheduleMemo = useCallback(async (id: string, memo: string) => {
    // 미구현
  }, []);

  const handleDeleteScheduleMemo = useCallback(async (id: string) => {
    // 미구현
  }, []);

  const isLoadingFn = useCallback((id: string, action: string) => isMutating, [isMutating]);

  // ✅ 컬럼 정의
  const columns = useGbsLineupColumns(schedules, retreatSlug, data, {
    onSaveGbsNumber: handleSaveGbsNumber,
    onSaveLineupMemo: handleSaveLineupMemo,
    onUpdateLineupMemo: handleUpdateLineupMemo,
    onDeleteLineupMemo: handleDeleteLineupMemo,
    onSaveScheduleMemo: handleSaveScheduleMemo,
    onUpdateScheduleMemo: handleUpdateScheduleMemo,
    onDeleteScheduleMemo: handleDeleteScheduleMemo,
    isLoading: isLoadingFn,
  });

  // ✅ TanStack Table 초기화
  const table = useReactTable({
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
    // ✅ 전역 필터 함수 (통합 검색)
    globalFilterFn: (row, columnId, filterValue) => {
      const searchableFields = [
        row.original.gbsNumber?.toString(),
        row.original.department,
        row.original.grade,
        row.original.name,
        row.original.phoneNumber,
        row.original.lineupMemo,
        row.original.currentLeader,
      ];

      return searchableFields.some(
        (field) => field && field.toLowerCase().includes(filterValue.toLowerCase())
      );
    },
  });

  return (
    <div className="space-y-4">
      {/* 제목 */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">GBS 라인업 현황 조회</h2>
        <p className="text-sm text-muted-foreground mt-1">
          대학부 전체 GBS 목록 조회 및 배정 ({table.getFilteredRowModel().rows.length}명)
        </p>
      </div>

      {/* ✅ Toolbar (Props 2개만!) */}
      <GbsLineUpTableToolbar table={table} retreatSlug={retreatSlug} />

      {/* ✅ 가상화 테이블 */}
      <VirtualizedTable
        table={table}
        estimateSize={50}
        overscan={10}
        getRowClassName={(row) => row.isLeader ? 'bg-cyan-100' : ''}
        className="max-h-[80vh]"
        emptyMessage={
          globalFilter
            ? "검색 결과가 없습니다."
            : "표시할 데이터가 없습니다."
        }
      />
    </div>
  );
});
