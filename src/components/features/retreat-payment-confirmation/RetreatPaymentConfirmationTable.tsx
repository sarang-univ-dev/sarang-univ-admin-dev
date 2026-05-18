"use client";

import {
  ColumnFiltersState,
  createColumnHelper,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { HelpCircle, Info } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { GenderBadge, StatusBadge, TypeBadge } from "@/components/Badge";
import { DetailSidebar } from "@/components/common/detail-sidebar";
import { PageHelpPanel } from "@/components/common/help";
import { VirtualizedTable } from "@/components/common/table";
import { ColumnHeader } from "@/components/common/table/ColumnHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useRetreatPaymentConfirmation } from "@/hooks/retreat-payment-confirmation/use-retreat-payment-confirmation";
import { IUserRetreatRegistration } from "@/hooks/use-user-retreat-registration";
import { PAYMENT_STATUS_LABELS } from "@/lib/constant/labels";
import { retreatPaymentConfirmationHelp } from "@/lib/help";
import { normalizeRetreatPaymentStatus } from "@/lib/utils/retreat-payment-status";
import {
  Gender,
  TRetreatRegistrationSchedule,
  UserRetreatRegistrationPaymentStatus,
  UserRetreatRegistrationType,
} from "@/types";
import { generateScheduleColumns } from "@/utils/retreat-utils";
import { gradeDescSortingFn } from "@/utils/sorting";

import { RetreatPaymentConfirmationDetailContent } from "./RetreatPaymentConfirmationDetailContent";
import { RetreatPaymentConfirmationTableActions } from "./RetreatPaymentConfirmationTableActions";
import { RetreatPaymentConfirmationTableToolbar } from "./RetreatPaymentConfirmationTableToolbar";

interface RetreatPaymentConfirmationTableProps {
  initialData: IUserRetreatRegistration[];
  schedules: TRetreatRegistrationSchedule[];
  retreatSlug: string;
}

// TanStack Table용 행 데이터 타입
type TableRow = {
  id: string;
  gender: Gender;
  grade: string;
  name: string;
  schedule: Record<string, boolean>;
  type: UserRetreatRegistrationType | null;
  amount: number;
  status: UserRetreatRegistrationPaymentStatus;
  original: IUserRetreatRegistration;
};

const columnHelper = createColumnHelper<TableRow>();

/**
 * 부서 재정 팀원 - 입금 확인 테이블 (TanStack Table)
 *
 * Features:
 * - 동적 스케줄 컬럼
 * - 정렬, 필터링
 * - 통합 검색 (Lodash debounce)
 * - 입금 확인, 입금 요청, 환불 처리 액션
 * - SWR 실시간 동기화
 * - Card wrap 제거
 * - 신청 시각, 처리자명, 처리 시각은 Detail Sidebar에 표시
 * - 열 숨김 기능
 */
export function RetreatPaymentConfirmationTable({
  initialData,
  schedules,
  retreatSlug,
}: RetreatPaymentConfirmationTableProps) {
  // ✅ SWR로 실시간 데이터 동기화 + Mutation 함수들
  const {
    data: registrations,
    confirmPayment,
    sendPaymentRequest,
    refundComplete,
    isMutating,
  } = useRetreatPaymentConfirmation(retreatSlug, {
    fallbackData: initialData,
    revalidateOnFocus: true,
  });

  // ✅ TanStack Table State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);

  // ✅ Detail Sidebar State
  const [selectedRow, setSelectedRow] =
    useState<IUserRetreatRegistration | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ✅ 스케줄 컬럼 메타데이터 생성
  const scheduleColumnsMeta = useMemo(
    () => generateScheduleColumns(schedules),
    [schedules]
  );

  // ✅ 데이터 변환 (useMemo로 메모이제이션)
  const data = useMemo<TableRow[]>(() => {
    return registrations.map(reg => {
      const scheduleData: Record<string, boolean> = {};
      schedules.forEach(schedule => {
        scheduleData[`schedule_${schedule.id}`] =
          reg.userRetreatRegistrationScheduleIds?.includes(schedule.id) ||
          false;
      });

      return {
        id: reg.id.toString(),
        gender: reg.gender,
        grade: `${reg.gradeNumber}학년`,
        name: reg.name,
        schedule: scheduleData,
        type: reg.userType,
        amount: reg.price,
        status: normalizeRetreatPaymentStatus(reg.paymentStatus),
        original: reg,
      };
    });
  }, [registrations, schedules]);

  // ✅ 행 클릭 핸들러 (useCallback으로 안정적인 참조 유지)
  const handleRowClick = useCallback((row: IUserRetreatRegistration) => {
    setSelectedRow(row);
    setIsSidebarOpen(true);
  }, []);

  // ✅ 컬럼 정의
  const columns = useMemo(() => {
    const staticColumns = [
      columnHelper.accessor("gender", {
        id: "gender",
        header: ({ column, table }) => (
          <ColumnHeader
            column={column}
            table={table}
            title="성별"
            enableSorting
            enableFiltering
            formatFilterValue={value => (value === "MALE" ? "남자" : "여자")}
          />
        ),
        cell: info => (
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
        cell: info => (
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
        cell: info => (
          <div className="font-medium text-center px-2 py-1 whitespace-nowrap shrink-0">
            {info.getValue()}
          </div>
        ),
        enableHiding: false,
        filterFn: "arrIncludesSome",
      }),
    ];

    // 동적 스케줄 컬럼
    const scheduleColumns = scheduleColumnsMeta.map(col =>
      columnHelper.accessor(row => row.schedule[col.key], {
        id: col.key,
        header: col.label,
        cell: info => {
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
        header: ({ column, table }) => (
          <ColumnHeader column={column} table={table} title="타입" />
        ),
        size: 85,
        cell: info => {
          const type = info.getValue();
          return (
            <div className="flex justify-center px-2 py-1 whitespace-nowrap shrink-0">
              {type ? <TypeBadge type={type} /> : <span>-</span>}
            </div>
          );
        },
      }),
      columnHelper.accessor("amount", {
        id: "amount",
        header: ({ column, table }) => (
          <ColumnHeader column={column} table={table} title="금액" />
        ),
        cell: info => (
          <div className="font-medium text-center px-2 py-1 whitespace-nowrap shrink-0">
            {info.getValue().toLocaleString()}원
          </div>
        ),
      }),
      // ✅ 입금 현황 + 액션 (세로 배치)
      columnHelper.accessor("status", {
        id: "status",
        header: ({ column, table }) => (
          <ColumnHeader
            column={column}
            table={table}
            title="입금 현황"
            enableSorting
            enableFiltering
            formatFilterValue={value =>
              PAYMENT_STATUS_LABELS[
                value as keyof typeof PAYMENT_STATUS_LABELS
              ] || value
            }
          />
        ),
        cell: props => {
          const status = props.getValue();

          return (
            <div className="text-center px-2 py-1 whitespace-nowrap shrink-0">
              <div className="flex flex-col items-center gap-1">
                <StatusBadge status={status} />
                <RetreatPaymentConfirmationTableActions
                  registration={props.row.original.original}
                  confirmPayment={confirmPayment}
                  sendPaymentRequest={sendPaymentRequest}
                  refundComplete={refundComplete}
                  isMutating={isMutating}
                />
              </div>
            </div>
          );
        },
        filterFn: "arrIncludesSome",
      }),
      // ✅ 상세 정보 버튼
      columnHelper.display({
        id: "detailInfo",
        header: () => <div className="text-center whitespace-nowrap">상세</div>,
        cell: props => (
          <div className="flex justify-center px-2 py-1 whitespace-nowrap shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={e => {
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
  }, [
    scheduleColumnsMeta,
    confirmPayment,
    sendPaymentRequest,
    refundComplete,
    isMutating,
    handleRowClick,
  ]);

  // ✅ TanStack Table 초기화
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
    // ✅ Multi-sort 및 필터 활성화
    enableMultiSort: true,
    enableSortingRemoval: true,
    enableColumnFilters: true,
    enableFilters: true,
    // ✅ 모든 클릭을 multi-sort event로 처리 (Shift 키 불필요)
    isMultiSortEvent: () => true,
    // 전역 필터 함수 (통합 검색)
    globalFilterFn: (row, columnId, filterValue) => {
      const searchableFields = [row.original.name, row.original.grade];

      return searchableFields.some(field =>
        field?.toLowerCase().includes(filterValue.toLowerCase())
      );
    },
  });

  return (
    <>
      <div className="space-y-4">
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              신청 현황 및 입금 조회
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              전체 신청자 목록 ({table.getFilteredRowModel().rows.length}명)
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setHelpOpen(true)}
          >
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">입금 확인 도움말</span>
          </Button>
        </div>

        <PageHelpPanel
          content={retreatPaymentConfirmationHelp}
          open={helpOpen}
          onOpenChange={setHelpOpen}
        />

        {/* 툴바 */}
        <RetreatPaymentConfirmationTableToolbar
          table={table}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          retreatSlug={retreatSlug}
          schedules={schedules}
        />

        {/* ✅ 가상화 테이블 */}
        <VirtualizedTable
          table={table}
          estimateSize={50}
          overscan={10}
          className="max-h-[70vh]"
          emptyMessage={
            globalFilter ? "검색 결과가 없습니다." : "표시할 데이터가 없습니다."
          }
        />
      </div>

      {/* ✅ Detail Sidebar */}
      <DetailSidebar
        open={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
        data={selectedRow}
        title="신청 상세 정보"
      >
        {data => (
          <RetreatPaymentConfirmationDetailContent
            data={data}
            schedules={schedules}
          />
        )}
      </DetailSidebar>
    </>
  );
}
