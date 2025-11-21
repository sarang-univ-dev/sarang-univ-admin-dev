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
import { useToastStore } from "@/store/toast-store";
import { useIsMobile } from "@/hooks/use-media-query";

interface UnivGroupBusRegistrationTableToolbarProps {
  table: Table<any>;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  retreatSlug: string;
}

/**
 * 부서 셔틀버스 등록 테이블 툴바
 * - Lodash debounce 검색 (300ms)
 * - 엑셀 다운로드
 */
export function UnivGroupBusRegistrationTableToolbar({
  table,
  globalFilter,
  setGlobalFilter,
  retreatSlug,
}: UnivGroupBusRegistrationTableToolbarProps) {
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

  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-2 mb-4">
      {/* 검색 (Lodash Debounce) - 반응형 */}
      <div className="relative flex-1 md:max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={
            isMobile
              ? "통합 검색 (이름, 부서, 학년 등)..."
              : "통합 검색 (이름, 부서, 학년, 전화번호 등)..."
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
                    const names: Record<string, string> = {
                      gender: "성별",
                      grade: "학년",
                      name: "이름",
                      phone: "전화번호",
                      "selected-buses": "신청 버스",
                      status: "입금 현황",
                      detail: "상세보기",
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
