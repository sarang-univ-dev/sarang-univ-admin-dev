"use client";

import { useMemo, useEffect, useState } from "react";
import { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Search, Settings, Filter, Check, X, Circle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import debounce from "lodash/debounce";
import { webAxios } from "@/lib/api/axios";
import { useToastStore } from "@/store/toast-store";
import { formatDate } from "@/utils/formatDate";
import { GBSLineupRow } from "@/hooks/gbs-line-up/use-gbs-lineup";
import { AxiosError } from "axios";
import { TRetreatRegistrationSchedule } from "@/types";
import { generateScheduleColumns } from "@/utils/retreat-utils";

interface GbsLineUpTableToolbarProps {
  table: Table<GBSLineupRow>;
  retreatSlug: string;
  schedules: TRetreatRegistrationSchedule[];
  scheduleFilter: Record<string, 'none' | 'include' | 'exclude'>;
  setScheduleFilter: (filter: Record<string, 'none' | 'include' | 'exclude'>) => void;
}

/**
 * GBS Line-Up 테이블 툴바
 *
 * @description
 * - 통합 검색 (Lodash debounce 300ms)
 * - 열 가시성 토글
 * - 엑셀 다운로드
 * - 부서/수양회 GBS 꼬리표 다운로드
 *
 * Props: table 인스턴스만 받음 (19개 → 2개!)
 */
export function GbsLineUpTableToolbar({
  table,
  retreatSlug,
  schedules,
  scheduleFilter,
  setScheduleFilter,
}: GbsLineUpTableToolbarProps) {
  const addToast = useToastStore((state) => state.add);
  const [loadingStates, setLoadingStates] = useState({
    exportExcel: false,
    exportDepartmentGbsTags: false,
    exportRetreatGbsTags: false,
  });

  // 스케줄 컬럼 메타데이터 생성
  const scheduleColumnsMeta = useMemo(
    () => generateScheduleColumns(schedules),
    [schedules]
  );

  // ✅ Lodash debounce를 useMemo로 메모이제이션
  const debouncedSetGlobalFilter = useMemo(
    () =>
      debounce((value: string) => {
        table.setGlobalFilter({ search: value });
      }, 300),
    [table]
  );

  // ✅ useEffect cleanup으로 메모리 누수 방지
  useEffect(() => {
    return () => {
      debouncedSetGlobalFilter.cancel();
    };
  }, [debouncedSetGlobalFilter]);

  // 엑셀 다운로드
  const handleDownloadExcel = async () => {
    setLoadingStates((prev) => ({ ...prev, exportExcel: true }));
    try {
      const response = await webAxios.get(
        `/api/v1/retreat/${retreatSlug}/line-up/full-lineup-excel`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `수양회 GBS 라인업_${formatDate(new Date().toISOString())
          .replace(/[: ]/g, "_")
          .replace(/\(/g, "")
          .replace(/\)/g, "")}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      addToast({
        title: "성공",
        description: "엑셀 파일이 다운로드되었습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error("엑셀 다운로드 중 오류 발생:", error);
      addToast({
        title: "오류 발생",
        description: "엑셀 파일 다운로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoadingStates((prev) => ({ ...prev, exportExcel: false }));
    }
  };

  // 부서 GBS 꼬리표 다운로드
  const handleDownloadUnivGbsLabel = async () => {
    addToast({
      title: "안내",
      description: "준비중입니다.",
      variant: "warning",
    });
    // TODO: API 준비 후 활성화
    // setLoadingStates((prev) => ({ ...prev, exportDepartmentGbsTags: true }));
    // try {
    //   const response = await webAxios.get(
    //     `/api/v1/retreat/${retreatSlug}/line-up/univ-gbs-label`,
    //     { responseType: "blob" }
    //   );

    //   const url = window.URL.createObjectURL(new Blob([response.data]));
    //   const link = document.createElement("a");
    //   link.href = url;
    //   link.setAttribute(
    //     "download",
    //     `부서_GBS_꼬리표_${formatDate(new Date().toISOString())}.zip`
    //   );
    //   document.body.appendChild(link);
    //   link.click();
    //   link.remove();
    //   window.URL.revokeObjectURL(url);

    //   addToast({
    //     title: "성공",
    //     description: "부서 GBS 꼬리표 파일이 다운로드되었습니다.",
    //     variant: "success",
    //   });
    // } catch (error) {
    //   console.error("부서 GBS 꼬리표 다운로드 중 오류 발생:", error);
    //   let errorMessage = "부서 GBS 꼬리표 다운로드 중 오류가 발생했습니다.";

    //   if (error instanceof AxiosError && error.response?.data instanceof Blob) {
    //     try {
    //       const text = await error.response.data.text();
    //       const errorData = JSON.parse(text);
    //       errorMessage = errorData.message || errorData.error || errorMessage;
    //     } catch {
    //       errorMessage = `서버 오류: ${error.response.status} ${error.response.statusText}`;
    //     }
    //   }

    //   addToast({
    //     title: "오류 발생",
    //     description: errorMessage,
    //     variant: "destructive",
    //   });
    // } finally {
    //   setLoadingStates((prev) => ({ ...prev, exportDepartmentGbsTags: false }));
    // }
  };

  // 수양회 GBS 꼬리표 다운로드
  const handleDownloadRetreatGbsLabel = async () => {
    addToast({
      title: "안내",
      description: "준비중입니다.",
      variant: "warning",
    });
    // TODO: API 준비 후 활성화
    // setLoadingStates((prev) => ({ ...prev, exportRetreatGbsTags: true }));
    // try {
    //   const response = await webAxios.get(
    //     `/api/v1/retreat/${retreatSlug}/line-up/retreat-gbs-label`,
    //     { responseType: "blob" }
    //   );

    //   const url = window.URL.createObjectURL(new Blob([response.data]));
    //   const link = document.createElement("a");
    //   link.href = url;
    //   link.setAttribute(
    //     "download",
    //     `수양회_GBS_꼬리표_${formatDate(new Date().toISOString())}.zip`
    //   );
    //   document.body.appendChild(link);
    //   link.click();
    //   link.remove();
    //   window.URL.revokeObjectURL(url);

    //   addToast({
    //     title: "성공",
    //     description: "수양회 GBS 꼬리표 파일이 다운로드되었습니다.",
    //     variant: "success",
    //   });
    // } catch (error) {
    //   console.error("수양회 GBS 꼬리표 다운로드 중 오류 발생:", error);
    //   let errorMessage = "수양회 GBS 꼬리표 다운로드 중 오류가 발생했습니다.";

    //   if (error instanceof AxiosError && error.response?.data instanceof Blob) {
    //     try {
    //       const text = await error.response.data.text();
    //       const errorData = JSON.parse(text);
    //       errorMessage = errorData.message || errorData.error || errorMessage;
    //     } catch {
    //       errorMessage = `서버 오류: ${error.response.status} ${error.response.statusText}`;
    //     }
    //   }

    //   addToast({
    //     title: "오류 발생",
    //     description: errorMessage,
    //     variant: "destructive",
    //   });
    // } finally {
    //   setLoadingStates((prev) => ({ ...prev, exportRetreatGbsTags: false }));
    // }
  };

  // ✅ 3-State 토글 함수: none → include → exclude → none
  const toggleScheduleFilter = (scheduleKey: string) => {
    const currentState = scheduleFilter[scheduleKey] || 'none';

    let nextState: 'none' | 'include' | 'exclude';
    if (currentState === 'none') {
      nextState = 'include';
    } else if (currentState === 'include') {
      nextState = 'exclude';
    } else {
      nextState = 'none';
    }

    setScheduleFilter({
      ...scheduleFilter,
      [scheduleKey]: nextState,
    });
  };

  // ✅ 활성화된 필터 개수 계산
  const activeFilterCount = Object.values(scheduleFilter).filter(
    (mode) => mode !== 'none'
  ).length;

  // 컬럼명 매핑 (스케줄 라벨 참조를 위해 useMemo 사용)
  const getColumnName = useMemo(() => {
    const names: Record<string, string> = {
      gbsNumber: "GBS 번호",
      fullAttendanceCount: "전참",
      partialAttendanceCount: "부분참",
      maleCount: "남",
      femaleCount: "여",
      department: "부서",
      gender: "성별",
      grade: "학년",
      name: "이름",
      currentLeader: "부서 리더명",
      phoneNumber: "전화번호",
      lineupMemo: "라인업 메모",
      type: "타입",
      gbsAssign: "GBS 배정하기",
      gbsMemo: "GBS 메모",
      scheduleMemo: "일정변동 요청",
      adminMemo: "행정간사 메모",
      detailInfo: "상세",
    };

    // 스케줄 컬럼 라벨 매핑 추가
    scheduleColumnsMeta.forEach((col) => {
      names[col.key] = col.label;
    });

    return (id: string): string => names[id] || id;
  }, [scheduleColumnsMeta]);

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
      {/* 검색 */}
      <div className="relative flex-1 md:max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="GBS번호/부서/학년/이름/타입/메모로 검색..."
          defaultValue={
            typeof table.getState().globalFilter === 'object'
              ? (table.getState().globalFilter as any).search
              : table.getState().globalFilter ?? ""
          }
          onChange={(e) => debouncedSetGlobalFilter(e.target.value)}
          className="pl-8 text-sm"
        />
      </div>

      {/* 버튼 그룹 */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* ✅ 3-State 일정 필터 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              일정 필터
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-white rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[280px] max-h-[400px] overflow-y-auto">
            <div className="px-2 py-1.5 text-xs text-muted-foreground border-b mb-1">
              <p className="font-medium mb-1">클릭으로 상태 변경:</p>
              <div className="flex items-center gap-3 text-[10px]">
                <div className="flex items-center gap-1">
                  <Circle className="h-3 w-3 text-gray-400" />
                  <span>무시</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-600" />
                  <span>포함</span>
                </div>
                <div className="flex items-center gap-1">
                  <X className="h-3 w-3 text-red-600" />
                  <span>제외</span>
                </div>
              </div>
            </div>
            {scheduleColumnsMeta.map((col) => {
              const filterMode = scheduleFilter[col.key] || 'none';

              return (
                <div
                  key={col.key}
                  className="flex items-center justify-between px-2 py-2 hover:bg-gray-50 cursor-pointer rounded-sm"
                  onClick={() => toggleScheduleFilter(col.key)}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${col.simpleColorClass}`} />
                    <span className="text-sm">{col.label}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {filterMode === 'none' && (
                      <Circle className="h-4 w-4 text-gray-400" />
                    )}
                    {filterMode === 'include' && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-green-50 border border-green-200">
                        <Check className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-xs font-medium text-green-700">포함</span>
                      </div>
                    )}
                    {filterMode === 'exclude' && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 border border-red-200">
                        <X className="h-3.5 w-3.5 text-red-600" />
                        <span className="text-xs font-medium text-red-700">제외</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 열 숨기기 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              열 숨기기
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px] max-h-[400px] overflow-y-auto">
            {table
              .getAllLeafColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  onSelect={(event) => {
                    event.preventDefault();
                  }}
                >
                  {getColumnName(column.id)}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 엑셀 다운로드 */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadExcel}
          disabled={loadingStates.exportExcel}
        >
          {loadingStates.exportExcel ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          엑셀로 내보내기
        </Button>

        {/* 부서 GBS 꼬리표 */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadUnivGbsLabel}
          disabled={loadingStates.exportDepartmentGbsTags}
        >
          {loadingStates.exportDepartmentGbsTags ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          부서 GBS 꼬리표
        </Button>

        {/* 수양회 GBS 꼬리표 */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadRetreatGbsLabel}
          disabled={loadingStates.exportRetreatGbsTags}
        >
          {loadingStates.exportRetreatGbsTags ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          수양회 GBS 꼬리표
        </Button>
      </div>
    </div>
  );
}
