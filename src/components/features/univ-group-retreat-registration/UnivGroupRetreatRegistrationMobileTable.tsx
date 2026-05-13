"use client";

import { useCallback } from "react";
import { Table as TanStackTable } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/retreat/badges";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { UnivGroupAdminStaffData } from "@/types/univ-group-admin-staff";
import { usePagination } from "@/hooks/use-pagination";
import { MobileColumnHeader } from "@/components/common/table/MobileColumnHeader";
import { MobileAllFiltersDrawer } from "@/components/common/table/MobileAllFiltersDrawer";
import { PAYMENT_STATUS_LABELS } from "@/lib/constant/labels";
import { gradeFilterSort } from "@/utils/sorting";

interface UnivGroupRetreatRegistrationMobileTableProps {
  data: UnivGroupAdminStaffData[];
  table: TanStackTable<UnivGroupAdminStaffData>;
  onRowClick: (row: UnivGroupAdminStaffData) => void;
}

/**
 * 모바일 전체 필터 컬럼 설정
 */
const FILTER_COLUMNS = [
  {
    id: "gender",
    title: "성별",
    formatValue: (value: string) => (value === "MALE" ? "남" : "여"),
  },
  {
    id: "grade",
    title: "학년",
    sortValues: gradeFilterSort,
  },
  {
    id: "name",
    title: "이름",
  },
  {
    id: "phone",
    title: "전화번호",
  },
  {
    id: "currentLeaderName",
    title: "부서 리더명",
  },
  {
    id: "attendance",
    title: "참석 현황",
    formatValue: (value: boolean) => (value ? "전참" : "부분참"),
  },
  {
    id: "status",
    title: "입금 현황",
    formatValue: (value: string) =>
      PAYMENT_STATUS_LABELS[value as keyof typeof PAYMENT_STATUS_LABELS] ||
      value,
  },
  {
    id: "shuttleBus",
    title: "셔틀버스",
    formatValue: (value: boolean) => (value ? "신청함" : "신청 안함"),
  },
  {
    id: "adminMemo",
    title: "행정간사 메모",
  },
];

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
 * - 필터/정렬 기능 지원 (헤더 아이콘 + Drawer)
 */
export function UnivGroupRetreatRegistrationMobileTable({
  data,
  table,
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

  // 컬럼 가져오기
  const gradeColumn = table.getColumn("grade");
  const nameColumn = table.getColumn("name");
  const statusColumn = table.getColumn("status");

  return (
    <div className="space-y-3">
      {/* 상단 필터 버튼 */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {data.length}명
        </span>
        <MobileAllFiltersDrawer table={table} filterColumns={FILTER_COLUMNS} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[60px] p-0 text-center">
                {gradeColumn ? (
                  <MobileColumnHeader
                    column={gradeColumn}
                    table={table}
                    title="학년"
                    enableSorting
                    enableFiltering
                    sortFilterValues={gradeFilterSort}
                  />
                ) : (
                  <span className="font-semibold text-xs">학년</span>
                )}
              </TableHead>
              <TableHead className="w-[40%] p-0">
                {nameColumn ? (
                  <MobileColumnHeader
                    column={nameColumn}
                    table={table}
                    title="이름"
                    enableSorting
                    enableFiltering
                  />
                ) : (
                  <span className="font-semibold text-xs">이름</span>
                )}
              </TableHead>
              <TableHead className="w-[35%] p-0 text-center">
                {statusColumn ? (
                  <MobileColumnHeader
                    column={statusColumn}
                    table={table}
                    title="상태"
                    enableSorting
                    enableFiltering
                    formatFilterValue={(value) =>
                      PAYMENT_STATUS_LABELS[
                        value as keyof typeof PAYMENT_STATUS_LABELS
                      ] || value
                    }
                  />
                ) : (
                  <span className="font-semibold text-xs">상태</span>
                )}
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
                    <StatusBadge status={row.status} />
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
