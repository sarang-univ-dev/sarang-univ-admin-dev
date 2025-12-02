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
import { useIsMobile } from "@/hooks/use-media-query";
import { TRetreatRegistrationSchedule } from "@/types";
import { SCHEDULE_TYPE_SHORT_LABELS } from "@/lib/constant/labels";

interface UnivGroupRetreatRegistrationTableToolbarProps {
  table: Table<any>;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  retreatSlug: string;
  schedules: TRetreatRegistrationSchedule[];
}

/**
 * 테이블 툴바 컴포넌트
 * - Lodash debounce 검색 (300ms)
 * - 열 가시성 토글
 * - 엑셀 다운로드
 */
export function UnivGroupRetreatRegistrationTableToolbar({
  table,
  globalFilter,
  setGlobalFilter,
  retreatSlug,
  schedules,
}: UnivGroupRetreatRegistrationTableToolbarProps) {
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

  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-2 mb-4">
      {/* 검색 (Lodash Debounce) - 반응형 */}
      <div className="relative flex-1 md:max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={
            isMobile
              ? "통합 검색 (이름, 전화번호...)..."
              : "통합 검색 (이름, 전화번호, 리더명, GBS, 숙소 등)..."
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
                열 숨기기
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
                        const date = new Date(schedule.time);
                        const dayOfWeek = ["주", "월", "화", "수", "목", "금", "토"][date.getDay()];
                        const typeShort = SCHEDULE_TYPE_SHORT_LABELS[schedule.type] || schedule.type;
                        return `${dayOfWeek}${typeShort}`;
                      }
                      return "스케줄";
                    }

                    const names: Record<string, string> = {
                      gender: "성별",
                      grade: "학년",
                      name: "이름",
                      phone: "전화번호",
                      currentLeaderName: "부서 리더명",
                      createdAt: "신청시각",
                      attendance: "참석 현황",
                      status: "입금 현황",
                      confirmedBy: "처리자명",
                      paymentConfirmedAt: "처리시각",
                      gbs: "GBS",
                      accommodation: "숙소",
                      shuttleBus: "셔틀버스 신청 여부",
                      scheduleMemo: "일정 변동 메모",
                      adminMemo: "행정간사 메모",
                      detailInfo: "상세보기",
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
      )}
    </div>
  );
}
