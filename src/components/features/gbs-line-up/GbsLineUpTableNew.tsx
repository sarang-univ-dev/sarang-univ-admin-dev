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
  flexRender,
} from "@tanstack/react-table";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToastStore } from "@/store/toast-store";
import { useRetreatGbsLineupData, type IUserRetreatGBSLineup } from "@/hooks/gbs-line-up/use-retreat-gbs-lineup-data";
import type { TRetreatRegistrationSchedule } from "@/types";
import { webAxios } from "@/lib/api/axios";
import { useGbsLineupColumns } from "@/hooks/gbs-line-up/use-gbs-lineup-columns";
import { GBSLineupRow } from "@/hooks/gbs-line-up/use-gbs-lineup";
import { GbsLineUpTableToolbar } from "./GbsLineUpTableToolbar";

interface GbsLineUpTableProps {
  initialData: IUserRetreatGBSLineup[];
  schedules: TRetreatRegistrationSchedule[];
  retreatSlug: string;
}

/**
 * GBS Line-Up 테이블 (TanStack Table)
 *
 * @description
 * - TanStack Table v8 기반
 * - SWR 2초 polling으로 실시간 협업 지원
 * - 열 가시성, 정렬, 필터 지원
 * - rowSpan 자동 처리
 *
 * ✅ Props: 3개 (기존 19개에서 대폭 감소!)
 */
export const GbsLineUpTable = React.memo(function GbsLineUpTable({
  initialData,
  schedules,
  retreatSlug,
}: GbsLineUpTableProps) {
  const addToast = useToastStore((state) => state.add);

  // ✅ SWR로 실시간 데이터 가져오기 (2초 polling)
  const { data: pollingData } = useRetreatGbsLineupData(retreatSlug, {
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
        id: registration.id,
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
      };
    });
  }, [pollingData, initialData, schedules]);

  // ✅ TanStack Table 상태
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  // ✅ 핸들러
  const lineupEndpoint = `/api/v1/retreat/${retreatSlug}/line-up/user-lineups`;

  const handleSaveGbsNumber = useCallback(
    async (row: GBSLineupRow, value: string) => {
      if (!value.trim() || row.isLeader) return;

      try {
        await webAxios.put(`${lineupEndpoint}/${row.id}`, {
          gbsNumber: parseInt(value),
        });

        addToast({
          title: "성공",
          description: "GBS 번호가 저장되었습니다.",
          variant: "success",
        });
      } catch (error) {
        console.error("GBS 번호 저장 중 오류:", error);
        addToast({
          title: "오류",
          description: "GBS 번호 저장 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    },
    [lineupEndpoint, addToast]
  );

  const handleSaveLineupMemo = useCallback(
    async (id: string, memo: string, color?: string) => {
      try {
        await webAxios.post(`/api/v1/retreat/${retreatSlug}/line-up/${id}/lineup-memo`, {
          memo: memo.trim(),
          color: color || null,
        });

        addToast({
          title: "성공",
          description: "메모가 저장되었습니다.",
          variant: "success",
        });
      } catch (error) {
        addToast({
          title: "오류",
          description: "메모 저장 중 오류가 발생했습니다.",
          variant: "destructive",
        });
        throw error;
      }
    },
    [retreatSlug, addToast]
  );

  const handleUpdateLineupMemo = useCallback(
    async (id: string, memo: string, color?: string) => {
      const currentRow = data.find((r) => r.id.toString() === id);
      const memoId = currentRow?.lineupMemoId;
      if (!memoId) return;

      try {
        await webAxios.put(`/api/v1/retreat/${retreatSlug}/line-up/${memoId}/lineup-memo`, {
          memo: memo.trim(),
          color: color || null,
        });

        addToast({
          title: "성공",
          description: "메모가 수정되었습니다.",
          variant: "success",
        });
      } catch (error) {
        addToast({
          title: "오류",
          description: "메모 수정 중 오류가 발생했습니다.",
          variant: "destructive",
        });
        throw error;
      }
    },
    [retreatSlug, data, addToast]
  );

  const handleDeleteLineupMemo = useCallback(
    async (id: string) => {
      const currentRow = data.find((r) => r.id.toString() === id);
      const memoId = currentRow?.lineupMemoId;
      if (!memoId) return;

      try {
        await webAxios.delete(`/api/v1/retreat/${retreatSlug}/line-up/${memoId}/lineup-memo`);

        addToast({
          title: "성공",
          description: "메모가 삭제되었습니다.",
          variant: "success",
        });
      } catch (error) {
        addToast({
          title: "오류",
          description: "메모 삭제 중 오류가 발생했습니다.",
          variant: "destructive",
        });
        throw error;
      }
    },
    [retreatSlug, data, addToast]
  );

  const handleSaveScheduleMemo = useCallback(
    async (id: string, memo: string) => {
      addToast({
        title: "알림",
        description: "일정 변동 메모 추가 기능은 구현 예정입니다.",
        variant: "default",
      });
    },
    [addToast]
  );

  const handleUpdateScheduleMemo = useCallback(
    async (id: string, memo: string) => {
      addToast({
        title: "알림",
        description: "일정 변동 메모 수정 기능은 구현 예정입니다.",
        variant: "default",
      });
    },
    [addToast]
  );

  const handleDeleteScheduleMemo = useCallback(
    async (id: string) => {
      addToast({
        title: "알림",
        description: "일정 변동 메모 삭제 기능은 구현 예정입니다.",
        variant: "default",
      });
    },
    [addToast]
  );

  const isLoading = useCallback((id: string, action: string) => {
    return false; // TODO: 로딩 상태 구현
  }, []);

  // ✅ 컬럼 정의
  const columns = useGbsLineupColumns(schedules, retreatSlug, data, {
    onSaveGbsNumber: handleSaveGbsNumber,
    onSaveLineupMemo: handleSaveLineupMemo,
    onUpdateLineupMemo: handleUpdateLineupMemo,
    onDeleteLineupMemo: handleDeleteLineupMemo,
    onSaveScheduleMemo: handleSaveScheduleMemo,
    onUpdateScheduleMemo: handleUpdateScheduleMemo,
    onDeleteScheduleMemo: handleDeleteScheduleMemo,
    isLoading,
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

      {/* 테이블 */}
      <div className="border rounded-lg overflow-x-auto">
        <div className="min-w-max">
          <div className="max-h-[80vh] overflow-y-auto">
            <Table className="relative w-full whitespace-nowrap">
              <TableHeader className="sticky top-0 z-10 bg-gray-100">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-center bg-gray-100">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="divide-y divide-gray-200">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="group hover:bg-gray-50 transition-colors duration-150"
                    >
                      {row.getVisibleCells().map((cell) => {
                        const rendered = flexRender(cell.column.columnDef.cell, cell.getContext());

                        // ✅ rowSpan으로 인해 null을 반환하는 셀은 렌더링하지 않음
                        if (rendered === null) {
                          return null;
                        }

                        // ✅ flexRender 결과가 이미 TableCell이므로 직접 반환
                        return <React.Fragment key={cell.id}>{rendered}</React.Fragment>;
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <td colSpan={columns.length} className="h-24 text-center">
                      {globalFilter ? "검색 결과가 없습니다." : "표시할 데이터가 없습니다."}
                    </td>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
});
