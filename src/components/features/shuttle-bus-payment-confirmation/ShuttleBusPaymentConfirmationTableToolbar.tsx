"use client";

import { useMemo, useEffect, useState } from "react";
import { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Search } from "lucide-react";
import debounce from "lodash/debounce";
import { useToastStore } from "@/store/toast-store";

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
    // TODO: 엑셀 다운로드 API 구현 필요
    addToast({
      title: "알림",
      description: "엑셀 다운로드 기능은 구현이 필요합니다.",
      variant: "default",
    });
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
