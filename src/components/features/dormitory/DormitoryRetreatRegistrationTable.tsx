"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { VirtualizedTable } from "@/components/common/table";
import {
  useDormitoryRetreatRegistrationColumns,
  DormitoryRetreatRegistrationTableData,
} from "@/hooks/dormitory/use-retreat-registration-columns";
import {
  useDormitoryRetreatRegistration,
  IDormitoryRetreatRegistration,
} from "@/hooks/dormitory/use-retreat-registration";
import { TRetreatRegistrationSchedule } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface DormitoryRetreatRegistrationTableProps {
  schedules: TRetreatRegistrationSchedule[];
  retreatSlug: string;
}

/**
 * 데이터 변환 함수: API 응답 -> 테이블 데이터
 */
function transformRegistrationsForTable(
  registrations: IDormitoryRetreatRegistration[],
  schedules: TRetreatRegistrationSchedule[]
): DormitoryRetreatRegistrationTableData[] {
  return registrations.map((registration) => {
    // 스케줄 정보 변환
    const scheduleData: Record<string, boolean> = {};
    schedules.forEach((schedule) => {
      scheduleData[`schedule_${schedule.id}`] =
        registration.userRetreatRegistrationScheduleIds?.includes(
          schedule.id
        ) || false;
    });

    return {
      id: String(registration.id),
      gbsNumber: registration.gbsNumber ?? null,
      department: `${registration.univGroupNumber}부`,
      gender: registration.gender,
      grade: `${registration.gradeNumber}학년`,
      name: registration.name,
      schedules: scheduleData,
      dormitoryName: registration.dormitoryLocation || "",
      scheduleChangeRequestMemo: registration.dormitoryTeamMemberMemo || null,
      isLeader: registration.isLeader,
    };
  });
}

/**
 * 숙소팀 수양회 신청 테이블 (TanStack Table + Virtualization)
 *
 * Features:
 * - 동적 스케줄 컬럼
 * - 열 가시성 토글
 * - 다중 정렬
 * - 통합 검색
 * - 일정변동 요청 메모 관리 (MemoEditor)
 * - 가상화를 통한 대용량 데이터 처리
 */
export function DormitoryRetreatRegistrationTable({
  schedules,
  retreatSlug,
}: DormitoryRetreatRegistrationTableProps) {
  // SWR로 데이터 페칭
  const { registrations, isLoading, error, mutate } =
    useDormitoryRetreatRegistration(retreatSlug);

  // TanStack Table State
  const [sorting, setSorting] = useState<SortingState>([
    { id: "gbsNumber", desc: false },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  // 컬럼 훅으로 컬럼 정의 가져오기 (mutate 전달하여 캐시 갱신 가능하게)
  const columns = useDormitoryRetreatRegistrationColumns(schedules, retreatSlug, mutate);

  // useMemo로 data 메모이제이션
  const data = useMemo(
    () => transformRegistrationsForTable(registrations, schedules),
    [registrations, schedules]
  );

  // TanStack Table 초기화
  const table = useReactTable<DormitoryRetreatRegistrationTableData>({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    columnResizeMode: "onChange",
    enableColumnResizing: false,
    // Multi-sort 및 필터 활성화
    enableMultiSort: true,
    enableSortingRemoval: true,
    enableColumnFilters: true,
    enableFilters: true,
    // 모든 클릭을 multi-sort event로 처리 (Shift 키 불필요)
    isMultiSortEvent: () => true,
    // 전역 필터 함수 (통합 검색)
    globalFilterFn: (row, columnId, filterValue) => {
      const searchableFields = [
        row.original.gbsNumber?.toString(),
        row.original.name,
        row.original.department,
        row.original.grade,
        row.original.dormitoryName,
        row.original.scheduleChangeRequestMemo,
      ];

      return searchableFields.some((field) =>
        field?.toLowerCase().includes(filterValue.toLowerCase())
      );
    },
  });

  // 필터링된 데이터 수
  const filteredRowCount = table.getRowModel().rows.length;

  // 리더 행에 하이라이트 스타일 적용
  const getRowClassName = (row: DormitoryRetreatRegistrationTableData) => {
    if (row.isLeader) {
      return "bg-cyan-50 hover:bg-cyan-100";
    }
    return "";
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-10">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">
              데이터를 불러오는 중...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-10">
          <div className="text-center text-red-500">
            <p className="font-medium">에러가 발생했습니다</p>
            <p className="text-sm mt-1">
              {error.message || "데이터를 불러올 수 없습니다."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          숙소팀 수양회 신청 관리
        </CardTitle>
        <CardDescription>
          숙소팀이 수양회 신청자 목록을 조회하고 일정변동 요청 메모를
          작성할 수 있습니다. ({filteredRowCount}명)
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pt-4">
        <div className="space-y-4">
          {/* 통합 검색 */}
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="GBS번호, 부서, 학년, 이름, 숙소, 메모로 검색..."
              className="pl-8 pr-4 py-2"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>

          {/* 가상화 테이블 */}
          <VirtualizedTable
            table={table}
            estimateSize={50}
            overscan={10}
            className="max-h-[70vh]"
            getRowClassName={getRowClassName}
            emptyMessage={
              globalFilter
                ? "검색 결과가 없습니다."
                : "표시할 데이터가 없습니다."
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
