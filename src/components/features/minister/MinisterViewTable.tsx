"use client";

import { useMemo, useState, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  createColumnHelper,
} from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { VirtualizedTable } from "@/components/common/table";
import { ColumnHeader } from "@/components/common/table/ColumnHeader";
import { gradeDescSortingFn } from "@/utils/sorting";
import {
  TRetreatRegistrationSchedule,
  UserRetreatRegistrationPaymentStatus,
  UserRetreatRegistrationType,
  Gender,
} from "@/types";
import { GenderBadge, StatusBadge, TypeBadge } from "@/components/Badge";
import { MinisterViewTableToolbar } from "./MinisterViewTableToolbar";
import { MinisterViewDetailContent } from "./MinisterViewDetailContent";
import { generateScheduleColumns } from "@/utils/retreat-utils";
import { DetailSidebar } from "@/components/common/detail-sidebar";
import { PAYMENT_STATUS_LABELS } from "@/lib/constant/labels";

// 신청 데이터 타입
interface RegistrationData {
  id: number;
  name: string;
  univGroupNumber: number;
  gradeNumber: number;
  gender: Gender;
  phoneNumber?: string;
  currentLeaderName?: string;
  userType?: UserRetreatRegistrationType | null;
  price?: number;
  paymentStatus: UserRetreatRegistrationPaymentStatus;
  createdAt?: string;
  paymentConfirmUserName?: string;
  paymentConfirmedAt?: string;
  userRetreatRegistrationScheduleIds?: number[];
}

interface MinisterViewTableProps {
  initialData: RegistrationData[];
  schedules: TRetreatRegistrationSchedule[];
  showAmount?: boolean; // 금액 표시 여부 (기본값: false)
  showUnivGroup?: boolean; // 부서 표시 여부 (기본값: false, 행정 총괄 교역자용)
  title?: string; // 테이블 제목
  description?: string; // 테이블 설명
}

// TanStack Table용 행 데이터 타입
type TableRow = {
  id: string;
  gender: Gender;
  grade: string;
  name: string;
  phoneNumber: string;
  currentLeaderName: string;
  schedule: Record<string, boolean>;
  type: UserRetreatRegistrationType | null;
  amount: number;
  status: UserRetreatRegistrationPaymentStatus;
  univGroupNumber: number;
  original: RegistrationData;
};

const columnHelper = createColumnHelper<TableRow>();

/**
 * 교역자용 조회 전용 테이블 (TanStack Table)
 *
 * Features:
 * - 동적 스케줄 컬럼
 * - 정렬, 필터링
 * - 통합 검색 (Lodash debounce)
 * - 조회 전용 (액션 버튼 없음)
 * - 열 숨김 기능
 * - 상세 정보 사이드바
 */
