"use client";

import { useMemo, useEffect, useState } from "react";
import { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Search, Settings } from "lucide-react";
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

interface GbsLineUpTableToolbarProps {
  table: Table<GBSLineupRow>;
  retreatSlug: string;
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
}: GbsLineUpTableToolbarProps) {
  const addToast = useToastStore((state) => state.add);
  const [loadingStates, setLoadingStates] = useState({
    exportExcel: false,
    exportDepartmentGbsTags: false,
    exportRetreatGbsTags: false,
  });

  // ✅ Lodash debounce를 useMemo로 메모이제이션
  const debouncedSetGlobalFilter = useMemo(
    () =>
      debounce((value: string) => {
        table.setGlobalFilter(value);
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
    setLoadingStates((prev) => ({ ...prev, exportDepartmentGbsTags: true }));
    try {
      const response = await webAxios.get(
        `/api/v1/retreat/${retreatSlug}/line-up/univ-gbs-label`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `부서_GBS_꼬리표_${formatDate(new Date().toISOString())}.zip`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      addToast({
        title: "성공",
        description: "부서 GBS 꼬리표 파일이 다운로드되었습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error("부서 GBS 꼬리표 다운로드 중 오류 발생:", error);
      let errorMessage = "부서 GBS 꼬리표 다운로드 중 오류가 발생했습니다.";

      if (error instanceof AxiosError && error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `서버 오류: ${error.response.status} ${error.response.statusText}`;
        }
      }

      addToast({
        title: "오류 발생",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingStates((prev) => ({ ...prev, exportDepartmentGbsTags: false }));
    }
  };

  // 수양회 GBS 꼬리표 다운로드
  const handleDownloadRetreatGbsLabel = async () => {
    setLoadingStates((prev) => ({ ...prev, exportRetreatGbsTags: true }));
    try {
      const response = await webAxios.get(
        `/api/v1/retreat/${retreatSlug}/line-up/retreat-gbs-label`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `수양회_GBS_꼬리표_${formatDate(new Date().toISOString())}.zip`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      addToast({
        title: "성공",
        description: "수양회 GBS 꼬리표 파일이 다운로드되었습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error("수양회 GBS 꼬리표 다운로드 중 오류 발생:", error);
      let errorMessage = "수양회 GBS 꼬리표 다운로드 중 오류가 발생했습니다.";

      if (error instanceof AxiosError && error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `서버 오류: ${error.response.status} ${error.response.statusText}`;
        }
      }

      addToast({
        title: "오류 발생",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingStates((prev) => ({ ...prev, exportRetreatGbsTags: false }));
    }
  };

  // 컬럼명 매핑
  const getColumnName = (id: string): string => {
    const names: Record<string, string> = {
      gbsNumber: "GBS 번호",
      attendance: "전참/부분참",
      genderCount: "남/여",
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
    };

    // 스케줄 컬럼
    if (id.startsWith("schedule_")) {
      return `스케줄 ${id.replace("schedule_", "")}`;
    }

    return names[id] || id;
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
      {/* 검색 */}
      <div className="relative flex-1 md:max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="GBS번호/부서/학년/이름/타입/메모로 검색..."
          defaultValue={(table.getState().globalFilter as string) ?? ""}
          onChange={(e) => debouncedSetGlobalFilter(e.target.value)}
          className="pl-8 text-sm"
        />
      </div>

      {/* 버튼 그룹 */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* 열 설정 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              열 설정
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
