"use client";

import { useMemo, useEffect, useState } from "react";
import { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Search } from "lucide-react";
import debounce from "lodash/debounce";
import { useToastStore } from "@/store/toast-store";
import { ShuttleBusAPI } from "@/lib/api/shuttle-bus-api";

interface ShuttleBusPaymentConfirmationTableToolbarProps {
  table: Table<any>;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  retreatSlug: string;
}

/**
 * 셔틀버스 재정 팀원 - 입금 확인 테이블 툴바
 * - Lodash debounce 검색 (300ms)
 * - 엑셀 다운로드
 */
export function ShuttleBusPaymentConfirmationTableToolbar({
  table,
  globalFilter,
  setGlobalFilter,
  retreatSlug,
}: ShuttleBusPaymentConfirmationTableToolbarProps) {
  const addToast = useToastStore((state) => state.add);
  const [isDownloading, setIsDownloading] = useState(false);

  // ✅ Lodash debounce를 useMemo로 메모이제이션
  const debouncedSetGlobalFilter = useMemo(
    () =>
      debounce((value: string) => {
        setGlobalFilter(value);
      }, 300),
    [setGlobalFilter]
  );

  // ✅ useEffect cleanup으로 메모리 누수 방지
  useEffect(() => {
    return () => {
      debouncedSetGlobalFilter.cancel();
    };
  }, [debouncedSetGlobalFilter]);

  const handleExcelDownload = async () => {
    // TODO: 추후 다른 페이지로 이동 필요 - 현재는 임시로 입금 조회 페이지에 배치
    setIsDownloading(true);
    try {
      const blob =
        await ShuttleBusAPI.downloadAllUnivGroupPassengersExcel(retreatSlug);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `셔틀버스_부서별_탑승자_${new Date().toISOString().split("T")[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      addToast({
        title: "성공",
        description: "엑셀 파일이 다운로드되었습니다.",
        variant: "success"
      });
    } catch (error) {
      addToast({
        title: "오류",
        description: "엑셀 다운로드 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 mb-4">
      {/* 검색 (Lodash Debounce) */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="통합 검색 (이름, 부서, 학년 등)..."
          defaultValue={globalFilter ?? ""}
          onChange={(e) => debouncedSetGlobalFilter(e.target.value)}
          className="pl-8 text-sm"
        />
      </div>

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
  );
}
