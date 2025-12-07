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
  getFacetedRowModel,
  getFacetedUniqueValues,
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
import { useGbsLineupSwr } from "@/hooks/gbs-line-up/use-gbs-lineup-swr";
import { Gender, type TRetreatRegistrationSchedule } from "@/types";
import { useGbsLineupColumns } from "@/hooks/gbs-line-up/use-gbs-lineup-columns";
import { GBSLineupRow } from "@/hooks/gbs-line-up/use-gbs-lineup";
import { GbsLineUpTableToolbar } from "./GbsLineUpTableToolbar";
import { DetailSidebar, useDetailSidebar } from "@/components/common/detail-sidebar";
import { GbsLineUpDetailContent } from "./GbsLineUpDetailContent";
import { webAxios } from "@/lib/api/axios";
import { useToastStore } from "@/store/toast-store";

interface GbsLineUpTableProps {
  initialData: IUserRetreatGBSLineup[];
  schedules: TRetreatRegistrationSchedule[];
  retreatSlug: string;
}

/**
 * GBS Line-Up 테이블 (TanStack Table + Virtual Scrolling + SWR)
 *
 * @description
 * - TanStack Table v8 + TanStack Virtual 기반
 * - ✅ SWR + WebSocket으로 실시간 협업 지원
 * - ✅ Optimistic Updates (GBS 번호, 메모)
 * - ✅ 편집 중 버퍼링으로 Stale Data 방지
 * - ✅ Debounce 2초 자동 저장
 * - ✅ Exponential Backoff 재연결
 * - Virtual Scrolling으로 성능 최적화
 * - 리더 행에만 GBS 정보 표시 (하늘색 배경)
 * - 인원 초과 시 빨간색 표시
 */
