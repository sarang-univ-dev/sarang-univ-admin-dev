"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
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
import {
  useRetreatGbsLineupData,
  type IUserRetreatGBSLineup,
} from "@/hooks/gbs-line-up/use-retreat-gbs-lineup-data";
import { useWebSocketGbsLineup } from "@/hooks/gbs-line-up/use-websocket-gbs-lineup";
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
  // ✅ WebSocket으로 실시간 데이터 + Mutation 함수들
  // Note: WEBSOCKET_ENABLED 환경 변수로 제어 가능 (기본: WebSocket 사용)
  const useWebSocket = process.env.NEXT_PUBLIC_WEBSOCKET_ENABLED !== "false";

  const pollingHook = useRetreatGbsLineupData(retreatSlug, {
    fallbackData: initialData,
  });

  const websocketHook = useWebSocketGbsLineup(retreatSlug);

  // WebSocket 또는 Polling 선택
  const {
    data: pollingData,
    saveGbsNumber,
    saveLineupMemo,
    updateLineupMemo,
    deleteLineupMemo,
    isMutating,
    isConnected,
  } = useWebSocket
    ? {
        data: websocketHook.data,
        saveGbsNumber: websocketHook.saveGbsNumber,
        saveLineupMemo: websocketHook.saveLineupMemo,
        updateLineupMemo: websocketHook.updateLineupMemo,
        deleteLineupMemo: websocketHook.deleteLineupMemo,
        isMutating: websocketHook.isMutating,
        isConnected: websocketHook.isConnected,
      }
    : {
        data: pollingHook.data,
        saveGbsNumber: pollingHook.saveGbsNumber,
        saveLineupMemo: pollingHook.saveLineupMemo,
        updateLineupMemo: pollingHook.updateLineupMemo,
        deleteLineupMemo: pollingHook.deleteLineupMemo,
        isMutating: pollingHook.isMutating,
        isConnected: undefined,
      };

  // ✅ 데이터 변환
  const data = useMemo<GBSLineupRow[]>(() => {
    const registrations = pollingData || initialData;
    if (!registrations.length || !schedules.length) return [];

    return registrations.map(registration => {
      const scheduleData: Record<string, boolean> = {};
      schedules.forEach(schedule => {
        scheduleData[`schedule_${schedule.id}`] =
          registration.userRetreatRegistrationScheduleIds?.includes(
            schedule.id
          ) || false;
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

  // ✅ 최신 데이터를 참조하기 위한 ref (스크롤 위치 유지)
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // ✅ TanStack Table 상태
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  // ✅ Wrapper 함수들 (컬럼 훅이 기대하는 시그니처에 맞춘 + WebSocket 지원)
  const handleSaveGbsNumber = useCallback(
    async (row: GBSLineupRow, value: string) => {
      if (!value.trim() || row.isLeader) return;
      // WebSocket: saveGbsNumber(userRetreatRegistrationId, gbsNumber)
      // Polling: saveGbsNumber(id, gbsNumber)
      await saveGbsNumber(parseInt(row.id), parseInt(value));
    },
    [saveGbsNumber]
  );

  const handleSaveLineupMemo = useCallback(
    async (id: string, memo: string, color?: string) => {
      // WebSocket: saveLineupMemo(userRetreatRegistrationId, memo, color)
      // Polling: saveLineupMemo(id, memo, color)
      if (useWebSocket) {
        await saveLineupMemo(parseInt(id), memo, color);
      } else {
        await saveLineupMemo(id as any, memo, color);
      }
    },
    [saveLineupMemo, useWebSocket]
  );

  const handleUpdateLineupMemo = useCallback(
    async (id: string, memo: string, color?: string) => {
      const currentRow = dataRef.current.find(r => r.id === id);
      const memoId = currentRow?.lineupMemoId;
      if (!memoId) return;

      // WebSocket: updateLineupMemo(userRetreatRegistrationMemoId, memo, color)
      // Polling: updateLineupMemo(memoId, memo, color)
      if (useWebSocket) {
        await updateLineupMemo(parseInt(memoId), memo, color);
      } else {
        await updateLineupMemo(memoId as any, memo, color);
      }
    },
    [updateLineupMemo, useWebSocket]
  );

  const handleDeleteLineupMemo = useCallback(
    async (id: string) => {
      const currentRow = dataRef.current.find(r => r.id === id);
      const memoId = currentRow?.lineupMemoId;
      if (!memoId) return;

      // WebSocket: deleteLineupMemo(userRetreatRegistrationMemoId)
      // Polling: deleteLineupMemo(memoId)
      if (useWebSocket) {
        await deleteLineupMemo(parseInt(memoId));
      } else {
        await deleteLineupMemo(memoId as any);
      }
    },
    [deleteLineupMemo, useWebSocket]
  );

  // Placeholder handlers (미구현 기능)
  const handleSaveScheduleMemo = useCallback(
    async (id: string, memo: string) => {
      // 미구현
    },
    []
  );

  const handleUpdateScheduleMemo = useCallback(
    async (id: string, memo: string) => {
      // 미구현
    },
    []
  );

  const handleDeleteScheduleMemo = useCallback(async (id: string) => {
    // 미구현
  }, []);

  const isLoadingFn = useCallback(
    (id: string, action: string) => isMutating,
    [isMutating]
  );

  // ✅ handlers 객체 안정화 (스크롤 위치 유지를 위해)
  const handlers = useMemo(
    () => ({
      onSaveGbsNumber: handleSaveGbsNumber,
      onSaveLineupMemo: handleSaveLineupMemo,
      onUpdateLineupMemo: handleUpdateLineupMemo,
      onDeleteLineupMemo: handleDeleteLineupMemo,
      onSaveScheduleMemo: handleSaveScheduleMemo,
      onUpdateScheduleMemo: handleUpdateScheduleMemo,
      onDeleteScheduleMemo: handleDeleteScheduleMemo,
      isLoading: isLoadingFn,
    }),
    [
      handleSaveGbsNumber,
      handleSaveLineupMemo,
      handleUpdateLineupMemo,
      handleDeleteLineupMemo,
      handleSaveScheduleMemo,
      handleUpdateScheduleMemo,
      handleDeleteScheduleMemo,
      isLoadingFn,
    ]
  );

  // ✅ 컬럼 정의
  const columns = useGbsLineupColumns(schedules, retreatSlug, data, handlers);

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
        field =>
          field && field.toLowerCase().includes(filterValue.toLowerCase())
      );
    },
  });

  // ✅ 통계 계산
  const stats = useMemo(() => {
    const total = data.length;
    const assigned = data.filter(l => l.gbsNumber != null).length;
    const unassigned = data.filter(l => l.gbsNumber == null).length;
    return { total, assigned, unassigned };
  }, [data]);

  return (
    <div className="space-y-4">
      {/* 제목 */}
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight">
            GBS 라인업 현황 조회
          </h2>
          {/* ✅ WebSocket 연결 상태 표시 (WebSocket 모드일 때만) */}
          {useWebSocket && isConnected !== undefined && (
            <div className="flex items-center gap-2 text-xs">
              <div
                className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
              />
              <span className="text-muted-foreground">
                {isConnected ? "실시간 연결됨" : "연결 끊김"}
              </span>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          대학부 전체 GBS 목록 조회 및 배정 (
          <span className="font-medium text-foreground">
            전체 {stats.total}명
          </span>
          {" · "}
          <span className="font-medium text-green-600">
            배정 완료 {stats.assigned}명
          </span>
          {" · "}
          <span className="font-medium text-orange-600">
            미배정 {stats.unassigned}명
          </span>
          )
        </p>
      </div>

      {/* ✅ Toolbar (Props 2개만!) */}
      <GbsLineUpTableToolbar table={table} retreatSlug={retreatSlug} />

      {/* ✅ 가상화 테이블 */}
      <VirtualizedTable
        table={table}
        estimateSize={50}
        overscan={10}
        getRowClassName={row =>
          row.isLeader ? "bg-cyan-50 hover:bg-cyan-100" : ""
        }
        className="max-h-[80vh]"
        emptyMessage={
          globalFilter ? "검색 결과가 없습니다." : "표시할 데이터가 없습니다."
        }
      />
    </div>
  );
});
