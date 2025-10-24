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

interface UnivGroupAdminStaffTableToolbarProps {
  table: Table<any>;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  retreatSlug: string;
}

/**
 * 테이블 툴바 컴포넌트
 * - Lodash debounce 검색 (300ms)
 * - 열 가시성 토글
 * - 엑셀 다운로드
 */
export function UnivGroupAdminStaffTableToolbar({
  table,
  globalFilter,
  setGlobalFilter,
  retreatSlug,
}: UnivGroupAdminStaffTableToolbarProps) {
  const addToast = useToastStore((state) => state.add);
  const [isDownloading, setIsDownloading] = useState(false);

  // ✅ Lodash debounce를 useMemo로 메모이제이션 (Best Practice)
  const debouncedSetGlobalFilter = useMemo(
    () =>
      debounce((value: string) => {
        setGlobalFilter(value);
      }, 300),
    [setGlobalFilter]
  );

  // ✅ useEffect cleanup으로 메모리 누수 방지 (Best Practice)
  useEffect(() => {
    return () => {
      debouncedSetGlobalFilter.cancel();
    };
  }, [debouncedSetGlobalFilter]);

  const handleExcelDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await webAxios.get(
        `/api/v1/retreat/${retreatSlug}/registration/download-univ-group-registration-excel`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `수양회_부서_신청현황_${formatDate(new Date().toISOString())}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

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
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex items-center justify-between space-x-2 mb-4">
      {/* 검색 (Lodash Debounce) */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="통합 검색 (이름, 부서, 전화번호, 리더명, GBS, 숙소 등)..."
          defaultValue={globalFilter ?? ""}
          onChange={(e) => debouncedSetGlobalFilter(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="flex items-center space-x-2">
        {/* 열 가시성 토글 (TanStack Table) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              열 설정
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            {table
              .getAllLeafColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                // 컬럼 ID에서 표시 이름 추출
                const getColumnName = (id: string) => {
                  if (id.startsWith("schedule_")) return "스케줄";
                  const names: Record<string, string> = {
                    department: "부서",
                    gender: "성별",
                    grade: "학년",
                    name: "이름",
                    phone: "전화번호",
                    currentLeaderName: "부서 리더명",
                    type: "타입",
                    amount: "금액",
                    createdAt: "신청시각",
                    status: "입금 현황",
                    confirmedBy: "처리자명",
                    paymentConfirmedAt: "처리시각",
                    gbs: "GBS",
                    accommodation: "숙소",
                    shuttleBus: "셔틀버스",
                    scheduleMemo: "일정 변동 메모",
                    adminMemo: "행정간사 메모",
                  };
                  return names[id] || id;
                };

                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {getColumnName(column.id)}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 엑셀 다운로드 */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExcelDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          엑셀 다운로드
        </Button>
      </div>
    </div>
  );
}
