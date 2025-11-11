"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download } from "lucide-react";
import { debounce } from "lodash";
import { webAxios } from "@/lib/api/axios";
import { useToastStore } from "@/store/toast-store";
import { formatDate } from "@/utils/formatDate";
import { Table } from "@tanstack/react-table";

interface RetreatPaymentConfirmationTableToolbarProps {
  table: Table<any>;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  retreatSlug: string;
}

/**
 * 부서 재정 팀원 - 입금 확인 테이블 툴바
 * - 검색바 (Global Filter)
 * - 엑셀 다운로드 버튼
 */
export function RetreatPaymentConfirmationTableToolbar({
  table,
  globalFilter,
  setGlobalFilter,
  retreatSlug,
}: RetreatPaymentConfirmationTableToolbarProps) {
  const [isExporting, setIsExporting] = useState(false);
  const addToast = useToastStore((state) => state.add);

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
    <div className="flex items-center justify-between gap-4">
      {/* 검색바 */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="이름, 부서, 학년으로 검색..."
          className="pl-8 pr-4 py-2 border-gray-200 focus:border-gray-300 focus:ring-0"
          value={globalFilter ?? ""}
          onChange={(e) => debouncedSetGlobalFilter(e.target.value)}
        />
      </div>

      {/* 엑셀 다운로드 */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleExcelDownload}
        disabled={isExporting}
        className="flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors whitespace-nowrap"
      >
        {isExporting ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        <span>엑셀로 내보내기</span>
      </Button>
    </div>
  );
}