export const GbsLineUpTable = React.memo(function GbsLineUpTable({
  initialData,
  schedules,
  retreatSlug,
}: GbsLineUpTableProps) {
  // ✅ SWR + WebSocket 통합 Hook (Optimistic Update 지원)
  // Best Practice: initialData를 SWR fallbackData로 전달
  const {
    data: swrData,
    isLoading: swrLoading,
    error: swrError,
    isConnected,
    isMutating,
    saveGbsNumber,
    saveLineupMemo,
    updateLineupMemo,
    deleteLineupMemo,
    refresh,
  } = useGbsLineupSwr(retreatSlug, initialData);

  // ✅ 토스트 훅
  const addToast = useToastStore((state) => state.add);

  // ✅ 데이터 변환
  const data = useMemo<GBSLineupRow[]>(() => {
    const registrations = swrData.length > 0 ? swrData : initialData;

    if (!registrations.length || !schedules.length) {
      return [];
    }

    const transformedData = registrations.map(registration => {
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
        gender: registration.gender as Gender,
        grade: `${registration.gradeNumber}학년`,
        name: registration.name,
        phoneNumber: registration.phoneNumber,
        schedule: scheduleData,
        type: registration.userType,
        isLeader: registration.isLeader,
        isFullAttendance: registration.isFullAttendance,
        currentLeader: registration.currentLeader,
        gbsNumber: registration.gbsNumber,
        gbsMemo: registration.gbsMemo ?? "",
        lineupMemo: registration.lineupMemo ?? "",
        lineupMemoId: registration.lineupMemoId?.toString(),
        lineupMemocolor: registration.lineupMemocolor ?? undefined,
        unresolvedLineupHistoryMemo: registration.unresolvedLineupHistoryMemo ?? undefined,
        adminMemo: registration.adminMemo ?? undefined,
      } satisfies GBSLineupRow;
    });

    return transformedData;
  }, [swrData, initialData, schedules]);

  // ✅ 최신 데이터를 참조하기 위한 ref (스크롤 위치 유지)
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // ✅ 사이드바 상태 관리
  const sidebar = useDetailSidebar<GBSLineupRow>();

  // ✅ TanStack Table 상태
  // 초기 sorting: GBS 번호 오름차순 정렬 (plans 요구사항)
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'gbsNumber', desc: false }
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  // ✅ globalFilter를 객체로 관리 (search + timestamp)
  const [globalFilter, setGlobalFilter] = useState<{ search: string; _trigger?: number }>({ search: "" });
  // ✅ 3-State 필터: { [scheduleKey]: 'none' | 'include' | 'exclude' }
  const [scheduleFilter, setScheduleFilter] = useState<Record<string, 'none' | 'include' | 'exclude'>>({});

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
      // SWR: saveLineupMemo(userRetreatRegistrationId, memo, color)
      await saveLineupMemo(parseInt(id), memo, color);
    },
    [saveLineupMemo]
  );

  const handleUpdateLineupMemo = useCallback(
    async (id: string, memo: string, color?: string) => {
      const currentRow = dataRef.current.find(r => r.id === id);
      const memoId = currentRow?.lineupMemoId;
      if (!memoId) return;

      // SWR: updateLineupMemo(userRetreatRegistrationMemoId, memo, color)
      await updateLineupMemo(parseInt(memoId), memo, color);
    },
    [updateLineupMemo]
  );

  const handleDeleteLineupMemo = useCallback(
    async (id: string) => {
      const currentRow = dataRef.current.find(r => r.id === id);
      const memoId = currentRow?.lineupMemoId;
      if (!memoId) return;

      // SWR: deleteLineupMemo(userRetreatRegistrationMemoId)
      await deleteLineupMemo(parseInt(memoId));
    },
    [deleteLineupMemo]
  );

  // ✅ 일정 변동 요청 메모 핸들러들
  const handleSaveScheduleMemo = useCallback(
    async (id: string, memo: string) => {
      try {
        await webAxios.post(
          `/api/v1/retreat/${retreatSlug}/line-up/${id}/schedule-change-request-memo`,
          { memo: memo.trim() }
        );
        await refresh(); // SWR 캐시 갱신
        addToast({
          title: "성공",
          description: "일정 변동 요청 메모가 저장되었습니다.",
          variant: "success",
        });
      } catch (error) {
        addToast({
          title: "오류",
          description: "일정 변동 요청 메모 저장에 실패했습니다.",
          variant: "destructive",
        });
        throw error;
      }
    },
    [retreatSlug, refresh, addToast]
  );

  const handleUpdateScheduleMemo = useCallback(
    async (id: string, memo: string) => {
      // 일정 변동 요청 메모는 수정 API가 없으므로, 새로 저장
      await handleSaveScheduleMemo(id, memo);
    },
    [handleSaveScheduleMemo]
  );

  const handleDeleteScheduleMemo = useCallback(
    async (id: string) => {
      // 일정 변동 요청 메모 삭제는 resolve-memo API 사용
      const currentRow = dataRef.current.find((r) => r.id === id);
      if (!currentRow) return;

      try {
        // resolve-memo는 userRetreatRegistrationHistoryMemoId가 필요하지만
        // 현재 데이터에 해당 ID가 없으므로 일단 경고 메시지 표시
        addToast({
          title: "안내",
          description: "일정 변동 요청 메모 삭제는 재정 간사 처리 후 자동으로 사라집니다.",
          variant: "default",
        });
      } catch (error) {
        addToast({
          title: "오류",
          description: "일정 변동 요청 메모 삭제에 실패했습니다.",
          variant: "destructive",
        });
        throw error;
      }
    },
    [addToast]
  );

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
  const columns = useGbsLineupColumns(schedules, retreatSlug, data, handlers, sidebar.open);

  // ✅ 전역 필터 함수 (통합 검색 + 3-State 일정 필터)
  const globalFilterFn = useCallback((row: any, columnId: string, filterValue: any) => {
    // filterValue는 { search: string, _trigger?: number } 객체
    const searchTerm = typeof filterValue === 'object' ? filterValue.search : filterValue || "";

    // ✅ 3-State 일정 필터 체크 (클로저로 scheduleFilter 직접 참조)
    for (const [scheduleKey, filterMode] of Object.entries(scheduleFilter)) {
      if (filterMode === 'none') continue; // 무시

      const hasSchedule = row.original.schedule[scheduleKey];

      if (filterMode === 'include' && !hasSchedule) {
        // Include: 반드시 참석해야 함
        return false;
      }

      if (filterMode === 'exclude' && hasSchedule) {
        // Exclude: 반드시 불참해야 함
        return false;
      }
    }

    // 검색어 필터
    if (!searchTerm) return true;

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
        field && field.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [scheduleFilter]);

  // ✅ TanStack Table 초기화
  const table = useReactTable({
    data,
    columns,
    // ✅ WebSocket 업데이트 대응: row.id를 실제 DB ID로 설정 (index 대신)
    // 정렬 후에도 row.id가 안정적으로 유지되어 cell.id가 변경되지 않음
    getRowId: (originalRow) => originalRow.id,
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
    globalFilterFn,
  });

  // ✅ scheduleFilter 변경 시 강제로 재필터링 트리거
  useEffect(() => {
    setGlobalFilter(prev => ({
      search: prev.search,
      _trigger: Date.now() // timestamp로 강제 변경
    }));
  }, [scheduleFilter]);

  // ✅ 통계 계산
  const stats = useMemo(() => {
    const total = data.length;
    const assigned = data.filter(l => l.gbsNumber != null).length;
    const unassigned = data.filter(l => l.gbsNumber == null).length;
    return { total, assigned, unassigned };
  }, [data]);

  // ✅ 사이드바에 표시할 최신 데이터 (SWR/WebSocket 캐시와 동기화)
  const currentSidebarData = sidebar.selectedItem
    ? data.find((item) => item.id === sidebar.selectedItem?.id) ?? sidebar.selectedItem
    : null;

  return (
    <>
      <div className="space-y-4">
      {/* 제목 */}
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight">
            GBS 라인업 현황 조회
          </h2>
          {/* ✅ WebSocket 연결 상태 표시 */}
          {isConnected !== undefined && (
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

      {/* ✅ Toolbar */}
      <GbsLineUpTableToolbar
        table={table}
        retreatSlug={retreatSlug}
        schedules={schedules}
        scheduleFilter={scheduleFilter}
        setScheduleFilter={setScheduleFilter}
      />

      {/* ✅ 가상화 테이블 - 사이드바는 상세보기 버튼에서만 열림 */}
      <VirtualizedTable
        table={table}
        estimateSize={50}
        overscan={10}
        getRowClassName={row =>
          row.isLeader ? "bg-cyan-50 hover:bg-cyan-100" : ""
        }
        className="max-h-[80vh]"
        emptyMessage={
          globalFilter.search ? "검색 결과가 없습니다." : "표시할 데이터가 없습니다."
        }
      />
    </div>

    {/* ✅ 상세 정보 사이드바 */}
    <DetailSidebar
      open={sidebar.isOpen}
      onOpenChange={sidebar.setIsOpen}
      data={currentSidebarData}
      title="상세 정보"
    >
      {(rowData) => (
        <GbsLineUpDetailContent
          data={rowData}
          retreatSlug={retreatSlug}
          schedules={schedules}
          onSaveScheduleMemo={handleSaveScheduleMemo}
          onUpdateScheduleMemo={handleUpdateScheduleMemo}
          onDeleteScheduleMemo={handleDeleteScheduleMemo}
          isMutating={isMutating}
        />
      )}
    </DetailSidebar>
  </>
  );
});
