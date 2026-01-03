"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Download, Settings } from "lucide-react";
import { debounce } from "lodash";
import { webAxios } from "@/lib/api/axios";
import { useToastStore } from "@/store/toast-store";
import { formatDate } from "@/utils/formatDate";
import { Table } from "@tanstack/react-table";
import { useIsMobile } from "@/hooks/use-media-query";
import { SCHEDULE_TYPE_SHORT_LABELS } from "@/lib/constant/labels";
import { TRetreatRegistrationSchedule } from "@/types";
import { getKSTDay } from "@/lib/utils/date-utils";

interface RetreatPaymentConfirmationTableToolbarProps {
  table: Table<any>;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  retreatSlug: string;
  schedules?: TRetreatRegistrationSchedule[];
}

/**
 * 부서 재정 팀원 - 입금 확인 테이블 툴바
 * - 검색바 (Global Filter)
 * - 열 가시성 토글
 * - 엑셀 다운로드 버튼
 */
export function RetreatPaymentConfirmationTableToolbar({
  table,
  globalFilter,
  setGlobalFilter,
  retreatSlug,
  schedules = [],
}: RetreatPaymentConfirmationTableToolbarProps) {
  const [isExporting, setIsExporting] = useState(false);
  const addToast = useToastStore((state) => state.add);
  const isMobile = useIsMobile();

  // ✅ Debounced search (useMemo로 안정적인 참조 유지)
  const debouncedSetGlobalFilter = useMemo(
    () => debounce((value: string) => setGlobalFilter(value), 300),
    [setGlobalFilter]
  );

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSetGlobalFilter.cancel();
    };
  }, [debouncedSetGlobalFilter]);

  // 엑셀 다운로드
  const handleExcelDownload = async () => {
    setIsExporting(true);
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
        `수양회_신청현황_${formatDate(new Date().toISOString())}.xlsx`
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
      addToast({
        title: "오류 발생",
        description: "엑셀 파일 다운로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-2">
      {/* 검색바 */}
      <div className="relative flex-1 md:max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={
            isMobile
              ? "이름, 학년으로 검색..."
              : "통합 검색 (이름, 학년)..."
          }
          defaultValue={globalFilter ?? ""}
          onChange={(e) => debouncedSetGlobalFilter(e.target.value)}
          className="pl-8 text-sm"
        />
      </div>

      {/* 모바일에서는 버튼 숨김 */}
      {!isMobile && (
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
                    // 스케줄 컬럼: schedule_${id} → "요일 앞글자 + 타입 앞글자" 형식
                    if (id.startsWith("schedule_")) {
                      const scheduleId = parseInt(id.replace("schedule_", ""));
                      const schedule = schedules.find((s) => s.id === scheduleId);
                      if (schedule) {
                        // KST 기준 요일 사용
                        const dayOfWeek = ["주", "월", "화", "수", "목", "금", "토"][getKSTDay(schedule.time)];
                        const typeShort = SCHEDULE_TYPE_SHORT_LABELS[schedule.type] || schedule.type;
                        return `${dayOfWeek}${typeShort}`;
                      }
                      return "스케줄";
                    }

                    const names: Record<string, string> = {
                      gender: "성별",
                      grade: "학년",
                      type: "타입",
                      amount: "금액",
                      status: "입금 현황",
                    };
                    return names[id] || id;
                  };

                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      onSelect={(event) => {
                        // 체크박스 클릭 시 드롭다운이 닫히지 않도록 방지
                        event.preventDefault();
                      }}
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
            disabled={isExporting}
          >
            {isExporting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            엑셀 다운로드
          </Button>
        </div>
      )}
    </div>
  );
}
