"use client";

import { useMemo, useEffect } from "react";
import { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import debounce from "lodash/debounce";
import { GbsLocationTableData } from "@/types/gbs-location";

interface GbsLocationAssignmentTableToolbarProps {
  table: Table<GbsLocationTableData>;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
}

/**
 * GBS 장소 배정 테이블 툴바
 *
 * Features:
 * - Lodash debounce 검색 (300ms)
 * - 열 가시성 토글
 */
export function GbsLocationAssignmentTableToolbar({
  table,
  globalFilter,
  setGlobalFilter,
}: GbsLocationAssignmentTableToolbarProps) {
  // Lodash debounce를 useMemo로 메모이제이션
  const debouncedSetGlobalFilter = useMemo(
    () =>
      debounce((value: string) => {
        setGlobalFilter(value);
      }, 300),
    [setGlobalFilter]
  );

  // useEffect cleanup으로 메모리 누수 방지
  useEffect(() => {
    return () => {
      debouncedSetGlobalFilter.cancel();
    };
  }, [debouncedSetGlobalFilter]);

  // 컬럼 이름 매핑
  const getColumnName = (id: string) => {
    const names: Record<string, string> = {
      number: "GBS 번호",
      memo: "메모",
      location: "장소",
    };
    return names[id] || id;
  };

  return (
    <div className="flex items-center justify-between space-x-2 mb-4">
      {/* 검색 (Lodash Debounce) */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="GBS번호, 메모, 장소 검색..."
          defaultValue={globalFilter ?? ""}
          onChange={(e) => debouncedSetGlobalFilter(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="flex items-center space-x-2">
        {/* 열 가시성 토글 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              열 설정
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[150px]">
            {table
              .getAllLeafColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {getColumnName(column.id)}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