export function MinisterViewTable({
  initialData,
  schedules,
  showAmount = false,
  showUnivGroup = false,
  title = "신청 현황 조회",
  description,
}: MinisterViewTableProps) {
  // TanStack Table State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  // Detail Sidebar State
  const [selectedRow, setSelectedRow] = useState<RegistrationData | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 스케줄 컬럼 메타데이터 생성
  const scheduleColumnsMeta = useMemo(
    () => generateScheduleColumns(schedules),
    [schedules]
  );

  // 데이터 변환 (useMemo로 메모이제이션)
  const data = useMemo<TableRow[]>(() => {
    return initialData.map((reg) => {
      const scheduleData: Record<string, boolean> = {};
      schedules.forEach((schedule) => {
        scheduleData[`schedule_${schedule.id}`] =
          reg.userRetreatRegistrationScheduleIds?.includes(schedule.id) ||
          false;
      });

      return {
        id: reg.id.toString(),
        gender: reg.gender,
        grade: `${reg.gradeNumber}학년`,
        name: reg.name,
        phoneNumber: reg.phoneNumber || "",
        currentLeaderName: reg.currentLeaderName || "",
        schedule: scheduleData,
        type: reg.userType || null,
        amount: reg.price || 0,
        status: reg.paymentStatus,
        univGroupNumber: reg.univGroupNumber,
        original: reg,
      };
    });
  }, [initialData, schedules]);

  // 행 클릭 핸들러 (useCallback으로 안정적인 참조 유지)
  const handleRowClick = useCallback((row: RegistrationData) => {
    setSelectedRow(row);
    setIsSidebarOpen(true);
  }, []);

  // 컬럼 정의
  const columns = useMemo(() => {
    const staticColumns = [
      // 부서 컬럼 (showUnivGroup이 true일 때만 표시)
      ...(showUnivGroup
        ? [
            columnHelper.accessor("univGroupNumber", {
              id: "univGroupNumber",
              header: ({ column, table }) => (
                <ColumnHeader
                  column={column}
                  table={table}
                  title="부서"
                  enableSorting
                  enableFiltering
                  formatFilterValue={(value) => `${value}부`}
                />
              ),
              cell: (info) => (
                <div className="text-center px-2 py-1 whitespace-nowrap shrink-0">
                  {info.getValue()}부
                </div>
              ),
              filterFn: "arrIncludesSome",
            }),
          ]
        : []),
      columnHelper.accessor("gender", {
        id: "gender",
        header: ({ column, table }) => (
          <ColumnHeader
            column={column}
            table={table}
            title="성별"
            enableSorting
            enableFiltering
            formatFilterValue={(value) => (value === "MALE" ? "남자" : "여자")}
          />
        ),
        cell: (info) => (
          <div className="flex justify-center px-2 py-1 whitespace-nowrap shrink-0">
            <GenderBadge gender={info.getValue()} />
          </div>
        ),
        filterFn: "arrIncludesSome",
      }),
      columnHelper.accessor("grade", {
        id: "grade",
        header: ({ column, table }) => (
          <ColumnHeader
            column={column}
            table={table}
            title="학년"
            enableSorting
            enableFiltering
          />
        ),
        cell: (info) => (
          <div className="text-center px-2 py-1 whitespace-nowrap shrink-0">
            {info.getValue()}
          </div>
        ),
        filterFn: "arrIncludesSome",
        sortingFn: gradeDescSortingFn,
      }),
      columnHelper.accessor("name", {
        id: "name",
        header: ({ column, table }) => (
          <ColumnHeader
            column={column}
            table={table}
            title="이름"
            enableSorting
            enableFiltering
          />
        ),
        cell: (info) => (
          <div className="font-medium text-center px-2 py-1 whitespace-nowrap shrink-0">
            {info.getValue()}
          </div>
        ),
        enableHiding: false,
        filterFn: "arrIncludesSome",
      }),
      columnHelper.accessor("phoneNumber", {
        id: "phoneNumber",
        header: "전화번호",
        cell: (info) => {
          const phoneNumber = info.getValue();
          return (
            <div className="text-center px-2 py-1 whitespace-nowrap shrink-0">
              {phoneNumber ? (
                <a
                  href={`tel:${phoneNumber}`}
                  className="text-blue-600 hover:underline"
                >
                  {phoneNumber}
                </a>
              ) : (
                "-"
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("currentLeaderName", {
        id: "currentLeaderName",
        header: "인도자",
        cell: (info) => (
          <div className="text-center px-2 py-1 whitespace-nowrap shrink-0">
            {info.getValue() || "-"}
          </div>
        ),
      }),
    ];

    // 동적 스케줄 컬럼
    const scheduleColumns = scheduleColumnsMeta.map((col) =>
      columnHelper.accessor((row) => row.schedule[col.key], {
        id: col.key,
        header: col.label,
        cell: (info) => {
          const isChecked = !!info.getValue();
          return (
            <div className="flex justify-center px-2 py-1 whitespace-nowrap shrink-0">
              <Checkbox
                checked={isChecked}
                disabled
                className={isChecked ? col.bgColorClass : ""}
              />
            </div>
          );
        },
      })
    );

    const endColumns = [
      columnHelper.accessor("type", {
        id: "type",
        header: "타입",
        size: 85,
        cell: (info) => {
          const type = info.getValue();
          return (
            <div className="flex justify-center px-2 py-1 whitespace-nowrap shrink-0">
              {type ? <TypeBadge type={type} /> : <span>-</span>}
            </div>
          );
        },
      }),
      // 금액 컬럼 (showAmount가 true일 때만 표시)
      ...(showAmount
        ? [
            columnHelper.accessor("amount", {
              id: "amount",
              header: "금액",
              cell: (info) => (
                <div className="font-medium text-center px-2 py-1 whitespace-nowrap shrink-0">
                  {info.getValue().toLocaleString()}원
                </div>
              ),
            }),
          ]
        : []),
      // 입금 현황 (조회만)
      columnHelper.accessor("status", {
        id: "status",
        header: ({ column, table }) => (
          <ColumnHeader
            column={column}
            table={table}
            title="입금 현황"
            enableSorting
            enableFiltering
            formatFilterValue={(value) =>
              PAYMENT_STATUS_LABELS[
                value as keyof typeof PAYMENT_STATUS_LABELS
              ] || value
            }
          />
        ),
        cell: (props) => (
          <div className="flex justify-center px-2 py-1 whitespace-nowrap shrink-0">
            <StatusBadge status={props.getValue()} />
          </div>
        ),
        filterFn: "arrIncludesSome",
      }),
      // 상세 정보 버튼
      columnHelper.display({
        id: "detailInfo",
        header: () => <div className="text-center whitespace-nowrap">상세</div>,
        cell: (props) => (
          <div className="flex justify-center px-2 py-1 whitespace-nowrap shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleRowClick(props.row.original.original);
              }}
              className="h-8 px-3 whitespace-nowrap"
            >
              <Info className="h-4 w-4 mr-1" />
              보기
            </Button>
          </div>
        ),
      }),
    ];

    return [...staticColumns, ...scheduleColumns, ...endColumns];
  }, [scheduleColumnsMeta, handleRowClick, showAmount, showUnivGroup]);

  // TanStack Table 초기화
  const table = useReactTable<TableRow>({
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
        row.original.name,
        row.original.grade,
        row.original.phoneNumber,
        row.original.currentLeaderName,
      ];

      return searchableFields.some((field) =>
        field?.toLowerCase().includes(filterValue.toLowerCase())
      );
    },
  });

  return (
    <>
      <div className="space-y-4">
        {/* 헤더 */}
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {description ||
              `전체 신청자 목록 (${table.getFilteredRowModel().rows.length}명)`}
          </p>
        </div>

        {/* 툴바 */}
        <MinisterViewTableToolbar
          table={table}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          schedules={schedules}
        />

        {/* 가상화 테이블 */}
        <VirtualizedTable
          table={table}
          estimateSize={50}
          overscan={10}
          className="max-h-[70vh]"
          emptyMessage={
            globalFilter
              ? "검색 결과가 없습니다."
              : "표시할 데이터가 없습니다."
          }
        />
      </div>

      {/* Detail Sidebar */}
      <DetailSidebar
        open={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
        data={selectedRow}
        title="신청 상세 정보"
      >
        {(data) => (
          <MinisterViewDetailContent
            data={data}
            schedules={schedules}
            showAmount={showAmount}
          />
        )}
      </DetailSidebar>
    </>
  );
}
