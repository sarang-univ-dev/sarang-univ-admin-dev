"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ScheduleChangeRequestTableToolbarProps {
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
}

/**
 * 일정 변경 요청 테이블 툴바
 *
 * Features:
 * - 통합 검색
 */
export function ScheduleChangeRequestTableToolbar({
  globalFilter,
  setGlobalFilter,
}: ScheduleChangeRequestTableToolbarProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="검색 (이름, 부서, 학년, 타입, 처리자, 메모 등)..."
          className="pl-8 pr-4 py-2 border-gray-200 focus:border-primary focus:ring-primary rounded-md"
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>
    </div>
  );
}
