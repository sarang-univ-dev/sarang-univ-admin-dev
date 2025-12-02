"use client";

import { useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MobileStatusBadge } from "@/components/common/retreat/mobile-badges";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { UnivGroupAdminStaffData } from "@/types/univ-group-admin-staff";
import { usePagination } from "@/hooks/use-pagination";

interface UnivGroupRetreatRegistrationMobileTableProps {
  data: UnivGroupAdminStaffData[];
  onRowClick: (row: UnivGroupAdminStaffData) => void;
}

const PAGE_SIZE = 10;

/**
 * 모바일 컴팩트 테이블 (4개 컬럼)
 *
 * @description
 * - 학년, 이름, 상태, 상세 버튼만 표시
 * - 터치 최적화 (최소 44px 높이)
 * - 가로 스크롤 없음
 * - 부서 정보는 DetailSidebar에서 확인 가능
 * - 페이지네이션 지원 (10개씩)
 */
export function UnivGroupRetreatRegistrationMobileTable({
  data,
  onRowClick,
}: UnivGroupRetreatRegistrationMobileTableProps) {
  // ✅ 공통 페이지네이션 훅 사용 (useCallback 내장)
  const {
    paginatedData,
    currentPage,
    totalPages,
    goToNextPage,
    goToPrevPage,
    hasNextPage,
    hasPrevPage,
  } = usePagination(data, PAGE_SIZE);

  // ✅ useCallback으로 이벤트 핸들러 메모이제이션
  const handleRowClick = useCallback(
    (row: UnivGroupAdminStaffData) => {
      onRowClick(row);
    },
    [onRowClick]
  );

  const handleRowKeyDown = useCallback(
    (e: React.KeyboardEvent, row: UnivGroupAdminStaffData) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onRowClick(row);
      }
    },
    [onRowClick]
  );

  return (
    <div className="space-y-3">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[60px] font-semibold text-center text-xs whitespace-nowrap flex-shrink-0">
                학년
              </TableHead>
              <TableHead className="w-[40%] font-semibold text-xs">
                이름
              </TableHead>
              <TableHead className="w-[35%] text-center font-semibold text-xs">
                상태
              </TableHead>
              <TableHead className="w-[15%] text-center font-semibold text-xs">
                <span className="sr-only">상세</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => handleRowClick(row)}
                onKeyDown={(e) => handleRowKeyDown(e, row)}
                tabIndex={0}
                role="button"
                aria-label={`${row.name} 상세 정보 보기`}
                className="cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                {/* 학년 */}
                <TableCell className="py-3 text-center text-sm whitespace-nowrap">
                  {row.grade}
                </TableCell>

                {/* 이름 (1줄) */}
                <TableCell className="py-3">
                  <span className="font-medium text-sm">{row.name}</span>
                </TableCell>

                {/* 상태 Badge */}
                <TableCell className="py-3">
                  <div className="flex justify-center">
                    <MobileStatusBadge status={row.status} />
                  </div>
                </TableCell>

                {/* 상세 버튼 (ChevronRight 아이콘) */}
                <TableCell className="py-3">
                  <div className="flex justify-center">
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center py-10 text-gray-500"
              >
                표시할 데이터가 없습니다
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>

    {/* 페이지네이션 */}
    {data.length > PAGE_SIZE && (
      <div className="flex items-center justify-between px-2">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPrevPage}
          disabled={!hasPrevPage}
          className="h-9"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          이전
        </Button>

        <span className="text-sm text-gray-600">
          {currentPage + 1} / {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={goToNextPage}
          disabled={!hasNextPage}
          className="h-9"
        >
          다음
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    )}
  </div>
  );
}
